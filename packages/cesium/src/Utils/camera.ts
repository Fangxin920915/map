import * as Cesium from "cesium";
import { CameraAttitude, PointCoordinates } from "@gdu-gl/common";
import { isNil } from "lodash-es";

export function getCameraFocus(
  scene: Cesium.Scene,
  targetPosition?: Cesium.Cartesian3,
) {
  // 创建相机视线射线（起点为相机世界坐标，方向为相机朝向）
  const ray = new Cesium.Ray(
    targetPosition ?? scene.camera.positionWC,
    scene.camera.directionWC,
  );

  // 检测射线与地球椭球体的交点
  const intersections = Cesium.IntersectionTests.rayEllipsoid(
    ray,
    scene.globe.ellipsoid,
  );

  // 如果存在交点，返回射线起点到交点位置的坐标
  if (Cesium.defined(intersections)) {
    return Cesium.Ray.getPoint(ray, intersections.start);
  }

  // 当相机未指向地球时，使用椭球体地平点作为焦点
  return Cesium.IntersectionTests.grazingAltitudeLocation(
    ray,
    scene.globe.ellipsoid,
  );
}

/**
 * 检测当前视距下最合适的瓦片缩放层级
 * @param scene Cesium场景对象
 * @param distance 相机到焦点的距离（米）
 * @returns number | null 满足误差要求的最大层级，找不到时返回null
 * @description
 * 通过遍历0-19级瓦片，计算每个层级的几何误差与屏幕空间误差的比率，
 * 返回第一个满足当前渲染误差要求的层级
 */
export function detectZoomLevel(scene: Cesium.Scene, distance: number) {
  // 访问私有 surface 属性获取瓦片提供器
  // @ts-ignore
  const { tileProvider } = scene.globe._surface;
  const quadtree = tileProvider._quadtree;
  const drawingBufferHeight = scene.canvas.clientHeight;
  // 访问相机视锥体参数
  // 屏幕空间误差计算分母
  // @ts-ignore
  const { sseDenominator } = scene.camera.frustum;
  // 遍历预定义的瓦片层级 (0-19)
  for (let level = 0; level <= 22; level++) {
    // 获取当前层级的最大几何误差（地表高度偏差）
    const maxGeometricError = tileProvider.getLevelMaximumGeometricError(level);
    // 计算当前层级在屏幕空间中的误差比例
    const error =
      (maxGeometricError * drawingBufferHeight) / (distance * sseDenominator);
    if (error < quadtree.maximumScreenSpaceError) {
      return level;
    }
  }

  return null;
}

/**
 * 计算不同相机高度对应的最佳缩放层级
 * @param scene Cesium场景对象
 * @param precision 高度检测精度（单位：米），默认10米
 * @returns Map<number,number> 层级与高度对应关系数组
 * @description
 * 通过从高空向低空迭代检测，使用二分法精确查找层级切换点：
 * 1. 初始以10万米为步长快速下降
 * 2. 当检测到层级变化时，在[minHeight, maxHeight]区间进行二分查找
 * 3. 找到精确的层级切换高度后，动态调整下降步长
 */
export function getZoomLevelHeights(scene: Cesium.Scene, precision: number) {
  precision = precision || 10; // 设置默认检测精度
  let step = 100000.0; // 初始下降步长（10万米）
  const result = []; // 存储层级-高度关系的结果集
  let currentZoomLevel = 0; // 当前记录的缩放层级

  // 从1亿米高空开始逐步下降检测（相当于太空视角）
  for (let height = 100000000.0; height > step; height -= step) {
    const level = detectZoomLevel(scene, height);
    if (level === null) break; // 无法检测层级时终止循环

    // 当检测到新层级时进行精确高度定位
    if (level !== currentZoomLevel) {
      let minHeight = height;
      let maxHeight = height + step;

      // 二分法查找精确的层级切换高度
      while (maxHeight - minHeight > precision) {
        height = minHeight + (maxHeight - minHeight) / 2;
        detectZoomLevel(scene, height) === level
          ? (minHeight = height) // 当前高度仍保持该层级
          : (maxHeight = height); // 当前高度已切换到新层级
      }

      // 记录找到的层级高度对应关系
      result.push({
        level,
        // 根据前两次结果动态调整步长（加快后续检测速度）
        height: Math.round(height), // 四舍五入到整米
      });

      currentZoomLevel = level;

      if (result.length >= 2) {
        step = (result[result.length - 2].height - height) / 1000.0;
      }
    }
  }
  return new Map(result.map((entry) => [entry.level, entry.height]));
}

/**
 * 根据层级值计算对应高度（支持小数层级的线性插值）
 * @param levelMap 层级高度映射表（键为层级编号，值为对应高度）
 * @param level 目标层级数值（支持小数，自动钳制在1-22之间）
 * @returns number 计算得到的高度值（当层级为小数时返回插值结果）
 * @example
 * // 当levelMap为 Map([[1, 100], [2, 50], [3, 10]])
 * calculateHeightByLevel(levelMap, 2)    // 返回 50
 * calculateHeightByLevel(levelMap, 2.5) // 返回 30 (50到10之间的中间值)
 */
export function calculateHeightByLevel(
  levelMap: Map<number, number>,
  level: number,
) {
  // 边界控制：强制限制层级在1-22之间
  const clampedLevel = Math.min(Math.max(level, 1), 22);

  // 分离整数和小数部分
  const lowerLevel = Math.floor(clampedLevel);
  const upperLevel = Math.ceil(clampedLevel);

  // 如果是整数层级，直接返回
  if (lowerLevel === upperLevel) {
    return levelMap.get(lowerLevel);
  }

  // 获取相邻层级高度
  const lowerHeight = levelMap.get(lowerLevel) as number;
  const upperHeight = levelMap.get(upperLevel) as number;

  // 线性插值计算
  const fraction = clampedLevel - lowerLevel;
  return lowerHeight + (upperHeight - lowerHeight) * fraction;
}

/**
 * 根据高度值在层级映射表中查找对应的层级（支持插值计算）
 * @param levelMap 层级高度映射表（需按层级从高到低排序，键为层级编号，值为对应高度）
 * @param height 当前高度值（单位：米）
 * @returns number 返回匹配的层级数值。当高度在两个层级之间时，返回带小数插值结果
 * @example
 * // 当levelMap为 Map([[1, 100], [2, 50], [3, 10]])
 * calculateLevelByHeight(levelMap, 75) // 返回 1.5
 * calculateLevelByHeight(levelMap, 30) // 返回 2.8
 */
export function calculateLevelByHeight(
  levelMap: Map<number, number>,
  height: number,
) {
  if (height > (levelMap.get(1) as number)) {
    return 1;
  }

  if (height <= (levelMap.get(levelMap.size) as number)) {
    return levelMap.size;
  }
  for (let i = 1; i <= levelMap.size; i += 1) {
    const currentHeight = levelMap.get(i) as number;
    const nextHeight = levelMap.get(i + 1) as number;
    if (height <= currentHeight && height > nextHeight) {
      const fraction = (currentHeight - height) / (currentHeight - nextHeight);
      return i + Math.round(fraction * 1000) / 1000;
    }
  }
}

/**
 * 校验传入的Heading、Pitch、Roll，如果不存在用相机现有姿态
 * @param viewer
 * @param params 包含可选欧拉角的参数对象 (单位：度数)
 * @returns 返回弧度制的相机姿态参数对象
 */
export function verifyHeadingPitchRoll(
  viewer: Cesium.Viewer,
  params: Partial<CameraAttitude>,
) {
  const { camera } = viewer;
  // 处理航向角：优先使用传入参数，否则使用相机当前值 (需要将度数转换为弧度)
  const heading = Cesium.defined(params.heading)
    ? Cesium.Math.toRadians(params.heading as number)
    : camera.heading;

  // 处理俯仰角：逻辑同上
  const pitch = Cesium.defined(params.pitch)
    ? Cesium.Math.toRadians(params.pitch as number)
    : camera.pitch;

  // 处理横滚角：逻辑同上
  const roll = Cesium.defined(params.roll)
    ? Cesium.Math.toRadians(params.roll as number)
    : camera.roll;

  return {
    heading,
    pitch,
    roll,
  };
}

/**
 * 校验时间参数是否符合格式，不符合格式默认使用默认时间
 * @param defaultDuration
 * @param duration 持续时间（毫秒）
 * @param errorValue 当参数无效时使用的备选值（毫秒）
 * @returns 转换后的时间值（秒）
 */
export function verifyDuration(
  defaultDuration: number,
  duration?: number,
  errorValue?: number,
) {
  // 优先处理有效数值：转换为秒单位（Cesium API要求秒为单位）
  if (!isNil(duration)) {
    return duration >= 0 ? duration / 1000 : 0;
  }
  // 当未提供有效参数时：使用备选值或默认值，并转换为秒
  return (errorValue ?? defaultDuration) / 1000;
}

/**
 * 切换到2D地球模式（垂直俯视视角）
 * @param viewer Cesium视图对象
 * @param options 包含切换参数的对象：
 *   - center: 可选的中心点坐标 [经度, 纬度, 高度]
 *   - defaultDuration: 默认动画时长（毫秒）
 *   - duration: 实际使用的动画时长（毫秒）
 * @returns Promise<boolean> 切换动画是否成功完成
 */
export function switch2dEarthMode(
  viewer: Cesium.Viewer,
  options: {
    center: PointCoordinates;
    defaultDuration: number;
    duration?: number;
  },
): Promise<boolean> {
  // 获取相机当前世界坐标系位置
  const { positionWC, heading, roll } = viewer.scene.camera;
  // 解构配置参数
  const { center, duration, defaultDuration } = options;

  return new Promise((resolve) => {
    // 解析中心点坐标并转换为笛卡尔坐标
    const [lon, lat] = center;
    const centerCartesian = Cesium.Cartesian3.fromDegrees(lon, lat);
    // 计算当前相机到目标中心的距离
    const range = Cesium.Cartesian3.distance(centerCartesian, positionWC);
    // 执行3D模式飞行动画
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, range),
      orientation: {
        heading,
        pitch: Cesium.Math.toRadians(-90),
        roll,
      },
      duration: verifyDuration(defaultDuration, duration), // 转换动画时长
      complete: () => resolve(true),
      cancel: () => resolve(false),
    });
  });
}

/**
 * 切换到3D地球模式（倾斜视角）
 * @param viewer Cesium视图对象
 * @param options 包含切换参数的对象：
 *   - center: 可选的中心点坐标 [经度, 纬度, 高度]
 *   - defaultDuration: 默认动画时长（毫秒）
 *   - duration: 实际使用的动画时长（毫秒）
 * @returns Promise<boolean> 切换动画是否成功完成
 */
export function switch3dEarthMode(
  viewer: Cesium.Viewer,
  options: {
    center: PointCoordinates;
    defaultDuration: number;
    duration?: number;
  },
): Promise<boolean> {
  const { positionWC, heading } = viewer.scene.camera;
  const { center, duration, defaultDuration } = options;

  return new Promise((resolve) => {
    // 解析并转换传入的中心点坐标
    const [lon, lat] = center;
    const centerCartesian = Cesium.Cartesian3.fromDegrees(lon, lat);
    // 计算相机到目标中心的距离
    const distance = Cesium.Cartesian3.distance(centerCartesian, positionWC);

    const angle = Cesium.Math.toRadians(45);
    const localToWorld =
      Cesium.Transforms.eastNorthUpToFixedFrame(centerCartesian);
    const rotationMatrix = Cesium.Matrix3.fromRotationZ(-heading);
    const offsetLocal = new Cesium.Cartesian3(
      0,
      -distance * Math.cos(angle),
      distance * Math.sin(angle),
    );
    // 将偏移量应用旋转
    const rotatedOffsetLocal = Cesium.Matrix3.multiplyByVector(
      rotationMatrix,
      offsetLocal,
      new Cesium.Cartesian3(),
    );
    const cameraPositionWorld = Cesium.Matrix4.multiplyByPoint(
      localToWorld,
      rotatedOffsetLocal,
      new Cesium.Cartesian3(),
    );

    // 4. 关键修正：计算相机指向目标点时，相机自身ENU下的绝对heading/pitch
    const cameraENUToWorld =
      Cesium.Transforms.eastNorthUpToFixedFrame(cameraPositionWorld);
    // 4.1 计算「相机→目标点」的世界向量
    const cameraToTargetWorld = Cesium.Cartesian3.subtract(
      centerCartesian,
      cameraPositionWorld,
      new Cesium.Cartesian3(),
    );
    // 4.2 将世界向量转换为「相机位置的ENU坐标系」下的向量
    const worldToCameraENU = Cesium.Matrix4.inverse(
      cameraENUToWorld,
      new Cesium.Matrix4(),
    );
    const cameraToTargetENU = Cesium.Matrix4.multiplyByPointAsVector(
      worldToCameraENU,
      cameraToTargetWorld,
      new Cesium.Cartesian3(),
    );
    // 4.3 从ENU向量解算相机的绝对heading（方位角）
    const cameraHeading = Math.atan2(cameraToTargetENU.x, cameraToTargetENU.y); // 东/北分量求方位角
    // 4.4 从ENU向量解算相机的绝对pitch（俯仰角）
    const horizontalDistance = Math.sqrt(
      cameraToTargetENU.x * cameraToTargetENU.x +
        cameraToTargetENU.y * cameraToTargetENU.y,
    );
    const cameraPitch = Math.atan2(cameraToTargetENU.z, horizontalDistance); // 负z是因为Cesium pitch定义

    // 5. 飞控：使用相机自身ENU下的绝对heading/pitch，消除误差
    viewer.camera.flyTo({
      destination: cameraPositionWorld, // 计算出的相机位置
      orientation: {
        heading: cameraHeading, // 替换为相机自身的绝对heading
        pitch: cameraPitch, // 替换为相机自身的绝对pitch
        roll: 0,
      },
      duration: verifyDuration(defaultDuration, duration),
      complete: () => resolve(true),
      cancel: () => resolve(false),
    });
  });
}

export function is2dMode(camera: Cesium.Camera) {
  const pitch = Math.abs(Cesium.Math.toDegrees(camera.pitch));
  return pitch > 80;
}

/**
 * 同过已知的heading、pitch、相机到地图中心距离、目标点，
 * 计算出flyToBoundingSphere中HeadingPitchRange的range值
 * @param viewer
 * @param targetPoint 目标点
 * @return range 相机飞行完后，到目标的距离
 */
export function keepCameraStabilizedFlying(
  viewer: Cesium.Viewer,
  targetPoint: Cesium.Cartesian3,
): number {
  const { camera } = viewer;
  const ellipsoid = Cesium.Ellipsoid.WGS84;

  const currentPitch = camera.pitch; // 俯仰角（弧度，向下为负）
  // 计算相机当前离椭球面的高度
  const cameraCartographic = ellipsoid.cartesianToCartographic(camera.position);
  const cameraHeight = cameraCartographic.height;

  // 2. 计算目标点的高度
  const targetCartographic = ellipsoid.cartesianToCartographic(targetPoint);
  const targetHeight = targetCartographic.height || 0; // 目标点高度，默认0

  // 3. 核心：计算range参数（相机到目标点的直线距离）
  const heightDiff = cameraHeight - targetHeight; // 高度差（恒正）
  const pitchAbs = Math.abs(currentPitch); // 俯角的绝对值
  // 避免pitch为0（水平看）导致除以0，加小容错
  const range = heightDiff / (Math.sin(pitchAbs) || 0.0001);
  return Math.abs(range);
}

/**
 * 同过已知的heading、pitch、相机到地图中心距离、目标点，
 * 计算出flyToBoundingSphere中HeadingPitchRange的range值，
 * 并保持相机与目标点的距离不变
 * @param viewer
 * @param targetPoint 目标点
 * @param distance 相机到目标点的距离
 * @return range 相机飞行完后，到目标的距离
 */
export function keepCameraStabilizedFlyingByDistance(
  viewer: Cesium.Viewer,
  targetPoint: Cesium.Cartesian3,
  distance: number,
): number {
  const targetCenter = getCameraFocus(viewer.scene, targetPoint);
  const targetDistance = Cesium.Cartesian3.distance(targetCenter, targetPoint);
  return Math.abs(distance - targetDistance);
}
