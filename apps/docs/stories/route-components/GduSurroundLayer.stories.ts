import type { Meta, StoryObj } from "@storybook/vue3-vite";

import {
  GduSurroundLayer,
  defaultSurroundShowLayerProps,
  GduMap,
  GduPolygon,
  GduVectorLayer,
  GduWmtsBasemap,
  GduTerrainBasemap,
  GduRouteLayer,
} from "@gdu-gl/map";
import { AltitudeMode, uuid } from "@gdu-gl/common";
import * as Cesium from "@gdu-gl/cesium";
import { ref } from "vue";
import * as turf from "@turf/turf";

const meta = {
  title: "航线图层/环绕飞行展示",
  component: GduSurroundLayer,
} satisfies Meta<typeof GduSurroundLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduSurroundLayer",
  argTypes: {
    altitudeMode: {
      control: "select",
      mapping: {
        [`海拔高度`]: AltitudeMode.Elevation,
        [`相对高度`]: AltitudeMode.Relative,
      },
      options: [`海拔高度`, `相对高度`],
    },
  },
  args: {
    ...defaultSurroundShowLayerProps,
    // @ts-ignore
    altitudeMode: "海拔高度",
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" @ready="ready"/>
      <template v-if="show" >
        <gdu-vector-layer :view-id="viewId">
          <gdu-surround-layer
              :view-id="viewId"
              v-bind="args"
              :coordinates="center"
              :radius="radius"
              :start-point="startPoint"
              :uav-position="uavPosition"
          >
            <template #popup>
              <div style="background-color: #2b2d42">
                15456456
              </div>
            </template>
          
          </gdu-surround-layer>
        </gdu-vector-layer>
      </template>
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
      <el-button-group style="position: absolute;left: 10px;top:10px;z-index: 10;">
        <el-button @click="start">开始绘制航</el-button>
      </el-button-group>
    `,
    components: {
      GduRouteLayer,
      GduMap,
      GduVectorLayer,
      GduSurroundLayer,
      GduWmtsBasemap,
      GduTerrainBasemap,
      GduPolygon,
    },
    setup() {
      const show = ref(false);
      const viewId = uuid();

      const center = ref<any>(null);
      const radius = ref<any>(0.5);
      const startPoint = ref<any>(null);
      const uavPosition = ref<any>(null);
      const terrainUrl = Cesium.IonResource.fromAssetId(1);
      const showEdit = ref(false);
      const takeoffPoint = ref<any>([]);

      function ready() {
        show.value = true;
      }

      function start() {
        radius.value = 0.5;
        center.value = turf.randomPoint(1, {
          bbox: [114.0665, 29.7333, 115.5161, 30.65],
        }).features[0].geometry.coordinates;
        startPoint.value = turf.destination(
          turf.point(center.value), // 起点：圆心点
          radius.value, // 距离：使用当前半径值（单位：千米）
          92, // 方位角：90°表示正东方向
        ).geometry.coordinates;

        const [lon, lat] = turf.destination(
          turf.point(center.value), // 起点：圆心点
          radius.value * 2, // 距离：使用当前半径值（单位：千米）
          110, // 方位角：90°表示正东方向
        ).geometry.coordinates;
        uavPosition.value = [lon, lat, (args.height ?? 500) / 2];
      }

      return {
        uavPosition,
        center,
        radius,
        startPoint,
        start,
        takeoffPoint,
        close,
        showEdit,
        args,
        ready,
        show,
        viewId,
        terrainUrl,
        AltitudeMode,
      };
    },
  }),
};
