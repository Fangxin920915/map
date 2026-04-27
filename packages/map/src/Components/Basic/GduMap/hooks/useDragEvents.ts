import { mapViewInternal, Viewer } from "@gdu-gl/core";
import { onBeforeUnmount } from "vue";
import {
  Feature,
  EventName,
  MouseEventParams,
  WidgetType,
  IDragToolImp,
} from "@gdu-gl/common";
import { MapProps } from "../props";

export function useDragEvents(props: MapProps) {
  let viewer: Viewer | undefined;

  /**
   * 用户记录地图在鼠标按下时的状态，用于恢复地图的拖动状态
   * - **enableDragRotate**  地图是否允许旋转
   * - **enableDragPan**  地图是否允许平移
   * - **enableScrollZoom**  地图是否允许缩放
   */
  const recordEarthStatus = {
    enableDragRotate: false,
    enableDragPan: false,
    enableScrollZoom: false,
  };

  /**
   * 拖拽辅助类，用于计算水平拖动和垂直拖动后的坐标
   */
  let dragUtils: IDragToolImp;

  /**
   * 用户按下鼠标选中的要素
   */
  let pressPoint: Feature | null = null;

  /**
   * 鼠标按下的起始位置
   */
  let startPressPosition: { x: number; y: number } | null = null;

  /**
   * 当前是否处于拖动状态
   */
  let dragging = false;

  onBeforeUnmount(() => {
    removeEvent();
  });
  function addDragEvent() {
    viewer = mapViewInternal.getViewer(props.viewId as string);
    if (!viewer) {
      console.warn("viewer不存在,绑定事件失败");
      return;
    }
    dragUtils = viewer?.widgetsDelegate.widgets.getWidgetByType(
      WidgetType.DragTool,
    ) as IDragToolImp;
    const { enableDragRotate, enableDragPan, enableScrollZoom } =
      viewer.mapProviderDelegate.mapProvider!;
    recordEarthStatus.enableDragRotate = enableDragRotate;
    recordEarthStatus.enableDragPan = enableDragPan;
    recordEarthStatus.enableScrollZoom = enableScrollZoom;
    // dragUtils.init(props.viewId as string);
    viewer.eventsDelegate.addEventListener(EventName.MOUSE_DOWN, mouseDown);
    viewer.eventsDelegate.addEventListener(EventName.MOUSE_MOVE, mouseMove);
    viewer.eventsDelegate.addEventListener(EventName.MOUSE_UP, mouseUp);
  }

  function removeEvent() {
    if (!viewer) {
      console.warn("viewer不存在,取消绑定事件失败");
      return;
    }
    viewer.eventsDelegate.removeEventListener(EventName.MOUSE_DOWN, mouseDown);
    viewer.eventsDelegate.removeEventListener(EventName.MOUSE_MOVE, mouseMove);
    viewer.eventsDelegate.removeEventListener(EventName.MOUSE_UP, mouseUp);
  }

  function mouseDown(e: MouseEventParams) {
    if (!viewer?.mapProviderDelegate) {
      return;
    }
    // 记录地球拖动状态，鼠标抬起时恢复
    const { enableDragRotate, enableDragPan, enableScrollZoom } =
      viewer.mapProviderDelegate.mapProvider!;
    recordEarthStatus.enableDragRotate = enableDragRotate;
    recordEarthStatus.enableDragPan = enableDragPan;
    recordEarthStatus.enableScrollZoom = enableScrollZoom;
    const { feature } = e;
    // 只有当点位的enableModify设置为ture，我们才会响应拖动事件
    if (!feature?.properties?.enableModify) {
      return;
    }

    viewer.mapProviderDelegate.mapProvider!.enableDragRotate = false;
    viewer.mapProviderDelegate.mapProvider!.enableDragPan = false;
    viewer.mapProviderDelegate.mapProvider!.enableScrollZoom = false;
    dragging = false;
    // 记录下按住的点
    pressPoint = feature as Feature;
    // 记录按下的起始屏幕位置，只有当鼠标移动的位置大于3px，才会让点位开始被拖动
    startPressPosition = {
      x: e.pixel[0],
      y: e.pixel[1],
    };
  }

  function mouseMove(e: MouseEventParams) {
    if (!viewer?.mapProviderDelegate) {
      return;
    }
    if (pressPoint && pressPoint.properties?.enableModify && !dragging) {
      if (
        getDragStatus({
          x: e.pixel[0],
          y: e.pixel[1],
        })
      ) {
        dragging = true;
        pressPoint.properties.modifyStartHandler();
      }
    } else if (pressPoint && pressPoint.properties?.enableModify && dragging) {
      const newPosition = getMovePosition(pressPoint.properties, {
        ...e,
      });
      newPosition && pressPoint.properties.modifyingHandler(newPosition);
    }
  }

  function mouseUp(e: MouseEventParams) {
    if (!viewer || !viewer.mapProviderDelegate) {
      return;
    }
    if (pressPoint && dragging && viewer && dragUtils) {
      const newPosition = getMovePosition(pressPoint.properties, e);
      newPosition && pressPoint.properties.modifyEndHandler(newPosition);
    }

    dragging = false;
    pressPoint = null;
    startPressPosition = null;
    viewer.mapProviderDelegate.mapProvider!.enableDragRotate =
      recordEarthStatus.enableDragRotate;
    viewer.mapProviderDelegate.mapProvider!.enableDragPan =
      recordEarthStatus.enableDragPan;
    viewer.mapProviderDelegate.mapProvider!.enableScrollZoom =
      recordEarthStatus.enableScrollZoom;
  }

  /**
   * 如果数遍按住一个点移动了3px以上，判定为用户想使用拖动功能
   * @param endPosition
   */
  function getDragStatus(endPosition: { x: number; y: number }) {
    if (!startPressPosition) {
      return false;
    }
    const distance =
      (endPosition.x - startPressPosition.x) ** 2 +
      (endPosition.y - startPressPosition.y) ** 2;
    return distance > 9;
  }

  function getMovePosition(
    properties: Record<string, any>,
    e: MouseEventParams,
  ) {
    switch (properties.modifyType) {
      case "ground":
        return dragUtils.dragGround({
          mousePosition: {
            x: e.pixel[0],
            y: e.pixel[1],
          },
          pickObj: e.pickObj,
        });
      case "vertical":
        return dragUtils.dragVertical({
          position: pressPoint?.geometry.coordinates as number[],
          mousePosition: {
            x: e.pixel[0],
            y: e.pixel[1],
          },
        });
      default:
        return dragUtils.dragHorizontal({
          position: pressPoint?.geometry.coordinates as number[],
          mousePosition: {
            x: e.pixel[0],
            y: e.pixel[1],
          },
        });
    }
  }

  return {
    addDragEvent,
  };
}
