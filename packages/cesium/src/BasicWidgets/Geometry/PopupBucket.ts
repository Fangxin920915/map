import * as Cesium from "cesium";
import { Feature, PopupPosition } from "@gdu-gl/common";
import GeometryParamsTransform from "./GeometryParamsTransform";
import {
  PopupImp,
  PopupOptions,
  PopupBucketImp,
  CesiumFeatureImp,
} from "../../Types/IGeometryImp";
import Popup from "./Popup";

export default class PopupBucket implements PopupBucketImp {
  popupGroup: Map<string, PopupImp>;

  bucketId: string;

  bucketGeometryLength: number;

  readonly geometryType: "Popup";

  private _viewer: Cesium.Viewer;

  private _observer?: ResizeObserver;

  private featureCache: CesiumFeatureImp;

  constructor(viewer: Cesium.Viewer, featureCache: CesiumFeatureImp) {
    this._viewer = viewer;
    this.popupGroup = new Map();
    this.geometryType = "Popup";
    this._observer = undefined;
    this.bucketId = Cesium.createGuid();
    this.featureCache = featureCache;
    this.bucketGeometryLength = 0;
  }

  add(layerId: string, feature: Feature): void {
    const { popUpProperties, attributeProperties } =
      feature.properties.appearance;
    const positions = GeometryParamsTransform.createPointGeometry(
      feature,
    ) as Cesium.Cartesian3[];
    this.featureCache.addFeatureToCache(feature.properties.id, {
      feature,
      bucketId: this.bucketId,
      featureId: feature.properties.id,
      geometryType: this.geometryType,
      instancesIds: [],
      layerId,
      materialId: "",
      primitiveId: "",
    });
    const popupOption: PopupOptions = {
      clampToGround: popUpProperties?.clampToGround,
      contentDom: popUpProperties?.contentDom,
      domId: feature.properties.id,
      position: positions[0],
      zIndex: popUpProperties?.zIndex,
      show: attributeProperties?.show,
      offset: popUpProperties?.offset as [number, number],
      anchor: popUpProperties?.anchor as PopupPosition,
    };
    const hasPopup = this.popupGroup.has(popupOption.domId);
    if (!hasPopup) {
      const popup = new Popup(popupOption, this._viewer);
      this.popupGroup.set(popupOption.domId, popup);
      this.bucketGeometryLength++;
    } else {
      console.log("popup id is exist");
    }
  }

  remove(id: string): void {
    const hasPopup = this.popupGroup.has(id);
    if (hasPopup) {
      const popup = this.popupGroup.get(id);
      if (popup) {
        popup.destroy();
      }
      this.popupGroup.delete(id);
      this.bucketGeometryLength--;
      this.featureCache.removeFeatureToCache(id);
    } else {
      console.log("popup id is not exist");
    }
  }

  updateFeatureGeometry(feature: Feature): void {
    const positions = GeometryParamsTransform.createPointGeometry(
      feature,
    ) as Cesium.Cartesian3[];
    const { id } = feature.properties;
    const hasPopup = this.popupGroup.has(id);
    if (!hasPopup) {
      console.log("popup id is not exist");
    } else {
      const popup = this.popupGroup.get(id);
      if (popup) {
        popup.position = Cesium.Cartesian3.clone(positions[0]);
      }
    }
  }

  updateAttributeProperties(feature: Feature): void {
    const { id } = feature.properties;
    const hasPopup = this.popupGroup.has(id);
    if (!hasPopup) {
      console.log("popup id is not exist");
    } else {
      const popup = this.popupGroup.get(id);
      if (popup) {
        popup.show =
          feature.properties.appearance.attributeProperties.show ?? true;
      }
    }
  }

  updateUpdatePopupProperties(feature: Feature): void {
    const { id } = feature.properties;
    const hasPopup = this.popupGroup.has(id);
    if (!hasPopup) {
      console.log("popup id is not exist");
    } else {
      const popup = this.popupGroup.get(id);
      if (popup) {
        popup.show =
          feature.properties.appearance.attributeProperties.show ?? true;
        popup.anchor = feature.properties.appearance.popUpProperties
          ?.anchor as PopupPosition;
        popup.offset = feature.properties.appearance.popUpProperties
          ?.offset as [number, number];
        popup.zIndex = feature.properties.appearance.popUpProperties
          ?.zIndex as number;
        popup.clampToGround = feature.properties.appearance.popUpProperties
          ?.clampToGround as boolean;
        // 如果不是贴地弹窗，需要更新弹窗位置，因为此时去掉贴地后popup内部并不知道原始位置在哪里
        // 需要重新指定下坐标
        if (!popup.clampToGround) {
          const positions = GeometryParamsTransform.createPointGeometry(
            feature,
          ) as Cesium.Cartesian3[];
          // @ts-ignore
          popup.position = Cesium.Cartesian3.clone(positions[0]);
        }
      }
    }
  }

  get length(): number {
    return this.bucketGeometryLength;
  }

  init() {
    this._observer = new ResizeObserver(this.update.bind(this));
    // 开始监听 Canvas 元素
    this._observer.observe(this._viewer.canvas);
  }

  getPopup(id: string) {
    const hasPopup = this.popupGroup.has(id);
    if (hasPopup) {
      return this.popupGroup.get(id);
    }
  }

  update() {
    this.popupGroup.forEach((popup) => {
      popup.update();
    });
  }

  updateMaterialProperties(feature: Feature): void {
    console.log("Method not implemented.", feature);
  }

  updateLineStringProperties(feature: Feature): void {
    console.log("Method not implemented.", feature);
  }

  updateSymbolProperties(feature: Feature): void {
    console.log("Method not implemented.", feature);
  }

  updateAppearanceProperties(feature: Feature): void {
    console.log("Method not implemented.", feature);
  }

  updateGroundLineStringProperties(feature: Feature): void {
    console.log(feature);
  }

  destroy() {
    this.popupGroup.clear();
    this.bucketGeometryLength = 0;
    this._observer?.disconnect();
  }
}
