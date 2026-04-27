import { computed, ref } from "vue";
import {
  LineStringCoordinates,
  MouseEventParams,
  PointCoordinates,
} from "@gdu-gl/common";
import { CommonDrawEmits, CommonDrawProps } from "../Common/CommonProps";

export function useDrawShapeEvent(
  props: CommonDrawProps,
  emits: CommonDrawEmits,
) {
  const points = ref<LineStringCoordinates>([]);
  const drawing = ref(false);

  const hover = ref<number>(-1);

  const mousePosition = ref<PointCoordinates | undefined>(undefined);

  const turnPoints = computed(() => {
    const arr: LineStringCoordinates = [];
    for (let i = 0; i < points.value.length - 1; i++) {
      arr.push(points.value[i]);
    }
    return arr;
  });

  function handleMouseClickMap(params: MouseEventParams) {
    // 获取点击要素的名称
    const name = params.feature?.properties.name;
    // 若要素名称以当前图层 ID 开头
    if (name === props.layerId) {
      return;
    }
    // 若没有有效的坐标信息，直接返回
    // 检查当前绘制状态是否为绘制结束，若是则直接返回
    if (!params.coordinates) {
      return;
    }

    // 解构出坐标的经度和纬度
    const [lon, lat] = params.coordinates;
    // 复制面线数据，排除最后一个点
    const line = points.value.slice(0, points.value.length - 1);
    // 将新的区域点添加两次到复制后的面线数据中
    line.push([lon, lat], [lon, lat]);
    // 更新面线数据
    points.value = line;
  }

  /**
   * 处理地图鼠标移动事件
   * @param params - 鼠标移动事件参数
   */
  function mouseMoveMap(params: MouseEventParams) {
    mousePosition.value = params.coordinates;
    // 若鼠标悬停在要素上且要素名称以当前图层 ID 开头，更新 hoverId
    if (params.feature?.properties?.name === props.layerId) {
      hover.value = params.feature?.properties.featureProperties ?? -1;
    } else {
      hover.value = -1;
    }

    // 检查面线数据是否为空或者当前绘制状态是否为绘制结束，满足任一条件则直接返回
    if (!params.coordinates || !points.value.length) {
      return;
    }
    // 解构出坐标的经度和纬度
    const [lon, lat] = params.coordinates;
    // 更新面线数据中最后一个点的坐标
    points.value[points.value.length - 1] = [lon, lat];
  }

  function deletePoint() {
    const lastIndex = turnPoints.value.length - 1;
    points.value.splice(lastIndex, 1);
    hover.value = -1;
  }

  function startDraw() {
    drawing.value = true;
    points.value = [];
    hover.value = -1;
    emits("start");
  }

  function cancelDraw() {
    if (drawing.value) {
      emits("cancel");
    }
    drawing.value = false;
    points.value = [];
    hover.value = -1;
  }

  return {
    points,
    drawing,
    mousePosition,
    turnPoints,
    hover,
    mouseMoveMap,
    deletePoint,
    startDraw,
    handleMouseClickMap,
    cancelDraw,
  };
}
