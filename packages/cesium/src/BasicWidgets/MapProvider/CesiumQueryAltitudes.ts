import * as Cesium from "cesium";
import {
  IQueryAltitudes,
  isValidCoordinates,
  PointCoordinates,
} from "@gdu-gl/common";

export class CesiumQueryAltitudes implements IQueryAltitudes {
  private _viewer: Cesium.Viewer; // Cesium Viewer实例

  constructor(viewer: Cesium.Viewer) {
    this._viewer = viewer;
  }

  getHeight(coordinates: PointCoordinates): number {
    const [lon, lat] = isValidCoordinates(coordinates);
    const cartographic = Cesium.Cartographic.fromDegrees(lon, lat);
    // @ts-ignore
    return this._viewer.scene.getHeight(
      cartographic,
      Cesium.HeightReference.CLAMP_TO_GROUND,
    );
  }
}
