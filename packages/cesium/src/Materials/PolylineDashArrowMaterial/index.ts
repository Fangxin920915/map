import * as Cesium from "cesium";
import glsl from "./PolylineDashArrow.glsl?raw";

class PolylineDashArrowMaterial {
  _material = Cesium.Material as any;

  constructor() {
    this._material.PolylineDashArrowMaterialType = "PolylineDashArrow";
  }

  init() {
    this._material._materialCache.addMaterial(
      this._material.PolylineDashArrowMaterialType,
      {
        fabric: {
          type: this._material.PolylineDashArrowMaterialType,
          uniforms: {
            color: Cesium.Color.fromCssColorString("yellow"),
            gapColor: new Cesium.Color(0.0, 0.0, 0.0, 0.0),
            dashLength: 16.0,
            dashPattern: 255.0,
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

export default new PolylineDashArrowMaterial();
