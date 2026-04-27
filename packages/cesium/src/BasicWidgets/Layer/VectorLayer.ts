import * as Cesium from "cesium";
import { VectorLayerAbstract, GeometryProperties } from "@gdu-gl/common";
import PopupCollection from "@cesium-engine/BasicWidgets/Geometry/PopupCollection";
import { cloneDeep, isEqual } from "lodash-es";

import GeometryCollection from "../Geometry/GeometryCollection";

import PointCollection from "../Geometry/PointCollection";

/**
 * Cesium矢量图层类，继承自AbstractVectorLayer
 * 实现了具体的几何属性比较方法
 */
export default class VectorLayer extends VectorLayerAbstract {
  protected compareWallLineStringProperties(
    currentProperties: GeometryProperties & Record<string, any>,
    newProperties: GeometryProperties & Record<string, any>,
    geometryCollection: any,
  ): void {
    // const featureCache = geometryCollection.featureCache.getFeatureCache(
    //   currentProperties.id,
    // );
    // if (featureCache) {
    //   featureCache.feature.properties.appearance.primitiveProperties =
    //     cloneDeep(newProperties.appearance.primitiveProperties);
    // }
    if (
      !isEqual(
        currentProperties.appearance.primitiveProperties,
        newProperties.appearance.primitiveProperties,
      )
    ) {
      geometryCollection.updatePrimitiveProperties(
        currentProperties.id,
        newProperties.appearance.primitiveProperties as any,
      );
    }

    // console.log(newProperties.appearance.materialProperties);
    if (
      !isEqual(
        currentProperties.appearance.appearanceProperties,
        newProperties.appearance.appearanceProperties,
      )
    ) {
      geometryCollection.updateAppearanceProperties(
        currentProperties.id,
        newProperties.appearance.appearanceProperties as any,
      );
    }

    if (
      !isEqual(
        currentProperties.appearance.attributeProperties,
        newProperties.appearance.attributeProperties,
      )
    ) {
      geometryCollection.updateAttributeProperties(
        currentProperties.id,
        newProperties.appearance.attributeProperties,
      );
    }

    if (
      currentProperties.appearance.materialType !==
        newProperties.appearance.materialType ||
      !isEqual(
        currentProperties.appearance.materialProperties,
        newProperties.appearance.materialProperties,
      )
    ) {
      geometryCollection.updateMaterialProperties(
        currentProperties.id,
        newProperties.appearance.materialProperties,
        newProperties.appearance.materialType,
      );
    }
    if (
      !isEqual(
        currentProperties.appearance.wallProperties,
        newProperties.appearance.wallProperties,
      )
    ) {
      // @ts-ignore
      geometryCollection.updateWallProperties(
        currentProperties.id,
        newProperties.appearance.wallProperties,
      );
    }
  }

  protected comparePopupProperties(
    currentProperties: GeometryProperties & Record<string, any>,
    newProperties: GeometryProperties & Record<string, any>,
    geometryCollection: PopupCollection,
  ) {
    if (
      !isEqual(
        currentProperties.appearance.attributeProperties,
        newProperties.appearance.attributeProperties,
      )
    ) {
      geometryCollection.updateAttributeProperties(
        currentProperties.id,
        newProperties.appearance.attributeProperties,
      );
    }
    if (
      !isEqual(
        currentProperties.appearance.popUpProperties,
        newProperties.appearance.popUpProperties,
      )
    ) {
      geometryCollection.updatePopupProperties(
        currentProperties.id,
        newProperties.appearance.popUpProperties,
      );
    }
  }

  protected comparePolygonProperties(
    currentProperties: GeometryProperties & Record<string, any>,
    newProperties: GeometryProperties & Record<string, any>,
    geometryCollection: GeometryCollection,
  ) {
    if (
      currentProperties.appearance.appearanceType !==
      newProperties.appearance.appearanceType
    ) {
      geometryCollection.updateAppearance(
        currentProperties.id,
        newProperties.appearance.appearanceProperties as any,
        newProperties.appearance.appearanceType,
      );
    } else if (
      !isEqual(
        currentProperties.appearance.appearanceProperties,
        newProperties.appearance.appearanceProperties,
      )
    ) {
      geometryCollection.updateAppearanceProperties(
        currentProperties.id,
        newProperties.appearance.appearanceProperties as any,
      );
    }
    if (
      !isEqual(
        currentProperties.appearance.attributeProperties,
        newProperties.appearance.attributeProperties,
      )
    ) {
      geometryCollection.updateAttributeProperties(
        currentProperties.id,
        newProperties.appearance.attributeProperties,
      );
    }
    if (
      currentProperties.appearance.materialType !==
        newProperties.appearance.materialType ||
      !isEqual(
        currentProperties.appearance.materialProperties,
        newProperties.appearance.materialProperties,
      )
    ) {
      geometryCollection.updateMaterialProperties(
        currentProperties.id,
        newProperties.appearance.materialProperties,
        newProperties.appearance.materialType,
      );
    }
  }

  protected compareLineStringProperties(
    currentProperties: GeometryProperties & Record<string, any>,
    newProperties: GeometryProperties & Record<string, any>,
    geometryCollection: any,
  ) {
    if (
      !isEqual(
        currentProperties.appearance.attributeProperties,
        newProperties.appearance.attributeProperties,
      )
    ) {
      geometryCollection.updateAttributeProperties(
        currentProperties.id,
        newProperties.appearance.attributeProperties,
      );
    }
    if (
      !isEqual(
        currentProperties.appearance.lineStringProperties,
        newProperties.appearance.lineStringProperties,
      )
    ) {
      geometryCollection.updateLineStringProperties(
        currentProperties.id,
        newProperties.appearance.lineStringProperties,
      );
    }
    if (
      !isEqual(
        currentProperties.appearance.appearanceProperties,
        newProperties.appearance.appearanceProperties,
      )
    ) {
      geometryCollection.updateAppearanceProperties(
        currentProperties.id,
        newProperties.appearance.appearanceProperties as any,
      );
    }
    if (
      currentProperties.appearance.materialType !==
        newProperties.appearance.materialType ||
      !isEqual(
        currentProperties.appearance.materialProperties,
        newProperties.appearance.materialProperties,
      )
    ) {
      geometryCollection.updateMaterialProperties(
        currentProperties.id,
        newProperties.appearance.materialProperties,
        newProperties.appearance.materialType,
      );
    }
  }

  protected compareGroundLineStringProperties(
    currentProperties: GeometryProperties & Record<string, any>,
    newProperties: GeometryProperties & Record<string, any>,
    geometryCollection: GeometryCollection,
  ) {
    const featureCache = geometryCollection.featureCache.getFeatureCache(
      currentProperties.id,
    );
    if (featureCache) {
      featureCache.feature.properties.appearance.primitiveProperties =
        cloneDeep(newProperties.appearance.primitiveProperties);
    }

    // console.log(newProperties.appearance.materialProperties);
    if (
      !isEqual(
        currentProperties.appearance.appearanceProperties,
        newProperties.appearance.appearanceProperties,
      )
    ) {
      geometryCollection.updateAppearanceProperties(
        currentProperties.id,
        newProperties.appearance.appearanceProperties as any,
      );
    }

    if (
      !isEqual(
        currentProperties.appearance.attributeProperties,
        newProperties.appearance.attributeProperties,
      )
    ) {
      geometryCollection.updateAttributeProperties(
        currentProperties.id,
        newProperties.appearance.attributeProperties,
      );
    }

    if (
      currentProperties.appearance.materialType !==
        newProperties.appearance.materialType ||
      !isEqual(
        currentProperties.appearance.materialProperties,
        newProperties.appearance.materialProperties,
      )
    ) {
      geometryCollection.updateMaterialProperties(
        currentProperties.id,
        newProperties.appearance.materialProperties,
        newProperties.appearance.materialType,
      );
    }
    if (
      !isEqual(
        currentProperties.appearance.lineStringProperties,
        newProperties.appearance.lineStringProperties,
      )
    ) {
      // @ts-ignore
      geometryCollection.updateGroundLineStringProperties(
        currentProperties.id,
        newProperties.appearance.lineStringProperties,
      );
    }
  }

  protected compareSymbolProperties(
    currentProperties: GeometryProperties & Record<string, any>,
    newProperties: GeometryProperties & Record<string, any>,
    geometryCollection: PointCollection,
  ) {
    if (
      !isEqual(
        currentProperties.appearance.attributeProperties,
        newProperties.appearance.attributeProperties,
      )
    ) {
      geometryCollection.updateAttributeProperties(
        currentProperties.id,
        newProperties.appearance.attributeProperties,
      );
    }
    if (
      !isEqual(
        currentProperties.appearance.symbolProperties,
        newProperties.appearance.symbolProperties,
      )
    ) {
      if (
        currentProperties.appearance.symbolProperties?.clampToGround !==
        newProperties.appearance.symbolProperties?.clampToGround
      ) {
        geometryCollection.updateSymbolHeightReference(
          currentProperties.id,
          newProperties.appearance.symbolProperties?.clampToGround as boolean,
        );
      }
      geometryCollection.updateSymbolProperties(
        currentProperties.id,
        newProperties.appearance.symbolProperties,
      );
    }
  }

  // 重写destroy方法，添加Cesium资源释放逻辑
  destroy(): void {
    super.destroy();
    Cesium.destroyObject(this);
  }
}
