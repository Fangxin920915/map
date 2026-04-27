import type { Meta, StoryObj } from "@storybook/vue3-vite";

import {
  defaultVectorLineStringProps,
  GduMap,
  GduVectorLayer,
  GduMultiLineString,
  GduWmtsBasemap,
  GduTerrainBasemap,
} from "@gdu-gl/map";
import { uuid } from "@gdu-gl/common";
import * as Cesium from "cesium";
import { ref } from "vue";
import { action } from "storybook/actions";
import * as turf from "@turf/turf";

const meta = {
  title: "几何图层/矢量图层/基础几何/线/多线",
  component: GduMultiLineString,
} satisfies Meta<typeof GduMultiLineString>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduMultiLineString",
  args: {
    ...defaultVectorLineStringProps,
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
        <GduMultiLineString v-if="lineStrings.length>0" v-bind="args" :coordinates="lineStrings"/>
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
      <el-button @click="createPolylines" style="position: absolute;z-index: 10;left: 10px;top:10px">创建随机线</el-button>
    `,
    components: {
      GduMap,
      GduVectorLayer,
      GduMultiLineString,
      GduWmtsBasemap,
      GduTerrainBasemap,
    },
    setup() {
      const show = ref(false);
      const viewId = uuid();
      const terrainUrl = Cesium.IonResource.fromAssetId(1);
      const lineStrings = ref([] as any[]);
      function ready() {
        show.value = true;
      }

      function createPolylines() {
        lineStrings.value = turf
          .randomLineString(3, {
            bbox: [70, 10, 150, 60],
            num_vertices: 15,
            max_length: 0.5,
          })
          .features.map((feature) => feature.geometry.coordinates);
      }

      return {
        args,
        ready,
        show,
        viewId,
        lineStrings,
        createPolylines,
        terrainUrl,
      };
    },
  }),
};
