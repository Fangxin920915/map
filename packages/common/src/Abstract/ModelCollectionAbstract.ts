import { merge } from "lodash-es";
import {
  ModelCacheImp,
  ModelFeature,
  ModelCollectionImp,
  ModelImp,
  IModelManagerImp,
} from "../Interfaces";

export abstract class ModelCollectionAbstract<
  M extends ModelImp,
  G extends IModelManagerImp,
  F extends ModelCacheImp,
> implements ModelCollectionImp
{
  /** 模型缓存管理器，用于存储模型关联信息 */
  protected featureCache: F;

  /** 存储所有模型实例的容器 */
  protected _modelStore: M[];

  /**
   * 模型管理器
   */
  protected modelManager: G;

  /**
   * 构造函数，初始化缓存和模型存储容器
   * @param options
   */
  constructor(options: { featureCache: F; modelManager: G }) {
    this.featureCache = options.featureCache;
    this._modelStore = [];
    this.modelManager = options.modelManager;
  }

  /**
   * 抽象方法：创建模型实例
   * 由子类根据具体引擎特性创建模型
   * @param feature 模型特征数据
   * @param layerId 图层ID
   * @param collection
   * @returns 模型实例
   */
  protected abstract createModel(
    feature: ModelFeature,
    layerId: string,
    collection: ModelCollectionImp,
  ): M;
  addModel(layerId: string, modelFeature: ModelFeature): void {
    if (modelFeature && layerId) {
      const model = this.createModel(modelFeature, layerId, this);
      this._modelStore.push(model);
      this.featureCache.addFeatureToCache(modelFeature.properties.id, {
        modelId: model.bucketId,
        layerId,
        modelFeature,
      });
    }
  }

  abstract update(frameState: any): void;
  /**
   * 从集合中移除模型
   * 通用逻辑：查找缓存 -> 定位模型 -> 销毁模型 -> 清理容器和缓存
   * @param featureId 模型特征ID
   */
  removeModel(featureId: string): void {
    const cacheItem = this.featureCache.getFeatureCache(featureId);
    if (!cacheItem) return;

    const modelIndex = this._getModelIndex(cacheItem.modelId);
    if (modelIndex === -1) return;

    this._modelStore[modelIndex].destroy();
    this._modelStore.splice(modelIndex, 1);
    this.featureCache.removeFeatureToCache(featureId);
  }

  /**
   * 查找模型在存储容器中的索引
   * @param modelId 模型ID
   * @returns 索引位置（-1表示未找到）
   */
  protected _getModelIndex(modelId: string): number {
    return this._modelStore.findIndex((model) => model.bucketId === modelId);
  }

  /**
   * 根据模型ID获取模型实例
   * @param id 模型ID
   * @returns 模型实例（undefined表示未找到）
   */
  getModel(id: string): M | undefined {
    return this._modelStore.find((model) => model.bucketId === id);
  }

  updateModelMatrix(id: string, modelFeature: ModelFeature): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const model = this.getModel(id);
      if (model) {
        model.updateModelMatrix(modelFeature);
      }
    }
  }

  updateAppearanceProperties(
    id: string,
    appearanceProperties: ModelFeature["properties"]["appearanceProperties"],
  ): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const model = this.getModel(id);
      if (model) {
        const { modelFeature } = featureCache;
        modelFeature.properties.appearanceProperties = {
          ...modelFeature.properties.appearanceProperties,
          ...appearanceProperties,
        };
        model.updateAppearanceProperties(modelFeature);
      }
    }
  }

  updateOutlineProperties(
    id: string,
    outlineProperties?: ModelFeature["properties"]["outlineProperties"],
  ): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const model = this.getModel(id);
      if (model) {
        const { modelFeature } = featureCache;
        modelFeature.properties.outlineProperties = {
          ...modelFeature.properties.outlineProperties,
          ...outlineProperties,
        };
        model.updateOutlineProperties(modelFeature);
      }
    }
  }

  updateAttributesProperties(
    id: string,
    attributesProperties: ModelFeature["properties"]["attributesProperties"],
  ): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const model = this.getModel(id);
      if (model) {
        const { modelFeature } = featureCache;
        modelFeature.properties.attributesProperties = {
          ...modelFeature.properties.attributesProperties,
          ...attributesProperties,
        };
        model.updateAttributesProperties(modelFeature);
      }
    }
  }

  updateHeightReferenceProperties(
    id: string,
    heightReferenceProperties: ModelFeature["properties"]["heightReferenceProperties"],
  ): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const model = this.getModel(id);
      if (model) {
        const { modelFeature } = featureCache;
        modelFeature.properties.heightReferenceProperties = {
          ...modelFeature.properties.heightReferenceProperties,
          ...heightReferenceProperties,
        };
        model.updateHeightReferenceProperties(modelFeature);
      }
    }
  }

  updateAnimationProperties(
    id: string,
    animateProperties: ModelFeature["properties"]["animateProperties"],
  ): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const model = this.getModel(id);
      if (model) {
        const { modelFeature } = featureCache;
        if (modelFeature.properties.animateProperties) {
          modelFeature.properties.animateProperties = {
            ...modelFeature.properties.animateProperties,
            ...animateProperties,
          };
        } else {
          modelFeature.properties.animateProperties = animateProperties;
        }
        model.updateAnimationProperties(modelFeature);
      }
    }
  }

  updatePrimitiveProperties(
    id: string,
    primitiveProperties: ModelFeature["properties"]["primitiveProperties"],
  ): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const model = this.getModel(id);
      if (model) {
        const { modelFeature } = featureCache;
        merge(modelFeature.properties.primitiveProperties, primitiveProperties);
        model.updatePrimitiveProperties(modelFeature);
      }
    }
  }

  updateTilesetProperties(
    id: string,
    tilesetProperties: ModelFeature["properties"]["tilesetProperties"],
  ): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const model = this.getModel(id);
      if (model) {
        const { modelFeature } = featureCache;
        merge(modelFeature.properties.tilesetProperties, tilesetProperties);
        model.updateTilesetProperties(modelFeature);
      }
    }
  }

  destroy(): void {
    this._modelStore.forEach((model) => {
      model.destroy();
    });
  }
}
