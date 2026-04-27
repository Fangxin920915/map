<template>
  <template v-if="props.selected">
    <template v-for="(point, index) in lineStringPoints" :key="index">
      <gdu-point
        :coordinates="point"
        v-bind="getPointStyle(index)"
        clamp-to-ground
        :disable-depth-test-distance="Number.POSITIVE_INFINITY"
        @modify-start="startModifyPoint(getTurnNameByIndex(index))"
        @modifying="modifyingPoint(index, $event)"
        @modify-end="endModifyPoint"
        @click="clickPoint(index)"
      />
      <gdu-point
        v-if="isPointSelectedByIndex(index) || isLastPointDrawing(index)"
        :name="getDeleteNameByIndex(index)"
        :coordinates="point"
        v-bind="getDeletePointStyle(getDeleteNameByIndex(index))"
        shape-type="none"
        clamp-to-ground
        :disable-depth-test-distance="Number.POSITIVE_INFINITY"
        @click="deletePoint(index)"
      />
    </template>
  </template>
  <template
    v-if="props.measureStatus === MeasureStatus.MeasureEnd && props.selected"
  >
    <gdu-point
      v-for="({ center }, index) in props.centerPoints"
      :key="index"
      :name="getInsertNameByIndex(index)"
      :coordinates="center"
      v-bind="getInsertPointStyle(getInsertNameByIndex(index))"
      :disable-depth-test-distance="Number.POSITIVE_INFINITY"
      clamp-to-ground
      @click="insertPoint(index, center)"
    />
  </template>
</template>

<script setup lang="ts">
import { GduPoint } from "@map/Components";
import {
  PointCoordinates,
  MeasureStatus,
  MeasureType,
  LineStringCoordinates,
  ModifyType,
} from "@gdu-gl/common";
import { computed, toRaw } from "vue";
import { useAddMapIconsBySvg } from "../hooks/useAddMapIconsBySvg";
import { MeasureLayerProps, MeasureLayerEmits } from "../props";
import { useFeatureName } from "../hooks/useFeatureName";

interface Props extends MeasureLayerProps {
  type: MeasureType;
  centerPoints: Array<{ center: PointCoordinates }>;
  coordinates: LineStringCoordinates;
}
const props = defineProps<Props>();
const emits = defineEmits<MeasureLayerEmits>();

const commonStyle = {
  iconWidth: 18,
  iconHeight: 17,
};

const {
  insertionPointIcon,
  deletePointIcon,
  turningPointIcon,
  finishPointIcon,
} = useAddMapIconsBySvg(props);

const {
  getDeleteNameByIndex,
  getTurnNameByIndex,
  getFinishNameByIndex,
  getInsertNameByIndex,
} = useFeatureName(props);

const lineStringPoints = computed(() => {
  const { length } = props.coordinates;
  if (props.measureStatus !== MeasureStatus.MeasureEnd) {
    return props.coordinates.slice(0, length - 1);
  }
  return props.coordinates;
});

/**
 * 转折点是否被选中
 * @param index
 */
function isPointSelectedByIndex(index: number) {
  return (
    props.measureStatus === MeasureStatus.MeasureEnd &&
    props.selectedId === getTurnNameByIndex(index)
  );
}

/**
 * 是否是最后一个完成点，如果是展示删除按钮
 * @param index
 */
function isLastPointDrawing(index: number) {
  return (
    props.measureStatus !== MeasureStatus.MeasureEnd &&
    index === lineStringPoints.value.length - 1
  );
}

function getInsertPointStyle(name: string) {
  return {
    ...commonStyle,
    iconSrc:
      props.hoverId === name
        ? toRaw(insertionPointIcon.value.hover)
        : toRaw(insertionPointIcon.value.normal),
  };
}

function getDeletePointStyle(name: string) {
  return {
    iconWidth: 20,
    iconHeight: 20,
    iconSrc:
      props.hoverId === name
        ? toRaw(deletePointIcon.value.hover)
        : toRaw(deletePointIcon.value.normal),
    offset: [22, 0] as [number, number],
  };
}

function getPointStyle(index: number) {
  const lastIndex = props.type === MeasureType.Area ? 1 : 0;
  const isFinishPoint = index > lastIndex && isLastPointDrawing(index);
  if (isFinishPoint) {
    const name = getFinishNameByIndex(index);
    const { hover, normal } = toRaw(finishPointIcon.value);
    return {
      ...commonStyle,
      name,
      iconSrc: name === props.hoverId ? hover : normal,
    };
  }
  const name = getTurnNameByIndex(index);
  const { hover, normal, select } = toRaw(turningPointIcon.value);
  const turnPointStyle = {
    ...commonStyle,
    name,
    iconSrc: normal,
  };
  if (
    props.type === MeasureType.Distance &&
    index === 0 &&
    isLastPointDrawing(index)
  ) {
    turnPointStyle.iconSrc = select;
    return turnPointStyle;
  }
  if (
    props.type === MeasureType.Area &&
    index <= 1 &&
    isLastPointDrawing(index)
  ) {
    turnPointStyle.iconSrc = select;
    return turnPointStyle;
  }
  Object.assign(turnPointStyle, {
    enableModify: props.measureStatus === MeasureStatus.MeasureEnd,
    modifyType: "ground" as ModifyType,
  });
  if (name === props.selectedId) {
    turnPointStyle.iconSrc = select;
  } else if (name === props.hoverId) {
    turnPointStyle.iconSrc = hover;
  }
  return turnPointStyle;
}

function insertPoint(index: number, point: PointCoordinates) {
  const arr = [...toRaw(props.coordinates)];
  arr.splice(index + 1, 0, point);
  emits("insertPoint", arr);
}

function clickPoint(index: number) {
  if (
    index === lineStringPoints.value.length - 1 &&
    props.measureStatus !== MeasureStatus.MeasureEnd
  ) {
    emits("finish");
  }
}

function startModifyPoint(name: string) {
  emits("startModifyPoint", name);
}

function modifyingPoint(index: number, position: PointCoordinates) {
  const arr = [...toRaw(props.coordinates)];
  arr[index] = position;
  emits("modifyingPoint", arr);
}

function endModifyPoint() {
  emits("endModifyPoint");
}

function removeResult() {
  emits("remove");
}

function deletePoint(index: number) {
  const arr = props.coordinates.filter((_, i) => i !== index);
  if (arr.length > 1) {
    emits("deletePoint", arr);
  } else {
    removeResult();
  }
}
</script>
