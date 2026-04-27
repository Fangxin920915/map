import type { Meta, StoryObj } from "@storybook/vue3-vite";

import {
  GduMap,
  FPSMonitor,
  GduWmtsBasemap,
  GduTerrainBasemap,
  GduModelLayer,
  GduTileset,
} from "@gdu-gl/map";
import { ref, onMounted, onUnmounted } from "vue";

const meta = {
  title: "性能监控工具",
  component: FPSMonitor,
  parameters: {
    order: 0,
  },
} satisfies Meta<typeof FPSMonitor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "FPSMonitor",
  args: {
    sampleSize: 15,
    thresholdFPS: 30,
    thresholdTime: 2000,
    alertMode: "once",
    alertInterval: 3000,
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" @ready="ready"/>
      <FPSMonitor
        ref="fpsMonitorRef"
        :sampleSize="15"
        :thresholdFPS="30"
        :thresholdTime="2000"
        :alertMode="'once'"
        :alertInterval="3000"
        @update:fps="handleFpsUpdate"
        @alert:low-fps="handleLowFpsAlert"
      />
      <div id="fps-monitor-container" style="position: absolute; top: 10px; left: 10px; background-color: rgba(255, 255, 255, 0.8); padding: 5px;z-index: 10">当前fps：{{fps}}</div>
      <gdu-terrain-basemap
          v-if="show"
          :view-id="viewId"
          :url="terrainUrl"
      />
      <gdu-model-layer
          v-if="show"
          :view-id="viewId"
      >
        <gdu-tileset url="/wuhan_white_3dtile/tileset.json"/>
      </gdu-model-layer>
      <gdu-wmts-basemap
          v-if="show"
          :view-id="viewId"
          url="http://t{0-7}.tianditu.gov.cn/img_w/wmts?tk=490c03d5e1875b979156869f31651c6f"
          layer="img"
          tileStyle="default"
          format="tiles"
          tileMatrixSetID="w"
          :z-index="1"
      />
      <gdu-wmts-basemap
          v-if="show"
          :view-id="viewId"
          url="http://t{0-7}.tianditu.gov.cn/cia_w/wmts?tk=490c03d5e1875b979156869f31651c6f"
          layer="cia"
          tileStyle="default"
          format="tiles"
          tileMatrixSetID="w"
          :z-index="2"
      />
    `,
    components: {
      GduMap,
      GduWmtsBasemap,
      GduTerrainBasemap,
      GduModelLayer,
      GduTileset,
      FPSMonitor,
    },
    setup() {
      const show = ref(false);
      const selectId = ref("");
      const terrainUrl = "mapbox://mapbox.mapbox-terrain-dem-v1";
      const markerLayer = ref();
      const viewId = "map-view";
      function ready() {
        show.value = true;
      }
      const fpsMonitorRef = ref();
      const fps = ref(0);
      const handleFpsUpdate = (f: number) => {
        fps.value = f;
      };
      const handleLowFpsAlert = (fps: number) => {
        alert("低FPS警告:", fps);
      };
      onMounted(() => {
        fpsMonitorRef.value?.start();
      });
      onUnmounted(() => {
        fpsMonitorRef.value?.stop();
      });
      return {
        fps,
        fpsMonitorRef,
        handleFpsUpdate,
        handleLowFpsAlert,
        terrainUrl,
        selectId,
        args,
        markerLayer,
        ready,
        show,
        viewId,
      };
    },
  }),
};
