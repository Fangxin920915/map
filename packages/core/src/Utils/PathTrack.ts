import { IDelegate } from "@core/Interfaces";
import {
  EngineType,
  IBase,
  IPathTrack,
  IPathTrackOptions,
} from "@gdu-gl/common";
import { PathTrack as CesiumPathTrack } from "@gdu-gl/cesium";
import Viewer from "../MapViewInternal/Viewer";

export default class PathTrack implements IBase, IDelegate {
  private _track: IPathTrack | null = null;

  get track() {
    if (!this._track) {
      throw new Error("路径跟踪对象未初始化");
    }
    return this._track;
  }

  init(viewer: Viewer, options: IPathTrackOptions) {
    const Track = this.getClassByEngineType(viewer.engineType);
    this._track = new Track(viewer.mapProviderDelegate.map, options);
  }

  destroy() {
    this._track?.destroy();
    this._track = null;
  }

  getClassByEngineType(engineType: EngineType) {
    switch (engineType) {
      default:
        return CesiumPathTrack;
    }
  }
}
