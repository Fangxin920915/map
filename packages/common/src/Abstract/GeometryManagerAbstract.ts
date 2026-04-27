import {
  FeatureCacheImp,
  FeatureCollection,
  IGeometryManagerImp,
  GeometryType,
  IVectorLayerImp,
} from "../Interfaces";

/**
 * 通用管理器抽象类
 * 提供了基本的图层管理和要素缓存功能
 */
export abstract class GeometryManagerAbstract implements IGeometryManagerImp {
  layerCollection: IVectorLayerImp[];

  abstract featureCache: FeatureCacheImp;

  constructor() {
    this.layerCollection = [];
  }
  /** 初始化方法（平台特定逻辑） */
  abstract init(): void;

  /**
   * 根据几何类型获取集合（实现接口方法）
   * @param type 几何类型
   * @returns 对应几何集合或undefined
   */
  abstract getCollection(type: GeometryType): any;

  /**
   * 添加图层（实现接口方法）
   * @param layerId 图层ID
   * @param features
   * @returns 添加成功状态
   */
  // addLayer(layerId: string, features: FeatureCollection): boolean {
  //   if (layerId && !this.featureCache.hasFeatureCache(layerId)) {
  //     const layer = new VectorLayer({
  //       layerId,
  //       feature: features,
  //       manager: this,
  //     });
  //     this.layerCollection.push(layer);
  //     return true;
  //   }
  //   return false;
  // }
  abstract addLayer(layerId: string, features: FeatureCollection): boolean;

  /**
   * 获取指定图层（实现接口方法）
   * @param layerId 图层ID
   * @returns 图层实例或undefined
   */
  getLayer(layerId: string): IVectorLayerImp | undefined {
    return this.layerCollection.find((layer) => layer.layerId === layerId);
  }

  /**
   * 删除指定图层（实现接口方法）
   * @param layerId 图层ID
   */
  removeLayer(layerId: string): void {
    const layer = this.getLayer(layerId);
    if (layer) {
      layer.destroy();
      const index = this.layerCollection.findIndex(
        (l) => l.layerId === layerId,
      );
      if (index !== -1) {
        this.layerCollection.splice(index, 1);
      }
    }
  }

  /** 删除所有图层（实现接口方法） */
  removeAll(): void {
    this.layerCollection
      .map((l) => l.layerId)
      .forEach((id) => this.removeLayer(id));
  }

  /** 销毁管理器（实现接口方法） */
  destroy(): void {
    this.layerCollection.forEach((layer) => layer.destroy());
    this.layerCollection = [];
  }
}
