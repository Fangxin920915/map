<template>
  <gdu-vector-layer v-if="!isEmpty(props.coordinates)" :view-id="props.viewId">
    <gdu-point
      v-model:coordinates="modifyPoint!"
      :name="props.layerId"
      :enable-modify="true"
      :modify-type="modifyType"
      :feature-properties="turnFeatureInfo"
      v-bind="props.pointStyle"
      @mouse-enter="mouseEnter"
      @mouse-leave="mouseLeave"
      @modify-start="modifyStart"
      @modify-end="modifyEnd"
    />
    <gdu-point
      :coordinates="modifyPoint!"
      :disable-depth-test-distance="0"
      clamp-to-ground
      :shape-size="10"
      :shape-outline-width="0"
      shape-fill-color="rgba(255,255,255,0.5)"
      :visible="!props.clampToGround"
    />
    <gdu-line-string
      :coordinates="modifyLineString"
      stroke-color="rgba(255,255,255,0.5)"
      :stroke-outline-width="0"
      :line-dash="dashLength"
      :stroke-width="1"
    />
  </gdu-vector-layer>
  <gdu-popup
    v-if="!editing && showModifyPopup && modifyPoint"
    :view-id="props.viewId"
    :coordinates="modifyPoint as PointCoordinates"
    :position="PopupPosition.CENTER_LEFT"
    :offset="offset"
  >
    <route-edit-popup-content
      :message="props.message"
      :show-vertical-modify-popup="!props.clampToGround"
    />
  </gdu-popup>
</template>

<script setup lang="ts">
import {
  GduLineString,
  GduPoint,
  GduPopup,
  GduVectorLayer,
} from "@map/Components";
import { defaultMapId } from "@map/Types";
import { computed, ref, toRaw, watch } from "vue";
import {
  isValidCoordinates,
  LineStringCoordinates,
  PointCoordinates,
  PopupPosition,
  RoutePointType,
  uuid,
} from "@gdu-gl/common";
import { cloneDeep, isEmpty } from "lodash-es";
import { mapViewInternal } from "@gdu-gl/core";
import RouteEditPopupContent from "@map/Components/Layers/RouteLayer/GduRouteEditLayer/common/components/RouteEditPopupContent.vue";
import {
  EditPointToolProps,
  defaultEditPointProps,
  EditPointToolEmits,
} from "./props";

const props = withDefaults(defineProps<EditPointToolProps>(), {
  layerId: () => uuid(),
  viewId: defaultMapId,
  message: () => defaultEditPointProps.message,
  pointStyle: () => defaultEditPointProps.pointStyle,
  altPress: defaultEditPointProps.altPress,
});

const emits = defineEmits<EditPointToolEmits>();

const dashLength = [10, 4];

const offset = [30, 0];

const viewer = mapViewInternal.getViewer(props.viewId)!;

const editing = ref(false);

const showModifyPopup = ref(false);

const modifyPoint = ref<PointCoordinates | null>(null);

let recordModifyType = "";

let recordHeight = 0;

const modifyType = computed(() => {
  if (props.altPress) {
    return "vertical";
  }
  return "horizontal";
});

const turnFeatureInfo = computed(() => {
  return {
    ...props.featureId,
    type: RoutePointType.TURN,
  };
});

const modifyLineString = computed(() => {
  const line = [] as LineStringCoordinates;
  if (isEmpty(modifyPoint.value)) {
    return line;
  }
  const groundHeight =
    viewer.mapProviderDelegate.mapProvider?.queryAltitudes?.getHeight(
      modifyPoint.value!,
    ) ?? 0;
  line.push(toRaw(modifyPoint.value!), [
    modifyPoint.value![0],
    modifyPoint.value![1],
    groundHeight,
  ]);
  return line;
});

watch(
  () => props.coordinates,
  (newValue) => {
    try {
      const point = isValidCoordinates(newValue);
      modifyPoint.value = cloneDeep(point);
    } catch (e) {
      modifyPoint.value = null;
    }
  },
  {
    immediate: true,
    deep: true,
  },
);

function mouseEnter() {
  showModifyPopup.value = true;
}

function mouseLeave() {
  showModifyPopup.value = false;
}

function modifyStart() {
  editing.value = true;
  recordModifyType = toRaw(modifyType.value);
  recordHeight = modifyPoint.value![2] ?? 0;
  emits("modifyStart");
}

function modifyEnd() {
  editing.value = false;
  if (recordModifyType === "vertical") {
    emits("modifyEnd", modifyPoint.value!);
  } else if (["horizontal", "ground"].includes(recordModifyType)) {
    emits("modifyEnd", [
      modifyPoint.value![0],
      modifyPoint.value![1],
      recordHeight,
    ]);
  }
}
</script>
