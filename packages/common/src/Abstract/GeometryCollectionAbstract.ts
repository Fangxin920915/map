// 抽象类
import { cloneDeep } from "lodash-es";
import {
  AppearanceProperties,
  AppearanceType,
  Feature,
  GeometryType,
  LineStringProperties,
  MaterialType,
  PopupProperties,
  SymbolProperties,
  Coordinates,
  AttributeProperties,
  IGeometryManagerImp,
  FeatureCacheImp,
  BaseBucketImp,
  BaseGeometryCollectionImp,
} from "../Interfaces";

/**
 * 几何集合抽象类
 * @template T 桶类型
 * @template G 几何管理器类型
 * @property {number} maxBucketGeometryLength 最大桶几何长度
 * @property {GeometryType} geometryType 几何类型
 * @property {T[]} geometryBucketStore 几何桶存储
 * @property {FeatureCache} featureCache 要素缓存
 * @property {G} geometryManager 几何管理器
 * @method createBucket 创建桶
 * @method getBucket 获取桶
 * @method removeBucket 移除桶
 * @method add 添加要素
 * @method remove 移除要素
 * @method updateFeatureGeometry 更新要素几何
 * @method updateAttributeProperties 更新要素属性
 * @method updateMaterialProperties 更新要素材质属性
 * @method updateAppearanceProperties 更新要素外观属性
 * @method updateSymbolProperties 更新要素符号属性
 * @method updateLineStringProperties 更新要素线属性
 * @method updatePopupProperties 更新要素弹窗属性
 * @method destroy 销毁
 *
 */
export abstract class GeometryCollectionAbstract<
  T extends BaseBucketImp,
  G extends IGeometryManagerImp,
  F extends FeatureCacheImp,
> implements
    BaseGeometryCollectionImp<
      BaseBucketImp,
      IGeometryManagerImp,
      FeatureCacheImp
    >
{
  /**
   * 最大桶几何长度
   */
  maxBucketGeometryLength: number;

  /**
   * 几何类型
   */
  geometryType: GeometryType;

  /**
   * 几何桶存储
   */
  geometryBucketStore: T[];

  /**
   * 要素缓存
   */
  featureCache: F;

  /**
   * 几何管理器
   */
  geometryManager: G;

  constructor(options: {
    geometryType: GeometryType;
    featureCache: F;
    maxBucketGeometryLength?: number;
    geometryManager: G;
  }) {
    this.maxBucketGeometryLength = options.maxBucketGeometryLength ?? 10000;
    this.geometryType = options.geometryType;
    this.featureCache = options.featureCache;
    this.geometryManager = options.geometryManager;
    this.geometryBucketStore = [];
  }

  abstract getBucket(bucketId: string): BaseBucketImp | undefined;

  removeBucket(bucketId: string): void {
    const bucket = this._getGeometryBucket(bucketId);
    if (bucket) {
      const index = this.geometryBucketStore.findIndex(
        (b) => b.bucketId === bucket.bucketId,
      );
      if (index > -1) {
        const buckets = this.geometryBucketStore.splice(index, 1);
        if (buckets.length > 1) {
          buckets[0].destroy();
        }
        // this.geometryManager.updateLayers();
      }
    }
  }

  add(layerId: string, feature: Feature): void {
    if (feature && layerId) {
      const bucket = this._getGeometryBucketFromBucketStore();
      bucket.add(layerId, feature);
    }
  }

  private _getGeometryBucketFromBucketStore() {
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

  remove(featureId: string): void {
    const featureCache = this.featureCache.getFeatureCache(featureId);
    if (!featureCache) return;
    const bucket = this._getGeometryBucket(featureCache.bucketId);
    if (bucket) {
      bucket.remove(featureId);
    }
  }

  private _getGeometryBucket(bucketId: string): BaseBucketImp | undefined {
    return this.geometryBucketStore.find((v) => v.bucketId === bucketId);
  }

  updateFeatureGeometry(featureId: string, coordinate: Coordinates): void {
    const featureCache = this.featureCache.getFeatureCache(featureId);
    if (!featureCache) return;
    const bucket = this._getGeometryBucket(featureCache.bucketId);
    if (bucket) {
      featureCache.feature.geometry.coordinates = cloneDeep(coordinate);
      bucket.updateFeatureGeometry(featureCache.feature);
    }
  }

  updateAttributeProperties(
    featureId: string,
    attributeProperties: AttributeProperties,
  ): void {
    this.updateFeatureAppearance(
      featureId,
      "attributeProperties",
      attributeProperties,
    );
  }

  updateMaterialProperties(
    featureId: string,
    materialProperties: any,
    materialType: MaterialType,
  ): void {
    const featureCache = this.featureCache.getFeatureCache(featureId);
    if (!featureCache) return;
    const bucket = this._getGeometryBucket(featureCache.bucketId);
    if (bucket) {
      featureCache.feature.properties.appearance.materialProperties = {
        ...featureCache.feature.properties.appearance.materialProperties,
        ...materialProperties,
      };
      featureCache.feature.properties.appearance.materialType = materialType;
      bucket.updateMaterialProperties(featureCache.feature);
    }
  }

  updateAppearanceProperties(
    id: string,
    appearanceProperties: AppearanceProperties,
    appearanceType: AppearanceType,
  ): void {
    throw new Error(
      `Method not implemented.${JSON.stringify(appearanceProperties)}${id}${appearanceType}`,
    );
  }

  private updateFeatureAppearance(
    featureId: string,
    appearanceKey: string,
    appearanceValue: any,
  ): void {
    const featureCache = this.featureCache.getFeatureCache(featureId);
    if (!featureCache) return;
    const bucket = this._getGeometryBucket(featureCache.bucketId);
    if (bucket) {
      // @ts-ignore
      featureCache.feature.properties.appearance[appearanceKey] = {
        // @ts-ignore
        ...featureCache.feature.properties.appearance[appearanceKey],
        ...appearanceValue,
      };

      const methodName = `update${appearanceKey.charAt(0).toUpperCase() + appearanceKey.slice(1)}`;
      (bucket as any)[methodName](featureCache.feature);
    }
  }

  updateSymbolProperties(
    featureId: string,
    symbolProperties: SymbolProperties,
  ): void {
    this.updateFeatureAppearance(
      featureId,
      "symbolProperties",
      symbolProperties,
    );
  }

  updateLineStringProperties(
    featureId: string,
    lineStringProperties: LineStringProperties,
  ): void {
    this.updateFeatureAppearance(
      featureId,
      "lineStringProperties",
      lineStringProperties,
    );
  }

  updateGroundLineStringProperties(
    featureId: string,
    lineStringProperties: LineStringProperties,
  ): void {
    this.updateFeatureAppearance(
      featureId,
      "lineStringProperties",
      lineStringProperties,
    );
  }

  updatePopupProperties(
    featureId: string,
    popUpProperties: PopupProperties,
  ): void {
    this.updateFeatureAppearance(featureId, "popUpProperties", popUpProperties);
  }

  // 抽象方法，由子类实现
  abstract createBucket(): T;

  destroy(): void {
    this.geometryBucketStore.forEach((bucket) => {
      bucket.destroy();
    });
    this.geometryBucketStore = [];
  }
}
