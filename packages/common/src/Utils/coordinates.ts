import { isEqual, isNaN, isNil } from "lodash-es";
import {
  LineStringCoordinates,
  PointCoordinates,
  PolygonCoordinates,
} from "../Interfaces/IGeojson";

/**
 * 检测坐标是否符合规范，并格式化经纬度
 * @param coordinates 坐标
 */
export function isValidCoordinates(
  coordinates?: PointCoordinates | null,
): PointCoordinates {
  const value = `坐标数据${JSON.stringify(coordinates)}：`;
  if (isNil(coordinates)) {
    throw new Error(`${value}坐标不允许为空！`);
  }

  if (!Array.isArray(coordinates)) {
    throw new Error(`${value}坐标类型不为数组`);
  }
  const [longitude, latitude, altitude] = coordinates;
  if (isNil(longitude)) {
    throw new Error(`${value}经度不允许为空！`);
  }

  if (isNil(latitude)) {
    throw new Error(`${value}纬度不允许为空！`);
  }

  const lon = Number(longitude);
  const lat = Number(latitude);
  const alt = Number(altitude ?? 0);

  if (isNaN(lon) || isNaN(lat) || isNaN(alt)) {
    throw new Error(`${value}坐标不是有效数字类型！`);
  }

  if (lon < -180 || lon > 180) {
    throw new Error(`${value}经度不在有效范围内！`);
  }
  if (lat < -85 || lat > 85) {
    throw new Error(`${value}纬度不在有效范围内！`);
  }
  return [lon, lat, alt]; // 经纬度有效
}

/**
 * 校验四至范围是否正确
 * @param extent
 */
export function isValidExtent(extent?: number[]) {
  if (!(extent && extent.length === 4)) {
    throw Error("四至范围不能为空");
  }

  const numericExtent = extent.map((degree, index) => {
    const numValue = Number(degree);
    if (Number.isNaN(numValue)) {
      console.warn(`四至范围类型不正确: 错误下标：${index};错误值：${degree}`);
      return null; // 返回 null 表示无效值
    }
    return numValue;
  });

  // 检查是否有无效值
  if (numericExtent.includes(null)) {
    throw Error("四至范围类型不正确");
  }

  const [minX, minY, maxX, maxY] = numericExtent as number[];

  // 检查经度范围
  if (minX < -180 || maxX > 180 || minX >= maxX) {
    throw Error("四至范围经度不符合规范。 -180 <= minLon < maxLon <= 180.");
  }

  // 检查纬度范围
  if (minY < -90 || maxY > 90 || minY >= maxY) {
    throw Error("四至范围纬度不符合规范。 -90 <= minY < maxY <= 90.");
  }
  return true;
}

/**
 * 设置图层范围时，将层级限制[-180, -85, 180, 85]范围内，防止图层报错
 * @param extent
 */
export function normalizationExtent(extent?: number[]) {
  let normalization: number[] = [];
  try {
    isValidExtent(extent);
    normalization = extent as unknown as number[];
  } catch (e) {
    console.warn(e);
    normalization = [-180, -85, 180, 85];
  }
  const [minX, minY, maxX, maxY] = normalization;
  // 在cesium中最大范围为[-180,-85,180,85],超出会报错
  return [minX, Math.max(-85, minY), maxX, Math.min(85, maxY)];
}

/**
 * 校验LineString的坐标是否正确
 * @param coordinates
 */
export function isValidLineString(
  coordinates?: LineStringCoordinates,
): LineStringCoordinates {
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    throw new Error(
      `LineString必须包含至少2个坐标点，当前数量：${coordinates?.length ?? 0}`,
    );
  }

  return coordinates.map((coordinate, i) => {
    try {
      return isValidCoordinates(coordinate);
    } catch (e: any) {
      throw new Error(`第${i}个坐标点错误：${e.message}`);
    }
  });
}

/**
 * 校验Polygon的坐标是否正确
 * @param coordinates
 */
export function isValidPolygon(
  coordinates?: PolygonCoordinates,
): PolygonCoordinates {
  // 层级结构校验
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    throw new Error(`Polygon坐标必须为三维数组`);
  }

  return coordinates.map((ring, ringIndex) => {
    // 单环基础校验，至少需要3个不同的点
    if (!Array.isArray(ring) || ring.length < 3) {
      throw new Error(
        `第${ringIndex}个线性环必须包含至少3个坐标点，当前数量：${ring?.length ?? 0}`,
      );
    }

    // 校验并格式化每个坐标点
    const validatedRing = ring.map((point, pointIndex) => {
      try {
        // 调用基础坐标校验（自动忽略高程）
        return isValidCoordinates(point);
      } catch (e: any) {
        throw new Error(
          `第${ringIndex}环第${pointIndex}个坐标点错误：${e.message}`,
        );
      }
    });

    // 检查环是否闭合，如果不闭合则自动闭合
    const firstPoint = validatedRing[0];
    const lastPoint = validatedRing[validatedRing.length - 1];
    if (!isEqual(firstPoint, lastPoint)) {
      // 自动闭合：添加第一个点作为最后一个点
      validatedRing.push(firstPoint);
    }

    return validatedRing;
  });
}
