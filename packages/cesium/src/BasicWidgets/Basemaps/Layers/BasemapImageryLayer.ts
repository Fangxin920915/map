import * as Cesium from "cesium";

export default class BasemapImageryLayer extends Cesium.ImageryLayer {
  private _zIndex: number = 0;

  get zIndex() {
    return this._zIndex;
  }

  set zIndex(value: number) {
    this._zIndex = value;
  }

  constructor(
    imageryProvider: Cesium.ImageryProvider,
    options: Cesium.ImageryLayer.ConstructorOptions & {
      zIndex?: number;
    },
  ) {
    super(imageryProvider, options);
    this._zIndex = options.zIndex ?? 1;
  }
}
