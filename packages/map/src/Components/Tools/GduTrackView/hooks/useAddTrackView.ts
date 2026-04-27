import { mapViewInternal } from "@gdu-gl/core";
import { onBeforeUnmount, watch } from "vue";
import * as Cesium from "@gdu-gl/cesium";
import { isValidCoordinates } from "@gdu-gl/common";
import { defaultTrackViewProps, TrackViewProps } from "../props";

export function useAddTrackView(props: TrackViewProps) {
  const viewer = mapViewInternal.getViewer(props.viewId as string)
    ?.mapProviderDelegate?.mapProvider?.map;
  let entity: Cesium.Entity | undefined;
  let position = new Cesium.Cartesian3();
  let viewFrom = new Cesium.Cartesian3(
    props.axisX ?? defaultTrackViewProps.axisX,
    props.axisY ?? defaultTrackViewProps.axisY,
    props.axisZ ?? defaultTrackViewProps.axisZ,
  );

  watch(
    [
      () => props.coordinates,
      () => props.enable,
      () => props.clampToGround,
      () => props.axisX,
      () => props.axisY,
      () => props.axisZ,
    ],
    () => {
      if (!viewer) {
        return;
      }
      try {
        const [lon, lat, alt] = isValidCoordinates(props.coordinates);
        position = Cesium.Cartesian3.fromDegrees(lon, lat, alt);
        viewFrom = new Cesium.Cartesian3(
          props.axisX ?? defaultTrackViewProps.axisX,
          props.axisY ?? defaultTrackViewProps.axisY,
          props.axisZ ?? defaultTrackViewProps.axisZ,
        );
        if (!entity) {
          createEntity();
        }
        if (entity && entity.billboard) {
          // @ts-ignore
          entity.viewFrom = viewFrom;
        }
      } catch (error) {
        removeEntity();
      }
      viewer.trackedEntity = props.enable ? entity : undefined;
    },
    {
      deep: true,
      immediate: true,
    },
  );

  onBeforeUnmount(() => {
    if (viewer) {
      viewer.trackedEntity = undefined;
    }
    removeEntity();
  });

  function createEntity() {
    if (viewer && !entity) {
      try {
        const [lon, lat, alt] = isValidCoordinates(props.coordinates);
        position = Cesium.Cartesian3.fromDegrees(lon, lat, alt);
        // 创建空白的Canvas元素
        const canvas = document.createElement("canvas");
        canvas.width = 1; // 设置最小尺寸，避免渲染问题
        canvas.height = 1;
        entity = viewer.entities.add({
          position: new Cesium.CallbackPositionProperty(() => position, false),
          billboard: {
            image: canvas,
            color: Cesium.Color.RED.withAlpha(0),
            heightReference: new Cesium.CallbackProperty(
              () =>
                props.clampToGround
                  ? Cesium.HeightReference.CLAMP_TO_GROUND
                  : Cesium.HeightReference.NONE,
              false,
            ),
          },
          viewFrom,
        });
      } catch (error) {
        console.error("创建轨迹实体失败", error);
      }
    }
  }

  function removeEntity() {
    if (viewer && entity) {
      viewer.entities.remove(entity);
      entity = undefined;
    }
  }
}
