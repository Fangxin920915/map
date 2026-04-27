import { Feature } from "./IGeojson";
import { ModelFeature } from "./IModel";

/**
 * feature缓存
 */
export type FeatureCacheItem = {
  /**
   * 要素id
   */
  featureId: string;
  /**
   * 图元id
   */
  primitiveId: string;
  /**
   * 桶id
   */
  bucketId: string;
  /**
   * 材质id
   */
  materialId: string;
  /**
   * 几何类型
   */
  geometryType: string;
  /**
   * 要素
   */
  feature: Feature;
  /**
   * 合并图源id
   */
  combinePrimitiveId?: string;
  /**
   * 几何实例id集合
   * 一个要素下可能存在多个几何体
   */
  instancesIds: Array<string>;
  /**
   * 图层id
   */
  layerId: string;
};
/**
 * 模型缓存
 */
export type ModelCacheItem = {
  /**
   * 模型id
   */
  modelId: string;
  /**
   * 模型
   */
  modelFeature: ModelFeature;
  /**
   * 图层id
   */
  layerId: string;
};

/**
 * 要素缓存集合
 * 存储要素与几何图元关系
 */
export interface BaseCacheImp<T = any> {
  featureCache: Map<string, T>;

  /**
   * 添加要素到缓存
   * @param featureId 要素ID
   * @param item 要素缓存项
   */
  addFeatureToCache(featureId: string, item: T): void;

  /**
   * 从缓存中移除要素
   * @param featureId 要素ID
   */
  removeFeatureToCache(featureId: string): void;

  /**
   * 更新缓存中的要素
   * @param featureId 要素ID
   * @param item 新的要素缓存项
   */
  updateFeatureCache(featureId: string, item: T): void;

  /**
   * 通过要素ID获取缓存项
   * @param featureId 要素ID
   * @returns 要素缓存项或undefined
   */
  getFeatureCache(featureId: string): T | undefined;

  hasFeatureCache(featureId: string): boolean;
}

/**
 * 要素缓存接口
 */
export interface FeatureCacheImp extends BaseCacheImp<FeatureCacheItem> {
  /**
   * 通过实例ID获取图层ID
   * @param instanceId 实例ID
   * @returns 图层ID或undefined
   */
  getLayerIdByInstanceId(instanceId: string): string | undefined;
  /**
   * 通过实例ID获取要素ID
   * @param instanceId 实例ID
   * @returns 要素ID或undefined
   */
  getFeatureIdByInstanceId(instanceId: string): Feature | undefined;
}
/**
 * 模型缓存接口
 */
export interface ModelCacheImp extends BaseCacheImp<ModelCacheItem> {
  getLayerIdByModelId(modelId: string): string | undefined;
  getFeatureIdByModelId(modelId: string): ModelFeature | undefined;
}
