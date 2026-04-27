<template>
  <polygon-child
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
  </polygon-child>
</template>

<script setup lang="ts">
import { isEmpty } from "lodash-es";
import {
  defaultVectorPolygonProps,
  VectorPolygonEmits,
  VectorPolygonProps,
} from "./props";
import PolygonChild from "./child/PolygonChild.vue";

const props = withDefaults(defineProps<VectorPolygonProps>(), {
  ...defaultVectorPolygonProps,
  coordinates: () => defaultVectorPolygonProps.coordinates,
  lineDash: () => defaultVectorPolygonProps.lineDash,
});

const emits = defineEmits<VectorPolygonEmits>();
</script>
