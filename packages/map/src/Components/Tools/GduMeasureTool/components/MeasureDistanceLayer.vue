<template>
  <ModifyPointsLayer
    v-bind="props"
    :type="MeasureType.Distance"
    :center-points="lineDistanceResults"
    @finish="emits('finish')"
    @remove="remove"
    @delete-point="emits('deletePoint', $event)"
    @insert-point="emits('insertPoint', $event)"
    @start-modify-point="emits('startModifyPoint', $event)"
    @end-modify-point="emits('endModifyPoint')"
    @modifying-point="emits('modifyingPoint', $event)"
  />
  <gdu-popup
    v-for="({ distance, center }, index) in lineDistanceResults"
    :key="index"
    :view-id="props.viewId"
    :coordinates="center"
    clamp-to-ground
    :position="PopupPosition.BOTTOM_CENTER"
    :offset="popupOffset"
  >
    <div class="gdu-measure-distance-layer-popup">
      {{ getDistanceLabel(distance) }}
    </div>
  </gdu-popup>
  <gdu-popup
    v-if="
      props.coordinates.length > 1 &&
      props.measureStatus === MeasureStatus.MeasureEnd
    "
    :view-id="props.viewId"
    clamp-to-ground
    :coordinates="props.coordinates[props.coordinates.length - 1]"
    :position="PopupPosition.BOTTOM_CENTER"
    :offset="popupOffset"
  >
    <div class="gdu-measure-distance-layer-popup">
      {{ getDistanceLabel(props.result) }}
      <i @click="emits('remove')"></i>
    </div>
  </gdu-popup>
  <gdu-line-string
    v-if="props.coordinates.length >= 2"
    v-bind="getLineStyle()"
    :name="lineStringId"
    :coordinates="props.coordinates"
    clamp-to-ground
    @click="emits('select')"
  />
</template>

<script setup lang="ts">
import { GduLineString, GduPopup } from "@map/Components";
import {
  PointCoordinates,
  PopupPosition,
  MeasureStatus,
  MeasureType,
} from "@gdu-gl/common";
import { computed } from "vue";
import * as turf from "@turf/turf";
import { useFeatureName } from "../hooks/useFeatureName";
import ModifyPointsLayer from "./ModifyPointsLayer.vue";
import {
  MeasureLayerProps,
  MeasureTypeLayerEmits,
  defaultMeasureToolProps,
} from "../props";
import { getDistanceLabel } from "../utils";

const props = defineProps<MeasureLayerProps>();
const emits = defineEmits<MeasureTypeLayerEmits>();

const popupOffset = [0, -12];

const { lineStringId } = useFeatureName(props);

// const labelStyle = computed(() => {
//   return {
//     textBackgroundColor: props.labelStyle?.fillColor,
//     textBackgroundBorderColor: props.labelStyle?.outlineColor,
//     textColor: props.labelStyle?.textColor,
//     textBackgroundBorderWidth: 1,
//     textBackgroundPadding: [8, 3] as [number, number],
//     textBackgroundRadius: 6,
//     textSize: 12,
//     textOffset: [0, -20],
//   };
// });

const lineDistanceResults = computed(() => {
  const results: Array<{ distance: number; center: PointCoordinates }> = [];
  for (let i = 0; i < props.coordinates.length - 1; i++) {
    const nextPoint = turf.point(props.coordinates[i + 1] as number[]);
    const currentPoint = turf.point(props.coordinates[i] as number[]);
    const distance = turf.distance(currentPoint, nextPoint);

    let center = turf.midpoint(currentPoint, nextPoint).geometry
      .coordinates as PointCoordinates;
    if (
      props.measureStatus !== MeasureStatus.MeasureEnd &&
      i === props.coordinates.length - 2
    ) {
      center = nextPoint.geometry.coordinates as PointCoordinates;
    }

    results.push({
      distance,
      center,
    });
  }
  return results;
});

function remove() {
  if (props.measureStatus !== MeasureStatus.MeasureEnd) {
    emits("cancelDrawing");
  }
  emits("remove");
}

function getLineStyle() {
  const { select, hover, normal } =
    props.lineStyle ?? defaultMeasureToolProps.lineStyle;
  if (props.selected) {
    return select;
  }
  if (lineStringId.value === props.hoverId) {
    return hover;
  }
  return normal;
}
</script>
