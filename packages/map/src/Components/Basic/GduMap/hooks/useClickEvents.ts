import { mapViewInternal, Viewer } from "@gdu-gl/core";
import { EventName, MouseEventParams } from "@gdu-gl/common";
import { onBeforeUnmount } from "vue";
import { MapProps, MapEmits } from "../props";

export function useClickEvents(props: MapProps, emits: MapEmits) {
  let viewer: Viewer | undefined;

  /**
   * 记录鼠标划过的要素
   */
  let activeFeature: any | undefined;

  onBeforeUnmount(() => {
    removeEvent();
  });

  function addClickEvent() {
    viewer = mapViewInternal.getViewer(props.viewId as string);
    if (!viewer) {
      console.warn("viewer不存在,绑定事件失败");
      return;
    }
    viewer.eventsDelegate.addEventListener(EventName.CLICK, clickHandler);
    viewer.eventsDelegate.addEventListener(
      EventName.DOUBLE_CLICK,
      dblclickHandler,
    );
    viewer.eventsDelegate.addEventListener(
      EventName.CONTEXTMENU,
      contextmenuHandler,
    );
    viewer.eventsDelegate.addEventListener(EventName.MOUSE_MOVE, hover);
  }

  function removeEvent() {
    if (!viewer) {
      console.warn("viewer不存在,取消绑定事件失败");
      return;
    }
    viewer.eventsDelegate.removeEventListener(EventName.CLICK, clickHandler);
    viewer.eventsDelegate.removeEventListener(
      EventName.DOUBLE_CLICK,
      dblclickHandler,
    );
    viewer.eventsDelegate.removeEventListener(
      EventName.CONTEXTMENU,
      contextmenuHandler,
    );
    viewer.eventsDelegate.removeEventListener(EventName.MOUSE_MOVE, hover);
  }

  /**
   * 处理单击事件
   */
  function clickHandler(e: MouseEventParams) {
    if (!viewer) {
      return;
    }
    emits("click", e);
    if (!e.pickObj) {
      return;
    }
    const properties = e.feature?.properties as any;
    if (properties?.clickHandler) {
      properties.clickHandler();
    }
  }

  /**
   * 处理双击事件
   */
  function dblclickHandler(e: MouseEventParams) {
    if (!viewer) {
      return;
    }
    emits("dblclick", e);
    if (!e.pickObj) {
      return;
    }
    const properties = e.feature?.properties as any;
    if (properties?.dblclickHandler) {
      properties.dblclickHandler();
    }
  }

  /**
   * 处理右键事件
   */
  function contextmenuHandler(e: MouseEventParams) {
    if (!viewer) {
      return;
    }
    emits("contextmenu", e);
    if (!e.pickObj) {
      return;
    }
    const properties = e.feature?.properties as any;
    if (properties?.contextmenuHandler) {
      properties.contextmenuHandler();
    }
  }

  function hover(e: MouseEventParams) {
    if (!viewer) {
      return;
    }
    emits("mouseMove", e);
    const { feature } = e;

    /**
     * 如果鼠标此次没拾取到要素，则手动触发一下上次拾取到要素的划出事件
     */
    if (!feature && activeFeature) {
      activeFeature?.properties.mouseLeaveHandler(e.coordinates);
      activeFeature = undefined;
      return;
    }

    const properties = e.feature?.properties as any;

    /**
     * 如果此次拾取到了要素，上一次也拾取到要素也存在，需要判断以下两种情况：
     * 1.两次要素的id不相等，需要触发上次选中要素的划出事件，此次选中要素的划入事件
     * 2.如果两次选中要素的id相等，代表鼠标仍然在同一要素上滑动，需要触发该要素的滑动事件
     */
    if (feature && activeFeature) {
      if (feature.properties.id !== activeFeature.properties.id) {
        activeFeature?.properties.mouseLeaveHandler(e.coordinates);
        properties?.mouseEnterHandler &&
          properties?.mouseEnterHandler(e.coordinates);
      } else {
        properties.mouseOverHandler &&
          properties.mouseOverHandler(e.coordinates);
      }
      activeFeature = feature;
      return;
    }

    /**
     * 如果此次拾取到了要素，上次拾取要素不存在，
     * 需要手动触发此次拾取要素的划入事件
     */
    if (feature && !activeFeature) {
      properties.mouseEnterHandler &&
        properties.mouseEnterHandler(e.coordinates);
      activeFeature = feature;
    }
  }

  return {
    addClickEvent,
  };
}
