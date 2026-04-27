<template>
  <div class="gdu-edit-popup-container">
    <template v-if="showTakeoffSelectTip">
      <span class="edit-turn-point-tip">
        {{ props.message?.takeoffSelectTipStr ?? "" }}
      </span>
    </template>
    <template v-else-if="!showAddSurroundPointTip">
      <span class="edit-turn-point-tip">
        <i class="gdu-edit-turn-point-icon" />
        {{ props.message?.dragHorizontallyStr ?? "" }}
      </span>
      <span v-show="showVerticalModifyPopup" class="edit-turn-point-tip">
        Alt + <i class="gdu-edit-turn-point-icon" />
        {{ props.message?.dragVerticallyStr ?? "" }}
      </span>
    </template>
    <span v-else class="edit-turn-point-tip">
      {{ props.message?.addSurroundPointTipStr ?? "" }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { RouteEditLayerProps } from "../../props";

const props = defineProps<{
  message: RouteEditLayerProps["message"];
  showVerticalModifyPopup?: boolean;
  showAddSurroundPointTip?: boolean;
  showTakeoffSelectTip?: boolean;
}>();
</script>
