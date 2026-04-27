import gcoord from "gcoord";
import * as Cesium from "cesium";

export default class GCJ02TilingScheme extends Cesium.WebMercatorTilingScheme {
  [key: string]: any;

  constructor(options?: any) {
    super(options);
    const projection = new Cesium.WebMercatorProjection();
    this._projection.project = (cartographic: any, result: any) => {
      // WGS84转GCJ02坐标
      result = gcoord.transform(
        [
          Cesium.Math.toDegrees(cartographic.longitude),
          Cesium.Math.toDegrees(cartographic.latitude),
        ],
        gcoord.WGS84,
        gcoord.GCJ02,
      );
      result = projection.project(
        new Cesium.Cartographic(
          Cesium.Math.toRadians(result[0]),
          Cesium.Math.toRadians(result[1]),
        ),
      );
      return new Cesium.Cartesian2(result.x, result.y);
    };
    this._projection.unproject = (cartesian: any, result: any) => {
      const cartographic = projection.unproject(cartesian);
      // GCJ02转WGS84坐标
      result = gcoord.transform(
        [
          Cesium.Math.toDegrees(cartographic.longitude),
          Cesium.Math.toDegrees(cartographic.latitude),
        ],
        gcoord.GCJ02,
        gcoord.WGS84,
      );

      return new Cesium.Cartographic(
        Cesium.Math.toRadians(result[0]),
        Cesium.Math.toRadians(result[1]),
      );
    };
  }
}
