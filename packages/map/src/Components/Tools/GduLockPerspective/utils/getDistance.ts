import { Viewer, pickPositionByDirection } from "@gdu-gl/core";
import { isEmpty } from "lodash-es";
import { getStraightLineDistance } from "@gdu-gl/common";
import { LockPerspectiveEmits, LockPerspectiveProps } from "../props";

export function getDistance(
  props: LockPerspectiveProps,
  emits: LockPerspectiveEmits,
  viewer: Viewer | null,
) {
  if (!viewer) {
    return;
  }
  // const { clientWidth, clientHeight } = viewer.mapProviderDelegate.map.canvas;
  // const center = { x: clientWidth / 2, y: clientHeight / 2 };
  const centerPosition = pickPositionByDirection(viewer, {
    position: props.cameraPosition,
    heading: (props.heading ?? 0) - (props.referenceHeading ?? 0),
    pitch: props.pitch ?? 0,
    roll: 0,
  });
  if (centerPosition && !isEmpty(props.cameraPosition)) {
    emits(
      "distanceChange",
      getStraightLineDistance(centerPosition, props.cameraPosition),
    );
    return;
  }
  emits("distanceChange", null);
}

/**
 * 将数据限制在指定范围内
 * @param value
 * @param min
 * @param max
 */
export function inRange(value: number, min: number, max: number) {
  const rangeMin = Math.max(value, min);
  return Math.min(rangeMin, max);
}
