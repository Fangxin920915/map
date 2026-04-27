<template>
  <span />
</template>

<script setup lang="ts">
import { onBeforeMount, onBeforeUnmount } from "vue";
import { mapViewInternal } from "@gdu-gl/core";
import {
  MouseEventParams,
  CameraEventParams,
  EventName,
  EventData,
  TileLoadProgressParams,
} from "@gdu-gl/common";
import { defaultMapId } from "@map/Types";
import { MapEventProps } from "./props";

/**
 * 这里吧事件放到属性里面，是为了只添加用户监听了的事件
 */
const props = withDefaults(defineProps<MapEventProps>(), {
  viewId: defaultMapId,
});

const eventArr = [
  {
    type: props.onTileLoadProgress,
    name: EventName.TILE_LOAD_PROGRESS,
    func: (params: TileLoadProgressParams) => {
      props.onTileLoadProgress && props.onTileLoadProgress(params);
    },
  },
  {
    type: props.onClick,
    name: EventName.CLICK,
    func: (params: MouseEventParams) => {
      props.onClick && props.onClick(params);
    },
  },
  {
    type: props.onDblClick,
    name: EventName.DOUBLE_CLICK,
    func: (params: MouseEventParams) => {
      props.onDblClick && props.onDblClick(params);
    },
  },
  {
    type: props.onContextmenu,
    name: EventName.CONTEXTMENU,
    func: (params: MouseEventParams) => {
      props.onContextmenu && props.onContextmenu(params);
    },
  },
  {
    type: props.onMouseDown,
    name: EventName.MOUSE_DOWN,
    func: (params: MouseEventParams) => {
      props.onMouseDown && props.onMouseDown(params);
    },
  },
  {
    type: props.onMouseMove,
    name: EventName.MOUSE_MOVE,
    func: (params: MouseEventParams) => {
      props.onMouseMove && props.onMouseMove(params);
    },
  },
  {
    type: props.onMouseUp,
    name: EventName.MOUSE_UP,
    func: (params: MouseEventParams) => {
      props.onMouseUp && props.onMouseUp(params);
    },
  },
  {
    type: props.onCameraMoveStart,
    name: EventName.CAMERA_MOVE_START,
    func: (params: CameraEventParams) => {
      props.onCameraMoveStart && props.onCameraMoveStart(params);
    },
  },
  {
    type: props.onCameraMoving,
    name: EventName.CAMERA_MOVING,
    func: (params: CameraEventParams) => {
      props.onCameraMoving && props.onCameraMoving(params);
    },
  },
  {
    type: props.onCameraMoveEnd,
    name: EventName.CAMERA_MOVE_END,
    func: (params: CameraEventParams) => {
      props.onCameraMoveEnd && props.onCameraMoveEnd(params);
    },
  },
  {
    type: props.onPreRender,
    name: EventName.PRE_RENDER,
    func: () => {
      props.onPreRender && props.onPreRender();
    },
  },
  {
    type: props.onPostRender,
    name: EventName.POST_RENDER,
    func: () => {
      props.onPostRender && props.onPostRender();
    },
  },
];

const viewer = mapViewInternal.getViewer(props.viewId);

onBeforeMount(() => {
  // 只有用户传了emit才去监听事件
  eventArr.forEach(({ type, name, func }) => {
    if (type) addEvent(name, func);
  });
});

onBeforeUnmount(() => {
  eventArr.forEach(({ name, func }) => {
    removeEvent(name, func);
  });
});

// 根据事件名新增地图事件
function addEvent<T extends EventName>(name: T, fuc: EventData[T]) {
  viewer?.eventsDelegate.addEventListener(name, fuc);
}

// 根据事件名移除地图事件
function removeEvent<T extends EventName>(name: T, fuc: EventData[T]) {
  viewer?.eventsDelegate.removeEventListener(name, fuc);
}
</script>
