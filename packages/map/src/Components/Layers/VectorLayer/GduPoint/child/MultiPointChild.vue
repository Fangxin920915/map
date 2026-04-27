<template>
  <slot />
</template>

<script setup lang="ts">
import { useAddPoint } from "../hooks/useAddPoint";
import {
  defaultVectorPointProps,
  VectorMultiPointEmits,
  VectorMultiPointProps,
} from "../props";

const props = withDefaults(defineProps<VectorMultiPointProps>(), {
  ...defaultVectorPointProps,
  offset: () => defaultVectorPointProps.offset,
  textOffset: () => defaultVectorPointProps.textOffset,
  textBackgroundPadding: () => defaultVectorPointProps.textBackgroundPadding,
});

const emits = defineEmits<VectorMultiPointEmits>();

useAddPoint(props, emits, true);
</script>
