import type { Meta, StoryObj } from "@storybook/vue3-vite";

import {
  GduMap,
  GduElectronicFenceLayer,
  defaultElectronicFenceLayerProps,
  GduWmtsBasemap,
  GduTerrainBasemap,
  GduModelLayer,
  GduTileset,
} from "@gdu-gl/map";
import { ref } from "vue";
import { ElectronicFenceType, uuid } from "@gdu-gl/common";
import * as turf from "@turf/turf";

const meta = {
  title: "电子围栏图层",
  component: GduElectronicFenceLayer,
  parameters: {
    order: 3,
  },
} satisfies Meta<typeof GduElectronicFenceLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduElectronicFenceLayer",
  args: {
    ...defaultElectronicFenceLayerProps,
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" @ready="ready"/>
      <gdu-electronic-fence-layer 
          v-if="show" 
          ref="markerLayer" 
          v-bind="args"
          :view-id="viewId"
          v-model:select-id="selectId"
          v-model:data-source="dataSource"
      />
      <gdu-terrain-basemap
          v-if="show"
          :view-id="viewId"
          :url="terrainUrl"
      />
      <gdu-model-layer
          v-if="show"
          :view-id="viewId"
      >
        <gdu-tileset :view-id="viewId" url="http://172.16.64.112:30767/ng/3dts/e26130971365ea6579424f2c4d2ef879/tileset.json"/>
      </gdu-model-layer>
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
      <el-button-group style="position: absolute;z-index: 10;top:10px;left: 10px;">
        <el-button @click="startDraw(1)">禁飞区(面)</el-button>
        <el-button @click="startDraw(2)">限高区(面)</el-button>
        <el-button @click="startDraw(3)">适飞区(面)</el-button>
        <el-button @click="startDraw(1,true)">禁飞区(圆)</el-button>
        <el-button @click="startDraw(2,true)">限高区(圆)</el-button>
        <el-button @click="startDraw(3,true)">适飞区(圆)</el-button>
      </el-button-group>
    `,
    components: {
      GduMap,
      GduElectronicFenceLayer,
      GduWmtsBasemap,
      GduTerrainBasemap,
      GduModelLayer,
      GduTileset,
    },
    setup() {
      const show = ref(false);
      const viewId = uuid();
      const selectId = ref("");
      const terrainUrl = "mapbox://mapbox.mapbox-terrain-dem-v1";
      const markerLayer = ref();
      const arr = turf
        .randomPolygon(0, {
          bbox: [
            40.61303940353882, 5.70485148063935, 130.6435766514326,
            50.72777532557219,
          ],
          num_vertices: 6,
          max_radial_length: 5,
        })
        .features.map((feature) => {
          const obj = {
            geometry: feature.geometry,
            properties: {
              id: uuid(),
              options: {
                type: Math.floor(Math.random() * 3) + 1,
                name: "禁飞区",
                height: 10000 * Math.random(),
              },
            },
          };
          return obj;
        });
      const dataSource = ref<any[]>(arr);
      function ready() {
        show.value = true;
      }

      function startDraw(type: ElectronicFenceType, drawCircle?: boolean) {
        markerLayer.value.startDraw(type, drawCircle);
      }

      return {
        terrainUrl,
        selectId,
        args,
        startDraw,
        dataSource,
        markerLayer,
        ready,
        show,
        viewId,
      };
    },
  }),
};
