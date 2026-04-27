import {
  BasemapCollectionAbstract,
  IMapProviderImp,
  ITerrain,
  SourceParams,
  TerrainParams,
} from "@gdu-gl/common";
import Terrain from "@cesium-engine/BasicWidgets/Basemaps/Layers/Terrain";
import * as Cesium from "cesium";
import { CesiumBasemapLayer } from "./Layers/CesiumBasemapLayer";

export default class BasemapCollection extends BasemapCollectionAbstract {
  declare _map: Cesium.Viewer;

  private terrain: ITerrain;

  constructor(mapProvider: IMapProviderImp) {
    super(mapProvider);
    this.terrain = new Terrain(mapProvider.map);
  }

  add(params: SourceParams): CesiumBasemapLayer {
    if (this.layers.has(params.id)) {
      throw new Error(`图层已存在，请勿重复添加`);
    }
    const layer = new CesiumBasemapLayer(params, this._map);
    this.layers.set(params.id, layer);
    return layer;
  }

  changeTerrain(params: TerrainParams): Promise<any> {
    return this.terrain?.changeTerrain(params)!;
  }

  removeTerrain() {
    this.terrain?.removeTerrain();
  }

  destroyTerrain(): void {
    this.terrain?.destroy();
  }
}
