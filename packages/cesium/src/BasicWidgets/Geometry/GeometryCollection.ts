import {
  AppearanceProperties,
  AppearanceType,
  AttributeProperties,
  Coordinates,
  Feature,
  GeometryType,
  LineStringProperties,
  MaterialType,
  PopupProperties,
  SymbolProperties,
  WallProperties,
  PrimitiveProperties,
} from "@gdu-gl/common";
import * as Cesium from "cesium";
import { cloneDeep, merge } from "lodash-es";
import {
  PrimitiveGeometryBucketImp,
  DynamicGeometryItem,
  PrimitiveGeometryCollectionImp,
  CesiumGeometryManagerImp,
} from "../../Types/IGeometryImp";
import GeometryInstanceCache from "./GeometryInstanceCache";
import GeometryParamsTransform from "./GeometryParamsTransform";

import FeatureCache from "./FeatureCache";
import GeometryBucket from "./GeometryBucket";

export default class GeometryCollection
  implements PrimitiveGeometryCollectionImp
{
  maxBucketGeometryLength: number;

  geometryBucketStore: Map<string, Array<PrimitiveGeometryBucketImp>>;

  geometryInstanceCache: GeometryInstanceCache;

  featureCache: FeatureCache;

  geometryType: GeometryType;

  scene?: Cesium.Scene | undefined;

  geometryManager: CesiumGeometryManagerImp;

  constructor(options: {
    maxBucketGeometryLength: number;
    featureCache: FeatureCache;
    geometryType: GeometryType;
    geometryManager: CesiumGeometryManagerImp;
  }) {
    this.geometryManager = options.geometryManager;
    this.geometryType = options.geometryType;
    this.maxBucketGeometryLength =
      options && options.maxBucketGeometryLength
        ? options.maxBucketGeometryLength
        : 1000;
    this.geometryBucketStore = new Map();
    this.geometryInstanceCache = new GeometryInstanceCache();
    this.featureCache = options.featureCache;
  }

  get length() {
    let len = 0;
    this.geometryBucketStore.forEach((v) => {
      len += v.reduce((total, b) => total + b.bucketGeometryLength, 0);
    });
    return len;
  }

  updatePopupProperties(id: string, popupProperties: PopupProperties): void {
    console.log(id, popupProperties);
  }

  updateSymbolProperties(id: string, symbolProperties: SymbolProperties): void {
    console.log(id, symbolProperties);
  }

  updatePrimitiveProperties(
    id: string,
    primitiveProperties: PrimitiveProperties,
  ) {
    // 切换primitive属性
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const { materialId, bucketId } = featureCache;
      const buckets = this.geometryBucketStore.get(materialId);
      if (buckets && featureCache) {
        const bucket = buckets.find((v) => v.bucketId === bucketId);
        const { feature } = featureCache;
        merge(
          feature.properties.appearance.primitiveProperties,
          primitiveProperties,
        );
        if (bucket) {
          // 修改
          bucket.updateFeatureGeometry(feature);
        }
      }
    }
  }

  updateLineStringProperties(
    id: string,
    lineStringProperties: LineStringProperties,
  ): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const { materialId, bucketId } = featureCache;

      const buckets = this.geometryBucketStore.get(materialId);
      if (buckets && featureCache) {
        const bucket = buckets.find((v) => v.bucketId === bucketId);
        const { feature } = featureCache;
        merge(
          feature.properties.appearance.lineStringProperties,
          lineStringProperties,
        );
        if (bucket) {
          // 修改贴地线时，线宽写入在geometryinstance内
          bucket.updateFeatureGeometry(feature);
        }
      }
    }
  }

  /**
   * 修改贴地线属性
   * @param id id
   * @param wallProperties 线属性
   */
  updateWallProperties(id: string, wallProperties?: WallProperties) {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const { materialId, bucketId } = featureCache;

      const buckets = this.geometryBucketStore.get(materialId);
      if (buckets && featureCache) {
        const bucket = buckets.find((v) => v.bucketId === bucketId);
        const { feature } = featureCache;
        merge(feature.properties.appearance.wallProperties, wallProperties);
        if (bucket) {
          // 修改贴地线时，线宽写入在geometryinstance内
          bucket.updateFeatureGeometry(feature);
        }
      }
    }
  }

  getBucket(bucketId: string): PrimitiveGeometryBucketImp | undefined {
    const buckets = this.geometryBucketStore.get(bucketId);
    if (buckets) {
      return buckets[0];
    }
    return undefined;
  }

  createBucket(): PrimitiveGeometryBucketImp {
    throw new Error("Method not implemented.");
  }

  removeBucket(bucketId: string): void {
    const buckets = this.geometryBucketStore.get(bucketId);
    if (buckets) {
      buckets.forEach((bucket) => bucket.destroy());
      this.geometryBucketStore.delete(bucketId);
    }
  }
  /**
   * 添加要素
   * @param layerId 图层id
   * @param feature 要素
   */

  add(layerId: string, feature: Feature): void {
    const bucket = this._getGeometryBucketFromBucketStore(feature);
    bucket.add(layerId, feature);
  }

  /**
   * 删除要素
   * @param featureId 要素id
   * @returns
   */
  remove(featureId: string): void {
    // 从featureCollection获取对应bucket信息
    // 调用对应bucket删除要素
    // 删除几何缓存
    const featureCache = this.featureCache.getFeatureCache(featureId);
    if (!featureCache) return;
    const buckets = this.geometryBucketStore.get(featureCache?.materialId);
    if (buckets) {
      const bucket = buckets.find((v) => v.bucketId === featureCache?.bucketId);
      bucket?.remove(featureId);
      if (bucket?.bucketGeometryLength === 0) {
        buckets.splice(buckets.indexOf(bucket), 1);
        if (buckets.length === 0) {
          this.geometryBucketStore.delete(featureCache.materialId);
        }
      }
      this.geometryInstanceCache.removeInstancesFromFeatureId(featureId);
    }
  }

  /**
   * 帧更新函数
   * @param frameState
   */
  update(frameState: any): void {
    this.geometryBucketStore.forEach((buckets) => {
      buckets.forEach((bucket) => bucket.update(frameState));
    });
  }

  /**
   * 修改几何坐标
   * @param id id
   * @param coordinate 坐标
   * @param asynchronous 同步异步标记
   */
  updateFeatureGeometry(
    id: string,
    coordinate: Coordinates,
    asynchronous: boolean = true,
  ): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const { materialId, bucketId } = featureCache;
      const buckets = this.geometryBucketStore.get(materialId);
      if (buckets && featureCache) {
        const bucket = buckets.find((v) => v.bucketId === bucketId);
        const { feature } = featureCache;
        feature.geometry.coordinates = cloneDeep(coordinate);
        if (feature.properties.appearance.primitiveProperties) {
          feature.properties.appearance.primitiveProperties.asynchronous =
            asynchronous;
        }
        if (bucket) {
          bucket.updateFeatureGeometry(feature);
        }
      }
    }
  }

  /**
   * 修改几何顶点属性
   * @param id id
   * @param attributeProperties 顶点属性
   */
  updateAttributeProperties(
    id: string,
    attributeProperties: AttributeProperties,
  ): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const { materialId, bucketId } = featureCache;
      const buckets = this.geometryBucketStore.get(materialId);
      if (buckets && featureCache) {
        const bucket = buckets.find((v) => v.bucketId === bucketId);
        const { feature } = featureCache;
        feature.properties.appearance.attributeProperties =
          cloneDeep(attributeProperties);
        if (bucket) {
          bucket.updateAttributeProperties(feature);
        }
      }
    }
  }

  /**
   * 修改贴地线属性
   * @param id id
   * @param lineStringProperties 线属性
   */
  updateGroundLineStringProperties(
    id: string,
    lineStringProperties?: LineStringProperties,
  ) {
    if (!lineStringProperties) return;
    this.updateLineStringProperties(id, lineStringProperties);
    // const featureCache = this.featureCache.getFeatureCache(id);
    // if (featureCache) {
    //   const { materialId, bucketId } = featureCache;
    //
    //   const buckets = this.geometryBucketStore.get(materialId);
    //   if (buckets && featureCache) {
    //     const bucket = buckets.find((v) => v.bucketId === bucketId);
    //     const { feature } = featureCache;
    //     merge(
    //       feature.properties.appearance.lineStringProperties,
    //       lineStringProperties,
    //     );
    //     if (bucket) {
    //       // 修改贴地线时，线宽写入在geometryinstance内
    //       bucket.updateFeatureGeometry(feature);
    //     }
    //   }
    // }
  }

  /**
   * 修改材质属性
   * @param id id
   * @param materialProperties 材质属性
   * @param materialType 材质类型
   */
  updateMaterialProperties(
    id: string,
    materialProperties: any,
    materialType: MaterialType = "Color",
  ): void {
    const featureCache = this.featureCache.getFeatureCache(id);

    if (featureCache) {
      const { materialId, bucketId } = featureCache;
      const buckets = this.geometryBucketStore.get(materialId);
      if (buckets && featureCache) {
        const bucket = buckets.find((v) => v.bucketId === bucketId);
        const { feature } = featureCache;
        feature.properties.appearance.materialProperties =
          cloneDeep(materialProperties);
        feature.properties.appearance.materialType = materialType;
        if (bucket) {
          if (bucket.bucketGeometryLength === 1) {
            const material = GeometryParamsTransform.createMaterial(
              feature.properties.appearance.materialType,
              feature.properties.appearance.materialProperties,
            );
            const newMaterialId = GeometryParamsTransform.createMaterialId(
              material,
              feature.properties,
            );
            // 如果有并且当前的bucket只有一个几何体，则需要将当前的geometry 转移至其他bucket
            if (this.geometryBucketStore.has(newMaterialId)) {
              const geometry = bucket.distributeGeometry(feature);
              this._mergeBucket(feature, geometry);
              // 迁出后判断当前bucket是否还存在内容不存在则删除
              // @ts-ignore
              if (bucket.bucketGeometryLength === 0) {
                buckets.splice(buckets.indexOf(bucket), 1);
              }
            } else {
              // 当前bucket更新材质
              bucket.updateMaterialProperties(feature);
              // 更新材质id
              bucket.materialId = newMaterialId;
              featureCache.materialId = newMaterialId;
              // 插入到geometryBucketStore存储
              this.geometryBucketStore.set(newMaterialId, [bucket]);
              // 插入新到新的bucket后 需要将当前bucket 从原来的队列中移出
              buckets.splice(buckets.indexOf(bucket), 1);
              // 判断移出后的buckets的长度是否为0 为0则移除掉整个buckets
              if (buckets.length === 0) {
                this.geometryBucketStore.delete(materialId);
              }
            }
          } else {
            const geometry = bucket.distributeGeometry(feature);
            this._mergeBucket(feature, geometry);
            // 迁出后判断当前bucket是否还存在内容不存在则删除
            if (bucket.bucketGeometryLength === 0) {
              buckets.splice(buckets.indexOf(bucket), 1);
            }
          }
          // 检查原来的materialId是否还有其他的bucket，没有则删除
          const oldBuckets = this.geometryBucketStore.get(materialId);

          if (oldBuckets && oldBuckets.length === 0) {
            this.geometryBucketStore.delete(materialId);
          }
        }
      }
    }
  }

  /**
   * bucket merge
   * @private
   * @param feature 要素
   * @param geometry
   */
  _mergeBucket(feature: Feature, geometry: DynamicGeometryItem[]): void {
    const bucket = this._getGeometryBucketFromBucketStore(feature);
    bucket.mergeGeometry(feature, geometry);
  }

  /**
   * 修改外观
   * @param id id
   * @param appearanceProperties 外观属性
   * @param appearanceType
   */
  updateAppearance(
    id: string,
    appearanceProperties: AppearanceProperties,
    appearanceType: AppearanceType,
  ): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const { materialId, bucketId } = featureCache;
      const buckets = this.geometryBucketStore.get(materialId);
      if (buckets && featureCache) {
        const bucket = buckets.find((v) => v.bucketId === bucketId);
        const { feature } = featureCache;
        feature.properties.appearance.appearanceProperties =
          cloneDeep(appearanceProperties);
        feature.properties.appearance.appearanceType = appearanceType;
        if (bucket) {
          if (bucket.bucketGeometryLength === 1) {
            bucket.updateAppearance(feature);
          } else {
            const geometry = bucket.distributeGeometry(feature);
            this._mergeBucket(feature, geometry);
          }
        }
      }
    }
  }

  /**
   * 修改外观函数
   * @param id
   * @param appearanceProperties
   */
  updateAppearanceProperties(
    id: string,
    appearanceProperties: AppearanceProperties,
  ): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const { materialId, bucketId } = featureCache;
      const buckets = this.geometryBucketStore.get(materialId);
      if (buckets && featureCache) {
        const bucket = buckets.find((v) => v.bucketId === bucketId);
        const { feature } = featureCache;
        feature.properties.appearance.appearanceProperties =
          cloneDeep(appearanceProperties);
        if (bucket) {
          if (bucket.bucketGeometryLength === 1) {
            bucket.updateAppearanceProperties(feature);
          } else {
            const geometry = bucket.distributeGeometry(feature);
            this._mergeBucket(feature, geometry);
          }
        }
      }
    }
  }

  /**
   * 创建bucket
   * @private
   * @param material
   * @param materialId
   * @param appearance
   * @param geometryType
   * @returns
   */
  _createBucket(
    material: Cesium.Material,
    materialId: string,
    appearance: Cesium.Appearance,
    geometryType: GeometryType,
  ) {
    const bucket = new GeometryBucket({
      material,
      materialId,
      appearance,
      featureCache: this.featureCache,
      geometryType,
      geometryCollection: this,
    });

    const buckets = this.geometryBucketStore.get(materialId);
    if (buckets) {
      buckets.push(bucket);
    } else {
      this.geometryBucketStore.set(materialId, [bucket]);
    }
    return bucket;
  }

  /**
   * 从bucketStore通过materialId获取到对应bucket
   * @private
   * @param feature 要素
   * @returns
   */
  _getGeometryBucketFromBucketStore(feature: Feature) {
    const { properties } = feature;

    // 创建材质和材质ID
    const material = GeometryParamsTransform.createMaterial(
      properties.appearance.materialType,
      properties.appearance.materialProperties,
    );
    const materialId = GeometryParamsTransform.createMaterialId(
      material,
      properties,
    );

    // 获取与材质ID相关的桶列表
    const buckets = this.geometryBucketStore.get(materialId);

    // 检查是否有可用的桶
    if (buckets) {
      const lastBucket = buckets[buckets.length - 1];
      if (
        lastBucket &&
        lastBucket.bucketGeometryLength < this.maxBucketGeometryLength
      ) {
        return lastBucket; // 返回未满的桶
      }
    }
    // 如果没有可用的桶，创建一个新的桶
    const appearance = GeometryParamsTransform.createAppearance(
      properties.appearance.appearanceType,
      material,
      properties.appearance.appearanceProperties,
    );
    return this._createBucket(
      material,
      materialId,
      appearance,
      feature.geometry.type,
    );
  }

  isDestroyed() {
    return false;
  }

  destroy() {
    this.geometryBucketStore.forEach((buckets) => {
      buckets.forEach((bucket) => bucket.destroy());
    });
    Cesium.destroyObject(this);
  }
}
