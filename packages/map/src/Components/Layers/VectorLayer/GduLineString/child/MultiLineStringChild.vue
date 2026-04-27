<template>
  <slot />
</template>

<script setup lang="ts">
import { useAddLineString } from "@map/Hooks/useAddLineString";
import { getLineStyle } from "../hooks/getLineStyle";
import {
  defaultVectorLineStringProps,
  VectorLineStringEmits,
  VectorLineStringProps,
} from "../props";

const props = withDefaults(defineProps<VectorLineStringProps>(), {
  ...defaultVectorLineStringProps,
  coordinates: () => defaultVectorLineStringProps.coordinates,
  lineDash: () => defaultVectorLineStringProps.lineDash,
});

const emits = defineEmits<VectorLineStringEmits>();

useAddLineString(props, emits, {
  isMultiline: true,
  getLineStyle,
});
</script>
