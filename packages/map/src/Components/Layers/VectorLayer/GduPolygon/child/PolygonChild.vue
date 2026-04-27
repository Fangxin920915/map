<template>
  <GduLineString
    v-for="(coordinate, index) in outlines"
    :key="index"
    :name="`${POLYGON_OUTLINE_PREFIX}${commonProperties.id}`"
    :coordinates="coordinate"
    :stroke-color="props.strokeColor"
    :stroke-width="props.strokeWidth"
    :stroke-outline-color="props.strokeOutlineColor"
    :stroke-outline-width="props.strokeOutlineWidth"
    :stroke-gap-color="props.strokeGapColor"
    :clamp-to-ground="props.clampToGround"
    :line-dash="props.lineDash"
    :visible="props.visible"
    ring
  />
</template>

<script setup lang="ts">
import { POLYGON_OUTLINE_PREFIX } from "@gdu-gl/common";
import { useAddPolygon } from "../hooks/useAddPolygon";
import {
  defaultVectorPolygonProps,
  VectorPolygonEmits,
  VectorPolygonProps,
} from "../props";
import { GduLineString } from "../../GduLineString";

const props = withDefaults(defineProps<VectorPolygonProps>(), {
  ...defaultVectorPolygonProps,
  coordinates: () => defaultVectorPolygonProps.coordinates,
  lineDash: () => defaultVectorPolygonProps.lineDash,
});

const emits = defineEmits<VectorPolygonEmits>();

const { outlines, commonProperties } = useAddPolygon(props, emits);
</script>
