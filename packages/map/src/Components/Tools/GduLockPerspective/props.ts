import { PointCoordinates } from "@gdu-gl/common";
import { BaseProps } from "../../../Types";

export interface LockPerspectiveProps extends BaseProps {
  /**
   * 相机位置
   */
  cameraPosition: PointCoordinates;
  /**
   * 基准偏航角，后续所有偏角的旋转都是基于这个角度来计算
   */
  referenceHeading?: number | null;
  /**
   * 相机偏航角
   */
  heading?: number | null;
  /**
   * 相机俯仰角
   */
  pitch?: number | null;
  /**
   * 相机视野角度
   */
  fov?: number | null;
  /**
   * 最小俯仰角
   */
  minPitch?: number | null;
  /**
   * 最大俯仰角
   */
  maxPitch?: number | null;
  /**
   * 最小偏航角
   */
  minHeading?: number | null;
  /**
   * 最大偏航角
   */
  maxHeading?: number | null;
  /**
   * 是否允许水平方向拖动
   */
  enableDragHorizontal?: boolean;
  /**
   * 是否允许垂直方向拖动
   */
  enableDragVertical?: boolean;
}

export interface LockPerspectiveEmits {
  /**
   * 相机偏航角改变时触发
   */
  (event: "update:heading", heading: number): void;
  /**
   * 相机俯仰角改变时触发
   */
  (event: "update:pitch", pitch: number): void;
  /**
   * 相机中心点拾取距离
   */
  (event: "distanceChange", distance?: number | null): void;
  (event: "ready"): void;
}

export const defaultLockPerspectiveProps = {
  cameraPosition: [
    114.45934271025556, 30.518918853973258, 500,
  ] as PointCoordinates,
  referenceHeading: 0,
  heading: 0,
  pitch: 0,
  fov: 60,
  minPitch: -90,
  maxPitch: 30,
  minHeading: -330,
  maxHeading: 330,
  enableDragHorizontal: true,
  enableDragVertical: true,
};
