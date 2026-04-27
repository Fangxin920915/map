import type { Meta, StoryObj } from "@storybook/vue3-vite";

import {
  GduMap,
  GduView,
  GduScaleTool,
  GduWmtsBasemap,
  GduVectorLayer,
  GduPoint,
} from "@gdu-gl/map";
import { nextTick, ref } from "vue";
import "../assets/css/gdu-view.scss";
import { uuid } from "@gdu-gl/common";
import * as turf from "@turf/turf";

const meta = {
  title: "基础组件/视角控制",
  component: GduView,
} satisfies Meta<typeof GduView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduView",
  args: {
    viewId: uuid(),
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" @ready="ready"/>
      <gdu-view v-if="show" :view-id="viewId" ref="view"/>
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

      <gdu-vector-layer v-if="show" :view-id="viewId">
        <gdu-point v-for="(point,i) in points" :key="i" v-bind="getSelectStyle(i)" :coordinates="point"
                   @click="selectPoint(i)"/>
      </gdu-vector-layer>

      <el-button v-if="show" class="gdu-view-container" @click="openDrawer"> 开启配置面板</el-button>
      <el-drawer
          v-if="show"
          v-model="showDrawer"
          title="视角配置"
          append-to=".gdu-map-container"
          modal-class="gdu-map-modal"
          direction="ltr"
          :modal="false"
      >
        <el-form label-width="auto" size="small">
          <el-form-item label="跳转层级">
            <el-row>
              <el-col :span="24">
                <el-tag type="primary">左键点击点位跳转</el-tag>
              </el-col>
              <el-col :span="24">
                <el-input-number :min="1" :max="22" v-model="zoom"></el-input-number>
              </el-col>
            </el-row>
            
            
          </el-form-item>
          <el-form-item label="当前层级">
            <el-button @click="getZoom">获取层级</el-button>
            <el-tag type="primary">{{ currentZoom }}</el-tag>
          </el-form-item>
          <el-form-item label="heading">
            <el-slider
                v-model="cameraPose.heading"
                :min="0"
                :max="360"
                show-input
            />
          </el-form-item>
          <el-form-item label="pitch">
            <el-slider
                v-model="cameraPose.pitch"
                :min="-90"
                :max="0"
                show-input
            />
          </el-form-item>
          <el-form-item label="roll">
            <el-slider
                v-model="cameraPose.roll"
                :min="0"
                :max="360"
                show-input
            />
          </el-form-item>
          <el-form-item label="四至跳转">
            <el-row>
              <el-col :span="24" style="margin-bottom: 5px">
                <el-button @click="createPoints">
                  随便生成100个点
                </el-button>
              </el-col>
              <el-col :span="24" style="margin-bottom: 5px">
                <el-button @click="flyByPointExtent" type="primary">
                  四至跳转到所有点
                </el-button>
              </el-col>
              <el-col :span="24">
                <el-button @click="flyByPoints" type="primary">
                  点位集合跳转
                </el-button>
              </el-col>
            </el-row>
          </el-form-item>
          <el-form-item label="放大缩小">
            <el-button @click="zoomIn" type="primary">
              放大
            </el-button>
            <el-button @click="zoomOut" type="primary">
              缩小
            </el-button>
          </el-form-item>
          <el-form-item label="切换模式">
            <el-button @click="switchMode(3)" type="primary">
              3D模式
            </el-button>
            <el-button @click="switchMode(2)" type="primary">
              2D模式
            </el-button>
          </el-form-item>
        </el-form>
      </el-drawer>
    `,
    components: {
      GduView,
      GduMap,
      GduScaleTool,
      GduWmtsBasemap,
      GduVectorLayer,
      GduPoint,
    },
    setup() {
      const show = ref(false);
      const showDrawer = ref(true);
      const points = ref<number[][]>([]);
      const currentExtent = ref<number[]>([]);
      const zoom = ref(15);
      const currentZoom = ref(-1);
      const viewId = uuid();
      const selectIndex = ref(-1);
      const cameraPose = ref({
        heading: 0,
        pitch: -45,
        roll: 0,
      });
      const view = ref();
      function ready() {
        show.value = true;
        nextTick(() => {
          createPoints();
        });
      }

      function setCameraOptions(position?: number[]) {
        view.value.setCameraOptions({
          position,
          duration: 0,
        });
      }

      function getExtent() {
        currentExtent.value = view.value.getExtentByScreen();
      }

      function openDrawer() {
        showDrawer.value = true;
      }

      function createPoints() {
        selectIndex.value = -1;
        points.value = turf
          .randomPoint(100, {
            bbox: [114.0665, 29.7333, 115.5161, 30.65],
          })
          .features.map((item) => {
            const [lon, lat] = item.geometry.coordinates;
            return [lon, lat, 10000 * Math.random()];
          });
      }

      function flyByPoints() {
        console.log("points", points.value);
        view.value
          .flyToBounds({
            positions: points.value,
            duration: 1000,
            ...cameraPose.value,
          })
          .then((a: any) => {
            console.log(2222, a);
          });
      }

      function flyByPointExtent() {
        view.value.jumpTo({
          position: points.value[0],
          zoom: 10,
        });
        // const bbox = turf.bbox(turf.multiPoint(points.value));
        // view.value
        //   .fitExtent({
        //     extent: bbox,
        //     ...cameraPose.value,
        //   })
        //   .then((status: boolean) => {
        //     console.log("飞行状态", status);
        //   });
      }

      function getSelectStyle(index: number) {
        if (selectIndex.value === index) {
          return {
            text: "选中点位",
            shapeFillColor: "red",
            shapeSize: 26,
            textAnchor: "center-top",
            textOffset: [0, -20],
            textBackgroundColor: "rgba(0,0,0,0.8)",
            textBackgroundRadius: 6,
            textBackgroundBorderColor: "white",
            textBackgroundBorderWidth: 1,
          };
        }
        return {};
      }

      function selectPoint(index: number) {
        selectIndex.value = index;
        view.value.jumpTo({
          position: points.value[index],
          zoom: zoom.value,
          ...cameraPose.value,
        });
      }

      function zoomIn() {
        view.value.zoomIn();
      }

      function zoomOut() {
        view.value.zoomOut();
      }

      function getZoom() {
        currentZoom.value = view.value.getZoom();
      }

      function switchMode(type: number) {
        view.value.toggleEarthMode(type);
      }

      return {
        viewId,
        args,
        ready,
        show,
        view,
        showDrawer,
        openDrawer,
        cameraPose,
        setCameraOptions,
        flyByPointExtent,
        points,
        selectPoint,
        createPoints,
        getSelectStyle,
        flyByPoints,
        getExtent,
        currentExtent,
        zoomOut,
        zoomIn,
        zoom,
        currentZoom,
        getZoom,
        switchMode,
      };
    },
  }),
};
