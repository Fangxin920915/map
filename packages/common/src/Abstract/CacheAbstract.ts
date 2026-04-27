import { BaseCacheImp } from "../Interfaces";
/**
 * 抽象缓存类
 * @typeParam T - 缓存项类型
 */
export abstract class CacheAbstract<T> implements BaseCacheImp<T> {
  featureCache: Map<string, T>; // 修复属性名与接口一致

  constructor() {
    this.featureCache = new Map();
  }

  addFeatureToCache(featureId: string, featureCacheItem: T): void {
    this.featureCache.set(featureId, featureCacheItem);
  }

  hasFeatureCache(featureId: string): boolean {
    return this.featureCache.has(featureId);
  }

  removeFeatureToCache(featureId: string): void {
    this.featureCache.delete(featureId);
  }

  // 修复方法参数类型为泛型T
  updateFeatureCache(featureId: string, featureCacheItem: T): void {
    this.featureCache.set(featureId, featureCacheItem);
  }

  getFeatureCache(featureId: string): T | undefined {
    return this.featureCache.get(featureId);
  }
}
