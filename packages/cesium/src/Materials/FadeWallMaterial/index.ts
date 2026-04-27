import * as Cesium from "cesium";
import glsl from "./FadeWall.glsl?raw";

class FadeWallMaterial {
  _material = Cesium.Material as any;

  constructor() {
    this._material.FadeWallMaterialType = "FadeWall";
  }

  init() {
    this._material._materialCache.addMaterial(
      this._material.FadeWallMaterialType,
      {
        fabric: {
          type: this._material.FadeWallMaterialType,
          uniforms: {
            fadeInColor: Cesium.Color.fromCssColorString("#00DB8D"),
            fadeOutColor: Cesium.Color.TRANSPARENT,
          },
          source: glsl,
        },
        translucent(material: any) {
          return (
            material.uniforms.fadeInColor.alpha < 1.0 ||
            material.uniforms.fadeOutColor.alpha < 1.0
          );
        },
      },
    );
  }
}

export default new FadeWallMaterial();
