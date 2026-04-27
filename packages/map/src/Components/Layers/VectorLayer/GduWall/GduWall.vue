<template>
  <wall-child
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
  </wall-child>
</template>

<script setup lang="ts">
import { isEmpty } from "lodash-es";
import {
  VectorWallProps,
  VectorWallEmits,
  defaultVectorWallProps,
} from "./props";
import WallChild from "./child/WallChild.vue";

const props = withDefaults(defineProps<VectorWallProps>(), {
  ...defaultVectorWallProps,
  coordinates: () => defaultVectorWallProps.coordinates,
});
const emits = defineEmits<VectorWallEmits>();
</script>
