import { PointCoordinates } from "./IGeojson";
import { IBase } from "./IBase";

export interface IPathTrackOptions {
  delayTime?: number;
  color?: string;
  width?: number;
  visible?: boolean;
}

export interface IPathTrack extends Pick<IBase, "destroy"> {
  /**
   * 设置路径残留时间
   * @param delayTime
   */
  set delayTime(delayTime: number);
  get delayTime(): number;

  /**
   * 设置是否可见
   * @param visible
   */
  set visible(visible: boolean);
  get visible(): boolean;

  /**
   * 设置颜色
   * @param color
   */
  set color(color: string);
  get color(): string;

  /**
   * 设置宽度
   * @param width
   */
  set width(width: number);
  get width(): number;

  /**
   * 新增位置
   * @param position
   */
  addPosition(position: PointCoordinates): void;

  /**
   * 刷新路径
   */
  refresh(): void;
}
