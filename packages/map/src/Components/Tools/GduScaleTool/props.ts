import { BaseProps } from "../../../Types";

export interface ScaleToolProps extends BaseProps {
  /** 比例尺最大的宽度 */
  maxBarWidth?: number;
}

/**
 * 测量回调事件
 */
export type ScaleToolEmits = {
  /** 测量开始 */
  (
    event: "change",
    params: { barWidth?: number; distanceLabel?: string; distance?: number },
  ): void;
};

export const defaultScaleToolProps = {
  maxBarWidth: 100,
};
