import { createDashLine, GeometryPropertiesAppearance } from "@gdu-gl/common";
import { isEmpty, sum } from "lodash-es";
import { VectorLineStringProps } from "../props";

/**
 * 生成线要素样式配置
 * @returns 包含材质类型和详细参数的样式对象
 */
export function getLineStyle(
  props: VectorLineStringProps,
  asynchronous: boolean,
): GeometryPropertiesAppearance {
  let lineDash = [32, 0];
  if (!isEmpty(props.lineDash)) {
    const line = props.lineDash as number[];
    const [solidLineLength, dashLineLength = 0] = line.slice(0, 2);
    lineDash = [Number(solidLineLength), Number(dashLineLength)];
  }

  return {
    appearanceType: "PolylineMaterialAppearance",
    lineStringProperties: {
      width: props.strokeWidth,
      loop: props.ring,
    },
    attributeProperties: {
      show: props.visible,
    },
    primitiveProperties: {
      asynchronous,
    },
    materialType: "OutlineDashLineString",
    appearanceProperties: {
      renderState: {
        depthTest: {
          enabled: !props.disableDepthTest,
        },
      },
    },
    materialProperties: {
      color: props.strokeColor,
      dashLength: sum(lineDash),
      gapColor: props.strokeGapColor,
      dashPattern: createDashLine(lineDash),
      outlineColor: props.strokeOutlineColor,
      outlineWidth: props.strokeOutlineWidth,
    },
  };
}
