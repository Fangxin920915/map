import { ModelFeature, ModelCollectionImp } from "@gdu-gl/common";

import { merge } from "lodash-es";
import * as Cesium from "cesium";
import CustomRenderPostProcess from "@cesium-engine/BasicWidgets/Model/CustomRenderPostProcess";
import ModelCache from "./ModelCache";
import Model from "./Model";

type Options = {
  featureCache: ModelCache;
  viewer: Cesium.Viewer;
};

export default class ModelCollection
  extends Cesium.PrimitiveCollection
  implements ModelCollectionImp
{
  featureCache: ModelCache;

  private readonly _primitives: Model[];

  private readonly _scene?: Cesium.Scene;

  private _viewer: Cesium.Viewer | undefined;

  private _customRenderProcess: CustomRenderPostProcess;

  constructor(options: Options) {
    super();
    this.featureCache = options.featureCache;
    this._viewer = options.viewer;
    this._scene = this._viewer?.scene;
    this._primitives = [];
    this._customRenderProcess = new CustomRenderPostProcess(this._viewer);
  }

  update(frameState: any): void {
    this._primitives.forEach((model) => {
      model.update(frameState);
    });
    this._customRenderProcess.update();
  }

  prePassesUpdate(frameState: any): void {
    this._primitives.forEach((model) => {
      model.prePassesUpdate(frameState);
    });
  }

  postPassesUpdate(frameState: any): void {
    this._primitives.forEach((model) => {
      model.postPassesUpdate(frameState);
    });
  }

  addModel(layerId: string, feature: ModelFeature): void {
    if (feature && layerId) {
      const model = new Model(
        feature,
        layerId,
        this._customRenderProcess,
        this._scene,
      );
      this._primitives.push(model);
      this.featureCache.addFeatureToCache(feature.properties.id, {
        modelId: model.bucketId,
        layerId,
        modelFeature: feature,
      });
    }
  }

  removeModel(featureId: string): void {
    const featureCache = this.featureCache.getFeatureCache(featureId);
    if (!featureCache) return;
    const index = this._getModelIndex(featureCache.modelId);
    if (index > -1) {
      this._customRenderProcess.remove(featureCache.modelId);
      const model = this._primitives[index];
      model.destroy();
      this._primitives.splice(index, 1);
      this.featureCache.removeFeatureToCache(featureId);
    }
  }

  _getModelIndex(modelId: string) {
    return this._primitives.findIndex((v) => v.bucketId === modelId);
  }

  getModel(id: string): Model | undefined {
    return this._primitives.find((v) => v.bucketId === id);
  }

  updateModelMatrix(id: string, modelFeature: ModelFeature): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const model = this.getModel(id);
      if (model) {
        model.updateModelMatrix(modelFeature);
      }
    }
  }

  updateOutlineProperties(
    id: string,
    outlineProperties?: ModelFeature["properties"]["outlineProperties"],
  ): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const model = this.getModel(id);
      if (model) {
        const { modelFeature } = featureCache;
        modelFeature.properties.outlineProperties = {
          ...modelFeature.properties.outlineProperties,
          ...outlineProperties,
        };
        model.updateOutlineProperties(modelFeature);
      }
    }
  }

  updateAppearanceProperties(
    id: string,
    appearanceProperties: ModelFeature["properties"]["appearanceProperties"],
  ): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const model = this.getModel(id);
      if (model) {
        const { modelFeature } = featureCache;
        modelFeature.properties.appearanceProperties = {
          ...modelFeature.properties.appearanceProperties,
          ...appearanceProperties,
        };

        model.updateAppearanceProperties(modelFeature);
      }
    }
  }

  updateAttributesProperties(
    id: string,
    attributesProperties: ModelFeature["properties"]["attributesProperties"],
  ): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const model = this.getModel(id);
      if (model) {
        const { modelFeature } = featureCache;
        modelFeature.properties.attributesProperties = {
          ...modelFeature.properties.attributesProperties,
          ...attributesProperties,
        };
        model.updateAttributesProperties(modelFeature);
      }
    }
  }

  updateHeightReferenceProperties(
    id: string,
    heightReferenceProperties: ModelFeature["properties"]["heightReferenceProperties"],
  ): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const model = this.getModel(id);
      if (model) {
        const { modelFeature } = featureCache;
        modelFeature.properties.heightReferenceProperties = {
          ...modelFeature.properties.heightReferenceProperties,
          ...heightReferenceProperties,
        };
        model.updateHeightReferenceProperties(modelFeature);
      }
    }
  }

  updateAnimationProperties(
    id: string,
    animateProperties: ModelFeature["properties"]["animateProperties"],
  ): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const model = this.getModel(id);
      if (model) {
        const { modelFeature } = featureCache;
        if (modelFeature.properties.animateProperties) {
          modelFeature.properties.animateProperties = {
            ...modelFeature.properties.animateProperties,
            ...animateProperties,
          };
        } else {
          modelFeature.properties.animateProperties = animateProperties;
        }
        model.updateAnimationProperties(modelFeature);
      }
    }
  }

  updatePrimitiveProperties(
    id: string,
    primitiveProperties: ModelFeature["properties"]["primitiveProperties"],
  ): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const model = this.getModel(id);
      if (model) {
        const { modelFeature } = featureCache;
        merge(modelFeature.properties.primitiveProperties, primitiveProperties);
        model.updatePrimitiveProperties(modelFeature);
      }
    }
  }

  updateTilesetProperties(
    id: string,
    tilesetProperties: ModelFeature["properties"]["tilesetProperties"],
  ): void {
    const featureCache = this.featureCache.getFeatureCache(id);
    if (featureCache) {
      const model = this.getModel(id);
      if (model) {
        const { modelFeature } = featureCache;
        merge(modelFeature.properties.tilesetProperties, tilesetProperties);
        model.updateTilesetProperties(modelFeature);
      }
    }
  }

  isDestroyed(): boolean {
    return false;
  }

  destroy(): void {
    this._customRenderProcess.destroy();
    this._primitives.forEach((model) => {
      model.destroy();
    });
    this._primitives.length = 0;
  }
}
