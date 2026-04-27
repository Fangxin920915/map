<template>
  <gdu-popup
    :visible="props.visible"
    :view-id="props.viewId"
    :position="PopupPosition.CENTER_LEFT"
    :coordinates="props.coordinates"
    :clamp-to-ground="props.clampToGround"
    :offset="props.offset"
  >
    <div class="gdu-gl-surround-route-delete-popup-list-container">
      <div
        v-for="type in types"
        :key="type"
        :class="[
          'gdu-gl-surround-route-delete-popup-container',
          select === type &&
          dataInfo.selectDeleteIndex === props.currentDeleteIndex
            ? 'active'
            : '',
        ]"
      >
        <div
          class="gdu-gl-surround-route-delete-popup-container-icon"
          @click="selectMenu(type)"
        >
          <i :class="[type === 'addSurroundPointStr' ? 'add' : '']" />
          <span> {{ props.message?.[type] ?? "" }} </span>
        </div>
        <!--右侧二次确认窗口-->
        <div
          :class="[
            'gdu-edit-bubble-container',
            select === type &&
            dataInfo.selectDeleteIndex === props.currentDeleteIndex
              ? 'active'
              : '',
          ]"
        >
          {{
            props.message?.[
              type === "deleteSurroundPointStr"
                ? "confirmTextDeleteSurroundStr"
                : "confirmTextDeleteTurnStr"
            ] ?? ""
          }}
        </div>
      </div>
    </div>
  </gdu-popup>
</template>

<script setup lang="ts">
import { PointCoordinates, PopupPosition } from "@gdu-gl/common";
import { GduPopup } from "@map/Components";
import { PromptMessageConfiguration } from "@map/Types";
import { computed, ref, watch } from "vue";
import { useInjectWayPointProps } from "../hooks/useInjectWayPointProps";

const props = defineProps<{
  viewId?: string;
  coordinates: PointCoordinates;
  visible: boolean;
  clampToGround: boolean;
  offset: number[];
  openDeleteMenu?: boolean;
  currentDeleteIndex: number;
  message?: PromptMessageConfiguration;
}>();

const emits = defineEmits<{
  (event: "deleteSurroundPoint"): void;
  (event: "deleteWayPoint"): void;
  (event: "addSurroundPoint"): void;
}>();

const { dataInfo } = useInjectWayPointProps();

const select = ref("");

const types = computed(() => {
  const keys: Array<keyof PromptMessageConfiguration> = [
    "deleteSurroundPointStr",
    "addSurroundPointStr",
    "deleteWayPointStr",
  ];
  if (props.openDeleteMenu) {
    return keys.filter((type) => type !== "addSurroundPointStr");
  }
  return keys.filter((type) => type !== "deleteSurroundPointStr");
});

watch(
  () => props.visible,
  () => {
    select.value = "";
  },
  {
    immediate: true,
  },
);

function selectMenu(key: keyof PromptMessageConfiguration) {
  if (key === "addSurroundPointStr") {
    emits("addSurroundPoint");
    select.value = "";
    dataInfo.selectDeleteIndex = -1;
    return;
  }

  if (
    key === "deleteSurroundPointStr" &&
    select.value === "deleteSurroundPointStr"
  ) {
    emits("deleteSurroundPoint");
    select.value = "";
    dataInfo.selectDeleteIndex = -1;
    return;
  }

  if (key === "deleteWayPointStr" && select.value === "deleteWayPointStr") {
    emits("deleteWayPoint");
    select.value = "";
    dataInfo.selectDeleteIndex = -1;
    return;
  }

  select.value = key;
  dataInfo.selectDeleteIndex = props.currentDeleteIndex;
}
</script>
