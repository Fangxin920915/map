import * as Cesium from "cesium";
import {
  AppearanceType,
  Feature,
  GeometryType,
  MultiPolygonCoordinates,
  PolygonCoordinates,
} from "@gdu-gl/common";

import { GeometryInstanceCacheImp } from "../../Types/IGeometryImp";
import GeometryParamsTransform from "./GeometryParamsTransform";

/**
 * 几何实例缓存对象
 * 用于解析geojson类型数据
 * 生成对应geometryInstance实例
 */
export default class GeometryInstanceCache implements GeometryInstanceCacheImp {
  instanceCache: Map<string, any>;

  geometryConstructorMap: Map<GeometryType, any>;

  appearanceVertexFormatMap: Map<AppearanceType, any>;

  constructor() {
    /**
     * 几何实例缓存map
     * 通过id获取同一组id下的多个几何实例
     */
    this.instanceCache = new Map<string, any>();
    /**
     * 几何实例构造器
     * 通过几何类型，注册几何实例构造函数
     */
    this.geometryConstructorMap = new Map<GeometryType, any>([
      ["Polygon", this._createPolygonGeometryInstances],
      ["MultiPolygon", this._createMultiPolygonGeometryInstances],
      ["GroundPolygon", this._createPolygonGeometryInstances],
      ["GroundMultiPolygon", this._createMultiPolygonGeometryInstances],
      ["GroundLineString", this._createGroundLineStringGeometryInstances],
      ["GroundMultiLineString", this._createGroundLineStringGeometryInstances],
      ["LineString", this._createLineStringGeometryInstances],
      ["MultiLineString", this._createLineStringGeometryInstances],
      ["Wall", this._createWallGeometryInstances],
    ]);
    this.appearanceVertexFormatMap = new Map<AppearanceType, any>([
      ["MaterialAppearance", Cesium.VertexFormat.ALL],
      [
        "PerInstanceColorAppearance",
        Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
      ],
      ["PolylineMaterialAppearance", Cesium.VertexFormat.ALL],
    ]);
  }

  _createWallGeometryInstances(feature: Feature): Cesium.GeometryInstance[] {
    const positions = GeometryParamsTransform.createWallGeometry(feature);
    const { properties } = feature;
    return [
      new Cesium.GeometryInstance({
        geometry: Cesium.WallGeometry.fromConstantHeights({
          positions: positions ?? [],
          minimumHeight: properties.appearance.wallProperties?.minHeight,
          maximumHeight: properties.appearance.wallProperties?.maxHeight,
        }),
        id: Cesium.createGuid(),
        attributes: {
          show: new Cesium.ShowGeometryInstanceAttribute(
            properties.appearance.attributeProperties.show,
          ),
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            Cesium.Color.fromCssColorString(
              properties.appearance.attributeProperties.color
                ? properties.appearance.attributeProperties.color
                : "rgba(255,255,255,1)",
            ),
          ),
          distanceDisplayCondition:
            new Cesium.DistanceDisplayConditionGeometryInstanceAttribute(
              properties.appearance.attributeProperties.near,
              properties.appearance.attributeProperties.far,
            ),
        },
      }),
    ];
  }

  _createGroundLineStringGeometryInstances(
    feature: Feature,
  ): Cesium.GeometryInstance[] {
    const positions = GeometryParamsTransform.createLineStringGeometry(feature);
    if (!positions) {
      return [];
    }
    const { properties } = feature;
    return positions.map((v) => {
      return new Cesium.GeometryInstance({
        geometry: new Cesium.GroundPolylineGeometry({
          positions: v,
          width: properties.appearance.lineStringProperties?.width,
          loop: properties.appearance.lineStringProperties?.loop,
        }),
        id: Cesium.createGuid(),
        attributes: {
          show: new Cesium.ShowGeometryInstanceAttribute(
            properties.appearance.attributeProperties.show,
          ),
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            Cesium.Color.fromCssColorString(
              properties.appearance.attributeProperties.color
                ? properties.appearance.attributeProperties.color
                : "rgba(255,255,255,1)",
            ),
          ),
          distanceDisplayCondition:
            new Cesium.DistanceDisplayConditionGeometryInstanceAttribute(
              properties.appearance.attributeProperties.near,
              properties.appearance.attributeProperties.far,
            ),
        },
      });
    });
  }

  _createMultiPolygonGeometryInstances(
    feature: Feature,
  ): Cesium.GeometryInstance[] {
    const { properties, geometry } = feature;
    const vertexFormat = this.appearanceVertexFormatMap.get(
      properties.appearance.appearanceType,
    );
    const instances: Cesium.GeometryInstance[] = [];
    const coordinates = geometry.coordinates as MultiPolygonCoordinates;

    coordinates.forEach((p: PolygonCoordinates) => {
      const polygonHierarchy = flattenPolygonHierarchy(p);
      instances.push(
        new Cesium.GeometryInstance({
          geometry: new Cesium.PolygonGeometry({
            polygonHierarchy,
            vertexFormat, // 此处后续待优化
          }),
          id: Cesium.createGuid(),
          attributes: {
            show: new Cesium.ShowGeometryInstanceAttribute(
              properties.appearance.attributeProperties.show,
            ),
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(
              Cesium.Color.fromCssColorString(
                properties.appearance.attributeProperties.color
                  ? properties.appearance.attributeProperties.color
                  : "rgba(255,255,255,1)",
              ),
            ),
            distanceDisplayCondition:
              new Cesium.DistanceDisplayConditionGeometryInstanceAttribute(
                properties.appearance.attributeProperties.near,
                properties.appearance.attributeProperties.far,
              ),
          },
        }),
      );
    });
    return instances;
  }

  _createLineStringGeometryInstances(
    feature: Feature,
  ): Cesium.GeometryInstance[] {
    const positions = GeometryParamsTransform.createLineStringGeometry(feature);
    if (!positions) {
      return [];
    }
    const { properties } = feature;
    return positions.map((v) => {
      const p = [...v];
      if (properties.appearance.lineStringProperties?.loop) {
        p.push(v[0]);
      }

      return new Cesium.GeometryInstance({
        geometry: new Cesium.PolylineGeometry({
          positions: p,
          width: properties.appearance.lineStringProperties?.width,
          vertexFormat: Cesium.PolylineMaterialAppearance.VERTEX_FORMAT,
        }),
        id: Cesium.createGuid(),
        attributes: {
          show: new Cesium.ShowGeometryInstanceAttribute(
            properties.appearance.attributeProperties.show,
          ),
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            Cesium.Color.fromCssColorString(
              properties.appearance.attributeProperties.color
                ? properties.appearance.attributeProperties.color
                : "rgba(255,255,255,1)",
            ),
          ),
          distanceDisplayCondition:
            new Cesium.DistanceDisplayConditionGeometryInstanceAttribute(
              properties.appearance.attributeProperties.near,
              properties.appearance.attributeProperties.far,
            ),
        },
      });
    });
  }

  /**
   * polygon类型几何实例构造函数，支持带孔多边形
   * @private
   * @param feature 要素
   * @returns Cesium.GeometryInstance
   */
  _createPolygonGeometryInstances(feature: Feature): Cesium.GeometryInstance[] {
    const { properties, geometry } = feature;
    const vertexFormat = this.appearanceVertexFormatMap.get(
      properties.appearance.appearanceType,
    );
    const polygonHierarchy = flattenPolygonHierarchy(geometry.coordinates);
    return [
      new Cesium.GeometryInstance({
        geometry: new Cesium.PolygonGeometry({
          perPositionHeight: false,
          extrudedHeight:
            properties.appearance.polygonProperties?.extrudedHeight,
          height: properties.appearance.polygonProperties?.height,
          polygonHierarchy,
          vertexFormat, // 此处后续待优化
        }),
        id: Cesium.createGuid(),
        attributes: {
          show: new Cesium.ShowGeometryInstanceAttribute(
            properties.appearance.attributeProperties.show,
          ),
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            Cesium.Color.fromCssColorString(
              properties.appearance.attributeProperties.color
                ? properties.appearance.attributeProperties.color
                : "rgba(255,255,255,1)",
            ),
          ),
          distanceDisplayCondition:
            new Cesium.DistanceDisplayConditionGeometryInstanceAttribute(
              properties.appearance.attributeProperties.near,
              properties.appearance.attributeProperties.far,
            ),
        },
      }),
    ];
  }

  /**
   * 存储生成的几何实例，通过要素id存储
   * @private
   * @param instances
   * @param feature
   */
  _storeGeometryInstance(
    instances: Array<Cesium.GeometryInstance>,
    feature: Feature,
  ) {
    this.instanceCache.set(feature.properties.id, instances);
  }

  /**
   * 通过id删除对应几何实例缓存
   * @param id
   */
  removeInstancesFromFeatureId(id: string) {
    this.instanceCache.delete(id);
  }

  /**
   * 通过要素id获取几何实例
   * @param id
   * @returns Array<Cesium.GeometryInstance>
   */
  getInstancesFromFeatureId(id: string): Array<Cesium.GeometryInstance> {
    return this.instanceCache.get(id);
  }

  /**
   * 添加要素生成几何实例
   * @param feature 要素
   * @returns Array<Cesium.GeometryInstance>
   */
  addInstancesFromFeature(
    feature: Feature,
  ): Array<Cesium.GeometryInstance> | undefined {
    const { geometry } = feature;

    const geometryFunc = this.geometryConstructorMap.get(geometry.type);

    if (geometryFunc) {
      const instances = geometryFunc.bind(this)(feature);

      this._storeGeometryInstance(instances, feature);
      return instances;
    }
    return undefined;
  }
}
/**
 * 递归生成带孔的polygon数据对象
 * 支持多孔
 * @param coordinates 坐标
 * @returns Cesium.PolygonHierarchy
 */
function flattenPolygonHierarchy(coordinates: any) {
  function recursiveFlatten(node: any): any {
    const positions = node[0].map(
      (v: [number, number, (number | undefined)?]) =>
        Cesium.Cartesian3.fromDegrees(...(v as [number, number, number?])),
    );
    const holes = [];
    if (node.length === 1) {
      return new Cesium.PolygonHierarchy(positions);
    }
    for (let index = 1; index < node.length; index++) {
      holes.push(recursiveFlatten(node[index]));
    }

    return new Cesium.PolygonHierarchy(positions, holes);
  }
  return recursiveFlatten(coordinates);
}
