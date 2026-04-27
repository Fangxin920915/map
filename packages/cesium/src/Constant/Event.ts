import * as Cesium from "cesium";
import {
  EventName,
  MouseEventCallback,
  MouseMoveEventCallback,
  TileLoadProgressCallback,
} from "@gdu-gl/common";

// 相机事件返回的结构体
export type CameraEventParams = {
  heading: number;
  pitch: number;
  roll: number;
  position: Cesium.Cartesian3;
};

// 相机事件回调函数
type CameraEventCallback = (params: CameraEventParams) => void;

// render函数回调事件
type RenderEventCallback = () => void;

// 各种事件对应的回调函数返回的参数类型
export interface EventData {
  [EventName.CLICK]: MouseEventCallback;
  [EventName.DOUBLE_CLICK]: MouseEventCallback;
  [EventName.CONTEXTMENU]: MouseEventCallback;
  [EventName.MOUSE_DOWN]: MouseEventCallback;
  [EventName.MOUSE_MOVE]: MouseMoveEventCallback;
  [EventName.MOUSE_UP]: MouseEventCallback;
  [EventName.CAMERA_MOVE_START]: CameraEventCallback;
  [EventName.CAMERA_MOVING]: CameraEventCallback;
  [EventName.CAMERA_MOVE_END]: CameraEventCallback;
  [EventName.POST_RENDER]: RenderEventCallback;
  [EventName.PRE_RENDER]: RenderEventCallback;
  [EventName.READY]: (viewer: Cesium.Viewer) => void;
  [EventName.TILE_LOAD_PROGRESS]: TileLoadProgressCallback;
}
