import { CoordinatePair } from "./IGeojson";
import { IBase, IBaseDelegateImp } from "./IBase";
import { EngineType } from "../Types";

export interface TimeData {
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

export interface CameraParams {
  podType: number;
  /**
   * SEI 2.1 新增字段
   *
   * 感光芯片宽
   */
  width?: number;
  /**
   * SEI 2.1 新增字段
   *
   * 感光芯片高
   */
  height?: number;
  focalLength: number;
  focalLength35mm: number;
  /**
   * SEI 2.1 新增字段
   *
   * 变焦倍率
   */
  zoom?: number;
  /**
   * SEI 2.1 新增字段
   *
   * 画面模式
   * 第一个字节为光类型和镜头类型，单位：整数：
   * 可见光_广角：0，可见光_变焦：1，单红外：2，红外_广角：3，红外_变焦：4
   * 第二个字节为伪彩颜色和增益模式，单位：整数：
   * 白热_高增益：0，白热_低增益：1，熔岩_高增益：2，熔岩_低增益：3，铁红_高增益：4，铁红_低增益：5，热铁_高增益：6
   * 热铁_低增益：7，医疗_高增益：8，医疗_低增益：9，北极_高增益：10，北极_低增益：11，彩虹1_高增益：12，彩虹1_低增
   * 益：13，彩虹2_高增益：14，彩虹2_低增益：15，描红_高增益：16，描红_低增益：17，黑热_高增益：18，黑热_低增益：19
   */
  mode?: number;
}

export interface PositionAttitudeInfo {
  /**
   * 无人机经度
   */
  longitude: number;
  /**
   * 无人机纬度
   */
  latitude: number;
  /**
   * 无人机椭球高
   */
  ellipsoidHeight: number;
  /**
   * 无人机海拔高
   */
  seaAltitude: number;
  /**
   * 无人机相对高
   */
  relativeAltitude: number;
  /**
   * 无人偏航角
   */
  uavYaw: number;
  /**
   * 无人机横滚角
   */
  uavRoll: number;
  /**
   * 无人机俯仰角
   */
  uavPitch: number;
  /**
   * 云台俯仰角
   */
  gimbalPitch: number;
  /**
   * 云台横滚角
   */
  gimbalRoll: number;
  /**
   * 云台偏航角
   */
  gimbalYaw: number;
}

interface SpeedInfo {
  xSpeed: number;
  ySpeed: number;
  groundSpeed: number;
}

interface TrackInfo {
  targetX: number;
  targetY: number;
  targetWidth: number;
  targetHigh: number;
  confidence: number;
  targetType: number;
  id: number;
}

export interface SeiData {
  time: TimeData;
  cameraParams: CameraParams;
  positionAttitudeInfo: PositionAttitudeInfo;
  speedInfo: SpeedInfo;
  trackingInfoList: TrackInfo[];
  /**
   * 用于标识SEI信息中是否带有跟踪检测信息和扩展协议内容
   * 0：无检测跟踪信息，无扩展信息
   * 1：有检测跟踪信息，无扩展信息
   * 2：无检测跟踪信息，有扩展信息
   * 3：有检测跟踪信息，有扩展信息
   */
  contentType: number;
  /**
   * SEI 2.1 新增字段
   *
   * 当前识别飞机系统时间(ms)（飞机系统授时时间)
   */
  systemTime?: number;
  /**
   * SEI 2.1 新增字段
   *
   * SEI版本号
   */
  seiVersion?: string;
  /**
   * SEI 2.1 删除该字段
   *
   * ai 协议版本
   */
  aiVersion?: number;
  /**
   * 预览时间戳（ms）
   */
  videoTs: number;
  /**
   * ai时间戳（ms）
   */
  aiTs: number;
  /**
   * 识别宽度
   */
  viewWidth: number;
  /**
   * 识别高度
   */
  viewHeight: number;
  /**
   * 一个目标占用字节数
   */
  targetBytes: number;
  /**
   * 识别总数
   */
  totalNum: number;
  /**
   * 实际传输总数
   */
  showNum: number;
}

/**
 * AR地图代理接口
 */
export interface ARMapDelegateImp {
  /**
   * 坐标过滤器
   */
  coordinateKalmanFilter:
    | DataFilterImp<[number, number, number, number]>
    | undefined;
  /**
   * UAV偏航角度过滤器
   */
  uavYawKalmanFilter: DataFilterImp<number> | undefined;
  /**
   * 相机代理
   */
  cameraControlDelegate: ARMapCameraControlDelegateImp;
  /**
   * 偏移高度
   */
  offsetHeight: number;
  /**
   * 处理SEI数据
   * @param seiData SEI数据
   */
  onSeiDataReceived(seiData: SeiData): void;
}

/**
 * 卡尔曼滤波器接口
 * @template T 数据类型
 */
export interface KalmanFilterImp<T> {
  /**
   * 预测步骤
   * @param data 当前数据
   */
  predict(data: T): void;
  /**
   * 更新步骤
   * @param data 当前数据
   * @returns 过滤后的数据
   */
  update(data: T): T;
}

/**
 * 数据过滤器接口
 * @template T 数据类型
 */
export interface DataFilterImp<T> {
  kalman?: KalmanFilterImp<T>;
  /**
   * 过滤数据
   * @param data 当前数据
   * @returns 过滤后的数据
   */
  filter(data: T): T;
}

/**
 * AR地图相机控制接口
 */
export interface ARMapCameraControlImp {
  /**
   * 更新相机视图
   * @param data 相机视图数据
   */
  updateView(data: {
    position: CoordinatePair;
    yaw: number;
    roll: number;
    pitch: number;
  }): void;
  /**
   * 更新相机视视锥体
   * @param fov 相机视场角
   */
  updateFrustum(fov: number): void;
}

/**
 * AR地图相机控制代理接口
 */
export interface ARMapCameraControlDelegateImp
  extends IBaseDelegateImp<ARMapCameraControlImp>,
    IBase {
  /**
   * 相机纵横比
   */
  aspectRatio?: number;
  /**
   * 有效像素数
   */
  effectivePixels?: number;
  /**
   * 实际焦距
   */
  actualFocalLength?: number;
  /**
   * 相机控制实例
   */
  cameraControl: ARMapCameraControlImp;
  /**
   * 更新相机视视锥体
   * @param fov 相机视场角
   */
  updateFrustum(fov: number): void;
  /**
   * 更新相机视图
   * @param data 相机视图数据
   */
  updateView(data: {
    position: CoordinatePair;
    yaw: number;
    roll: number;
    pitch: number;
    zoom: number;
  }): void;
  /**
   * 更新相机FOV
   * @param params 相机焦距参数
   */
  updateFov(params: {
    zoomFactor: number;
    focalLength: number;
    engineType: EngineType;
  }): void;
}

/**
 * AR场景代理接口
 */
export interface ARSceneDelegateImp extends IBaseDelegateImp<IBase>, IBase {
  setSceneOpacity(opacity: number, roadOpacity: number): void;
  /**
   * 设置POI数据
   * @param lon 经度
   * @param lat 纬度
   */
  setPoiData(lon: number, lat: number): void;
  setTerrainHeight(lon: number, lat: number): void;
  demHeight: number;
}

export interface ARSceneImp extends IBase {
  demHeight: number;
  setSceneOpacity(opacity: number, roadOpacity: number): void;
  setPoiData(lon: number, lat: number): void;
  setTerrainHeight(lon: number, lat: number): void;
}

/**
 * 相机参数接口（支持广角/红外/长焦，红外与广角结构一致）
 * 单位规范：像素尺寸=μm，焦距=mm，有效像素=像素数（正整数）
 */
export interface CameraConfigParams {
  /**
   * 像素大小
   */
  pixelSize: number;
  /**
   * 有效像素宽度
   */
  effectivePixelWidth: number;
  /**
   * 有效像素高度
   */
  effectivePixelHeight: number;
  /**
   *  宽高比
   */
  aspectRatio?: { width: number; height: number };
  /**
   * 物理焦距（广角/红外固定，长焦为最小焦距）
   */
  focalLength: number;
  /**
   * 长焦最大光学焦距（仅长焦）
   */
  maxFocalLength?: number;
}

/**
 * 实际变焦参数接口（含镜头类型，区分不同镜头）
 */
export interface ActualZoomParams {
  /**
   * 变倍倍率
   */
  zoomRatio: number;
  /**
   * 当前实际焦距
   */
  actualFocalLength: number;
  /**
   * 镜头类型
   */
  lensType: LensType;
}

/**
 * 归一化后的相机参数类型（内部使用，广角/红外通用）
 */
export interface NormalizedCamParams {
  /**
   * 传感器水平物理宽度（mm）
   */
  sensorHorizontalWidth: number;
  /**
   * 传感器垂直物理高度（mm）
   */
  sensorVerticalHeight: number;
  /**
   * 宽高比
   */
  aspectRatio: { width: number; height: number };
  /**
   * 固定焦距（广角/红外）或最小焦距（长焦）
   */
  focalLength: number;
  /**
   * 仅长焦有值，最大焦距
   */
  maxFocalLength?: number;
  /**
   * 镜头有效变焦区间
   */
  zoomRange: { min: number; max: number };
}

/**
 * 归一化后的长焦相机参数类型（maxFocalLength 必选）
 */
export interface NormalizedTeleCamParams extends NormalizedCamParams {
  /**
   * 最大焦距
   */
  maxFocalLength: number;
}

/**
 * 镜头类型枚举（对外暴露，明确支持的镜头）
 */
export type LensType = "wide" | "infrared" | "tele";

/**
 * 数字+镜头类型的输入类型（用于放大倍数计算）
 */
export type ZoomNumberInput = number & { lensType?: LensType };
