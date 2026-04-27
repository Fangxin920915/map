import type { Meta, StoryObj } from "@storybook/vue3-vite";
import {
  GduMap,
  GduVectorLayer,
  GduMultiPoint,
  defaultVectorPointProps,
  GduWmtsBasemap,
  GduTerrainBasemap,
} from "@gdu-gl/map";
import { uuid } from "@gdu-gl/common";
import { ref } from "vue";
import * as Cesium from "@gdu-gl/cesium";
import { action } from "storybook/actions";

const meta = {
  title: "几何图层/矢量图层/基础几何/点/多点",
  component: GduMultiPoint,
  parameters: {
    order: 1,
  },
} satisfies Meta<typeof GduMultiPoint>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduMultiPoint",
  args: {
    ...defaultVectorPointProps,
    onClick: action("要素被左键点击"),
    onDblclick: action("要素被左键双击"),
    onContextmenu: action("要素被右键点击"),
    onMouseEnter: action("划入要素"),
    onMouseOver: action("在要素上滑动"),
    onMouseLeave: action("划出要素"),
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" @ready="ready"/>
      <gdu-vector-layer v-if="show" :view-id="viewId">
        <gdu-multi-point v-if="points.length>0" v-bind="args" :coordinates="points"/>
      </gdu-vector-layer>
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
      <el-button @click="createPoint" style="position: absolute;z-index: 10;left: 10px;top:10px">创建随机点</el-button>
    `,
    components: {
      GduMap,
      GduVectorLayer,
      GduMultiPoint,
      GduWmtsBasemap,
      GduTerrainBasemap,
    },
    setup() {
      const show = ref(false);
      const viewId = uuid();
      const terrainUrl = Cesium.IonResource.fromAssetId(1);
      const points = ref([] as number[][]);
      function ready() {
        show.value = true;
      }

      function createPoint() {
        points.value = [
          [112, 30, 0],
          [111, 32, 0],
        ];
      }

      return { args, ready, show, viewId, points, createPoint, terrainUrl };
    },
  }),
};
