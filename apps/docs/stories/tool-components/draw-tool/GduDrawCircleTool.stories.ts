import type { Meta, StoryObj } from "@storybook/vue3-vite";

import {
  GduMap,
  GduDrawCircleTool,
  defaultDrawCircleProps,
  GduWmtsBasemap,
  GduTerrainBasemap,
} from "@gdu-gl/map";
import { uuid } from "@gdu-gl/common";
import { ref } from "vue";
import * as Cesium from "@gdu-gl/cesium";

const meta = {
  title: "工具组件/绘制工具/绘制圆",
  component: GduDrawCircleTool,
} satisfies Meta<typeof GduDrawCircleTool>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduDrawCircleTool",
  args: {
    ...defaultDrawCircleProps,
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" @ready="ready"/>
      <gdu-draw-circle-tool
          v-if="show" 
          v-bind="args"
          :view-id="viewId" 
          ref="drawCircle"
          @finish="(e) => console.log(e)"
      />
<!--      <gdu-terrain-basemap-->
<!--          v-if="show"-->
<!--          :view-id="viewId"-->
<!--          :url="terrainUrl"-->
<!--      />-->
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
      <el-button-group style="position: absolute;z-index: 10;top:10px;left: 10px;">
        <el-button @click="startDraw">开始绘制</el-button>
        <el-button @click="finishDraw">完成绘制</el-button>
        <el-button @click="cancelDraw">取消绘制</el-button>
      </el-button-group>
    `,
    components: {
      GduMap,
      GduDrawCircleTool,
      GduWmtsBasemap,
      GduTerrainBasemap,
    },
    setup() {
      const show = ref(false);
      const viewId = uuid();
      const drawCircle = ref();
      const terrainUrl = Cesium.IonResource.fromAssetId(1);
      function ready() {
        show.value = true;
      }

      function startDraw() {
        drawCircle.value.startDraw();
      }

      function finishDraw() {
        drawCircle.value.finishDraw();
      }

      function cancelDraw() {
        drawCircle.value.cancelDraw();
      }

      return {
        args,
        ready,
        show,
        drawCircle,
        startDraw,
        finishDraw,
        cancelDraw,
        terrainUrl,
        viewId,
      };
    },
  }),
};
