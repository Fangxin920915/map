import {
  EngineType,
  IEventManagerImp,
  IEventDelegateImp,
  IViewerDelegateImp,
  EventData,
} from "@gdu-gl/common";
import { EventManager as CesiumEventManager } from "@gdu-gl/cesium";

export default class EventManager implements IEventDelegateImp {
  private _eventManager: IEventManagerImp | undefined;

  constructor() {
    this._eventManager = undefined;
  }

  get eventManager() {
    if (!this._eventManager) {
      throw Error("事件对象未初始化");
    }
    return this._eventManager;
  }

  getClassByEngineType(
    _engineType: EngineType,
    viewer: IViewerDelegateImp,
  ): IEventManagerImp {
    return new CesiumEventManager(viewer);
  }

  addEventListener<K extends keyof EventData>(
    event: K,
    listener: EventData[K],
  ): void {
    this._eventManager?.addEventListener(event, listener);
  }

  removeEventListener<K extends keyof EventData>(
    event: K,
    listener: EventData[K],
  ): void {
    this._eventManager?.removeEventListener(event, listener);
  }

  init(engineType: EngineType, viewer: IViewerDelegateImp): void {
    this._eventManager = this.getClassByEngineType(engineType, viewer);
    this._eventManager?.init();
  }

  destroy(): void {
    this._eventManager?.destroy();
  }
}
