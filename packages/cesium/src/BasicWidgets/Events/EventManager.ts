import {
  EventManagerAbstract,
  IEventImp,
  IViewerDelegateImp,
} from "@gdu-gl/common";
import MouseEvent from "./MouseEvent";
import CameraEvent from "./CameraEvent";
import RenderEvent from "./RenderEvent";
import CustomEvent from "./CustomEvent";

export default class EventManager extends EventManagerAbstract {
  protected cameraEvent: IEventImp;

  protected mouseEvent: IEventImp;

  protected renderEvent: IEventImp;

  protected customEvent: IEventImp;

  constructor(viewer: IViewerDelegateImp) {
    super(viewer.mapProviderDelegate);
    this.cameraEvent = new CameraEvent(viewer);
    this.mouseEvent = new MouseEvent(viewer);
    this.renderEvent = new RenderEvent(viewer);
    this.customEvent = new CustomEvent();
  }
}
