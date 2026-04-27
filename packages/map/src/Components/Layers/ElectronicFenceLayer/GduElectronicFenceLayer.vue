<template>
  <gdu-map-event
    v-if="props.enableSelect && !drawing"
    :view-id="props.viewId"
    @click="mouseClick"
    @mouse-move="mouseMove"
  />
  <gdu-draw-tool
    v-else-if="drawing"
    ref="drawRef"
    :view-id="props.viewId"
    v-bind="drawToolStyleByType"
    :message="props.message"
    @start="startDrawEvent"
    @cancel="cancelDrawEvent"
    @finish="finishDrawEvent"
  />
  <gdu-edit-polygon-tool
    v-if="selectFeature?.geometry?.type === GeoFeatureType.Polygon"
    ref="editToolRef"
    v-bind="commonEditProps"
    :coordinates="selectFeature.geometry.coordinates as PolygonCoordinates"
    :turn-point-style="selectFeatureStyle?.turnPointStyle"
    :polygon-style="selectFeatureStyle?.style as PolygonProps"
    :wall-style="selectFeatureStyle?.wallStyle"
  />
  <gdu-edit-circle-tool
    v-else-if="selectFeature?.geometry?.type === GeoFeatureType.Circle"
    ref="editToolRef"
    v-bind="commonEditProps"
    :coordinates="selectFeature.centerCoordinates as PointCoordinates"
    :radius="selectFeature.geometry.radius ?? 0"
    :turn-point-style="selectFeatureStyle?.turnPointStyle"
    :circle-style="selectFeatureStyle?.style as PolygonProps"
    :wall-style="selectFeatureStyle?.wallStyle"
  />
  <gdu-vector-layer :view-id="props.viewId">
    <template v-for="feature in featureWithStyles" :key="feature.id">
      <gdu-polygon
        :name="props.layerId"
        v-bind="feature.polygonStyle"
        :feature-properties="feature.featureInfo"
        :visible="feature.visible"
        clamp-to-ground
      />
      <gdu-point
        :name="props.layerId"
        v-bind="feature.pointStyle"
        :shape-type="'none'"
        :visible="feature.visible && feature.pointStyle.visible"
        :feature-properties="feature.featureInfo"
        clamp-to-ground
      />
      <gdu-wall
        :name="props.layerId"
        v-bind="feature.wallStyle"
        :visible="feature.visible"
        :feature-properties="feature.featureInfo"
      />
    </template>
  </gdu-vector-layer>
</template>

<script setup lang="ts">
import { defaultMapId, PolygonProps } from "@map/Types";
import {
  GduDrawTool,
  GduEditCircleTool,
  GduEditPolygonTool,
  GduMapEvent,
  GduPoint,
  GduPolygon,
  GduVectorLayer,
  GduWall,
} from "@map/Components";
import {
  GeoFeatureType,
  PointCoordinates,
  PolygonCoordinates,
  uuid,
} from "@gdu-gl/common";
import { computed } from "vue";
import { useModify } from "./hooks/useModify";
import {
  defaultElectronicFenceLayerProps,
  ElectronicFenceLayerEmits,
  ElectronicFenceLayerProps,
} from "./props";
import { useDataSource } from "./hooks/useDataSource";
import { useMouseEvent } from "./hooks/useMouseEvent";
import { useDrawTool } from "./hooks/useDrawTool";

const props = withDefaults(defineProps<ElectronicFenceLayerProps>(), {
  ...defaultElectronicFenceLayerProps,
  message: () => defaultElectronicFenceLayerProps.message,
  dataSource: () => defaultElectronicFenceLayerProps.dataSource,
  viewId: defaultMapId,
  layerId: () => uuid(),
});

const emits = defineEmits<ElectronicFenceLayerEmits>();

const { featureWithStyles, editing, hoverId, activeId, featureWithCenter } =
  useDataSource(props, emits);

const {
  startDraw,
  cancelDraw,
  finishDraw,
  startDrawEvent,
  finishDrawEvent,
  cancelDrawEvent,
  drawToolStyleByType,
  drawing,
} = useDrawTool(props, emits, activeId);

const { mouseMove, mouseClick } = useMouseEvent(
  props,
  hoverId,
  activeId,
  editing,
);

const { startModify, finishModify, selectFeature, selectFeatureStyle } =
  useModify(props, emits, featureWithCenter, activeId, editing);

const commonEditProps = computed(() => {
  return {
    viewId: props.viewId,
    layerId: props.layerId,
    featureId: selectFeature.value?.featureInfo,
    message: props.message,
    onModifyStart: startModify,
    onModifyEnd: finishModify,
  };
});

defineExpose({
  /**
   * ### 开始绘制
   * *** type *** 绘制类型
   */
  startDraw,
  /**
   * ### 取消绘制
   */
  cancelDraw,
  /**
   * ### 完成绘制
   */
  finishDraw,
});
</script>
