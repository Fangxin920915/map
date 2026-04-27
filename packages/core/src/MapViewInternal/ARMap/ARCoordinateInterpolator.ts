import * as Cesium from "cesium";
import { DataFilterImp } from "@gdu-gl/common";

export default class ARCoordinateInterpolator
  implements DataFilterImp<[number, number, number, number]>
{
  // 匀速运动时间间隔
  private _dt: number;

  // 静止判定距离阈值（米）
  private _staticDistanceThreshold: number;

  // 上一次输入的Web墨卡托坐标（Cartesian2：x=东向，y=北向）
  private _lastInputPosition: Cesium.Cartesian2;

  // 上一次输入的方向向量（Cartesian2：x=东向，y=北向）
  private _lastInputDirection: Cesium.Cartesian2;

  // 上次插值的有效位置
  private _lastInterpolatedPosition: Cesium.Cartesian2;

  // 初始化标记
  private _initialized: boolean;

  // Web墨卡托投影实例（用于经纬度↔Web墨卡托转换）
  private _webMercatorProjection: Cesium.WebMercatorProjection;

  constructor(
    options: {
      dt?: number;
      staticDistanceThreshold?: number;
    } = {},
  ) {
    this._dt = options.dt ?? 1 / 26;
    this._staticDistanceThreshold = options.staticDistanceThreshold ?? 0.02;
    this._lastInputPosition = new Cesium.Cartesian2();
    this._lastInterpolatedPosition = new Cesium.Cartesian2();
    this._lastInputDirection = new Cesium.Cartesian2();
    this._initialized = false;
    this._webMercatorProjection = new Cesium.WebMercatorProjection();
  }

  /**
   * WGS84经纬度（度数）转Web墨卡托平面坐标（Cartesian2，单位米）
   * @param lon 经度（度数）
   * @param lat 纬度（度数）
   * @returns Web墨卡托平面坐标
   */
  private _latLonToWebMercator(lon: number, lat: number): Cesium.Cartesian2 {
    const cartographic = Cesium.Cartographic.fromDegrees(lon, lat);
    const webMercatorCartesian3 =
      this._webMercatorProjection.project(cartographic);
    return new Cesium.Cartesian2(
      webMercatorCartesian3.x,
      webMercatorCartesian3.y,
    );
  }

  /**
   * Web墨卡托平面坐标转WGS84经纬度（度数）
   * @param webMercator Web墨卡托平面坐标
   * @returns 经纬度（度数）
   */
  private _webMercatorToLatLon(webMercator: Cesium.Cartesian2): {
    lat: number;
    lon: number;
  } {
    const cartesian3 = new Cesium.Cartesian3(webMercator.x, webMercator.y, 0);
    const cartographic = this._webMercatorProjection.unproject(cartesian3);

    if (!cartographic) {
      throw new Error(
        `Web墨卡托坐标反投影失败：x=${webMercator.x}, y=${webMercator.y}`,
      );
    }

    return {
      lat: Cesium.Math.toDegrees(cartographic.latitude),
      lon: Cesium.Math.toDegrees(cartographic.longitude),
    };
  }

  /**
   * 计算两个Web墨卡托坐标之间的直线距离（米）
   * @param a 坐标A
   * @param b 坐标B
   */
  private _calcMercatorDistance(
    a: Cesium.Cartesian2,
    b: Cesium.Cartesian2,
  ): number {
    return Cesium.Cartesian2.distance(a, b);
  }

  /**
   * 【新增】基于速度分量计算方向向量（保留正负方向）
   * @param xSpeed 东向速度（米/秒，正为东，负为西）
   * @param ySpeed 北向速度（米/秒，正为北，负为南）
   * @returns 单位方向向量（含正负）
   */
  private _getTotalSpeed(xSpeed: number, ySpeed: number): number {
    return Math.sqrt(xSpeed ** 2 + ySpeed ** 2);
  }

  /**
   * 【新增】基于速度分量计算方向向量（保留正负方向）
   * @param xSpeed 东向速度（米/秒，正为东，负为西）
   * @param ySpeed 北向速度（米/秒，正为北，负为南）
   * @returns 单位方向向量（含正负）
   */
  private _getSpeedDirection(
    currentPosition: Cesium.Cartesian2,
  ): Cesium.Cartesian2 {
    const direction = Cesium.Cartesian2.subtract(
      currentPosition,
      this._lastInputPosition,
      new Cesium.Cartesian2(),
    );
    if (!Cesium.Cartesian2.equals(direction, new Cesium.Cartesian2())) {
      return Cesium.Cartesian2.normalize(direction, new Cesium.Cartesian2());
    }
    return this._lastInputDirection;
  }

  /**
   * 通过东北向速度进行匀速运动插值（使用速度方向）
   * @return Cesium.Cartesian2 插值后的Web墨卡托坐标
   */
  private _calcInterpolatedData(totalSpeed: number): Cesium.Cartesian2 {
    // 计算位移（方向×速度大小×时间）
    const interpolated = Cesium.Cartesian2.multiplyByScalar(
      this._lastInputDirection,
      this._dt * totalSpeed,
      new Cesium.Cartesian2(),
    );

    // 累加到位移到上次位置
    return Cesium.Cartesian2.add(
      this._lastInterpolatedPosition,
      interpolated,
      interpolated,
    );
  }

  /**
   * 核心滤波/插值接口
   * @param data 输入数据：[当前纬度（度数）, 当前经度（度数）, 东向速度（米/秒）, 北向速度（米/秒）]
   * @returns 插值后的经纬度及原始速度
   */
  public filter(
    data: [number, number, number, number],
  ): [number, number, number, number] {
    const [currentLon, currentLat, xSpeed, ySpeed] = data;

    // 经纬度合法性校验
    if (!Number.isFinite(currentLat) || !Number.isFinite(currentLon)) {
      throw new Error(`非法经纬度：lat=${currentLat}, lon=${currentLon}`);
    }

    const currentCartesian2 = this._latLonToWebMercator(currentLon, currentLat);
    // console.log("currentCartesian2", currentLat, currentLon);
    // console.log(this._webMercatorToLatLon(currentCartesian2));

    // 首次调用初始化
    if (!this._initialized) {
      this._lastInputPosition = Cesium.Cartesian2.clone(currentCartesian2);
      this._initialized = true;
      return [currentLon, currentLat, xSpeed, ySpeed];
    }
    const distance = this._calcMercatorDistance(
      currentCartesian2,
      this._lastInputPosition,
    );

    const lastPosition = this._webMercatorToLatLon(this._lastInputPosition);
    // 如果移动距离小于当前静态阈值，则就认为是静止不动，不进行插帧
    if (
      distance < this._staticDistanceThreshold &&
      this._getTotalSpeed(xSpeed, ySpeed) < 0.2
    ) {
      // console.log("静止不动");
      return [lastPosition.lon, lastPosition.lat, xSpeed, ySpeed];
    }
    // 初始化时还没传入新坐标在重复坐标时
    if (distance === 0) {
      if (!Cesium.defined(this._lastInputDirection)) {
        return [lastPosition.lon, lastPosition.lat, xSpeed, ySpeed];
      }
      const totalSpeed = this._getTotalSpeed(xSpeed, ySpeed);
      // 在有上次方向的前提下距离为0则代表当前是重复帧，需要插帧数据
      const interpolatedCartesian2 = this._calcInterpolatedData(totalSpeed);
      const interpolatedLatLon = this._webMercatorToLatLon(
        interpolatedCartesian2,
      );
      // 插值完成后更新最后插值位置
      this._lastInterpolatedPosition = Cesium.Cartesian2.clone(
        interpolatedCartesian2,
      );
      return [interpolatedLatLon.lon, interpolatedLatLon.lat, xSpeed, ySpeed];
    }

    // 不为0则代表当前是更新帧，不需要插帧数据
    // 那么此时就需要更新lastInputPosition为当前坐标
    // 更新lastInputDirection为当前方向

    this._lastInputDirection = this._getSpeedDirection(currentCartesian2);
    this._lastInputPosition = Cesium.Cartesian2.clone(currentCartesian2);
    this._lastInterpolatedPosition = Cesium.Cartesian2.clone(currentCartesian2);
    return [currentLon, currentLat, xSpeed, ySpeed];
  }

  /**
   * 重置插值器状态（用于业务场景切换）
   */
  public reset(): void {
    this._initialized = false;
    this._lastInputPosition = new Cesium.Cartesian2();
  }
}
