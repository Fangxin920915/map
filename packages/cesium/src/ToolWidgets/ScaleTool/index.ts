import * as Cesium from "cesium";
import {
  EventName,
  IEventDelegateImp,
  IViewerDelegateImp,
  ScaleChangeCallback,
  ScaleOptions,
  IScaleToolImp,
} from "@gdu-gl/common";

import { throttle } from "lodash-es";

export default class ScaleTool implements IScaleToolImp {
  private readonly _viewer: Cesium.Viewer;

  private _geodesic?: Cesium.EllipsoidGeodesic | null;

  private _event?: IEventDelegateImp;

  private _distances = [
    1, 2, 3, 5, 10, 20, 30, 50, 100, 200, 300, 500, 1000, 2000, 3000, 5000,
    10000, 20000, 30000, 50000, 100000, 200000, 300000, 500000, 1000000,
    2000000, 3000000, 5000000, 10000000, 20000000, 30000000, 50000000,
  ];

  private _updateDistanceLegend: any;

  /**
   * 比例尺轴的长度
   */
  _barWidth?: number;

  /**
   * 比例尺轴的文字内容
   */
  _distanceLabel?: string;

  /**
   * 当前真实比例尺（米为单位）
   */
  _distance?: number;

  /**
   * 比例尺轴的最大长度（最小值为100）
   */
  private _maxBarWidth?: number;

  private _changeCallback?: ScaleChangeCallback;

  constructor(viewer: IViewerDelegateImp) {
    this._viewer = viewer.mapProviderDelegate.map;
    this._geodesic = new Cesium.EllipsoidGeodesic();
    this._event = viewer.eventsDelegate;
  }

  init(options: ScaleOptions) {
    this._maxBarWidth = Math.max(options.maxBarWidth, 10);
    this._changeCallback = options.changeCallback;
    this._updateDistanceLegend = throttle(
      this.updateDistanceLegend.bind(this),
      100,
      {
        leading: true,
        trailing: false,
      },
    );
    this._updateDistanceLegend();
    this.addEvent();
  }

  get maxBarWidth(): number {
    return this._maxBarWidth!;
  }

  setMaxBarWidth(maxBarWidth: number) {
    this._maxBarWidth = Math.max(maxBarWidth ?? 100, 10);
    this._updateDistanceLegend();
  }

  addEvent() {
    this._event?.addEventListener(
      EventName.CAMERA_MOVING,
      this._updateDistanceLegend,
    );
  }

  removeEvent() {
    this._event?.removeEventListener(
      EventName.CAMERA_MOVING,
      this._updateDistanceLegend,
    );
  }

  updateDistanceLegend() {
    const { scene } = this._viewer;
    const { Cartesian2, defined } = Cesium;
    const width = scene.canvas.clientWidth;
    const height = scene.canvas.clientHeight;
    if (width <= 0 || height <= 0) {
      return;
    }

    const left = scene.camera.getPickRay(
      new Cartesian2((width / 2) | 0, height - 1),
    ) as Cesium.Ray;
    const right = scene.camera.getPickRay(
      new Cartesian2((1 + width / 2) | 0, height - 1),
    ) as Cesium.Ray;

    const { globe } = scene;
    const leftPosition = globe.pick(left, scene);
    const rightPosition = globe.pick(right, scene);

    if (!leftPosition || !rightPosition || !this._geodesic) {
      this._barWidth = undefined;
      this._distanceLabel = undefined;
      this._distance = undefined;
      this._changeCallback && this._changeCallback({});
      return;
    }

    const leftCartographic =
      globe.ellipsoid.cartesianToCartographic(leftPosition);
    const rightCartographic =
      globe.ellipsoid.cartesianToCartographic(rightPosition);

    this._geodesic.setEndPoints(leftCartographic, rightCartographic);
    const pixelDistance = this._geodesic.surfaceDistance;

    // Find the first distance that makes the scale bar less than 10 pixels.
    let distance = null;
    let i = this._distances.length - 1;
    while (!defined(distance) && i >= 0) {
      if (this._distances[i] / pixelDistance < this._maxBarWidth!) {
        distance = this._distances[i];
      }
      i--;
    }

    if (distance === null) {
      this._barWidth = undefined;
      this._distanceLabel = undefined;
      this._distance = undefined;
      this._changeCallback && this._changeCallback({});
      return;
    }

    this._distanceLabel =
      distance >= 1000 ? `${distance / 1000}km` : `${distance}m`;
    this._barWidth = Math.ceil(distance / pixelDistance);
    this._distance = distance;
    this._changeCallback &&
      this._changeCallback({
        barWidth: this._barWidth,
        distanceLabel: this._distanceLabel,
        distance: this._distance,
      });
  }

  destroy() {
    this._updateDistanceLegend.cancel();
    this.removeEvent();
    // this._event?.destroy();
    this._geodesic = null;
  }
}
