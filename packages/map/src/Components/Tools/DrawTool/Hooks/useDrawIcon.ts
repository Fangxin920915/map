import { computed } from "vue";
import {
  getFinishPointIcon,
  getFootPointIcon,
  getInsertionPointIcon,
} from "@map/Utils";
import { DrawPolygonToolProps } from "../DrawPolygon/props";

export function useDrawIcon(
  props: Pick<DrawPolygonToolProps, "turnPointStyle">,
) {
  const footPoint = computed(() => {
    const { hover, select, normal } = props.turnPointStyle!;
    return {
      hover: getFootPointIcon(hover.fillColor, hover.outlineColor),
      select: getFootPointIcon(select.fillColor, select.outlineColor),
      normal: getFootPointIcon(normal.fillColor, normal.outlineColor),
    };
  });

  const insertPoint = computed(() => {
    const { hover, normal } = props.turnPointStyle!;
    return {
      hover: getInsertionPointIcon(
        hover.fillColor,
        hover.outlineColor,
        normal.textColor,
      ),
      normal: getInsertionPointIcon(
        normal.fillColor,
        normal.outlineColor,
        hover.fillColor,
      ),
    };
  });

  // 计算属性：生成结束点图标
  const finishPointIcon = computed(() => {
    const { select } = props.turnPointStyle!;
    return getFinishPointIcon(
      select.fillColor,
      select.outlineColor,
      select.textColor,
    );
  });

  return {
    insertPoint,
    footPoint,
    finishPointIcon,
  };
}
