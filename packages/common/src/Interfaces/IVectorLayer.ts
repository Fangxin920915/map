import {
  Coordinates,
  Feature,
  FeatureCollection,
  GeometryProperties,
} from "./IGeojson";

/**
 * 图层类
 */
export interface IVectorLayerImp {
  /**
   * 图层id
   */
  layerId: string;
  /**
   * 要素
   */
  feature: FeatureCollection | Feature;
  /**
   * 几何管理器
   */

  // manager:GeometryManager

  /**
   * 添加要素
   * @param feature 要素
   */
  addFeature(feature: Feature): void;

  /**
   * 删除要素
   * @param featureId 要素id
   */
  removeFeature(featureId: string): void;

  /**
   * 更新要素属性
   * @param featureProperties
   */
  updateFeatureProperties(
    featureProperties: GeometryProperties & Record<string, any>,
  ): void;

  /**
   * 更新要素坐标
   * @param featureId 要素id
   * @param coordinate 坐标
   * @param asynchronous 是否异步修改
   */
  updateFeatureGeometry(
    featureId: string,
    coordinate: Coordinates,
    asynchronous?: boolean,
  ): void;

  /**
   * 删除全部
   */
  removeAll(): void;

  /**
   * 卸载
   */
  destroy(): void;
}
