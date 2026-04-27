import {
  ARMapCameraControlImp,
  CoordinatePair,
  IViewerDelegateImp,
} from "@gdu-gl/common";
import * as Cesium from "cesium";

/**
 * AR相机控制类
 * 用于AR场景的相机控制
 * 包含AR场景的初始化、相机位置更新、相机视锥体更新等功能
 * 此处搭便车，添加cesium引擎armap需要的场景控制，如关闭天空盒、关闭地面大气、关闭太阳等
 */
export default class ARCameraControl implements ARMapCameraControlImp {
  private viewer: Cesium.Viewer;

  private camera: Cesium.Camera;

  constructor(options: { viewer: IViewerDelegateImp }) {
    this.viewer = options.viewer.mapProviderDelegate.map;
    this.camera = this.viewer.camera;
  }

  updateView(data: {
    position: CoordinatePair;
    yaw: number;
    roll: number;
    pitch: number;
  }) {
    const position = Cesium.Cartesian3.fromDegrees(
      data.position[0],
      data.position[1],
      data.position[2],
    );
    this.camera.setView({
      destination: position,
      orientation: {
        heading: Cesium.Math.toRadians(data.yaw),
        pitch: Cesium.Math.toRadians(data.pitch),
        roll: Cesium.Math.toRadians(data.roll),
      },
    });
  }

  updateFrustum(fov: number) {
    if (this.camera.frustum instanceof Cesium.PerspectiveFrustum) {
      this.camera.frustum.fov = Cesium.Math.toRadians(fov);
    }
  }
}
