import { cloneDeep } from "lodash-es";
import {
  AttributeProperties,
  Coordinates,
  Feature,
  GeometryType,
  IViewerDelegateImp,
} from "@gdu-gl/common";
import * as Cesium from "cesium";
import {
  CesiumPopCollectionImp,
  PopupBucketImp,
  CesiumFeatureImp,
} from "../../Types/IGeometryImp";

import PopupBucket from "./PopupBucket";

export default class PopupCollection implements CesiumPopCollectionImp {
  maxBucketGeometryLength: number;

  geometryBucketStore: PopupBucketImp[];

  featureCache: CesiumFeatureImp;

  geometryType: GeometryType;

  viewer?: IViewerDelegateImp;

  scene?: Cesium.Scene | undefined;

  constructor(options: {
    viewer?: IViewerDelegateImp;
    maxBucketGeometryLength?: number;
    featureCache: CesiumFeatureImp;
    geometryType: GeometryType;
  }) {
    this.maxBucketGeometryLength =
      options && options.maxBucketGeometryLength
        ? options.maxBucketGeometryLength
        : 1000000;
    this.featureCache = options.featureCache;
    this.geometryBucketStore = [];
    this.geometryType = options.geometryType;
    this.viewer = options.viewer;
  }

  getBucket(bucketId: string): PopupBucketImp | undefined {
    return this.geometryBucketStore.find((v) => v.bucketId === bucketId);
  }

  createBucket(): PopupBucketImp {
    return new PopupBucket(
      this.viewer?.mapProviderDelegate.map,
      this.featureCache,
    );
  }

  removeBucket(bucketId: string): void {
    const bucket = this.getBucket(bucketId);
    if (bucket) {
      bucket.destroy();
      this.geometryBucketStore = this.geometryBucketStore.filter(
        (v) => v.bucketId !== bucketId,
      );
    }
  }

  add(layerId: string, feature: Feature): void {
    if (feature && layerId) {
      const bucket = this._getGeometryBucketFromBucketStore();
      bucket.add(layerId, feature);
    }
  }

  _getGeometryBucketFromBucketStore(): PopupBucketImp {
    // 从后向前遍历数组
    for (let i = this.geometryBucketStore.length - 1; i >= 0; i--) {
      if (
        this.geometryBucketStore[i].bucketGeometryLength <
        this.maxBucketGeometryLength
      ) {
        return this.geometryBucketStore[i];
      }
    }
    const bucket = new PopupBucket(
      this.viewer?.mapProviderDelegate.map as Cesium.Viewer,
      this.featureCache,
    );
    bucket.init();
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

  update(): void {
    this.geometryBucketStore?.forEach((v) => {
      v.update();
    });
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

  updatePopupProperties(id: string, popUpProperties: any): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const bucket = this._getGeometryBucket(featureCache.bucketId);
      if (bucket) {
        const { feature } = featureCache;
        feature.properties.appearance.popUpProperties = {
          ...feature.properties.appearance.popUpProperties,
          ...popUpProperties,
        };
        bucket.updateUpdatePopupProperties(feature);
      }
    }
  }

  isDestroyed() {
    return false;
  }

  destroy() {
    this.geometryBucketStore.forEach((bucket) => bucket.destroy());
    Cesium.destroyObject(this);
  }
}
