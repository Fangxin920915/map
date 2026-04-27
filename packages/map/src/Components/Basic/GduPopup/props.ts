import { PointCoordinates, PopupPosition } from "@gdu-gl/common";
import { BaseProps, Features } from "../../../Types";

export interface PopupProps
  extends Omit<Features, "name" | "featureProperties">,
    BaseProps {
  /** 弹框坐标点 */
  coordinates?: PointCoordinates | null;
  /** 坐标点相对于弹框的位置 */
  position?: PopupPosition;
  offset?: number[];
}

export const defaultPopupProps = {
  coordinates: undefined,
  position: PopupPosition.BOTTOM_CENTER,
  visible: true,
  zIndex: 1,
  offset: [0, 0],
};
