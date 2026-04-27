<template>
  <popup-child v-if="!isEmpty(props.coordinates)" v-bind="props">
    <slot />
  </popup-child>
</template>

<script setup lang="ts">
import { PopupPosition } from "@gdu-gl/common";
import { defaultMapId } from "@map/Types";
import { isEmpty } from "lodash-es";
import PopupChild from "./child/PopupChild.vue";
import { PopupProps, defaultPopupProps } from "./props";

const props = withDefaults(defineProps<PopupProps>(), {
  ...defaultPopupProps,
  offset: () => defaultPopupProps.offset,
  position: PopupPosition.BOTTOM_CENTER,
  viewId: defaultMapId,
});
</script>
