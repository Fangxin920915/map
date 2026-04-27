import { EventBasic, EventName, IViewerDelegateImp } from "@gdu-gl/common";
import * as Cesium from "cesium";

export default class RenderEvent extends EventBasic {
  private map: Cesium.Viewer;

  private _lastProgress: number;

  private _ready: boolean;

  private readonly _tileLoaded = (tileLoadLength: number) => {
    let progress = 0;
    // 如果当前需要加载的瓦片数量为0，表示加载完成
    if (tileLoadLength === 0) {
      progress = 1;
      this._lastProgress = 0;
    }
    // 如果上次记录的瓦片数量小于当前数量，表示有新瓦片需要加载
    else if (this._lastProgress < tileLoadLength) {
      progress = 0;
      this._lastProgress = tileLoadLength;
    }
    // 如果上次记录的瓦片数量为0，表示加载完成
    else if (this._lastProgress === 0) {
      progress = 1;
    }
    // 计算加载进度百分比
    else {
      progress = (this._lastProgress - tileLoadLength) / this._lastProgress;
    }

    // 触发事件，传递当前加载进度
    this.triggerListener(EventName.TILE_LOAD_PROGRESS, { progress });
  };

  private readonly _preRender = () => {
    this.triggerListener(EventName.PRE_RENDER);
  };

  private readonly _postRender = () => {
    if (!this._ready) {
      this._ready = true;
      this.triggerListener(EventName.READY);
    }
    this.triggerListener(EventName.POST_RENDER);
  };

  constructor(viewer: IViewerDelegateImp) {
    super();
    this.map = viewer.mapProviderDelegate.map;
    // 绑定事件处理函数的this上下文
    this._lastProgress = 0;
    this._ready = false;
  }

  init(): void {
    this.map.scene.preRender.addEventListener(this._preRender);
    this.map.scene.postRender.addEventListener(this._postRender);
    this.map.scene.globe.tileLoadProgressEvent.addEventListener(
      this._tileLoaded,
    );
  }

  destroy(): void {
    super.destroy();
    this.map.scene.preRender.removeEventListener(this._preRender);
    this.map.scene.postRender.removeEventListener(this._postRender);
    this.map.scene.globe.tileLoadProgressEvent.removeEventListener(
      this._tileLoaded,
    );
  }
}
