import * as Cesium from "cesium";
import { findLastIndex, merge } from "lodash-es";
import { Feature, GeometryType, PrimitiveProperties } from "@gdu-gl/common";

import {
  PrimitiveGeometryBucketImp,
  CombineGeometryQueueItem,
  DynamicBatchItem,
  DynamicGeometryItem,
  DynamicGeometryQueue,
  GeometryStore,
  PrimitiveGeometryCollectionImp,
} from "../../Types/IGeometryImp";
import FeatureCache from "./FeatureCache";
import GeometryParamsTransform from "./GeometryParamsTransform";

export default class GeometryBucket implements PrimitiveGeometryBucketImp {
  material!: Cesium.Material;

  appearance!: Cesium.Appearance;

  materialId!: string;

  featureCache!: FeatureCache;

  bucketId: string;

  bucketGeometryLength: number;

  dynamicGeometryBatch: DynamicBatchItem[];

  dynamicGeometryQueue: DynamicGeometryQueue;

  dirtyCombineFeatureIds: string[];

  geometryStore: GeometryStore;

  combineGeometryQueue: CombineGeometryQueueItem[];

  dirtyCombine: boolean;

  maxFrameCount: number;

  removeBatch: Array<string>;

  geometryType!: GeometryType;

  attributePropertiesBatch: Feature[];

  mergeGeometryBatch: { geometry: DynamicGeometryItem[]; id: string }[];

  geometryCollection: PrimitiveGeometryCollectionImp;

  constructor(options: {
    material: Cesium.Material;
    appearance: Cesium.Appearance;
    materialId: string;
    featureCache: FeatureCache;
    geometryType: GeometryType;
    geometryCollection: PrimitiveGeometryCollectionImp;
  }) {
    this.geometryCollection = options.geometryCollection;
    this.bucketId = Cesium.createGuid();
    this.bucketGeometryLength = 0;
    this.dynamicGeometryBatch = [];
    this.dynamicGeometryQueue = {};
    this.dirtyCombineFeatureIds = [];
    this.attributePropertiesBatch = [];
    this.geometryStore = {};
    this.combineGeometryQueue = [];
    this.removeBatch = [];
    this.mergeGeometryBatch = [];
    this.dirtyCombine = false;
    this.maxFrameCount = 10000;

    if (!Cesium.defined(options)) {
      return;
    }
    this.geometryType = options.geometryType;
    this.material = options.material
      ? options.material
      : Cesium.Material.fromType("Color");
    this.appearance = options.appearance
      ? options.appearance
      : new Cesium.Appearance();
    this.materialId = options.materialId
      ? options.materialId
      : Cesium.createGuid();

    this.featureCache = options.featureCache;
  }

  add(layerId: string, feature: Feature): void {
    const instances =
      this.geometryCollection.geometryInstanceCache.addInstancesFromFeature(
        feature,
      );
    if (!instances) {
      return;
    }
    const index = this.dynamicGeometryBatch.findIndex(
      (v) => v.id === feature.properties.id,
    );
    if (index > -1) {
      this.dynamicGeometryBatch[index] = {
        feature,
        id: feature.properties.id,
        instances,
        layerId,
      };
    } else {
      this.dynamicGeometryBatch.push({
        feature,
        id: feature.properties.id,
        instances,
        layerId,
      });
    }
    this.featureCache.addFeatureToCache(feature.properties.id, {
      layerId,
      featureId: feature.properties.id,
      primitiveId: "",
      bucketId: this.bucketId,
      materialId: this.materialId,
      geometryType: this.geometryType,
      feature,
      instancesIds: [],
    });
  }

  private _staticsBucketGeometryLength() {
    const keys = Object.keys(this.geometryStore);
    this.bucketGeometryLength = keys.length;
  }

  remove(id: string): void {
    if (id) {
      const index = this.dynamicGeometryBatch.findIndex((v) => v.id === id);
      // 删除时查看新增队列中是否存在 存在则删除 新增队列中的这一项
      if (index > -1) {
        this.dynamicGeometryBatch.splice(index, 1);
      }
      this.removeBatch.push(id);
      this.featureCache.removeFeatureToCache(id);
    }
  }

  private _updateRemoveBatch() {
    this.removeBatch.forEach((id) => {
      if (this.dynamicGeometryQueue[id]) {
        const geometry = this.dynamicGeometryQueue[id];
        geometry.forEach((v) => {
          if (v.primitive && !v.primitive.isDestroyed()) {
            v.primitive.destroy();
          }
        });
        delete this.dynamicGeometryQueue[id];
      }
      if (this.geometryStore[id]) {
        this.geometryStore[id].dynamic.length = 0;
        this.geometryStore[id].combine.length = 0;
        delete this.geometryStore[id];
      }
      // 触发禁止合并信号
      this.dirtyCombineFeatureIds.push(id);
    });
    this.removeBatch.length = 0;
  }

  update(frameState: any): void {
    this._clearDirty();
    this._updateRemoveBatch();
    this._updateAttributePropertiesBatch();
    this._updateDynamicGeometryBatch();
    this._staticsBucketGeometryLength();
    this._updateDynamicQueue(frameState);
    this._updateCombineQueue(frameState);
  }

  private _clearDirty() {
    this.dirtyCombineFeatureIds = [];
    this.dirtyCombine = false;
  }

  updateFeatureGeometry(feature: Feature) {
    const featureCache = this.featureCache.getFeatureCache(
      feature.properties.id,
    );
    if (featureCache) {
      const { layerId } = featureCache;
      this.add(layerId, feature);
    }
  }

  _updateAttributePropertiesBatch() {
    const updateItem = (
      primitive:
        | Cesium.Primitive
        | Cesium.GroundPrimitive
        | Cesium.GroundPolylinePrimitive,
      feature: Feature,
    ) => {
      const featureCache = this.featureCache.getFeatureCache(
        feature.properties.id,
      );
      if (!featureCache) return;
      if (this.geometryCollection.geometryInstanceCache) {
        const instances =
          this.geometryCollection.geometryInstanceCache.getInstancesFromFeatureId(
            feature.properties.id,
          ) as Cesium.GeometryInstance[];
        // 此时需要判断primitive是否已经销毁，
        // 更新队列优先更新属性，当属性更新完毕后再更新几何对象
        // 而此时的geometryStore的值还未更新

        if (primitive.isDestroyed()) {
          return;
        }

        featureCache.instancesIds.forEach((id) => {
          const attributes = primitive.getGeometryInstanceAttributes(id);
          const instance = instances.find((v) => v.id === id);
          const { attributeProperties } = feature.properties.appearance;

          if (attributes) {
            if (attributeProperties.color) {
              attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(
                Cesium.Color.fromCssColorString(attributeProperties.color),
              );
              if (instance) {
                const color = Cesium.Color.fromCssColorString(
                  attributeProperties.color,
                );
                instance.attributes.color =
                  new Cesium.ColorGeometryInstanceAttribute(
                    color.red,
                    color.green,
                    color.blue,
                    color.alpha,
                  );
              }
            }

            if (attributeProperties.show !== undefined) {
              attributes.show = Cesium.ShowGeometryInstanceAttribute.toValue(
                attributeProperties.show,
              );
              if (instance) {
                instance.attributes.show =
                  new Cesium.ShowGeometryInstanceAttribute(
                    attributeProperties.show,
                  );
              }
            }
            if (
              attributeProperties.near !== undefined &&
              attributeProperties.far !== undefined
            ) {
              attributes.distanceDisplayCondition =
                Cesium.DistanceDisplayConditionGeometryInstanceAttribute.toValue(
                  new Cesium.DistanceDisplayCondition(
                    attributeProperties.near,
                    attributeProperties.far,
                  ),
                );
              if (instance) {
                instance.attributes.distanceDisplayCondition =
                  new Cesium.DistanceDisplayConditionGeometryInstanceAttribute(
                    attributeProperties.near,
                    attributeProperties.far,
                  );
              }
            }
          }
        });
      }
    };
    const keepAttributeBatch: number[] = [];
    this.attributePropertiesBatch.forEach((feature, index) => {
      if (this.dynamicGeometryQueue[feature.properties.id]) {
        this.dynamicGeometryQueue[feature.properties.id].forEach((v) => {
          if (this._checkPrimitiveReadyStatus(v.primitive)) {
            updateItem(v.primitive, feature);
          }
        });
      }
      const geometry = this.geometryStore[feature.properties.id];
      if (geometry) {
        geometry.dynamic.forEach((item) => {
          if (this._checkPrimitiveReadyStatus(item.primitive)) {
            updateItem(item.primitive, feature);
          } else {
            keepAttributeBatch.push(index);
          }
        });
        if (geometry.combine && geometry.combine.length > 0) {
          const combinePrimitiveId =
            geometry.combine[geometry.combine.length - 1].primitiveId;
          const combineItem = this.combineGeometryQueue.find(
            (v) => v.primitiveId === combinePrimitiveId,
          );

          if (combineItem) {
            if (this._checkPrimitiveReadyStatus(combineItem.primitive)) {
              updateItem(combineItem.primitive, feature);
            } else {
              keepAttributeBatch.push(index);
            }
          }
        }
      }
    });
    const uniqueArr = [...new Set(keepAttributeBatch)];
    if (keepAttributeBatch.length === 0) {
      this.attributePropertiesBatch.length = 0;
    } else {
      this.attributePropertiesBatch = uniqueArr.map(
        (v) => this.attributePropertiesBatch[v],
      );
    }
  }

  updateAttributeProperties(feature: Feature) {
    const index = this.attributePropertiesBatch.findIndex(
      (v) => v.properties.id === feature.properties.id,
    );
    if (index > -1) {
      this.attributePropertiesBatch[index] = feature;
    } else {
      this.attributePropertiesBatch.push(feature);
    }
    // 直接同步更新，避免后续更新时几何已经迁出导致显隐更新不及时
    this._updateAttributePropertiesBatch();
  }

  distributeGeometry(feature: Feature): DynamicGeometryItem[] {
    // 此处需要注意，在派发几何对象时需要注意此时的新增要素batch中是否存在还未更新的要素数据，如果存在则需要将其更新完毕后从batch中删除
    const index = this.dynamicGeometryBatch.findIndex(
      (v) => v.id === feature.properties.id,
    );
    if (index > -1) {
      this._updateDynamicGeometryItem(this.dynamicGeometryBatch[index]);
      this.dynamicGeometryBatch.splice(index, 1);
    }
    const dynamic = [];
    const geometry = this.geometryStore[feature.properties.id];
    if (!geometry) {
      return [];
    }
    geometry.dynamic.forEach((v: DynamicGeometryItem) => {
      v.frameCount = 0;
    });
    dynamic.push(...geometry.dynamic);

    if (this.dynamicGeometryQueue[feature.properties.id]) {
      dynamic.length = 0;
      dynamic.push(...this.dynamicGeometryQueue[feature.properties.id]);
    }
    // 此处直接delete掉对应key，避免进入删除批次时primitive被删除
    delete this.dynamicGeometryQueue[feature.properties.id];
    delete this.geometryStore[feature.properties.id];
    const removeIndex = this.dynamicGeometryBatch.findIndex(
      (v) => v.id === feature.properties.id,
    );
    // 删除时查看新增队列中是否存在 存在则删除 新增队列中的这一项
    if (removeIndex > -1) {
      this.dynamicGeometryBatch.splice(removeIndex, 1);
    }
    this._staticsBucketGeometryLength();
    // 移出后需要检查是否需要重新合并
    this.dirtyCombineFeatureIds.push(feature.properties.id);
    // 处理合并队列，判断是否需要更新合并队列
    this._dispatchStopCombineSignal();
    return dynamic;
  }

  mergeGeometry(feature: Feature, geometry: DynamicGeometryItem[]) {
    geometry.forEach((geometryItem) => {
      geometryItem.primitive.appearance = this.appearance;
      if (this.dynamicGeometryQueue[geometryItem.id]) {
        this.dynamicGeometryQueue[geometryItem.id].push(geometryItem);
      } else {
        this.dynamicGeometryQueue[geometryItem.id] = [geometryItem];
      }
      this.featureCache.addFeatureToCache(geometryItem.id, {
        featureId: geometryItem.id,
        primitiveId: geometryItem.primitiveId,
        bucketId: this.bucketId,
        materialId: this.materialId,
        geometryType: this.geometryType,
        feature,
        instancesIds: geometryItem.instances.map((v) => v.id),
        layerId: geometryItem.layerId,
      });
      this._updateGeometryStoreByDynamic(geometryItem);
      // 移出后需要检查是否需要重新合并
      this.dirtyCombineFeatureIds.push(feature.properties.id);
      this.dirtyCombine = true;
      this._staticsBucketGeometryLength();
    });
  }

  updateAppearance(feature: Feature) {
    // 仅限一个几何体的时候进行材质修改
    if (this.bucketGeometryLength === 1) {
      this.appearance = GeometryParamsTransform.createAppearance(
        feature.properties.appearance.appearanceType,
        this.material,
        feature.properties.appearance.appearanceProperties,
      );
    }
  }

  updateAppearanceProperties(feature: Feature) {
    // 仅限一个几何体的时候进行材质修改
    if (this.bucketGeometryLength === 1) {
      merge(
        this.appearance,
        feature.properties.appearance.appearanceProperties,
      );
    }
  }

  updateMaterialProperties(feature: Feature) {
    if (this.material.type === feature.properties.appearance.materialType) {
      const { materialProperties } = feature.properties.appearance;
      const properties =
        GeometryParamsTransform.transformParma(materialProperties);
      this.material.uniforms = {
        ...this.material.uniforms,
        ...properties,
      };
    } else {
      this.material = GeometryParamsTransform.createMaterial(
        feature.properties.appearance.materialType,
        feature.properties.appearance.materialProperties,
      );
      this.appearance.material = this.material;
    }
  }

  updateGroundLineStringProperties(feature: Feature): void {
    console.log(feature);
  }

  // private _updatePrimitiveMaterialProperties(
  //   primitive: Cesium.Primitive,
  //   feature: Feature,
  // ) {
  //   const { materialProperties } = feature.properties.appearance;
  //   if (primitive && primitive.appearance.material) {
  //     const properties =
  //       GeometryParamsTransform.transformParma(materialProperties);
  //     primitive.appearance.material.uniforms = {
  //       ...primitive.appearance.material.uniforms,
  //       ...properties,
  //     };
  //   }
  // }

  private _updateCombineQueue(frameState: any) {
    // @ts-ignore
    const queue = this.combineGeometryQueue as CombineQueueItem[];
    if (queue.length === 0) return;
    // @ts-ignore
    const updatePrimitives = (item: CombineQueueItem) => {
      item.featureIds.forEach((id: string) => {
        const primitive = this.fromGeometryStoreGetPrimitive(id);
        if (primitive && !primitive.isDestroyed()) {
          // @ts-ignore
          primitive.update(frameState);
        }
      });
      // item.primitive.update(frameState);
    };

    // 队列清理逻辑
    const trimQueue = (keepCount: number) => {
      if (queue.length <= keepCount) return;
      queue.splice(0, queue.length - keepCount);
    };

    if (queue.length > 1) {
      // 只保留最新项
      trimQueue(1);
    }
    const currentItem = queue[0];
    currentItem.primitive.update(frameState);
    // 未完成时回退独立渲染
    // 此处需注意primitive对象的ready状态是异步更新的
    // 贴地类型的primitive内部还有一个primitive对象该对象的ready状态也是异步的
    // @ts-ignore
    if (!this._checkPrimitiveReadyStatus(currentItem.primitive)) {
      updatePrimitives(currentItem);
    }
  }

  fromGeometryStoreGetPrimitive(featureId: string) {
    if (!this.geometryStore[featureId]) {
      return undefined;
    }
    // geometryStore内每一个id对应的是数组
    // 合并后的项目，一定在合并前的后面生成，取第一个即可
    const geometry = this.geometryStore[featureId].dynamic.sort((a, b) => {
      return a.timestamp - b.timestamp;
    });
    return geometry[0].primitive;
  }

  private _updateDynamicQueue(frameState: any) {
    let combineFlag = false;
    Object.keys(this.dynamicGeometryQueue).forEach((key) => {
      const geometryQueue = this.dynamicGeometryQueue[key];
      if (geometryQueue.length > 1) {
        // 按timestamp进行排序
        // 取最后判断是否更新完成，
        // 最后没有更新完成，则取已更新完成的和最后，其他项删除，无已更新完成的则只取最后，其他删除
        const sortGeometryQueue = geometryQueue.sort((a, b) => {
          return a.timestamp - b.timestamp;
        });
        const storeIndex: number[] = [];
        if (
          !this._checkPrimitiveReadyStatus(
            sortGeometryQueue[sortGeometryQueue.length - 1].primitive,
          )
        ) {
          storeIndex.push(sortGeometryQueue.length - 1);
        } else {
          const lastReadyIndex = findLastIndex(
            sortGeometryQueue,
            (v: DynamicGeometryItem) =>
              this._checkPrimitiveReadyStatus(v.primitive),
          );
          storeIndex.push(lastReadyIndex, sortGeometryQueue.length - 1);
        }
        const arr: Array<DynamicGeometryItem> = [];
        sortGeometryQueue.forEach((v, i) => {
          if (!storeIndex.includes(i) && !v.primitive.isDestroyed()) {
            v.primitive.destroy();
          } else if (!v.primitive.isDestroyed()) {
            // @ts-ignore
            v.primitive.update(frameState);
            arr.push(v);
          }
        });

        // 更新dynamicGeometryQueue当前id的内容
        this.dynamicGeometryQueue[key] = arr;
        const lastPrimitiveReady = this._checkPrimitiveReadyStatus(
          sortGeometryQueue[storeIndex[storeIndex.length - 1] as number]
            .primitive,
        );
        // 在geometryStore中查找是否存在的项目来代替当前渲染
        if (!lastPrimitiveReady && this.geometryStore[key]) {
          const dynamicItem = this.geometryStore[key].dynamic[0];
          if (dynamicItem?.primitive.isDestroyed()) {
            return;
          }
          // @ts-ignore
          dynamicItem?.primitive.update(frameState);
        }
      } else if (geometryQueue[0].frameCount < this.maxFrameCount) {
        geometryQueue[0].frameCount++;
        if (geometryQueue[0].primitive.isDestroyed()) {
          return;
        }
        // @ts-ignore
        geometryQueue[0].primitive.update(frameState);
        const lastPrimitiveReady = this._checkPrimitiveReadyStatus(
          geometryQueue[0].primitive,
        );
        // 在geometryStore中查找是否存在的项目来代替当前渲染
        if (!lastPrimitiveReady && this.geometryStore[key]) {
          const dynamicItem = this.geometryStore[key].dynamic[0];
          if (dynamicItem?.primitive.isDestroyed()) {
            return;
          }
          // @ts-ignore
          dynamicItem?.primitive.update(frameState);
        }
      } else {
        combineFlag = true;
        this._updateGeometryStoreByDynamic(this.dynamicGeometryQueue[key][0]);
        delete this.dynamicGeometryQueue[key];
      }
    });
    if (combineFlag) {
      this._dispatchCombineSignal(true);
    }
  }

  _createPrimitive(
    instances: Cesium.GeometryInstance[],
    appearance: Cesium.Appearance,
    primitiveProperties?: PrimitiveProperties,
  ):
    | Cesium.Primitive
    | Cesium.GroundPrimitive
    | Cesium.GroundPolylinePrimitive {
    if (
      this.geometryType === "GroundLineString" ||
      this.geometryType === "GroundMultiLineString"
    ) {
      return GeometryParamsTransform.createGroundLineStringPrimitive(
        instances,
        appearance,
        primitiveProperties,
      );
    }
    if (
      this.geometryType === "LineString" ||
      this.geometryType === "MultiLineString"
    ) {
      return GeometryParamsTransform.createLineStringPrimitive(
        instances,
        appearance,
        primitiveProperties,
      );
    }
    if (
      this.geometryType === "GroundPolygon" ||
      this.geometryType === "GroundMultiPolygon"
    ) {
      return GeometryParamsTransform.createGroundPrimitive(
        instances,
        appearance,
        primitiveProperties,
      );
    }
    // if (this.geometryType === "Wall") {
    //   console.log(primitiveProperties);
    // }
    return GeometryParamsTransform.createPrimitive(
      instances,
      appearance,
      primitiveProperties,
    );
  }

  private _updateDynamicGeometryItem(item: DynamicBatchItem) {
    const primitive = this._createPrimitive(
      item.instances,
      this.appearance,
      item.feature.properties.appearance.primitiveProperties,
    );
    const geometryItem: DynamicGeometryItem = {
      layerId: item.layerId,
      instances: item.instances,
      primitive,
      id: item.id,
      frameCount: 0,
      primitiveId: Cesium.createGuid(),
      timestamp: new Date().getTime(),
      feature: item.feature,
    };
    if (this.dynamicGeometryQueue[geometryItem.id]) {
      this.dynamicGeometryQueue[geometryItem.id].push(geometryItem);
    } else {
      this.dynamicGeometryQueue[geometryItem.id] = [geometryItem];
    }
    this.featureCache.addFeatureToCache(geometryItem.id, {
      layerId: geometryItem.layerId,
      featureId: geometryItem.id,
      primitiveId: geometryItem.primitiveId,
      bucketId: this.bucketId,
      materialId: this.materialId,
      geometryType: this.geometryType,
      feature: item.feature,
      instancesIds: item.instances.map((v) => v.id),
    });
    this.dirtyCombineFeatureIds.push(geometryItem.id);
    this._updateGeometryStoreByDynamic(geometryItem);
  }

  private _updateDynamicGeometryBatch() {
    this.dynamicGeometryBatch.forEach((item: DynamicBatchItem) => {
      this._updateDynamicGeometryItem(item);
    });
    this._dispatchStopCombineSignal();
    this.dynamicGeometryBatch.length = 0;
  }

  private _updateGeometryStoreByDynamic(geometryItem: DynamicGeometryItem) {
    // 判断当前id下是否存在几何对象，有则更新几何对象，
    // 每个几何id数组下存储两种类型item
    // 对于dynamic类型，最多保留两个
    // 只保留以下两种情况
    // 1.当前geometry已经ready，则新增只留最新一项ready的
    // 2.当前没有ready，则只留当前这一项
    if (this.geometryStore[geometryItem.id]) {
      // const sortGeometryQueue = this.geometryStore[
      //   geometryItem.id
      // ].dynamic.sort((a, b) => {
      //   return a.timestamp - b.timestamp;
      // });
      // // const lastReadyIndex = findLastIndex(
      // //   sortGeometryQueue,
      // //   (v: DynamicGeometryItem) => {
      // //     // 检查 primitive 是否准备就绪，返回布尔值
      // //     return this._checkPrimitiveReadyStatus(v.primitive);
      // //   },
      // // );
      // let lastReadyIndex = -1;
      // for (let i = sortGeometryQueue.length - 1; i >= 0; i--) {
      //   if (this._checkPrimitiveReadyStatus(sortGeometryQueue[i].primitive)) {
      //     lastReadyIndex = i;
      //     break;
      //   }
      // }
      //
      // if (lastReadyIndex > -1) {
      //   this.geometryStore[geometryItem.id].dynamic = [
      //     sortGeometryQueue[lastReadyIndex],
      //     geometryItem,
      //   ];
      // } else {
      //   this.geometryStore[geometryItem.id].dynamic = [geometryItem];
      // }
      this.geometryStore[geometryItem.id].dynamic = [geometryItem];
    } else {
      this.geometryStore[geometryItem.id] = {
        dynamic: [geometryItem],
        combine: [],
      };
    }
  }

  private _dispatchStopCombineSignal() {
    // 查看当前combineQueue中的最后一项ids中是否包括dirtyCombineIds
    // combineQueue最大两条
    if (this.combineGeometryQueue.length === 0) return;
    const lastCombineItem =
      this.combineGeometryQueue[this.combineGeometryQueue.length - 1];
    this.dirtyCombine = this._haveCommonValues(
      this.dirtyCombineFeatureIds,
      lastCombineItem.featureIds,
    );
    // 从geometryStore中去查找，更新这部分geometry的combine类型的primitive，删除掉
    if (this.dirtyCombine) {
      let flag = false;
      lastCombineItem.featureIds.forEach((v) => {
        const geometry = this.geometryStore[v];
        if (geometry) {
          this.geometryStore[v].combine.length = 0;
          this.featureCache.updateFeatureCombinePrimitiveId(v, undefined);
          if (!flag) {
            flag = this.dirtyCombineFeatureIds.includes(v);
          }
        } else {
          flag = true;
        }
      });
      // 合并队列删除最后一项,combine队列在一次eventLoop后最大2个
      this.combineGeometryQueue.pop();
      // 重新生产合并队列，解决已经dynamic中更新完成，但是由于合并队列被删除的其他几何对象
      if (flag) {
        this._dispatchCombineSignal(true);
      }
    }
  }

  private _dispatchCombineSignal(asynchronous: boolean) {
    // 从geometryStore中去查找
    const instances: Cesium.GeometryInstance[] = [];
    const ids: string[] = [];
    const primitiveId = Cesium.createGuid();
    const timestamp = new Date().getTime();
    Object.keys(this.geometryStore).forEach((key) => {
      const geometry = this.geometryStore[key].dynamic.sort((a, b) => {
        return a.timestamp - b.timestamp;
      });
      const lastItem = geometry[geometry.length - 1];
      if (!lastItem) {
        return;
      }
      // 从数组中取最后一项只要超过maxCount则代表该instances是属于要合并项目
      if (
        lastItem.frameCount >= this.maxFrameCount &&
        !this.dirtyCombineFeatureIds.includes(lastItem.id)
      ) {
        // 更新dynamic队列
        this.geometryStore[key].dynamic = [lastItem];
        this.geometryStore[key].combine = [
          {
            primitiveId,
            timestamp,
          },
        ];
        ids.push(key);
        instances.push(...lastItem.instances);
        this.featureCache.updateFeatureCombinePrimitiveId(key, primitiveId);
      }
    });
    if (instances.length === 0) return;
    const primitive = this._createPrimitive(instances, this.appearance, {
      asynchronous,
    });

    this.combineGeometryQueue.push({
      primitive,
      primitiveId,
      featureIds: ids,
      timestamp,
    });
  }

  private _haveCommonValues(arr1: Array<any>, arr2: Array<any>): boolean {
    const set1 = new Set(arr1);
    return arr2.some((item) => {
      const num = Number(item);
      const value = Number.isNaN(num) ? item : num; // 统一类型处理逻辑‌:ml-citation{ref="1,2" data="citationList"}
      return set1.has(value);
    });
  }

  _checkPrimitiveReadyStatus(
    primitive:
      | Cesium.Primitive
      | Cesium.GroundPrimitive
      | Cesium.GroundPolylinePrimitive,
  ): boolean {
    return (
      // @ts-ignore
      (primitive._state &&
        // @ts-ignore
        primitive._state === Cesium.PrimitiveState.COMPLETE) ||
      // @ts-ignore
      (Cesium.defined(primitive._primitive) &&
        // @ts-ignore
        primitive._primitive._state ===
          // @ts-ignore
          Cesium.PrimitiveState.COMPLETE) ||
      // @ts-ignore
      (Cesium.defined(primitive._primitive) &&
        // @ts-ignore
        Cesium.defined(primitive._primitive._primitive) &&
        // @ts-ignore
        primitive._primitive._primitive._state ===
          // @ts-ignore
          Cesium.PrimitiveState.COMPLETE)
    );
  }

  isDestroyed() {
    return false;
  }

  updateUpdatePopupProperties(feature: Feature): void {
    throw new Error(`Method not implemented. ${feature.geometry.type}`);
  }

  updateLineStringProperties(feature: Feature): void {
    throw new Error(`Method not implemented. ${feature.geometry.type}`);
  }

  updateSymbolProperties(feature: Feature): void {
    throw new Error(`Method not implemented. ${feature.geometry.type}`);
  }

  clear() {
    this.dynamicGeometryBatch.length = 0;
    this.dynamicGeometryQueue = {};
    this.dirtyCombineFeatureIds.length = 0;
    this.attributePropertiesBatch.length = 0;
    this.geometryStore = {};
    this.combineGeometryQueue.length = 0;
    this.removeBatch.length = 0;
    this.mergeGeometryBatch.length = 0;
  }

  destroy() {
    Object.keys(this.dynamicGeometryQueue).forEach((key) => {
      const geometryQueue = this.dynamicGeometryQueue[key];
      geometryQueue.forEach((v) => {
        if (v.primitive && !v.primitive.isDestroyed()) {
          v.primitive.destroy();
        }
      });
      delete this.dynamicGeometryQueue[key];
    });
    Object.keys(this.geometryStore).forEach((key) => {
      const geometry = this.geometryStore[key];
      geometry.dynamic.forEach((v) => {
        if (v.primitive && !v.primitive.isDestroyed()) {
          v.primitive.destroy();
        }
      });
      delete this.geometryStore[key];
    });

    for (let index = 0; index < this.combineGeometryQueue.length; index++) {
      const geometry = this.combineGeometryQueue[index];
      if (geometry.primitive && !geometry.primitive.isDestroyed()) {
        geometry.primitive.destroy();
      }
    }

    this.clear();
    Cesium.destroyObject(this);
  }
}
