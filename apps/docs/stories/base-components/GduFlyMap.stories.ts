import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { GduMap, GduWmtsBasemap, defaultMapProps } from "@gdu-gl/map";
import { uuid } from "@gdu-gl/common";
import { onBeforeUnmount, ref } from "vue";
import * as Cesium from "cesium";

const meta = {
  title: "基础组件/地球飞行动效",
  component: GduMap,
  tags: ["autodocs"],
} satisfies Meta<typeof GduMap>;

export default meta;
type Story = StoryObj<typeof meta>;

const WUHAN_LNG = 114.3055;
const WUHAN_LAT = 30.5928;
const GLOBE_VIEW_RANGE = 15_000_000;
const WUHAN_ALTITUDE = 40_000;
const ROTATION_SPEED_DEG = 0.3;
const ROTATION_DURATION_MS = 3000;
const FLY_DURATION_SEC = 3;

export const Primary: Story = {
  name: "GduFlyMap",
  render: () => ({
    template: `
      <gdu-map
        :view-id="viewId"
        :zoom="1"
        :center="[104, 35]"
        :heading="0"
        :pitch="-0.5"
        :auto-orthographic="false"
        :enable-drag-pan="false"
        :enable-drag-rotate="false"
        :enable-scroll-zoom="false"
        :enable-debugger="false"
        @ready="onReady"
      />
      <gdu-wmts-basemap
        v-if="mapReady"
        :view-id="viewId"
        url="http://t{0-7}.tianditu.gov.cn/img_w/wmts?tk=490c03d5e1875b979156869f31651c6f"
        layer="img"
        tileStyle="default"
        format="tiles"
        tileMatrixSetID="w"
        :z-index="1"
      />
      <gdu-wmts-basemap
        v-if="mapReady"
        :view-id="viewId"
        url="http://t{0-7}.tianditu.gov.cn/cia_w/wmts?tk=490c03d5e1875b979156869f31651c6f"
        layer="cia"
        tileStyle="default"
        format="tiles"
        tileMatrixSetID="w"
        :z-index="2"
      />
    `,
    components: { GduMap, GduWmtsBasemap },
    setup() {
      const viewId = uuid();
      const mapReady = ref(false);
      let nativeViewer: Cesium.Viewer | null = null;
      let rotateListener: (() => void) | null = null;
      let timer: ReturnType<typeof setTimeout> | null = null;

      function onReady(viewer: any) {
        nativeViewer = viewer.mapProviderDelegate.map;
        const camera = nativeViewer!.camera;

        const cameraPosition = Cesium.Cartesian3.fromDegrees(
          104,
          20,
          GLOBE_VIEW_RANGE,
        );
        const direction = Cesium.Cartesian3.normalize(
          Cesium.Cartesian3.negate(cameraPosition, new Cesium.Cartesian3()),
          new Cesium.Cartesian3(),
        );
        const right = Cesium.Cartesian3.normalize(
          Cesium.Cartesian3.cross(
            direction,
            Cesium.Cartesian3.UNIT_Z,
            new Cesium.Cartesian3(),
          ),
          new Cesium.Cartesian3(),
        );
        const up = Cesium.Cartesian3.cross(
          right,
          direction,
          new Cesium.Cartesian3(),
        );
        camera.setView({
          destination: cameraPosition,
          orientation: { direction, up },
        });

        mapReady.value = true;
        startRotation();

        timer = setTimeout(() => {
          stopRotation();
          flyToWuhan();
        }, ROTATION_DURATION_MS);
      }

      function startRotation() {
        if (!nativeViewer) return;
        rotateListener = () => {
          nativeViewer!.camera.rotate(
            Cesium.Cartesian3.UNIT_Z,
            Cesium.Math.toRadians(ROTATION_SPEED_DEG),
          );
        };
        nativeViewer.scene.preRender.addEventListener(rotateListener);
      }

      function stopRotation() {
        if (nativeViewer && rotateListener) {
          nativeViewer.scene.preRender.removeEventListener(rotateListener);
          rotateListener = null;
        }
      }

      function flyToWuhan() {
        if (!nativeViewer) return;
        nativeViewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            WUHAN_LNG,
            WUHAN_LAT,
            WUHAN_ALTITUDE,
          ),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-90),
            roll: 0,
          },
          duration: FLY_DURATION_SEC,
          complete: enableInteraction,
        });
      }

      function enableInteraction() {
        if (!nativeViewer) return;
        const ctrl = nativeViewer.scene.screenSpaceCameraController;
        ctrl.enableRotate = true;
        ctrl.enableZoom = true;
        ctrl.enableTilt = true;
      }

      onBeforeUnmount(() => {
        stopRotation();
        if (timer) clearTimeout(timer);
      });

      return { viewId, mapReady, onReady };
    },
  }),
  args: {
    ...defaultMapProps,
  },
};
