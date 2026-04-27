<template>
  <slot />
</template>

<script setup lang="ts">
import { useAddLineString } from "@map/Hooks/useAddLineString";
import {
  defaultVectorLineStringProps,
  VectorLineStringEmits,
  VectorLineStringProps,
} from "../props";
import { getLineStyle } from "../hooks/getLineStyle";

const props = withDefaults(defineProps<VectorLineStringProps>(), {
  ...defaultVectorLineStringProps,
  coordinates: () => defaultVectorLineStringProps.coordinates,
  lineDash: () => defaultVectorLineStringProps.lineDash,
});

const emits = defineEmits<VectorLineStringEmits>();

useAddLineString(props, emits, {
  isMultiline: false,
  getLineStyle,
});
</script>
