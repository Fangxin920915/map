import { omit } from "lodash-es";
import { BasemapProps, defaultBasemapProps } from "../../../Types";

export interface TencentBasemapProps extends Omit<BasemapProps, "projection"> {}

export const defaultTencentBasemapProps = {
  ...omit(defaultBasemapProps, "projection"),
};
