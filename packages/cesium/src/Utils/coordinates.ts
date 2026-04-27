import * as Cesium from "cesium";
import {
  OptimizePolyline,
  PointCoordinates,
  RouteProgressParams,
  SurroundRouteProgressParams,
} from "@gdu-gl/common";
import * as turf from "@turf/turf";

/**
 * 世界坐标转经纬度
 * @param cartesian
 */
export function cartesian2Coordinates(
  cartesian?: Cesium.Cartesian3,
): PointCoordinates | undefined {
  if (!cartesian) {
    return undefined;
  }
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  const longitude = Cesium.Math.toDegrees(cartographic.longitude);
  const latitude = Cesium.Math.toDegrees(cartographic.latitude);
  const { height } = cartographic;
  const heightString = height.toFixed(1);
  // 高度在相机视角较远的时候，会有个非常大的误差，需要特殊处理一下这个值
  const sampleHeight = Number(heightString);
  return [longitude, latitude, sampleHeight];
}

/**
 * 通过屏幕坐标获取经纬度
 * @param viewer
 * @param pixel
 */
export function pickPositionByPixel(
  viewer: Cesium.Viewer,
  pixel: Cesium.Cartesian2,
) {
  const pickObj = viewer.scene.pick(pixel, 5, 5);
  const cartesian = getPickPosition(viewer, pickObj, pixel);
  return cartesian2Coordinates(cartesian);
}

export function pickPositionByDirection(
  viewer: Cesium.Viewer,
  direction: {
    position: PointCoordinates;
    heading: number;
    pitch: number;
    roll: number;
  },
) {
  const { position, heading, pitch, roll } = direction;
  // 1. 将经纬度坐标转换为笛卡尔坐标（射线原点）
  const [lon, lat, height = 0] = position;

  // 输入参数
  const origin = Cesium.Cartesian3.fromDegrees(lon, lat, height);
  // 3. 将角度转换为弧度
  const headingRad = Cesium.Math.toRadians(heading);
  const pitchRad = Cesium.Math.toRadians(pitch);
  const rollRad = Cesium.Math.toRadians(roll);

  // 步骤1：创建ENU变换矩阵
  const ellipsoid = Cesium.Ellipsoid.WGS84;
  const localTransform = Cesium.Transforms.eastNorthUpToFixedFrame(
    origin,
    ellipsoid,
  );

  // 步骤2：调整heading并创建HPR对象
  const hpr = new Cesium.HeadingPitchRoll(
    headingRad - Cesium.Math.PI_OVER_TWO,
    pitchRad,
    rollRad,
  );

  // 步骤3-4：创建四元数和旋转矩阵
  const rotQuat = Cesium.Quaternion.fromHeadingPitchRoll(hpr);
  const rotMat = Cesium.Matrix3.fromQuaternion(rotQuat);

  // 步骤5：获取本地坐标系下的方向向量
  const localDirection = new Cesium.Cartesian3();
  Cesium.Matrix3.getColumn(rotMat, 0, localDirection);

  // 步骤6：转换为世界坐标系
  const directionWC = new Cesium.Cartesian3();
  Cesium.Matrix4.multiplyByPointAsVector(
    localTransform,
    localDirection,
    directionWC,
  );
  Cesium.Cartesian3.normalize(directionWC, directionWC);

  const ray = new Cesium.Ray(origin, directionWC);
  // 检测射线与地球椭球体的交点
  const intersections = Cesium.IntersectionTests.rayEllipsoid(
    ray,
    viewer.scene.globe.ellipsoid,
  );

  // 如果存在交点，返回射线起点到交点位置的坐标
  if (intersections) {
    return cartesian2Coordinates(Cesium.Ray.getPoint(ray, intersections.start));
  }
  return undefined;
}

/**
 * 获取拾取坐标
 * @param viewer
 * @param pickObj 拾取的对象
 * @param pixel 鼠标位置
 */
export function getPickPosition(
  viewer: Cesium.Viewer,
  pickObj: any,
  pixel: Cesium.Cartesian2,
) {
  if (
    Cesium.defined(pickObj) &&
    pickObj.primitive instanceof Cesium.Cesium3DTileset
  ) {
    return viewer.scene.pickPosition(pixel);
  }
  const ray = viewer.camera.getPickRay(pixel);
  if (ray) {
    return viewer.scene.globe.pick(ray, viewer.scene);
  }
  return undefined;
}

/**
 * 获取正常航线的进度（没有经过平滑优化的航线）
 * @param params
 */
export function getCesiumRouteLineProgress(params: RouteProgressParams) {
  const { flyToPointIndex, line, clampToGround } = params;
  if (flyToPointIndex <= 1) {
    return 0;
  }
  if (flyToPointIndex > line.length) {
    return 1;
  }
  if (clampToGround) {
    return getGroundLineProgress(params);
  }
  return getLineProgress(params);
}

/**
 * 获取环绕航线的进度
 *
 * 该函数通过计算无人机当前位置与环绕中心点的夹角，来确定环绕航线的进度
 *
 * @param {SurroundRouteProgressParams} params 环绕航线进度计算参数
 * @returns {number} 环绕航线进度，范围在0到1之间
 */
export function getCesiumSurroundRouteLineProgress(
  params: SurroundRouteProgressParams,
): number {
  const {
    center,
    line,
    uavPosition,
    angle,
    enableCounterclockwise,
    startPoint,
    endPoint,
    startAngle,
    endAngle,
  } = params;
  // 边界条件处理
  if (!line || line.length < 1 || !center || !uavPosition) {
    return 0;
  }

  // 获取环绕航线的起始点
  const startPointOfSurround = line[0];

  // 计算中心点到起始点的方位角（转换为弧度）
  let angleUav = turf.angle(
    startPointOfSurround as number[],
    center as number[],
    uavPosition as number[],
  );

  if (enableCounterclockwise) {
    angleUav = 360 - angleUav;
  }

  let currentAngle = angleUav;
  if (
    (Math.abs(angleUav - 360) <= 3 || Math.abs(angleUav) <= 3) &&
    (angleUav <= startAngle || angleUav >= endAngle)
  ) {
    const distanceToStart = turf.distance(
      uavPosition as number[],
      startPoint as number[],
    );
    const distanceToEnd = turf.distance(
      uavPosition as number[],
      endPoint as number[],
    );
    currentAngle = distanceToStart <= distanceToEnd ? startAngle : endAngle;
  }

  // 计算进度，将夹角转换为相对于环绕角度的比例
  const progress = currentAngle / angle;

  // 限制进度范围在0到1之间
  return Math.max(0, Math.min(1, progress));
}

/**
 * 计算Cesium优化后空间航线的进度
 *
 * ## 问题背景
 * 在Cesium中，带有高度信息的空间航线不能直接使用"飞机飞行距离 / 航线总长度"来计算进度。
 * 这是因为Cesium的纹理坐标是按线段数量均匀分配的，而不是按实际飞行距离。
 *
 * ## 优化航线的结构（举例说明）
 * 假设原始航线有3个航点 A -> B -> C：
 * ```
 * 原始航线: A -------- B -------- C
 * 航段编号:    [0]         [1]
 * ```
 *
 * 经过 optimizePolylineTurningPoints 优化后，每个原始航段可能被拆分为多个子线段：
 * ```
 * 优化后: A -- A1 -- B1 -- B -- B2 -- C1 -- C
 * 线段:   [A-A1] [A1-B1] [B1-B] [B-B2] [B2-C1] [C1-C]
 * 类型:   [头部] [主线段] [尾部] [头部] [主线段] [尾部]
 * ```
 *
 * lineSegmentMap 记录了每个原始航段对应的子线段信息：
 * - lineSegmentMap[0] = { mainLineSegment: [A1,B1], startAddSegment: [A,A1], endAddSegment: [B1,B] }
 * - lineSegmentMap[1] = { mainLineSegment: [B2,C1], startAddSegment: [B,B2], endAddSegment: [C1,C] }
 *
 * ## 进度计算原理
 * 1. 每个优化后的线段平均分配总进度（假设共6个线段，每个线段占 1/6）
 * 2. 在每个线段内部，通过投影计算无人机在该线段上的进度比例（0~1）
 * 3. 总进度 = 已完成线段的累计进度 + 当前线段的进度比例
 *
 * @param {RouteProgressParams & { optimizePolyline: OptimizePolyline }} params 进度计算参数
 * @returns {number} 航线进度，范围在0到1之间
 */
export function getCesiumOptimizePolylineProgress(
  params: RouteProgressParams & { optimizePolyline: OptimizePolyline },
): number {
  // 解构参数
  const { flyToPointIndex, optimizePolyline, uavPosition } = params;
  const { lineSegmentMap } = optimizePolyline;
  const originalLineLength = params.line.length;

  // ==================== 边界条件处理 ====================

  // 情况1：未开始飞行或航线点不足
  // flyToPointIndex <= 1 表示还在起飞点或第一个航点，进度为0
  // originalLineLength < 2 表示航线少于2个点，无法形成航线
  if (flyToPointIndex <= 1 || originalLineLength < 2) {
    return 0;
  }

  // 情况2：飞行已结束
  // flyToPointIndex > originalLineLength 表示已经飞过最后一个航点
  if (flyToPointIndex > originalLineLength) {
    return 1;
  }

  // 情况3：计算当前飞行所在的原始航段索引
  // flyToPointIndex 表示"正在飞往第几个航点"，从1开始计数
  // segmentIndex 是 lineSegmentMap 的索引，从0开始
  // 例如：flyToPointIndex = 2 表示正在飞往第2个航点，对应 lineSegmentMap[0]
  const segmentIndex = flyToPointIndex - 2;

  // 情况4：lineSegmentMap 为空，无法计算
  if (!lineSegmentMap || lineSegmentMap.length === 0) {
    return 0;
  }

  // 情况5：索引越界保护
  if (segmentIndex >= lineSegmentMap.length) {
    return 1;
  }

  // ==================== 计算单位线段进度权重 ====================

  // perRatio: 每个优化后线段占总进度的平均比例
  // 例如：优化后有7个点，则有6个线段，perRatio = 1/6 ≈ 0.167
  // 这意味着每个线段平均占总进度的约16.7%
  const perRatio = 1 / (optimizePolyline.line.length - 1);

  // ==================== 获取当前航段的子线段信息 ====================

  // 从 lineSegmentMap 获取当前原始航段对应的三个子线段：
  // - mainLineSegment: 主线段（原始航段的主体部分）
  // - startAddSegment: 头部添加线段（在主线段起点处插入的拐点线段）
  // - endAddSegment: 尾部添加线段（在主线段终点处插入的拐点线段）
  // 注意：某些线段可能为空（如第一个航段可能没有头部添加线段）
  const { mainLineSegment, startAddSegment, endAddSegment } =
    lineSegmentMap[segmentIndex];

  // ==================== 计算无人机在各子线段上的投影比例 ====================

  // calculateProjection 函数计算无人机在一条线段上的投影位置
  // 返回的 ratio 表示：无人机投影点到线段起点的距离 / 线段总长度
  // ratio ∈ [0, 1]：
  //   - ratio = 0: 无人机在线段起点
  //   - ratio = 1: 无人机在线段终点
  //   - ratio < 0 或 ratio > 1: 无人机在线段的延长线上

  // 计算在主线段上的投影比例
  // 例如：mainCurrentRatio = 0.5 表示无人机在主线段的中间位置
  const { ratio: mainCurrentRatio } = calculateProjection(
    mainLineSegment[0] && Cesium.Cartesian3.fromDegrees(...mainLineSegment[0]),
    mainLineSegment[1] && Cesium.Cartesian3.fromDegrees(...mainLineSegment[1]),
    Cesium.Cartesian3.fromDegrees(...uavPosition),
  );

  // 计算在头部添加线段上的投影比例
  const { ratio: startAddRatio } = calculateProjection(
    startAddSegment[0] && Cesium.Cartesian3.fromDegrees(...startAddSegment[0]),
    startAddSegment[1] && Cesium.Cartesian3.fromDegrees(...startAddSegment[1]),
    Cesium.Cartesian3.fromDegrees(...uavPosition),
  );

  // 计算在尾部添加线段上的投影比例
  const { ratio: endAddRatio } = calculateProjection(
    endAddSegment[0] && Cesium.Cartesian3.fromDegrees(...endAddSegment[0]),
    endAddSegment[1] && Cesium.Cartesian3.fromDegrees(...endAddSegment[1]),
    Cesium.Cartesian3.fromDegrees(...uavPosition),
  );

  // ==================== 计算当前航段的进度贡献 ====================

  // 当前航段的进度 = 各子线段的投影比例 × 单位权重之和
  //
  // 举例：假设 perRatio = 0.167，无人机在主线段中点（ratio=0.5），其他线段未进入（ratio=0）
  // currentRatio = 0.5 × 0.167 + 0 × 0.167 + 0 × 0.167 = 0.0835
  // 表示当前航段贡献了约8.35%的进度
  const currentRatio =
    mainCurrentRatio * perRatio +
    startAddRatio * perRatio +
    endAddRatio * perRatio;

  // ==================== 计算已完成航段的累计进度 ====================

  // 遍历当前航段之前的所有航段，累加它们的完整进度
  // 每个已完成的子线段贡献 perRatio 的进度
  //
  // 举例：假设之前已完成3个航段，每个航段有3个子线段，perRatio = 0.167
  // finishRatio = 3 × 3 × 0.167 = 1.5（会被clamp到1.0以内）
  let finishRatio = 0;
  lineSegmentMap.slice(0, segmentIndex).forEach((lineSegment) => {
    // 如果存在头部添加线段，说明该航段已完成这部分，加 perRatio
    if (lineSegment.startAddSegment.length > 0) {
      finishRatio += perRatio;
    }
    // 如果存在尾部添加线段，说明该航段已完成这部分，加 perRatio
    if (lineSegment.endAddSegment.length > 0) {
      finishRatio += perRatio;
    }
    // 如果存在主线段，说明该航段已完成这部分，加 perRatio
    if (lineSegment.mainLineSegment.length > 0) {
      finishRatio += perRatio;
    }
  });

  // ==================== 返回最终进度 ====================

  // 总进度 = 已完成航段的累计进度 + 当前航段的进度
  // 使用 clamp 确保结果在 [0, 1] 范围内
  return Cesium.Math.clamp(finishRatio + currentRatio, 0, 1);
}

/**
 * 空间航线是，获取无人机进度
 * 特别注意：空间线模式下cesium纹理坐标，进度与航线进度不一样的
 * 例如：
 * 一个航线有6个航点，无人机在第四个航点，那么他飞过进度1/(6-1)*(4-1)
 *
 * 空间线的纹理坐标是按照分段的比例去计算，而不是飞行的距离展示
 * @param params
 */
function getLineProgress(params: RouteProgressParams) {
  const { flyToPointIndex, line, uavPosition } = params;
  const [start, end] = line.slice(flyToPointIndex - 2, flyToPointIndex);
  const { ratio: currentRatio } = calculateProjection(
    // @ts-ignore
    Cesium.Cartesian3.fromDegrees(...start),
    // @ts-ignore
    Cesium.Cartesian3.fromDegrees(...end),
    // @ts-ignore
    Cesium.Cartesian3.fromDegrees(...uavPosition),
  );
  // 计算每个航段占总进度的比例(均匀分配)
  const perRatio = 1 / (line.length - 1);

  // 计算已完成航段的累计进度(不包括当前航段)
  const finishRatio = (flyToPointIndex - 2) * perRatio;

  // 总进度 = 已完成航段进度 + 当前航段进度*航段权重
  return currentRatio * perRatio + finishRatio;
}

/**
 * 航线贴地时，获取进度
 * 特别注意：贴地模式下cesium纹理坐标，进度与航线进度是一致的
 * @param params
 */
function getGroundLineProgress(params: RouteProgressParams) {
  const { flyToPointIndex, line, uavPosition } = params;
  const [start, end] = line.slice(flyToPointIndex - 2, flyToPointIndex);
  const { distance: currentDistance } = calculateProjection(
    // @ts-ignore
    Cesium.Cartesian3.fromDegrees(start[0], start[1]),
    // @ts-ignore
    Cesium.Cartesian3.fromDegrees(end[0], end[1]),
    // @ts-ignore
    Cesium.Cartesian3.fromDegrees(uavPosition[0], uavPosition[1]),
  );

  // 计算航线总长度和已完成长度
  let totalDistance = 0;
  let finishDistance = 0;
  for (let i = 0; i < line.length - 1; i++) {
    // 将经纬度坐标转换为笛卡尔坐标
    // @ts-ignore
    const currentPoint = Cesium.Cartesian3.fromDegrees(line[i][0], line[i][1]);
    // @ts-ignore
    const nextPoint = Cesium.Cartesian3.fromDegrees(
      line[i + 1][0],
      line[i + 1][1],
    );

    // 计算相邻航点间的距离并累加
    const distance = Cesium.Cartesian3.distance(currentPoint, nextPoint);
    totalDistance += distance;

    // 如果航点索引小于已完成航段，累加已完成距离
    if (i < flyToPointIndex - 2) {
      finishDistance += distance;
    }
  }

  // 处理航线长度为0的特殊情况
  if (totalDistance <= 0) {
    return 0;
  }
  // 计算已完成航段占总航线的比例
  // 返回总进度 = 已完成航段比例 + 当前航段进度比例
  return (finishDistance + currentDistance) / totalDistance;
}

/**
 * 计算点在线段上的投影比例
 * @param lineStart 线段起点坐标
 * @param lineEnd 线段终点坐标
 * @param point 要计算的点坐标
 * @returns 点在线段上的投影比例，范围在0到1之间
 */
export function calculateProjection(
  lineStart: Cesium.Cartesian3 | undefined,
  lineEnd: Cesium.Cartesian3 | undefined,
  point: Cesium.Cartesian3,
) {
  // 处理线段长度为0的情况
  if (!lineEnd || !lineStart || Cesium.Cartesian3.equals(lineStart, lineEnd)) {
    return {
      ratio: 0,
      distance: 0,
    };
  }

  // 计算线段向量
  const lineVector = Cesium.Cartesian3.subtract(
    lineEnd,
    lineStart,
    new Cesium.Cartesian3(),
  );
  const lineLength = Cesium.Cartesian3.magnitude(lineVector);

  // 计算点到起点的向量
  const pointVector = Cesium.Cartesian3.subtract(
    point,
    lineStart,
    new Cesium.Cartesian3(),
  );

  // 计算点在线段上的投影长度
  const dotProduct = Cesium.Cartesian3.dot(lineVector, pointVector);
  const projectionLength = dotProduct / lineLength;

  // 计算投影比例
  const ratio = projectionLength / lineLength;

  // 判断投影是否在线段范围内
  if (ratio < 0) {
    return {
      ratio: 0,
      distance: 0,
    }; // 投影在线段左侧
  }
  if (ratio > 1) {
    return {
      ratio: 1,
      distance: lineLength,
    }; // 投影在线段右侧
  }

  return {
    ratio,
    distance: projectionLength,
  };
}
