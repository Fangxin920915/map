import {
  FeatureCollection,
  GeometryType,
  GeometryManagerAbstract,
  IViewerDelegateImp,
  IEventDelegateImp,
  EventName,
} from "@gdu-gl/common";
import * as Cesium from "cesium";

import PopupCollection from "@cesium-engine/BasicWidgets/Geometry/PopupCollection";
import { CesiumGeometryManagerImp } from "../../Types/IGeometryImp";

import FeatureCache from "./FeatureCache";
import GeometryCollection from "./GeometryCollection";

import PointCollection from "./PointCollection";
import VectorLayer from "../Layer/VectorLayer";

/**
 * 几何管理器类
 * 用于管理各种几何图层和要素集合
 */
export default class GeometryManager
  extends GeometryManagerAbstract
  implements CesiumGeometryManagerImp
{
  layerCollection: Array<VectorLayer>;

  polygonCollection: GeometryCollection;

  private viewer: IViewerDelegateImp;

  private lineStringCollection: GeometryCollection;

  private pointCollection: PointCollection;

  private groundLinStringCollection: GeometryCollection;

  private groundGroundPolygonCollection: GeometryCollection;

  private popupCollection: PopupCollection;

  featureCache = new FeatureCache();

  private wallCollection: GeometryCollection;

  private get _events(): IEventDelegateImp {
    if (!this.viewer) {
      throw new Error("viewer is not defined");
    }
    return this.viewer.eventsDelegate;
  }

  private get _map(): Cesium.Viewer {
    if (!this.viewer) {
      throw new Error("viewer is not defined");
    }
    return this.viewer.mapProviderDelegate.map;
  }

  constructor(viewer: IViewerDelegateImp) {
    super();
    this.viewer = viewer;
    this.polygonCollection = new GeometryCollection({
      maxBucketGeometryLength: 1000,
      featureCache: this.featureCache,
      geometryType: "Polygon",
      geometryManager: this,
    });
    this.lineStringCollection = new GeometryCollection({
      maxBucketGeometryLength: 1000,
      featureCache: this.featureCache,
      geometryType: "LineString",
      geometryManager: this,
    });
    this.pointCollection = new PointCollection({
      maxBucketGeometryLength: 1000,
      featureCache: this.featureCache,
      geometryType: "Point",
      scene: this._map.scene,
      geometryManager: this,
    });
    this.groundLinStringCollection = new GeometryCollection({
      maxBucketGeometryLength: 1000,
      featureCache: this.featureCache,
      geometryType: "GroundLineString",
      geometryManager: this,
    });
    this.groundGroundPolygonCollection = new GeometryCollection({
      maxBucketGeometryLength: 1000,
      featureCache: this.featureCache,
      geometryType: "GroundPolygon",
      geometryManager: this,
    });
    this.popupCollection = new PopupCollection({
      viewer,
      maxBucketGeometryLength: 1000,
      featureCache: this.featureCache,
      geometryType: "Popup",
    });
    this.wallCollection = new GeometryCollection({
      geometryManager: this,
      maxBucketGeometryLength: 1000,
      featureCache: this.featureCache,
      geometryType: "Wall",
    });

    this.layerCollection = [];
    this.init();
  }

  init() {
    this._map.scene.primitives.add(this.polygonCollection);
    this._map.scene.primitives.add(this.lineStringCollection);
    this._map.scene.primitives.add(this.pointCollection);
    this._map.scene.groundPrimitives.add(this.groundLinStringCollection);
    this._map.scene.groundPrimitives.add(this.groundGroundPolygonCollection);
    this._map.scene.primitives.add(this.wallCollection);
    this._events.eventManager?.addEventListener(
      EventName.CAMERA_MOVING,
      this.popupCollection.update.bind(this.popupCollection),
    );
  }

  getCollection(
    geometryType: GeometryType,
  ): GeometryCollection | PointCollection | PopupCollection | undefined {
    switch (geometryType) {
      case "Wall":
        return this.wallCollection;
      case "MultiLineString":
      case "LineString":
        return this.lineStringCollection;
      case "MultiPolygon":
      case "Polygon":
        return this.polygonCollection;
      case "MultiPoint":
      case "Point":
      case "GroundPoint":
      case "GroundMultiPoint":
        return this.pointCollection;
      case "GroundMultiLineString":
      case "GroundLineString":
        return this.groundLinStringCollection;
      case "GroundMultiPolygon":
      case "GroundPolygon":
        return this.groundGroundPolygonCollection;
      case "Popup":
        return this.popupCollection;
      default:
        return undefined;
    }
  }

  addLayer(layerId: string, features: FeatureCollection): boolean {
    if (
      Cesium.defined(layerId) &&
      !this.featureCache.hasFeatureCache(layerId)
    ) {
      const layer = new VectorLayer({
        layerId,
        feature: features,
        manager: this,
      });
      this.layerCollection.push(layer);
      return true;
    }
    return false;
  }

  destroy() {
    super.destroy();
    this._events.eventManager?.removeEventListener(
      EventName.CAMERA_MOVING,
      this.popupCollection.update.bind(this),
    );
  }
}
