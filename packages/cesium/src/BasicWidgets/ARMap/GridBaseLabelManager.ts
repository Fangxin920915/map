import * as Cesium from "cesium";
import {
  LabelCollisionDetector,
  LabelInfo,
  CollisionDetectorOptions,
} from "./LabelCollisionDetector";

/**
 * 外部传入的点数据接口
 */
export interface PointData {
  lng: number; // 经度
  lat: number; // 纬度
  title: string; // 标签文本
  id?: string; // 可选唯一标识，不传则自动生成
}

/**
 * 内部存储的点信息，包含 Cesium 对象及缓存数据
 */
interface InternalPoint {
  id: string;
  lng: number;
  lat: number;
  title: string;
  cartographic: Cesium.Cartographic; // 地理坐标（弧度）
  cartesian: Cesium.Cartesian3; // 笛卡尔坐标（地球固联坐标系）
  mercX: number; // Web墨卡托投影 X 坐标（米）
  mercY: number; // Web墨卡托投影 Y 坐标（米）
  label: Cesium.Label; // 对应的 Cesium 标签对象
  gridKey: string; // 所属网格的键值
  screenWidth?: number; // 标签屏幕宽度（像素），首次成功计算后缓存
  screenHeight?: number; // 标签屏幕高度（像素），缓存
}

/**
 * 网格单元数据结构
 */
interface GridCell {
  key: string; // 网格唯一键
  points: InternalPoint[]; // 该网格内的所有点
  boundingSphere: Cesium.BoundingSphere; // 网格包围球，用于视锥体裁剪
}

/**
 * 管理器配置选项
 */
export interface GridLabelManagerOptions {
  gridSize: number; // 网格大小（米），例如 100 表示 100x100 米
  batchSize?: number; // 每批添加的点数，默认 100
  labelOptions?: any; // 用户自定义标签样式，会覆盖默认样式
  collisionDetectorOptions?: CollisionDetectorOptions; // 碰撞检测器配置
  points?: PointData[]; // 初始点数据（可选）
}

/**
 * 基于网格的标签管理器
 * - 将点按固定大小的网格（墨卡托投影坐标）划分
 * - 使用视锥体剔除快速筛选可见网格
 * - 对可见网格内的点进行屏幕碰撞检测，动态显示标签
 */
export class GridBasedLabelManager {
  private viewer: Cesium.Viewer;

  private scene: Cesium.Scene;

  private projection: Cesium.WebMercatorProjection; // 用于将经纬度转换为平面坐标

  private gridSize: number;

  private batchSize: number;

  private userLabelOptions: any; // 保存用户自定义标签样式

  labelCollection: Cesium.LabelCollection; // 管理所有标签的集合

  private collisionDetector: LabelCollisionDetector; // 碰撞检测器

  private points: InternalPoint[] = []; // 所有内部点

  private gridMap: Map<string, GridCell> = new Map(); // 网格键 -> 网格数据

  private gridKeys: string[] = []; // 所有网格键的列表，便于遍历

  private isInitialized = false; // 所有点是否已添加完成（分批添加结束后设为 true）

  private pendingPoints: PointData[] = []; // 待添加的点队列

  // 事件处理器
  private batchHandler: (() => void) | null = null; // 分批添加的 preUpdate 监听器

  private bboxUpdateHandler: (() => void) | null = null; // 宽高获取的 preUpdate 监听器

  private cameraMoveHandler: () => void; // 相机移动结束监听器

  constructor(viewer: Cesium.Viewer, options: GridLabelManagerOptions) {
    this.viewer = viewer;
    this.scene = viewer.scene;
    this.projection = new Cesium.WebMercatorProjection(Cesium.Ellipsoid.WGS84);
    this.gridSize = options.gridSize || 300;
    this.batchSize = options.batchSize || 100;
    this.userLabelOptions = options.labelOptions || {};

    // 创建标签集合并添加到场景
    this.labelCollection = new Cesium.LabelCollection({ scene: this.scene });
    this.scene.primitives.add(this.labelCollection);

    // 初始化碰撞检测器
    this.collisionDetector = new LabelCollisionDetector(
      options.collisionDetectorOptions,
    );
    this.updateScreenBounds(); // 设置画布尺寸给碰撞检测器

    // 监听相机移动结束事件，触发可见性更新
    this.cameraMoveHandler = this.onCameraMove.bind(this);
    this.viewer.camera.changed.addEventListener(this.cameraMoveHandler);

    // 启动宽高获取监听（每帧执行），用于获取标签的屏幕宽高并缓存
    this.bboxUpdateHandler = this.updateBBoxes.bind(this);
    this.scene.preUpdate.addEventListener(this.bboxUpdateHandler);

    // 如果提供了初始点数据，则开始添加
    if (options.points) {
      this.addPoints(options.points);
    }
  }

  /**
   * 对外暴露的添加点方法，将点加入待处理队列并启动分批添加
   */
  public addPoints(points: PointData[]): void {
    for (let i = 0; i < points.length; i++) {
      this.pendingPoints.push(points[i]);
    }
    this.startBatchAdd();
  }

  /**
   * 启动分批添加：如果尚未有监听器，则注册一个 preUpdate 监听器
   */
  private startBatchAdd(): void {
    if (this.batchHandler) {
      return; // 已经在分批过程中
    }
    this.batchHandler = () => this.processBatchInPreUpdate();
    this.scene.preUpdate.addEventListener(this.batchHandler);
  }

  /**
   * preUpdate 回调，每帧处理一批点
   */
  private processBatchInPreUpdate(): void {
    if (this.pendingPoints.length === 0) {
      // 所有点处理完毕，移除监听器
      if (this.batchHandler) {
        this.scene.preUpdate.removeEventListener(this.batchHandler);
        this.batchHandler = null;
      }
      this.isInitialized = true; // 标记初始化完成
      this.onCameraMove(); // 立即触发一次可见性更新
      return;
    }

    // 取出当前批次的数据
    const batch: PointData[] = [];
    const count = Math.min(this.batchSize, this.pendingPoints.length);
    for (let i = 0; i < count; i++) {
      batch.push(this.pendingPoints.shift()!);
    }
    this.processBatch(batch);
  }

  /**
   * 处理一批点：创建标签、分配到网格、更新网格包围球
   */
  private processBatch(points: PointData[]): void {
    const newInternalPoints: InternalPoint[] = [];

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.lng && p.lat) {
        const id = p.id || this.generateId(p); // 生成唯一 ID
        const cartographic = Cesium.Cartographic.fromDegrees(p.lng, p.lat); // 转弧度
        const cartesian =
          this.scene.ellipsoid.cartographicToCartesian(cartographic); // 转笛卡尔
        const merc = this.projection.project(cartographic); // 投影坐标（米）

        // 计算所属网格的键值
        const gridX = Math.floor(merc.x / this.gridSize);
        const gridY = Math.floor(merc.y / this.gridSize);
        const gridKey = `${gridX}_${gridY}`;

        // 合并标签样式：默认样式 + 用户自定义样式
        const labelOptions = {
          ...this.getDefaultLabelOptions(),
          ...this.userLabelOptions,
          text: p.title,
          position: cartesian,
        };

        const label = this.labelCollection.add(labelOptions); // 创建标签（默认隐藏）

        const internalPoint: InternalPoint = {
          id,
          lng: p.lng,
          lat: p.lat,
          title: p.title,
          cartographic,
          cartesian,
          mercX: merc.x,
          mercY: merc.y,
          label,
          gridKey,
        };

        newInternalPoints.push(internalPoint);
        this.points.push(internalPoint);

        // 将点加入对应的网格
        let cell = this.gridMap.get(gridKey);
        if (!cell) {
          cell = {
            key: gridKey,
            points: [],
            boundingSphere: new Cesium.BoundingSphere(),
          };
          this.gridMap.set(gridKey, cell);
          this.gridKeys.push(gridKey); // 记录网格键
        }
        cell.points.push(internalPoint);
      }
    }

    // 更新受影响的网格的包围球（基于网格内所有点的笛卡尔坐标）
    const affectedGridKeysSet = new Set<string>();
    for (let i = 0; i < newInternalPoints.length; i++) {
      affectedGridKeysSet.add(newInternalPoints[i].gridKey);
    }
    const affectedGridKeys = Array.from(affectedGridKeysSet);
    for (let i = 0; i < affectedGridKeys.length; i++) {
      this.rebuildGridBoundingSphere(affectedGridKeys[i]);
    }
  }

  /**
   * 重建指定网格的包围球
   */
  private rebuildGridBoundingSphere(gridKey: string): void {
    const cell = this.gridMap.get(gridKey);
    if (!cell || cell.points.length === 0) return;
    const positions: Cesium.Cartesian3[] = [];
    for (let i = 0; i < cell.points.length; i++) {
      positions.push(cell.points[i].cartesian);
    }
    cell.boundingSphere = Cesium.BoundingSphere.fromPoints(positions);
  }

  /**
   * 生成点唯一 ID（基于经纬度+标题+随机数）
   */
  private generateId(point: PointData): string {
    return `${point.lng}_${point.lat}_${point.title}_${Math.random()}`;
  }

  /**
   * 返回默认标签样式（所有标签默认隐藏）
   */
  private getDefaultLabelOptions(): any {
    return {
      font: "14px sans-serif",
      fillColor: Cesium.Color.WHITE,
      // fillColor: Cesium.Color.RED,
      style: Cesium.LabelStyle.FILL,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      pixelOffset: new Cesium.Cartesian2(0, -10),
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 2000),
      show: false, // 初始隐藏，由碰撞检测决定显示
    };
  }

  /**
   * 每帧执行：尝试获取尚未缓存的标签屏幕宽高
   * 由于 Cesium 标签需要渲染一帧后才能获得准确尺寸，这里采用每帧尝试直到成功
   */
  private updateBBoxes(): void {
    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];
      // 如果已经缓存了宽高，跳过
      if (point.screenWidth !== undefined && point.screenHeight !== undefined) {
        continue;
      }

      // 注意：此处使用 @ts-ignore 是因为 Cesium 类型定义可能没有该静态方法，但运行时存在
      // 第二个参数原本应为 Scene，但用户要求传入 new Cesium.Cartesian2()，需根据实际环境调整
      // @ts-ignore
      const bbox = Cesium.Label.getScreenSpaceBoundingBox(
        point.label,
        new Cesium.Cartesian2(),
      );
      // 检查获取到的包围盒是否有效（宽高为正且有限）
      if (
        bbox &&
        Number.isFinite(bbox.width) &&
        Number.isFinite(bbox.height) &&
        bbox.width > 0 &&
        bbox.height > 0
      ) {
        point.screenWidth = bbox.width;
        point.screenHeight = bbox.height;
      }
      // 如果无效，下一帧继续尝试
    }
  }

  /**
   * 相机移动结束回调，触发可见性更新
   */
  private onCameraMove(): void {
    if (!this.isInitialized) return; // 点未全部添加完成，暂不处理
    this.updateVisibility();
  }

  /**
   * 更新屏幕边界（画布大小）给碰撞检测器
   */
  private updateScreenBounds(): void {
    const { canvas } = this.scene;
    this.collisionDetector.setScreenBounds(canvas.width, canvas.height);
  }

  /**
   * 核心：更新标签可见性
   * 步骤：
   * 1. 视锥体剔除：找出与当前视锥体相交的网格
   * 2. 收集这些网格内所有已缓存宽高的点的屏幕信息（位置、尺寸、距离）
   * 3. 调用碰撞检测器进行屏幕碰撞检测
   * 4. 根据检测结果设置标签显示/隐藏
   */
  private updateVisibility(): void {
    this.updateScreenBounds();

    // 注意：CullingVolume 通常可通过 scene.cullingVolume 获取，但这里使用了 _frameState 内部属性，需谨慎

    const { camera } = this.scene;
    const cullingVolume = camera.frustum.computeCullingVolume(
      camera.positionWC,
      camera.directionWC,
      camera.upWC,
    );
    const visibleGridKeys: string[] = [];
    const canvasWidth = this.scene.canvas.width;
    const canvasHeight = this.scene.canvas.height;
    // 遍历所有网格，判断是否在视锥体内
    for (let i = 0; i < this.gridKeys.length; i++) {
      const key = this.gridKeys[i];
      const cell = this.gridMap.get(key);
      if (!cell) continue;
      const intersect = cullingVolume.computeVisibility(cell.boundingSphere);
      if (intersect !== Cesium.Intersect.OUTSIDE) {
        visibleGridKeys.push(key);
      }
    }

    // 收集可见网格内所有点的屏幕信息（用于碰撞检测）
    const labelsForCollision: LabelInfo[] = [];

    for (let i = 0; i < visibleGridKeys.length; i++) {
      const key = visibleGridKeys[i];
      const cell = this.gridMap.get(key);
      if (!cell) continue;

      for (let j = 0; j < cell.points.length; j++) {
        const point = cell.points[j];
        // 只有已获取到屏幕宽高的点才参与碰撞检测
        if (
          point.screenWidth === undefined ||
          point.screenHeight === undefined
        ) {
          continue;
        }

        // 计算屏幕坐标（原点左上角）
        const screenPos = point.label.computeScreenSpacePosition(this.scene);
        if (
          !Cesium.defined(screenPos) ||
          screenPos.x < 0 ||
          screenPos.x > canvasWidth ||
          screenPos.y < 0 ||
          screenPos.y > canvasHeight
        )
          continue; // 可能被裁剪或不可见

        // 根据默认的 origin (BOTTOM, CENTER) 计算左下角坐标
        // 对于 BOTTOM，标签底边位于屏幕坐标的 y 处；水平居中，所以 left = screenPos.x - 宽度/2
        const left = screenPos.x - point.screenWidth / 2;
        const bottom = canvasHeight - screenPos.y; // 转换为左下角坐标系（y 从下往上）

        const cameraPos = this.scene.camera.positionWC;
        const distance = Cesium.Cartesian3.distance(cameraPos, point.cartesian);

        labelsForCollision.push({
          id: point.id,
          x: left,
          y: bottom,
          width: point.screenWidth,
          height: point.screenHeight,
          distanceToCamera: distance,
          visible: false,
        });
      }
    }

    // 执行碰撞检测
    const collisionResults =
      this.collisionDetector.detectCollisions(labelsForCollision);

    // 先隐藏所有标签
    for (let i = 0; i < this.points.length; i++) {
      this.points[i].label.show = false;
    }
    // 再显示检测通过的标签
    for (let i = 0; i < collisionResults.length; i++) {
      const info = collisionResults[i];
      if (info.visible) {
        for (let j = 0; j < this.points.length; j++) {
          if (this.points[j].id === info.id) {
            this.points[j].label.show = true;
            break;
          }
        }
      }
    }
  }

  /**
   * 手动触发一次可见性更新
   */
  public refresh(): void {
    this.updateVisibility();
  }

  /**
   * 更新碰撞检测器配置
   */
  public updateCollisionDetectorOptions(
    options: Partial<CollisionDetectorOptions>,
  ): void {
    this.collisionDetector.updateOptions(options);
    this.refresh();
  }

  /**
   * 获取所有内部点（只读副本）
   */
  public getAllPoints(): InternalPoint[] {
    return this.points.slice();
  }

  /**
   * 销毁管理器，清理资源
   */
  public destroy(): void {
    // 移除所有监听器
    if (this.batchHandler) {
      this.scene.preUpdate.removeEventListener(this.batchHandler);
      this.batchHandler = null;
    }
    if (this.bboxUpdateHandler) {
      this.scene.preUpdate.removeEventListener(this.bboxUpdateHandler);
      this.bboxUpdateHandler = null;
    }
    this.viewer.camera.changed.removeEventListener(this.cameraMoveHandler);
    // 从场景移除并销毁标签集合
    this.scene.primitives.remove(this.labelCollection);

    // 清空数据
    this.gridMap.clear();
    this.points = [];
    this.pendingPoints = [];
  }
}
