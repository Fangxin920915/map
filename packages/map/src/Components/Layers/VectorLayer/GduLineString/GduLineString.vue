<template>
  <line-string-child
    v-if="props.coordinates && props.coordinates.length > 1"
    v-bind="props"
    @mouse-leave="emits('mouseLeave', $event)"
    @mouse-over="emits('mouseOver', $event)"
    @mouse-enter="emits('mouseEnter', $event)"
    @click="emits('click', $event)"
    @dblclick="emits('dblclick', $event)"
    @contextmenu="emits('contextmenu', $event)"
  >
    <slot />
  </line-string-child>
</template>

<script setup lang="ts">
import {
  defaultVectorLineStringProps,
  VectorLineStringEmits,
  VectorLineStringProps,
} from "./props";
import LineStringChild from "./child/LineStringChild.vue";

const props = withDefaults(defineProps<VectorLineStringProps>(), {
  ...defaultVectorLineStringProps,
  coordinates: () => defaultVectorLineStringProps.coordinates,
  lineDash: () => defaultVectorLineStringProps.lineDash,
});

const emits = defineEmits<VectorLineStringEmits>();
</script>
