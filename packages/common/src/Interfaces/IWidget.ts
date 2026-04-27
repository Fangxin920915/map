import { WidgetType } from "@common/Types";
import { PointCoordinates } from "./IGeojson";
import { IBase, IBaseDelegateImp } from "./IBase";
import { ISamplerHeightWidgetImp } from "./ISamperHeightWidgetImp";

export interface IWidgetDelegateImp
  extends IBaseDelegateImp<IWidgetManagerImp> {
  widgets: IWidgetManagerImp;
}

export interface IWidgetManagerImp {
  getWidgetByType(
    type: WidgetType,
    options?: any,
  ): IScaleToolImp | IDragToolImp | ISamplerHeightWidgetImp | undefined;
}

export type DragHorizontalParams = {
  // 拖拽点位置
  position: number[];
  // 鼠标屏幕位置
  mousePosition: { x: number; y: number };
};

export type DragGroundParams = {
  // 拾取的物体
  pickObj: any;
  // 鼠标屏幕位置
  mousePosition: { x: number; y: number };
};

export interface IDragToolImp extends IBase {
  /**
   * 水平方向拖拽，高度不变，经纬度变化
   * @param horizontalParams
   */
  dragHorizontal(
    horizontalParams: DragHorizontalParams,
  ): PointCoordinates | undefined;
  /**
   * 贴地拖拽
   * @param groundParams
   */
  dragGround(groundParams: DragGroundParams): PointCoordinates | undefined;

  /**
   * 垂直方向拖动；经纬度不变，高度变化
   * @param verticalParams
   */
  dragVertical(
    verticalParams: DragHorizontalParams,
  ): PointCoordinates | undefined;

  /**
   * 将坐标转化为屏幕坐标
   * @param coordinate 经纬坐标
   */
  transformScreenByCoordinate(
    coordinate: PointCoordinates,
  ): number[] | undefined;
}

export type ScaleChangeCallback = (params: {
  barWidth?: number;
  distanceLabel?: string;
  distance?: number;
}) => void;

export type ScaleOptions = {
  maxBarWidth: number;
  changeCallback: ScaleChangeCallback;
};

export interface IScaleToolImp extends IBase {
  setMaxBarWidth(maxBarWidth: number): void;
  init(options: ScaleOptions): void;
}
