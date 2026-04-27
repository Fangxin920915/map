import {
  ActionIconStyle,
  CommonIconStyle,
  DrawIconProps,
  IconStatusStyle,
} from "@map/Types";
import { computed } from "vue";
import {
  getDeletePointIcon,
  getFinishPointIcon,
  getFootPointIcon,
  getInsertionPointIcon,
} from "@map/Utils";

export function useAddMapIconsBySvg(props: DrawIconProps) {
  // 计算属性：生成转向点图标的不同状态
  const turningPointIcon = computed(() => {
    const { normal, hover, select } =
      props.turningPointStyle as IconStatusStyle<CommonIconStyle>;
    const selectStyle = select as CommonIconStyle;
    return {
      normal: getFootPointIcon(normal.fillColor, normal.outlineColor),
      hover: getFootPointIcon(hover.fillColor, hover.outlineColor),
      select: getFootPointIcon(selectStyle.fillColor, selectStyle.outlineColor),
    };
  });

  // 计算属性：生成插入点图标的不同状态
  const insertionPointIcon = computed(() => {
    const { normal, hover } =
      props.insertionPointStyle as IconStatusStyle<ActionIconStyle>;
    return {
      normal: getInsertionPointIcon(
        normal.fillColor,
        normal.outlineColor,
        normal.textColor,
      ),
      hover: getInsertionPointIcon(
        hover.fillColor,
        hover.outlineColor,
        hover.textColor,
      ),
    };
  });

  // 计算属性：生成删除点图标的不同状态
  const deletePointIcon = computed(() => {
    const { normal, hover } =
      props.deletePointStyle as IconStatusStyle<ActionIconStyle>;
    return {
      normal: getDeletePointIcon(
        normal.fillColor,
        normal.outlineColor,
        normal.textColor,
      ),
      hover: getDeletePointIcon(
        hover.fillColor,
        hover.outlineColor,
        hover.textColor,
      ),
    };
  });

  // 计算属性：生成结束点图标
  const finishPointIcon = computed(() => {
    const { normal, hover } =
      props.finishPointStyle as IconStatusStyle<ActionIconStyle>;
    return {
      normal: getFinishPointIcon(
        normal.fillColor,
        normal.outlineColor,
        normal.textColor,
      ),
      hover: getFinishPointIcon(
        hover.fillColor,
        hover.outlineColor,
        hover.textColor,
      ),
    };
  });

  return {
    turningPointIcon,
    insertionPointIcon,
    deletePointIcon,
    finishPointIcon,
  };
}
