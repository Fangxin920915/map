import * as Cesium from "cesium";
import glsl from "./OutlineDashLineString.glsl?raw";

class OutlineDashLineStringMaterial {
  _material = Cesium.Material as any;

  constructor() {
    this._material.OutlineDashLineStringType = "OutlineDashLineString";
  }

  init() {
    this._material._materialCache.addMaterial(
      this._material.OutlineDashLineStringType,
      {
        fabric: {
          type: this._material.OutlineDashLineStringType,
          uniforms: {
            color: Cesium.Color.fromCssColorString("#00DB8D"),
            outlineColor: Cesium.Color.fromCssColorString("#0C4B3A"),
            outlineWidth: 1.2,
            gapColor: new Cesium.Color(0.0, 0.0, 0.0, 0.0),
            dashLength: 16.0,
            dashPattern: 255.0,
          },
          source: glsl,
        },
        translucent(material: any) {
          return material.uniforms.color.alpha < 1.0;
        },
      },
    );
  }
}

export default new OutlineDashLineStringMaterial();
