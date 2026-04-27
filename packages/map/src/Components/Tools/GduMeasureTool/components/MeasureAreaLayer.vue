<template>
  <ModifyPointsLayer
    v-bind="props"
    :type="MeasureType.Area"
    :coordinates="polygonOutline"
    :center-points="centerPoints"
    @finish="emits('finish')"
    @remove="remove"
    @delete-point="deletePoint"
    @insert-point="insertPoint"
    @start-modify-point="emits('startModifyPoint', $event)"
    @end-modify-point="emits('endModifyPoint')"
    @modifying-point="modifyPoint"
  />
  <gdu-popup
    v-if="areaCenter"
    :view-id="props.viewId"
    :coordinates="areaCenter as PointCoordinates"
    :position="PopupPosition.BOTTOM_CENTER"
    clamp-to-ground
  >
    <div class="gdu-measure-distance-layer-popup">
      {{ getAreaLabel(props.result) }}
      <i
        v-if="props.measureStatus === MeasureStatus.MeasureEnd"
        @click="emits('remove')"
      ></i>
    </div>
  </gdu-popup>

  <gdu-polygon
    v-if="
      !isEmpty(featureCoordinates) &&
      !isEmpty(featureCoordinates[0]) &&
      Array.isArray(featureCoordinates[0][0])
    "
    :name="polygonId"
    v-bind="getAreaStyle()"
    :coordinates="featureCoordinates as PolygonCoordinates"
    clamp-to-ground
    @click="emits('select')"
  />
  <gdu-line-string
    v-else-if="!isEmpty(featureCoordinates) && featureCoordinates.length > 1"
    v-bind="getLineStyle()"
    :name="polygonId"
    :coordinates="props.coordinates"
    clamp-to-ground
  />
</template>

<script setup lang="ts">
import {
  LineStringCoordinates,
  PointCoordinates,
  PolygonCoordinates,
  PopupPosition,
  MeasureStatus,
  MeasureType,
  getGroundPolygonCenter,
} from "@gdu-gl/common";
import { computed } from "vue";
import { isEmpty } from "lodash-es";
import * as turf from "@turf/turf";
import {
  defaultMeasureToolProps,
  GduLineString,
  GduPolygon,
  GduPopup,
} from "@map/Components";
import { getAreaLabel } from "@map/Components/Tools/GduMeasureTool/utils";
import ModifyPointsLayer from "./ModifyPointsLayer.vue";
import { MeasureLayerProps, MeasureTypeLayerEmits } from "../props";
import { useFeatureName } from "../hooks/useFeatureName";

const props = defineProps<MeasureLayerProps>();
const emits = defineEmits<MeasureTypeLayerEmits>();

const { polygonId } = useFeatureName(props);

const featureCoordinates = computed(() => {
  if (props.coordinates && props.coordinates.length > 3) {
    return [props.coordinates];
  }
  if (props.coordinates && props.coordinates.length > 1) {
    return props.coordinates;
  }
  return [];
});

const areaCenter = computed(() => {
  if (props.coordinates && props.coordinates.length > 3) {
    return getGroundPolygonCenter([props.coordinates]);
  }
  return null;
});

const polygonOutline = computed<LineStringCoordinates>(() => {
  if (!isEmpty(props.coordinates)) {
    const { length } = props.coordinates;
    return props.coordinates.slice(0, length > 3 ? length - 1 : length);
  }
  return [];
});

const centerPoints = computed(() => {
  const results: Array<{ center: PointCoordinates }> = [];
  for (let i = 0; i < props.coordinates.length - 1; i++) {
    const nextPoint = turf.point(props.coordinates[i + 1] as number[]);
    const currentPoint = turf.point(props.coordinates[i] as number[]);

    let center = turf.midpoint(currentPoint, nextPoint).geometry
      .coordinates as PointCoordinates;
    if (
      props.measureStatus !== MeasureStatus.MeasureEnd &&
      i === props.coordinates.length - 2
    ) {
      center = nextPoint.geometry.coordinates as PointCoordinates;
    }

    results.push({
      center,
    });
  }
  return results;
});

function deletePoint(line: LineStringCoordinates) {
  if (line.length > 2) {
    const arr = line.concat([line[0]]);
    emits("deletePoint", arr);
  } else if (
    line.length > 1 &&
    props.measureStatus !== MeasureStatus.MeasureEnd
  ) {
    emits("deletePoint", line);
  } else {
    emits("deletePoint", []);
    emits("remove");
  }
}

function insertPoint(line: LineStringCoordinates) {
  const arr = line.concat([line[0]]);
  emits("insertPoint", arr);
}

function modifyPoint(line: LineStringCoordinates) {
  const arr = line.concat([line[0]]);
  emits("modifyingPoint", arr);
}

function remove() {
  if (props.measureStatus !== MeasureStatus.MeasureEnd) {
    emits("cancelDrawing");
  }
  emits("remove");
}

function getAreaStyle() {
  const { select, hover, normal } =
    props.polygonStyle ?? defaultMeasureToolProps.polygonStyle;
  if (props.selected) {
    return select;
  }
  if (polygonId.value === props.hoverId) {
    return hover;
  }
  return normal;
}

function getLineStyle() {
  const { select, hover, normal } =
    props.polygonStyle ?? defaultMeasureToolProps.polygonStyle;
  if (props.selected) {
    const { fillColor, ...other } = select ?? {};
    return other;
  }
  if (polygonId.value === props.hoverId) {
    const { fillColor, ...other } = hover;
    return other;
  }
  const { fillColor, ...other } = normal;
  return other;
}
</script>
