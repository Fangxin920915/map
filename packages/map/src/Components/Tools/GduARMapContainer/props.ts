import { EngineType } from "@gdu-gl/common";
import { ARMapProps } from "../../Basic/GduARMap/props";

export interface ARMapContainerProps extends ARMapProps {
  /**
   * 宽度宽高比
   */
  widthAspectRatio?: number;
  /**
   * 高度宽高比
   */
  heightAspectRatio?: number;
  /**
   * 引擎类型
   */
  engineType?: EngineType;
  /**
   * 容器是否隐藏
   */
  isOpenAR?: boolean;
}
export const defaultARMapContainerProps: ARMapContainerProps = {
  widthAspectRatio: 16,
  heightAspectRatio: 9,
  aspectRatio: 9 / 16,
  pixelSize: 0.8,
  actualFocalLength: 4.49,
  effectivePixels: 48000000,
  engineType: EngineType.CESIUM,
  sceneOpacity: 1,
  roadOpacity: 1,
  mvtUrl: "http://gdu-dev.com:30500",
  styleUrl: "/style.json",
  isOpenAR: false,
};
