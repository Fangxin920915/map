import * as Cesium from "cesium";

/**
 * 给定坐标和姿态，模拟计算相机direction
 * @param options
 * @return Cesium.Cartesian3
 */
export function getFakeCameraDirection(options: {
  position: Cesium.Cartesian3;
  heading: number;
  pitch: number;
  roll: number;
}) {
  const { position, heading = 0, pitch = 0, roll = 0 } = options;

  // 创建HeadingPitchRoll对象并调整航向角（Cesium内部处理方式）
  const hpr = {
    heading: heading - Cesium.Math.PI_OVER_TWO, // 关键调整，与Camera内部一致
    pitch,
    roll,
  };

  // 从姿态角创建四元数
  const rotQuat = Cesium.Quaternion.fromHeadingPitchRoll(
    hpr as Cesium.HeadingPitchRoll,
    new Cesium.Quaternion(),
  );

  // 从四元数创建旋转矩阵
  const rotMat = Cesium.Matrix3.fromQuaternion(rotQuat, new Cesium.Matrix3());

  // 从旋转矩阵的第一列获取本地坐标系下的方向向量
  const directionLocal = new Cesium.Cartesian3();
  Cesium.Matrix3.getColumn(rotMat, 0, directionLocal);
  Cesium.Cartesian3.normalize(directionLocal, directionLocal);

  // 计算基于位置的东-北-上(ENU)坐标系变换矩阵
  const transform = Cesium.Transforms.eastNorthUpToFixedFrame(position);

  // 将本地方向向量转换为世界坐标系下的方向向量
  const directionWC = Cesium.Matrix4.multiplyByPointAsVector(
    transform,
    directionLocal,
    new Cesium.Cartesian3(),
  );
  Cesium.Cartesian3.normalize(directionWC, directionWC);
  return directionWC;
}

/**
 * Cesium射线与WGS84椭球求交函数
 * @param {Object} options - 输入参数配置
 * @param {Cesium.Cartesian3} options.origin - 射线起点（世界坐标系Cartesian3）
 * @param {number} options.heading - 方位角（弧度，0=北，顺时针为正）
 * @param {number} options.pitch - 俯仰角（弧度，0=水平，向上为正，向下为负）
 * @param {number} options.roll - 滚转角（弧度，0=无翻滚，顺时针为正）
 * @param {Cesium.Cartesian3} [options.localDirection=Cesium.Cartesian3.UNIT_Z] - 局部坐标系下的发射方向（默认沿局部Z轴，即前方）
 * @param {Cesium.Ellipsoid} [options.ellipsoid=Cesium.Ellipsoid.WGS84] - 目标椭球（默认WGS84地球）
 * @returns {Object} 求交结果
 * @returns {boolean} success - 是否成功相交
 * @returns {Cesium.Cartesian3[]} intersections - 交点数组（最多2个，按距离起点由近到远排序）
 * @returns {Cesium.Cartesian3} direction - 世界坐标系下的射线方向向量
 */
export function rayEllipsoidIntersection(options: {
  origin: any;
  heading?: any;
  pitch?: any;
  roll?: any;
  localDirection?: any;
  ellipsoid?: any;
}) {
  const { origin, heading = 0, pitch = 0, roll = 0 } = options;
  const ellipsoid = Cesium.Ellipsoid.WGS84;

  const worldDirection = getFakeCameraDirection({
    position: origin,
    heading,
    pitch,
    roll,
  });

  // console.log('世界坐标系下射线起点：', origin);

  // 3. 创建射线（起点+世界方向）
  const ray = new Cesium.Ray(origin, worldDirection);

  // 4. 计算射线与椭球的交点
  const intersections: string | any[] = [];
  const intersectionResult = Cesium.IntersectionTests.rayEllipsoid(
    ray,
    ellipsoid,
  );
  let length = 10000;
  if (intersectionResult) {
    length = intersectionResult.start;
    // console.log('世界坐标系下射线交点：', point);
  }
  const point = Cesium.Ray.getPoint(ray, length);
  const cartographic = ellipsoid.cartesianToCartographic(point);
  const lon = Cesium.Math.toDegrees(cartographic.longitude);
  const lat = Cesium.Math.toDegrees(cartographic.latitude);
  const { height } = cartographic;
  intersections.push({
    lon,
    lat,
    height,
  });
  return {
    intersections,
    direction: worldDirection,
  };
}

/**
 * 沿指定方向（Cartesian3向量）移动指定距离，原点和方向均为世界坐标系（Cartesian3）
 * @param {Cesium.Cartesian3} origin - 起点世界坐标（Cartesian3）
 * @param {Cesium.Cartesian3} direction - 移动方向向量（Cartesian3，无需归一化）
 * @param {number} distance - 移动距离（米，正数向前，负数向后）
 * @returns {Cesium.Cartesian3} 移动后的世界坐标（Cartesian3）
 * @throws {Error} 方向向量为零向量或参数类型非法时抛出错误
 */
export function moveAlongDirection(
  origin: Cesium.Cartesian3,
  direction: Cesium.Cartesian3,
  distance: number,
) {
  // 归一化方向向量（关键：确保移动距离精确，不受原方向向量长度影响）
  const normalizedDir = Cesium.Cartesian3.normalize(
    direction,
    new Cesium.Cartesian3(),
  );
  if (Cesium.Cartesian3.equals(normalizedDir, Cesium.Cartesian3.ZERO)) {
    throw new Error("方向向量不能是零向量（无法确定移动方向）");
  }

  // 计算偏移量 + 目标坐标（核心向量运算）
  const offset = Cesium.Cartesian3.multiplyByScalar(
    normalizedDir,
    distance,
    new Cesium.Cartesian3(),
  );
  return Cesium.Cartesian3.add(origin, offset, new Cesium.Cartesian3());
}

/**
 * 从相机FOV和地图FOV计算定位器的缩放比例（移动距离）
 * @param {Object} options - 输入参数配置
 * @param {number} options.magnitude - 定位器的原始缩放比例（米）
 * @param {number} options.camFov - 相机FOV（弧度）
 * @param {number} options.mapFov - 地图FOV（弧度）
 * @returns {number} 计算后的定位器缩放比例（米，负数表示向后移动，正数向前，0无移动）
 */
export function calculateMapCameraViewOffsetByFOV(options: {
  magnitude: number;
  camFov: number;
  mapFov: number;
}): number {
  // Dnew = Dold * (tan(fov/2) / tan(固定fov/2))
  const { magnitude, camFov, mapFov } = options;
  // 相机FOV大于地图FOV, 此时地图视角在相机fov 后方，移动距离其实要往后移动
  // 给出的模长应该为负数往后移动
  if (camFov > mapFov) {
    const alphaRadians = Cesium.Math.toRadians(camFov / 2);
    const betaRadians = Cesium.Math.toRadians(mapFov / 2);
    // 计算正切值
    const tanAlpha = Math.tan(alphaRadians);
    const tanBeta = Math.tan(betaRadians);
    // 应用公式计算边12长度
    const d = (tanAlpha / tanBeta - 1) * magnitude;
    return -d;
  }
  if (camFov < mapFov) {
    // 此时相机fov小于fov, 此时地图视角在相机fov 前方，移动距离其实要往前移动
    const alphaRadians = Cesium.Math.toRadians(camFov / 2);
    const betaRadians = Cesium.Math.toRadians(mapFov / 2);
    // 计算正切值
    const tanAlpha = Math.tan(alphaRadians);
    const tanBeta = Math.tan(betaRadians);
    // 应用公式计算边12长度
    const d = magnitude * (1 - tanAlpha / tanBeta);
    return d;
  }
  // 视角一致则不需要移动
  return 0;
}

/**
 * 获取射线与椭球的交点
 */
export function getRayIntersection(
  ray: Cesium.Ray,
): Cesium.Cartesian3 | undefined {
  const intersectionResult = Cesium.IntersectionTests.rayEllipsoid(
    ray,
    Cesium.Ellipsoid.WGS84,
  );
  if (intersectionResult === undefined) {
    return undefined;
  }
  return Cesium.Ray.getPoint(ray, intersectionResult.start);
}

/**
 * 获取相机底部视锥体与椭球的交点
 */
export function getBottomFrustumIntersectionPoint(
  cameraLocalMatrix: Cesium.Matrix4,
  verticalFov: number,
) {
  const rotationMatrix = Cesium.Matrix3.fromHeadingPitchRoll(
    new Cesium.HeadingPitchRoll(0, -verticalFov / 2, 0),
    new Cesium.Matrix3(),
  );
  const matrix = Cesium.Matrix4.multiplyByMatrix3(
    cameraLocalMatrix,
    rotationMatrix,
    new Cesium.Matrix4(),
  );
  const bottomDirection = Cesium.Matrix4.multiplyByPointAsVector(
    matrix,
    new Cesium.Cartesian3(1, 0, 0),
    new Cesium.Cartesian3(),
  );
  const position = Cesium.Matrix4.getTranslation(
    cameraLocalMatrix,
    new Cesium.Cartesian3(),
  );
  const bottomRay = new Cesium.Ray(position, bottomDirection);
  return getRayIntersection(bottomRay);
}

/**
 * 计算相机FOV和地图FOV之间的距离差
 * @param {number} fov1 - 相机FOV（弧度）
 * @param {number} fov2 - 地图FOV（弧度）
 * @param len
 * @returns {number} 距离差（米，负数表示相机FOV大于地图FOV，相机视角在地图后方）
 */
export function getAmountDistance(fov1: number, fov2: number, len: number) {
  const fovInRadians1 = fov1 / 2;
  const fovInRadians2 = fov2 / 2;

  // 相机fov大于地图fov那么则代表相机fov在前
  if (fov1 > fov2) {
    // 计算角α、β对应的弧度值
    const alphaRad = fovInRadians1;
    const betaRad = fovInRadians2;

    // 步骤1：计算小三角形的垂直边h = L * sin(α)
    const h = len * Math.sin(alphaRad);
    // 步骤2：计算小三角形的水平边w = L * cos(α)
    const w = len * Math.cos(alphaRad);
    // 步骤3：计算大三角形的水平边（b + w）= h / tan(β)
    const bigTriangleHorizontal = h / Math.tan(betaRad);
    // 步骤4：求解b = 大三角形水平边 - 小三角形水平边w
    const b = bigTriangleHorizontal - w;
    return -b;
  }
  // 相机fov小于地图fov那么则代表相机fov在后
  if (fov1 < fov2) {
    // 垂直边h（两层三角形共用）= 外层斜边L * sin(角1)
    const h = len * Math.sin(fovInRadians1);
    // 外层水平边 = 外层斜边L * cos(角1)
    const outerHorizontal = len * Math.cos(fovInRadians1);
    // 内部水平边 = 垂直边h / tan(角2)
    const innerHorizontal = h / Math.tan(fovInRadians2);
    // a = 外层水平边 - 内部水平边
    return outerHorizontal - innerHorizontal;
  }
  return 0;
}

/**
 * 获取相机姿态在世界坐标系下的姿态矩阵
 * @param options
 */
export function getFakeCameraLocalMatrix(options: {
  position: Cesium.Cartesian3;
  heading: number;
  pitch: number;
  roll: number;
}) {
  const { position, heading = 0, pitch = 0, roll = 0 } = options;
  // 计算基于位置的东-北-上(ENU)坐标系变换矩阵
  const transform = Cesium.Transforms.eastNorthUpToFixedFrame(position);
  // 创建HeadingPitchRoll对象并调整航向角（Cesium内部处理方式）
  const hpr = {
    heading: heading - Cesium.Math.PI_OVER_TWO, // 关键调整，与Camera内部一致
    pitch,
    roll,
  };

  // 从姿态角创建四元数
  const rotQuat = Cesium.Quaternion.fromHeadingPitchRoll(
    hpr as Cesium.HeadingPitchRoll,
    new Cesium.Quaternion(),
  );

  // 从四元数创建旋转矩阵
  const rotMat = Cesium.Matrix3.fromQuaternion(rotQuat, new Cesium.Matrix3());

  // 从旋转矩阵和变换矩阵创建相机位置矩阵
  return Cesium.Matrix4.multiplyByMatrix3(
    transform,
    rotMat,
    new Cesium.Matrix4(),
  );
}
