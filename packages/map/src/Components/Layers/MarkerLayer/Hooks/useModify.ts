import { computed, Ref, WritableComputedRef } from "vue";
import {
  getLineStringProps,
  getPointProps,
  getPolygonProps,
} from "@map/Components/Layers/MarkerLayer/Utils/getMarkerToolStyle";
import {
  LineStringCoordinates,
  PointCoordinates,
  PolygonCoordinates,
  GeoFeatureType,
  MarkerLineStringStyle,
  MarkerPolygonStyle,
  MarkerFeature,
} from "@gdu-gl/common";
import { cloneDeep } from "lodash-es";
import {
  LineStringProps,
  MarkerFeatureWithCenter,
  PointProps,
  PolygonProps,
} from "@map/Types";
import { DrawToolProps, MarkerFeatureInfo } from "@map/Components";
import { MarkerLayerEmits, MarkerLayerProps } from "../props";

export interface SelectFeatureStyle
  extends Pick<DrawToolProps, "turnPointStyle" | "errorColor"> {
  style: PointProps | LineStringProps | PolygonProps;
}

export function useModify(
  props: MarkerLayerProps,
  emits: MarkerLayerEmits,
  featureWithCenters: Ref<MarkerFeatureWithCenter[]>,
  activeIds: WritableComputedRef<MarkerFeatureInfo[], MarkerFeatureInfo[]>,
  editing: Ref<boolean>,
) {
  const selectFeature = computed(() => {
    if (props.enableModify && activeIds.value.length > 0) {
      return featureWithCenters.value.find((item) => {
        const [first] = activeIds.value;
        return item.properties.id === first?.id;
      });
    }
    return null;
  });

  const selectFeatureStyle = computed<SelectFeatureStyle | null>(() => {
    if (props.enableModify && selectFeature.value) {
      const { options } = selectFeature.value.properties;
      switch (selectFeature.value.geometry.type) {
        case GeoFeatureType.LineString:
          return getLineStringProps(options as MarkerLineStringStyle);
        case GeoFeatureType.Circle:
        case GeoFeatureType.Polygon:
          return getPolygonProps(options as MarkerPolygonStyle);
        default:
          return getPointProps(selectFeature.value);
      }
    }
    return null;
  });

  function startModify() {
    editing.value = true;
    if (selectFeature.value) {
      emits(
        "startModify",
        selectFeature.value.properties.id,
        selectFeature.value,
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
      const [first] = activeIds.value;
      return item.properties.id === first?.id;
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
