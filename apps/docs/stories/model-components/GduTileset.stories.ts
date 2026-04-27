import type { Meta, StoryObj } from "@storybook/vue3-vite";

import {
  defaultTilesetFeatureProps,
  GduMap,
  GduModelLayer,
  GduTileset,
  GduVectorLayer,
  GduPoint,
  GduWmtsBasemap,
  GduTerrainBasemap,
  GduView,
} from "@gdu-gl/map";
import { MouseEventParams, uuid } from "@gdu-gl/common";
import { nextTick, ref } from "vue";

const meta = {
  title: "模型图层/3dTileset",
  component: GduTileset,
} satisfies Meta<typeof GduTileset>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduTileset",
  args: {
    ...defaultTilesetFeatureProps,
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" @ready="ready"/>
      <gdu-model-layer v-if="show" :view-id="viewId">
          <gdu-tileset :view-id="viewId" url="http://172.16.63.166:32157/ng/3dts/4d3bffc6fe8171a67ed5276e2ade0c3d/tileset.json"/>
      </gdu-model-layer>
      <gdu-view v-if="show" ref="viewRef" :view-id="viewId"/>
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
      <el-button @click="showTileset=!showTileset" style="position: absolute; top: 10px; left: 10px;z-index: 99">切换3dTileset</el-button>
    `,
    components: {
      GduMap,
      GduVectorLayer,
      GduPoint,
      GduModelLayer,
      GduTileset,
      GduWmtsBasemap,
      GduTerrainBasemap,
      GduView,
    },
    setup() {
      const show = ref(false);
      const viewId = uuid();
      const showTileset = ref(false);
      const viewRef = ref();

      const animation = ref({
        play: true,
        loop: true,
        speed: 1,
        animateNodeName: "Fly",
      });

      const coordinates = ref<any>(null);

      function ready() {
        show.value = true;
        // nextTick(() => {
        //   viewRef.value.flyToBounds({
        //     positions: [
        //       [114.56676943285092, 30.49116383778217, -115.7278923979029],
        //       [114.56676998340612, 30.49116413252364, 135.99250799044967],
        //       [114.56676755129348, 30.504402139025284, -111.4451364427805],
        //       [114.56676810199706, 30.50440190915216, 140.27526477351785],
        //       [114.59234060991608, 30.49116406878232, -115.77138214651497],
        //       [114.5923401522444, 30.49116436350554, 135.9490199573338],
        //       [114.59234217403812, 30.504402370146583, -111.48862613365054],
        //       [114.59234171624313, 30.504402140255184, 140.23177679721266],
        //     ],
        //   });
        // });
      }

      function clickModel(params: MouseEventParams) {
        console.log(params);
      }

      return {
        showTileset,
        args,
        ready,
        show,
        viewId,
        coordinates,
        animation,
        clickModel,
        viewRef,
      };
    },
  }),
};
