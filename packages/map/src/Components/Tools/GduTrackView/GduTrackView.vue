<template>
  <slot />
</template>
<script setup lang="ts">
import { defaultTrackViewProps, TrackViewProps } from "./props";
import { useAddTrackView } from "./hooks/useAddTrackView";

const props = withDefaults(defineProps<TrackViewProps>(), {
  ...defaultTrackViewProps,
});
useAddTrackView(props);
</script>
