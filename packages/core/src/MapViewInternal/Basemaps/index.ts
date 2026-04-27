import {
  EngineType,
  BasemapCollectionAbstract,
  IBasemapDelegateImp,
  IMapProviderImp,
} from "@gdu-gl/common";
import { BasemapCollection as CesiumBasemapCollection } from "@gdu-gl/cesium";

export default class Basemaps implements IBasemapDelegateImp {
  private _collection?: BasemapCollectionAbstract;

  constructor() {
    this._collection = undefined;
  }

  get basemapCollection() {
    if (!this._collection) {
      throw Error("底图对象未初始化");
    }
    return this._collection;
  }

  init(...params: any[]): void {
    const [engineType, mapProvider] = params;
    if (!mapProvider.map) {
      return;
    }
    this._collection = this.getClassByEngineType(engineType, mapProvider);
  }

  destroy(): void {
    this._collection?.destroy();
    this._collection = undefined;
  }

  getClassByEngineType(
    _engineType: EngineType,
    mapProvider: IMapProviderImp,
  ): BasemapCollectionAbstract {
    return new CesiumBasemapCollection(mapProvider);
  }
}
