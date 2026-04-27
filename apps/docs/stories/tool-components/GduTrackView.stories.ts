import type { Meta, StoryObj } from "@storybook/vue3-vite";

import {
  GduMap,
  GduTrackView,
  defaultTrackViewProps,
  GduWmtsBasemap,
  GduView,
  GduVectorLayer,
  GduTerrainBasemap,
  GduModelLayer,
  GduModel,
} from "@gdu-gl/map";
import { uuid } from "@gdu-gl/common";
import { ref } from "vue";
import * as turf from "@turf/turf";

const meta = {
  title: "工具组件/视角跟随",
  component: GduTrackView,
} satisfies Meta<typeof GduTrackView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduTrackView",
  args: {
    ...defaultTrackViewProps,
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" @ready="ready"/>
      <gdu-track-view
          v-if="show"
          v-bind="args"
          :enable="enable"
          :axis-y="axisY"
          :view-id="viewId"
          :coordinates="coordinates"
      />
      <gdu-model-layer v-if="show" :view-id="viewId">
        <gdu-model
            v-if="coordinates"
            :view-id="viewId"
            url="/CesiumDrone.glb"
            :coordinates="coordinates"
            :minimum-pixel-size="100"
            :clamp-to-ground="args.clampToGround"
        />
      </gdu-model-layer>
      <gdu-terrain-basemap
          v-if="show"
          :view-id="viewId"
          :url="terrainUrl"
      />
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
      <el-button-group style="position: absolute;left: 10px;top: 10px;z-index: 999">
        <el-button @click="switchVerticalLock">切换垂直锁定</el-button>
        <el-button @click="switchTiltLock">切换倾斜锁定</el-button>
        <el-button @click="cancelLock">解锁锁定</el-button>
      </el-button-group>
    `,
    components: {
      GduMap,
      GduTrackView,
      GduWmtsBasemap,
      GduView,
      GduVectorLayer,
      GduTerrainBasemap,
      GduModelLayer,
      GduModel,
    },
    setup() {
      const terrainUrl = "http://172.30.0.10:32305/";
      // 主地图加载状态
      const show = ref(false);

      // 点位坐标
      const coordinates = ref<any>(null);

      const enable = ref(false);

      const axisY = ref(0);

      // 主地图视角控制组件
      const view = ref();

      const viewId = uuid();

      function ready() {
        show.value = true;
        updateCoordinates();
      }

      function updateCoordinates() {
        setInterval(() => {
          const position = turf.randomPoint(1, {
            bbox: [110.99, 29.83, 117.01, 31.85],
          }).features[0].geometry.coordinates;
          coordinates.value = [...position, 5000];
        }, 1000);
      }

      function switchVerticalLock() {
        enable.value = true;
        axisY.value = 0;
      }
      function switchTiltLock() {
        enable.value = true;
        axisY.value = 60;
      }
      function cancelLock() {
        enable.value = false;
      }
      return {
        switchTiltLock,
        switchVerticalLock,
        cancelLock,
        enable,
        axisY,
        args,
        coordinates,
        ready,
        terrainUrl,
        show,
        view,
        viewId,
      };
    },
  }),
};
