<template>
  <ArrowLineStringChild
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
  </ArrowLineStringChild>
</template>

<script setup lang="ts">
import ArrowLineStringChild from "./components/ArrowLineStringChild.vue";
import {
  defaultArrowLineStringProps,
  ArrowLineStringEmits,
  ArrowLineStringProps,
} from "./props";

const props = withDefaults(defineProps<ArrowLineStringProps>(), {
  ...defaultArrowLineStringProps,
  coordinates: () => defaultArrowLineStringProps.coordinates,
});

const emits = defineEmits<ArrowLineStringEmits>();
</script>
