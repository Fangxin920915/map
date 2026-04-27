import { onBeforeUnmount, onMounted, watch } from "vue";
import { useFeatureCommonProperties } from "@map/Hooks";
import {
  GeometryPropertiesAppearance,
  isValidCoordinates,
  PointCoordinates,
  GeometryType,
  uuid,
} from "@gdu-gl/common";
import { mapViewInternal } from "@gdu-gl/core";
import { PopupProps } from "../props";

export function useAddPopup(props: PopupProps) {
  const id = uuid();
  const viewer = mapViewInternal.getViewer(props.viewId as string);
  const vectorLayer = viewer?.vectorLayer;
  const { styleToWatchArr, ...commonProperties } =
    useFeatureCommonProperties(props);

  /**
   * 判断点位是否有加载好
   */
  let pointReady = false;

  watch([() => props.clampToGround, ...styleToWatchArr()], () => {
    if (!pointReady) {
      console.warn("样式设置失败，点要素未创建");
      return;
    }

    vectorLayer?.updateFeatureProperties(getPopupProperties());
  });
  //
  watch(
    [() => props.coordinates?.toString()],
    ([newCoordinatesStr], [oldCoordinatesStr]) => {
      if (pointReady && newCoordinatesStr !== oldCoordinatesStr) {
        vectorLayer?.updateFeatureGeometry(id, checkCoordinates());
      } else if (!pointReady) {
        createPopup();
      }
    },
  );

  onMounted(() => {
    createPopup();
  });

  onBeforeUnmount(() => {
    vectorLayer?.removeFeature(id);
  });

  function createPopup() {
    try {
      vectorLayer?.addFeature({
        type: "Feature",
        geometry: {
          type: `Popup` as GeometryType,
          coordinates: checkCoordinates(),
        },
        properties: getPopupProperties(),
      });
      pointReady = true;
    } catch (e) {
      console.error(e);
    }
  }

  function getPopupProperties() {
    return {
      name: `popUp_${id}`,
      ...commonProperties,
      id,
      appearance: getPopupStyle(),
    };
  }

  function getPopupStyle() {
    const popUpProperties = {
      zIndex: props.zIndex,
      clampToGround: props.clampToGround,
      offset: props.offset,
      anchor: props.position,
    };
    return {
      appearanceType: "MaterialAppearance",
      materialType: "Color",
      attributeProperties: {
        show: props.visible,
      },
      popUpProperties,
      primitiveProperties: {
        asynchronous: true,
      },
    } as GeometryPropertiesAppearance;
  }

  /**
   * 坐标数据校验器
   * @returns 符合 GeoJSON 规范的坐标数组（自动修复非法数据）
   */
  function checkCoordinates() {
    return isValidCoordinates(props.coordinates as PointCoordinates);
  }

  return {
    id,
  };
}
