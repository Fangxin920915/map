<!--
  GduRouteLayer 组件
  功能：航线图层组件，用于在地图上渲染完整的航线信息，包括转弯点、航线线条、脚点、航线区域和起飞点等

  主要组成部分：
  1. TurnPoints - 转弯点标记，显示航线中的各个转弯位置
  2. RouteLine - 航线线条，连接各个航点的路径线
  3. FootPoints - 脚点标记，仅在点类型项目中显示
  4. RouteArea - 航线区域，显示航线覆盖的区域范围
  5. GduTakeoffPointLayer - 起飞点图层，管理起飞点相关显示
-->
<template>
  <!-- 转弯点组件：渲染航线上的所有转弯点标记 -->
  <turn-points />

  <!-- 航线线条组：遍历所有航线组，每组包含多条按环绕点分组的航线段 -->
  <template v-for="(lineList, index) in lineListGroup" :key="index">
    <!-- 遍历当前航线组内的各条航线段 -->
    <template v-for="(linePoint, lineIndex) in lineList">
      <!-- 路线线条组件：仅当航线段包含航点时才渲染 -->
      <route-line
        v-if="linePoint.length > 0"
        :key="`${index}-${lineIndex}`"
        :line="linePoint"
        :surround-group-full-line="lineList"
        :surround-line-index="lineIndex"
        :group-index="index"
      />
    </template>
  </template>

  <!-- 脚点组件：仅在地图项目类型为点类型时显示 -->
  <foot-points v-if="props.type === RouteLayerType.MapProjectTypePoint" />

  <!-- 航线区域组件：渲染航线覆盖的区域范围 -->
  <route-area />

  <!-- 起飞点图层组件：管理起飞点的显示和相关配置 -->
  <gdu-takeoff-point-layer
    :view-id="props.viewId"
    :altitude-mode="props.altitudeMode"
    :lines="turnPointList"
    :active="false"
    :stroke-color="props.theme?.line?.strokeColor"
    :stroke-width="6"
    :clamp-to-ground="props.clampToGround"
    :takeoff-point="props.takeoffPoint"
    :takeoff-safe-height="props.takeoffSafeHeight"
    :takeoff-icon-visible="props.takeoffIconVisible"
  />
</template>

<script setup lang="ts">
import { groupWayPointBySurround, RouteLayerType } from "@gdu-gl/common";
import { defaultMapId } from "@map/Types";
import { computed } from "vue";
import { GduTakeoffPointLayer } from "@map/Components";
import TurnPoints from "./components/TurnPoints.vue";
import RouteLine from "./components/RouteLine.vue";
import FootPoints from "./components/FootPoints.vue";
import RouteArea from "./components/RouteArea.vue";
import { defaultRouteLayerProps, RouteLayerProps } from "./props";
import { useProvideRouteProps } from "./hooks/useProvideRouteProps";

/**
 * 定义组件 Props
 * 包含航线图层的所有配置项，如主题样式、航线数据、消息配置、视图ID等
 * 使用 withDefaults 为 props 设置默认值
 */
const props = withDefaults(defineProps<RouteLayerProps>(), {
  ...defaultRouteLayerProps,
  theme: () => defaultRouteLayerProps.theme,
  lines: () => defaultRouteLayerProps.lines,
  message: () => defaultRouteLayerProps.message,
  viewId: defaultMapId,
});

/**
 * 使用路由 Props Hook
 * 该 Hook 会处理 props 数据并提供转换后的转弯点列表
 * 同时会将处理后的数据通过 provide 注入给子组件使用
 */
const { turnPointList } = useProvideRouteProps(props);

/**
 * 计算属性：航线分组列表
 * 将转弯点列表按照环绕点（surround）进行分组
 * 每个航线组可能包含多条航线段，用于处理环绕飞行等复杂航线结构
 *
 * @returns 返回一个二维数组，第一维是航线组，第二维是按环绕点分组的航线段
 */
const lineListGroup = computed(() => {
  return turnPointList.value.map((list) => groupWayPointBySurround(list));
});
</script>
