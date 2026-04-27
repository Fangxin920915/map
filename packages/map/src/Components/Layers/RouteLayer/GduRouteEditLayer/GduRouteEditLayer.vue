<template>
  <template v-if="typeCopy !== -1">
    <gdu-way-point-edit
      v-if="wayPointTypes.includes(typeCopy)"
      v-bind="commonProps"
      ref="editRef"
      :line="wayPointLine"
      @changed="changed"
      @takeoff-changed="emits('takeoffChanged', $event)"
      @start-modify="startModify"
      @update:select="emits('update:select', $event)"
    >
      <template #wayPoint="scope">
        <slot name="wayPoint" v-bind="scope"></slot>
      </template>
    </gdu-way-point-edit>
    <gdu-route-area-edit
      v-else-if="areaEditTypes.includes(typeCopy)"
      v-bind="commonProps"
      ref="editRef"
      :area="props.area"
      @changed="changed"
      @takeoff-changed="emits('takeoffChanged', $event)"
      @start-draw="emits('startDraw')"
      @start-modify="startModify"
      @update:select="emits('update:select', $event)"
    />
    <gdu-ai-route-edit
      v-else-if="multiAreaTypes.includes(typeCopy)"
      v-bind="commonProps"
      ref="editRef"
      :area="props.area"
      @changed="changed"
      @takeoff-changed="emits('takeoffChanged', $event)"
      @start-draw="emits('startDraw')"
      @start-modify="startModify"
      @update:select="emits('update:select', $event)"
    />
  </template>
</template>

<script setup lang="ts">
import {
  uuid,
  RouteLayerType,
  AltitudeMode,
  LinePointAction,
  getHeightByMode,
  RouterEditChangeParams,
} from "@gdu-gl/common";
import { defaultMapId } from "@map/Types";
import { computed, nextTick, ref, watch, useTemplateRef } from "vue";
import { isEmpty } from "lodash-es";
import { getLinePointHeightByMode } from "@map/Utils";
import { AiRouteModifyParams, GduAiRouteEdit } from "./AiRouteEdit";
import { GduRouteAreaEdit, RouteAreaModifyParams } from "./RouteAreaEdit";
import {
  GduWayPointEdit,
  WayPointChangedParams,
  WayPointModifyParams,
} from "./WayPointEdit";
import {
  defaultRouteEditLayerProps,
  RouteEditLayerEmits,
  RouteEditLayerProps,
  WayPointSlotProps,
} from "./props";
import {
  areaEditTypes,
  multiAreaTypes,
  wayPointTypes,
} from "./common/types/EventCommonParams";

/**
 * 定义组件的 props，并设置默认值
 * 除了使用默认的路由编辑图层属性外，还对部分属性进行了特殊处理
 * layerId 使用 uuid 生成唯一标识
 * theme、line、area 通过函数返回默认值，避免引用类型的默认值被共享
 * viewId 使用默认的地图 ID
 */
const props = withDefaults(defineProps<RouteEditLayerProps>(), {
  ...defaultRouteEditLayerProps,
  layerId: uuid(),
  theme: () => defaultRouteEditLayerProps.theme,
  lines: () => defaultRouteEditLayerProps.lines,
  area: () => defaultRouteEditLayerProps.area,
  viewId: defaultMapId,
  message: () => defaultRouteEditLayerProps.message,
  select: () => defaultRouteEditLayerProps.select,
});

const emits = defineEmits<RouteEditLayerEmits>();

defineSlots<WayPointSlotProps>();

const wayPointLine = computed(() => {
  return isEmpty(props.lines) ? [] : props.lines[0];
});

const typeCopy = ref<RouteLayerType | number>(props.type);

const editRef = useTemplateRef("editRef");

const commonProps = computed(() => {
  const { area, type, ...other } = props;
  return other;
});

watch(
  () => props.type,
  (val) => {
    typeCopy.value = -1;
    nextTick(() => {
      typeCopy.value = val;
    });
  },
);

function changed(params: RouterEditChangeParams) {
  if (wayPointTypes.includes(props.type)) {
    const { line, ...other } = params as WayPointChangedParams;
    emits("changed", {
      parentsIdx: 0,
      lines: [line],
      ...other,
    });
  } else if (areaEditTypes.includes(props.type)) {
    emits("changed", {
      parentsIdx: -1,
      ...params,
    });
  } else if (multiAreaTypes.includes(props.type)) {
    emits("changed", {
      ...params,
    });
  }
}

function startModify(
  params: RouteAreaModifyParams | WayPointModifyParams | AiRouteModifyParams,
) {
  if (wayPointTypes.includes(props.type)) {
    const { line, idx } = params as WayPointModifyParams;
    emits("startModify", {
      parentsIdx: 0,
      lines: [line],
      idx: idx!,
    });
  } else if (areaEditTypes.includes(props.type)) {
    const { area, idx } = params as RouteAreaModifyParams;
    emits("startModify", {
      idx: idx!,
      area,
    });
  } else if (multiAreaTypes.includes(props.type)) {
    const { area, parentsIdx, idx } = params as AiRouteModifyParams;
    emits("startModify", {
      area,
      parentsIdx,
      idx,
    } as AiRouteModifyParams);
  }
}

function resetTakeoffPoint() {
  nextTick(() => {
    editRef.value?.resetTakeoff();
  });
}

function keepRouteElevationByAltitudeMode(
  mode: AltitudeMode,
): LinePointAction[][] {
  if (![...wayPointTypes, ...areaEditTypes].includes(typeCopy.value)) {
    console.warn("不支持的航线类型，直接返回原始航线数据");
    return props.lines;
  }
  return props.lines.map((line) => {
    return line.map((point) => {
      const { coordinates, elevationHeight, relativeHeight } = getHeightByMode({
        mode: props.altitudeMode!,
        takeoffPoint: props.takeoffPoint!,
        height: point.height,
        coordinates: point.coordinates,
      });
      return {
        ...point,
        height: getLinePointHeightByMode(mode, relativeHeight, elevationHeight),
        coordinates,
      };
    });
  });
}

defineExpose({
  /**
   * 保持当前点的海拔高度,仅支持航点模式
   * ### 入参
   * - **mode**  高度模式
   *
   * ### 返回值 保持航点椭球高不变的情况下，海拔高度或者相对高航线数据
   */
  keepRouteElevationByAltitudeMode,
  /**
   * 重新设置起飞点,调用这个方法后，鼠标点击地图会重新设置起飞点
   */
  resetTakeoffPoint,
});
</script>
