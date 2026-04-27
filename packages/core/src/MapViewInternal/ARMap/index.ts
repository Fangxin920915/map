import {
  IViewerDelegateImp,
  SeiData,
  ARMapDelegateImp,
  ARMapCameraControlDelegateImp,
  EngineType,
  ARSceneDelegateImp,
} from "@gdu-gl/common";

import TrendKalmanFilter from "./TrendKalmanFilter";
import ARCameraControlDelegate from "./ARCameraControlDelegate";
import { isStrictNumber } from "../../Utils";
import ARSceneDelegate from "./ARSceneDelegate";
import ARCoordinateInterpolator from "./ARCoordinateInterpolator";
import ARFrameJumpDetector from "./ARFrameJumpDetector";
import ARFrameDataProcessor from "./ARFrameDataProcessor";

function bigIntToNumberViaStr(value: any) {
  if (typeof value !== "bigint") return value;

  // 安全范围校验（避免精度丢失）
  const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
  const MIN_SAFE = BigInt(Number.MIN_SAFE_INTEGER);
  if (value > MAX_SAFE || value < MIN_SAFE) {
    throw new Error(`BigInt ${value} 超出 Number 安全范围，禁止转数字`);
  }

  // 核心：先转字符串，再转数字
  return Number(value.toString());
}

/**
 * AR地图类
 * 负责AR地图的初始化和数据处理。
 * 该类负责根据AR相机的参数，更新相机的视场角和视图。
 * @param {IViewerDelegateImp} viewer 查看器代理类
 * @returns 相机控制代理类实例
 */
export default class ARMapDelegate implements ARMapDelegateImp {
  coordinateKalmanFilter: ARCoordinateInterpolator | undefined;

  uavYawKalmanFilter: TrendKalmanFilter | undefined;

  cameraControlDelegate: ARMapCameraControlDelegateImp;

  viewer: IViewerDelegateImp;

  arSceneDelegate: ARSceneDelegateImp;

  offsetHeight: number;

  private firstSeiDataReceived: boolean;

  private detector: ARFrameJumpDetector;

  private frameDataProcessor: ARFrameDataProcessor;

  private engineType: EngineType;

  private _frameCount: number;

  constructor(options: {
    engineType: EngineType;
    viewer: IViewerDelegateImp;
    pixelSize?: number;
    aspectRatio?: number;
    effectivePixels?: number;
    actualFocalLength?: number;
    offsetHeight?: number;
    mvtUrl?: string;
    demUrl?: string;
    styleUrl?: string;
  }) {
    const { engineType, viewer, mvtUrl, demUrl, styleUrl } = options;
    this.coordinateKalmanFilter = new ARCoordinateInterpolator();
    this.uavYawKalmanFilter = new TrendKalmanFilter({
      trendWindow: 5,
      devThresh: 1,
      stableFrames: 5,
      qAngle: 1e-6,
      qOmega: 1e-6,
      rAngle: 0.5,
    });
    this.cameraControlDelegate = new ARCameraControlDelegate(options);
    this.offsetHeight = options.offsetHeight ?? 0;
    this.engineType = options.engineType;
    this.arSceneDelegate = new ARSceneDelegate({
      engineType,
      viewer,
      mvtUrl,
      demUrl,
      styleUrl,
    });
    this.viewer = viewer;
    this.firstSeiDataReceived = false;
    this.detector = new ARFrameJumpDetector(85, 2, 3);
    this.frameDataProcessor = new ARFrameDataProcessor(10000, 11, false);
    this._frameCount = 0;
  }

  init(): void {
    this.cameraControlDelegate.init();
    this.arSceneDelegate.init();
  }

  /**
   * 接收SEI数据
   * @param {SeiData} data SEI数据
   */
  onSeiDataReceived(data: SeiData) {
    if (
      !isStrictNumber(data.positionAttitudeInfo.longitude) ||
      !isStrictNumber(data.positionAttitudeInfo.latitude) ||
      (data.cameraParams &&
        data.cameraParams.zoom &&
        !isStrictNumber(data.cameraParams.zoom))
    ) {
      return;
    }

    data.videoTs = bigIntToNumberViaStr(data.videoTs);
    const processData = this.frameDataProcessor.processFrame(data);

    const { positionAttitudeInfo, cameraParams, speedInfo } = processData;
    const {
      longitude,
      latitude,
      ellipsoidHeight,
      // relativeAltitude,
      // seaAltitude,
      uavYaw,
      gimbalPitch,
      gimbalRoll,
    } = positionAttitudeInfo;

    // 检测跳变
    this.detector.detect(gimbalPitch);

    if (!this.coordinateKalmanFilter || !this.uavYawKalmanFilter) {
      return;
    }

    // 对位置进行卡尔曼滤波
    const interpolatorPosition = this.coordinateKalmanFilter.filter([
      longitude,
      latitude,
      speedInfo.xSpeed,
      speedInfo.ySpeed,
    ]);
    const filteredPosition = [interpolatorPosition[0], interpolatorPosition[1]];

    // // 对无人机_yaw进行卡尔曼滤波
    const filteredYaw = this.uavYawKalmanFilter.filter(uavYaw);
    // const filteredYaw = uavYaw;
    // console.log("滤波误差", filteredYaw - filteredYaw2);
    if (!this.viewer.mapProviderDelegate.map) {
      return;
    }
    // 更新相机视场角;
    this.cameraControlDelegate.updateFov({
      zoomFactor: cameraParams.zoom ?? 10,
      focalLength: cameraParams.focalLength,
      engineType: this.engineType,
    });

    const minHeight = Math.max(
      ellipsoidHeight + this.offsetHeight - this.arSceneDelegate.demHeight,
      15,
    );

    // 更新相机视图
    this.cameraControlDelegate.updateView({
      position: [
        ...filteredPosition,
        // relativeAltitude + 30 + this.offsetHeight,
        // ellipsoidHeight + this.offsetHeight - this.arSceneDelegate.demHeight,
        minHeight,
      ] as any,
      yaw: filteredYaw,
      roll: gimbalRoll,
      // pitch: Math.min(gimbalPitch, -1), // 保持至少有一度的斜视
      pitch: gimbalPitch,
      zoom: cameraParams.zoom ?? 10,
    });

    if (!this.firstSeiDataReceived) {
      this.firstSeiDataReceived = true;
      this.arSceneDelegate.setPoiData(longitude, latitude);
    }
    this._frameCount++;
    if (this._frameCount % 100 === 0) {
      this.arSceneDelegate.setTerrainHeight(longitude, latitude);
    }
  }

  destroy(): void {
    this.coordinateKalmanFilter = undefined;
    this.uavYawKalmanFilter = undefined;
    this.cameraControlDelegate.destroy();
    this.arSceneDelegate.destroy();
  }
}
