import { CacheAbstract, Feature, FeatureCacheItem } from "@gdu-gl/common";
import { CesiumFeatureImp } from "../../Types/IGeometryImp";

/**
 * 要素缓存
 * 存储要素与几何图元关系
 */
export default class FeatureCache
  extends CacheAbstract<FeatureCacheItem>
  implements CesiumFeatureImp
{
  updateFeatureCombinePrimitiveId(featureId: string, primitiveId?: string) {
    const featureCache = this.getFeatureCache(featureId);
    if (featureCache) {
      featureCache.combinePrimitiveId = primitiveId;
    }
  }

  getLayerIdByInstanceId(instanceId: string): string | undefined {
    if (instanceId) {
      // eslint-disable-next-line no-restricted-syntax
      for (const [, value] of this.featureCache.entries()) {
        if (value.instancesIds.includes(instanceId)) {
          return value.layerId; // 返回匹配的键
        }
      }
      return undefined;
    }
  }

  getFeatureIdByInstanceId(instanceId: string): Feature | undefined {
    if (instanceId) {
      // eslint-disable-next-line no-restricted-syntax
      for (const [, value] of this.featureCache.entries()) {
        if (value.instancesIds.includes(instanceId)) {
          return value.feature; // 返回匹配的键
        }
      }
      return undefined;
    }
  }
}
