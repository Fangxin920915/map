import type { Meta, StoryObj } from "@storybook/vue3-vite";
import {
  defaultTerrainBasemapProps,
  GduMap,
  GduTerrainBasemap,
  GduWmtsBasemap,
  GduView,
} from "@gdu-gl/map";
import { uuid } from "@gdu-gl/common";
import { nextTick, ref } from "vue";
import * as Cesium from "cesium";

const meta = {
  title: "底图组件/地形",
  component: GduTerrainBasemap,
} satisfies Meta<typeof GduTerrainBasemap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduTerrainBasemap",
  args: {
    ...defaultTerrainBasemapProps,
    viewId: uuid(),
    url: "http://172.16.63.106:86/las/ng/dem/asd",
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" @ready="ready"/>
      <gdu-view v-if="showBasemap" :view-id="viewId" ref="view"/>
      <gdu-terrain-basemap
          v-if="showBasemap&&showTerrainBasemap"
          :view-id="viewId"
          url="http://172.16.63.106:86/las/ng/dem/asd"
      />
      <gdu-wmts-basemap
          v-if="showBasemap"
          :view-id="viewId"
          url="http://t{0-7}.tianditu.gov.cn/img_w/wmts?tk=490c03d5e1875b979156869f31651c6f"
          layer="img"
          tileStyle="default"
          format="tiles"
          tileMatrixSetID="w"
          :z-index="1"
      />
      <gdu-wmts-basemap
          v-if="showBasemap"
          :view-id="viewId"
          url="http://t{0-7}.tianditu.gov.cn/cia_w/wmts?tk=490c03d5e1875b979156869f31651c6f"
          layer="cia"
          tileStyle="default"
          format="tiles"
          tileMatrixSetID="w"
          :z-index="2"
      />
      <el-button @click="showTerrainBasemap=!showTerrainBasemap" style="position: absolute;left: 10px;top: 10px;z-index: 16">
        切换地形底图
      </el-button>
    `,
    components: { GduTerrainBasemap, GduMap, GduWmtsBasemap, GduView },
    setup() {
      const showBasemap = ref(false);
      const viewId = uuid();
      const extent = [100, 15, 150, 50];
      const showTerrainBasemap = ref(true);

      const view = ref();

      function ready() {
        showBasemap.value = true;
        nextTick(() => {
          view.value.jumpTo({
            position: [117.91002510306674, 24.61516416390552],
            heading: 0,
            pitch: -15,
            range: 5000,
          });
        });
      }
      return {
        args,
        ready,
        showBasemap,
        extent,
        view,
        viewId,
        showTerrainBasemap,
      };
    },
  }),
};
