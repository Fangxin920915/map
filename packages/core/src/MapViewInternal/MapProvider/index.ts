import {
  ViewerOptions,
  EngineType,
  IMapProviderDelegateImp,
  IMapProviderImp,
} from "@gdu-gl/common";
import { CesiumMapProvider } from "@gdu-gl/cesium";

/**
 * 地图场景类
 * 根据不同引擎类型初始化地图场景
 */
export default class MapProvider implements IMapProviderDelegateImp {
  mapProvider?: IMapProviderImp;

  constructor() {
    this.mapProvider = undefined;
  }

  get ready() {
    return !!this.mapProvider?.ready;
  }

  get map() {
    if (!this.mapProvider?.map) {
      throw Error("原生地图对象未创建");
    }
    return this.mapProvider.map;
  }

  get deckOverlay() {
    if (!this.mapProvider?.map) {
      throw Error("原生地图对象未创建");
    }
    return this.mapProvider.deckOverlay;
  }

  async init(type: EngineType, options: ViewerOptions): Promise<void> {
    this.mapProvider = this.getClassByEngineType(type, options);
    return this.mapProvider.init();
  }

  destroy() {
    this.mapProvider?.destroy();
    this.mapProvider = undefined;
  }

  getClassByEngineType(
    _engineType: EngineType,
    options: ViewerOptions,
  ): IMapProviderImp {
    return new CesiumMapProvider(options);
  }
}
