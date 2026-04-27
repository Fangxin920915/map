<template>
  <slot />
</template>

<script setup lang="ts">
import { defaultMapId } from "@map/Types";
import {
  ClusterLayerEmits,
  ClusterLayerProps,
  defaultClusterLayerProps,
} from "./props";
import { useCluster } from "./hooks/useCluster";
import { useClusterRenderer } from "./hooks/useClusterRenderer";

const props = withDefaults(defineProps<ClusterLayerProps>(), {
  ...defaultClusterLayerProps,
  viewId: defaultMapId,
  data: () => defaultClusterLayerProps.data,
});

const emits = defineEmits<ClusterLayerEmits>();

const { clusters, expandCluster, getClusterLeaves, getClusterExpansionZoom } =
  useCluster(props);

useClusterRenderer(props, emits, clusters, expandCluster);

defineExpose({
  /**
   * 获取聚合点展开需要的缩放层级
   * @param clusterId 聚合点 ID（从 clickCluster 事件获取）
   */
  getClusterExpansionZoom,
  /** 手动触发飞入展开某个聚合点 */
  expandCluster,
  /** 按需获取聚合点包含的叶子数据 */
  getClusterLeaves,
});
</script>
