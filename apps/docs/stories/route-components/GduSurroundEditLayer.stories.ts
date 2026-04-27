import type { Meta, StoryObj } from "@storybook/vue3-vite";

import {
  GduSurroundEditLayer,
  defaultSurroundEditLayerProps,
  GduMap,
  GduPolygon,
  GduVectorLayer,
  GduWmtsBasemap,
  GduTerrainBasemap,
  GduRouteLayer,
} from "@gdu-gl/map";
import { AltitudeMode, uuid } from "@gdu-gl/common";
import * as Cesium from "@gdu-gl/cesium";
import * as turf from "@turf/turf";
import { computed, ref } from "vue";

const meta = {
  title: "航线图层/环绕飞行编辑",
  component: GduSurroundEditLayer,
} satisfies Meta<typeof GduSurroundEditLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduSurroundEditLayer",
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
    ...defaultSurroundEditLayerProps,
    // @ts-ignore
    altitudeMode: "海拔高度",
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" @ready="ready"/>
      <template v-if="show" >
        <gdu-vector-layer :view-id="viewId">
          <gdu-surround-edit-layer
              :view-id="viewId"
              v-bind="args"
              :coordinates="center"
              :radius="radius"
              :takeoffPoint="takeoffPoint"
              @changed="changed"
          />
          <gdu-polygon v-if="polygonCircle" :coordinates="polygonCircle" clamp-to-ground fill-color="rgba(0,0,255,0)"/>
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
        <el-button @click="clear">清空图层</el-button>
      </el-button-group>
    `,
    components: {
      GduRouteLayer,
      GduMap,
      GduVectorLayer,
      GduSurroundEditLayer,
      GduWmtsBasemap,
      GduTerrainBasemap,
      GduPolygon,
    },
    setup() {
      const show = ref(false);
      const viewId = uuid();

      const center = ref<any>(null);
      const radius = ref(0.5);
      const terrainUrl = Cesium.IonResource.fromAssetId(1);
      const showEdit = ref(false);
      const takeoffPoint = ref<any>([
        114.29972190548438, 30.591334725443318, 0,
      ]);

      const polygonCircle = computed(() => {
        if (!takeoffPoint.value) {
          return null;
        }
        const circle = turf.circle(takeoffPoint.value, args.maxDistance!);
        return circle.geometry.coordinates;
      });

      function ready() {
        show.value = true;
      }

      function clear() {
        center.value = null;
        radius.value = 0.5;
      }

      function start() {
        center.value = null;
        radius.value = 0.5;
      }

      function changed(a: any) {
        center.value = a.coordinates;
        radius.value = a.radius;
      }

      return {
        center,
        radius,
        start,
        clear,
        takeoffPoint,
        close,
        showEdit,
        args,
        ready,
        show,
        viewId,
        terrainUrl,
        changed,
        AltitudeMode,
        polygonCircle,
      };
    },
  }),
};
