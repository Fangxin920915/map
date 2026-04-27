export interface CommonIconStyle {
  fillColor: string;
  outlineColor: string;
}

export interface ActionIconStyle extends CommonIconStyle {
  textColor: string;
}

export interface ActionLineStyle {
  strokeOutlineWidth: number;
  strokeColor: string;
  strokeOutlineColor: string;
}

export interface ActionAreaStyle extends ActionLineStyle {
  fillColor: string;
}

export interface IconStatusStyle<T> {
  normal: T;
  hover: T;
  select?: T;
}

const commonLineStyle = {
  normal: {
    strokeColor: "#EABF3C",
    strokeOutlineColor: "#EABF3C",
    strokeOutlineWidth: 0,
    strokeWidth: 4,
  },
  hover: {
    strokeColor: "#EFCF6D",
    strokeOutlineColor: "#EABF3C",
    strokeOutlineWidth: 0,
    strokeWidth: 4,
  },
  select: {
    strokeColor: "#EABF3C",
    strokeOutlineColor: "#53410C",
    strokeOutlineWidth: 1,
    strokeWidth: 6,
  },
};

export const defaultCommonDrawIconProps = {
  deletePointStyle: {
    normal: {
      fillColor: "rgba(23, 26, 31, 0.70)",
      outlineColor: "rgba(136, 136, 143, 0.20)",
      textColor: "#DADADB",
    },
    hover: {
      fillColor: "rgba(23, 26, 31, 0.70)",
      outlineColor: "rgba(136, 136, 143, 0.20)",
      textColor: "#E14545",
    },
  },
  turningPointStyle: {
    normal: {
      fillColor: "#FAEFCE",
      outlineColor: "#53410C",
    },
    hover: {
      fillColor: "#EABF3C",
      outlineColor: "#53410C",
    },
    select: {
      fillColor: "#E5AF0B",
      outlineColor: "#53410C",
    },
  },
  insertionPointStyle: {
    normal: {
      fillColor: "#F3F3F4",
      outlineColor: "#0C4B3A",
      textColor: "#00DB8D",
    },
    hover: {
      fillColor: "#33E2A4",
      outlineColor: "#0C4B3A",
      textColor: "#FFFFFF",
    },
  },
  finishPointStyle: {
    normal: {
      fillColor: "#E5AF0B",
      outlineColor: "#53410C",
      textColor: "#FFFFFF",
    },
    hover: {
      fillColor: "#E5AF0B",
      outlineColor: "#53410C",
      textColor: "#FFFFFF",
    },
  },
  lineStyle: commonLineStyle,
  polygonStyle: {
    normal: {
      ...commonLineStyle.normal,
      fillColor: "rgba(219, 159, 18, 0.15)",
    },
    hover: {
      ...commonLineStyle.hover,
      fillColor: "rgba(219, 159, 18, 0.15)",
    },
    select: {
      ...commonLineStyle.select,
      fillColor: "rgba(219, 159, 18, 0.15)",
    },
  },
};

export interface DrawIconProps {
  /**
   * 转折点各个状态样式
   */
  turningPointStyle?: IconStatusStyle<CommonIconStyle>;
  /**
   * 插入点各个状态样式
   */
  insertionPointStyle?: IconStatusStyle<ActionIconStyle>;
  /**
   * 完成点各个状态样式
   */
  finishPointStyle?: IconStatusStyle<ActionIconStyle>;
  /**
   * 删除点各个状态样式
   */
  deletePointStyle?: IconStatusStyle<ActionIconStyle>;
  /**
   * 边线颜色
   */
  lineStyle?: IconStatusStyle<ActionLineStyle>;
  /**
   * 面的填充色
   */
  polygonStyle?: IconStatusStyle<ActionAreaStyle>;
}
