import { computed, ref } from "vue";
import { isEmpty } from "lodash-es";
import {
  ElectronicFenceFeature,
  GeoFeatureType,
  getGroundPolygonCenter,
  PolygonCoordinates,
} from "@gdu-gl/common";
import * as turf from "@turf/turf";
import {
  ElectronicFenceLayerProps,
  ElectronicFenceLayerEmits,
  ElectronicFenceFeatureInfo,
  ElectronicFenceFeatureWithCenter,
} from "../props";
import { getElectronicFenceStyle } from "../utils/getStyle";

export function useDataSource(
  props: ElectronicFenceLayerProps,
  emits: ElectronicFenceLayerEmits,
) {
  const hoverId = ref<ElectronicFenceFeatureInfo | null>(null);

  const editing = ref(false);

  const activeId = computed<ElectronicFenceFeatureInfo | null>({
    get: () => {
      return {
        id: props.selectId,
        type: null,
      };
    },
    set: (v: ElectronicFenceFeatureInfo | null) => {
      emits("update:selectId", v?.id ?? null);
    },
  });

  /**
   * 围栏数据包含中心坐标
   */
  const featureWithCenter = computed(() => {
    const dataSource = isEmpty(props.dataSource) ? [] : props.dataSource;
    return dataSource.map((item: ElectronicFenceFeature) => {
      const featureInfo = {
        id: item.properties.id,
        type: null,
      };
      switch (item.geometry.type) {
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
              ).geometry.coordinates as PolygonCoordinates,
            },
            featureInfo,
            centerCoordinates: item.geometry.coordinates,
          } as ElectronicFenceFeatureWithCenter;
        default:
          return {
            ...item,
            featureInfo,
            centerCoordinates: getGroundPolygonCenter(
              item.geometry.coordinates as PolygonCoordinates,
            ),
          } as ElectronicFenceFeatureWithCenter;
      }
    });
  });

  /**
   * 围栏数据包含中心坐标,根据围栏类型返回不同的样式
   */
  const featureWithStyles = computed(() => {
    const active = activeId.value?.id;
    const hover = hoverId.value?.id;
    return featureWithCenter.value.map((item) => {
      return {
        visible: getFeatureVisible(item),
        ...getElectronicFenceStyle(item, active, hover),
      };
    });
  });

  function getFeatureVisible(item: ElectronicFenceFeatureWithCenter) {
    const {
      id,
      options: { visible = true },
    } = item.properties;
    if (props.enableModify && activeId.value?.id === id) {
      return false;
    }
    return visible;
  }

  return {
    activeId,
    editing,
    hoverId,
    featureWithCenter,
    featureWithStyles,
  };
}
