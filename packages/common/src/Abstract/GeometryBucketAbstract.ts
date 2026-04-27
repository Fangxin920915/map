import { uuid } from "@common/Utils";
import {
  Feature,
  FeatureCacheItem,
  FeatureCollection,
  GeometryType,
  FeatureCacheImp,
  IGeometryManagerImp,
  BaseGeometryCollectionImp,
  BaseBucketImp,
} from "../Interfaces";

export abstract class GeometryBucketAbstract<
  G extends BaseGeometryCollectionImp<
    BaseBucketImp,
    IGeometryManagerImp,
    FeatureCacheImp
  >,
  F extends FeatureCacheImp,
> implements BaseBucketImp
{
  featureCache: F;

  bucketId: string;

  bucketGeometryLength: number;

  featureCollection: FeatureCollection;

  geometryType: GeometryType;

  geometryCollection: G;

  constructor(options: {
    featureCache: F;
    geometryType: GeometryType;
    geometryCollection: G;
  }) {
    this.geometryCollection = options.geometryCollection;
    this.featureCache = options.featureCache;
    this.bucketId = uuid();
    this.bucketGeometryLength = 0;
    this.geometryType = options.geometryType;
    this.featureCollection = {
      features: [],
      type: "FeatureCollection",
    };
  }

  abstract add(layerId: string, feature: Feature): void;

  abstract remove(id: string): void;

  abstract updateFeatureGeometry(feature: Feature): void;

  abstract destroy(): void;

  _updateFeatureProperties(feature: Feature): void {
    const featureCache: FeatureCacheItem | undefined =
      this.featureCache.getFeatureCache(feature.properties.id);

    if (featureCache) {
      this.featureCache.updateFeatureCache(feature.properties.id, {
        ...featureCache,
        feature,
      });
      const { instancesIds } = featureCache;
      instancesIds.forEach((id: string) => {
        const instance = this.featureCollection.features.find(
          (f) => f.properties.id === id,
        );
        if (instance) {
          instance.properties = {
            ...instance.properties,
            ...feature.properties,
            id: instance.properties.id,
          };
        }
      });

      this._updateLayers();
    }
  }

  updateUpdatePopupProperties(feature: Feature): void {
    this._updateFeatureProperties(feature);
  }

  updateLineStringProperties(feature: Feature): void {
    this._updateFeatureProperties(feature);
  }

  updateSymbolProperties(feature: Feature): void {
    this._updateFeatureProperties(feature);
  }

  updateAttributeProperties(feature: Feature): void {
    this._updateFeatureProperties(feature);
  }

  updateMaterialProperties(feature: Feature): void {
    this._updateFeatureProperties(feature);
  }

  updateAppearanceProperties(feature: Feature): void {
    this._updateFeatureProperties(feature);
  }

  updateGroundLineStringProperties(feature: Feature): void {
    this._updateFeatureProperties(feature);
  }

  abstract _updateLayers(): void;
}
