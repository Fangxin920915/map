import type { Meta, StoryObj } from "@storybook/vue3-vite";

import {
  defaultPointCloudFeatureProps,
  GduMap,
  GduPointCloud,
  GduWmtsBasemap,
  GduView,
} from "@gdu-gl/map";
import { uuid } from "@gdu-gl/common";
import { ref, reactive } from "vue";

const meta = {
  title: "模型图层/点云",
  component: GduPointCloud,
} satisfies Meta<typeof GduPointCloud>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduPointCloud",
  args: {
    ...defaultPointCloudFeatureProps,
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" @ready="ready"/>
      <gdu-point-cloud
          v-if="show"
          :view-id="viewId"
          :url="pointCloudUrl"
          :visible="visible"
          :auto-zoom="true"
          :maximum-screen-space-error="maximumScreenSpaceError"
          :point-cloud-shading="pointCloudShading"
          :style="pointStyle"
          @ready="onPointCloudReady"
          @error="onPointCloudError"
      />
      <gdu-view v-if="show" ref="viewRef" :view-id="viewId"/>
      <gdu-wmts-basemap
          v-if="show"
          :view-id="viewId"
          url="https://t{0-7}.tianditu.gov.cn/img_w/wmts?tk=490c03d5e1875b979156869f31651c6f"
          layer="img"
          tileStyle="default"
          format="tiles"
          tileMatrixSetID="w"
          :z-index="1"
      />
      <gdu-wmts-basemap
          v-if="show"
          :view-id="viewId"
          url="https://t{0-7}.tianditu.gov.cn/cia_w/wmts?tk=490c03d5e1875b979156869f31651c6f"
          layer="cia"
          tileStyle="default"
          format="tiles"
          tileMatrixSetID="w"
          :z-index="2"
      />
      <div style="position: absolute; top: 10px; left: 10px; z-index: 99; background: rgba(0,0,0,0.7); padding: 12px; border-radius: 8px; color: #fff;">
        <div style="margin-bottom: 8px; font-weight: bold;">点云控制面板</div>
        <el-button @click="visible = !visible" size="small">{{ visible ? '隐藏' : '显示' }}点云</el-button>
        <el-button @click="toggleEDL" size="small">{{ pointCloudShading.eyeDomeLighting ? '关闭' : '开启' }} EDL</el-button>
        <el-button @click="toggleAttenuation" size="small">{{ pointCloudShading.attenuation ? '关闭' : '开启' }}衰减</el-button>
      </div>
    `,
    components: {
      GduMap,
      GduPointCloud,
      GduWmtsBasemap,
      GduView,
    },
    setup() {
      const show = ref(false);
      const viewId = uuid();
      const visible = ref(true);
      const viewRef = ref();
      const pointCloudUrl = ref("");
      const maximumScreenSpaceError = ref(16);

      const pointCloudShading = reactive({
        attenuation: true,
        geometricErrorScale: 1,
        maximumAttenuation: 5,
        eyeDomeLighting: true,
        eyeDomeLightingStrength: 1,
        eyeDomeLightingRadius: 1,
      });

      const pointStyle = ref(undefined);

      function ready() {
        show.value = true;
      }

      function onPointCloudReady(tileset: any) {
        console.log("点云加载完成", tileset);
      }

      function onPointCloudError(error: unknown) {
        console.warn("点云加载失败", error);
      }

      function toggleEDL() {
        pointCloudShading.eyeDomeLighting = !pointCloudShading.eyeDomeLighting;
      }

      function toggleAttenuation() {
        pointCloudShading.attenuation = !pointCloudShading.attenuation;
      }

      return {
        args,
        ready,
        show,
        viewId,
        visible,
        viewRef,
        pointCloudUrl,
        maximumScreenSpaceError,
        pointCloudShading,
        pointStyle,
        onPointCloudReady,
        onPointCloudError,
        toggleEDL,
        toggleAttenuation,
      };
    },
  }),
};
