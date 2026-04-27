import {
  RouteAreaStyle,
  RouteEditStyle,
  RouteLineStyle,
  RoutePointStyle,
  RouteLayerType,
  defaultHoverRouteTheme,
  defaultNormalRouteTheme,
  defaultSelectRouteTheme,
  RouteEditLayerStyle,
  RouteLayerSelect,
  RouterEditChangeParams,
  RouterEditModifyEventParams,
  AltitudeMode,
  LinePointAction,
} from "@gdu-gl/common";
import {
  RouteCommonProps,
  PromptMessageConfiguration,
  defaultPromptMessageConfiguration,
} from "../../../../Types";
import { RouteLayerCommonEvent } from "./common/types/EventCommonParams";

export interface RouteEditLayerProps extends RouteCommonProps {
  /**
   * ### 功能描述
   * 是否禁用编辑组件的事件响应
   */
  active?: boolean;
  /**
   * ### 功能描述
   * 当前选中的航点索引，-1的时候为没有选中。
   */
  select: RouteLayerSelect;
  /**
   * ### 功能描述
   * 参考起飞点选择，允许相应的图层id集合
   */
  takeoffSelectLayers?: Array<string>;
  /**
   * ### 功能描述
   * 编辑图层的唯一标识，用于区分不同的编辑图层。添加此id后，编辑图层的name都会以此id为前缀。不传则自动生成id。
   */
  layerId?: string;
  /**
   * ### 功能描述
   * 航点默认高度，默认为120m。
   */
  defaultPointHeight?: number;
  /**
   * 主题样式配置，包含航线编辑层中所有可视元素的样式定义
   * - **startPoint**  起点样式，包含正常、悬停、选中三种状态下的填充色、描边色和文字颜色
   * - **endPoint**  终点样式，包含正常、悬停、选中三种状态下的填充色、描边色和文字颜色
   * - **turnPoint**  转折点样式，包含正常、悬停、选中三种状态下的填充色、描边色和文字颜色
   * - **safeStartPoint**  安全起点样式，包含正常、悬停、选中三种状态下的填充色、描边色和文字颜色
   * - **safeEndPoint**  安全终点样式，包含正常、悬停、选中三种状态下的填充色、描边色和文字颜色
   * - **safeTurnPoint**  安全转折点样式，包含正常、悬停、选中三种状态下的填充色、描边色和文字颜色
   * - **insertionPoint**  插入点样式，包含正常、悬停、选中三种状态下的填充色、描边色和文字颜色
   * - **deletePoint**  删除点样式，包含正常、悬停、选中三种状态下的填充色、描边色和文字颜色
   * - **finishPoint**  完成点样式，包含填充色、描边色和文字颜色
   * - **line**  航线样式，包含填充色和描边色
   * - **helperLine**  辅助线样式，包含正常、悬停、选中三种状态下的填充色
   * - **footPoint**  投影点样式，包含正常、悬停、选中三种状态下的填充色和描边色
   * - **errorFootPoint**  错误投影点样式，包含正常、悬停、选中三种状态下的填充色和描边色
   * - **projectionLine**  投影线样式，仅包含填充色
   * - **area**  区域样式，包含正常和错误两种状态，每种状态都包含填充色和描边色
   */
  theme?: {
    startPoint: RouteEditStyle<RoutePointStyle>;
    endPoint: RouteEditStyle<RoutePointStyle>;
    turnPoint: RouteEditStyle<RoutePointStyle>;
    safeStartPoint: RouteEditStyle<RoutePointStyle>;
    safeEndPoint: RouteEditStyle<RoutePointStyle>;
    safeTurnPoint: RouteEditStyle<RoutePointStyle>;
    insertionPoint: RouteEditStyle<RoutePointStyle>;
    deletePoint: RouteEditStyle<RoutePointStyle>;
    finishPoint: RoutePointStyle;
    line: RouteLineStyle;
    helperLine: RouteEditStyle<Pick<RoutePointStyle, "fillColor">>;
    footPoint: RouteEditStyle<Omit<RoutePointStyle, "textColor">>;
    errorFootPoint: RouteEditStyle<Omit<RoutePointStyle, "textColor">>;
    projectionLine: Pick<RoutePointStyle, "fillColor">;
    area: {
      normal: RouteAreaStyle;
      error: RouteAreaStyle;
    };
  };
  /**
   * 提示信息配置
   * - **polygonSelfIntersectStr**  多边形自相交提示信息，默认为"不允许绘制相交边线"
   */
  message?: PromptMessageConfiguration;
}

export interface RouteEditLayerEmits extends RouteLayerCommonEvent {
  // (event: "update:select", params: RouteLayerSelect): void;
  /**
   * 更新测面数据
   *
   * ### 返回值 是一个对象
   * - **type**
   *   - 0：新增事件触发；
   *   - 1：删除事件触发；
   *   - 2：修改事件触发；
   *   - 3：插入事件触发；
   *   - 4：清空事件触发
   *   - 5：创建事件触发
   *   - 可以使用RouteEditEventType枚举，@gdu-gl/common已经导出
   * - **idx**  触发事件的点位的索引
   * - **parentsIdx**  航线属于哪个分组的索引
   * - **line**  更新后航线数据
   * - **area**  更新后测面数据
   */
  (event: "changed", params: RouterEditChangeParams): void;

  /**
   * 开始编辑时触发
   *
   * ### 返回值 是一个对象
   * - **idx**  触发事件的点位的索引
   * - **line**  更新后航线数据
   * - **area**  更新后测面数据
   */
  (event: "startModify", params: RouterEditModifyEventParams): void;
}

export interface WayPointSlotProps {
  /**
   *  ### 功能描述
   *  航点插槽
   * - **idx** 当前航点的索引
   * - **point** 当前航点属性,类型为`LinePointAction` 包含航点的坐标、类型、是否安全等信息
   * - **isSelected** 当前航点是否被选中
   */
  wayPoint: { idx: number; point: LinePointAction; isSelected: boolean };
}

export const defaultRouteEditLayerProps = {
  select: {
    parentsIdx: -1,
    idx: -1,
  },
  active: true,
  type: RouteLayerType.MapProjectTypePoint,
  altitudeMode: AltitudeMode.Elevation,
  takeoffSafeHeight: 20,
  defaultPointHeight: 120,
  lines: [],
  area: [],
  clampToGround: false,
  message: defaultPromptMessageConfiguration,
  theme: {
    safeEndPoint: {
      normal: defaultNormalRouteTheme.safeEndPoint,
      hover: defaultHoverRouteTheme.safeEndPoint,
      select: defaultSelectRouteTheme.safeEndPoint,
    },
    safeStartPoint: {
      normal: defaultNormalRouteTheme.safeStartPoint,
      hover: defaultHoverRouteTheme.safeStartPoint,
      select: defaultSelectRouteTheme.safeStartPoint,
    },
    deletePoint: {
      hover: defaultHoverRouteTheme.deletePoint,
      select: defaultSelectRouteTheme.deletePoint,
      normal: defaultNormalRouteTheme.deletePoint,
    },
    safeTurnPoint: {
      normal: defaultNormalRouteTheme.safeTurnPoint,
      hover: defaultHoverRouteTheme.safeTurnPoint,
      select: defaultSelectRouteTheme.safeTurnPoint,
    },
    startPoint: {
      normal: defaultNormalRouteTheme.startPoint,
      hover: defaultHoverRouteTheme.startPoint,
      select: defaultSelectRouteTheme.startPoint,
    },
    endPoint: {
      normal: defaultNormalRouteTheme.endPoint,
      hover: defaultHoverRouteTheme.endPoint,
      select: defaultSelectRouteTheme.endPoint,
    },
    turnPoint: {
      normal: defaultNormalRouteTheme.turnPoint,
      hover: defaultHoverRouteTheme.turnPoint,
      select: defaultSelectRouteTheme.turnPoint,
    },
    insertionPoint: RouteEditLayerStyle.insertPoint,
    errorFootPoint: RouteEditLayerStyle.errorFootPoint,
    line: defaultNormalRouteTheme.line,
    helperLine: {
      normal: defaultNormalRouteTheme.helperLine,
      hover: defaultHoverRouteTheme.helperLine,
      select: defaultSelectRouteTheme.helperLine,
    },
    footPoint: {
      normal: defaultNormalRouteTheme.footPoint,
      hover: defaultHoverRouteTheme.footPoint,
      select: defaultSelectRouteTheme.footPoint,
    },
    finishPoint: RouteEditLayerStyle.finishPoint,
    projectionLine: defaultNormalRouteTheme.projectionLine,
    area: {
      normal: defaultNormalRouteTheme.area,
      error: RouteEditLayerStyle.errorArea,
    },
  },
};
