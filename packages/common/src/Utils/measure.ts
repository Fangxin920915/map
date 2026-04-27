import * as Cesium from "cesium";
import {
  isValidCoordinates,
  isValidLineString,
  isValidPolygon,
} from "@common/Utils";
import {
  LineStringCoordinates,
  PointCoordinates,
  PolygonCoordinates,
} from "@common/Interfaces";
import { isEmpty, isFinite, isNaN, isNil } from "lodash-es";
import * as turf from "@turf/turf";

/**
 * 获取两点之间的椭球距离
 * @param start 起始点
 * @param end 结束点
 */
export function getEllipsoidDistance(
  start: PointCoordinates,
  end: PointCoordinates,
) {
  const [startLon, startLat, startAlt] = isValidCoordinates(start);
  const [endLon, endLat, endAlt] = isValidCoordinates(end);
  const point1cartographic = Cesium.Cartographic.fromDegrees(
    startLon,
    startLat,
    startAlt,
  );
  const point2cartographic = Cesium.Cartographic.fromDegrees(
    endLon,
    endLat,
    endAlt,
  );
  /** 根据经纬度计算出距离* */
  const geodesic = new Cesium.EllipsoidGeodesic();
  geodesic.setEndPoints(point1cartographic, point2cartographic);
  return geodesic.surfaceDistance;
}

/**
 * 获取两点之间的直线距离
 * @param start 起始点
 * @param end 结束点
 */
export function getStraightLineDistance(
  start: PointCoordinates,
  end: PointCoordinates,
) {
  const [startLon, startLat, startAlt] = isValidCoordinates(start);
  const [endLon, endLat, endAlt] = isValidCoordinates(end);
  // 将经纬度坐标转换为笛卡尔空间直角坐标
  const point1Cartesian = Cesium.Cartesian3.fromDegrees(
    startLon,
    startLat,
    startAlt,
  );
  const point2Cartesian = Cesium.Cartesian3.fromDegrees(endLon, endLat, endAlt);
  // 计算两点间的直线距离
  return Number(
    Cesium.Cartesian3.distance(point1Cartesian, point2Cartesian).toFixed(1),
  );
}

/**
 * 获取两点的中心点
 * @param start 起始点
 * @param end 结束点
 * @returns 中心点的经纬度和海拔高度，类型为 PointCoordinates
 */
export function getMidPoint(
  start: PointCoordinates,
  end: PointCoordinates,
): PointCoordinates {
  const [startLon, startLat, startAlt] = isValidCoordinates(start);
  const [endLon, endLat, endAlt] = isValidCoordinates(end);
  // 将经纬度坐标转换为笛卡尔空间直角坐标
  const point1Cartesian = Cesium.Cartesian3.fromDegrees(
    startLon,
    startLat,
    startAlt,
  );
  const point2Cartesian = Cesium.Cartesian3.fromDegrees(endLon, endLat, endAlt);

  // 计算两点的中点的笛卡尔坐标
  const midPointCartesian = Cesium.Cartesian3.midpoint(
    point1Cartesian,
    point2Cartesian,
    new Cesium.Cartesian3(),
  );

  // 将中点的笛卡尔坐标转换为经纬度坐标
  const midPointCartographic =
    Cesium.Cartographic.fromCartesian(midPointCartesian);
  const midLon = Cesium.Math.toDegrees(midPointCartographic.longitude);
  const midLat = Cesium.Math.toDegrees(midPointCartographic.latitude);
  const midAlt = midPointCartographic.height;

  return [midLon, midLat, midAlt];
}

/**
 * 获取两点的方向
 * @param from
 * @param to
 */
export function getBearing(from: PointCoordinates, to: PointCoordinates) {
  const [fromLon, fromLat] = isValidCoordinates(from);
  const [toLon, toLat] = isValidCoordinates(to);
  const fromRadiansLat = Cesium.Math.toRadians(fromLat);
  const fromRadiansLon = Cesium.Math.toRadians(fromLon);
  const toRadiansLat = Cesium.Math.toRadians(toLat);
  const toRadiansLon = Cesium.Math.toRadians(toLon);
  let angle = -Math.atan2(
    Math.sin(fromRadiansLon - toRadiansLon) * Math.cos(toRadiansLat),
    Math.cos(fromRadiansLat) * Math.sin(toRadiansLat) -
      Math.sin(fromRadiansLat) *
        Math.cos(toRadiansLat) *
        Math.cos(fromRadiansLon - toRadiansLon),
  );
  if (angle < 0) {
    angle += Math.PI * 2.0;
  }
  angle = Cesium.Math.toDegrees(angle); // 角度
  return angle;
}

/**
 * 获取相邻的三个的夹角
 * @param p1
 * @param p2
 * @param p3
 */
export function getAngle(
  p1: PointCoordinates,
  p2: PointCoordinates,
  p3: PointCoordinates,
) {
  const bearing21 = getBearing(p2, p1);
  const bearing23 = getBearing(p2, p3);
  let angle = bearing21 - bearing23;
  if (angle < 0) {
    angle += 360;
  }
  return angle;
}

/**
 * 计算海拔高度的精度,将高程保存为小数点后1位。
 * 该函数接受一个海拔高度作为参数，并返回一个四舍五入后的精度值。
 * @param height - 目标点的海拔高度。
 * @returns 四舍五入后的海拔高度精度。
 */
export function altitudeAccuracy(height: number | string) {
  // 转换字符串为数字
  const numericHeight = typeof height === "string" ? Number(height) : height;

  // 参数校验
  if (isNaN(numericHeight)) throw new Error("高度值必须为数字");
  if (!isFinite(numericHeight)) throw new Error("高度值必须为有效数字");
  return Math.round(numericHeight * 10) / 10;
}

/**
 * 获取多边形的中心点
 * @param coordinates
 */
export function getGroundPolygonCenter(coordinates: PolygonCoordinates) {
  const polygon = isValidPolygon(coordinates);
  const polygonGeo = turf.polygon(polygon as number[][][]);
  if (turf.kinks(polygonGeo).features.length > 0) {
    return null;
  }
  const center = turf.centroid(polygonGeo);
  return center.geometry.coordinates as PointCoordinates;
}

/**
 * 获取线段的中心点
 * @param coordinates
 */
export function getGroundLineStringCenter(coordinates: LineStringCoordinates) {
  const line = isValidLineString(coordinates);
  const lineString = turf.lineString(line as number[][]);
  // 计算线段总长度
  const totalLength = turf.length(lineString);

  // 获取中点（距离起点总长度的一半）
  const centerPoint = turf.along(lineString, totalLength / 2);

  return centerPoint.geometry.coordinates as PointCoordinates;
}

/**
 * 获取环绕飞行的最大半径
 * @param takeoffPoint 起飞点
 * @param center 环绕飞行中心点坐标
 * @param maxDistance 最大允许距离
 */
export function getSurroundMaxRadius(
  takeoffPoint: PointCoordinates,
  center: PointCoordinates,
  maxDistance: number,
) {
  // 计算中心点到起飞点的直线距离
  // 使用turf.distance方法获取两点间的地理距离（默认单位为公里）
  const distance = turf.distance(center as number[], takeoffPoint as number[]);

  // 计算最大允许半径
  // 最大半径 = 允许的最大距离 - 中心点到起飞点的距离
  // 这确保整个环绕区域不超过设定的最大飞行距离
  return maxDistance - distance;
}

/**
 * 检查环绕飞行是否超过最大允许距离
 * @param takeoffPoint 起飞点
 * @param center 环绕飞行中心点坐标
 * @param radius 环绕飞行半径
 * @param maxDistance 最大允许距离
 */
export function booleanExceedingDistance(
  takeoffPoint: PointCoordinates,
  center: PointCoordinates,
  radius: number,
  maxDistance: number,
) {
  if (isEmpty(takeoffPoint) || isNil(maxDistance) || isEmpty(center)) {
    return false;
  }
  const distance = turf.distance(
    turf.point(takeoffPoint as number[]),
    turf.point(center as number[]),
  );

  return distance + radius > maxDistance;
}
