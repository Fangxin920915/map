import {
  CacheAbstract,
  ModelFeature,
  ModelCacheItem,
  ModelCacheImp,
} from "@gdu-gl/common";

export default class ModelCache
  extends CacheAbstract<ModelCacheItem>
  implements ModelCacheImp
{
  getLayerIdByModelId(modelId: string): string | undefined {
    if (modelId) {
      // eslint-disable-next-line no-restricted-syntax
      for (const [, value] of this.featureCache.entries()) {
        if (value.modelId === modelId) {
          return value.layerId; // 返回匹配的键
        }
      }
      return undefined;
    }
  }

  getFeatureIdByModelId(modelId: string): ModelFeature | undefined {
    if (modelId) {
      // eslint-disable-next-line no-restricted-syntax
      for (const [, value] of this.featureCache.entries()) {
        if (value.modelId === modelId) {
          return value.modelFeature; // 返回匹配的键
        }
      }
      return undefined;
    }
  }
}
