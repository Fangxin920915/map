import { cloneDeep } from "lodash-es";
import {
  IGeometryManagerImp,
  GeometryProperties,
  IVectorLayerImp,
  FeatureCollection,
  Feature,
  Coordinates,
} from "../Interfaces";

/**
 * 矢量图层抽象类，封装通用属性与方法框架
 * 子类需实现具体的几何属性比较方法
 */
export abstract class VectorLayerAbstract implements IVectorLayerImp {
  // 公共属性：图层ID与要素集合
  layerId: string;

  feature: FeatureCollection;

  // 受保护的管理器，供子类访问
  protected manager: IGeometryManagerImp;

  /**
   * 构造函数：初始化图层基础信息
   * @param options 初始化参数（图层ID、要素集合、几何管理器）
   */
  constructor(options: {
    layerId: string;
    feature: FeatureCollection;
    manager: IGeometryManagerImp;
  }) {
    this.layerId = options.layerId;
    this.feature = options.feature;
    this.manager = options.manager;
    this.init();
  }

  /**
   * 初始化方法：批量添加初始要素
   */
  protected init(): void {
    this.feature.features.forEach((feature: Feature) => {
      this.addFeature(feature);
    });
  }

  /**
   * 添加要素到图层
   * @param feature 待添加的要素
   */
  addFeature(feature: Feature): void {
    if (this.isDestroyed()) {
      return;
    }

    // 通过管理器获取对应几何类型的集合并添加要素
    const geometryCollection = this.manager.getCollection(
      feature.geometry.type,
    );
    geometryCollection?.add(this.layerId, feature);

    // 避免重复添加（通过properties.id判断）
    const inCache = this.feature.features.some(
      (f: Feature) => f.properties.id === feature.properties.id,
    );
    if (!inCache) {
      this.feature.features.push(feature);
    }
  }

  /**
   * 移除指定ID的要素
   * @param featureId 要素ID
   */
  removeFeature(featureId: string): void {
    if (!this.manager.featureCache) return;

    // 从管理器缓存中获取要素并移除
    const featureCache = this.manager.featureCache.getFeatureCache(featureId);

    if (featureCache) {
      const geometryCollection = this.manager.getCollection(
        featureCache.feature.geometry.type,
      );
      geometryCollection?.remove(featureCache.featureId);

      // 从本地要素集合中移除
      const featureIdx = this.feature.features.findIndex(
        (v) => v.properties.id === featureId,
      );
      if (featureIdx !== -1) {
        this.feature.features.splice(featureIdx, 1);
      }
    }
  }

  /**
   * 更新要素属性（抽象方法框架，子类需实现具体比较逻辑）
   * @param featureProperties 新的要素属性
   */
  updateFeatureProperties(
    featureProperties: GeometryProperties & Record<string, any>,
  ): void {
    if (!this.manager || !this.manager.featureCache) return;
    const { id } = featureProperties;
    const featureCache = this.manager.featureCache.getFeatureCache(id);
    if (featureCache) {
      // 根据要素几何类型调用对应的属性比较方法
      const { geometryType } = featureCache;
      switch (geometryType) {
        case "Polygon":
        case "MultiPolygon":
        case "GroundPolygon":
        case "GroundMultiPolygon":
          this.comparePolygonProperties(
            featureCache.feature.properties,
            featureProperties,
            this.manager.getCollection(featureCache.feature.geometry.type),
          );
          break;
        case "LineString":
        case "MultiLineString":
          this.compareLineStringProperties(
            featureCache.feature.properties,
            featureProperties,
            this.manager.getCollection(featureCache.feature.geometry.type),
          );
          break;
        case "Point":
        case "MultiPoint":
        case "GroundPoint":
        case "GroundMultiPoint":
          this.compareSymbolProperties(
            featureCache.feature.properties,
            featureProperties,
            this.manager.getCollection(featureCache.feature.geometry.type),
          );
          break;
        case "GroundLineString":
        case "GroundMultiLineString":
          this.compareGroundLineStringProperties(
            featureCache.feature.properties,
            featureProperties,
            this.manager.getCollection(featureCache.feature.geometry.type),
          );
          break;
        case "Wall":
          this.compareWallLineStringProperties(
            featureCache.feature.properties,
            featureProperties,
            this.manager.getCollection(featureCache.feature.geometry.type),
          );
          break;
        case "Popup":
          this.comparePopupProperties(
            featureCache.feature.properties,
            featureProperties,
            this.manager.getCollection(featureCache.feature.geometry.type),
          );
          break;
        default:
          break;
      }

      // 更新非外观属性
      Object.keys(featureProperties ?? {}).forEach((key) => {
        if (!["id", "appearance"].includes(key)) {
          featureCache.feature.properties[key] = featureProperties[key];
        }
      });
    }
  }

  /**
   * 更新要素几何坐标
   * @param featureId 要素ID
   * @param coordinate 新坐标
   * @param asynchronous 是否异步更新（默认true）
   */
  updateFeatureGeometry(
    featureId: string,
    coordinate: Coordinates,
    asynchronous: boolean = true,
  ): void {
    if (!this.manager.featureCache) return;
    const featureCache = this.manager.featureCache.getFeatureCache(featureId);

    if (featureCache) {
      const geometryCollection = this.manager.getCollection(
        featureCache.feature.geometry.type,
      );
      geometryCollection?.updateFeatureGeometry(
        featureCache.featureId,
        coordinate,
        asynchronous,
      );
    }
  }

  /**
   * 移除图层所有要素
   */
  removeAll(): void {
    const copyFeature = cloneDeep(this.feature);
    copyFeature.features.forEach((feature) => {
      this.removeFeature(feature.properties.id);
    });
  }

  /**
   * 检查图层是否已销毁（默认返回false，子类可重写）
   * @returns 是否销毁
   */
  isDestroyed(): boolean {
    return false;
  }

  /**
   * 销毁图层（默认调用removeAll，子类可扩展）
   */
  destroy(): void {
    this.removeAll();
  }

  // 以下为抽象方法，由子类实现具体的属性比较逻辑

  /**
   * 比较并更新弹窗要素属性
   */
  protected abstract comparePopupProperties(
    currentProperties: GeometryProperties & Record<string, any>,
    newProperties: GeometryProperties & Record<string, any>,
    geometryCollection: any,
  ): void;

  /**
   * 比较并更新墙要素属性
   */
  protected abstract compareWallLineStringProperties(
    currentProperties: GeometryProperties & Record<string, any>,
    newProperties: GeometryProperties & Record<string, any>,
    geometryCollection: any,
  ): void;
  /**
   * 比较并更新面要素属性
   */
  protected abstract comparePolygonProperties(
    currentProperties: GeometryProperties & Record<string, any>,
    newProperties: GeometryProperties & Record<string, any>,
    geometryCollection: any,
  ): void;

  /**
   * 比较并更新线要素属性
   */
  protected abstract compareLineStringProperties(
    currentProperties: GeometryProperties & Record<string, any>,
    newProperties: GeometryProperties & Record<string, any>,
    geometryCollection: any,
  ): void;

  /**
   * 比较并更新地面线要素属性
   */
  protected abstract compareGroundLineStringProperties(
    currentProperties: GeometryProperties & Record<string, any>,
    newProperties: GeometryProperties & Record<string, any>,
    geometryCollection: any,
  ): void;

  /**
   * 比较并更新点/符号要素属性
   */
  protected abstract compareSymbolProperties(
    currentProperties: GeometryProperties & Record<string, any>,
    newProperties: GeometryProperties & Record<string, any>,
    geometryCollection: any,
  ): void;
}
