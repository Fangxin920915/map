<template>
  <slot />
</template>

<script setup lang="ts">
import { useAddLineString } from "@map/Hooks/useAddLineString";
import { getLineStyle } from "../hooks/getLineStyle";
import {
  defaultArrowLineStringProps,
  ArrowLineStringEmits,
  ArrowLineStringProps,
} from "../props";

const props = withDefaults(defineProps<ArrowLineStringProps>(), {
  ...defaultArrowLineStringProps,
  coordinates: () => defaultArrowLineStringProps.coordinates,
});

const emits = defineEmits<ArrowLineStringEmits>();

useAddLineString(props, emits, {
  isMultiline: false,
  getLineStyle,
});
</script>
