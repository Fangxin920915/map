<template>
  <slot />
</template>

<script setup lang="ts">
import {
  VectorWallProps,
  VectorWallEmits,
  defaultVectorWallProps,
} from "../props";
import { useAddWall } from "../hooks/useAddWall";

const props = withDefaults(defineProps<VectorWallProps>(), {
  ...defaultVectorWallProps,
  coordinates: () => defaultVectorWallProps.coordinates,
});
const emits = defineEmits<VectorWallEmits>();

useAddWall(props, emits);
</script>
