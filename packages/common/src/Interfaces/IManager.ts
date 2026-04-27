import { IBase } from "./IBase";
import { FeatureCacheImp, ModelCacheImp } from "./ICache";
import { FeatureCollection, GeometryType } from "./IGeojson";
import { ModelFeatureCollection, ModelType } from "./IModel";
import { ModelLayerImp } from "./IModelLayer";
import { IVectorLayerImp } from "./IVectorLayer";

/**
 * 通用管理器接口
 * @typeParam T - 要素类型（用于过滤）
 * @typeParam L - 图层类型
 * @typeParam C - 要素集合类型
 * @typeParam F - 要素缓存类型
 */
export interface GenericManager<T, L, C, F> extends IBase {
  layerCollection: L[];
  /**
   * 要素缓存（可选）
   */
  readonly featureCache?: F;
  /**
   * 添加图层
   * @param layerId 图层唯一标识
   * @param collection  要素集合
   * @returns 添加结果（包含成功状态和可能的错误信息）
   */
  addLayer(layerId: string, collection: C): boolean;

  /**
   * 删除指定图层
   * @param layerId 图层唯一标识
   * @returns 删除结果
   */
  removeLayer(layerId: string): void;

  /**
   * 获取指定图层
   * @param layerId 图层唯一标识
   * @returns 图层实例或undefined
   */
  getLayer(layerId: string): L | undefined;

  /**
   * 根据类型过滤集合
   * @param type 几何类型或模型类型
   * @returns 过滤后的集合（强类型）
   */
  getCollection(type: T): any;

  /**
   *  删除所有图层
   */
  removeAll(): void;

  /**
   * 销毁管理器并释放资源
   */
  destroy(): void;
}

/** 几何要素管理器接口 */
export interface IGeometryManagerImp
  extends GenericManager<
    GeometryType,
    IVectorLayerImp,
    FeatureCollection,
    FeatureCacheImp
  > {}

/** 模型要素管理器接口 */
export interface IModelManagerImp
  extends GenericManager<
    ModelType,
    ModelLayerImp,
    ModelFeatureCollection,
    ModelCacheImp
  > {}
