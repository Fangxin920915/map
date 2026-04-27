<template>
  <point-child
    v-if="!isEmpty(props.coordinates)"
    v-bind="props"
    @mouse-leave="emits('mouseLeave', $event)"
    @mouse-over="emits('mouseOver', $event)"
    @mouse-enter="emits('mouseEnter', $event)"
    @click="emits('click', $event)"
    @dblclick="emits('dblclick', $event)"
    @contextmenu="emits('contextmenu', $event)"
    @update:coordinates="emits('update:coordinates', $event)"
    @modify-start="emits('modifyStart')"
    @modify-end="emits('modifyEnd', $event)"
    @modifying="emits('modifying', $event)"
  >
    <slot />
  </point-child>
</template>

<script setup lang="ts">
import { isEmpty } from "lodash-es";
import {
  defaultVectorPointProps,
  singlePointProps,
  VectorPointEmits,
  VectorPointProps,
} from "./props";
import PointChild from "./child/PointChild.vue";

const props = withDefaults(defineProps<VectorPointProps>(), {
  ...singlePointProps,
  ...defaultVectorPointProps,
  offset: () => defaultVectorPointProps.offset,
  textOffset: () => defaultVectorPointProps.textOffset,
  textBackgroundPadding: () => defaultVectorPointProps.textBackgroundPadding,
});

const emits = defineEmits<VectorPointEmits>();
</script>
