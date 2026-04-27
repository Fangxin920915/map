import {
  Feature,
  FeatureCacheImp,
  IGeometryManagerImp,
  PopupPosition,
  BaseBucketImp,
  BaseGeometryCollectionImp,
} from "@gdu-gl/common";

import * as Cesium from "cesium";
/**
 * 几何管理器
 */
export interface CesiumGeometryManagerImp extends IGeometryManagerImp {}

/**
 * 弹出层几何桶
 */
export interface PopupBucketImp extends BaseBucketImp {
  update(): void;
}
/**
 * 弹出层几何集合
 */
export type CesiumPopCollectionImp = Omit<
  BaseGeometryCollectionImp<
    PopupBucketImp,
    CesiumGeometryManagerImp,
    CesiumFeatureImp
  >,
  | "geometryBucketStore"
  | "geometryManager"
  | "updateSymbolProperties"
  | "updateMaterialProperties"
  | "updateAppearanceProperties"
  | "updateLineStringProperties"
  | "updateGroundLineStringProperties"
> & {
  geometryBucketStore: Array<PopupBucketImp>;
};

/**
 * 几何集合
 * 支持自动对几何进行合批渲染
 */
export interface CesiumGeometryCollectionImp
  extends BaseGeometryCollectionImp<
    PrimitiveGeometryBucketImp,
    CesiumGeometryManagerImp,
    CesiumFeatureImp
  > {
  scene?: Cesium.Scene;
}
/**
 * 点几何集合
 */
export interface CesiumPointCollectionImp
  extends Omit<
    BaseGeometryCollectionImp<
      PointBucketImp,
      CesiumGeometryManagerImp,
      CesiumFeatureImp
    >,
    | "updateMaterialProperties"
    | "updateAppearanceProperties"
    | "updateLineStringProperties"
    | "updatePopupProperties"
    | "updateGroundLineStringProperties"
  > {
  scene?: Cesium.Scene;
}
export type PrimitiveGeometryCollectionImp = Omit<
  CesiumGeometryCollectionImp,
  "geometryBucketStore"
> & {
  geometryBucketStore: Map<string, Array<PrimitiveGeometryBucketImp>>;
  geometryInstanceCache: GeometryInstanceCacheImp;
};

/**
 * 几何桶
 * 将同一个材质，同材质参数的几何对象在同一个bucket进行渲染
 * 执行合并渲染
 */

export type PrimitiveGeometryBucketImp = BaseBucketImp & {
  /**
   * 动态几何队列
   */
  dynamicGeometryQueue: DynamicGeometryQueue;
  /**
   * 动态几何项批次处理
   */
  dynamicGeometryBatch: DynamicBatchItem[];

  /**
   * 材质id
   */
  materialId: string;
  /**
   * 材质对象
   */
  material: Cesium.Material;

  /**
   * 外观对象
   */
  appearance?:
    | Cesium.Appearance
    | Cesium.MaterialAppearance
    | Cesium.EllipsoidSurfaceAppearance
    | Cesium.PerInstanceColorAppearance;

  /**
   * 合并污染标记，用于判断是否需要将合并后的primitive进行打散
   */
  dirtyCombine: boolean;

  /**
   * 帧更新函数
   * @param frameState
   */
  update(frameState: any): void;
  /**
   * 处理动态几何项
   */
  distributeGeometry(feature: Feature): DynamicGeometryItem[];
  /**
   * 合并几何项
   * @param feature
   * @param geometry
   */
  mergeGeometry(feature: Feature, geometry: DynamicGeometryItem[]): void;
  updateAppearance(feature: Feature): void;
};

/**
 * 线类型接口
 */
export interface LineStringBucketImp extends BaseBucketImp {}
export interface PointBucketImp extends BaseBucketImp {
  /**
   * 修改点位材质属性
   * @param feature
   */
  updatePointSymbolProperties(feature: Feature): void;
  /**
   * 修改文字材质属性
   * @param feature
   */
  updateTextSymbolProperties(feature: Feature): void;
}
export interface PopupOptions {
  anchor: PopupPosition;
  offset: [number, number];
  position: Cesium.Cartesian3;
  domId: string;
  show?: boolean;
  zIndex?: number;
  contentDom?: HTMLElement;
  clampToGround?: boolean;
}

export interface PopupImp {
  offset: [number, number];
  anchor: PopupPosition;
  clampToGround: boolean;
  id: string;
  zIndex: number;
  position: Cesium.Cartesian3;
  show: boolean;
  updateDomPosition: () => void;
  update: () => void;
  destroy: () => void;
}

export interface PopupGroupImp {
  geometryType: "Popup";
  bucketId: string;
  length: number;
  popupGroup: Map<string, PopupImp>;
  add: (popup: PopupOptions) => void;
  remove: (id: string) => void;
  updatePosition: (id: string, position: Cesium.Cartesian3) => void;
  get: (id: string) => PopupImp | undefined;
  has: (id: string) => boolean;
  getPopupCount: () => number;
  update: (frameState?: any) => void;
  destroy: () => void;
}

/**
 * 要素缓存
 */
export interface CesiumFeatureImp extends FeatureCacheImp {
  /**
   * 更新要素的合并图元ID
   * @param featureId 要素ID
   * @param primitiveId 新的图元ID
   */
  updateFeatureCombinePrimitiveId(
    featureId: string,
    primitiveId?: string,
  ): void;
}
/**
 * 几何实例缓存对象
 */
export interface GeometryInstanceCacheImp {
  /**
   * 几何实例缓存
   */
  instanceCache: any;

  /**
   * 通过id获取几何实例
   * @param id id
   * @returns Array<Cesium.GeometryInstance> 几何实例集合
   */
  getInstancesFromFeatureId(
    id: string,
  ): Array<Cesium.GeometryInstance> | undefined;

  /**
   * 通过要素id删除对应几何实例
   * @param id id
   */
  removeInstancesFromFeatureId(id: string): void;

  /**
   * 新增几何实例
   * @param feature 要素
   * @returns Array<Cesium.GeometryInstance> 几何实例集合
   */
  addInstancesFromFeature(
    feature: Feature,
  ): Array<Cesium.GeometryInstance> | undefined;
}

export type DynamicGeometryItem = {
  layerId: string;
  instances: Array<Cesium.GeometryInstance>;
  feature: Feature;
  id: string;
  frameCount: number;
  primitiveId: string;
  timestamp: number;
  primitive:
    | Cesium.Primitive
    | Cesium.GroundPrimitive
    | Cesium.GroundPolylinePrimitive;
};
export type DynamicBatchItem = {
  instances: Array<Cesium.GeometryInstance>;
  feature: Feature;
  id: string;
  layerId: string;
};

export type GeometryStoreItem = {
  dynamic: Array<DynamicGeometryItem>;
  combine: Array<{
    primitiveId: string;
    timestamp: number;
  }>;
};

export type GeometryStore = {
  [id: string]: GeometryStoreItem;
};
export type DynamicGeometryQueue = {
  [id: string]: Array<DynamicGeometryItem>;
};
export type CombineGeometryQueueItem = {
  primitive:
    | Cesium.Primitive
    | Cesium.GroundPrimitive
    | Cesium.GroundPolylinePrimitive;
  primitiveId: string;
  featureIds: Array<string>;
  timestamp: number;
};
