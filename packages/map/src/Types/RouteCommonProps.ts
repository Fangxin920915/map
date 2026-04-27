import {
  AltitudeMode,
  LinePointAction,
  PointCoordinates,
  PolygonCoordinates,
  RouteLayerType,
} from "@gdu-gl/common";
import { BaseProps } from "./BaseProps";

export interface PromptMessageConfiguration {
  deleteStr?: string;
  polygonSelfIntersectStr?: string;
  confirmTextDeleteTurnStr?: string;
  confirmTextDeleteSurroundStr?: string;
  polygonIntersectStr?: string;
  dragHorizontallyStr?: string;
  dragVerticallyStr?: string;
  deleteWayPointStr?: string;
  deleteSurroundPointStr?: string;
  addSurroundPointStr?: string;
  addSurroundPointTipStr?: string;
  takeoffSelectTipStr?: string;
}

export const defaultPromptMessageConfiguration = {
  deleteStr: "删除",
  polygonSelfIntersectStr: "不允许绘制相交边线",
  polygonIntersectStr: "多边形不允许相交",
  confirmTextDeleteTurnStr: "再次点击删除该航点",
  confirmTextDeleteSurroundStr: "再次点击删除圆弧航线",
  dragHorizontallyStr: "左键拖拽移动水平位置",
  dragVerticallyStr: "左键上下拖拽调整高度",
  deleteWayPointStr: "删除航点",
  deleteSurroundPointStr: "删除圆弧",
  addSurroundPointStr: "添加圆弧",
  addSurroundPointTipStr: "单击拾取圆弧兴趣点",
  takeoffSelectTipStr: "单击选取起飞点",
};

export interface RouteCommonProps extends BaseProps {
  /**
   * ### 功能描述
   * 高度模式；
   * **AltitudeMode.Elevation** 海拔高度；
   * **AltitudeMode.Relative** 相对高度；
   */
  altitudeMode: AltitudeMode;
  /**
   * ### 功能描述
   * 开启贴地模式，开启后航线会贴地展示，隐藏航点投影线、投影点。该属性主要用于航线在垂直视角下的展示。
   */
  clampToGround?: boolean;
  /**
   * ### 功能描述
   * 航线类型。
   *
   * ### 参数说明
   * - **枚举值:RouteLayerType.MapProjectTypePoint=1**  航点航线，通过一系列航点连接的航线。
   * - **枚举值:RouteLayerType.MapProjectType2D=2**  正射航线，用于正射摄影测量的航线，通常用于建筑物立面测量。
   * - **枚举值:RouteLayerType.MapProjectType3D=3**  倾斜摄影航线，用于倾斜摄影测量的航线，通常用于三维建模
   */
  type: RouteLayerType;
  /**
   * ### 功能描述
   * 起飞点坐标。
   */
  takeoffPoint?: PointCoordinates | null;
  /**
   * ### 功能描述
   * 起飞点安全高度。
   */
  takeoffSafeHeight?: number;
  /**
   * ### 功能描述
   * 航线点数组，为二维数组结构，每个内层数组代表一条独立的航线，数组元素遵循 `LinePointAction` 类型定义，用于描述航线中每个点的详细信息。
   *
   * ### 参数说明
   * 每个 `LinePointAction` 对象包含以下属性：
   * - **coordinates**：点的经纬度坐标，必传项，格式为 `[经度, 纬度, 高程|undefined]`，类型为 `PointCoordinates`。
   * - **isSafe**：可选布尔值，默认 `false`，用于标记该点是否为安全点。
   * - **isTurn**：可选布尔值，默认 `false`，用于标记该点是否为航线方向的转折点。
   * - **elevationHeight**：点的海拔高度，为必传的数值类型。
   * - **relativeHeight**：点的相对高度，为必传的数值类型。
   * - **[key: string]: any**：其他拓展属性，可通过自定义键名添加额外信息。
   *
   * ### 示例
   * ```typescript
   * const linesExample: LinePointAction[][] = [
   *   [
   *     {
   *       coordinates: [120.123456, 30.654321, 100],
   *       isSafe: true,
   *       isTurn: true,
   *       elevationHeight: 100,
   *       relativeHeight: 50,
   *       customInfo: '额外信息'
   *     },
   *     {
   *       coordinates: [120.223456, 30.754321, 110],
   *       isTurn: true,
   *       elevationHeight: 110,
   *       relativeHeight: 60
   *     },
   *     {
   *       coordinates: [120.323456, 30.854321, 120],
   *       isTurn: true,
   *       elevationHeight: 120,
   *       relativeHeight: 70
   *     }
   *   ]
   * ];
   * ```
   */
  lines?: LinePointAction[][];
  /**
   * ### 功能描述
   * 可选，区域多边形坐标，用于正射航线和倾斜摄影航线。定义航线的覆盖区域，格式为二维数组，例如 [[[经度, 纬度], [经度, 纬度], ...]]
   */
  area?: PolygonCoordinates | PolygonCoordinates[] | null;
}
