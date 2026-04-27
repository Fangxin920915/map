import {
  EngineType,
  ModelFeatureCollection,
  ModelLayerImp,
  IModelManagerImp,
  IModelDelegateImp,
  ModelType,
  ModelCacheImp,
  IViewerDelegateImp,
} from "@gdu-gl/common";

import { ModelManager as CesiumModelManager } from "@gdu-gl/cesium";

export default class ModelManager implements IModelDelegateImp {
  private _modelManager: IModelManagerImp | undefined;

  public featureCache: ModelCacheImp | undefined;

  constructor() {
    this._modelManager = undefined;
  }

  /**
   * 模型图层集合
   */
  get layerCollection() {
    return this._modelManager?.layerCollection as ModelLayerImp[];
  }

  /**
   * 模型管理器
   */
  get modelManager() {
    return this._modelManager;
  }

  init(type: EngineType, viewer: IViewerDelegateImp) {
    if (!viewer.mapProviderDelegate.map) {
      return;
    }
    this._modelManager = this.getClassByEngineType(type, viewer);
    this.featureCache = this._modelManager.featureCache as ModelCacheImp;
  }

  destroy() {
    if (this._modelManager) {
      this._modelManager.destroy();
    }
  }

  getClassByEngineType(
    _engineType: EngineType,
    viewer: IViewerDelegateImp,
  ): IModelManagerImp {
    return new CesiumModelManager(viewer);
  }

  addLayer(layerId: string, feature: ModelFeatureCollection): boolean {
    if (this._modelManager) {
      this._modelManager.addLayer(layerId, feature);
    }
    return false;
  }

  getLayer(layerId: string): ModelLayerImp | undefined {
    if (this._modelManager) {
      return this._modelManager.getLayer(layerId);
    }
  }

  removeLayer(layerId: string): void {
    if (this._modelManager) {
      this._modelManager.removeLayer(layerId);
    }
  }

  removeAll() {
    if (this._modelManager) {
      this._modelManager.removeAll();
    }
  }

  getCollection(type: ModelType) {
    console.log("getCollection", type);
  }
}
