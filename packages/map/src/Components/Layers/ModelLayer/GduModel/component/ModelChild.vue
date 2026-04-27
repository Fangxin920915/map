<template>
  <slot />
</template>

<script setup lang="ts">
import { useAddModel } from "../hooks/useAddModel";
import {
  defaultModelFeatureProps,
  ModelFeatureEmits,
  ModelFeatureProps,
} from "../props";
import { useAddPathTrack } from "../hooks/useAddPathTrack";

const props = withDefaults(defineProps<ModelFeatureProps>(), {
  ...defaultModelFeatureProps,
});

const emits = defineEmits<ModelFeatureEmits>();

useAddModel(props, emits);
useAddPathTrack(props);
</script>
