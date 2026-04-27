import { EngineType } from "@common/Types";
import { BasemapCollectionAbstract } from "@common/Abstract";
import { IMapProviderImp } from "./IMapProviderImp";
import { IEventManagerImp } from "./IEvent";
import { IGeometryManagerImp, IModelManagerImp } from "./IManager";
import { ICameraManagerImp } from "./ICameraManagerImp";
import { IWidgetDelegateImp } from "./IWidget";
import { IBase, IBaseDelegateImp } from "./IBase";

export interface IMapProviderDelegateImp
  extends Omit<
      IMapProviderImp,
      | "enableDepthTestAgainstTerrain"
      | "enableScrollZoom"
      | "enableDragPan"
      | "enableDragRotate"
      | "enableDebugger"
      | "maxZoom"
      | "minZoom"
    >,
    IBaseDelegateImp<IMapProviderImp> {
  /**
   * 地图服务对象
   */
  mapProvider?: IMapProviderImp;
  ready: boolean;
}

export interface IViewerDelegateImp extends IBase {
  /**
   * 场景对象
   */
  mapProviderDelegate: IMapProviderDelegateImp;
  /**
   * 相机对象
   */
  cameraDelegate: ICameraDelegateImp;
  /**
   * 事件对象
   */
  eventsDelegate: IEventDelegateImp;
  /**
   * 基础地图对象
   */
  basemapsDelegate: IBasemapDelegateImp;
  /**
   * 几何控制器对象
   */
  geometryManagerDelegate: IGeometryDelegateImp;
  /**
   * 模型控制器对象
   */
  modelManagerDelegate: any;
  engineType: EngineType;
  viewerId: string;
  widgetsDelegate: IWidgetDelegateImp;
}

export interface IEventDelegateImp
  extends IEventManagerImp,
    IBase,
    IBaseDelegateImp<IEventManagerImp> {
  eventManager?: IEventManagerImp;
}

export interface ICameraDelegateImp
  extends IBase,
    IBaseDelegateImp<ICameraManagerImp> {
  cameraManager?: ICameraManagerImp;
}

export interface IGeometryDelegateImp
  extends IGeometryManagerImp,
    IBase,
    IBaseDelegateImp<IGeometryManagerImp> {
  geometryManager?: IGeometryManagerImp;
}

export interface IModelDelegateImp
  extends IModelManagerImp,
    IBase,
    IBaseDelegateImp<IModelManagerImp> {
  modelManager?: IModelManagerImp;
}

export interface IBasemapDelegateImp
  extends IBase,
    IBaseDelegateImp<BasemapCollectionAbstract> {
  basemapCollection: BasemapCollectionAbstract;
}
