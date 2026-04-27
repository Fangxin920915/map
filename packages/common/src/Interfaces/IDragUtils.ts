import { PointCoordinates } from "./IGeojson";
import { IBase } from "./IBase";

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

export interface IDragUtils extends Pick<IBase, "destroy"> {
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
}
