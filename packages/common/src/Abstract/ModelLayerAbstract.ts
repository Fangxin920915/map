import { cloneDeep, isEqual } from "lodash-es";
import {
  IModelManagerImp,
  ModelFeature,
  ModelFeatureCollection,
  ModelLayerImp,
} from "../Interfaces";

type Options = {
  layerId: string;
  feature: ModelFeatureCollection;
  manager: IModelManagerImp;
};
export abstract class ModelLayerAbstract implements ModelLayerImp {
  feature: ModelFeatureCollection;

  layerId: string;

  private manager: IModelManagerImp;

  constructor(options: Options) {
    this.layerId = options.layerId;
    this.feature = options.feature;
    this.manager = options.manager;
    this.init();
  }

  private init() {
    this.feature.features.forEach((feature: ModelFeature) => {
      this.addModel(feature);
    });
  }

  addModel(feature: ModelFeature): void {
    const geometryCollection = this.manager.getCollection(feature.type);
    geometryCollection?.addModel(this.layerId, feature);

    const inCache = this.feature.features.some(
      (f: { properties: { id: any } }) =>
        f.properties.id === feature.properties.id,
    );
    if (inCache) return;
    this.feature.features.push(feature);
  }

  removeModel(modelFeatureId: string): void {
    if (!this.manager.featureCache) return;
    const featureCache =
      this.manager.featureCache.getFeatureCache(modelFeatureId);
    if (featureCache) {
      const geometryCollection = this.manager.getCollection(
        featureCache.modelFeature.type,
      );
      if (geometryCollection) {
        geometryCollection.removeModel(featureCache.modelId);
      }
      const featureIdx = this.feature.features.findIndex(
        (v: any) => v.properties.id === modelFeatureId,
      );
      this.feature.features.splice(featureIdx, 1);
    }
  }

  updateModelProperties(
    modelFeatureProperties: ModelFeature["properties"] & Record<string, any>,
  ): void {
    if (!this.manager) return;
    const {
      id,
      animateProperties,
      tilesetProperties,
      outlineProperties,
      attributesProperties,
      appearanceProperties,
      heightReferenceProperties,
      primitiveProperties,
    } = modelFeatureProperties;
    if (!this.manager.featureCache) return;
    const modelFeatureCache = this.manager?.featureCache.getFeatureCache(id);
    if (modelFeatureCache) {
      const modelCollection = this.manager.getCollection(
        modelFeatureCache.modelFeature.type,
      );
      if (modelCollection) {
        if (
          !isEqual(
            animateProperties,
            modelFeatureCache.modelFeature.properties.animateProperties,
          )
        ) {
          modelCollection.updateAnimationProperties(id, animateProperties);
        }
        if (
          !isEqual(
            tilesetProperties,
            modelFeatureCache.modelFeature.properties.tilesetProperties,
          )
        ) {
          modelCollection.updateTilesetProperties(id, tilesetProperties);
        }
        if (
          !isEqual(
            outlineProperties,
            modelFeatureCache.modelFeature.properties.outlineProperties,
          )
        ) {
          modelCollection.updateOutlineProperties(id, outlineProperties);
        }
        if (
          !isEqual(
            attributesProperties,
            modelFeatureCache.modelFeature.properties.attributesProperties,
          )
        ) {
          modelCollection.updateAttributesProperties(id, attributesProperties);
        }
        if (
          !isEqual(
            appearanceProperties,
            modelFeatureCache.modelFeature.properties.appearanceProperties,
          )
        ) {
          modelCollection.updateAppearanceProperties(id, appearanceProperties);
        }
        if (
          !isEqual(
            heightReferenceProperties,
            modelFeatureCache.modelFeature.properties.heightReferenceProperties,
          )
        ) {
          modelCollection.updateHeightReferenceProperties(
            id,
            heightReferenceProperties,
          );
        }
        if (
          !isEqual(
            primitiveProperties,
            modelFeatureCache.modelFeature.properties.primitiveProperties,
          )
        ) {
          modelCollection.updatePrimitiveProperties(id, primitiveProperties);
        }
      }
    }
  }

  updateModelGeometry(modelId: string, modelFeature: ModelFeature): void {
    if (!this.manager.featureCache) return;
    const featureCache = this.manager.featureCache.getFeatureCache(modelId);
    if (featureCache) {
      const geometryCollection = this.manager.getCollection(
        featureCache.modelFeature.type,
      );
      if (geometryCollection) {
        geometryCollection.updateModelMatrix(
          featureCache.modelId,
          modelFeature,
        );
      }
    }
  }

  removeAll(): void {
    const copyFeature = cloneDeep(this.feature);
    for (let i = 0; i < copyFeature.features.length; i++) {
      const feature = copyFeature.features[i];
      this.removeModel(feature.properties.id);
    }
  }

  destroy(): void {
    this.removeAll();
  }
}
