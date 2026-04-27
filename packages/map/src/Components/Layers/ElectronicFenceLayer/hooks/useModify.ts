import { computed, Ref, WritableComputedRef } from "vue";
import {
  LineStringCoordinates,
  PointCoordinates,
  PolygonCoordinates,
  GeoFeatureType,
  MarkerFeature,
  MapThemeColor,
} from "@gdu-gl/common";
import { cloneDeep } from "lodash-es";
import {
  DrawToolProps,
  ElectronicFenceFeatureInfo,
  ElectronicFenceFeatureWithCenter,
  ElectronicFenceLayerEmits,
  ElectronicFenceLayerProps,
  VectorWallProps,
} from "@map/Components";
import { PolygonProps } from "@map/Types";
import {
  getBaseColorByType,
  getElectronicFencePolygonStyle,
  getElectronicFenceTurnPointStyle,
  getElectronicFenceWallStyle,
} from "../utils/getStyle";

export interface SelectFeatureStyle
  extends Pick<DrawToolProps, "turnPointStyle"> {
  style: PolygonProps;
  wallStyle: VectorWallProps;
}

export function useModify(
  props: ElectronicFenceLayerProps,
  emits: ElectronicFenceLayerEmits,
  featureWithCenters: Ref<ElectronicFenceFeatureWithCenter[]>,
  activeId: WritableComputedRef<
    ElectronicFenceFeatureInfo | null,
    ElectronicFenceFeatureInfo | null
  >,
  editing: Ref<boolean>,
) {
  const selectFeature = computed(() => {
    if (props.enableModify && activeId.value && activeId.value?.id) {
      return featureWithCenters.value.find((item) => {
        return item.properties.id === activeId.value?.id;
      });
    }
    return null;
  });

  const selectFeatureStyle = computed<SelectFeatureStyle | null>(() => {
    if (props.enableModify && selectFeature.value) {
      const { id, options } = selectFeature.value.properties;
      const { type, height, disabled } = options;
      const { activeColor, hoverColor, key } = getBaseColorByType(
        disabled ? undefined : type,
      );
      const mainKey = key as keyof typeof MapThemeColor;
      const turnPointStyle = getElectronicFenceTurnPointStyle(mainKey);
      const polygonStyle = getElectronicFencePolygonStyle(
        selectFeature.value,
        activeColor,
        hoverColor,
        id,
        "",
      );
      const wallStyle = getElectronicFenceWallStyle(
        polygonStyle.fillColor!,
        type,
        height ?? 0,
      );
      return {
        turnPointStyle,
        style: polygonStyle,
        wallStyle,
      };
    }
    return null;
  });

  function startModify() {
    editing.value = true;
    if (selectFeature.value) {
      const index = props.dataSource.findIndex((item) => {
        return item.properties.id === activeId.value?.id;
      });
      emits(
        "startModify",
        selectFeature.value.properties.id,
        props.dataSource[index],
      );
    }
  }

  function finishModify(
    coordinates: PointCoordinates | LineStringCoordinates | PolygonCoordinates,
    radius?: number,
  ) {
    editing.value = false;
    const copyDataSource = cloneDeep(props.dataSource);
    const index = copyDataSource.findIndex((item) => {
      return item.properties.id === activeId.value?.id;
    });
    if (index > -1) {
      const dataSource = copyDataSource[index];
      dataSource.geometry.coordinates = coordinates;
      const { geometry } = dataSource;
      if (dataSource.geometry.type === GeoFeatureType.Circle) {
        (geometry as MarkerFeature["geometry"]).radius = radius ?? 0;
      }
      emits(
        "finishModify",
        dataSource.properties.id,
        dataSource,
        copyDataSource,
      );
      emits("update:dataSource", copyDataSource);
    }
  }
  return {
    selectFeatureStyle,
    selectFeature,
    startModify,
    finishModify,
  };
}
