<template>
  <gdu-map
    :view-id="props.viewId"
    :enable-drag-pan="false"
    :enable-drag-rotate="false"
    :enable-scroll-zoom="false"
    :enable-debugger="false"
    :auto-orthographic="false"
    @ready="ready"
  >
    <gdu-view ref="viewRef" :view-id="props.viewId" />
    <gdu-map-event
      :view-id="props.viewId"
      @mouse-down="onMouseDown"
      @mouse-up="onMouseUp"
      @mouse-move="onMouseMove"
    />
    <slot />
  </gdu-map>
</template>

<script setup lang="ts">
import { defaultMapId } from "@map/Types";
import { GduMap, GduView, GduMapEvent } from "@map/Components";
import {
  LockPerspectiveProps,
  LockPerspectiveEmits,
  defaultLockPerspectiveProps,
} from "./props";
import { useAddLockPerspective } from "./hooks/useAddLockPerspective";
import { useMapEvent } from "./hooks/useMapEvent";

const props = withDefaults(defineProps<LockPerspectiveProps>(), {
  ...defaultLockPerspectiveProps,
  cameraPosition: () => defaultLockPerspectiveProps.cameraPosition,
  viewId: defaultMapId,
});

const emits = defineEmits<LockPerspectiveEmits>();

const { ready, viewer, heading, pitch } = useAddLockPerspective(props, emits);
const { onMouseDown, onMouseUp, onMouseMove } = useMapEvent(
  props,
  viewer,
  heading,
  pitch,
);
</script>
