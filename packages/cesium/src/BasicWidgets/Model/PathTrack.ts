import {
  IPathTrack,
  PointCoordinates,
  IPathTrackOptions,
} from "@gdu-gl/common";
import * as Cesium from "cesium";

export default class PathTrack implements Omit<IPathTrack, "init"> {
  private _delayTime: number = 5;

  private _color: string = "yellow";

  private _width: number = 10;

  private _visible: boolean = true;

  private _viewer: Cesium.Viewer;

  private _sampledPositionProperty: Cesium.SampledPositionProperty;

  private _entity: Cesium.Entity | null = null;

  constructor(viewer: Cesium.Viewer, params: IPathTrackOptions) {
    this._viewer = viewer;
    this._sampledPositionProperty = new Cesium.SampledPositionProperty();
    const { delayTime, visible, width, color } = params;
    this._delayTime = delayTime ?? 5;
    this._visible = visible ?? false;
    this._width = width ?? 10;
    this._color = color ?? "yellow";
    this.addEntity();
  }

  set color(color: string) {
    this._color = color;
  }

  get color(): string {
    return this._color;
  }

  set width(width: number) {
    this._width = width;
  }

  get width(): number {
    return this._width;
  }

  set delayTime(delayTime: number) {
    this._delayTime = delayTime;
  }

  get delayTime(): number {
    return this._delayTime;
  }

  set visible(visible: boolean) {
    this._visible = visible;
  }

  get visible(): boolean {
    return this._visible;
  }

  addEntity(): void {
    this._entity = this._viewer.entities.add(
      new Cesium.Entity({
        position: this._sampledPositionProperty,
        name: "path",
        path: {
          show: new Cesium.CallbackProperty(() => this._visible, false),
          leadTime: 0,
          trailTime: new Cesium.CallbackProperty(() => this._delayTime, false),
          width: new Cesium.CallbackProperty(() => this._width, false),
          resolution: 1,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.3,
            taperPower: 0.3,
            color: new Cesium.CallbackProperty(
              () => Cesium.Color.fromCssColorString(this._color),
              false,
            ),
          }),
        },
      }),
    );
  }

  addPosition(position: PointCoordinates): void {
    this._sampledPositionProperty.addSample(
      Cesium.JulianDate.now(),
      Cesium.Cartesian3.fromDegrees(...position),
    );
  }

  refresh(): void {
    if (this._entity) {
      Cesium.destroyObject(this._sampledPositionProperty);
      this._sampledPositionProperty = new Cesium.SampledPositionProperty();
      this._entity.position = this._sampledPositionProperty;
    }
  }

  destroy(): void {
    this._entity && this._viewer.entities.remove(this._entity);
    Cesium.destroyObject(this._sampledPositionProperty);
    Cesium.destroyObject(this._entity);
  }
}
