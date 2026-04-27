import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
} from "vue";
import { GduView } from "@map/Components";
import { mapViewInternal, Viewer } from "@gdu-gl/core";
import { isNil } from "lodash-es";
import { getDistance, inRange } from "../utils/getDistance";
import {
  LockPerspectiveEmits,
  LockPerspectiveProps,
  defaultLockPerspectiveProps,
} from "../props";

export function useAddLockPerspective(
  props: LockPerspectiveProps,
  emits: LockPerspectiveEmits,
) {
  const viewRef = useTemplateRef<InstanceType<typeof GduView>>("viewRef");
  const viewer = shallowRef<Viewer | null>(null);
  const showMap = ref(false);

  let timer: any = null;

  const heading = computed({
    get: () => {
      const value = props.heading ?? defaultLockPerspectiveProps.heading;
      const max = props.maxHeading ?? defaultLockPerspectiveProps.maxHeading;
      const min = props.minHeading ?? defaultLockPerspectiveProps.minHeading;
      const referenceHeading =
        props.referenceHeading ?? defaultLockPerspectiveProps.referenceHeading;
      return inRange(value, min, max) + referenceHeading;
    },
    set: (value: number) => {
      const referenceHeading =
        props.referenceHeading ?? defaultLockPerspectiveProps.referenceHeading;
      emits("update:heading", value - referenceHeading);
    },
  });

  const pitch = computed({
    get: () => {
      const value = props.pitch ?? defaultLockPerspectiveProps.pitch;
      const max = props.maxPitch ?? defaultLockPerspectiveProps.maxPitch;
      const min = props.minPitch ?? defaultLockPerspectiveProps.minPitch;
      return inRange(value, min, max);
    },
    set: (value: number) => {
      emits("update:pitch", value);
    },
  });

  watch(
    [heading, pitch, () => props.fov, () => props.cameraPosition.toString()],
    (
      [newHeading, newPitch, , newPosition],
      [oldHeading, oldPitch, , oldPosition],
    ) => {
      viewRef.value
        ?.setCameraOptions({
          pitch: pitch.value,
          heading: heading.value,
          fov: props.fov ?? defaultLockPerspectiveProps.fov,
          position: props.cameraPosition,
        })
        .then(() => {
          if (
            newHeading !== oldHeading ||
            newPitch !== oldPitch ||
            newPosition !== oldPosition
          ) {
            getDistance(props, emits, viewer.value);
          }
        });
    },
    {
      deep: true,
    },
  );

  onBeforeUnmount(() => {
    if (!isNil(timer)) {
      clearTimeout(timer);
    }
  });

  function ready() {
    viewer.value = mapViewInternal.getViewer(props.viewId!)!;
    showMap.value = true;
    nextTick().then(() => {
      viewRef.value
        ?.setCameraOptions({
          pitch: pitch.value,
          heading: heading.value,
          fov: props.fov ?? defaultLockPerspectiveProps.fov,
          position: props.cameraPosition,
        })
        .then(() => {
          timer = setTimeout(() => {
            getDistance(props, emits, viewer.value);
            emits("ready");
          }, 500);
        });
    });
  }

  return {
    viewRef,
    showMap,
    ready,
    viewer,
    heading,
    pitch,
  };
}
