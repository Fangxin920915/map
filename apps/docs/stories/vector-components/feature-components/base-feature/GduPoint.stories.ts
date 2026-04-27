import type { Meta, StoryObj } from "@storybook/vue3-vite";

import {
  GduMap,
  GduVectorLayer,
  GduPoint,
  defaultVectorPointProps,
  singlePointProps,
  GduWmtsBasemap,
  GduTerrainBasemap,
} from "@gdu-gl/map";
import { uuid } from "@gdu-gl/common";
import * as Cesium from "@gdu-gl/cesium";
import { ref, nextTick } from "vue";
import { action } from "storybook/actions";

const meta = {
  title: "几何图层/矢量图层/基础几何/点/单点",
  component: GduPoint,
  parameters: {
    order: 1,
  },
} satisfies Meta<typeof GduPoint>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduPoint",
  args: {
    ...singlePointProps,
    ...defaultVectorPointProps,
    onClick: action("要素被左键点击"),
    onDblclick: action("要素被左键双击"),
    onContextmenu: action("要素被右键点击"),
    onMouseEnter: action("划入要素"),
    onMouseOver: action("在要素上滑动"),
    onMouseLeave: action("划出要素"),
    onModifyStart: action("开始拖动"),
    onModifying: action("拖动中"),
    onModifyEnd: action("拖动结束"),
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" :engine-type="args.engineType" @ready="ready"/>
      <gdu-vector-layer v-if="show" :view-id="viewId">
<!--        <template v-for="({geometry},index) in points" :key="index">-->
<!--          -->
<!--        </template>-->
        <gdu-point  v-bind="args" v-model:coordinates="points1"/>
        <gdu-point  v-bind="args" v-model:coordinates="points2"/>
      </gdu-vector-layer>
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
      <el-button @click="createPoint" style="position: absolute;z-index: 10;left: 10px;top:10px">创建随机点</el-button>
    `,
    components: {
      GduMap,
      GduVectorLayer,
      GduPoint,
      GduWmtsBasemap,
      GduTerrainBasemap,
    },
    setup() {
      const show = ref(false);
      const viewId = uuid();
      const terrainUrl = Cesium.IonResource.fromAssetId(1);
      const points1 = ref([112, 30, 1000]);
      const points2 = ref([112, 30.005, 1000]);
      function ready() {
        show.value = true;
      }

      nextTick(() => {
        points1.value[2] = 2000;
      });

      function createPoint() {
        // points.value = turf.randomPoint(100, {
        //   bbox: [70, 10, 150, 60],
        // }).features;
      }

      return {
        args,
        ready,
        show,
        viewId,
        points1,
        points2,
        createPoint,
        terrainUrl,
      };
    },
  }),
};
