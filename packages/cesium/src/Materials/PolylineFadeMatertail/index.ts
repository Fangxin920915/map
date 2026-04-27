import * as Cesium from "cesium";
import glsl from "./FadePolyline.glsl?raw";

class PolylineFadeMaterial {
  _material = Cesium.Material as any;

  constructor() {
    this._material.PolylineFadeMaterialType = "PolylineFade";
  }

  init() {
    this._material._materialCache.addMaterial(
      this._material.PolylineFadeMaterialType,
      {
        fabric: {
          type: this._material.PolylineFadeMaterialType,
          uniforms: {
            color: Cesium.Color.fromCssColorString("yellow"),
            fadeThreshold: 0.5,
          },
          source: glsl,
        },
        translucent() {
          return true;
        },
      },
    );
  }
}

export default new PolylineFadeMaterial();
