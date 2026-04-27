import { IBase } from "./IBase";

export type ScaleChangeCallback = (params: {
  barWidth?: number;
  distanceLabel?: string;
  distance?: number;
}) => void;

export type ScaleOptions = {
  maxBarWidth: number;
  changeCallback: ScaleChangeCallback;
};

export interface IScale extends Pick<IBase, "destroy"> {
  setMaxBarWidth(maxBarWidth: number): void;
}
