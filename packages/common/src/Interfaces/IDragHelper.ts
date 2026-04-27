import { PointCoordinates } from "./IGeojson";
import { IBase } from "./IBase";

export type DragControlOptions = {
  xAxisColor?: string;
  yAxisColor?: string;
  zAxisColor?: string;
  planeColor?: string;
  highlightColor?: string;
  minHeight?: number;
  maxHeight?: number;
  size?: number;
};

export type DragEventName = "start" | "moving" | "end";

export interface IDragHelper extends Pick<IBase, "destroy"> {
  initSetting(options?: DragControlOptions): void;

  /**
   * 设置拖拽辅助器的位置
   * @param coordinate 辅助器中心点
   */
  setCoordinates(coordinate?: PointCoordinates): void;

  /**
   * 更行配置信息
   * @param setting
   */
  updateSetting(setting: DragControlOptions): void;

  /**
   * 添加监听
   * @param name 事件名
   * @param callback 回调函数
   */
  addListener(
    name: DragEventName,
    callback: (center: PointCoordinates) => void,
  ): void;

  /**
   * 移除监听
   * @param name 事件名
   * @param callback 回调函数
   */
  removeListener(
    name: DragEventName,
    callback: (center: PointCoordinates) => void,
  ): void;
}
