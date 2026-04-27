import { GeoidInstance, ViewerOptions } from "@gdu-gl/common";
import Viewer from "./Viewer";

export class MapViewInternal {
  viewerMap: Map<string, Viewer>;

  private _geoidInstance: GeoidInstance | null = null;

  constructor() {
    this.viewerMap = new Map();
  }

  async createViewer(options: ViewerOptions) {
    if (this.viewerMap.get(options.viewerId)) {
      console.error(`${options.viewerId}已被占用，请勿重复创建`);
      return null;
    }
    const viewer = new Viewer(options);
    this.viewerMap.set(viewer.viewerId, viewer);
    await viewer.init();
    return viewer;
  }

  get geoid() {
    if (!this._geoidInstance) {
      throw Error("大地水准面未初始化");
    }
    return this._geoidInstance;
  }

  getViewer(viewerId: string) {
    return this.viewerMap.get(viewerId);
  }

  async initGeoidInstance() {
    this._geoidInstance = await GeoidInstance.getInstance();
  }

  destroyViewer(viewerId: string) {
    const view = this.getViewer(viewerId);
    if (view) {
      this.viewerMap.delete(viewerId);
      view.destroy();
    }

    if (!this.viewerMap.size) {
      GeoidInstance.destroy();
    }
  }
}

const mapViewInternal = new MapViewInternal();

export default mapViewInternal;
