import * as Cesium from "cesium";
import { GeometryType, PopupPosition } from "@gdu-gl/common";
import { defaultTo } from "lodash-es";
import { PopupImp, PopupOptions } from "../../Types/IGeometryImp";

export default class Popup implements PopupImp {
  private _show: boolean;

  private _domId: any;

  private _dom: HTMLElement | undefined;

  private _position: Cesium.Cartesian3;

  readonly geometryType: GeometryType;

  private _boundSphere: Cesium.BoundingSphere;

  private _viewer: Cesium.Viewer;

  private _zIndex: number;

  private _contentDom: HTMLElement;

  private _offset: [number, number];

  private _anchor: PopupPosition;

  private _clampToGround: boolean;

  private _removeSampleFunc?: () => void;

  constructor(options: PopupOptions, viewer: Cesium.Viewer) {
    this._viewer = viewer;
    this._show = defaultTo(options.show, true);
    this._domId = defaultTo(options.domId, Cesium.createGuid());
    this._dom = undefined;
    this._zIndex = defaultTo(options.zIndex, 1);
    this._position = defaultTo(options.position, new Cesium.Cartesian3());

    this._contentDom = defaultTo(
      options.contentDom,
      document.createElement("div"),
    );
    this._offset = defaultTo(options.offset, [0, 0]);
    this._anchor = defaultTo(options.anchor, PopupPosition.BOTTOM_CENTER);
    this._boundSphere = new Cesium.BoundingSphere(this._position, 1);
    this.geometryType = "Popup";
    this._clampToGround = defaultTo(options.clampToGround, false);
    this._removeSampleFunc = undefined;
    this.getDom();
  }

  get clampToGround(): boolean {
    return this._clampToGround;
  }

  set clampToGround(value: boolean) {
    this._clampToGround = value;
    if (this._removeSampleFunc) {
      this._removeSampleFunc();
      this._removeSampleFunc = undefined;
    }
    this.update();
  }

  get show(): boolean {
    return this._show;
  }

  set show(show: boolean) {
    this._show = show;
    if (this._dom) {
      this.setDomVisible(show);
      this.update();
    }
  }

  get id(): string {
    return this._domId;
  }

  get position(): Cesium.Cartesian3 {
    return this._position;
  }

  set position(position: Cesium.Cartesian3) {
    this._position = Cesium.Cartesian3.clone(position);
    this._boundSphere.center = Cesium.Cartesian3.clone(this._position);
    if (
      (this._clampToGround && this._removeSampleFunc) ||
      !this._clampToGround
    ) {
      if (this._removeSampleFunc) {
        this._removeSampleFunc();
      }
      this._removeSampleFunc = undefined;
    }
    if (this._dom) {
      this.update();
    }
  }

  get zIndex(): number {
    return this._zIndex;
  }

  set zIndex(zIndex: number) {
    this._zIndex = zIndex;
    if (this._dom) {
      this._dom.style.zIndex = zIndex.toString();
    }
  }

  get offset(): [number, number] {
    return this._offset;
  }

  set offset(value: [number, number]) {
    this._offset = value;
    if (this._dom) {
      this.update();
    }
  }

  get anchor(): PopupPosition {
    return this._anchor;
  }

  set anchor(value: PopupPosition) {
    this._anchor = value;
    if (this._dom) {
      this.update();
    }
  }

  getDom() {
    const dom = document.getElementById(this._domId);
    if (dom) {
      dom.style.position = "absolute";
      dom.style.left = "0px";
      dom.style.top = "0px";
      this._dom = dom;
      this._dom.style.zIndex = this._zIndex.toString();
      this._dom.appendChild(this._contentDom);
      this._viewer.container.appendChild(this._dom);
      this.update();
    }
  }

  updateHeightHandler(clampCartographic: Cesium.Cartographic) {
    if (clampCartographic && clampCartographic.height > -1) {
      const cartographic = Cesium.Cartographic.fromCartesian(this._position);
      this._position = Cesium.Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        clampCartographic.height,
      );
      const visible = this.isPointBehindCamera(this._viewer, this._position);
      if (!visible || !this.show) {
        this.setDomVisible(false);
      } else {
        this.updateDomPosition();
      }
    }
  }

  /**
   * @private
   * 更新dom元素坐标
   */
  updateDomPosition() {
    const position = this._position;
    const { scene } = this._viewer;

    const windowPosition = scene.cartesianToCanvasCoordinates(position);
    // @ts-ignore
    const { width, height } = scene.view.viewport;

    if (windowPosition) {
      if (
        windowPosition.x > width ||
        windowPosition.y > height ||
        windowPosition.x < 0 ||
        windowPosition.y < 0
      ) {
        this.setDomVisible(false);
      } else if (this._dom) {
        this.setDomVisible(true);
        this.setDomPosition(windowPosition);
      }
    }
  }

  setDomPosition(windowPosition: Cesium.Cartesian2) {
    if (this._dom) {
      this._dom.style.transform = `translate(${windowPosition.x}px,${windowPosition.y}px)`;

      const x = this._offset[0] + windowPosition.x;
      const y = this._offset[1] + windowPosition.y;

      const map = {
        [PopupPosition.BOTTOM_LEFT]: `translate(calc(0% + ${x}px), calc(-100% +  ${y}px))`,
        [PopupPosition.BOTTOM_CENTER]: `translate(calc(-50% + ${x}px), calc(-100% + ${y}px))`,
        [PopupPosition.BOTTOM_RIGHT]: `translate(calc(-100% + ${x}px), calc(0% + ${y}px))`,
        [PopupPosition.CENTER_LEFT]: `translate(calc(0% + ${x}px), calc(-50% + ${y}px))`,
        [PopupPosition.CENTER_CENTER]: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
        [PopupPosition.CENTER_RIGHT]: `translate(calc(-100% + ${x}px), calc(-50% + ${y}px))`,
        [PopupPosition.TOP_LEFT]: `translate(calc(0% + ${x}px), calc(0% + ${y}px))`,
        [PopupPosition.TOP_CENTER]: `translate(calc(-50% + ${x}px), calc(0% + ${y}px))`,
        [PopupPosition.TOP_RIGHT]: `translate(calc(-100% + ${x}px), calc(0% + ${y}px))`,
      };

      this._dom.style.transform = map[this._anchor];
    }
  }

  setDomVisible(visible: boolean) {
    if (this._dom) {
      const display = visible ? "block" : "none";
      if (this._dom.style.display !== display) {
        this._dom.style.display = display;
      }
    }
  }

  isPointBehindCamera(
    viewer: Cesium.Viewer,
    coordinates: Cesium.Cartesian3,
  ): boolean {
    // 如何不是三维模式永远不会在背面
    if (viewer.scene.mode !== Cesium.SceneMode.SCENE3D) return false;
    // 不存在目标点，隐藏弹框
    if (!coordinates) return true;
    const cameraPosition = viewer.camera.position; // 获取相机位置（世界坐标系）
    const targetPosition = coordinates; // 转换目标点为世界坐标系

    const target = Cesium.Cartesian3.subtract(
      targetPosition,
      cameraPosition,
      new Cesium.Cartesian3(),
    );

    const dotProduct = Cesium.Cartesian3.dot(target, targetPosition);
    return dotProduct <= 0; // 如果点积大于0，说明目标点在相机的背面
  }

  update() {
    if (!this._dom) {
      this.getDom();
    }

    if (this._clampToGround) {
      if (!this._removeSampleFunc) {
        const cartographic = Cesium.Cartographic.fromCartesian(this._position);
        // @ts-ignore
        const height = this._viewer.scene.getHeight(
          cartographic,
          Cesium.HeightReference.CLAMP_TO_GROUND,
        );

        this._position = Cesium.Cartesian3.fromRadians(
          cartographic.longitude,
          cartographic.latitude,
          height,
        );
        // @ts-ignore
        this._removeSampleFunc = this._viewer.scene.updateHeight(
          cartographic,
          this.updateHeightHandler.bind(this),
          Cesium.HeightReference.CLAMP_TO_GROUND,
        );
      }
    }
    // const carg = Cesium.Cartographic.fromCartesian(this._position);
    const visible = this.isPointBehindCamera(this._viewer, this._position);
    if (!visible || !this.show) {
      this.setDomVisible(false);
    } else {
      this.updateDomPosition();
    }
  }

  destroy() {
    if (this._dom) {
      this.setDomVisible(false);
      this._viewer.container.removeChild(this._dom);
    }
  }
}
