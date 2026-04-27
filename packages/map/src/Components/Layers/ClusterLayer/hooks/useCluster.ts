import { onBeforeUnmount, ref, shallowRef, watch } from "vue";
import Supercluster from "supercluster";
import * as Cesium from "cesium";
import { mapViewInternal } from "@gdu-gl/core";
import { CameraEventParams, EventName } from "@gdu-gl/common";
import { ClusterDataItem, ClusterLayerProps } from "../props";

export interface ClusterResult {
  isCluster: boolean;
  id: number;
  lng: number;
  lat: number;
  count: number;
  items: ClusterDataItem[];
}

export function useCluster(props: ClusterLayerProps) {
  const viewer = mapViewInternal.getViewer(props.viewId!);
  const cesiumViewer = viewer?.mapProviderDelegate.map as Cesium.Viewer;

  const clusters = shallowRef<ClusterResult[]>([]);
  const index = ref<Supercluster | null>(null);

  let lastFloorZoom = -1;

  function buildIndex() {
    const sc = new Supercluster({
      radius: props.clusterRadius ?? 120,
      minZoom: props.minZoom ?? 0,
      maxZoom: props.maxZoom ?? 18,
    });

    const points: Supercluster.PointFeature<{ index: number }>[] =
      props.data.map((item, i) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [item.coordinates[0], item.coordinates[1]],
        },
        properties: { index: i },
      }));

    sc.load(points);
    index.value = sc;
    updateClusters();
  }

  function getBbox(): [number, number, number, number] {
    if (!cesiumViewer) return [-180, -90, 180, 90];
    const rect = cesiumViewer.camera.computeViewRectangle(
      cesiumViewer.scene.globe.ellipsoid,
    );
    if (!rect) return [-180, -90, 180, 90];
    return [
      Cesium.Math.toDegrees(rect.west),
      Cesium.Math.toDegrees(rect.south),
      Cesium.Math.toDegrees(rect.east),
      Cesium.Math.toDegrees(rect.north),
    ];
  }

  function getCurrentZoom(): number {
    if (!cesiumViewer) return 4;
    const { height } = cesiumViewer.camera.positionCartographic;
    return Math.max(0, Math.round(Math.log2(40_000_000 / height)));
  }

  function updateClusters(zoom?: number) {
    if (!index.value) return;
    let floorZoom: number;
    if (zoom != null) {
      floorZoom = Math.floor(zoom);
    } else if (lastFloorZoom >= 0) {
      floorZoom = lastFloorZoom;
    } else {
      floorZoom = getCurrentZoom();
    }
    lastFloorZoom = floorZoom;

    const bbox = getBbox();
    const raw = index.value.getClusters(bbox, floorZoom);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: ClusterResult[] = raw.map((feature: any) => {
      const [lng, lat] = feature.geometry.coordinates;
      const p = feature.properties;

      if (p.cluster) {
        return {
          isCluster: true,
          id: p.cluster_id,
          lng,
          lat,
          count: p.point_count,
          items: [],
        };
      }

      return {
        isCluster: false,
        id: p.index,
        lng,
        lat,
        count: 1,
        items: [props.data[p.index]],
      };
    });

    clusters.value = result;
  }

  const onCameraMoving = (params: CameraEventParams) => {
    if (!index.value) return;
    const floorZoom = Math.floor(params.zoom);
    if (floorZoom !== lastFloorZoom) {
      updateClusters(params.zoom);
    }
  };

  const onCameraMoveEnd = (params: CameraEventParams) => {
    updateClusters(params.zoom);
  };

  function expandCluster(clusterId: number, lng: number, lat: number) {
    if (!cesiumViewer || !index.value) return;
    const expansionZoom = index.value.getClusterExpansionZoom(clusterId);
    const currentHeight = cesiumViewer.camera.positionCartographic.height;
    const currentZoom =
      lastFloorZoom > 0 ? lastFloorZoom : Math.log2(20_000_000 / currentHeight);
    const zoomDiff = Math.max(expansionZoom - currentZoom, 1);
    const targetHeight = currentHeight / 2 ** zoomDiff;

    cesiumViewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, targetHeight),
      duration: 1.0,
    });
  }

  function getClusterLeaves(
    clusterId: number,
    limit = 100,
    offset = 0,
  ): ClusterDataItem[] {
    if (!index.value) return [];
    const leaves = index.value.getLeaves(clusterId, limit, offset);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return leaves.map((leaf: any) => props.data[leaf.properties.index]);
  }

  watch(
    () => [props.data, props.clusterRadius, props.minZoom, props.maxZoom],
    () => {
      if (props.data && props.data.length > 0) {
        buildIndex();
      } else {
        index.value = null;
        clusters.value = [];
      }
    },
    { immediate: true, deep: false },
  );

  if (viewer) {
    viewer.eventsDelegate.addEventListener(
      EventName.CAMERA_MOVING,
      onCameraMoving,
    );
    viewer.eventsDelegate.addEventListener(
      EventName.CAMERA_MOVE_END,
      onCameraMoveEnd,
    );
  }

  onBeforeUnmount(() => {
    if (viewer) {
      viewer.eventsDelegate.removeEventListener(
        EventName.CAMERA_MOVING,
        onCameraMoving,
      );
      viewer.eventsDelegate.removeEventListener(
        EventName.CAMERA_MOVE_END,
        onCameraMoveEnd,
      );
    }
  });

  return {
    clusters,
    expandCluster,
    getClusterLeaves,
    getClusterExpansionZoom: (clusterId: number) => {
      return index.value?.getClusterExpansionZoom(clusterId) ?? 0;
    },
  };
}
