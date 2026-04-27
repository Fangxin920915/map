<template>
  <MultiLineStringChild
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
  </MultiLineStringChild>
</template>

<script setup lang="ts">
import { isEmpty } from "lodash-es";
import MultiLineStringChild from "./child/MultiLineStringChild.vue";
import {
  defaultVectorLineStringProps,
  VectorLineStringEmits,
  VectorLineStringProps,
} from "./props";

const props = withDefaults(defineProps<VectorLineStringProps>(), {
  ...defaultVectorLineStringProps,
  coordinates: () => defaultVectorLineStringProps.coordinates,
  lineDash: () => defaultVectorLineStringProps.lineDash,
});

const emits = defineEmits<VectorLineStringEmits>();
</script>
