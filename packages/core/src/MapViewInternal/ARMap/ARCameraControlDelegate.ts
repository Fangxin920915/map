import {
  ARMapCameraControlDelegateImp,
  ARMapCameraControlImp,
  CoordinatePair,
  EngineType,
  IViewerDelegateImp,
  LensType,
} from "@gdu-gl/common";
import { ARCameraControl as CesiumARCameraControl } from "@gdu-gl/cesium";
import { cloneDeep } from "lodash-es";
import ARCameraLocator from "./ARCameraLocator";

/**
 * AR相机控制代理类
 * 负责AR相机的控制，包括更新视场角、更新视图等。
 * 该类负责根据AR相机的参数，更新相机的视场角和视图。
 * @param {EngineType} [options.engineType] 引擎类型
 * @param {IViewerDelegateImp} [options.viewer] 查看器代理类
 * @param {number} [options.pixelSize] 像素大小
 * @param {number} [options.aspectRatio] 宽高比
 * @param {number} [options.effectivePixels] 有效像素数
 * @returns 相机控制代理类实例
 */
export default class ARCameraControlDelegate
  implements ARMapCameraControlDelegateImp
{
  fov: number;

  cameraControl: ARMapCameraControlImp;

  private arCameraLocator: ARCameraLocator;

  constructor(options?: {
    engineType?: EngineType;
    viewer: IViewerDelegateImp;
  }) {
    this.fov = 0;
    this.arCameraLocator = new ARCameraLocator();
    this.cameraControl = this.getClassByEngineType(
      options?.engineType || EngineType.CESIUM,
      {
        viewer: options?.viewer,
      },
    );
  }

  updateFrustum(fov: number): void {
    this.cameraControl.updateFrustum(fov);
  }

  getClassByEngineType(
    _engineType: EngineType,
    options?: any,
  ): ARMapCameraControlImp {
    return new CesiumARCameraControl(options);
  }

  destroy(): void {}

  init() {}

  updateFov(params: {
    zoomFactor: number;
    focalLength: number;
    engineType: EngineType;
  }) {
    let lensType: LensType = "wide";
    const zoom = params.zoomFactor / 10;
    if (zoom <= 4) {
      lensType = "wide";
    } else if (zoom <= 10) {
      lensType = "tele";
    } else {
      lensType = "infrared";
    }
    this.fov = this.arCameraLocator.calculateFov(
      zoom,
      params.focalLength,
      lensType,
      params.engineType,
    );
    this.updateFrustum(this.fov);
  }

  updateView(data: {
    position: CoordinatePair;
    yaw: number;
    roll: number;
    pitch: number;
    zoom: number;
  }) {
    const params = cloneDeep(data);
    this.cameraControl.updateView(params);
  }
}
