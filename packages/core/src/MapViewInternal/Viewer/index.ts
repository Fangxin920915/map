import {
  EngineType,
  IBasemapDelegateImp,
  ICameraDelegateImp,
  IEventDelegateImp,
  IGeometryDelegateImp,
  IMapProviderDelegateImp,
  IViewerDelegateImp,
  IVectorLayerImp,
  IWidgetDelegateImp,
  IModelDelegateImp,
  ViewerOptions,
} from "@gdu-gl/common";

import Camera from "../Camera/index";
import MapProvider from "../MapProvider/index";
import GeometryManager from "../Geometry/index";
import Events from "../Events/index";
import Basemaps from "../Basemaps/index";
import WidgetsManager from "../Widgets/index";
import ModelManager from "../Model/index";

export default class Viewer implements IViewerDelegateImp {
  private readonly _mapProviderDelegate: IMapProviderDelegateImp;

  private readonly _basemapsDelegate: IBasemapDelegateImp;

  private readonly _cameraDelegate: ICameraDelegateImp;

  private readonly _eventsDelegate: IEventDelegateImp;

  private readonly _geometryManagerDelegate: IGeometryDelegateImp;

  viewerId: string;

  engineType: EngineType;

  /**
   * 视图初始化参数
   */
  options: ViewerOptions;

  private _vectorLayer?: IVectorLayerImp;

  private readonly _modelManagerDelegate: IModelDelegateImp;

  private readonly _widgetsDelegate: IWidgetDelegateImp;

  constructor(options: ViewerOptions) {
    this.viewerId = options.viewerId;
    this.engineType = options.engineType;
    this.options = options;
    this._mapProviderDelegate = new MapProvider();
    this._eventsDelegate = new Events();
    this._basemapsDelegate = new Basemaps();
    this._cameraDelegate = new Camera();
    this._geometryManagerDelegate = new GeometryManager();
    this._modelManagerDelegate = new ModelManager();

    // this._samplerHeightWidget = new SamplerHeightWidget();
    this._vectorLayer = undefined;
    this._widgetsDelegate = new WidgetsManager();
  }

  get geometryManagerDelegate() {
    if (!this._geometryManagerDelegate) {
      throw Error("几何控制器未初始化");
    }
    return this._geometryManagerDelegate;
  }

  get widgetsDelegate() {
    if (!this._widgetsDelegate) {
      throw Error("小部件对象未初始化");
    }
    return this._widgetsDelegate;
  }

  get basemapsDelegate() {
    if (!this._basemapsDelegate) {
      throw Error("底图对象未初始化");
    }
    return this._basemapsDelegate;
  }

  get eventsDelegate() {
    if (!this._eventsDelegate) {
      throw Error("事件对象未初始化");
    }
    return this._eventsDelegate;
  }

  get mapProviderDelegate() {
    if (!this._mapProviderDelegate) {
      throw Error("场景对象未初始化");
    }
    return this._mapProviderDelegate;
  }

  get cameraDelegate() {
    if (!this._cameraDelegate) {
      throw Error("相机对象未初始化");
    }
    return this._cameraDelegate;
  }

  get vectorLayer() {
    return this._vectorLayer;
  }

  get modelManagerDelegate() {
    return this._modelManagerDelegate;
  }

  async init() {
    await this.mapProviderDelegate.init(this.engineType, this.options);
    this._eventsDelegate.init(this.engineType, this);
    this._widgetsDelegate.init(this.engineType, this);
    this._modelManagerDelegate.init(this.engineType, this);
    this._geometryManagerDelegate.init(this.engineType, this);
    this._geometryManagerDelegate.addLayer("__globe_vector__", {
      type: "FeatureCollection",
      features: [],
    });

    this._vectorLayer =
      this._geometryManagerDelegate.getLayer("__globe_vector__");
    this.basemapsDelegate.init(this.engineType, this.mapProviderDelegate);
    this.cameraDelegate.init(this.engineType, this.mapProviderDelegate);
  }

  destroy() {
    this._modelManagerDelegate.destroy();
    this._widgetsDelegate.destroy();
    this._geometryManagerDelegate?.destroy();
    this._cameraDelegate?.destroy();
    this._basemapsDelegate?.destroy();
    this._eventsDelegate?.destroy();
    this._mapProviderDelegate?.destroy();
  }
}
