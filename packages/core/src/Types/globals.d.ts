import { MapViewInternal } from "../MapViewInternal/MapViewInternal";

declare global {
  interface Window {
    mapViewInternal: MapViewInternal;
  }
}

export {};
