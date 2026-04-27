import { PointCoordinates } from "@gdu-gl/common";
import { FeatureEventEmits, Features } from "../../../../Types";

export interface ModelFeatureProps extends Features {
  color?: string;
  /**
   * 关闭深度检测的距离
   * 如果需要点位一直在最上层，可以传递`Number.POSITIVE_INFINITY`
   */
  disableDepthTestDistance?: number;
  /**
   * 模型缩放程度，默认值为1
   */
  scale?: number;
  /**
   * 模型旋转角度，默认值为0
   */
  heading?: number;
  /**
   * 模型俯仰角，默认值为0
   */
  pitch?: number;
  /**
   * 模型偏航角，默认值为0
   */
  roll?: number;
  /**
   * 模型最小像素大小
   */
  minimumPixelSize?: number;
  /** 点的经纬度，必传 */
  coordinates?: PointCoordinates;
  /**
   * 模型的url地址，必传
   */
  url?: string;
  /**
   * 是否开启路径跟踪
   */
  enablePathTrack?: boolean;
  /**
   * 路径跟踪的残留时间，单位为秒，默认值为5
   */
  pathTrackDelayTime?: number;
  /**
   * 路径跟踪的颜色，默认值为黄色
   */
  pathTrackColor?: string;
  /**
   * 路径跟踪的宽度，默认值为10
   */
  pathTrackWidth?: number;
  /**
   * 模型的id，用于路径跟踪
   */
  id?: string;
  animate?: {
    play: boolean;
    loop: boolean;
    speed: number;
    animateNodeName: string;
  } | null;
}

export interface ModelFeatureEmits extends FeatureEventEmits {}

export const defaultModelFeatureProps = {
  scale: 1,
  heading: 0,
  pitch: 0,
  roll: 0,
  disableDepthTestDistance: Number.POSITIVE_INFINITY,
  url: "",
  clampToGround: false,
  visible: true,
  coordinates: undefined,
  minimumPixelSize: 1,
  enablePathTrack: false,
  pathTrackDelayTime: 5,
  pathTrackColor: "yellow",
  pathTrackWidth: 10,
  animate: null,
};
