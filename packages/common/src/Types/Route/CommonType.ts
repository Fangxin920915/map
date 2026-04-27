import { LineStringCoordinates, PointCoordinates } from "@common/Interfaces";

export interface RouteLayerSelect {
  /**
   * 分组索引
   */
  parentsIdx?: number;
  /**
   * 选中的索引
   */
  idx: number;
}

/**
 * ### 功能描述
 * 根据步长计算环绕点位置
 * 环绕点列表，每个环绕点包含坐标、高度、heading、pitch角度
 */
export interface SurroundPointList {
  coordinates: PointCoordinates;
  heading: number;
  pitch: number;
}

/**
 * ### 功能描述
 * 环绕点
 */
export interface SurroundPoint {
  /**
   * ### 功能描述
   * 中心坐标
   */
  coordinates: PointCoordinates;
  /**
   * ### 功能描述
   * 是否启用逆时针
   */
  enableCounterclockwise: boolean;
  /**
   * ### 功能描述
   * 环绕角度,单位为度
   */
  angle: number;
  /**
   * ### 功能描述
   * 环绕圈数
   */
  repeat: number;
  /**
   * ### 功能描述
   * 环绕角度步长,单位为度
   */
  stepAngle: number;
  /**
   * ### 功能描述
   * 兴趣点高度，根据高度模式计算得到
   */
  height: number;
  /**
   * ### 功能描述
   * 环绕点列表，每个环绕点包含坐标、高度、heading、pitch角度
   */
  pointList: SurroundPointList[];
}

export interface LinePointAction {
  /** 点的经纬度，必传 */
  coordinates: PointCoordinates;
  /** 是否安全点 */
  isSafe?: boolean;
  /** 是否转折点 */
  isTurn?: boolean;
  /**
   * 当前点位的高度模式,如果是海拔模式则代表海拔高度、如果是相对模式则是相对起飞点的海拔高度
   */
  height: number;
  /**
   * ### 功能描述
   * 是否环绕点
   */
  surroundPoint?: SurroundPoint | null;
  /** 其他拓展属性 */
  [key: string]: any;
}

/**
 * 航线编辑高度模式
 */
export enum AltitudeMode {
  /**
   * 相对高度
   */
  Relative = 0,
  /**
   * 海拔高度
   */
  Elevation = 1,
  /**
   * 相对地形高度
   */
  RelativeTerrain = 2,
}

/**
 * 参考起飞点信息
 */
export interface TakeoffPoint {
  // 椭球高度坐标
  coordinates: PointCoordinates;
  // 海拔高度
  elevationHeight: number;
}

export enum RouteLayerType {
  /**
   * 航点航线
   */
  MapProjectTypePoint = 1,
  /**
   * 正射航线
   */
  MapProjectType2D = 2,
  /**
   * 倾斜摄影航线
   */
  MapProjectType3D = 3,
  /**
   * 蛇形航线
   */
  MapProjectTypeSnake = 4,
  /**
   * 航带航迹
   */
  MapProjectTypeStrip = 5,
  /**
   * 五向倾斜摄影航迹
   */
  MapProjectTypeOblique = 6,
  /**
   * 五向智能摆动航线
   */
  MapProjectTypeSmartSwing_Five = 7,
  /**
   * 三向智能摆动航线
   */
  MapProjectTypeSmartSwing_Three = 8,
  /**
   * 快速任务
   */
  MapProjectTypeQuickRoute = 9,
  /**
   * AI巡检任务
   */
  MapProjectTypeAIRoute = 10,
}

export interface RoutePointStyle {
  fillColor: string;
  outlineColor: string;
  textColor: string;
}

export interface RouteLineStyle {
  strokeColor: string;
  strokeOutlineColor: string;
}

export interface RouteAreaStyle {
  strokeColor: string;
  fillColor: string;
}

export interface RouteEditStyle<T> {
  normal: T;
  hover: T;
  select: T;
}

export interface RouteProgressParams {
  clampToGround: boolean;
  line: LineStringCoordinates;
  uavPosition: PointCoordinates;
  flyToPointIndex: number;
}

export interface SurroundRouteProgressParams
  extends Omit<RouteProgressParams, "clampToGround" | "flyToPointIndex"> {
  /**
   * ### 功能描述
   * 环绕中心坐标
   */
  center: PointCoordinates;
  /**
   * ### 功能描述
   * 环绕角度,单位为度
   */
  angle: number;
  /**
   * ### 功能描述
   * 是否启用逆时针
   */
  enableCounterclockwise: boolean;
  /**
   * ### 功能描述
   * 环绕线起始点坐标
   */
  startPoint: PointCoordinates;
  /**
   * ### 功能描述
   * 环绕线起始点坐标
   */
  startAngle: number;
  /**
   * ### 功能描述
   * 环绕线结束点坐标
   */
  endPoint: PointCoordinates;
  /**
   * ### 功能描述
   * 环绕线结束点角度
   */
  endAngle: number;
}
