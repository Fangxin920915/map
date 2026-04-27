import { PointCoordinates } from "@gdu-gl/common";
import { BaseProps } from "../../../Types";

export interface TrackViewProps extends BaseProps {
  /**
   * 是否启用视角跟随
   */
  enable?: boolean;
  /**
   * 视角位置
   */
  coordinates?: PointCoordinates | null;
  /**
   * 相机距离跟随点的x轴距离
   */
  axisX?: number;
  /**
   * 相机距离跟随点的y轴距离
   */
  axisY?: number;
  /**
   * 相机距离跟随点的z轴距离
   */
  axisZ?: number;
  /**
   * 该要素是否紧贴地面
   */
  clampToGround?: boolean;
}

export const defaultTrackViewProps = {
  enable: true,
  coordinates: null,
  axisX: 0,
  axisY: 60,
  axisZ: 60,
  clampToGround: false,
};
