import type { Meta, StoryObj } from "@storybook/vue3-vite";

import {
  GduMap,
  GduMeasureTool,
  defaultMeasureToolProps,
  GduWmtsBasemap,
  GduTerrainBasemap,
} from "@gdu-gl/map";
import { MeasureType, uuid } from "@gdu-gl/common";
import { ref } from "vue";
import * as Cesium from "@gdu-gl/cesium";
import { action } from "storybook/actions";

const meta = {
  title: "工具组件/量测组件",
  component: GduMeasureTool,
} satisfies Meta<typeof GduMeasureTool>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduMeasureTool",
  args: {
    ...defaultMeasureToolProps,
    onStartMeasure: action("开始量测"),
    onFinishMeasure: action("完成量测"),
    onCancelDrawing: action("取消量测"),
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" @ready="ready"/>
      <gdu-measure-tool v-if="show" :view-id="viewId" v-bind="args" ref="measure"
                        v-model:measure-results="measureResults"/>
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
        <el-button @click="startMeasureDistance">开始测距</el-button>
        <el-button @click="startMeasureArea">开始测面</el-button>
        <el-button @click="finishMeasure">结束测量</el-button>
        <el-button @click="cancelMeasure">关闭测量</el-button>
      </el-button-group>
    `,
    components: { GduMap, GduMeasureTool, GduWmtsBasemap, GduTerrainBasemap },
    setup() {
      const show = ref(false);
      const viewId = uuid();
      const measure = ref();
      const terrainUrl = Cesium.IonResource.fromAssetId(1);
      const measureResults = ref([]);
      function ready() {
        show.value = true;
      }

      function startMeasureDistance() {
        measure.value.startMeasure(MeasureType.Distance);
      }

      function startMeasureArea() {
        measure.value.startMeasure(MeasureType.Area, uuid());
      }

      function finishMeasure() {
        measure.value.finishMeasure();
      }

      function cancelMeasure() {
        measure.value.cancelMeasure();
      }

      return {
        args,
        ready,
        show,
        measure,
        measureResults,
        cancelMeasure,
        terrainUrl,
        viewId,
        startMeasureDistance,
        startMeasureArea,
        finishMeasure,
      };
    },
  }),
};
