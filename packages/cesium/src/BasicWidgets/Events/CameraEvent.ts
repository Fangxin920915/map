import {
  calculateLevelByHeight,
  cartesian2Coordinates,
  getCameraFocus,
  getZoomLevelHeights,
  is2dMode,
} from "@cesium-engine/Utils";
import {
  CameraEventParams,
  EventBasic,
  EventName,
  IViewerDelegateImp,
  PointCoordinates,
} from "@gdu-gl/common";
import * as Cesium from "cesium";

type RecordCameraInfo = {
  upWC: Cesium.Cartesian3;
  positionWC: Cesium.Cartesian3;
  heading: number;
  pitch: number;
  roll: number;
  viewport: Cesium.BoundingRectangle;
};
export default class CameraEvent extends EventBasic {
  private readonly map: Cesium.Viewer;

  private readonly _onPreRender = () => {
    const cameraChange = this.isCameraChange();
    if (cameraChange && !this._isMoving) {
      this._isMoving = true;
      this.triggerListener(EventName.CAMERA_MOVE_START, this.getCameraInfo());
      this.triggerListener(EventName.CAMERA_MOVING, this.getCameraInfo());
    } else if (cameraChange && this._isMoving) {
      this.triggerListener(EventName.CAMERA_MOVING, this.getCameraInfo());
    } else if (!cameraChange && this._isMoving) {
      this.triggerListener(EventName.CAMERA_MOVING, this.getCameraInfo());
      this._isMoving = false;
      this.triggerListener(EventName.CAMERA_MOVE_END, this.getCameraInfo());
    }
  };

  private _isMoving: boolean;

  /**
   * 记录相机信息
   * @private
   */
  private _cameraInfo: RecordCameraInfo = {
    upWC: new Cesium.Cartesian3(),
    heading: 0,
    pitch: 0,
    roll: 0,
    viewport: new Cesium.BoundingRectangle(),
    positionWC: new Cesium.Cartesian3(),
  };

  private readonly _zoomHeightMapping: Map<number, number>;

  constructor(viewer: IViewerDelegateImp) {
    super();
    this._isMoving = false;
    this.map = viewer.mapProviderDelegate.map;
    this._zoomHeightMapping = getZoomLevelHeights(this.map.scene, 1);
    // 绑定事件处理函数的this上下文
  }

  init(): void {
    this.map.scene.preRender.addEventListener(this._onPreRender);
  }

  getCameraInfo(): CameraEventParams {
    return {
      heading: Cesium.Math.toDegrees(this.map.camera.heading),
      pitch: Cesium.Math.toDegrees(this.map.camera.pitch),
      roll: Cesium.Math.toDegrees(this.map.camera.roll),
      coordinates: cartesian2Coordinates(
        this.map.camera.position,
      ) as PointCoordinates,
      zoom: this.getZoom(),
      is2dMode: is2dMode(this.map.camera),
    };
  }

  /**
   * 获取视口中心点的地理坐标
   * @returns 地理坐标 [经度, 纬度, 高度] 或 undefined
   * @description
   * 1. 通过屏幕中心点向场景发射三条探测射线（顶部、中心、底部）
   * 2. 优先尝试获取中心点的地表坐标
   * 3. 当中心点不可见时，垂直扫描屏幕中线查找第一个可见的地面点
   */
  getCenter(): PointCoordinates | undefined {
    const focus = getCameraFocus(this.map.scene);
    if (!focus) {
      return undefined;
    }
    return cartesian2Coordinates(focus);
  }

  /**
   * 获取当前相机缩放层级
   * @returns number 返回基于高度映射表的插值缩放层级
   * @description
   * 1. 优先尝试获取视口中心点坐标
   * 2. 当中心点不可得时，直接使用相机高度计算层级
   * 3. 当中心点有效时，通过计算相机位置到焦点位置的距离确定层级
   * @example
   * // 当相机在1000米高度且层级映射表显示该高度对应层级10时
   * controller.getZoom() // 返回 10.3（示例值）
   */
  getZoom() {
    const center = this.getCenter();
    if (!center) {
      const { positionCartographic } = this.map.scene.camera;
      return calculateLevelByHeight(
        this._zoomHeightMapping,
        positionCartographic.height,
      ) as number;
    }

    const { positionWC } = this.map.camera;
    const [lon, lat, height] = center;
    const positionCartesian = Cesium.Cartesian3.fromDegrees(lon, lat, height);
    const distance = Cesium.Cartesian3.distance(positionWC, positionCartesian);
    return calculateLevelByHeight(this._zoomHeightMapping, distance) as number;
  }

  /**
   * 判断相机是否发生移动
   * @returns 是否更新了相机的信息
   */
  isCameraChange() {
    let change = false;
    const { positionWC, upWC, heading, pitch, roll } = this.map.camera;
    const { view } = this.map.scene as any;
    const viewport = view.viewport as Cesium.BoundingRectangle;
    // 比较视口大小
    if (!Cesium.BoundingRectangle.equals(this._cameraInfo.viewport, viewport)) {
      this._cameraInfo.viewport = Cesium.BoundingRectangle.clone(viewport);
      change = true;
    }

    // 比较相机位置
    if (
      !Cesium.Cartesian3.equalsEpsilon(
        positionWC,
        this._cameraInfo.positionWC,
        0.00000001,
      )
    ) {
      this._cameraInfo.positionWC = Cesium.Cartesian3.clone(positionWC);
      change = true;
    }
    // 比较相机向上法向量
    if (
      !Cesium.Cartesian3.equalsEpsilon(upWC, this._cameraInfo.upWC, 0.00001)
    ) {
      this._cameraInfo.upWC = Cesium.Cartesian3.clone(upWC);
      change = true;
    }

    // 比较heading值是否移动
    if (Math.abs(heading - this._cameraInfo.heading) >= 0.0000001) {
      this._cameraInfo.heading = heading;
      change = true;
    }
    // 比较pitch值是否移动
    if (Math.abs(pitch - this._cameraInfo.pitch) >= 0.0000001) {
      this._cameraInfo.pitch = pitch;
      change = true;
    }

    // 比较roll值是否移动
    if (Math.abs(roll - this._cameraInfo.roll) >= 0.0000001) {
      this._cameraInfo.roll = roll;
      change = true;
    }
    return change;
  }

  destroy(): void {
    super.destroy();
    this.map.scene.preRender.removeEventListener(this._onPreRender);
  }
}
