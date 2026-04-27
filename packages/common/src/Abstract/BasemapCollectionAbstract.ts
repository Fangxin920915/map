import { IMapProviderImp } from "@common/Interfaces/IMapProviderImp";
import { TerrainParams } from "@common/Interfaces/ITerrain";
import { SourceParams } from "../Interfaces/IBasemapCollection";
import { BasemapLayerAbstract } from "./BasemapLayerAbstract";

export abstract class BasemapCollectionAbstract {
  _map: any;

  layers: Map<string, BasemapLayerAbstract> = new Map();

  protected constructor(mapProvider: IMapProviderImp) {
    this._map = mapProvider.map;
  }

  abstract add(params: SourceParams): BasemapLayerAbstract;

  remove(id: string): void {
    const layer = this.layers.get(id);
    if (layer) {
      layer.remove();
      this.layers.delete(id);
    }
  }

  getLayer(id: string): BasemapLayerAbstract | undefined {
    return this.layers.get(id);
  }

  getNativeLayer(id: string) {
    const layer = this.layers.get(id);
    return layer?.getNativeLayer();
  }

  updateLayerParams(id: string, params: SourceParams): void {
    const layer = this.layers.get(id);
    if (!layer) {
      return;
    }
    layer.updateParams(params);
  }

  abstract changeTerrain(params: TerrainParams): Promise<any>;

  abstract removeTerrain(): void;

  abstract destroyTerrain(): void;

  destroy(): void {
    this.destroyTerrain();
    this.layers.forEach((layer) => {
      layer.remove();
      this.layers.delete(layer.getId()!);
    });
  }
}
