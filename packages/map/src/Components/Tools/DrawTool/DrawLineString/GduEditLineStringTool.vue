<template>
  <GduVectorLayer :view-id="props.viewId">
    <gdu-line-string
      v-if="!isEmpty(modifyLine)"
      :coordinates="modifyLine"
      v-bind="props.lineStringStyle"
      :feature-properties="props.featureId"
      :name="props.layerId"
      clamp-to-ground
      @click="refreshId"
    />
    <EditTurnPoints
      ref="editTurnPoints"
      v-model:points="modifyLine"
      :layer-id="props.layerId"
      :view-id="props.viewId"
      :message="props.message"
      :turn-point-style="props.turnPointStyle"
      :is-polygon="false"
      :feature-id="props.featureId"
      @start="onModifyStart"
      @finish="onModifyEnd"
    />
  </GduVectorLayer>
</template>

<script setup lang="ts">
import { uuid, LineStringCoordinates } from "@gdu-gl/common";
import { defaultMapId } from "@map/Types";
import { ref, useTemplateRef, watch } from "vue";
import { cloneDeep, isEmpty } from "lodash-es";
import { GduLineString, GduVectorLayer } from "@map/Components";
import EditTurnPoints from "../Common/EditTurnPoints.vue";
import {
  defaultEditLineStringProps,
  EditLineStringToolEmits,
  EditLineStringToolProps,
} from "./props";

const props = withDefaults(defineProps<EditLineStringToolProps>(), {
  layerId: () => uuid(),
  viewId: defaultMapId,
  lineStringStyle: () => defaultEditLineStringProps.lineStringStyle,
  turnPointStyle: () => defaultEditLineStringProps.turnPointStyle,
  message: () => defaultEditLineStringProps.message,
  coordinates: () => defaultEditLineStringProps.coordinates,
});

const emits = defineEmits<EditLineStringToolEmits>();

const modifyLine = ref<LineStringCoordinates>([]);

const editRef = useTemplateRef("editTurnPoints");

watch(
  () => props.coordinates,
  (newVal) => {
    modifyLine.value = cloneDeep(newVal);
  },
  {
    immediate: true,
    deep: true,
  },
);

function onModifyStart() {
  emits("modifyStart");
}

function onModifyEnd(line: LineStringCoordinates) {
  if (isEmpty(line)) {
    emits("modifyEnd", []);
  } else {
    emits("modifyEnd", line);
  }
}

function refreshId() {
  editRef.value?.refreshId();
}

defineExpose({ refreshId });
</script>
