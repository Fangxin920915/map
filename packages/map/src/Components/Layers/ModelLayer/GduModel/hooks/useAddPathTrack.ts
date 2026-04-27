import { mapViewInternal, PathTrack } from "@gdu-gl/core";
import { onBeforeUnmount, watch } from "vue";
import { ModelFeatureProps } from "../props";

export function useAddPathTrack(props: ModelFeatureProps) {
  let pathTrack: PathTrack | null = null;
  const viewer = mapViewInternal.getViewer(props.viewId!)!;

  watch(
    [
      () => props.id,
      () => props.enablePathTrack,
      () => props.coordinates?.toString(),
      () => props.visible,
      () => props.pathTrackColor,
      () => props.pathTrackWidth,
      () => props.pathTrackDelayTime,
    ],
    (
      [id, enablePathTrack, coordinates],
      [prevId, prevEnablePathTrack, prevCoordinates],
    ) => {
      if (enablePathTrack !== prevEnablePathTrack) {
        enablePathTrack ? createPathTrack() : destroyPathTrack();
      }
      if (id !== prevId) {
        pathTrack?.track?.refresh();
      }
      if (!pathTrack) {
        return;
      }
      pathTrack.track.delayTime = props.pathTrackDelayTime ?? 5;
      pathTrack.track.visible = props.visible ?? false;
      pathTrack.track.color = props.pathTrackColor ?? "yellow";
      pathTrack.track.width = props.pathTrackWidth ?? 10;
      if (props.coordinates && coordinates !== prevCoordinates) {
        pathTrack.track.addPosition(props.coordinates);
      }
    },
    {
      immediate: true,
      deep: true,
    },
  );

  onBeforeUnmount(() => {
    destroyPathTrack();
  });

  function createPathTrack() {
    if (pathTrack) {
      return;
    }
    pathTrack = new PathTrack();
    pathTrack.init(viewer, {
      visible: props.visible,
      delayTime: props.pathTrackDelayTime,
      color: props.pathTrackColor,
      width: props.pathTrackWidth,
    });
  }

  function destroyPathTrack() {
    if (pathTrack) {
      pathTrack.destroy();
      pathTrack = null;
    }
  }
}
