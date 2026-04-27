<template>
  <gdu-map-event
    v-if="!drawing"
    :view-id="props.viewId"
    @click="mouseClick"
    @mouse-move="mouseMove"
  />
  <gdu-draw-tool
    ref="drawRef"
    :view-id="props.viewId"
    v-bind="drawToolStyleByOptions"
    :message="props.message"
    @start="startDrawEvent"
    @cancel="cancelDrawEvent"
    @finish="finishDrawEvent"
  />

  <gdu-edit-line-string-tool
    v-if="selectFeature?.geometry?.type === GeoFeatureType.LineString"
    ref="editToolRef"
    v-bind="commonEditProps"
    :coordinates="selectFeature.geometry.coordinates as LineStringCoordinates"
    :turn-point-style="selectFeatureStyle?.turnPointStyle"
    :line-string-style="selectFeatureStyle?.style! as LineStringProps"
  />
  <gdu-edit-polygon-tool
    v-else-if="selectFeature?.geometry?.type === GeoFeatureType.Polygon"
    ref="editToolRef"
    v-bind="commonEditProps"
    :coordinates="selectFeature.geometry.coordinates as PolygonCoordinates"
    :turn-point-style="selectFeatureStyle?.turnPointStyle"
    :error-color="selectFeatureStyle?.errorColor"
    :polygon-style="selectFeatureStyle?.style as PolygonProps"
  />
  <gdu-edit-point-tool
    v-else-if="selectFeature?.geometry?.type === GeoFeatureType.Point"
    ref="editToolRef"
    v-bind="commonEditProps"
    :coordinates="selectFeature.geometry.coordinates as PointCoordinates"
    :point-style="selectFeatureStyle?.style as PointProps"
    :alt-press="altPress"
    :clamp-to-ground="props.clampToGround"
  />
  <gdu-edit-circle-tool
    v-else-if="selectFeature?.geometry?.type === GeoFeatureType.Circle"
    ref="editToolRef"
    v-bind="commonEditProps"
    :coordinates="selectFeature.centerCoordinates as PointCoordinates"
    :radius="selectFeature.geometry.radius ?? 0"
    :turn-point-style="selectFeatureStyle?.turnPointStyle"
    :circle-style="selectFeatureStyle?.style as PolygonProps"
  />

  <gdu-vector-layer :view-id="props.viewId">
    <template v-for="feature in featureWithStyles" :key="feature.id">
      <template
        v-if="
          feature.type === GeoFeatureType.Point &&
          !isEmpty(feature.pointStyle?.coordinates)
        "
      >
        <gdu-point
          :name="props.layerId"
          v-bind="feature.pointStyle"
          :feature-properties="feature.featureInfo"
          :visible="feature.visible"
        />
        <gdu-point
          :coordinates="feature.helperLine![1]"
          :disable-depth-test-distance="0"
          clamp-to-ground
          :shape-size="10"
          :shape-outline-width="0"
          shape-fill-color="rgba(255,255,255,0.5)"
          :visible="feature.visible && !props.clampToGround"
        />
        <gdu-line-string
          :coordinates="feature.helperLine"
          stroke-color="rgba(255,255,255,0.5)"
          :stroke-outline-width="0"
          :line-dash="dashLength"
          :stroke-width="1"
          :visible="feature.visible"
        />
      </template>
      <template
        v-else-if="
          feature.type === GeoFeatureType.LineString &&
          !isEmpty(feature.lineStyle?.coordinates)
        "
      >
        <gdu-line-string
          :name="props.layerId"
          v-bind="feature.lineStyle"
          :visible="feature.visible"
          :feature-properties="feature.featureInfo"
          clamp-to-ground
        />
        <gdu-point
          :name="props.layerId"
          v-bind="feature.pointStyle"
          :visible="feature.visible"
          :feature-properties="feature.featureInfo"
          clamp-to-ground
        />
      </template>
      <template
        v-else-if="
          GeoFeatureType.Polygon === feature.type &&
          !isEmpty(feature.polygonStyle?.coordinates)
        "
      >
        <gdu-polygon
          :name="props.layerId"
          v-bind="feature.polygonStyle"
          :visible="feature.visible"
          :feature-properties="feature.featureInfo"
          clamp-to-ground
        />
        <gdu-point
          :name="props.layerId"
          v-bind="feature.pointStyle"
          :visible="feature.visible"
          :feature-properties="feature.featureInfo"
          clamp-to-ground
        />
      </template>
    </template>
  </gdu-vector-layer>
  <gdu-popup
    v-if="props.enableAiMouseStyle && !isEmpty(mousePosition) && hoverId"
    :view-id="props.viewId"
    :coordinates="mousePosition!"
    :position="PopupPosition.CENTER_LEFT"
    :offset="aiMouseTooltip"
  >
    <div class="gdu-edit-popup-container">
      <span class="edit-turn-point-tip">
        {{ props.message?.aiMouseTooltip ?? "" }}
      </span>
    </div>
  </gdu-popup>
</template>

<script setup lang="ts">
import {
  defaultMapId,
  LineStringProps,
  PointProps,
  PolygonProps,
} from "@map/Types";
import {
  GduVectorLayer,
  GduLineString,
  GduPoint,
  GduPolygon,
  GduMapEvent,
  GduDrawTool,
  GduEditLineStringTool,
  GduEditPolygonTool,
  GduEditPointTool,
  GduEditCircleTool,
  GduPopup,
} from "@map/Components";
import { isEmpty } from "lodash-es";
import {
  LineStringCoordinates,
  GeoFeatureType,
  PointCoordinates,
  PolygonCoordinates,
  PopupPosition,
  uuid,
} from "@gdu-gl/common";
import { computed } from "vue";
import { useModify } from "./Hooks/useModify";
import { useDrawTool } from "./Hooks/useDrawTool";
import { useMouseEvent } from "./Hooks/useMouseEvent";
import { useDataSource } from "./Hooks/useDataSource";
import {
  defaultMarkerLayerProps,
  MarkerLayerProps,
  MarkerLayerEmits,
} from "./props";

const props = withDefaults(defineProps<MarkerLayerProps>(), {
  ...defaultMarkerLayerProps,
  viewId: defaultMapId,
  dataSource: () => defaultMarkerLayerProps.dataSource,
  layerId: () => uuid(),
  message: () => defaultMarkerLayerProps.message,
});

const emits = defineEmits<MarkerLayerEmits>();

const dashLength = [10, 4];

const aiMouseTooltip = [30, 18];

const {
  hoverId,
  activeIds,
  editing,
  altPress,
  featureWithStyles,
  featureWithCenters,
} = useDataSource(props, emits);
const { mouseMove, mouseClick, mousePosition } = useMouseEvent(
  props,
  emits,
  hoverId,
  activeIds,
  editing,
  altPress,
);
const {
  drawing,
  startDraw,
  cancelDraw,
  finishDraw,
  startDrawEvent,
  cancelDrawEvent,
  finishDrawEvent,
  drawToolStyleByOptions,
} = useDrawTool(props, emits, activeIds);

const { selectFeature, selectFeatureStyle, finishModify, startModify } =
  useModify(props, emits, featureWithCenters, activeIds, editing);

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
   * ### 功能描述
   * 触发绘制功能
   *
   * ### 调用示例
   * ```ts
   *         const markerLayer = ref<GduMarkerLayer>();
   *         markerLayer.value.startDraw({
   *           type: GeoFeatureType.Point,
   *           style: {
   *             theme: "brand", // 必填：样式主题（格式通常为 "主题名-色阶"）
   *             text: "POI标记", // 可选：标记上显示的文本
   *             textSize: 14, // 可选：文本大小（像素）
   *             visible: true, // 可选：是否可见（默认 true）
   *             iconSize: 32, // 必填：图标大小（像素）
   *             iconName: PointerType.Location, // 必填：图标名称（取自 PointerType 枚举）
   *           },
   *         });
   * ```
   */
  startDraw,
  /**
   * ### 功能描述
   * 触发取消绘制功能
   *
   * ### 调用示例
   * ```ts
   *         const markerLayer = ref<GduMarkerLayer>();
   *         markerLayer.value.cancelDraw();
   * ```
   */
  cancelDraw,
  /**
   * ### 功能描述
   * 强制完成绘制
   *
   * ### 调用示例
   * ```ts
   *         const markerLayer = ref<GduMarkerLayer>();
   *         markerLayer.value.finishDraw();
   * ```
   */
  finishDraw,
});
</script>
