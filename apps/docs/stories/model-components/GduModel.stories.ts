import type { Meta, StoryObj } from "@storybook/vue3-vite";

import {
  defaultModelFeatureProps,
  GduMap,
  GduModelLayer,
  GduModel,
  GduVectorLayer,
  GduPoint,
  GduWmtsBasemap,
  GduTerrainBasemap,
} from "@gdu-gl/map";
import { MouseEventParams, uuid } from "@gdu-gl/common";
import { ref } from "vue";
import * as turf from "@turf/turf";
import { action } from "storybook/actions";

const meta = {
  title: "模型图层/模型",
  component: GduModel,
} satisfies Meta<typeof GduModel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduModel",
  args: {
    ...defaultModelFeatureProps,
    minimumPixelSize: 50,
    url: "/uav.glb",
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
      <gdu-model-layer v-if="show" :view-id="viewId">
          <gdu-model 
              v-if="showTileset"
              v-bind="args"
              :view-id="viewId"
              :coordinates="coordinates"
              :minimum-pixel-size="100"
              :enable-path-track="true"
              :pitch="30"
              @click="clickModel"
          />
      </gdu-model-layer>
<!--      <gdu-vector-layer v-if="show" :view-id="viewId">-->
<!--        <gdu-point :shape-size="50" :coordinates="coordinates"/>-->
<!--      </gdu-vector-layer>-->
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
      <el-button-group style="position: absolute; top: 10px; left: 10px;z-index: 99">
        <el-button @click="showTileset=!showTileset">切换3dTileset</el-button>
        <el-button @click="changePosition">切换位置</el-button>
      </el-button-group>
    `,
    components: {
      GduMap,
      GduVectorLayer,
      GduPoint,
      GduModelLayer,
      GduModel,
      GduWmtsBasemap,
      GduTerrainBasemap,
    },
    setup() {
      const show = ref(false);
      const viewId = uuid();
      const showTileset = ref(false);

      const animation = ref({
        play: true,
        loop: true,
        speed: 1,
        animateNodeName: "Fly",
      });

      const coordinates = ref<any>(null);

      function ready() {
        show.value = true;
        updateCoordinates();
      }

      function updateCoordinates() {
        // setInterval(() => {
        const position = turf.randomPoint(1, {
          bbox: [110.99, 29.83, 117.01, 31.85],
        }).features[0].geometry.coordinates;
        coordinates.value = [...position, 5000];
        // }, 1000);
      }

      function clickModel(params: MouseEventParams) {
        console.log(params);
      }

      function changePosition() {
        if (coordinates.value && coordinates.value.length > 0) {
          coordinates.value = null;
        } else {
          updateCoordinates();
        }
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
        changePosition,
      };
    },
  }),
};
