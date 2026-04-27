<template>
  <gdu-vector-layer :view-id="props.viewId">
    <gdu-polygon
      v-if="!isEmpty(modifyPolygon)"
      :coordinates="modifyPolygon"
      v-bind="polygonStyle"
      :name="props.layerId"
      :feature-properties="props.featureId"
      clamp-to-ground
      @click="refreshId"
    />
    <gdu-wall
      v-if="props.wallStyle && !isEmpty(modifyPolygon[0])"
      v-bind="props.wallStyle"
      :coordinates="modifyPolygon[0]"
      :name="props.layerId"
      :feature-properties="props.featureId"
      @click="refreshId"
    />
    <EditTurnPoints
      ref="editTurnPoints"
      v-model:points="modifyLine"
      :layer-id="props.layerId"
      :view-id="props.viewId"
      :message="props.message"
      :turn-point-style="props.turnPointStyle"
      :is-polygon="true"
      :feature-id="props.featureId"
      :is-polygon-self-intersecting="isPolygonSelfIntersecting"
      @start="onModifyStart"
      @finish="onModifyEnd"
    />
  </gdu-vector-layer>
</template>

<script setup lang="ts">
import {
  uuid,
  isValidPolygon,
  LineStringCoordinates,
  isTransparentColor,
} from "@gdu-gl/common";
import { defaultMapId } from "@map/Types";
import { computed, ref, toRaw, useTemplateRef, watch } from "vue";

import { cloneDeep, isEmpty } from "lodash-es";
import { GduPolygon, GduVectorLayer, GduWall } from "@map/Components";
import * as turf from "@turf/turf";
import EditTurnPoints from "../Common/EditTurnPoints.vue";
import {
  defaultEditPolygonProps,
  EditPolygonToolProps,
  EditPolygonToolEmits,
} from "./props";

const props = withDefaults(defineProps<EditPolygonToolProps>(), {
  layerId: () => uuid(),
  viewId: defaultMapId,
  lineStringStyle: () => defaultEditPolygonProps.polygonStyle,
  turnPointStyle: () => defaultEditPolygonProps.turnPointStyle,
  errorColor: () => defaultEditPolygonProps.errorColor,
  message: () => defaultEditPolygonProps.message,
  coordinates: () => defaultEditPolygonProps.coordinates,
});

const emits = defineEmits<EditPolygonToolEmits>();

const editRef = useTemplateRef("editTurnPoints");

const modifyLine = ref<LineStringCoordinates>([]);

const copyModifyLine = ref<LineStringCoordinates>([]);

const modifyPolygon = computed(() => {
  if (isEmpty(modifyLine.value)) {
    return [];
  }
  return [toRaw(modifyLine.value)];
});

const isPolygonSelfIntersecting = computed(() => {
  if (!isEmpty(modifyPolygon.value)) {
    const { length } = turf.kinks(
      turf.polygon(modifyPolygon.value as number[][][]),
    ).features;
    return length > 0;
  }
  return false;
});

const polygonStyle = computed(() => {
  if (isPolygonSelfIntersecting.value) {
    const isTransparent = isTransparentColor(
      props.polygonStyle?.strokeGapColor,
    );
    return {
      ...props.polygonStyle,
      strokeColor: props.errorColor,
      fillColor: "rgba(0,0,0,0)",
      strokeGapColor: isTransparent ? "transparent" : props.errorColor,
    };
  }
  return props.polygonStyle;
});

watch(
  () => props.coordinates,
  (newVal) => {
    try {
      const polygon = isValidPolygon(newVal);
      modifyLine.value = cloneDeep(polygon[0] ?? []);
    } catch (error) {
      modifyLine.value = [];
    }
  },
  {
    immediate: true,
    deep: true,
  },
);

function onModifyStart() {
  copyModifyLine.value = cloneDeep(toRaw(modifyLine.value));
  emits("modifyStart");
}

function onModifyEnd(line: LineStringCoordinates) {
  if (isPolygonSelfIntersecting.value) {
    modifyLine.value = copyModifyLine.value;
    emits("modifyEnd", [toRaw(modifyLine.value)]);
    return;
  }

  if (isEmpty(line)) {
    emits("modifyEnd", []);
  } else {
    emits("modifyEnd", [line]);
  }
}

function refreshId() {
  editRef.value?.refreshId();
}

defineExpose({ refreshId });
</script>
