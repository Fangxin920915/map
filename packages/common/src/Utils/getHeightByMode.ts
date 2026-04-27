import {
  AltitudeMode,
  LinePointAction,
  SurroundPoint,
  SurroundPointList,
} from "@common/Types";
import { LineStringCoordinates, PointCoordinates } from "@common/Interfaces";
import * as turf from "@turf/turf";
import { elevationToEllipsoid, ellipsoidToElevation } from "./altitude";
import { altitudeAccuracy } from "./measure";

/**
 * 计算高度所需的参数接口
 */
interface Params {
  /** 高度模式，用于确定高度计算方式 */
  mode: AltitudeMode;
  /** 目标点的坐标 */
  coordinates: PointCoordinates;
  /** 起飞点的坐标 */
  takeoffPoint?: PointCoordinates | null;
  /** 给定的高度值 */
  height: number;
}

/**
 * 根据高度模式计算高度，返回包含坐标、海拔高度和相对高度的对象
 * @param params - 计算高度所需的参数
 * @param params.mode - 高度模式，用于确定高度计算方式，取值为 `AltitudeMode` 枚举类型
 * @param params.coordinates - 目标点的坐标，格式为 `[经度, 纬度, 可选的高程]`
 * @param params.takeoffPoint - 起飞点的信息，包含起飞点的坐标和海拔高度等信息
 * @param params.height - 给定的高度值
 * @returns 包含目标点坐标、海拔高度和相对高度的对象
 * @returns {PointCoordinates} coordinates - 目标点的新坐标，包含计算后的椭球高度
 * @returns {number} elevationHeight - 目标点的海拔高度
 * @returns {number} relativeHeight - 目标点相对于起飞点的相对高度
 */
export function getHeightByMode(params: Params) {
  // 如果高度模式为 Elevation，则调用 getHeightByElevationHeight 函数计算高度
  if (params.mode === AltitudeMode.Elevation) {
    return getHeightByElevationHeight(params);
  }
  // 否则，调用 getHeightByRelativeHeight 函数计算高度
  return getHeightByRelativeHeight(params);
}

/**
 * 根据给定的海拔高度，反算目标点的坐标、海拔高度、相对高度和椭球高度
 * @param params - 计算高度所需的参数
 * @param params.mode - 高度模式，此处应为 `AltitudeMode.Elevation`
 * @param params.coordinates - 目标点的坐标，格式为 `[经度, 纬度, 可选的高程]`
 * @param params.takeoffPoint - 起飞点的信息，包含起飞点的坐标和海拔高度等信息
 * @param params.height - 给定的海拔高度值
 * @returns 包含目标点坐标、海拔高度和相对高度的对象
 * @returns {PointCoordinates} coordinates - 目标点的新坐标，包含计算后的椭球高度
 * @returns {number} elevationHeight - 目标点的海拔高度，即传入的 `height` 值
 * @returns {number} relativeHeight - 目标点相对于起飞点的相对高度
 */
export function getHeightByElevationHeight(params: Params) {
  const { coordinates, height, takeoffPoint } = params;
  const takeoffElevationHeight = ellipsoidToElevation(takeoffPoint);
  // 获取坐标点的高程异常值
  const ellipsoidHeight = elevationToEllipsoid(coordinates, height);
  const relativeHeight = altitudeAccuracy(height - takeoffElevationHeight);
  const [lon, lat] = coordinates;
  return {
    coordinates: [lon, lat, ellipsoidHeight] as PointCoordinates,
    elevationHeight: height,
    relativeHeight,
  };
}

/**
 * 根据给定相对高度，反算目标点的坐标、海拔高度、相对高度和椭球高度
 * @param params - 计算高度所需的参数
 * @param params.mode - 高度模式，此处应为除 `AltitudeMode.Elevation` 外的其他模式
 * @param params.coordinates - 目标点的坐标，格式为 `[经度, 纬度, 可选的高程]`
 * @param params.takeoffPoint - 起飞点的信息，包含起飞点的坐标和海拔高度等信息
 * @param params.height - 给定的相对高度值
 * @returns 包含目标点坐标、海拔高度和相对高度的对象
 * @returns {PointCoordinates} coordinates - 目标点的新坐标，包含计算后的椭球高度
 * @returns {number} elevationHeight - 目标点的海拔高度，由起飞点海拔高度加上相对高度计算得出
 * @returns {number} relativeHeight - 目标点相对于起飞点的相对高度，即传入的 `height` 值
 */
export function getHeightByRelativeHeight(params: Params) {
  // 解构起飞点坐标，获取起飞点高度，若未提供则默认为 0
  const { takeoffPoint, height, coordinates } = params;
  const takeoffElevationHeight = ellipsoidToElevation(takeoffPoint);
  // 获取坐标点的高程异常值
  const elevationHeight = altitudeAccuracy(takeoffElevationHeight + height);
  const ellipsoidHeight = elevationToEllipsoid(coordinates, elevationHeight);
  const [lon, lat] = coordinates;
  // 起飞点高度加上给定高度得到最终高度
  return {
    coordinates: [lon, lat, ellipsoidHeight] as PointCoordinates,
    elevationHeight,
    relativeHeight: height,
  };
}

/**
 * 根据经纬度将椭球高转为海拔高和相对高
 * @param params
 */
export function transformEllipsoidHeightByMode(
  params: Omit<Params, "height" | "mode">,
) {
  const { coordinates, takeoffPoint } = params;
  const [, , ellipsoidHeight = 0] = coordinates;
  const takeoffElevationHeight = ellipsoidToElevation(takeoffPoint);
  const elevationHeight = ellipsoidToElevation(coordinates);
  const relativeHeight = altitudeAccuracy(
    elevationHeight - takeoffElevationHeight,
  );
  return {
    ellipsoidHeight,
    elevationHeight,
    relativeHeight,
  };
}

/**
 * 根据原始高度模式和目标高度模式，保持航线的海拔高度不变
 * @param lines 航线数据，包含多个航线，每个航线由多个点组成
 * @param takeoffPoint 起飞点的坐标，格式为 `[经度, 纬度, 可选的高程]`
 * @param originalMode 原始高度模式，用于计算原始高度
 * @param mode 目标高度模式，用于计算目标高度
 */
export function keepRouteElevationByAltitudeMode(
  lines: LinePointAction[][],
  takeoffPoint: PointCoordinates,
  originalMode: AltitudeMode,
  mode: AltitudeMode,
): LinePointAction[][] {
  return lines.map((line) => {
    return line.map((point) => {
      const { coordinates, elevationHeight, relativeHeight } = getHeightByMode({
        mode: originalMode,
        takeoffPoint,
        height: point.height,
        coordinates: point.coordinates,
      });
      let height;
      switch (mode) {
        case AltitudeMode.Elevation:
          height = elevationHeight;
          break;
        case AltitudeMode.Relative:
        default:
          height = relativeHeight;
          break;
      }
      let surroundPoint;
      if (point.surroundPoint?.coordinates) {
        const {
          coordinates: surroundCoordinates,
          elevationHeight: surroundElevationHeight,
          relativeHeight: surroundRelativeHeight,
        } = getHeightByMode({
          mode: originalMode,
          takeoffPoint,
          height: point.surroundPoint.height,
          coordinates: point.surroundPoint.coordinates,
        });
        let surroundHeight = 0;
        switch (mode) {
          case AltitudeMode.Elevation:
            surroundHeight = surroundElevationHeight;
            break;
          case AltitudeMode.Relative:
          default:
            surroundHeight = surroundRelativeHeight;
            break;
        }
        surroundPoint = {
          ...point.surroundPoint,
          coordinates: surroundCoordinates,
          height: surroundHeight,
        };
      }
      return {
        ...point,
        height,
        coordinates,
        surroundPoint,
      };
    });
  });
}

/**
 * 根据起始点、中心点和角度生成弧形（自动适配分段数）
 * @param {turf.Point} startPoint - 起始点（经纬度）
 * @param {turf.Point} centerPoint - 中心点（经纬度）
 * @param {number} angleDegrees - 弧形的角度（度数，正数为顺时针，负数为逆时针）
 * @param enableCounterclockwise 是否启用逆时针
 * @param {number} [fullCircleSteps=64] - 完整360度圆的基准分段数
 * @returns 弧形的 LineString 几何对象
 */
export function createArcFromPoints(
  startPoint: number[],
  centerPoint: number[],
  angleDegrees: number,
  enableCounterclockwise: boolean,
  fullCircleSteps: number = 64,
): LineStringCoordinates {
  const [, , height = 0] = startPoint;
  // 1. 计算中心点到起始点的距离（米）和初始方位角（度数）
  const distance = turf.distance(centerPoint, startPoint);
  const initialBearing = turf.bearing(centerPoint, startPoint);

  // 2. 核心逻辑：根据角度占比自动计算分段数
  // 先取角度的绝对值（避免负数影响比例计算）
  const absAngle = Math.abs(angleDegrees);
  // 按比例计算分段数，向上取整（保证至少1个分段，避免0）
  const steps = Math.max(Math.ceil((absAngle / 360) * fullCircleSteps), 1);
  // 计算角度步长
  const angleStep = angleDegrees / steps;

  // 3. 生成弧形上的所有点
  const arcPoints: LineStringCoordinates = [];
  arcPoints.push(startPoint as PointCoordinates); // 加入起始点
  // 循环计算每个分段的点
  for (let i = 1; i <= steps; i++) {
    // 逆时针时，角度取负数
    const currentBearing = !enableCounterclockwise
      ? initialBearing + angleStep * i
      : initialBearing - angleStep * i;
    const currentPoint = turf.destination(
      centerPoint,
      distance,
      currentBearing,
    );
    const [lon, lat] = turf.getCoord(currentPoint);
    arcPoints.push([lon, lat, height]);
  }

  return arcPoints;
}

/**
 * 根据步长计算环绕航线每个角度的点坐标、heading、pitch角度
 * 并更新航点钟环绕点列表
 * @param point
 */
export function refreshSurroundPointListByTurn(
  point: LinePointAction,
): SurroundPoint | undefined {
  if (!point.surroundPoint) {
    return undefined;
  }
  const {
    angle,
    enableCounterclockwise,
    // 兴趣点高度
    height: surroundHeight,
    repeat,
    stepAngle,
  } = point.surroundPoint;
  // 环绕点高度
  const routePointHeight = point.height;
  const centerPoint = point.surroundPoint.coordinates as number[];
  const startPoint = point.coordinates as number[];
  // 1. 计算中心点到起始点的距离（千米）和初始方位角（度数）
  const distance = turf.distance(centerPoint, startPoint);
  const initialBearing = turf.bearing(centerPoint, startPoint);

  // 2. 计算环绕点的数量（向上取整）,当angle不能整除时，直接将angle最后的点作为结束点
  const count = Math.ceil(angle / stepAngle);

  // 3. 计算俯仰角,所有环绕点与兴趣点的形成俯仰角都相同
  const pitch = turf.radiansToDegrees(
    Math.atan((surroundHeight - routePointHeight) / (distance * 1000)),
  );

  const surroundStepPoints: SurroundPointList[] = [];
  for (let i = 0; i < count; i++) {
    // 计算环绕点的角度
    const currentBearing = !enableCounterclockwise
      ? initialBearing + stepAngle * i
      : initialBearing - stepAngle * i;
    surroundStepPoints.push(
      getSurroundPointByBearing(centerPoint, distance, currentBearing, pitch),
    );
  }
  const repeatSurroundStepPoints = [...surroundStepPoints];
  for (let i = 0; i < repeat - 1; i++) {
    repeatSurroundStepPoints.push(...surroundStepPoints);
  }
  // 计算环绕点结束点的角度
  const endBearing = !enableCounterclockwise
    ? initialBearing + angle
    : initialBearing - angle;
  repeatSurroundStepPoints.push(
    getSurroundPointByBearing(centerPoint, distance, endBearing, pitch),
  );

  return {
    ...point.surroundPoint,
    pointList: repeatSurroundStepPoints,
  };
}

/**
 * 根据中心点、距离、角度、俯仰角计算环绕点的经纬度、heading、pitch角度
 * @param centerPoint
 * @param distance
 * @param bearing
 * @param pitch
 */
function getSurroundPointByBearing(
  centerPoint: number[],
  distance: number,
  bearing: number,
  pitch: number,
) {
  // 当前计算的环绕点经纬度
  const [lon, lat] = turf.getCoord(
    //   根据当前角度计算环绕点经纬度
    turf.destination(centerPoint, distance, bearing),
  );
  // 计算环绕点与兴趣点的heading角度
  const heading = turf.bearing([lon, lat], centerPoint);
  return {
    coordinates: [lon, lat] as PointCoordinates,
    heading,
    pitch,
  };
}
