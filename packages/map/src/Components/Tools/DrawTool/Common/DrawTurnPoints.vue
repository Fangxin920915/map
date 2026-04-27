<template>
  <gdu-point
    v-for="(coordinates, index) in props.turnPoints"
    :key="index"
    :coordinates="coordinates"
    :icon-height="16"
    :icon-width="17"
    :icon-src="getDrawingIcon(index)"
    :name="props.layerId!"
    clamp-to-ground
    :feature-properties="index"
    @click="emits('click', index)"
  />
  <delete-popup
    v-if="turnPoints.length"
    :view-id="props.viewId"
    visible
    :coordinates="turnPoints[turnPoints.length - 1]"
    clamp-to-ground
    :message="props.message"
    :offset="deletePopupOffset"
    @click="emits('delete')"
  />
</template>

<script setup lang="ts">
import { deletePopupOffset } from "@map/Constants";
import DeletePopup from "@map/Components/Common/DeletePopup.vue";
import { GduPoint } from "@map/Components";
import { LineStringCoordinates } from "@gdu-gl/common";
import { useDrawIcon } from "../Hooks/useDrawIcon";
import { CommonDrawProps } from "./CommonProps";

interface Props extends CommonDrawProps {
  turnPoints: LineStringCoordinates;
  isPolygon?: boolean;
}
const props = defineProps<Props>();

const { footPoint, finishPointIcon } = useDrawIcon(props);

const emits = defineEmits<{
  (e: "click", index: number): void;
  (e: "delete"): void;
}>();

/**
 * 获取绘制状态下点的图标
 * @param index - 点的索引
 * @returns 包含图标名称和图标的对象
 */
function getDrawingIcon(index: number) {
  // 获取正常状态下的垂足点图标
  const { normal, select } = footPoint.value;
  const { length } = props.turnPoints;
  const count = props.isPolygon ? 2 : 1;
  if (length <= count && index === length - 1) {
    return select;
  }
  // 若编辑面线数组长度大于 2 且点击的是最后一个点，返回结束点图标
  if (length > count && index === length - 1) {
    return finishPointIcon.value;
  }
  // 否则返回正常状态的图标
  return normal;
}
</script>
