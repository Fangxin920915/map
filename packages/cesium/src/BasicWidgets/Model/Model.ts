import {
  HeightReferenceType,
  ModelFeature,
  ModelImp,
  ModelType,
} from "@gdu-gl/common";
import * as Cesium from "cesium";
import { merge } from "lodash-es";
import { CustomRenderPostProcessImp } from "./CustomRenderPostProcess";
import GeometryParamsTransform from "../Geometry/GeometryParamsTransform";

export default class GduModel implements ModelImp {
  ready: boolean;

  private _model?: Cesium.Model | Cesium.Cesium3DTileset;

  private readonly _modelFeature: ModelFeature;

  private _isDestroyed: boolean;

  show: boolean;

  bucketId: string;

  layerId: string;

  modelType: ModelType;

  private readonly _scene: Cesium.Scene | undefined;

  private customRenderProcess: CustomRenderPostProcessImp;

  constructor(
    modelFeature: ModelFeature,
    layerId: string,
    customRenderProcess: CustomRenderPostProcessImp,
    scene?: Cesium.Scene,
  ) {
    this.ready = false;
    this._model = undefined;
    this._modelFeature = modelFeature;
    this._isDestroyed = false;
    this.show = modelFeature.properties.attributesProperties?.show ?? true;
    this.bucketId = modelFeature.properties.id;
    this.modelType = modelFeature.type;
    this.layerId = layerId;
    this._scene = scene;
    this.customRenderProcess = customRenderProcess;
    this.init();
  }

  /**
   *  是否为cesium3dtile
   *  兼容cesium引擎内部pick选取写法
   */
  get isCesium3DTileset() {
    return this.modelType === ModelType.TILES;
  }

  /**
   * 是否允许cesium相机进入内部
   * 兼容cesium引擎内部选取写法
   */
  get enableCollision() {
    if (this.modelType === ModelType.TILES && this._model) {
      // @ts-ignore
      return this._model.enableCollision;
    }
    return false;
  }

  getHeight(cartographic: Cesium.Cartographic, scene: Cesium.Scene) {
    if (this._model && this.modelType === ModelType.TILES) {
      // @ts-ignore
      return this._model.getHeight(cartographic, scene);
    }
    return 0;
  }

  updateModelMatrix(modelFeature: ModelFeature): void {
    this._modelFeature.geometry = modelFeature.geometry;
    const { coordinates, rotation, scale } = modelFeature.geometry;
    const modelMatrix = GeometryParamsTransform.createModelMatrix(
      coordinates,
      rotation,
      scale,
    );
    if (this._model) {
      this._model.modelMatrix = modelMatrix;
    }
  }

  updateOutlineProperties(modelFeature: ModelFeature): void {
    this._modelFeature.properties = modelFeature.properties;
    const { outlineProperties } = modelFeature.properties;
    if (this._model && outlineProperties && this.modelType === ModelType.GLTF) {
      // @ts-ignore
      this._model.silhouetteColor = this.getColor(
        outlineProperties.outlineColor,
      );
      // @ts-ignore
      this._model.silhouetteSize = outlineProperties.outlineWidth;
    }
  }

  updateAppearanceProperties(modelFeature: ModelFeature): void {
    this._modelFeature.properties = modelFeature.properties;
    const { appearanceProperties } = modelFeature.properties;
    if (
      this._model &&
      appearanceProperties &&
      this.modelType === ModelType.GLTF
    ) {
      // @ts-ignore
      this._model.color = this.getColor(
        appearanceProperties.color,
        appearanceProperties.opacity,
      );
      if (appearanceProperties.colorBlendMode) {
        // @ts-ignore
        this._model.colorBlendMode = appearanceProperties.colorBlendMode;
      }
    }
  }

  updateAttributesProperties(modelFeature: ModelFeature): void {
    this._modelFeature.properties = modelFeature.properties;
    const { attributesProperties } = modelFeature.properties;
    if (
      this._model &&
      attributesProperties &&
      this.modelType === ModelType.GLTF
    ) {
      // @ts-ignore
      this._model.show = attributesProperties.show;
      // @ts-ignore
      this._model.distanceDisplayCondition =
        this.getDistanceDisplayCondition(attributesProperties);
    }
  }

  updateHeightReferenceProperties(modelFeature: ModelFeature): void {
    this._modelFeature.properties = modelFeature.properties;
    const { heightReferenceProperties } = modelFeature.properties;
    if (
      this._model &&
      heightReferenceProperties &&
      this.modelType === ModelType.GLTF
    ) {
      // @ts-ignore
      this._model.heightReference = this.getHeightReference(
        heightReferenceProperties,
      );
    }
  }

  updateAnimationProperties(modelFeature: ModelFeature): void {
    this._modelFeature.properties = modelFeature.properties;
    const { animateProperties } = modelFeature.properties;
    if (this._model && animateProperties && this.modelType === ModelType.GLTF) {
      this.setModelAnimate(animateProperties);
    }
  }

  updatePrimitiveProperties(modelFeature: ModelFeature): void {
    if (
      this._model &&
      modelFeature.properties &&
      this.modelType === ModelType.GLTF
    ) {
      this._modelFeature.properties = modelFeature.properties;
      const { primitiveProperties } = modelFeature.properties;
      if (primitiveProperties) {
        // @ts-ignore
        this._model.minimumPixelSize = primitiveProperties.minimumPixelSize;
        // @ts-ignore
        this._model.asynchronous = primitiveProperties.asynchronous;

        this.customRenderProcess.updateCopyPrimitiveDisableDepthTestDistance(
          this.bucketId,
          primitiveProperties.disableDepthTestDistance,
        );
      }
    }
  }

  updateTilesetProperties(modelFeature: ModelFeature): void {
    if (
      this._model &&
      modelFeature.properties &&
      this.modelType === ModelType.TILES
    ) {
      this._modelFeature.properties = modelFeature.properties;
      const { tilesetProperties } = modelFeature.properties;
      if (tilesetProperties) {
        merge(this._model, tilesetProperties);
      }
    }
  }

  init() {
    if (!this._modelFeature?.properties?.url) {
      return;
    }
    if (this.modelType === ModelType.TILES) {
      this._initTileset();
    } else if (this.modelType === ModelType.GLTF) {
      this._initModel();
    }
  }

  update(frameState: any) {
    if (this._model) {
      // @ts-ignore
      this._model.update(frameState);
    }
  }

  prePassesUpdate(frameState: any): void {
    // @ts-ignore
    if (this._model && Cesium.defined(this._model.prePassesUpdate)) {
      // @ts-ignore
      this._model.prePassesUpdate(frameState);
    }
  }

  postPassesUpdate(frameState: any): void {
    // @ts-ignore
    if (this._model && Cesium.defined(this._model.postPassesUpdate)) {
      // @ts-ignore
      this._model.postPassesUpdate(frameState);
    }
  }

  private _initTileset() {
    const { properties } = this._modelFeature;
    const { url, attributesProperties, tilesetProperties, autoZoom } =
      properties;
    Cesium.Cesium3DTileset.fromUrl(url, {
      show: attributesProperties?.show,
      ...tilesetProperties,
      enableCollision: true,
      // maximumCacheOverflowBytes: 10 * 1024 * 1024 * 1024,
      // preloadWhenHidden: true,
      // immediatelyLoadDesiredLevelOfDetail: true,
      //
      // loadSiblings: true,
    }).then((tileset) => {
      this.ready = true;
      this._model = tileset;

      if (autoZoom) {
        this._scene?.camera.flyToBoundingSphere(tileset.boundingSphere);
      }
    });
  }

  private _initModel(): void {
    const { properties, geometry } = this._modelFeature;
    const {
      id,
      url,
      attributesProperties,
      primitiveProperties,
      heightReferenceProperties,
      appearanceProperties,
      outlineProperties,
      animateProperties,
    } = properties;
    const modelMatrix = GeometryParamsTransform.createModelMatrix(
      geometry.coordinates,
      geometry.rotation,
      geometry.scale,
    );
    // const modelMatrix = new Cesium.Matrix4();
    const distanceDisplayCondition =
      this.getDistanceDisplayCondition(attributesProperties);

    const heightReference = this.getHeightReference(heightReferenceProperties);
    // @ts-ignore
    Cesium.Model.fromGltfAsync({
      scene: this._scene,
      id,
      url,
      modelMatrix,
      show: attributesProperties?.show,
      distanceDisplayCondition,
      minimumPixelSize: primitiveProperties?.minimumPixelSize,
      asynchronous: primitiveProperties?.asynchronous,
      heightReference,
      color: this.getColor(
        appearanceProperties?.color,
        appearanceProperties?.opacity,
      ),
      incrementallyLoadTextures: true,
      silhouetteColor: this.getColor(outlineProperties?.outlineColor),
      silhouetteSize: outlineProperties?.outlineWidth,
    }).then((model) => {
      if (this._isDestroyed) {
        model.destroy();
        return;
      }

      this.customRenderProcess.addCopyPrimitive(
        id,
        model,
        primitiveProperties?.disableDepthTestDistance,
      );
      this._model = model;
      this._model.readyEvent.addEventListener(() => {
        this.ready = true;
        const currentModelMatrix = GeometryParamsTransform.createModelMatrix(
          this._modelFeature.geometry.coordinates,
          this._modelFeature.geometry.rotation,
          this._modelFeature.geometry.scale,
        );
        if (!Cesium.Matrix4.equals(model.modelMatrix, currentModelMatrix)) {
          model.modelMatrix = currentModelMatrix;
        }
        if (this.modelType === ModelType.GLTF && animateProperties) {
          this.setModelAnimate(animateProperties);
        }
      });
    });
  }

  private getDistanceDisplayCondition(
    attributes?: ModelFeature["properties"]["attributesProperties"],
  ): Cesium.DistanceDisplayCondition | undefined {
    if (attributes?.near && attributes.far) {
      return new Cesium.DistanceDisplayCondition(
        attributes.near,
        attributes.far,
      );
    }
    return undefined;
  }

  private getHeightReference(
    heightProps?: ModelFeature["properties"]["heightReferenceProperties"],
  ): Cesium.HeightReference | undefined {
    if (heightProps?.heightReference === HeightReferenceType.CLAMP_TO_GROUND) {
      return Cesium.HeightReference.CLAMP_TO_GROUND;
    }
    if (heightProps?.heightReference === HeightReferenceType.NONE) {
      return Cesium.HeightReference.NONE;
    }
    return undefined;
  }

  private getColor(
    colorString: string = "#ffffff",
    opacity: number = 1,
  ): Cesium.Color {
    return Cesium.Color.fromCssColorString(colorString).withAlpha(opacity);
  }

  private setModelAnimate(
    animateProperties: ModelFeature["properties"]["animateProperties"],
  ): void {
    if (this._model && animateProperties) {
      // @ts-ignore
      const { play, speed, animateNodeName, loop } = animateProperties;
      const modelAnimate =
        this._getModelAnimateByAnimateNodeName(animateNodeName);
      if (modelAnimate || !play) {
        // @ts-ignore
        this._model.activeAnimations.remove(modelAnimate);
      }
      if (play) {
        // @ts-ignore
        this._model.activeAnimations.add({
          name: animateNodeName,
          speed,
          loop: loop
            ? Cesium.ModelAnimationLoop.REPEAT
            : Cesium.ModelAnimationLoop.NONE,
        });
      }
    }
  }

  private _getModelAnimateByAnimateNodeName(
    animateNodeName: string,
  ): Cesium.ModelAnimation | undefined {
    if (this._model && animateNodeName) {
      // @ts-ignore
      const { activeAnimations } = this._model;
      const { length } = activeAnimations;
      let firstAnimation;
      for (let i = 0; i < length; ++i) {
        if (activeAnimations.get(i).name === animateNodeName) {
          firstAnimation = activeAnimations.get(i);
          break;
        }
      }
      return firstAnimation;
    }
  }

  destroy(): void {
    this._isDestroyed = true;
    if (this._model) {
      this.customRenderProcess.remove(this.bucketId);
      this._model.isDestroyed() || this._model.destroy();
    }
  }
}
