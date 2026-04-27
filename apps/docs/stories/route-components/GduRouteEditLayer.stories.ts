import type { Meta, StoryObj } from "@storybook/vue3-vite";

import {
  GduRouteEditLayer,
  defaultRouteEditLayerProps,
  GduMap,
  GduPolygon,
  GduVectorLayer,
  GduWmtsBasemap,
  GduTerrainBasemap,
  GduRouteLayer,
  GduModelLayer,
  GduTileset,
  GduPopup,
  GduPoint,
} from "@gdu-gl/map";
import {
  RouteLayerType,
  AltitudeMode,
  uuid,
  keepRouteElevationByAltitudeMode,
} from "@gdu-gl/common";
import * as Cesium from "@gdu-gl/cesium";
import { computed, ref } from "vue";

const meta = {
  title: "航线图层/航线编辑",
  component: GduRouteEditLayer,
} satisfies Meta<typeof GduRouteEditLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduRouteEditLayer",
  argTypes: {
    altitudeMode: {
      control: "select",
      mapping: {
        [`海拔高度`]: AltitudeMode.Elevation,
        [`相对高度`]: AltitudeMode.Relative,
      },
      options: [`海拔高度`, `相对高度`],
    },
    type: {
      control: "select",
      mapping: {
        [`航点航线`]: RouteLayerType.MapProjectTypePoint,
        [`正射航线`]: RouteLayerType.MapProjectType3D,
        [`AI巡检任务`]: RouteLayerType.MapProjectTypeAIRoute,
      },
      options: [`航点航线`, `正射航线`, `AI巡检任务`],
    },
  },
  args: {
    ...defaultRouteEditLayerProps,
    active: true,
    // @ts-ignore
    altitudeMode: "海拔高度",
    // @ts-ignore
    type: "航点航线",
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" @ready="ready"/>
      <template v-if="show">
        <gdu-vector-layer :view-id="viewId">
          <gdu-route-edit-layer
              ref="editLayer"
              :takeoff-point="takeoffPoint"
              :lines="lines"
              :type="type"
              :view-id="viewId"
              :area="area"
              :altitude-mode="altitudeMode"
              :takeoff-select-layers="['sssssss']"
              v-model:select="select"
              :clamp-to-ground="args.clampToGround"
              @changed="changed"
              @takeoff-changed="takeoffChanged"
          >
            <template #wayPoint="{ idx, point, isSelected }">
              <GduPopup :view-id="viewId" :visible="isSelected"  :coordinates="point.coordinates" position="bottom-center">
                <div style="padding: 5px;background-color: rgba(0,0,0,0.5);color:white">
                  我是{{idx}}
                </div>
              </GduPopup>
            </template>
          </gdu-route-edit-layer>
        </gdu-vector-layer>
        <gdu-vector-layer :view-id="viewId" layer-id="sssssss">
          <gdu-point :view-id="viewId" :coordinates="[114.31212,30.51991,500]" />
        </gdu-vector-layer>
      </template>
      <!--      <gdu-terrain-basemap-->
      <!--          v-if="show"-->
      <!--          :view-id="viewId"-->
      <!--          :url="terrainUrl"-->
      <!--      />-->
      <!--      <gdu-model-layer v-if="show" :view-id="viewId">-->
      <!--        <gdu-tileset :view-id="viewId" url="/wuhan_white_3dtile/tileset.json"/>-->
      <!--      </gdu-model-layer>-->
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
      <el-form v-if="surroundPoint"
               style="position: absolute;left: 10px;top:80px;z-index: 10;width: 200px;background: white;padding: 10px">
        <el-form-item label="环绕角度" prop="angle">
          <el-slider
              :model-value="surroundPoint.angle"
              @update:model-value="changeSurroundPoint($event,surroundPoint.enableCounterclockwise,surroundPoint.height)"
              :min="30"
              :max="360"
              :step="15"
          />
        </el-form-item>
        <el-form-item label="是否启用逆时针" prop="enableCounterclockwise">
          <el-switch
              :model-value="surroundPoint.enableCounterclockwise"
              @update:model-value="changeSurroundPoint(surroundPoint.angle,$event,surroundPoint.height)"
              :active-value="true"
              :inactive-value="false"
          />
        </el-form-item>
        <el-form-item label="更改高度" prop="height">
          <el-input-number
              :model-value="surroundPoint.height"
              @update:model-value="changeSurroundPoint(surroundPoint.angle,surroundPoint.enableCounterclockwise,$event)"
          />
        </el-form-item>
      </el-form>
      <el-button-group style="position: absolute;left: 10px;top:10px;z-index: 10;">
        <el-button @click="startWayPoint">开始绘制航点航线</el-button>
        <el-button @click="startObliqueDraw">开始绘制正射航线</el-button>
        <el-button @click="startAiDraw">开始绘制AI航线</el-button>
        <el-button @click="keepHeight">保持高度切换模式</el-button>
        <el-button @click="resetTakeoff">重新设置起飞点</el-button>
        <el-button @click="close">卸载绘制</el-button>
        <el-button @click="clear">清空图层</el-button>
      </el-button-group>
    `,
    components: {
      GduRouteLayer,
      GduMap,
      GduVectorLayer,
      GduRouteEditLayer,
      GduWmtsBasemap,
      GduTerrainBasemap,
      GduPolygon,
      GduModelLayer,
      GduTileset,
      GduPopup,
      GduPoint,
    },
    setup() {
      const show = ref(false);
      const str = ref("");
      const editLayer = ref();
      const viewId = uuid();
      const select = ref({
        idx: -1,
      });

      const terrainUrl = Cesium.IonResource.fromAssetId(1);
      const lines = ref<any[]>([]);
      const area = ref<any[]>([]);
      const showEdit = ref(false);
      const type = ref(RouteLayerType.MapProjectTypePoint);
      const takeoffPoint = ref<any>([]);

      const altitudeMode = ref(AltitudeMode.Elevation);

      const text = ref("");

      const surroundPoint = computed({
        get() {
          const line = lines.value[0] ?? [];

          return line.find((item: any) => item.surroundPoint)?.surroundPoint;
        },
        set(val: any) {
          const line = lines.value[0] ?? [];
          const surround = line.find((item: any) => item.surroundPoint);
          if (surround) {
            surround.surroundPoint = {
              ...surround.surroundPoint,
              ...val,
            };
          }
        },
      });
      function ready() {
        show.value = true;
      }

      function clear() {
        lines.value = [];
        area.value = [];
      }

      // function clear(){
      //   lines.value = [];
      // }

      function startWayPoint() {
        type.value = RouteLayerType.MapProjectTypePoint;
        lines.value = [];
        area.value = [];
      }

      function resetTakeoff() {
        editLayer.value.resetTakeoffPoint();
      }

      function startObliqueDraw() {
        type.value = RouteLayerType.MapProjectType3D;
        lines.value = [];
        area.value = [];
      }

      function changed(a: any) {
        if (type.value !== RouteLayerType.MapProjectTypePoint) {
          // const areaLine = a.area[0] ?? [];
          // lines.value = a.area.length
          //   ? turf
          //       .randomLineString(5, {
          //         bbox: turf.bbox(turf.polygon(a.area)),
          //         num_vertices: 16,
          //         max_length: 0.001,
          //       })
          //       .features.map((feature) => {
          //         return feature.geometry.coordinates.map((point) => {
          //           return {
          //             coordinates: [point[0], point[1]],
          //             height: 200,
          //             isTurn: true,
          //             isSafe: false,
          //           };
          //         });
          //       })
          //   : [];
          area.value = a.area;
          console.log(111, a.area);
        } else {
          area.value = [];
          lines.value = a.lines;
        }
      }

      function startAiDraw() {
        type.value = RouteLayerType.MapProjectTypeAIRoute;
        lines.value = [];
        area.value = [];
      }

      function close() {
        showEdit.value = !showEdit.value;
      }

      function takeoffChanged(params: any) {
        takeoffPoint.value = params;
      }

      function keepHeight() {
        const targetAltitudeMode =
          altitudeMode.value === AltitudeMode.Relative
            ? AltitudeMode.Elevation
            : AltitudeMode.Relative;
        lines.value = keepRouteElevationByAltitudeMode(
          lines.value,
          takeoffPoint.value,
          altitudeMode.value,
          targetAltitudeMode,
        );
        altitudeMode.value = targetAltitudeMode;
      }

      function changeSurroundPoint(
        angle: number,
        enableCounterclockwise: boolean,
        height: number,
      ) {
        surroundPoint.value = { angle, enableCounterclockwise, height };
      }

      return {
        str,
        clear,
        resetTakeoff,
        takeoffChanged,
        takeoffPoint,
        text,
        select,
        close,
        editLayer,
        showEdit,
        startWayPoint,
        startObliqueDraw,
        args,
        ready,
        lines,
        area,
        type,
        show,
        viewId,
        terrainUrl,
        changed,
        AltitudeMode,
        keepHeight,
        altitudeMode,
        startAiDraw,
        surroundPoint,
        changeSurroundPoint,
      };
    },
  }),
};
