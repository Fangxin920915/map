import { inject, onBeforeMount, onBeforeUnmount, watch } from "vue";
import { VectorLayerKey } from "@map/Constants";
import { useFeatureCommonProperties } from "@map/Hooks";
import {
  GeometryPropertiesAppearance,
  SymbolProperties,
  isValidCoordinates,
  PointCoordinates,
  MultiPointCoordinates,
  GeometryType,
} from "@gdu-gl/common";
import { isEqual } from "lodash-es";

import {
  VectorMultiPointEmits,
  VectorMultiPointProps,
  VectorPointEmits,
  VectorPointProps,
} from "../props";

export function useAddPoint(
  props: VectorPointProps | VectorMultiPointProps,
  emits: VectorPointEmits | VectorMultiPointEmits,
  isMultiPoint?: boolean,
) {
  const vectorLayer = inject(VectorLayerKey);

  const { styleToWatchArr, cloneFeatureProperties, ...commonProperties } =
    useFeatureCommonProperties(props, emits);

  /**
   * 判断点位是否有加载好
   */
  let pointReady = false;

  watch(
    cloneFeatureProperties,
    (newValue, oldValue) => {
      if (!pointReady) {
        console.warn("样式设置失败，点要素未创建");
        return;
      }
      if (isEqual(newValue, oldValue)) {
        return;
      }
      vectorLayer?.value?.updateFeatureProperties(getPointProperties());
    },
    {
      deep: true,
    },
  );

  watch([() => props.clampToGround, ...styleToWatchArr()], () => {
    if (!pointReady) {
      console.warn("样式设置失败，点要素未创建");
      return;
    }
    vectorLayer?.value?.updateFeatureProperties(getPointProperties());
  });

  watch(
    () => props.coordinates?.toString(),
    (newCoordinatesStr, oldCoordinatesStr) => {
      if (pointReady && newCoordinatesStr !== oldCoordinatesStr) {
        vectorLayer?.value?.updateFeatureGeometry(
          commonProperties.id,
          checkCoordinates(),
        );
      }
    },
  );

  onBeforeMount(() => {
    createPoint();
  });

  onBeforeUnmount(() => {
    vectorLayer?.value?.removeFeature(commonProperties.id);
  });

  function createPoint() {
    try {
      const multiString = isMultiPoint ? "Multi" : "";
      vectorLayer?.value?.addFeature({
        type: "Feature",
        geometry: {
          type: `${multiString}Point` as GeometryType,
          coordinates: checkCoordinates(),
        },
        properties: getPointProperties(),
      });
      pointReady = true;
    } catch (e) {
      console.error(e);
    }
  }

  function getPointProperties() {
    if (!isMultiPoint) {
      const pointProps = props as VectorPointProps;
      return {
        name: pointProps.name,
        featureProperties: pointProps.featureProperties,
        enableModify: pointProps.enableModify,
        modifyType: pointProps.modifyType,
        modifyStartHandler,
        modifyEndHandler,
        modifyingHandler,
        ...commonProperties,
        appearance: getPointStyle(),
      };
    }
    const multiPointProps = props as VectorMultiPointProps;
    return {
      name: multiPointProps.name,
      featureProperties: multiPointProps.featureProperties,
      ...commonProperties,
      appearance: getPointStyle(),
    };
  }

  function getPointStyle() {
    const symbolProperties = {
      clampToGround: !!props.clampToGround,
      iconAnchor: props.anchor,
      textAnchor: props.textAnchor,
      textColor: props.textColor,
      textContent: props.text ?? "",
      textSize: props.textSize,
      textFontWeight: props.textFontWeight,
      textOffset: props.textOffset,
      textHalo: {
        color: props.textOutlineColor,
        width: props.textOutlineWidth,
      },
      iconOffset: props.offset,
      iconUrl: "",
      textBackgroundBorderColor: props.textBackgroundBorderColor,
      textBackgroundBorderWidth: props.textBackgroundBorderWidth,
      textBackgroundColor: props.textBackgroundColor,
      textBackgroundPadding: props.textBackgroundPadding,
      textBackgroundRadius: props.textBackgroundRadius,
    } as SymbolProperties;
    if (props.iconSrc) {
      symbolProperties.iconSize = [props.iconWidth ?? 0, props.iconHeight ?? 0];
      symbolProperties.iconUrl = (props.iconSrc ?? "") as string;
    } else {
      symbolProperties.shapeType = props.shapeType;
      symbolProperties.shapeColor = props.shapeFillColor;
      symbolProperties.iconSize = [props.shapeSize ?? 0, props.shapeSize ?? 0];
      symbolProperties.borderColor = props.shapeOutlineColor;
      symbolProperties.borderWidth = props.shapeOutlineWidth;
    }

    return {
      appearanceType: "MaterialAppearance",
      materialType: "Color",
      attributeProperties: {
        disableDepthTestDistance: props.disableDepthTestDistance,
        show: props.visible,
      },
      symbolProperties,
      primitiveProperties: {
        asynchronous: true,
      },
    } as GeometryPropertiesAppearance;
  }

  function modifyStartHandler() {
    const pointEmits = emits as VectorPointEmits;
    pointEmits("modifyStart");
  }

  function modifyingHandler(coordinates: PointCoordinates) {
    const pointEmits = emits as VectorPointEmits;
    pointEmits("modifying", coordinates);
    pointEmits("update:coordinates", coordinates);
  }

  function modifyEndHandler(coordinates: PointCoordinates) {
    const pointEmits = emits as VectorPointEmits;
    pointEmits("modifyEnd", coordinates);
  }

  /**
   * 坐标数据校验器
   * @returns 符合 GeoJSON 规范的坐标数组（自动修复非法数据）
   */
  function checkCoordinates() {
    if (isMultiPoint) {
      const points = props.coordinates as MultiPointCoordinates;
      return points.map((coordinates) => isValidCoordinates(coordinates));
    }
    return isValidCoordinates(props.coordinates as PointCoordinates);
  }
}
