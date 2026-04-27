import {
  IModelManagerImp,
  IViewerDelegateImp,
  ModelFeatureCollection,
  ModelType,
  ModelManagerAbstract,
} from "@gdu-gl/common";
import * as Cesium from "cesium";
import ModelLayer from "../Layer/ModelLayer";
import ModelCollection from "./ModelCollection";

import ModelCache from "./ModelCache";

export default class ModelManager
  extends ModelManagerAbstract
  implements IModelManagerImp
{
  featureCache: ModelCache;

  private viewer: Cesium.Viewer;

  private modelCollection: ModelCollection;

  constructor(viewer: IViewerDelegateImp) {
    super();

    this.viewer = viewer.mapProviderDelegate.map;
    this.featureCache = new ModelCache();
    this.modelCollection = new ModelCollection({
      featureCache: this.featureCache,
      viewer: this.viewer,
    });
    this.init();
  }

  init(): void {
    this.viewer.scene.primitives.add(this.modelCollection);
  }

  addLayer(layerId: string, feature: ModelFeatureCollection): boolean {
    if (
      Cesium.defined(layerId) &&
      !this.featureCache.hasFeatureCache(layerId)
    ) {
      const layer = new ModelLayer({
        layerId,
        feature,
        manager: this,
      });
      this.layerCollection.push(layer);
      return true;
    }
    return false;
  }

  getCollection(type: ModelType): ModelCollection {
    switch (type) {
      default:
        return this.modelCollection;
    }
  }

  destroy(): void {
    super.destroy();
    Cesium.destroyObject(this);
  }
}
