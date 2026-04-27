import {
  EngineType,
  FeatureCollection,
  IGeometryManagerImp,
  GeometryType,
  IVectorLayerImp,
  IGeometryDelegateImp,
  IViewerDelegateImp,
} from "@gdu-gl/common";
import {
  FeatureCache,
  GeometryManager as CesiumGeometryManager,
} from "@gdu-gl/cesium";

export default class GeometryManager implements IGeometryDelegateImp {
  private _geometryManager: IGeometryManagerImp | undefined;

  public featureCache: FeatureCache | undefined;

  constructor() {
    this._geometryManager = undefined;
  }

  get geometryManager() {
    if (!this._geometryManager) {
      throw Error("几何控制器未初始化");
    }
    return this._geometryManager;
  }

  get layerCollection() {
    return this._geometryManager?.layerCollection as IVectorLayerImp[];
  }

  init(type: EngineType, viewer: IViewerDelegateImp) {
    this._geometryManager = this.getClassByEngineType(type, viewer);
    this.featureCache = this._geometryManager.featureCache as FeatureCache;
  }

  destroy() {
    if (this._geometryManager) {
      this._geometryManager.destroy();
    }
  }

  getClassByEngineType(
    _engineType: EngineType,
    viewer: IViewerDelegateImp,
  ): IGeometryManagerImp {
    return new CesiumGeometryManager(viewer);
  }

  addLayer(layerId: string, feature: FeatureCollection): boolean {
    if (this._geometryManager) {
      this._geometryManager.addLayer(layerId, feature);
    }
    return false;
  }

  getLayer(layerId: string): IVectorLayerImp | undefined {
    if (this._geometryManager) {
      return this._geometryManager.getLayer(layerId);
    }
  }

  removeLayer(layerId: string): void {
    if (this._geometryManager) {
      this._geometryManager.removeLayer(layerId);
    }
  }

  removeAll() {
    if (this._geometryManager) {
      this._geometryManager.removeAll();
    }
  }

  getCollection(type: GeometryType) {
    console.log(type);
  }
}
