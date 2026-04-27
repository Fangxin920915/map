import { PointCoordinates } from "../Interfaces/IGeojson";

export enum PopupPosition {
  BOTTOM_LEFT = "bottom-left",
  BOTTOM_CENTER = "bottom-center",
  BOTTOM_RIGHT = "bottom-right",
  CENTER_LEFT = "center-left",
  CENTER_CENTER = "center-center",
  CENTER_RIGHT = "center-right",
  TOP_LEFT = "top-left",
  TOP_CENTER = "top-center",
  TOP_RIGHT = "top-right",
}

export type PopupOptions = {
  coordinates?: PointCoordinates;
  position?: PopupPosition & string;
  domId: string | Element;
  show?: boolean;
  offset?: number[];
  zIndex?: number;
};
