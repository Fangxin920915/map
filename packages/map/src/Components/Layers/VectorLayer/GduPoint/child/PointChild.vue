<template>
  <slot />
</template>

<script setup lang="ts">
import {
  defaultVectorPointProps,
  singlePointProps,
  VectorPointEmits,
  VectorPointProps,
} from "../props";
import { useAddPoint } from "../hooks/useAddPoint";

const props = withDefaults(defineProps<VectorPointProps>(), {
  ...singlePointProps,
  ...defaultVectorPointProps,
  offset: () => defaultVectorPointProps.offset,
  textOffset: () => defaultVectorPointProps.textOffset,
  textBackgroundPadding: () => defaultVectorPointProps.textBackgroundPadding,
});

const emits = defineEmits<VectorPointEmits>();

useAddPoint(props, emits);
</script>
