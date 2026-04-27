import * as Cesium from "cesium";
import { LineStringCoordinates, PointCoordinates } from "@common/Interfaces";
import { isValidLineString } from "@common/Utils";

/**
 * 线段信息接口
 * 用于记录线段的距离信息，区分主线段和新增的拐点线段
 */
interface LineSegment {
  /**
   * 中间主线段的距离（米）
   */
  mainLineSegment: LineStringCoordinates;
  /**
   * 头部插入的拐点线段距离（米）
   */
  startAddSegment: LineStringCoordinates;
  /**
   * 尾部插入的拐点线段距离（米）
   */
  endAddSegment: LineStringCoordinates;
}

/**
 * 优化后的折线结果接口
 */
export interface OptimizePolyline {
  /**
   * 增加拐点后的折线坐标数组
   */
  line: LineStringCoordinates;
  /**
   * 线段映射数组，记录每个线段的类型（主线段或新增拐点线段）
   */
  lineSegmentMap: Array<LineSegment>;
}

/**
 * 优化Cesium空间线转折点（解决尖锐转弯处线宽变细问题）
 *
 * 问题背景：
 * 在Cesium中，当折线存在尖锐转弯时，由于WebGL渲染的限制，转弯处的线会显得变细
 *
 * 解决方案：
 * 通过在每个尖锐转弯处附近添加三个非常接近的点，将线宽变细的效果限制在这三个点之间，
 * 由于这三个点距离很近，线宽变化会变得不可察觉，从而保持整体线条宽度的一致性
 *
 * 实现细节：
 * 1. 在折线的起始段、结束段和中间段分别处理
 * 2. 在每个需要处理的线段上添加两个额外的点，形成三个密集点的结构
 * 3. 记录每个线段的类型信息，区分主线段和新增的拐点线段
 *
 * @param {LineStringCoordinates} originalPoints 原始坐标数组 [[lon, lat, height], ...]
 * @param {number} defaultDistance 默认取点距离（默认0.2米，用于控制新增点的间距）
 * @returns {OptimizePolyline} 优化后的折线结果，包含坐标数组和线段类型信息
 */
export function optimizePolylineTurningPoints(
  originalPoints: LineStringCoordinates,
  defaultDistance: number = 0.2,
): OptimizePolyline {
  try {
    // 验证输入是否为有效的LineString
    isValidLineString(originalPoints);
  } catch {
    // 如果输入无效，返回空结果
    return {
      line: [] as LineStringCoordinates,
      lineSegmentMap: [
        {
          mainLineSegment: [] as LineStringCoordinates,
          startAddSegment: [] as LineStringCoordinates,
          endAddSegment: [] as LineStringCoordinates,
        },
      ],
    };
  }

  // 处理可能的null或undefined输入
  const originalLine = (originalPoints ?? []) as LineStringCoordinates;

  // 边界情况：坐标点数量<3，无转折角，无需优化，直接返回
  if (originalPoints.length < 3) {
    return {
      line: originalLine,
      lineSegmentMap: [
        {
          mainLineSegment: originalLine,
          startAddSegment: [] as LineStringCoordinates,
          endAddSegment: [] as LineStringCoordinates,
        },
      ],
    };
  }

  // 初始化结果数组
  const resultPoints: LineStringCoordinates = [];
  const lineSegmentMap: Array<LineSegment> = [];

  // 遍历所有线段
  for (let i = 0; i < originalLine.length - 1; i++) {
    // 获取当前线段的两个端点（经纬度）
    const pointDegreesA = originalPoints[i];
    const pointDegreesNext = originalPoints[i + 1];

    // 转换为Cesium笛卡尔坐标系
    const pointA = Cesium.Cartesian3.fromDegrees(...pointDegreesA);
    const pointNext = Cesium.Cartesian3.fromDegrees(...pointDegreesNext);

    // 计算两点之间的空间距离
    const distance = Cesium.Cartesian3.distance(pointA, pointNext);

    // 如果两点距离太近（小于等于默认阈值），视为重复点，直接添加当前点
    if (distance <= defaultDistance) {
      resultPoints.push(pointDegreesA);
      lineSegmentMap.push({
        mainLineSegment: [pointDegreesA, pointDegreesNext],
        startAddSegment: [] as LineStringCoordinates,
        endAddSegment: [] as LineStringCoordinates,
      });
      continue;
    }

    // 处理第一条线段
    if (i === 0) {
      // 在距离终点defaultDistance的位置添加一个点B
      const pointB = getPointAlongLine(
        pointA,
        pointNext,
        distance - defaultDistance,
      );

      // 转换为经纬度坐标
      const pointDegreesB = cartesianToDegrees(pointB);

      // 添加原始起点A和新增点B到结果数组
      resultPoints.push(pointDegreesA, pointDegreesB);

      // 记录线段信息：主线段是A-B，尾部添加的线段是B-next
      lineSegmentMap.push({
        mainLineSegment: [pointDegreesA, pointDegreesB],
        startAddSegment: [] as LineStringCoordinates,
        endAddSegment: [pointDegreesB, pointDegreesNext],
      });
      continue;
    }

    // 处理最后一条线段
    if (i === originalLine.length - 2) {
      // 在距离起点defaultDistance的位置添加一个点B
      const pointB = getPointAlongLine(pointA, pointNext, defaultDistance);

      // 转换为经纬度坐标
      const pointDegreesB = cartesianToDegrees(pointB);

      // 添加原始起点A、新增点B和原始终点到结果数组
      resultPoints.push(pointDegreesA, pointDegreesB, pointDegreesNext);

      // 记录线段信息：主线段是B-next，头部添加的线段是A-B
      lineSegmentMap.push({
        mainLineSegment: [pointDegreesB, pointDegreesNext],
        startAddSegment: [pointDegreesA, pointDegreesB],
        endAddSegment: [] as LineStringCoordinates,
      });
      continue;
    }

    // 处理中间线段（非第一条也非最后一条）

    // 在距离起点defaultDistance的位置添加点B
    const pointB = getPointAlongLine(pointA, pointNext, defaultDistance);
    const pointDegreesB = cartesianToDegrees(pointB);

    // 在距离终点defaultDistance的位置添加点C
    const pointC = getPointAlongLine(
      pointA,
      pointNext,
      distance - defaultDistance,
    );
    const pointDegreesC = cartesianToDegrees(pointC);

    // 添加原始起点A、新增点B和点C到结果数组
    // 这会在每个转弯处附近形成三个密集的点：A-B-C
    // 线宽变细的效果只会在B-C之间出现，由于距离很近，几乎不可察觉
    resultPoints.push(pointDegreesA, pointDegreesB, pointDegreesC);

    // 记录线段信息：主线段是B-C，头部添加的线段是A-B，尾部添加的线段是C-next
    lineSegmentMap.push({
      mainLineSegment: [pointDegreesB, pointDegreesC],
      startAddSegment: [pointDegreesA, pointDegreesB],
      endAddSegment: [pointDegreesC, pointDegreesNext],
    });
  }

  return {
    line: resultPoints,
    lineSegmentMap,
  };
}

/**
 * 沿线段从起点取指定距离的点（空间中）
 *
 * 此函数用于在Cesium笛卡尔坐标系中，沿着两点确定的线段，从起点开始移动指定距离，获取目标点坐标
 *
 * @param {Cesium.Cartesian3} start 起点坐标（如转折点A）
 * @param {Cesium.Cartesian3} end 终点坐标（如前点/后点）
 * @param {number} distance 要移动的距离（米）
 * @returns {Cesium.Cartesian3} 目标点的笛卡尔坐标
 */
function getPointAlongLine(
  start: Cesium.Cartesian3,
  end: Cesium.Cartesian3,
  distance: number,
): Cesium.Cartesian3 {
  const direction = Cesium.Cartesian3.subtract(
    end,
    start,
    new Cesium.Cartesian3(),
  );

  Cesium.Cartesian3.normalize(direction, direction);
  const offset = Cesium.Cartesian3.multiplyByScalar(
    direction,
    distance,
    new Cesium.Cartesian3(),
  );
  return Cesium.Cartesian3.add(start, offset, new Cesium.Cartesian3());
}

/**
 * 将Cesium笛卡尔坐标转换为经纬度坐标
 *
 * @param {Cesium.Cartesian3} cartesian Cesium笛卡尔坐标
 * @returns {PointCoordinates} 经纬度坐标数组 [经度, 纬度, 高度]
 */
function cartesianToDegrees(cartesian: Cesium.Cartesian3): PointCoordinates {
  // 转换为Cesium地理坐标
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);

  // 转换为经纬度高度数组（经度和纬度转换为度数）
  return [
    Cesium.Math.toDegrees(cartographic.longitude),
    Cesium.Math.toDegrees(cartographic.latitude),
    cartographic.height,
  ] as PointCoordinates;
}
