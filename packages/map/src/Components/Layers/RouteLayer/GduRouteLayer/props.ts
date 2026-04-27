import {
  RouteAreaStyle,
  RouteLineStyle,
  RoutePointStyle,
  RouteLayerType,
  defaultNormalRouteTheme,
  PointCoordinates,
  AltitudeMode,
} from "@gdu-gl/common";
import { RouteCommonProps } from "../../../../Types";

export interface RouteLayerProps extends RouteCommonProps {
  /**
   * ### 功能描述
   * 起飞点图标是否可见
   */
  takeoffIconVisible?: boolean;
  /**
   * ### 功能描述
   * 航线展示是一个多维数组，需要告诉我当前飞行的航线，在这个数据的那一段。这样处理是为了兼容五向倾斜摄影
   */
  parentsIdx?: number;
  /**
   * ### 功能描述
   * 编辑图层的唯一标识，用于区分不同的编辑图层。添加此id后，编辑图层的name都会以此id为前缀。不传则自动生成id。
   */
  /**
   * ### 功能描述
   * 无人机飞往的航点下标。
   */
  flyToPointIndex?: number;
  /**
   * ### 功能描述
   * 无人机的位置
   */
  uavPosition?: PointCoordinates;
  message?: {
    repeatCountStr?: string;
  };
  /**
   * 主题样式配置，包含各个元素的样式定义
   * - **startPoint**  起点样式，包含填充色、描边色和文字颜色
   * - **endPoint**  终点样式，包含填充色、描边色和文字颜色
   * - **turnPoint**  转折点样式，包含填充色、描边色和文字颜色
   * - **safeStartPoint**  安全起点样式，包含填充色、描边色和文字颜色
   * - **safeEndPoint**  安全终点样式，包含填充色、描边色和文字颜色
   * - **safeTurnPoint**  安全转折点样式，包含填充色、描边色和文字颜色
   * - **line**  航线样式，包含填充色和描边色
   * - **footPoint**  投影点样式，包含填充色和描边色
   * - **projectionLine**  投影线样式，包含填充色
   * - **helperLine**  辅助线样式，仅包含填充色
   * - **area**  区域样式，包含填充色和描边色
   */
  theme?: {
    startPoint: RoutePointStyle;
    endPoint: RoutePointStyle;
    turnPoint: RoutePointStyle;
    safeStartPoint: RoutePointStyle;
    safeEndPoint: RoutePointStyle;
    safeTurnPoint: RoutePointStyle;
    line: RouteLineStyle;
    helperLine: Pick<RoutePointStyle, "fillColor">;
    footPoint: Omit<RoutePointStyle, "textColor">;
    projectionLine: Pick<RoutePointStyle, "fillColor">;
    area: RouteAreaStyle;
  };
}

export const defaultRouteLayerProps = {
  takeoffSafeHeight: 20,
  parentsIdx: 0,
  type: RouteLayerType.MapProjectTypePoint,
  lines: [],
  area: undefined,
  clampToGround: false,
  theme: defaultNormalRouteTheme,
  flyToPointIndex: 0,
  takeoffIconVisible: true,
  altitudeMode: AltitudeMode.Elevation,
  message: {
    repeatCountStr: "圈",
  },
};
