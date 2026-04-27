import {
  CameraOptions,
  ExportMapToBlobFormat,
  ExportMapToBlobOptions,
  Extent,
  FitExtentParams,
  FlyToBoundsCenterParams,
  FlyToBoundsParams,
  ICameraManagerImp,
  isValidCoordinates,
  isValidExtent,
  JumpToParams,
  PointCoordinates,
  Position,
  SetCameraParams,
} from "@gdu-gl/common";
import * as Cesium from "cesium";
import {
  calculateHeightByLevel,
  calculateLevelByHeight,
  cartesian2Coordinates,
  getCameraFocus,
  getZoomLevelHeights,
  keepCameraStabilizedFlying,
  switch2dEarthMode,
  switch3dEarthMode,
  verifyDuration,
  verifyHeadingPitchRoll,
} from "@cesium-engine/Utils";
import { isEmpty, isNil } from "lodash-es";

export default class CameraController implements ICameraManagerImp {
  _viewer: Cesium.Viewer;

  _zoomHeightMapping: Map<number, number>;

  /**
   * 默认时间
   */
  defaultDuration = 1500;

  /**
   * 创建相机控制器实例
   * @param viewer Cesium 视图对象
   */
  constructor(viewer: Cesium.Viewer) {
    this._viewer = viewer;
    // 初始化缩放层级与高度的映射关系（精度级别1）
    this._zoomHeightMapping = getZoomLevelHeights(this._viewer.scene, 1);
  }

  /**
   * 获取视口中心点的地理坐标
   * @returns 地理坐标 [经度, 纬度, 高度] 或 undefined
   * @description
   * 1. 通过屏幕中心点向场景发射三条探测射线（顶部、中心、底部）
   * 2. 优先尝试获取中心点的地表坐标
   * 3. 当中心点不可见时，垂直扫描屏幕中线查找第一个可见的地面点
   */
  getCenter(): Position {
    const { scene } = this._viewer;
    const groundCenter = getCameraFocus(scene);
    // 将三维笛卡尔坐标转换为地理坐标 [经度, 纬度, 高度]
    return cartesian2Coordinates(groundCenter)!;
  }

  /**
   * 获取当前相机缩放层级
   * @returns number 返回基于高度映射表的插值缩放层级
   * @description
   * 1. 优先尝试获取视口中心点坐标
   * 2. 当中心点不可得时，直接使用相机高度计算层级
   * 3. 当中心点有效时，通过计算相机位置到焦点位置的距离确定层级
   * @example
   * // 当相机在1000米高度且层级映射表显示该高度对应层级10时
   * controller.getZoom() // 返回 10.3（示例值）
   */
  getZoom() {
    const center = this.getCenter();
    if (!center) {
      const { positionCartographic } = this._viewer.scene.camera;
      return calculateLevelByHeight(
        this._zoomHeightMapping,
        positionCartographic.height,
      ) as number;
    }

    const { positionWC } = this._viewer.camera;
    const [lon, lat, height] = center;
    const positionCartesian = Cesium.Cartesian3.fromDegrees(lon, lat, height);
    const distance = Cesium.Cartesian3.distance(positionWC, positionCartesian);
    return calculateLevelByHeight(this._zoomHeightMapping, distance) as number;
  }

  getExtentByScreen(extent?: Extent): Extent | undefined {
    // TODO 实现用户传递屏幕像素坐标获取四至范围
    if (extent) {
      console.warn(
        "暂时不支持根据extent获取四至范围,返回的结果仍然是全屏的四至范围",
      );
    }
    const { camera } = this._viewer.scene;
    const rectangle = camera.computeViewRectangle(
      this._viewer.scene.globe.ellipsoid,
    );
    if (rectangle) {
      const west = Cesium.Math.toDegrees(rectangle.west);
      const south = Cesium.Math.toDegrees(rectangle.south);
      const east = Cesium.Math.toDegrees(rectangle.east);
      const north = Cesium.Math.toDegrees(rectangle.north);
      return [west, south, east, north];
    }
    return undefined;
  }

  zoomIn() {
    return this.getTheCameraMovementVector(0.55);
  }

  zoomOut() {
    return this.getTheCameraMovementVector(1 / 0.55);
  }

  /**
   * 计算并执行相机基于聚焦点的镜头移动
   * @param amount 移动系数（0.5表示移动到当前位置与焦点的中间位置，2.0表示两倍距离等）
   * @returns Promise<boolean> 镜头飞行是否成功完成
   * @example
   * // 将相机移动到当前聚焦点1.5倍距离的位置
   * getTheCameraMovementVector(1.5).then(success => {
   *   if(success) console.log('镜头移动完成');
   * });
   */
  getTheCameraMovementVector(amount: number): Promise<boolean> {
    // 获取当前相机聚焦点（场景中心点）
    const focus = getCameraFocus(this._viewer.scene);

    // 保持当前相机的方向参数
    const orientation = {
      direction: this._viewer.camera.direction,
      up: this._viewer.camera.up,
    };

    // 计算相机当前位置到聚焦点的方向向量
    const cartesian3Scratch = new Cesium.Cartesian3();
    const direction = Cesium.Cartesian3.subtract(
      this._viewer.camera.position,
      focus,
      cartesian3Scratch,
    );

    // 根据系数缩放移动向量并计算终点位置
    const movementVector = Cesium.Cartesian3.multiplyByScalar(
      direction,
      amount,
      direction,
    );
    const endPosition = Cesium.Cartesian3.add(focus, movementVector, focus);

    // 执行镜头飞行并返回结果承诺
    return new Promise((resolve) => {
      this._viewer.camera.cancelFlight(); // 取消当前正在进行的飞行
      this._viewer.camera.flyTo({
        destination: endPosition,
        orientation,
        convert: false, // 禁用坐标系自动转换
        duration: verifyDuration(this.defaultDuration, 500), // 300ms的固定动画时长
        complete: () => resolve(true),
        cancel: () => resolve(false),
      });
    });
  }

  toggleEarthMode(type: number, duration?: number): Promise<boolean> {
    this._viewer.camera.cancelFlight();
    const center = this.getCenter();
    const options = {
      center,
      duration,
      defaultDuration: 400,
    };

    return type === 2
      ? switch2dEarthMode(this._viewer, options)
      : switch3dEarthMode(this._viewer, options);
  }

  /**
   * 根据点位进行跳转
   * @param params
   */
  flyToBounds(params: FlyToBoundsParams): Promise<boolean> {
    this._viewer.camera.cancelFlight();
    return new Promise((resolve, reject) => {
      const { positions, duration } = params;

      if (isEmpty(positions)) {
        reject(new Error("坐标参数不能为空"));
        return;
      }
      const cartesianArr: Cesium.Cartesian3[] = [];
      // 处理位置参数：优先使用传入坐标，失败时使用当前相机位置
      positions?.forEach((position) => {
        const [lon, lat, alt] = isValidCoordinates(position);
        cartesianArr.push(Cesium.Cartesian3.fromDegrees(lon, lat, alt));
        // 是否需要跳转垂足点位
        if (params.withFootPoints) {
          cartesianArr.push(Cesium.Cartesian3.fromDegrees(lon, lat));
        }
      });

      const { heading, pitch } = verifyHeadingPitchRoll(this._viewer, {
        heading: params.heading,
        pitch: params.pitch,
      });
      const boundingSphere = Cesium.BoundingSphere.fromPoints(cartesianArr);
      const radius = Math.max(boundingSphere.radius, 150);
      boundingSphere.radius = radius * 1.12;
      this._viewer.camera.flyToBoundingSphere(boundingSphere, {
        offset: new Cesium.HeadingPitchRange(heading, pitch),
        duration: verifyDuration(this.defaultDuration, duration),
        complete: () => resolve(true),
        cancel: () => resolve(false),
      });
    });
  }

  /**
   * 飞行至多个点覆盖范围（居中模式）
   * 通过矩形放大 + 双层透明实体实现点位精确居中显示
   */
  flyToBoundsCenter(params: FlyToBoundsCenterParams): Promise<boolean> {
    this._viewer.camera.cancelFlight();
    return new Promise((resolve, reject) => {
      const { positions, scale, duration, debug } = params;

      if (isEmpty(positions)) {
        reject(new Error("坐标参数不能为空"));
        return;
      }

      let minLon = Infinity;
      let maxLon = -Infinity;
      let minLat = Infinity;
      let maxLat = -Infinity;
      let minHeight = Infinity;
      let maxHeight = -Infinity;

      positions?.forEach((position) => {
        const [lon, lat, alt] = isValidCoordinates(position);
        minLon = Math.min(minLon, lon);
        maxLon = Math.max(maxLon, lon);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minHeight = Math.min(minHeight, alt ?? 0);
        maxHeight = Math.max(maxHeight, alt ?? 0);
      });

      const centerLon = (minLon + maxLon) / 2;
      const centerLat = (minLat + maxLat) / 2;
      const halfWidth = (maxLon - minLon) / 2;
      const halfHeight = (maxLat - minLat) / 2;
      const scaleFactor = scale ?? 2.5;
      const scaledHalfWidth = halfWidth * scaleFactor;
      const scaledHalfHeight = halfHeight * scaleFactor;

      const scaledMinLon = centerLon - scaledHalfWidth;
      const scaledMinLat = centerLat - scaledHalfHeight;
      const scaledMaxLon = centerLon + scaledHalfWidth;
      const scaledMaxLat = centerLat + scaledHalfHeight;

      const MIN_LON = -180;
      const MAX_LON = 180;
      const MIN_LAT = -90;
      const MAX_LAT = 90;

      const clampedMinLon = Math.max(MIN_LON, Math.min(MAX_LON, scaledMinLon));
      const clampedMinLat = Math.max(MIN_LAT, Math.min(MAX_LAT, scaledMinLat));
      const clampedMaxLon = Math.max(MIN_LON, Math.min(MAX_LON, scaledMaxLon));
      const clampedMaxLat = Math.max(MIN_LAT, Math.min(MAX_LAT, scaledMaxLat));

      if (
        scaledMinLon !== clampedMinLon ||
        scaledMinLat !== clampedMinLat ||
        scaledMaxLon !== clampedMaxLon ||
        scaledMaxLat !== clampedMaxLat
      ) {
        console.warn("坐标参数超出正常范围");
      }

      const rectangle = Cesium.Rectangle.fromDegrees(
        clampedMinLon,
        clampedMinLat,
        clampedMaxLon,
        clampedMaxLat,
      );

      const { heading, pitch } = verifyHeadingPitchRoll(this._viewer, {
        heading: params.heading,
        pitch: params.pitch,
      });

      const showOutline = debug ?? false;

      const fly1 = this._viewer.entities.add({
        rectangle: {
          coordinates: rectangle,
          material: Cesium.Color.GREEN.withAlpha(0.0),
          height: minHeight,
          outline: showOutline,
        },
      });
      const fly2 = this._viewer.entities.add({
        rectangle: {
          coordinates: rectangle,
          material: Cesium.Color.GREEN.withAlpha(0.0),
          height: maxHeight * 1.5,
          outline: showOutline,
        },
      });

      this._viewer
        .flyTo([fly1, fly2], {
          offset: new Cesium.HeadingPitchRange(heading, pitch, 0),
          duration: verifyDuration(this.defaultDuration, duration),
        })
        .then(() => {
          resolve(true);
        })
        .catch(() => {
          resolve(false);
          this._viewer.camera.cancelFlight();
        })
        .finally(() => {
          this._viewer.entities.remove(fly1);
          this._viewer.entities.remove(fly2);
        });
    });
  }

  /**
   * 调整视角到指定地理范围
   * @param params 包含范围参数和视角参数的对象
   * @returns Promise对象表示飞行动画是否成功完成
   */
  fitExtent(params: FitExtentParams): Promise<boolean> {
    this._viewer.camera.cancelFlight();
    return new Promise((resolve) => {
      const { extent, duration, range, height } = params;

      // 校验地理范围参数有效性
      isValidExtent(extent);
      const [west, south, east, north] = extent;

      // 获取并验证航向和俯仰参数
      const { heading, pitch } = verifyHeadingPitchRoll(this._viewer, {
        heading: params.heading,
        pitch: params.pitch,
      });

      // 将地理范围转换为矩形区域
      const rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);

      // 执行飞行动画到目标范围
      this._viewer.camera.flyToBoundingSphere(
        // 创建3D边界球（考虑椭球体曲率和指定高度）
        Cesium.BoundingSphere.fromRectangle3D(
          rectangle,
          Cesium.Ellipsoid.WGS84,
          height,
        ),
        {
          // 设置观察偏移量（航向/俯仰/观察距离）
          offset: new Cesium.HeadingPitchRange(heading, pitch, range),
          // 设置动画持续时间（自动校验参数有效性）
          duration: verifyDuration(this.defaultDuration, duration),
          complete: () => resolve(true), // 飞行成功回调
          cancel: () => resolve(false), // 飞行取消回调
        },
      );
    });
  }

  /**
   * 设置相机参数并执行飞行动画
   * @param params 包含位置、姿态和持续时间参数的对象
   * @returns Promise对象表示飞行动画是否成功完成
   */
  setCameraOptions(params: SetCameraParams): Promise<boolean> {
    this._viewer.camera.cancelFlight();
    return new Promise((resolve) => {
      const { heading, pitch, roll, duration, fov } = params;

      // 处理位置参数：优先使用传入坐标，失败时使用当前相机位置
      let position: PointCoordinates;
      try {
        position = isValidCoordinates(params.position);
      } catch (e) {
        position = this.getCameraOptions().position;
      }

      // 将经纬度坐标转换为三维笛卡尔坐标
      const [lon, lat, alt] = position;
      // @ts-ignore
      const selfFov = this._viewer.camera.frustum.fov;
      // @ts-ignore
      this._viewer.camera.frustum.fov = fov
        ? Cesium.Math.toRadians(fov)
        : selfFov;
      this._viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, alt), // 目标位置
        orientation: verifyHeadingPitchRoll(this._viewer, {
          heading,
          pitch,
          roll,
        }), // 转换后的姿态参数
        duration: verifyDuration(this.defaultDuration, duration, 0), // 校验持续时间（最低0秒）
        complete: () => resolve(true), // 飞行成功回调
        cancel: () => resolve(false), // 飞行取消回调
      });
    });
  }

  getCameraOptions(): CameraOptions {
    const { position, heading, pitch, roll } = this._viewer.camera;
    // @ts-ignore
    const { fov } = this._viewer.camera.frustum;
    return {
      position: cartesian2Coordinates(position) as PointCoordinates,
      heading: Cesium.Math.toDegrees(heading),
      pitch: Cesium.Math.toDegrees(pitch),
      roll: Cesium.Math.toDegrees(roll),
      fov: Cesium.Math.toDegrees(fov),
    };
  }

  jumpTo(params: JumpToParams): Promise<boolean> {
    this._viewer.camera.cancelFlight();
    return new Promise((resolve) => {
      const { position, duration } = params;
      isValidCoordinates(position);
      const { zoom } = params;
      const [lon, lat, alt] = position;
      const { heading, pitch } = verifyHeadingPitchRoll(this._viewer, {
        heading: params.heading,
        pitch: params.pitch,
      });
      const boundingSphere = new Cesium.BoundingSphere(
        Cesium.Cartesian3.fromDegrees(lon, lat, alt),
      );
      let range: number;
      if (isNil(zoom)) {
        range = keepCameraStabilizedFlying(this._viewer, boundingSphere.center);
      } else {
        range = calculateHeightByLevel(this._zoomHeightMapping, zoom)!;
      }
      this._viewer.camera.flyToBoundingSphere(boundingSphere, {
        offset: new Cesium.HeadingPitchRange(heading, pitch, range),
        duration: verifyDuration(this.defaultDuration, duration),
        complete: () => resolve(true),
        cancel: () => resolve(false),
      });
    });
  }

  exportMapToBlob(params?: ExportMapToBlobOptions): Promise<Blob> {
    const { format = ExportMapToBlobFormat.PNG, quality = 1 } = params ?? {};
    this._viewer.render();

    return new Promise((resolve, reject) => {
      this._viewer.canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("cesium生成快照失败"));
          }
        },
        format,
        quality,
      );
    });
  }

  /**
   * 取消飞行
   */
  cancelFlight() {
    this._viewer.camera.cancelFlight();
  }

  destroy() {
    // this._viewer = null as any;
    // this._zoomHeightMapping = null as any;
  }
}
