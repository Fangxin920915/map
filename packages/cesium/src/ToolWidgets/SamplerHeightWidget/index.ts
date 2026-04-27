import {
  Coordinate,
  HeightDataSubject,
  HeightDataSubjectImpl,
  BaseHeightSampler,
  SamplerMode,
  SamplerHeightWidgetAbstract,
} from "@gdu-gl/common";
import * as Cesium from "cesium";

abstract class CesiumSampler<
  T extends Coordinate = Coordinate,
> extends BaseHeightSampler<T> {
  // 明确 viewer 属性的类型为 Cesium.Viewer
  protected viewer: Cesium.Viewer;

  // 继承父类构造函数并约束 viewer 类型
  protected constructor(
    viewer: Cesium.Viewer, // 此处类型必须为 Cesium.Viewer
    subject: HeightDataSubject,
    mode: SamplerMode,
  ) {
    // 调用父类构造函数，将 viewer 作为 any 传递（因为父类定义为 any）
    super(viewer as any, subject, mode);

    // 重新赋值给当前类的 viewer 属性，恢复正确类型
    this.viewer = viewer;
  }
}

// 地形高度采样器（优化坐标处理）
class HeightSampler extends CesiumSampler {
  private sampleRemoveCallbackFunc: any[];

  constructor(
    viewer: Cesium.Viewer,
    subject: HeightDataSubject,
    mode: SamplerMode,
  ) {
    super(viewer, subject, mode);
    this.sampleRemoveCallbackFunc = [];
  }

  getHeightReference() {
    return Cesium.HeightReference.CLAMP_TO_GROUND;
  }

  sampleHeight(coordinate: Coordinate): Coordinate {
    const { longitude, latitude } = coordinate;
    const cartographic = Cesium.Cartographic.fromDegrees(longitude, latitude);
    // @ts-ignore
    const height = this.viewer.scene.getHeight(cartographic);
    return { ...coordinate, height };
  }

  sampleHeightRefresh(coordinate: Coordinate): void {
    const { longitude, latitude } = coordinate;
    const cartographic = Cesium.Cartographic.fromDegrees(longitude, latitude);

    const removeFunc = (clampCartographic: Cesium.Cartographic) => {
      const { height } = clampCartographic;
      this.subject.notifyObservers(
        { ...coordinate, height },
        this.mode,
        height,
      );
    };
    const hash = this.subject.getHash(coordinate, this.mode);
    const observer = this.subject.getObservations(hash);
    if (observer.length === 1) {
      const id = this.subject.getHash(coordinate, this.mode);
      this.sampleRemoveCallbackFunc.push({
        id,
        func: removeFunc,
      });
      // @ts-ignore
      this.viewer.scene.updateHeight(
        cartographic,
        removeFunc,
        this.getHeightReference(),
      );
    }
  }

  removeSamplerRefresh(coordinate: Coordinate, mode: SamplerMode): void {
    const hasObserver = this.subject.hasObserver(coordinate, mode);
    if (hasObserver) {
      const hash = this.subject.getHash(coordinate, mode);
      const removeFunc = this.sampleRemoveCallbackFunc.find(
        (v) => v.id === hash,
      );
      removeFunc && removeFunc();
    }
  }

  destroy() {
    this.sampleRemoveCallbackFunc.forEach((func) => {
      func();
    });
    this.sampleRemoveCallbackFunc = [];
  }
}

export default class SamplerHeightWidget extends SamplerHeightWidgetAbstract<Cesium.Viewer> {
  constructor(viewer: Cesium.Viewer) {
    super(new HeightDataSubjectImpl(), viewer);
  }

  protected initializeSamplers(): void {
    this.samplers.set(
      SamplerMode.TERRAIN,
      new HeightSampler(this.viewer, this.subject, SamplerMode.TERRAIN),
    );

    this.samplers.set(
      SamplerMode.MODEL,
      new HeightSampler(this.viewer, this.subject, SamplerMode.MODEL),
    );
  }
}
