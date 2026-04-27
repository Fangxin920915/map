import * as Cesium from "cesium";
import {
  ActualZoomParams,
  CameraConfigParams,
  CoordinatePair,
  EngineType,
  LensType,
} from "@gdu-gl/common";
import ARPTZFOVCalculator from "./ARPTZFOVCalculator";
import {
  calculateMapCameraViewOffsetByFOV,
  getAmountDistance,
  getBottomFrustumIntersectionPoint,
  getFakeCameraDirection,
  getFakeCameraLocalMatrix,
  moveAlongDirection,
  rayEllipsoidIntersection,
} from "./ARUtils";
// 广角相机参数：4000×2250有效像素 + 5μm像素尺寸 + 16:9 + 4mm焦距
const wideCam: CameraConfigParams = {
  effectivePixelWidth: 8000, // 有效像素宽（像素数）
  effectivePixelHeight: 4500, // 有效像素高（像素数）
  pixelSize: 0.8, // 像素尺寸（μm）
  aspectRatio: { width: 16, height: 9 }, // 可选，不传入则自动从有效像素推导（4000:2250=16:9）
  focalLength: 4.49, // 固定焦距（mm）
};

// 长焦相机参数：2000×1125有效像素 + 5μm像素尺寸 + 16:9 + 16mm最小焦距 + 40mm最大焦距
const teleCam: CameraConfigParams = {
  effectivePixelWidth: 8000,
  effectivePixelHeight: 4500,
  pixelSize: 0.8,
  aspectRatio: { width: 16, height: 9 }, // 可选，不传入则自动从有效像素推导（4000:2250=16:9）
  focalLength: 18, // 长焦最小焦距（4倍变焦）
  maxFocalLength: 46.3, // 长焦最大焦距（10倍变焦）
};

const infraredCam: CameraConfigParams = {
  effectivePixelWidth: 640, // 有效像素宽（像素数）
  effectivePixelHeight: 512, // 有效像素高（像素数）
  pixelSize: 12, // 像素尺寸（μm）
  aspectRatio: { width: 5, height: 4 }, // 可选，不传入则自动从有效像素推导（4000:2250=16:9）
  focalLength: 9.1, // 固定焦距（mm）
};
/**
 * AR相机工具，计算根据当前相机fov如何移动地图相机保持画面一致
 */
export default class ARCameraLocator {
  private calculator: ARPTZFOVCalculator;

  constructor() {
    this.calculator = new ARPTZFOVCalculator(wideCam, teleCam, infraredCam);
  }

  calculateFov(
    zoomRatio: number,
    actualFocalLength: number,
    lensType: LensType,
    engineType: EngineType,
  ) {
    const actualParams: ActualZoomParams = {
      zoomRatio,
      actualFocalLength,
      lensType,
    };
    if (engineType === EngineType.CESIUM) {
      return this.calculator.calculateHorizontalFOV(
        actualParams.zoomRatio,
        actualParams.lensType,
      );
    }
    return this.calculator.calculateVerticalFOV(
      actualParams.zoomRatio,
      actualParams.lensType,
    );
  }

  calculateMapCameraPos(options: {
    mapFov: number;
    camFov: number;
    camPos: CoordinatePair;
    heading: number;
    pitch: number;
    roll: number;
    zoom: number;
  }): CoordinatePair {
    const camPos = Cesium.Cartesian3.fromDegrees(...options.camPos);
    const heading = Cesium.Math.toRadians(options.heading);
    const pitch = Cesium.Math.toRadians(options.pitch);
    const roll = Cesium.Math.toRadians(options.roll);
    const camFovInRadians = Cesium.Math.toRadians(options.camFov);
    const mapFovInRadians = Cesium.Math.toRadians(options.mapFov);
    // 计算相机本地矩阵
    const cameraLocalMatrix = getFakeCameraLocalMatrix({
      position: camPos,
      heading,
      pitch,
      roll,
    });
    // 计算相机底部视锥体与椭球的交点
    const bottomFrustumIntersectionPoint = getBottomFrustumIntersectionPoint(
      cameraLocalMatrix,
      camFovInRadians,
    );
    // console.log(
    //   "bottomFrustumIntersectionPoint",
    //   bottomFrustumIntersectionPoint,
    // );
    if (!bottomFrustumIntersectionPoint) {
      return options.camPos;
    }
    const intersectionPointToCameraDistance = Cesium.Cartesian3.distance(
      bottomFrustumIntersectionPoint,
      camPos,
    );
    const amountDistance = getAmountDistance(
      camFovInRadians,
      mapFovInRadians,
      intersectionPointToCameraDistance,
    );

    const cameraDirection = getFakeCameraDirection({
      position: camPos,
      heading,
      pitch,
      roll,
    });
    const point = moveAlongDirection(camPos, cameraDirection, amountDistance);

    const graphic = Cesium.Cartographic.fromCartesian(point);
    const longitude = Cesium.Math.toDegrees(graphic.longitude);
    const latitude = Cesium.Math.toDegrees(graphic.latitude);

    return [longitude, latitude, graphic.height];
  }

  calculateMapCameraPos1(options: {
    mapFov: number;
    camFov: number;
    camPos: CoordinatePair;
    heading: number;
    pitch: number;
    roll: number;
    zoom: number;
  }): CoordinatePair {
    const camPos = Cesium.Cartesian3.fromDegrees(...options.camPos);
    const heading = Cesium.Math.toRadians(options.heading);
    const pitch = Cesium.Math.toRadians(options.pitch);
    const roll = Cesium.Math.toRadians(options.roll);
    const intersectionResult = rayEllipsoidIntersection({
      heading,
      pitch,
      roll,
      origin: camPos,
    });
    if (intersectionResult) {
      // const intersectionPoint = Cesium.Cartesian3.fromDegrees(
      //   intersectionResult.intersections[0].lon,
      //   intersectionResult.intersections[0].lat,
      //   intersectionResult.intersections[0].height,
      // );

      // const distance2 = Cesium.Cartesian3.distance(camPos, intersectionPoint);

      let distance =
        ((options.camPos[2] as number) - 20) /
        Math.cos(Cesium.Math.toRadians(Math.abs(90 + options.pitch)));
      // const maxDistance = 1000;
      // if (distance > maxDistance) {
      //   distance = maxDistance;
      // }

      const sin = Math.max(Math.abs(Math.sin(pitch)), 0.1);

      distance *= sin;

      // console.log("distance", distance, distance2);
      const magnitude = calculateMapCameraViewOffsetByFOV({
        magnitude: distance,
        mapFov: options.mapFov,
        camFov: options.camFov,
      });

      const point = moveAlongDirection(
        camPos,
        intersectionResult.direction,
        magnitude,
      );
      // console.log(
      //   "平移后的相机位置和给定的相机距离",
      //   Cesium.Cartesian3.distance(point, camPos),
      // );
      const carg = Cesium.Cartographic.fromCartesian(point);
      const longitude = Cesium.Math.toDegrees(carg.longitude);
      const latitude = Cesium.Math.toDegrees(carg.latitude);
      return [longitude, latitude, carg.height];
    }
    return options.camPos;
  }
}
