import { AltitudeMode, PointCoordinates } from "@gdu-gl/common";
import { BaseProps } from "../../../../Types/BaseProps";

interface SurroundLayerCommonProps extends BaseProps {
  /**
   * ### 功能描述
   * 中心坐标
   */
  coordinates?: PointCoordinates | null;
  /**
   * ### 功能描述
   * 半径,单位为千米
   */
  radius?: number;
  /**
   * ### 功能描述
   * 是否固定到地面
   */
  clamToGround?: boolean;
  /**
   * ### 功能描述
   * 是否启用逆时针
   */
  enableCounterclockwise?: boolean;
  /**
   * ### 功能描述
   * 高度模式；
   * **AltitudeMode.Elevation** 海拔高度；
   * **AltitudeMode.Relative** 相对高度；
   */
  altitudeMode: AltitudeMode;
  /**
   * ### 功能描述
   * 高度，由高度模式决定，单位为米
   */
  height?: number;
  /**
   * 起飞点坐标
   */
  takeoffPoint: PointCoordinates;
}

/**
 * ### 功能描述
 * 环绕编辑图层属性
 */
export interface SurroundEditLayerProps extends SurroundLayerCommonProps {
  layerId?: string;
  /**
   * ### 功能描述
   * 最大距离,单位为千米
   */
  maxDistance?: number | null;
  message?: {
    exceedDistanceStr: string;
  };
}

/**
 * ### 功能描述
 * 环绕显示图层属性
 */
export interface SurroundShowLayerProps extends SurroundLayerCommonProps {
  /**
   * ### 功能描述
   * 开始点坐标
   */
  startPoint?: PointCoordinates | null;
  /**
   * ### 功能描述
   * 无人机坐标
   */
  uavPosition?: PointCoordinates | null;
}

export interface SurroundEditLayerChildProps
  extends Omit<SurroundEditLayerProps, "altitudeMode" | "height"> {}

export interface SurroundEditChangeParams {
  coordinates: PointCoordinates;
  radius: number;
}

export interface SurroundEditLayerEmits {
  (event: "changed", params: SurroundEditChangeParams): void;
  (event: "error"): void;
}

export const defaultSurroundEditLayerProps = {
  coordinates: null,
  radius: 0.5,
  altitudeMode: AltitudeMode.Relative,
  height: 50,
  // takeoffPoint: null,
  enableCounterclockwise: false,
  maxDistance: 5,
  message: {
    exceedDistanceStr: "超出最大距离",
  },
};

export const defaultSurroundShowLayerProps = {
  coordinates: null,
  radius: 0.5,
  altitudeMode: AltitudeMode.Relative,
  height: 50,
  enableCounterclockwise: false,
  startPoint: null,
  uavPosition: null,
};
