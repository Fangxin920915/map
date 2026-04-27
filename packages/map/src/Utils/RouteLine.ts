import {
  AltitudeMode,
  ellipsoidToElevation,
  getHeightByElevationHeight,
  LinePointAction,
  PointCoordinates,
} from "@gdu-gl/common";
import { isEmpty } from "lodash-es";

/**
 * ### 功能描述
 * 根据高度模式将高度字段height转化为海拔高和当前点的椭球高。
 * @param mode 高度模式
 * @param line 航线点数组
 * @param takeoffPoint 起飞点坐标
 */
export function transformRoutePointHeightByMode(
  mode: AltitudeMode,
  line: LinePointAction[] | null | undefined,
  takeoffPoint: PointCoordinates | null | undefined,
): LinePointAction[] {
  // 如果没有路线数据，返回空数组
  if (isEmpty(line)) {
    return [];
  }

  // 存储当前路线的转向点
  const points: LinePointAction[] = [];

  // 遍历路线中的每个点
  line!.forEach((point) => {
    // 只处理标记为转向点的点
    if (!point.isTurn) return;

    // 根据高度模式计算点的实际高度
    let pointElevationHeight;
    switch (mode) {
      case AltitudeMode.Relative: // 相对高度模式
        // 相对高度模式下，点的实际高度 = 点的相对高度 + 起飞点的海拔高度
        pointElevationHeight =
          point.height! + ellipsoidToElevation(takeoffPoint);
        break;
      case AltitudeMode.Elevation: // 绝对高度模式
      default:
        pointElevationHeight = point.height;
        break;
    }
    const { coordinates } = getHeightByElevationHeight({
      mode, // 默认使用绝对高度模式
      coordinates: point.coordinates, // 点的坐标
      takeoffPoint, // 起飞点数据
      height: pointElevationHeight!, // 计算后的高度
    });

    // 将点添加到当前路线的转向点列表中
    points.push({
      ...point, // 移除原始高度属性
      // 使用工具函数根据高度模式计算并添加正确的高度属性
      coordinates,
    });
  });

  // 返回计算后的所有转向点列表
  return points;
}

/**
 * 根据高度模式计算点的是相对高度还是海拔高度
 * @param mode 高度模式
 * @param relativeHeight 相对高度
 * @param elevationHeight 海拔高度
 */
export function getLinePointHeightByMode(
  mode: AltitudeMode,
  relativeHeight: number,
  elevationHeight: number,
) {
  switch (mode) {
    case AltitudeMode.Elevation:
      return elevationHeight;
    case AltitudeMode.Relative:
    default:
      return relativeHeight;
  }
}
