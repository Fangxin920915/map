import {
  computed,
  nextTick,
  ref,
  useTemplateRef,
  WritableComputedRef,
} from "vue";
import {
  Coordinates,
  ElectronicFenceFeature,
  ElectronicFenceType,
  MapThemeColor,
  GeoFeatureType,
  uuid,
} from "@gdu-gl/common";
import {
  DrawToolProps,
  ElectronicFenceFeatureInfo,
  GduDrawTool,
} from "@map/Components";
import { isNil } from "lodash-es";
import {
  getBaseColorByType,
  getElectronicFencePolygonStyle,
  getElectronicFenceTurnPointStyle,
} from "../utils/getStyle";
import { ElectronicFenceLayerEmits, ElectronicFenceLayerProps } from "../props";

interface DrawToolStyleByType
  extends Pick<DrawToolProps, "turnPointStyle" | "style"> {}

export function useDrawTool(
  props: ElectronicFenceLayerProps,
  emits: ElectronicFenceLayerEmits,
  activeId: WritableComputedRef<
    ElectronicFenceFeatureInfo | null,
    ElectronicFenceFeatureInfo | null
  >,
) {
  const drawRef = useTemplateRef<InstanceType<typeof GduDrawTool>>("drawRef");

  const drawing = ref(false);

  const drawElectronicFenceType = ref<ElectronicFenceType | null>(null);

  const drawToolStyleByType = computed(() => {
    const { activeColor, hoverColor, key } = getBaseColorByType(
      drawElectronicFenceType.value,
    );
    const mainKey = key as keyof typeof MapThemeColor;
    const turnPointStyle = getElectronicFenceTurnPointStyle(mainKey);
    if (!drawElectronicFenceType.value) {
      return {} as DrawToolStyleByType;
    }
    const mockId = "id";
    const mockFeature = {
      properties: {
        id: mockId,
      },
    } as ElectronicFenceFeature;
    return {
      turnPointStyle,
      style: getElectronicFencePolygonStyle(
        mockFeature,
        activeColor,
        hoverColor,
        mockId,
        mockId,
      ),
    } as DrawToolStyleByType;
  });

  function startDrawEvent() {
    drawing.value = true;
    emits("startDraw");
  }

  function cancelDrawEvent() {
    activeId.value = null;
    drawing.value = false;
    emits("cancelDraw");
  }

  function finishDrawEvent(feature: {
    type: GeoFeatureType;
    coordinates: Coordinates;
    radius?: number;
  }) {
    drawing.value = false;
    const geometry = {
      type: feature.type,
      coordinates: feature.coordinates,
    };
    if (!isNil(feature.radius)) {
      (geometry as ElectronicFenceFeature["geometry"]).radius = feature.radius;
    }
    const electronicFenceFeature: ElectronicFenceFeature = {
      geometry,
      properties: {
        id: uuid(),
        options: {
          type: drawElectronicFenceType.value!,
          name: "",
          visible: true,
          disabled: false,
          height:
            drawElectronicFenceType.value === ElectronicFenceType.NO_FLY
              ? undefined
              : 200,
        },
      },
    };
    emits("finishDraw", electronicFenceFeature);
    emits("update:dataSource", [...props.dataSource, electronicFenceFeature]);
  }

  function startDraw(type: ElectronicFenceType, drawCircle?: boolean) {
    activeId.value = null;
    drawing.value = true;
    drawElectronicFenceType.value = type;
    nextTick().then(() => {
      drawRef.value?.startDraw(
        drawCircle ? GeoFeatureType.Circle : GeoFeatureType.Polygon,
      );
    });
  }

  /**
   * 取消绘制的方法
   */
  function cancelDraw() {
    // 调用绘制工具组件的 cancelDraw 方法
    drawRef.value?.cancelDraw();
  }

  /**
   * 完成绘制的方法
   */
  function finishDraw() {
    // 调用绘制工具组件的 finishDraw 方法
    drawRef.value?.finishDraw();
  }

  return {
    drawing,
    startDraw,
    cancelDraw,
    finishDraw,
    startDrawEvent,
    cancelDrawEvent,
    finishDrawEvent,
    drawToolStyleByType,
  };
}
