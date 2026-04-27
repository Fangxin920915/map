import {
  MarkerFeatureInfo,
  MarkerLayerEmits,
  MarkerLayerProps,
} from "@map/Components";
import {
  getGroundLineStringCenter,
  getGroundPolygonCenter,
  LineStringCoordinates,
  GeoFeatureType,
  MarkerPointStyle,
  PointCoordinates,
  PointerType,
  PolygonCoordinates,
} from "@gdu-gl/common";
import { computed, ref } from "vue";
import { MarkerFeatureWithCenter, MarkerFeatureWithStyle } from "@map/Types";
import {
  getMarkerIconByName,
  getMarkerLineStringStyle,
  getMarkerPointStyle,
  getMarkerPolygonStyle,
  getMarkerTextStyle,
  getThemeColor,
} from "@map/Utils";
import { mapViewInternal } from "@gdu-gl/core";
import * as turf from "@turf/turf";

export function useDataSource(
  props: MarkerLayerProps,
  emits: MarkerLayerEmits,
) {
  const viewer = mapViewInternal.getViewer(props.viewId!)!;

  const hoverId = ref<MarkerFeatureInfo | null>(null);

  const editing = ref(false);

  const altPress = ref(false);

  const activeIds = computed<MarkerFeatureInfo[]>({
    get: () => {
      const ids = props.selectIds ?? [];
      return ids.map((id) => ({ id, type: null }));
    },
    set: (values) => {
      const ids = values ?? [];
      emits(
        "update:selectIds",
        ids.map(({ id }) => id!),
      );
    },
  });

  const featureWithCenters = computed(() => {
    return props.dataSource.map((item) => {
      const themeColor = getThemeColor(item as MarkerFeatureWithCenter);
      const featureInfo = {
        id: item.properties.id,
        type: null,
      };
      switch (item.geometry.type) {
        case GeoFeatureType.Point:
          return {
            ...item,
            helperLine: getHelperLine(
              item.geometry.coordinates as PointCoordinates,
            ),
            featureInfo,
            icon: getMarkerIconByName(
              (item.properties.options as MarkerPointStyle).iconName,
              themeColor,
            ),
          } as MarkerFeatureWithCenter;
        case GeoFeatureType.LineString:
          return {
            ...item,
            featureInfo,
            centerCoordinates: getGroundLineStringCenter(
              item.geometry.coordinates as LineStringCoordinates,
            ),
          } as MarkerFeatureWithCenter;
        case GeoFeatureType.Circle:
          return {
            ...item,
            geometry: {
              type: GeoFeatureType.Circle,
              radius: item.geometry.radius,
              coordinates: turf.circle(
                item.geometry.coordinates as number[],
                item.geometry.radius ?? 0,
                {
                  steps: 48,
                },
              ).geometry.coordinates,
            },
            featureInfo,
            centerCoordinates: item.geometry.coordinates,
          } as MarkerFeatureWithCenter;
        default:
          return {
            ...item,
            featureInfo,
            centerCoordinates: getGroundPolygonCenter(
              item.geometry.coordinates as PolygonCoordinates,
            ),
          } as MarkerFeatureWithCenter;
      }
    });
  });

  const featureWithStyles = computed(() => {
    return featureWithCenters.value.map((item) => {
      switch (item.geometry.type) {
        case GeoFeatureType.LineString:
          return getLineByDataSource(item as MarkerFeatureWithCenter);
        case GeoFeatureType.Circle:
        case GeoFeatureType.Polygon:
          return getAreaByDataSource(item as MarkerFeatureWithCenter);
        default:
          return getPointByDataSource(item as MarkerFeatureWithCenter);
      }
    });
  });

  function getPointByDataSource(
    item: MarkerFeatureWithCenter,
  ): MarkerFeatureWithStyle {
    const { id } = item.properties;
    const { iconName } = item.properties.options as MarkerPointStyle;
    const themeColor = getThemeColor(item);
    const ids = activeIds.value.map((active) => active.id!);
    const textStyle = getMarkerTextStyle(
      item.geometry.type,
      item,
      themeColor,
      ids,
      hoverId.value?.id,
    );
    const pointStyle = getMarkerPointStyle(item, ids, hoverId.value?.id);
    const textSize = item.properties.options.textSize ?? 32;
    const iconOffsetY = iconName === PointerType.Circle ? 0 : -textSize / 2;
    const textOffsetY = -textSize * 1.8 + iconOffsetY;
    return {
      type: GeoFeatureType.Point,
      id,
      visible: getFeatureVisible(item),
      helperLine: item.helperLine,
      featureInfo: item.featureInfo,
      pointStyle: {
        coordinates: item.geometry.coordinates,
        featureProperties: id,
        offset: [0, iconOffsetY],
        textOffset: [0, textOffsetY],
        ...textStyle,
        ...pointStyle,
      },
    };
  }

  function getLineByDataSource(
    item: MarkerFeatureWithCenter,
  ): MarkerFeatureWithStyle {
    const { id } = item.properties;
    const ids = activeIds.value.map((active) => active.id!);
    const themeColor = getThemeColor(item);
    const textStyle = getMarkerTextStyle(
      item.geometry.type,
      item,
      themeColor,
      ids,
      hoverId.value?.id,
    );
    const lineStyle = getMarkerLineStringStyle(
      item,
      themeColor,
      ids,
      hoverId.value?.id,
    );
    return {
      type: GeoFeatureType.LineString,
      id,
      visible: getFeatureVisible(item),
      featureInfo: item.featureInfo,
      pointStyle: {
        ...textStyle,
        coordinates: item.centerCoordinates,
        featureProperties: id,
      },
      lineStyle: {
        ...lineStyle,
        coordinates: item.geometry.coordinates,
        featureProperties: id,
      },
    };
  }

  function getAreaByDataSource(
    item: MarkerFeatureWithCenter,
  ): MarkerFeatureWithStyle {
    const { id } = item.properties;
    const ids = activeIds.value.map((active) => active.id!);
    const themeColor = getThemeColor(item);
    const textStyle = getMarkerTextStyle(
      item.geometry.type,
      item,
      themeColor,
      ids,
      hoverId.value?.id,
    );
    const polygonStyle = getMarkerPolygonStyle(
      item,
      themeColor,
      ids,
      hoverId.value?.id,
    );

    return {
      type: GeoFeatureType.Polygon,
      id,
      visible: getFeatureVisible(item),
      featureInfo: item.featureInfo,
      pointStyle: {
        ...textStyle,
        coordinates: item.centerCoordinates,
        featureProperties: id,
      },
      polygonStyle: {
        ...polygonStyle,
        coordinates: item.geometry.coordinates,
        featureProperties: id,
      },
    };
  }

  function getFeatureVisible(item: MarkerFeatureWithCenter) {
    const {
      id,
      options: { visible = true },
    } = item.properties;
    const activeIdx = activeIds.value.findIndex((active) => active.id === id);
    if (props.enableModify && activeIdx > -1) {
      return false;
    }
    return visible;
  }

  function getHelperLine(coordinates: PointCoordinates) {
    const groundHeight =
      viewer.mapProviderDelegate.mapProvider?.queryAltitudes?.getHeight(
        coordinates,
      ) ?? 0;
    return [coordinates, [coordinates[0], coordinates[1], groundHeight]];
  }

  return {
    featureWithCenters,
    featureWithStyles,
    altPress,
    hoverId,
    activeIds,
    editing,
  };
}
