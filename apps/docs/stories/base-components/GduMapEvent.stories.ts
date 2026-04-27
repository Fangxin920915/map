import type { Meta, StoryObj } from "@storybook/vue3-vite";

import {
  GduMap,
  GduMapEvent,
  GduWmtsBasemap,
  GduTerrainBasemap,
} from "@gdu-gl/map";
import { uuid } from "@gdu-gl/common";
import { ref } from "vue";
import { action } from "storybook/actions";
import * as Cesium from "@gdu-gl/cesium";

const meta = {
  title: "基础组件/地图事件",
  component: GduMapEvent,
} satisfies Meta<typeof GduMapEvent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduMapEvent",
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" @ready="ready"/>
      <gdu-map-event 
          v-if="show" 
          v-bind="args" 
          :view-id="viewId" 
          @click="click" 
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
    `,
    components: { GduMapEvent, GduMap, GduWmtsBasemap, GduTerrainBasemap },
    setup() {
      const show = ref(false);
      const terrainUrl = Cesium.IonResource.fromAssetId(1);
      const viewId = uuid();
      function ready() {
        show.value = true;
      }

      function click(e: any) {
        console.log(1111, e);
      }

      return { args, ready, show, terrainUrl, viewId, click };
    },
  }),
  args: {
    viewId: uuid(),
    // onClick: action("鼠标点击事件"),
    onCameraMoveStart: action("开始移动相机"),
    onCameraMoving: action("相机移动中"),
    onCameraMoveEnd: action("移动相机结束"),
  },
};
