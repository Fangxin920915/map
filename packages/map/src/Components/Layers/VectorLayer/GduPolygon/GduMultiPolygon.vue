<template>
  <multi-polygon-child
    v-if="!isEmpty(props.coordinates)"
    v-bind="props"
    @mouse-leave="emits('mouseLeave', $event)"
    @mouse-over="emits('mouseOver', $event)"
    @mouse-enter="emits('mouseEnter', $event)"
    @click="emits('click', $event)"
    @dblclick="emits('dblclick', $event)"
    @contextmenu="emits('contextmenu', $event)"
  >
    <slot />
  </multi-polygon-child>
</template>

<script setup lang="ts">
import { isEmpty } from "lodash-es";
import MultiPolygonChild from "./child/MultiPolygonChild.vue";
import {
  defaultVectorPolygonProps,
  VectorPolygonEmits,
  VectorPolygonProps,
} from "./props";

const props = withDefaults(defineProps<VectorPolygonProps>(), {
  ...defaultVectorPolygonProps,
  coordinates: () => defaultVectorPolygonProps.coordinates,
  lineDash: () => defaultVectorPolygonProps.lineDash,
});

const emits = defineEmits<VectorPolygonEmits>();
</script>
