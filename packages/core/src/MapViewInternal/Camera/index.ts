import {
  EngineType,
  ICameraDelegateImp,
  ICameraManagerImp,
  IMapProviderDelegateImp,
} from "@gdu-gl/common";

import { CameraController as CesiumCameraController } from "@gdu-gl/cesium";

export default class CameraManager implements ICameraDelegateImp {
  private _camera: ICameraManagerImp | undefined;

  constructor() {
    this._camera = undefined;
  }

  get cameraManager() {
    if (!this._camera) {
      throw Error("相机对象未初始化");
    }
    return this._camera;
  }

  init(type: EngineType, mapProvider: IMapProviderDelegateImp) {
    if (!mapProvider.map) {
      return;
    }
    this._camera = this.getClassByEngineType(type, mapProvider);
  }

  destroy() {
    this._camera?.destroy();
    this._camera = undefined;
  }

  getClassByEngineType(
    _engineType: EngineType,
    mapProvider: IMapProviderDelegateImp,
  ): ICameraManagerImp {
    return new CesiumCameraController(mapProvider.map);
  }
}
