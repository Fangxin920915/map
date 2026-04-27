import { GeoidInstance } from "@common/General";
import { PointCoordinates } from "@common/Interfaces";
import { isEmpty } from "lodash-es";
import { altitudeAccuracy } from "./measure";

/**
 * 将椭球高度转换为海拔高度。
 * 椭球高度是指从参考椭球面到目标点的垂直距离，海拔高度是指从大地水准面到目标点的垂直距离。
 * 两者的转换需要借助高程异常值，高程异常值是大地水准面相对于参考椭球面的垂直距离。
 * @param coordinates - 包含经度、纬度和椭球高度的坐标点，类型为 PointCoordinates。
 * @returns 转换后的海拔高度。
 */
export function ellipsoidToElevation(
  coordinates: PointCoordinates | null | undefined,
) {
  if (isEmpty(coordinates)) {
    return 0;
  }
  // 从坐标中提取椭球高度，若未提供则默认值为 0
  const [, , height = 0] = coordinates!;
  // 获取指定坐标处的高程异常值
  const N = GeoidInstance.getHeight(coordinates!);
  // 根据公式：海拔高度 = 椭球高度 - 高程异常值，将椭球高转换为海拔高
  return altitudeAccuracy(height - N);
}

/**
 * 将海拔高度转换为椭球高度。
 * 该函数通过获取指定坐标处的高程异常值，结合给定的海拔高度，计算出对应的椭球高度。
 * @param coordinates - 包含经度、纬度的坐标点，类型为 PointCoordinates。
 * @param elevation - 目标点的海拔高度。
 * @returns 转换后的椭球高度。
 */
export function elevationToEllipsoid(
  coordinates: PointCoordinates | null | undefined,
  elevation: number,
) {
  if (isEmpty(coordinates)) {
    return elevation;
  }
  // 获取指定坐标处的高程异常值
  const N = GeoidInstance.getHeight(coordinates!);
  // 根据公式：椭球高度 = 海拔高度 + 高程异常值，将海拔高转换为椭球高
  return altitudeAccuracy(elevation + N);
}
