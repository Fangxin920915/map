import { cloneDeep } from "lodash-es";

import {
  AttributeProperties,
  Coordinates,
  Feature,
  GeometryType,
  SymbolProperties,
} from "@gdu-gl/common";
import * as Cesium from "cesium";
import {
  CesiumGeometryManagerImp,
  CesiumPointCollectionImp,
  PointBucketImp,
} from "../../Types/IGeometryImp";

import FeatureCache from "./FeatureCache";
import PointBucket from "./PointBucket";

export default class PointCollection implements CesiumPointCollectionImp {
  maxBucketGeometryLength: number;

  geometryBucketStore: PointBucketImp[];

  featureCache: FeatureCache;

  geometryType: GeometryType;

  scene?: Cesium.Scene;

  geometryManager: CesiumGeometryManagerImp;

  constructor(options: {
    scene?: Cesium.Scene;
    maxBucketGeometryLength?: number;
    featureCache: FeatureCache;
    geometryType: GeometryType;
    geometryManager: CesiumGeometryManagerImp;
  }) {
    this.maxBucketGeometryLength =
      options && options.maxBucketGeometryLength
        ? options.maxBucketGeometryLength
        : 1000;
    this.featureCache = options.featureCache;
    this.geometryBucketStore = [];
    this.geometryType = options.geometryType;
    this.scene = options.scene;
    this.geometryManager = options.geometryManager;
  }

  removeBucket(bucketId: string): void {
    const bucketIndex = this.geometryBucketStore.findIndex(
      (v) => v.bucketId === bucketId,
    );
    if (bucketIndex > -1) {
      this.geometryBucketStore[bucketIndex].destroy();
      this.geometryBucketStore.splice(bucketIndex, 1);
    }
  }

  getBucket(bucketId: string): PointBucketImp | undefined {
    return this.geometryBucketStore.find((v) => v.bucketId === bucketId);
  }

  createBucket(): PointBucketImp {
    return new PointBucket({
      geometryType: this.geometryType,
      geometryCollection: this,
      featureCache: this.featureCache,
    });
  }

  add(layerId: string, feature: Feature): void {
    if (feature && layerId) {
      const bucket = this._getGeometryBucketFromBucketStore();
      bucket.add(layerId, feature);
    }
  }

  _getGeometryBucketFromBucketStore(): PointBucketImp {
    // 从后向前遍历数组
    for (let i = this.geometryBucketStore.length - 1; i >= 0; i--) {
      if (
        this.geometryBucketStore[i].bucketGeometryLength <
        this.maxBucketGeometryLength
      ) {
        return this.geometryBucketStore[i];
      }
    }
    const bucket = this.createBucket();
    this.geometryBucketStore.push(bucket);
    return bucket;
  }

  _getGeometryBucket(bucketId: string) {
    return this.geometryBucketStore.find((v) => v.bucketId === bucketId);
  }

  remove(featureId: string): void {
    const featureCache = this.featureCache.getFeatureCache(featureId);
    if (!featureCache) return;
    const bucket = this._getGeometryBucket(featureCache.bucketId);
    if (bucket) {
      bucket.remove(featureId);
      this.featureCache.removeFeatureToCache(featureId);
    }
  }

  update(frameState: any): void {
    // @ts-ignore
    this.geometryBucketStore.forEach((bucket) => bucket.update(frameState));
  }

  updateFeatureGeometry(id: string, coordinate: Coordinates): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const bucket = this._getGeometryBucket(featureCache.bucketId);
      if (bucket) {
        const { feature } = featureCache;
        feature.geometry.coordinates = cloneDeep(coordinate);
        bucket.updateFeatureGeometry(feature);
      }
    }
  }

  updateAttributeProperties(
    id: string,
    attributeProperties: AttributeProperties,
  ): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const bucket = this._getGeometryBucket(featureCache.bucketId);
      if (bucket) {
        const { feature } = featureCache;
        feature.properties.appearance.attributeProperties = {
          ...feature.properties.appearance.attributeProperties,
          ...attributeProperties,
        };
        bucket.updateAttributeProperties(feature);
      }
    }
  }

  updateSymbolHeightReference(id: string, clampToGround: boolean): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const bucket = this._getGeometryBucket(featureCache.bucketId);
      if (bucket) {
        const { feature } = featureCache;
        if (feature.properties.appearance.symbolProperties) {
          feature.properties.appearance.symbolProperties.clampToGround =
            clampToGround;
          // @ts-ignore
          bucket.updateSymbolHeightReference(feature);
        }
      }
    }
  }

  updateSymbolProperties(id: string, symbolProperties: any): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const bucket = this._getGeometryBucket(featureCache.bucketId);
      if (bucket) {
        const { feature } = featureCache;
        const { pointChanged, textChanged } = this.compareSymbolProperties(
          feature.properties.appearance.symbolProperties ?? {},
          symbolProperties,
        );
        feature.properties.appearance.symbolProperties = {
          ...feature.properties.appearance.symbolProperties,
          ...symbolProperties,
        };
        if (pointChanged) bucket.updatePointSymbolProperties(feature);
        if (textChanged) bucket.updateTextSymbolProperties(feature);
      }
    }
  }

  compareSymbolProperties(
    oldProps: SymbolProperties,
    newProps: SymbolProperties,
  ): {
    pointChanged: boolean;
    textChanged: boolean;
  } {
    // 解析默认值，确保比较时使用一致的默认值
    const oldOpts = oldProps;
    const newOpts = newProps;

    // 比较点位信息
    const pointChanged = !(
      JSON.stringify(oldOpts.iconSize) === JSON.stringify(newOpts.iconSize) &&
      oldOpts.shapeType === newOpts.shapeType &&
      oldOpts.shapeColor === newOpts.shapeColor &&
      oldOpts.borderWidth === newOpts.borderWidth &&
      oldOpts.borderColor === newOpts.borderColor &&
      JSON.stringify(oldOpts.iconOffset) ===
        JSON.stringify(newOpts.iconOffset) &&
      oldOpts.iconAnchor === newOpts.iconAnchor &&
      oldOpts.iconUrl === newOpts.iconUrl
    );

    // 比较文字样式
    const textChanged = !(
      oldOpts.textAnchor === newOpts.textAnchor &&
      oldOpts.textBackgroundColor === newOpts.textBackgroundColor &&
      JSON.stringify(oldOpts.textBackgroundPadding) ===
        JSON.stringify(newOpts.textBackgroundPadding) &&
      oldOpts.textBackgroundBorderColor === newOpts.textBackgroundBorderColor &&
      oldOpts.textBackgroundRadius === newOpts.textBackgroundRadius &&
      oldOpts.textBackgroundBorderWidth === newOpts.textBackgroundBorderWidth &&
      oldOpts.textContent === newOpts.textContent &&
      oldOpts.textColor === newOpts.textColor &&
      oldOpts.textSize === newOpts.textSize &&
      oldOpts.textFontWeight === newOpts.textFontWeight &&
      oldOpts.textHalo?.color === newOpts.textHalo?.color &&
      oldOpts.textHalo?.width === newOpts.textHalo?.width &&
      JSON.stringify(oldOpts.textOffset) === JSON.stringify(newOpts.textOffset)
    );

    return {
      pointChanged,
      textChanged,
    };
  }

  isDestroyed() {
    return false;
  }

  destroy() {
    this.geometryBucketStore.forEach((bucket) => bucket.destroy());
    Cesium.destroyObject(this);
  }
}
