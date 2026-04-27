<template>
  <gdu-popup
    v-if="props.visible"
    :view-id="props.viewId"
    :position="PopupPosition.CENTER_LEFT"
    :coordinates="props.coordinates"
    :clamp-to-ground="props.clampToGround"
    :offset="props.offset"
  >
    <div class="gdu-gl-route-delete-popup-container" @click="emits('click')">
      <i />
      <span> {{ props.message?.deleteStr ?? "" }} </span>
    </div>
  </gdu-popup>
</template>

<script setup lang="ts">
import { PointCoordinates, PopupPosition } from "@gdu-gl/common";
import { GduPopup } from "@map/Components";
import { PromptMessageConfiguration } from "@map/Types";

const props = defineProps<{
  viewId?: string;
  coordinates: PointCoordinates;
  clampToGround: boolean;
  visible: boolean;
  offset: number[];
  message?: PromptMessageConfiguration;
}>();

const emits = defineEmits<{ (event: "click"): void }>();
</script>
