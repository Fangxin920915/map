export interface LabelInfo {
  id: string;
  x: number; // 屏幕左下角X坐标
  y: number; // 屏幕左下角Y坐标
  width: number; // 屏幕矩形宽
  height: number; // 屏幕矩形高
  distanceToCamera: number; // 距离相机的距离
  visible: boolean; // 是否可见
}

export interface CollisionDetectorOptions {
  /**
   * 碰撞缓冲像素
   */
  padding?: number;
  /**
   * 是否优先显示距离相机更近的标签
   */
  prioritizeCloser?: boolean;
  /**
   * 允许的最大重叠比例 (0-1)
   */
  maxOverlapRatio?: number;
  /**
   * 是否启用四叉树空间划分加速
   */
  enableQuadtree?: boolean;
  /**
   * 四叉树最大深度
   */
  quadtreeMaxDepth?: number;
  /**
   * 四叉树节点最大容量
   */
  quadtreeNodeCapacity?: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  right: number;
  top: number;
}

interface QuadTreeItem {
  rect: Rect;
  label: LabelInfo;
}

/**
 * 四叉树节点
 */
class QuadTreeNode {
  private items: QuadTreeItem[] = [];

  private children: QuadTreeNode[] = [];

  private divided = false;

  constructor(
    public readonly bounds: Rect,
    private readonly capacity: number,
    private readonly maxDepth: number,
    private depth: number = 0,
  ) {}

  /**
   * 插入标签到四叉树
   */
  insert(item: QuadTreeItem): boolean {
    // 如果不在本节点范围内，直接返回
    if (!this.intersects(item.rect)) {
      return false;
    }

    // 如果节点未分裂且容量未满，直接存储
    if (!this.divided && this.items.length < this.capacity) {
      this.items.push(item);
      return true;
    }

    // 如果达到最大深度，直接存储
    if (this.depth >= this.maxDepth) {
      this.items.push(item);
      return true;
    }

    // 如果未分裂，先分裂
    if (!this.divided) {
      this.subdivide();
    }

    // 尝试插入到子节点
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i].insert(item)) {
        return true;
      }
    }

    // 如果子节点都无法插入，存储在本节点
    this.items.push(item);
    return true;
  }

  /**
   * 查询与指定矩形相交的标签
   */
  query(rect: Rect, found: QuadTreeItem[] = []): QuadTreeItem[] {
    // 如果查询矩形与节点不相交，直接返回
    if (!this.intersects(rect)) {
      return found;
    }

    // 检查本节点存储的标签
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (this.rectIntersects(item.rect, rect)) {
        found.push(item);
      }
    }

    // 递归检查子节点
    if (this.divided) {
      for (let i = 0; i < this.children.length; i++) {
        this.children[i].query(rect, found);
      }
    }

    return found;
  }

  /**
   * 清除四叉树
   */
  clear(): void {
    this.items = [];
    if (this.divided) {
      for (let i = 0; i < this.children.length; i++) {
        this.children[i].clear();
      }
      this.children = [];
      this.divided = false;
    }
  }

  /**
   * 分裂节点
   */
  private subdivide(): void {
    const { x, y, width, height } = this.bounds;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const nextDepth = this.depth + 1;

    this.children = [
      // 左上
      new QuadTreeNode(
        { x, y: y + halfHeight, width: halfWidth, height: halfHeight } as Rect,
        this.capacity,
        this.maxDepth,
        nextDepth,
      ),
      // 右上
      new QuadTreeNode(
        {
          x: x + halfWidth,
          y: y + halfHeight,
          width: halfWidth,
          height: halfHeight,
        } as Rect,
        this.capacity,
        this.maxDepth,
        nextDepth,
      ),
      // 左下
      new QuadTreeNode(
        { x, y, width: halfWidth, height: halfHeight } as Rect,
        this.capacity,
        this.maxDepth,
        nextDepth,
      ),
      // 右下
      new QuadTreeNode(
        {
          x: x + halfWidth,
          y,
          width: halfWidth,
          height: halfHeight,
        } as Rect,
        this.capacity,
        this.maxDepth,
        nextDepth,
      ),
    ];

    this.divided = true;
  }

  /**
   * 检查矩形是否与节点边界相交
   */
  private intersects(rect: Rect): boolean {
    return !(
      rect.right < this.bounds.x ||
      rect.x > this.bounds.right ||
      rect.top < this.bounds.y ||
      rect.y > this.bounds.top
    );
  }

  /**
   * 检查两个矩形是否相交
   */
  private rectIntersects(rect1: Rect, rect2: Rect): boolean {
    return !(
      rect1.right < rect2.x ||
      rect1.x > rect2.right ||
      rect1.top < rect2.y ||
      rect1.y > rect2.top
    );
  }
}

/**
 * 优化的标签碰撞检测类
 */
export class LabelCollisionDetector {
  private padding: number;

  private prioritizeCloser: boolean;

  private maxOverlapRatio: number;

  private enableQuadtree: boolean;

  private quadtreeMaxDepth: number;

  private quadtreeNodeCapacity: number;

  private quadTree: QuadTreeNode | null = null;

  private screenBounds: Rect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    right: 0,
    top: 0,
  };

  constructor(options: CollisionDetectorOptions = {}) {
    this.padding = options.padding ?? 2;
    this.prioritizeCloser = options.prioritizeCloser ?? true;
    this.maxOverlapRatio = options.maxOverlapRatio ?? 0.3;
    this.enableQuadtree = options.enableQuadtree ?? true;
    this.quadtreeMaxDepth = options.quadtreeMaxDepth ?? 8;
    this.quadtreeNodeCapacity = options.quadtreeNodeCapacity ?? 4;
  }

  /**
   * 设置屏幕边界（用于四叉树初始化）
   */
  public setScreenBounds(width: number, height: number): void {
    this.screenBounds = {
      x: 0,
      y: 0,
      width,
      height,
      right: width,
      top: height,
    };

    if (this.enableQuadtree) {
      this.quadTree = new QuadTreeNode(
        this.screenBounds,
        this.quadtreeNodeCapacity,
        this.quadtreeMaxDepth,
      );
    }
  }

  /**
   * 检测矩形是否相交（考虑padding）
   */
  private rectanglesCollide(rect1: Rect, rect2: Rect): boolean {
    const rect1WithPadding = {
      x: rect1.x - this.padding,
      y: rect1.y - this.padding,
      right: rect1.right + this.padding,
      top: rect1.top + this.padding,
    };

    const rect2WithPadding = {
      x: rect2.x - this.padding,
      y: rect2.y - this.padding,
      right: rect2.right + this.padding,
      top: rect2.top + this.padding,
    };

    return !(
      rect1WithPadding.right < rect2WithPadding.x ||
      rect1WithPadding.x > rect2WithPadding.right ||
      rect1WithPadding.top < rect2WithPadding.y ||
      rect1WithPadding.y > rect2WithPadding.top
    );
  }

  /**
   * 计算重叠面积比例
   */
  private calculateOverlapRatio(rect1: Rect, rect2: Rect): number {
    const xOverlap = Math.max(
      0,
      Math.min(rect1.right, rect2.right) - Math.max(rect1.x, rect2.x),
    );

    const yOverlap = Math.max(
      0,
      Math.min(rect1.top, rect2.top) - Math.max(rect1.y, rect2.y),
    );

    const overlapArea = xOverlap * yOverlap;
    const area1 = rect1.width * rect1.height;
    const area2 = rect2.width * rect2.height;
    const minArea = Math.min(area1, area2);

    return minArea > 0 ? overlapArea / minArea : 0;
  }

  /**
   * 计算标签的优先级分数
   */
  private calculatePriority(label: LabelInfo): number {
    if (!this.prioritizeCloser) {
      return 1; // 所有标签优先级相同
    }

    // 距离越近，优先级越高（使用倒数以确保距离越近值越大）
    const distanceWeight = 1 / (label.distanceToCamera + 0.001);

    // 面积越小，优先级越低（避免小标签遮挡大标签）
    const area = label.width * label.height;
    const areaWeight = Math.sqrt(area) / 100; // 调整系数

    return distanceWeight * areaWeight;
  }

  /**
   * 使用网格分割法进行碰撞检测
   */
  private gridBasedCollisionDetection(labels: LabelInfo[]): Set<string> {
    const visibleSet = new Set<string>();
    const labelRects = new Map<string, Rect>();
    const labelPriorities = new Map<string, number>();

    // 计算所有标签的矩形和优先级
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const rect: Rect = {
        x: label.x,
        y: label.y,
        width: label.width,
        height: label.height,
        right: label.x + label.width,
        top: label.y + label.height,
      };
      labelRects.set(label.id, rect);
      labelPriorities.set(label.id, this.calculatePriority(label));
    }

    // 按优先级排序（高优先级先处理）
    const sortedLabels = [...labels].sort((a, b) => {
      return (
        (labelPriorities.get(b.id) ?? 0) - (labelPriorities.get(a.id) ?? 0)
      );
    });

    // 贪心算法选择标签
    for (let i = 0; i < sortedLabels.length; i++) {
      const label = sortedLabels[i];
      const currentRect = labelRects.get(label.id);
      if (!currentRect) continue;

      let canShow = true;

      // 检查与已显示标签的碰撞
      const visibleIds = Array.from(visibleSet);
      for (let j = 0; j < visibleIds.length; j++) {
        const visibleId = visibleIds[j];
        const otherRect = labelRects.get(visibleId);
        if (!otherRect) continue;

        if (this.rectanglesCollide(currentRect, otherRect)) {
          const overlapRatio = this.calculateOverlapRatio(
            currentRect,
            otherRect,
          );

          // 如果重叠超过阈值，需要决策
          if (overlapRatio > this.maxOverlapRatio) {
            const currentPriority = labelPriorities.get(label.id) ?? 0;
            const otherPriority = labelPriorities.get(visibleId) ?? 0;

            // 如果当前标签优先级更高，替换原有标签
            if (currentPriority > otherPriority * 1.1) {
              // 10%阈值避免抖动
              visibleSet.delete(visibleId);
              // 继续检查其他标签
            } else {
              canShow = false;
              break;
            }
          }
        }
      }

      if (canShow) {
        visibleSet.add(label.id);
      }
    }

    return visibleSet;
  }

  /**
   * 使用四叉树进行碰撞检测
   */
  private quadtreeBasedCollisionDetection(labels: LabelInfo[]): Set<string> {
    const visibleSet = new Set<string>();

    if (!this.quadTree) {
      return this.gridBasedCollisionDetection(labels);
    }

    // 清空并重建四叉树
    this.quadTree.clear();
    const labelItems = new Map<string, QuadTreeItem>();

    // 插入所有标签到四叉树
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const rect: Rect = {
        x: label.x,
        y: label.y,
        width: label.width,
        height: label.height,
        right: label.x + label.width,
        top: label.y + label.height,
      };

      const item: QuadTreeItem = { rect, label };
      this.quadTree.insert(item);
      labelItems.set(label.id, item);
    }

    // 按优先级排序
    const sortedLabels = [...labels].sort((a, b) => {
      const priorityA = this.calculatePriority(a);
      const priorityB = this.calculatePriority(b);
      return priorityB - priorityA;
    });

    // 贪心算法选择标签
    for (let i = 0; i < sortedLabels.length; i++) {
      const label = sortedLabels[i];
      const currentItem = labelItems.get(label.id);
      if (!currentItem) continue;

      // 查询可能与当前标签碰撞的标签
      const searchRect = {
        x: currentItem.rect.x - this.padding,
        y: currentItem.rect.y - this.padding,
        width: currentItem.rect.width + this.padding * 2,
        height: currentItem.rect.height + this.padding * 2,
        right: 0,
        top: 0,
      };
      searchRect.right = searchRect.x + searchRect.width;
      searchRect.top = searchRect.y + searchRect.height;

      const potentialCollisions = this.quadTree.query(searchRect);

      let canShow = true;

      // 检查与已显示标签的碰撞
      for (let j = 0; j < potentialCollisions.length; j++) {
        const collisionItem = potentialCollisions[j];
        if (!visibleSet.has(collisionItem.label.id)) continue;

        if (this.rectanglesCollide(currentItem.rect, collisionItem.rect)) {
          const overlapRatio = this.calculateOverlapRatio(
            currentItem.rect,
            collisionItem.rect,
          );

          if (overlapRatio > this.maxOverlapRatio) {
            const currentPriority = this.calculatePriority(currentItem.label);
            const otherPriority = this.calculatePriority(collisionItem.label);

            if (currentPriority > otherPriority * 1.1) {
              visibleSet.delete(collisionItem.label.id);
            } else {
              canShow = false;
              break;
            }
          }
        }
      }

      if (canShow) {
        visibleSet.add(label.id);
      }
    }

    return visibleSet;
  }

  /**
   * 碰撞检测函数 - 主要接口
   * @param labels 标签数组
   * @returns 处理后的标签数组（已更新visible属性）
   */
  public detectCollisions(labels: LabelInfo[]): LabelInfo[] {
    // 如果标签数量为0或1，直接返回
    if (labels.length <= 1) {
      for (let i = 0; i < labels.length; i++) {
        labels[i].visible = true;
      }
      return labels;
    }

    // 确保四叉树已初始化
    if (this.enableQuadtree && !this.quadTree) {
      // 自动估算屏幕边界（使用最大坐标）
      let maxX = 0;
      let maxY = 0;

      for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        maxX = Math.max(maxX, label.x + label.width);
        maxY = Math.max(maxY, label.y + label.height);
      }

      this.setScreenBounds(maxX + 100, maxY + 100); // 加一些边距
    }

    // 选择合适的检测算法
    let visibleSet: Set<string>;

    if (this.enableQuadtree && labels.length > 100) {
      // 对于大量标签，使用四叉树加速
      visibleSet = this.quadtreeBasedCollisionDetection(labels);
    } else {
      // 对于少量标签，使用网格算法
      visibleSet = this.gridBasedCollisionDetection(labels);
    }

    // 更新可见性
    for (let i = 0; i < labels.length; i++) {
      labels[i].visible = visibleSet.has(labels[i].id);
    }

    return labels;
  }

  /**
   * 批量添加标签（性能优化）
   */
  public batchDetectCollisions(
    labels: LabelInfo[],
    batchSize: number = 100,
  ): LabelInfo[] {
    if (labels.length <= batchSize) {
      return this.detectCollisions(labels);
    }

    // 分批处理
    const batches: LabelInfo[][] = [];
    for (let i = 0; i < labels.length; i += batchSize) {
      batches.push(labels.slice(i, i + batchSize));
    }

    // 每批独立检测
    const allVisible = new Set<string>();
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const visibleSet = this.enableQuadtree
        ? this.quadtreeBasedCollisionDetection(batch)
        : this.gridBasedCollisionDetection(batch);

      visibleSet.forEach((id) => allVisible.add(id));
    }

    // 更新可见性
    for (let i = 0; i < labels.length; i++) {
      labels[i].visible = allVisible.has(labels[i].id);
    }

    return labels;
  }

  /**
   * 更新配置选项
   */
  public updateOptions(options: Partial<CollisionDetectorOptions>): void {
    if (options.padding !== undefined) {
      this.padding = options.padding;
    }
    if (options.prioritizeCloser !== undefined) {
      this.prioritizeCloser = options.prioritizeCloser;
    }
    if (options.maxOverlapRatio !== undefined) {
      this.maxOverlapRatio = options.maxOverlapRatio;
    }
    if (options.enableQuadtree !== undefined) {
      this.enableQuadtree = options.enableQuadtree;
    }
    if (options.quadtreeMaxDepth !== undefined) {
      this.quadtreeMaxDepth = options.quadtreeMaxDepth;
    }
    if (options.quadtreeNodeCapacity !== undefined) {
      this.quadtreeNodeCapacity = options.quadtreeNodeCapacity;
    }

    // 如果启用了四叉树且屏幕边界已知，重新初始化
    if (this.enableQuadtree && this.screenBounds.width > 0) {
      this.quadTree = new QuadTreeNode(
        this.screenBounds,
        this.quadtreeNodeCapacity,
        this.quadtreeMaxDepth,
      );
    }
  }

  /**
   * 获取当前配置
   */
  public getOptions(): CollisionDetectorOptions {
    return {
      padding: this.padding,
      prioritizeCloser: this.prioritizeCloser,
      maxOverlapRatio: this.maxOverlapRatio,
      enableQuadtree: this.enableQuadtree,
      quadtreeMaxDepth: this.quadtreeMaxDepth,
      quadtreeNodeCapacity: this.quadtreeNodeCapacity,
    };
  }
}
