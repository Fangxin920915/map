import { Feature } from "@gdu-gl/common";

export interface ClusterImp {
  addClusterItem(item: Feature): void;
  removeClusterItem(): void;
  updateClusterItem(): void;
  getClusterItem(): void;
}
export interface ClusterItem {
  id: string;
  instancesIds: string[];
  position: number[];
  count: number;
  boundingRect: [number, number, number, number];
}
