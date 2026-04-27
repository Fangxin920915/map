import { SourceParams } from "../Interfaces/IBasemapCollection";

export abstract class BasemapLayerAbstract {
  protected config?: SourceParams | null;

  protected nativeLayer: any; // 原生图层对象

  protected map: any; // 地图实例

  constructor(config: SourceParams, map: any) {
    this.config = { ...config };
    this.map = map;
    this.nativeLayer = this.createNativeLayer();
  }

  // 获取原生图层对象
  getNativeLayer(): any {
    return this.nativeLayer;
  }

  getConfig() {
    return this.config;
  }

  // 获取图层ID
  getId() {
    return this.config?.id;
  }

  // 获取图层类型
  getType() {
    return this.config?.type;
  }

  // 创建原生图层（抽象方法，由子类实现）
  protected abstract createNativeLayer(): any;

  // 更新图层参数
  abstract updateParams(config: SourceParams): void;

  // 设置zIndex并同步到原生图层
  abstract setZIndex(zIndex: number): void;

  // 获取当前zIndex
  getZIndex(): number {
    return this.config?.zIndex ?? 0;
  }

  abstract setVisible(visible: boolean): void;

  getVisible() {
    return this.config?.visible;
  }

  abstract setAlpha(alpha: number): void;

  getAlpha() {
    return this.config?.alpha;
  }

  // 移除图层
  abstract remove(): void;
}
