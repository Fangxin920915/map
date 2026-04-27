import { PointCoordinates } from "./IGeojson";
import { IBase } from "./IBase";

export interface IPopup extends Pick<IBase, "destroy"> {
  setCoordinates(coordinate?: PointCoordinates): void;

  setPosition(position?: string): void;

  setShow(show?: boolean): void;

  setOffset(offset?: number[]): void;

  setZIndex(zIndex?: number): void;
}
