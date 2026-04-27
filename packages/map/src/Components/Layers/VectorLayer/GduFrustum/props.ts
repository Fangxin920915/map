import { PointCoordinates } from "@gdu-gl/common";
import { BaseProps } from "../../../../Types";

export interface VectorFrustumProps extends BaseProps {
  /**
   * 相机视锥体颜色
   */
  color?: string;
  /**
   * 相机视锥体轮廓颜色
   */
  outlineColor?: string;
  /**
   * 相机视锥体中心线颜色
   */
  centerLineColor?: string;
  /**
   * 相机视锥体中心线宽度
   */
  centerLineWidth?: number;
  /**
   * 相机视锥体中心坐标
   */
  coordinates?: PointCoordinates;
  /**
   * 相机视锥体近裁剪面距离
   */
  near?: number;
  /**
   * 相机视锥体远裁剪面距离
   */
  far?: number;
  /**
   * 相机视锥体视野角度
   */
  fov?: number;
  /**
   * 相机视锥体宽高比
   */
  aspectRatio?: number;
  /**
   * 相机视锥体heading角度
   */
  heading?: number;
  /**
   * 相机视锥体pitch角度
   */
  pitch?: number;
  /**
   * 相机视锥体roll角度
   */
  roll?: number;
  /**
   * 相机视锥体是否可见
   */
  visible?: boolean;
}

export const defaultVectorFrustumProps = {
  color: "rgba(255,255,255,0.3)",
  outlineColor: "rgb(0,0,0)",
  coordinates: undefined,
  near: 1,
  far: 50000,
  aspectRatio: 4 / 3,
  fov: 60,
  heading: 0,
  pitch: 0,
  roll: 0,
  centerLineColor: "green",
  centerLineWidth: 10,
  visible: true,
};
