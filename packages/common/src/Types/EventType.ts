// 点击事件返回的结构体
import { Feature, ModelFeature, PointCoordinates } from "@common/Interfaces";

export type MouseEventParams = {
  // 鼠标的经纬度
  coordinates?: PointCoordinates;
  // 鼠标的屏幕位置
  pixel: [number, number];
  // 鼠标拾取的对象
  pickObj?: any;
  // 拾取的feature对象
  feature?: Feature | ModelFeature;
  layerId?: string;
};

// 定义事件名称的枚举
export enum EventName {
  /** 点击 */
  CLICK = "click",
  /** 双击 */
  DOUBLE_CLICK = "dblclick",
  /** 右键 */
  CONTEXTMENU = "contextmenu",

  /** 鼠标按下 */
  MOUSE_DOWN = "mouseDown",
  /** 鼠标移动 */
  MOUSE_MOVE = "mouseMove",
  /** 鼠标抬起 */
  MOUSE_UP = "mouseUp",

  /** 相机开始移动 */
  CAMERA_MOVE_START = "cameraMoveStart",
  /** 相机移动中 */
  CAMERA_MOVING = "cameraMoving",
  /** 相机移动结束 */
  CAMERA_MOVE_END = "cameraMoveEnd",

  /** 每帧渲染之前 */
  PRE_RENDER = "preRender",
  /** 每帧渲染之后 */
  POST_RENDER = "postRender",
  /** 地图瓦片加载完成 */
  TILE_LOAD_PROGRESS = "tileLoadProgress",
  READY = "ready",
}

// 点击事件返回的结构体
// export type MouseEventParams = {
//   // 鼠标的经纬度
//   coordinates?: number[];
//   // 鼠标的屏幕位置
//   pixel: {
//     x: number;
//     y: number;
//   };
// };

// 相机事件返回的结构体
export type CameraEventParams = {
  heading: number;
  pitch: number;
  roll: number;
  coordinates?: PointCoordinates;
  zoom: number;
  is2dMode: boolean;
};

export type TileLoadProgressParams = {
  progress: number;
};

// 自定义事件回调函数
export type CustomEventCallback = (...args: any[]) => void;

// 点击事件回调函数
export type MouseEventCallback = (params: MouseEventParams) => void;

// 点击事件回调函数
export type MouseMoveEventCallback = (params: MouseEventParams) => void;

// 相机事件回调函数
export type CameraEventCallback = (params: CameraEventParams) => void;

export type TileLoadProgressCallback = (params: TileLoadProgressParams) => void;

// 各种事件对应的回调函数返回的参数类型
export interface EventData {
  [EventName.POST_RENDER]: () => void;
  [EventName.PRE_RENDER]: () => void;
  [EventName.CLICK]: MouseEventCallback;
  [EventName.DOUBLE_CLICK]: MouseEventCallback;
  [EventName.CONTEXTMENU]: MouseEventCallback;
  [EventName.MOUSE_DOWN]: MouseEventCallback;
  [EventName.MOUSE_MOVE]: MouseMoveEventCallback;
  [EventName.MOUSE_UP]: MouseEventCallback;
  [EventName.CAMERA_MOVE_START]: CameraEventCallback;
  [EventName.CAMERA_MOVING]: CameraEventCallback;
  [EventName.CAMERA_MOVE_END]: CameraEventCallback;
  [EventName.TILE_LOAD_PROGRESS]: TileLoadProgressCallback;
  [key: string | number | symbol]: CustomEventCallback;
}
