import type { Meta, StoryObj } from "@storybook/vue3-vite";

import {
  GduMap,
  GduVectorLayer,
  GduMultiPolygon,
  defaultVectorPolygonProps,
  GduWmtsBasemap,
  GduTerrainBasemap,
} from "@gdu-gl/map";
import { uuid } from "@gdu-gl/common";
import * as Cesium from "@gdu-gl/cesium";
import { ref } from "vue";
import { action } from "storybook/actions";

const meta = {
  title: "几何图层/矢量图层/基础几何/面/多面",
  component: GduMultiPolygon,
} satisfies Meta<typeof GduMultiPolygon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduMultiPolygon",
  args: {
    ...defaultVectorPolygonProps,
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
        <gdu-multi-polygon v-if="polygons.length>0" v-bind="args" :coordinates="polygons"/>
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
      <el-button @click="createPolygons" style="position: absolute;z-index: 10;left: 10px;top:10px">创建随机面</el-button>
    `,
    components: {
      GduMap,
      GduVectorLayer,
      GduMultiPolygon,
      GduWmtsBasemap,
      GduTerrainBasemap,
    },
    setup() {
      const show = ref(false);
      const viewId = uuid();
      const terrainUrl = Cesium.IonResource.fromAssetId(1);
      const polygons = ref([] as any[]);
      function ready() {
        show.value = true;
      }

      function createPolygons() {
        polygons.value = [
          // 中国大陆主体
          [
            [
              [73.66, 53.56], // 新疆北部
              [135.08, 53.56], // 黑龙江东部
              [135.08, 18.15], // 曾母暗沙附近
              [73.66, 18.15], // 西藏西部
              [73.66, 53.56], // 闭合多边形
            ],
          ],
          // 台湾岛
          [
            [
              [121.5, 25.3],
              [122.0, 25.0],
              [121.8, 24.5],
              [121.5, 25.3], // 闭合
            ],
          ],
        ];
      }

      return {
        args,
        ready,
        show,
        viewId,
        polygons,
        createPolygons,
        terrainUrl,
      };
    },
  }),
};
