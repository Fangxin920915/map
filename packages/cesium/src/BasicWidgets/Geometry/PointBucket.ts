import * as Cesium from "cesium";
import {
  Anchor,
  Feature,
  GeometryType,
  SymbolProperties,
} from "@gdu-gl/common";
import { cloneDeep } from "lodash-es";
import GeometryParamsTransform from "./GeometryParamsTransform";
import {
  CesiumPointCollectionImp,
  PointBucketImp,
} from "../../Types/IGeometryImp";
import FeatureCache from "./FeatureCache";

type DirtyBatchItem = {
  feature: Feature;
  dirtyId: string;
};

export default class PointBucket implements PointBucketImp {
  featureCache: FeatureCache;

  geometryType: GeometryType;

  geometryCollection: CesiumPointCollectionImp;

  pointCollection: Cesium.BillboardCollection;

  labelCollection: Cesium.LabelCollection;

  bucketGeometryLength: number;

  bucketId: string;

  private _dirtyBatch: Map<string, DirtyBatchItem>;

  constructor(options: {
    featureCache: FeatureCache;
    geometryCollection: CesiumPointCollectionImp;
    geometryType: GeometryType;
  }) {
    this.bucketId = Cesium.createGuid();
    this.bucketGeometryLength = 0;
    this.featureCache = options.featureCache;
    this.geometryType = options.geometryType;
    this.geometryCollection = options.geometryCollection;
    this._dirtyBatch = new Map();
    this.pointCollection = new Cesium.BillboardCollection({
      scene: this.geometryCollection.scene as Cesium.Scene,
    });
    this.labelCollection = new Cesium.LabelCollection({
      scene: this.geometryCollection.scene as Cesium.Scene,
    });
  }

  updateGroundLineStringProperties(feature: Feature): void {
    console.log(feature);
  }

  add(layerId: string, feature: Feature): void {
    const positions = GeometryParamsTransform.createPointGeometry(feature);
    const instancesIds: string[] = [];
    if (positions) {
      positions.forEach((v) => {
        const id = Cesium.createGuid();
        this._dirtyBatch.set(feature.properties.id, {
          feature: cloneDeep(feature),
          dirtyId: id,
        });
        instancesIds.push(id);
        const translucencyByDistance = this._getTranslucencyByDistance(feature);
        const distanceDisplayCondition =
          this._getDistanceDisplayCondition(feature);
        this._applyPointFeature(
          id,
          v,
          feature,
          translucencyByDistance,
          distanceDisplayCondition,
        );
        this._applyTextFeature(
          id,
          v,
          feature,
          translucencyByDistance,
          distanceDisplayCondition,
        );
      });
      this.featureCache.addFeatureToCache(feature.properties.id, {
        feature,
        bucketId: this.bucketId,
        featureId: feature.properties.id,
        geometryType: this.geometryType,
        instancesIds,
        layerId,
        materialId: "",
        primitiveId: "",
      });
      this.bucketGeometryLength++;
    }
  }

  _applyTextFeature(
    id: string,
    position: Cesium.Cartesian3,
    feature: Feature,
    translucencyByDistance?: Cesium.NearFarScalar,
    distanceDisplayCondition?: Cesium.DistanceDisplayCondition,
  ): void {
    const { symbolProperties, attributeProperties } =
      feature.properties.appearance;
    const [offsetX = 0, offsetY = 0] = symbolProperties?.textOffset ?? [0, 0];
    const [paddingY = 5, paddingX = 7] =
      symbolProperties?.textBackgroundPadding ?? [5, 7];
    this.labelCollection.add({
      id,
      position,
      show: attributeProperties.show,
      text: symbolProperties?.textContent ?? "",
      heightReference: this._getHeightReference(feature),
      ...this.getAnchorPosition(symbolProperties?.textAnchor ?? "center"),
      font: `${symbolProperties?.textFontWeight ?? "normal"} ${symbolProperties?.textSize ?? 14}px sans-serif`,
      fillColor: Cesium.Color.fromCssColorString(
        symbolProperties?.textColor ?? "#000000",
      ),
      outlineColor: Cesium.Color.fromCssColorString(
        symbolProperties?.textHalo?.color ?? "#FFFFFF",
      ),
      outlineWidth: this._getTextHaloWidth(symbolProperties?.textHalo?.width),
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      showBackground: true,
      backgroundColor: Cesium.Color.fromCssColorString(
        symbolProperties?.textBackgroundColor ?? "transparent",
      ),
      backgroundPadding: new Cesium.Cartesian2(paddingX, paddingY),
      pixelOffset: new Cesium.Cartesian2(offsetX, offsetY),
      disableDepthTestDistance: attributeProperties.disableDepthTestDistance,
      translucencyByDistance,
      distanceDisplayCondition,
    });
  }

  _applyPointFeature(
    id: string,
    position: Cesium.Cartesian3,
    feature: Feature,
    translucencyByDistance?: Cesium.NearFarScalar,
    distanceDisplayCondition?: Cesium.DistanceDisplayCondition,
  ): void {
    const material = GeometryParamsTransform.createPointCanvas(
      feature.properties.appearance.symbolProperties as SymbolProperties,
    ) as any;
    const { symbolProperties, attributeProperties } =
      feature.properties.appearance;
    if (material.iconUrl) {
      this.pointCollection.add({
        id,
        position,
        show: attributeProperties.show,
        image: material.iconUrl,
        width: material.iconWidth,
        height: material.iconHeight,
        heightReference: this._getHeightReference(feature),
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        disableDepthTestDistance: attributeProperties.disableDepthTestDistance,
        pixelOffset: this.getPixelOffsetByAnchor(symbolProperties),
        translucencyByDistance,
        distanceDisplayCondition,
      });
    } else {
      this.pointCollection.add({
        id,
        position,
        show: attributeProperties.show,
        image: material,
        heightReference: this._getHeightReference(feature),
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        disableDepthTestDistance: attributeProperties.disableDepthTestDistance,
        pixelOffset: this.getPixelOffsetByAnchor(symbolProperties),
        translucencyByDistance,
        distanceDisplayCondition,
      });
    }
  }

  getPixelOffsetByAnchor(symbolProperties?: SymbolProperties) {
    const anchor = symbolProperties?.iconAnchor ?? "center";
    const [iconWidth = 0, iconHeight = 0] = symbolProperties?.iconSize ?? [];
    let [offsetX = 0, offsetY = 0] = symbolProperties?.iconOffset ?? [];
    if (anchor === "center" || !anchor) {
      return new Cesium.Cartesian2(offsetX, offsetY);
    }
    const [horizontalOrigin, verticalOrigin] = anchor.split("-");
    switch (horizontalOrigin) {
      case "left":
        offsetX = iconWidth / 2 + offsetX;
        break;
      case "right":
        offsetX = -iconWidth / 2 + offsetX;
        break;
    }
    switch (verticalOrigin) {
      case "top":
        offsetY = iconHeight / 2 + offsetY;
        break;
      case "bottom":
        offsetY = -iconHeight / 2 + offsetY;
        break;
    }
    return new Cesium.Cartesian2(offsetX, offsetY);
  }

  getAnchorPosition(anchor: Anchor) {
    if (anchor === "center" || !anchor) {
      return {
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      };
    }
    const [horizontalOrigin, verticalOrigin] = anchor.split("-");
    const vertical =
      verticalOrigin.toUpperCase() as keyof typeof Cesium.VerticalOrigin;
    const horizontal =
      horizontalOrigin.toUpperCase() as keyof typeof Cesium.HorizontalOrigin;
    return {
      verticalOrigin: Cesium.VerticalOrigin[vertical],
      horizontalOrigin: Cesium.HorizontalOrigin[horizontal],
    };
  }

  remove(featureId: string): void {
    const featureCache = this.featureCache.getFeatureCache(featureId);
    if (featureCache) {
      const { instancesIds } = featureCache;
      instancesIds.forEach((instanceId) => {
        const billboard = this._getBillboardById(instanceId);
        const label = this._getLabelById(instanceId);
        if (billboard) this.pointCollection.remove(billboard);
        if (label) this.labelCollection.remove(label);
      });
      this.featureCache.removeFeatureToCache(featureId);
      this.bucketGeometryLength--;
    }
  }

  _getHeightReference(feature: Feature): Cesium.HeightReference {
    if (
      feature.geometry.type === "GroundPoint" ||
      feature.geometry.type === "GroundMultiPoint" ||
      feature.properties.appearance.symbolProperties?.clampToGround
    ) {
      return Cesium.HeightReference.CLAMP_TO_GROUND;
    }
    return Cesium.HeightReference.NONE;
  }

  _getBillboardById(id: string): Cesium.Billboard | undefined {
    // @ts-ignore
    return this.pointCollection._billboards.find(
      (v: Cesium.Billboard) => v && v.id === id,
    );
  }

  _getLabelById(id: string): Cesium.Label | undefined {
    // @ts-ignore
    return this.labelCollection._labels.find(
      (v: Cesium.Label) => v && v.id === id,
    );
  }

  update(frameState: any): void {
    // @ts-ignore
    this.pointCollection.update(frameState);
    // @ts-ignore
    this.labelCollection.update(frameState);
  }

  _getTranslucencyByDistance(
    feature: Feature,
  ): Cesium.NearFarScalar | undefined {
    if (
      Cesium.defined(
        feature.properties.appearance.attributeProperties.translucencyNear,
      ) &&
      Cesium.defined(
        feature.properties.appearance.attributeProperties.translucencyNearValue,
      ) &&
      Cesium.defined(
        feature.properties.appearance.attributeProperties.translucencyFar,
      ) &&
      Cesium.defined(
        feature.properties.appearance.attributeProperties.translucencyFarValue,
      )
    ) {
      return new Cesium.NearFarScalar(
        feature.properties.appearance.attributeProperties.translucencyNear,
        feature.properties.appearance.attributeProperties.translucencyNearValue,
        feature.properties.appearance.attributeProperties.translucencyFar,
        feature.properties.appearance.attributeProperties.translucencyFarValue,
      );
    }
    return undefined;
  }

  _getDistanceDisplayCondition(
    feature: Feature,
  ): Cesium.DistanceDisplayCondition | undefined {
    if (
      Cesium.defined(feature.properties.appearance.attributeProperties.near) &&
      Cesium.defined(feature.properties.appearance.attributeProperties.far)
    ) {
      return new Cesium.DistanceDisplayCondition(
        feature.properties.appearance.attributeProperties.near,
        feature.properties.appearance.attributeProperties.far,
      );
    }
    return undefined;
  }

  updateFeatureGeometry(feature: Feature): void {
    const featureCache = this.featureCache.getFeatureCache(
      feature.properties.id,
    );

    if (featureCache) {
      const positions = GeometryParamsTransform.createPointGeometry(feature);
      // 修改了多段线坐标
      if (positions && positions?.length !== featureCache.instancesIds.length) {
        const deleteInstancesIds = featureCache.instancesIds.splice(
          positions.length,
          featureCache.instancesIds.length,
        );
        deleteInstancesIds.forEach((v) => {
          const billboard = this._getBillboardById(v);
          billboard && this.pointCollection.remove(billboard);
          const label = this._getLabelById(v);
          label && this.labelCollection.remove(label);
        });
      }
      let material: any;
      positions?.forEach((p, index) => {
        const id = featureCache.instancesIds[index]
          ? featureCache.instancesIds[index]
          : Cesium.createGuid();
        const translucencyByDistance = this._getTranslucencyByDistance(feature);
        const distanceDisplayCondition =
          this._getDistanceDisplayCondition(feature);

        const label = this._getLabelById(featureCache.instancesIds[index]);
        if (label) {
          label.position = p;
        } else {
          this._applyTextFeature(
            id,
            p,
            feature,
            translucencyByDistance,
            distanceDisplayCondition,
          );
        }

        const billboard = this._getBillboardById(
          featureCache.instancesIds[index],
        );
        if (billboard) {
          billboard.position = p;
          if (!material) {
            material = billboard.image;
          }
        } else {
          if (this._dirtyBatch.has(id)) {
            // 更新属性
            this._dirtyBatch.set(id, {
              feature: cloneDeep(feature),
              dirtyId: id,
            });
          }
          const { symbolProperties, attributeProperties } =
            feature.properties.appearance;
          if (material) {
            this.pointCollection.add({
              id,
              position: p,
              show: attributeProperties.show,
              image: material,
              heightReference: this._getHeightReference(feature),
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
              verticalOrigin: Cesium.VerticalOrigin.CENTER,
              pixelOffset: this.getPixelOffsetByAnchor(symbolProperties),
              disableDepthTestDistance:
                attributeProperties.disableDepthTestDistance,
              translucencyByDistance,
              distanceDisplayCondition,
            });
          } else {
            this._applyPointFeature(
              id,
              p,
              feature,
              translucencyByDistance,
              distanceDisplayCondition,
            );
          }
        }
      });
    }
  }

  updateAttributeProperties(feature: Feature): void {
    const featureCache = this.featureCache.getFeatureCache(
      feature.properties.id,
    );
    if (featureCache) {
      featureCache.instancesIds.forEach((instanceId) => {
        const { attributeProperties } = feature.properties.appearance;
        const billboard = this._getBillboardById(instanceId);
        if (billboard) {
          billboard.show = attributeProperties.show as boolean;
          if (billboard.distanceDisplayCondition) {
            billboard.distanceDisplayCondition =
              new Cesium.DistanceDisplayCondition(
                attributeProperties.near,
                attributeProperties.far,
              );
          }
          if (billboard.translucencyByDistance) {
            billboard.translucencyByDistance = new Cesium.NearFarScalar(
              attributeProperties.translucencyNear,
              attributeProperties.translucencyNearValue,
              attributeProperties.translucencyFar,
              attributeProperties.translucencyFarValue,
            );
          }
          if (attributeProperties.disableDepthTestDistance) {
            billboard.disableDepthTestDistance =
              attributeProperties.disableDepthTestDistance;
          }
        }

        const label = this._getLabelById(instanceId);
        if (label) {
          label.show = attributeProperties.show as boolean;
          if (label.distanceDisplayCondition) {
            label.distanceDisplayCondition =
              new Cesium.DistanceDisplayCondition(
                attributeProperties.near,
                attributeProperties.far,
              );
          }
          if (label.translucencyByDistance) {
            label.translucencyByDistance = new Cesium.NearFarScalar(
              attributeProperties.translucencyNear,
              attributeProperties.translucencyNearValue,
              attributeProperties.translucencyFar,
              attributeProperties.translucencyFarValue,
            );
          }
          if (attributeProperties.disableDepthTestDistance) {
            label.disableDepthTestDistance =
              attributeProperties.disableDepthTestDistance;
          }
        }
      });
    }
  }

  updateSymbolHeightReference(feature: Feature): void {
    const featureCache = this.featureCache.getFeatureCache(
      feature.properties.id,
    );
    if (featureCache) {
      const positions = GeometryParamsTransform.createPointGeometry(feature);
      positions?.forEach((p, index) => {
        const billboard = this._getBillboardById(
          featureCache.instancesIds[index],
        );
        if (billboard) {
          billboard.position = p;
          billboard.heightReference = this._getHeightReference(feature);
        }

        const label = this._getLabelById(featureCache.instancesIds[index]);
        if (label) {
          label.position = p;
          label.heightReference = this._getHeightReference(feature);
        }
      });
      // const { instancesIds } = featureCache;
      // instancesIds.forEach((instanceId) => {
      //   const billboard = this._getBillboardById(instanceId);
      //   if (billboard)
      //     billboard.heightReference = this._getHeightReference(feature);
      //   const label = this._getLabelById(instanceId);
      //   if (label) label.heightReference = this._getHeightReference(feature);
      // });
    }

    // this.updateFeatureGeometry(feature);
  }

  _getTextHaloWidth(width: any): number {
    if (
      width !== undefined &&
      width !== null &&
      typeof width === "number" &&
      width > 0
    ) {
      return width + 4;
    }
    return 0;
  }

  updatePointSymbolProperties(feature: Feature): void {
    const featureCache = this.featureCache.getFeatureCache(
      feature.properties.id,
    );
    if (featureCache) {
      featureCache.instancesIds.forEach((instanceId) => {
        const billboard = this._getBillboardById(instanceId);
        if (billboard) {
          billboard.pixelOffset = this.getPixelOffsetByAnchor(
            feature.properties.appearance.symbolProperties,
          );
          const material = GeometryParamsTransform.createPointCanvas(
            feature.properties.appearance.symbolProperties as SymbolProperties,
          ) as any;
          if (material.iconUrl) {
            billboard.image = material.iconUrl;
            billboard.width = material.iconWidth;
            billboard.height = material.iconHeight;
          } else {
            billboard.image = material;
            billboard.width = undefined;
            billboard.height = undefined;
          }
        }
      });
    }
  }

  updateTextSymbolProperties(feature: Feature): void {
    const featureCache = this.featureCache.getFeatureCache(
      feature.properties.id,
    );
    if (featureCache) {
      featureCache.instancesIds.forEach((instanceId) => {
        const label = this._getLabelById(instanceId);
        const { symbolProperties } = feature.properties.appearance;
        const [offsetX = 0, offsetY = 0] = symbolProperties?.textOffset ?? [
          0, 0,
        ];
        const [paddingY = 5, paddingX = 7] =
          symbolProperties?.textBackgroundPadding ?? [5, 7];
        if (label) {
          const { horizontalOrigin, verticalOrigin } = this.getAnchorPosition(
            symbolProperties?.textAnchor ?? "center",
          );
          label.text = symbolProperties?.textContent ?? "";
          label.horizontalOrigin = horizontalOrigin;
          label.verticalOrigin = verticalOrigin;
          label.font = `${symbolProperties?.textFontWeight ?? "normal"} ${symbolProperties?.textSize ?? 14}px sans-serif`;
          label.fillColor = Cesium.Color.fromCssColorString(
            symbolProperties?.textColor ?? "#000000",
          );
          label.outlineColor = Cesium.Color.fromCssColorString(
            symbolProperties?.textHalo?.color ?? "#FFFFFF",
          );
          label.outlineWidth = this._getTextHaloWidth(
            symbolProperties?.textHalo?.width,
          );
          label.backgroundColor = Cesium.Color.fromCssColorString(
            symbolProperties?.textBackgroundColor ?? "transparent",
          );
          label.backgroundPadding = new Cesium.Cartesian2(paddingX, paddingY);
          label.pixelOffset = new Cesium.Cartesian2(offsetX, offsetY);
        }
      });
    }
  }

  updateSymbolProperties(feature: Feature): void {
    console.log(feature);
  }

  destroy(): void {
    this.pointCollection.destroy();
    this.labelCollection.destroy();
    Cesium.destroyObject(this);
  }

  updateMaterialProperties(feature: Feature): void {
    console.log(feature);
  }

  updateUpdatePopupProperties(feature: Feature): void {
    console.log(feature);
  }

  updateLineStringProperties(feature: Feature): void {
    console.log(feature);
  }

  updateAppearanceProperties(feature: Feature): void {
    console.log(feature);
  }
}
