import { useTemplateRef, ref, computed, WritableComputedRef } from "vue";
import {
  MarkerFeature,
  DrawToolOptions,
  Coordinates,
  GeoFeatureType,
  MarkerLineStringStyle,
  MarkerPolygonStyle,
  uuid,
} from "@gdu-gl/common";
import { GduDrawTool, MarkerFeatureInfo } from "@map/Components";
import { isNil } from "lodash-es";
import {
  getLineStringProps,
  getPolygonProps,
} from "../Utils/getMarkerToolStyle";
import { MarkerLayerEmits, MarkerLayerProps } from "../props";

export function useDrawTool(
  props: MarkerLayerProps,
  emits: MarkerLayerEmits,
  activeIds: WritableComputedRef<MarkerFeatureInfo[], MarkerFeatureInfo[]>,
) {
  const drawRef = useTemplateRef<InstanceType<typeof GduDrawTool>>("drawRef");

  const drawing = ref(false);

  const drawStyleOptions = ref<DrawToolOptions | null>(null);

  const drawToolStyleByOptions = computed(() => {
    if (!drawStyleOptions.value) {
      return {};
    }
    switch (drawStyleOptions.value.type) {
      case GeoFeatureType.LineString:
        return getLineStringProps(
          drawStyleOptions.value.style as MarkerLineStringStyle,
        );
      case GeoFeatureType.Circle:
      case GeoFeatureType.Polygon:
        return getPolygonProps(
          drawStyleOptions.value.style as MarkerPolygonStyle,
        );
      default:
        return {};
    }
  });

  function startDrawEvent() {
    drawing.value = true;
    emits("startDraw");
  }

  function cancelDrawEvent() {
    activeIds.value = [];
    drawing.value = false;
    emits("cancelDraw");
  }

  function finishDrawEvent(feature: {
    type: GeoFeatureType;
    coordinates: Coordinates;
    radius?: number;
  }) {
    drawing.value = false;
    const options = {
      ...drawStyleOptions.value!.style,
    };
    const geometry = {
      type: feature.type,
      coordinates: feature.coordinates,
    };
    if (!isNil(feature.radius)) {
      (geometry as MarkerFeature["geometry"]).radius = feature.radius;
    }
    const markerFeature: MarkerFeature = {
      geometry,
      properties: {
        id: uuid(),
        options,
      },
    };
    emits("finishDraw", markerFeature);
    emits("update:dataSource", [...props.dataSource, markerFeature]);
  }

  function startDraw(options: DrawToolOptions) {
    activeIds.value = [];
    drawing.value = true;
    drawStyleOptions.value = options;
    drawRef.value?.startDraw(options.type);
  }

  /**
   * 取消绘制的方法
   */
  function cancelDraw() {
    // 调用绘制工具组件的 cancelDraw 方法
    drawRef.value?.cancelDraw();
  }

  /**
   * 完成绘制的方法
   */
  function finishDraw() {
    // 调用绘制工具组件的 finishDraw 方法
    drawRef.value?.finishDraw();
  }

  return {
    drawing,
    startDraw,
    cancelDraw,
    finishDraw,
    startDrawEvent,
    cancelDrawEvent,
    finishDrawEvent,
    drawToolStyleByOptions,
  };
}
