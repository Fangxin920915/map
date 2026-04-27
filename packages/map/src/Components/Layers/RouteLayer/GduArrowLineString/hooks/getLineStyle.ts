import { GeometryPropertiesAppearance } from "@gdu-gl/common";
import { ArrowLineStringProps } from "../props";

/**
 * 生成线要素样式配置
 * @returns 包含材质类型和详细参数的样式对象
 */
export function getLineStyle(
  props: ArrowLineStringProps,
): GeometryPropertiesAppearance {
  return {
    appearanceType: "PolylineMaterialAppearance",
    lineStringProperties: {
      width: props.strokeWidth,
      loop: props.ring,
    },
    attributeProperties: {
      show: props.visible,
    },
    materialType: "ArrowLineString",
    materialProperties: {
      color: props.strokeColor,
      outlineColor: props.strokeOutlineColor,
      outlineWidth: props.strokeOutlineWidth,
      progress: props.progress,
      progressColor: props.progressColor,
    },
    appearanceProperties: {
      renderState: {
        depthTest: {
          enabled: !props.disableDepthTest,
        },
      },
    },
    primitiveProperties: {
      asynchronous: true,
    },
  };
}
