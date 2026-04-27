<template>
  <gdu-map :viewId="viewId" />
</template>

<script setup>
import { ref } from "vue";
import { GduMap } from "@gdu-gl/map";
import { uuid } from "@gdu-gl/common";

/**
 * 视图唯一标识符
 * 每个地图实例需要唯一的 viewId
 */
const viewId = ref(uuid());
</script>

