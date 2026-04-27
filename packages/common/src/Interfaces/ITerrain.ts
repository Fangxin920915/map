import { IBase } from "./IBase";

export type TerrainParams = {
  url: string | Promise<any>;
};

export interface ITerrain extends Pick<IBase, "destroy"> {
  changeTerrain(params: TerrainParams): Promise<any>;
  removeTerrain(): void;
  destroy(): void;
}
