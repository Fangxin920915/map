<template>
  <div :id="id" class="gdu-gl-popup-container">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { PopupPosition } from "@gdu-gl/common";
import { defaultMapId } from "@map/Types";
import { PopupProps, defaultPopupProps } from "../props";
import { useAddPopup } from "../hooks/useAddPopup";

const props = withDefaults(defineProps<PopupProps>(), {
  ...defaultPopupProps,
  offset: () => defaultPopupProps.offset,
  position: PopupPosition.BOTTOM_CENTER,
  viewId: defaultMapId,
});

const { id } = useAddPopup(props);
</script>
