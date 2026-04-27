<template>
  <gdu-popup
    :view-id="props.viewId"
    :coordinates="props.coordinates"
    :position="PopupPosition.TOP_LEFT"
    :offset="props.offset"
  >
    <div class="gdu-edit-popup-container">
      <span class="edit-turn-point-tip">
        <i class="gdu-self-intersecting-icon" />
        {{ intersectingMessage }}
      </span>
    </div>
  </gdu-popup>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { PointCoordinates, PopupPosition } from "@gdu-gl/common";
import { GduPopup } from "@map/Components";
import { PromptMessageConfiguration } from "@map/Types";

const props = defineProps<{
  viewId?: string;
  coordinates: PointCoordinates;
  isIntersect?: boolean;
  offset?: number[];
  message?: PromptMessageConfiguration;
}>();

const intersectingMessage = computed(() => {
  if (props.isIntersect) {
    return props.message?.polygonIntersectStr ?? "";
  }
  return props.message?.polygonSelfIntersectStr ?? "";
});
</script>
