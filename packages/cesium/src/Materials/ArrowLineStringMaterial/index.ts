import * as Cesium from "cesium";
import glsl from "./ArrowLineString.glsl?raw";
import arrow from "../../Assets/arrow.png";

class ArrowLineStringMaterial {
  _material = Cesium.Material as any;

  constructor() {
    this._material.ArrowLineStringType = "ArrowLineString";
  }

  init() {
    this._material._materialCache.addMaterial(
      this._material.ArrowLineStringType,
      {
        fabric: {
          type: this._material.ArrowLineStringType,
          uniforms: {
            color: Cesium.Color.fromCssColorString("#00DB8D"),
            outlineColor: Cesium.Color.fromCssColorString("#0C4B3A"),
            outlineWidth: 1.2,
            progress: 0,
            progressColor: Cesium.Color.fromCssColorString("#8B8C8F"),
            image: arrow,
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

export default new ArrowLineStringMaterial();
