import type { Meta, StoryObj } from "@storybook/vue3-vite";

import {
  GduRouteLayer,
  defaultRouteLayerProps,
  GduMap,
  GduVectorLayer,
  GduWmtsBasemap,
  GduTerrainBasemap,
  GduPoint,
} from "@gdu-gl/map";
import { refreshSurroundPointListByTurn, uuid } from "@gdu-gl/common";
import * as Cesium from "@gdu-gl/cesium";
import { ref } from "vue";

const meta = {
  title: "航线图层/航线展示",
  component: GduRouteLayer,
} satisfies Meta<typeof GduRouteLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduRouteLayer",
  args: {
    ...defaultRouteLayerProps,
  },
  render: (args) => ({
    template: `
          <gdu-map :view-id="viewId" @ready="ready"/>
          <gdu-vector-layer v-if="show" :view-id="viewId">
            <gdu-route-layer
                v-bind="args"
                :altitude-mode="args.altitudeMode"
                :view-id="viewId"
                :takeoff-point="takeoffPoint"
                :uav-position="uavPosition"
                :fly-to-point-index="flyToIndex"
                :type="routeType"
                :lines="lineStrings"
                :area="areaRef"
            />
            <gdu-point :clamp-to-ground="args.clampToGround" :coordinates="uavPosition"/>
          </gdu-vector-layer>
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
          <el-button @click="createPolylines" style="position: absolute;z-index: 10;left: 10px;top:10px">创建随机线
          </el-button>
        `,
    components: {
      GduMap,
      GduVectorLayer,
      GduRouteLayer,
      GduWmtsBasemap,
      GduTerrainBasemap,
      GduPoint,
    },
    setup() {
      const show = ref(false);
      const viewId = uuid();
      const areaRef = ref<any>([]);
      const terrainUrl = Cesium.IonResource.fromAssetId(1);
      const flyToIndex = ref(35);
      const uavPosition = ref([114.54379959516661, 30.49811206456882, 105.3]);
      const lineStrings = ref([] as any[]);
      const routeType = ref(1);
      const takeoffPoint = [114.57836340925648, 30.498879537979036, 10];

      function ready() {
        show.value = true;
      }

      function createPolylines() {
        const surroundLine = [
          {
            coordinates: [114.57836340925648, 30.498879537979036, 125.5],
            height: 199,
            isTurn: true,
          },
          {
            coordinates: [114.57916632949161, 30.496975349522437, 125.5],
            height: 139,
            surroundPoint: {
              coordinates: [114.57965605665113, 30.49690787681751, 66.5],
              enableCounterclockwise: false,
              angle: 180,
              stepAngle: 60,
              repeat: 1,
              height: 66.5,
              pointList: [
                {
                  coordinates: [114.57916632949161, 30.496975349522437],
                  heading: 99.08,
                  pitch: -56.76,
                },
                {
                  coordinates: [114.57947900824608, 30.497307055722587],
                  heading: 159.08,
                  pitch: -56.76,
                },
                {
                  coordinates: [114.5799687368586, 30.497239581848998],
                  heading: -140.92,
                  pitch: -56.76,
                },
                {
                  coordinates: [114.58014578313131, 30.49684040228219],
                  heading: -80.92,
                  pitch: -56.76,
                },
              ],
              // 小标为6
              shootingDistance: 49.760466433255516,
              radius: 47.517745220465706,
              arcLength: 149.28139929976658,
            },
            isTurn: true,
          },
          {
            coordinates: [114.58000316622172, 30.49628350871083, 125.5],
            height: 139,
            surroundPoint: {
              coordinates: [114.58089615468663, 30.496288420005772, 10],
              enableCounterclockwise: true,
              angle: 240,
              stepAngle: 60,
              repeat: 1,
              height: 10,
              fileSuffix: "",
              pointList: [
                {
                  coordinates: [114.58000316622172, 30.496283508710828],
                  heading: 89.63,
                  pitch: -56.45,
                },
                {
                  coordinates: [114.58045459657419, 30.4956195981665],
                  heading: 29.63,
                  pitch: -56.45,
                },
                {
                  coordinates: [114.58134757896774, 30.49562450638485],
                  heading: -30.37,
                  pitch: -56.45,
                },
                {
                  coordinates: [114.58178914324165, 30.49629332521478],
                  heading: -90.37,
                  pitch: -56.45,
                },
                {
                  coordinates: [114.58133771887053, 30.496957240357],
                  heading: -150.37,
                  pitch: -56.45,
                },
              ],
              // 下标为12
              shootingDistance: 89.59955568304959,
              radius: 85.5612731147692,
              arcLength: 358.39822273219835,
            },
            isTurn: true,
          },
          {
            coordinates: [114.58067959516663, 30.498002064568823, 125.5],
            height: 139,
            surroundPoint: {
              coordinates: [114.5801848278124, 30.49841286495398, 20],
              enableCounterclockwise: true,
              angle: 360,
              stepAngle: 70,
              repeat: 3,
              height: 20,
              fileSuffix: "",
              pointList: [
                {
                  coordinates: [114.58067959516661, 30.49800206456882],
                  heading: -46.06,
                  pitch: -61.05,
                },
                {
                  coordinates: [114.58084510235966, 30.498576662956395],
                  heading: -106.06,
                  pitch: -61.05,
                },
                {
                  coordinates: [114.5803503327818, 30.498987463966532],
                  heading: -166.06,
                  pitch: -61.05,
                },
                {
                  coordinates: [114.57969005627926, 30.49882366347078],
                  heading: 133.94,
                  pitch: -61.05,
                },
                {
                  coordinates: [114.57952455548877, 30.498249063624193],
                  heading: 73.94,
                  pitch: -61.05,
                },
                {
                  coordinates: [114.58001932479822, 30.497838265732366],
                  heading: 13.94,
                  pitch: -61.05,
                },
                {
                  coordinates: [114.58067959516661, 30.49800206456882],
                  heading: -46.06,
                  pitch: -61.05,
                },
                {
                  coordinates: [114.58084510235966, 30.498576662956395],
                  heading: -106.06,
                  pitch: -61.05,
                },
                {
                  coordinates: [114.5803503327818, 30.498987463966532],
                  heading: -166.06,
                  pitch: -61.05,
                },
                {
                  coordinates: [114.57969005627926, 30.49882366347078],
                  heading: 133.94,
                  pitch: -61.05,
                },
                {
                  coordinates: [114.57952455548877, 30.498249063624193],
                  heading: 73.94,
                  pitch: -61.05,
                },
                {
                  coordinates: [114.58001932479822, 30.497838265732366],
                  heading: 13.94,
                  pitch: -61.05,
                },
                {
                  coordinates: [114.58067959516661, 30.49800206456882],
                  heading: -46.06,
                  pitch: -61.05,
                },
                {
                  coordinates: [114.58084510235966, 30.498576662956395],
                  heading: -106.06,
                  pitch: -61.05,
                },
                {
                  coordinates: [114.5803503327818, 30.498987463966532],
                  heading: -166.06,
                  pitch: -61.05,
                },
                {
                  coordinates: [114.57969005627926, 30.49882366347078],
                  heading: 133.94,
                  pitch: -61.05,
                },
                {
                  coordinates: [114.57952455548877, 30.498249063624193],
                  heading: 73.94,
                  pitch: -61.05,
                },
                {
                  coordinates: [114.58001932479822, 30.497838265732366],
                  heading: 13.94,
                  pitch: -61.05,
                },
                {
                  coordinates: [114.58067959516661, 30.49800206456882],
                  heading: -46.06,
                  pitch: -61.05,
                },
              ],
              // 下标32
              shootingDistance: 68.93796771399799,
              radius: 65.83090997035362,
              arcLength: 413.627806283988,
            },
            isTurn: true,
          },
          {
            coordinates: [114.57917442318079, 30.4998172527249, 125.5],
            height: 139,
            isTurn: true,
          },
          {
            coordinates: [114.57986442318079, 30.4949172527249, 125.5],
            height: 139,
            isTurn: true,
          },
          {
            coordinates: [114.57212442318079, 30.4997972527249, 125.5],
            height: 139,
            isTurn: true,
          },
        ];

        const line = [surroundLine];

        routeType.value = 1;
        console.log("line", line);
        lineStrings.value = line;
        // areaRef.value = routeType.value === 1 ? area1 : area2;
      }

      return {
        takeoffPoint,
        args,
        ready,
        show,
        viewId,
        lineStrings,
        createPolylines,
        terrainUrl,
        flyToIndex,
        uavPosition,
        routeType,
        areaRef,
      };
    },
  }),
};
