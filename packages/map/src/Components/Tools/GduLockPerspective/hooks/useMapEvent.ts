import { Viewer } from "@gdu-gl/core";
import { MouseEventParams } from "@gdu-gl/common";
import { ShallowRef, WritableComputedRef } from "vue";
import { defaultLockPerspectiveProps, LockPerspectiveProps } from "../props";
import { inRange } from "../utils/getDistance";

export function useMapEvent(
  props: LockPerspectiveProps,
  viewer: ShallowRef<Viewer | null>,
  heading: WritableComputedRef<number, number>,
  pitch: WritableComputedRef<number, number>,
) {
  let startX = 0;
  let startY = 0;
  let recordHeading = 0;
  let recordPitch = 0;
  let press = false;

  function onMouseDown(e: MouseEventParams) {
    const { pixel } = e;
    [startX, startY] = pixel;
    recordHeading = heading.value;
    recordPitch = pitch.value;
    press = true;
  }

  function onMouseUp() {
    startX = 0;
    startY = 0;
    recordHeading = 0;
    recordPitch = 0;
    press = false;
  }

  function onMouseMove(e: MouseEventParams) {
    if (!viewer.value || !press) {
      return;
    }
    const { clientWidth, clientHeight } =
      viewer.value.mapProviderDelegate.map.canvas;
    heading.value = handleHorizontal(e, clientWidth);
    pitch.value = handleVertical(e, clientHeight);
    // getDistance(props, emits, viewer.value);
  }

  function handleHorizontal(e: MouseEventParams, clientWidth: number) {
    let moveX;
    if (props.enableDragHorizontal) {
      moveX = startX - e.pixel[0];
    } else {
      moveX = 0;
    }

    const fov = props.fov ?? defaultLockPerspectiveProps.fov;
    const headingValue = recordHeading + (moveX / clientWidth) * fov * 1.5;
    const max = props.maxHeading ?? defaultLockPerspectiveProps.maxHeading;
    const min = props.minHeading ?? defaultLockPerspectiveProps.minHeading;
    const referenceHeading =
      props.referenceHeading ?? defaultLockPerspectiveProps.referenceHeading;
    const rangeHeading = inRange(headingValue - referenceHeading, min, max);
    return referenceHeading + rangeHeading;
  }

  function handleVertical(e: MouseEventParams, clientHeight: number) {
    let moveY;
    if (props.enableDragVertical) {
      moveY = e.pixel[1] - startY;
    } else {
      moveY = 0;
    }

    const fov = props.fov ?? defaultLockPerspectiveProps.fov;
    const pitchValue = Math.max(
      -90,
      recordPitch + (moveY / clientHeight) * fov,
    );
    const max = props.maxPitch ?? defaultLockPerspectiveProps.maxPitch;
    const min = props.minPitch ?? defaultLockPerspectiveProps.minPitch;
    return inRange(pitchValue, min, max);
  }

  return {
    onMouseDown,
    onMouseUp,
    onMouseMove,
  };
}
