import { FeatureCacheImp } from "./ICache";
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
} from "./IGeojson";
import { IGeometryManagerImp } from "./IManager";

/**
 * 几何集合基础接口 - 提取公共部分
 */
export interface BaseGeometryCollectionImp<
  T extends BaseBucketImp,
  G extends IGeometryManagerImp,
  F extends FeatureCacheImp,
> {
  /**
   * 每个geometryBucket最大几何体个数
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

  /**
   * 添加要素
   * @param layerId 图层id
   * @param feature 要素
   *
   */
  add(layerId: string, feature: Feature): void;
  /**
   * 通过id删除对应几何体
   * @param id id
   */
  remove(id: string): void;
  /**
   * 修改几何坐标
   * @param id id
   * @param coordinate 坐标
   */
  updateFeatureGeometry(id: string, coordinate: Coordinates): void;
  /**
   * 修改几何顶点属性
   * @param id id
   * @param attributeProperties 顶点属性
   */
  updateAttributeProperties(
    id: string,
    attributeProperties: AttributeProperties,
  ): void;
  /**
   * 修改弹出框属性
   * @param id id
   * @param popupProperties 弹出框属性
   */
  updatePopupProperties(id: string, popupProperties: PopupProperties): void;

  /**
   * 修改符号属性
   * @param id id
   * @param symbolProperties 符号属性
   */
  updateSymbolProperties(id: string, symbolProperties: SymbolProperties): void;

  /**
   * 修改材质属性
   * @param id id
   * @param materialProperties 材质属性
   * @param materialType 材质类型
   */
  updateMaterialProperties(
    id: string,
    materialProperties: any,
    materialType: MaterialType,
  ): void;

  /**
   * 修改外观属性
   * @param id id
   * @param appearanceProperties 外观属性
   * @param appearanceType
   */
  updateAppearanceProperties(
    id: string,
    appearanceProperties: AppearanceProperties,
    appearanceType: AppearanceType,
  ): void;

  /**
   * 修改线属性
   * @param id id
   * @param linestringProperties 线属性
   */
  updateLineStringProperties(
    id: string,
    linestringProperties: LineStringProperties,
  ): void;
  /**
   * 修改贴底线属性
   * @param id id
   * @param linestringProperties 线属性
   */
  updateGroundLineStringProperties(
    id: string,
    linestringProperties: LineStringProperties,
  ): void;
  /**
   * 获取块
   */
  getBucket(bucketId: string): T | undefined;
  /**
   * 创建块
   */
  createBucket(): T;
  /**
   * 删除块
   */
  removeBucket(bucketId: string): void;
}

/**
 * 几何桶基础接口 - 提取公共部分
 */
export interface BaseBucketImp {
  /**
   * 几何类型
   */
  geometryType: GeometryType;
  /**
   * 块id
   */
  bucketId: string;
  /**
   * 当前块内有多少个要素
   */
  bucketGeometryLength: number;

  /**
   * 添加要素
   * @param layerId 图层id
   * @param feature 要素
   */
  add(layerId: string, feature: Feature): void;
  /**
   * 通过id删除对应几何体
   * @param id id
   */
  remove(id: string): void;
  /**
   * 更新要素坐标
   * @param feature 要素
   * @returns
   *
   */
  updateFeatureGeometry(feature: Feature): void;
  /**
   * 修改几何顶点属性
   * @param feature
   */
  updateAttributeProperties(feature: Feature): void;
  /**
   * 修改材质属性
   * @param feature
   */
  updateMaterialProperties(feature: Feature): void;
  /**
   * 修改材质属性
   * @param feature
   */
  updateUpdatePopupProperties(feature: Feature): void;
  /**
   * 修改材质属性
   * @param feature
   */
  updateLineStringProperties(feature: Feature): void;
  /**
   * 修改材质属性
   * @param feature
   */
  updateSymbolProperties(feature: Feature): void;
  /**
   * 修改材质属性
   * @param feature
   */
  updateAppearanceProperties(feature: Feature): void;
  /**
   * 修改贴底线属性
   * @param feature
   */
  updateGroundLineStringProperties(feature: Feature): void;
  /**
   * 销毁
   */
  destroy(): void;
}
