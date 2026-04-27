import {
  IEventImp,
  IEventManagerImp,
  IMapProviderDelegateImp,
} from "../Interfaces";
import { EventData, EventName } from "../Types";

export abstract class EventManagerAbstract implements IEventManagerImp {
  protected mapProvider: IMapProviderDelegateImp;

  // 依赖于接口而非具体实现
  protected abstract cameraEvent: IEventImp;

  protected abstract mouseEvent: IEventImp;

  protected abstract renderEvent: IEventImp;

  protected abstract customEvent: IEventImp;

  protected constructor(mapProvider: IMapProviderDelegateImp) {
    this.mapProvider = mapProvider;
  }

  addEventListener<K extends keyof EventData>(
    event: K,
    callback: EventData[K],
  ) {
    switch (event) {
      case EventName.CONTEXTMENU:
      case EventName.CLICK:
      case EventName.MOUSE_DOWN:
      case EventName.DOUBLE_CLICK:
      case EventName.MOUSE_UP:
      case EventName.MOUSE_MOVE:
        this.mouseEvent.addEventListener(event, callback);
        break;
      case EventName.CAMERA_MOVE_END:
      case EventName.CAMERA_MOVE_START:
      case EventName.CAMERA_MOVING:
        this.cameraEvent.addEventListener(event, callback);
        break;
      case EventName.PRE_RENDER:
      case EventName.POST_RENDER:
      case EventName.TILE_LOAD_PROGRESS:
        this.renderEvent.addEventListener(event, callback);
        break;
      default:
        this.customEvent.addEventListener(event, callback);
        break;
    }
  }

  removeEventListener<K extends keyof EventData>(
    event: K,
    callback: EventData[K],
  ) {
    switch (event) {
      case EventName.CONTEXTMENU:
      case EventName.CLICK:
      case EventName.MOUSE_DOWN:
      case EventName.DOUBLE_CLICK:
      case EventName.MOUSE_UP:
      case EventName.MOUSE_MOVE:
        this.mouseEvent.removeEventListener(event, callback);
        break;
      case EventName.CAMERA_MOVE_END:
      case EventName.CAMERA_MOVE_START:
      case EventName.CAMERA_MOVING:
        this.cameraEvent.removeEventListener(event, callback);
        break;
      case EventName.PRE_RENDER:
      case EventName.POST_RENDER:
      case EventName.TILE_LOAD_PROGRESS:
        this.renderEvent.removeEventListener(event, callback);
        break;
      default:
        this.customEvent.removeEventListener(event, callback);
        break;
    }
  }

  init(): void {
    this.cameraEvent.init();
    this.mouseEvent.init();
    this.renderEvent.init();
    this.customEvent.init();
  }

  destroy(): void {
    this.mouseEvent.destroy();
    this.cameraEvent.destroy();
    this.renderEvent.destroy();
    this.customEvent.destroy();
  }
}
