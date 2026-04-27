import * as Cesium from "cesium";
import { ITerrain, TerrainParams } from "@gdu-gl/common";

export default class Terrain implements ITerrain {
  private _viewer: Cesium.Viewer;

  private _terrainProvider: Cesium.CesiumTerrainProvider | null = null;

  private _ellipsoidTerrainProvider: Cesium.EllipsoidTerrainProvider | null;

  constructor(viewer: Cesium.Viewer) {
    this._viewer = viewer;
    this._ellipsoidTerrainProvider = new Cesium.EllipsoidTerrainProvider();
  }

  async changeTerrain(params: TerrainParams) {
    this._terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(
      params.url,
      {
        requestWaterMask: true,
      },
    );
    this._viewer.terrainProvider = this._terrainProvider;
    return this._terrainProvider;
  }

  removeTerrain(): void {
    this._viewer.terrainProvider = this
      ._ellipsoidTerrainProvider as Cesium.EllipsoidTerrainProvider;
  }

  destroy() {
    this.removeTerrain();
    this._terrainProvider = null;
    this._ellipsoidTerrainProvider = null;
  }
}
