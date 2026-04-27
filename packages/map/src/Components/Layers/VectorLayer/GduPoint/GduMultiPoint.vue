<template>
  <multi-point-child
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
  </multi-point-child>
</template>

<script setup lang="ts">
import { isEmpty } from "lodash-es";
import {
  defaultVectorPointProps,
  VectorMultiPointEmits,
  VectorMultiPointProps,
} from "./props";
import MultiPointChild from "./child/MultiPointChild.vue";

const props = withDefaults(defineProps<VectorMultiPointProps>(), {
  ...defaultVectorPointProps,
  offset: () => defaultVectorPointProps.offset,
  textOffset: () => defaultVectorPointProps.textOffset,
  textBackgroundPadding: () => defaultVectorPointProps.textBackgroundPadding,
});

const emits = defineEmits<VectorMultiPointEmits>();
</script>
