import type { Meta, StoryObj } from "@storybook/vue3-vite";

import {
  GduMap,
  GduMarkerLayer,
  defaultMarkerLayerProps,
  GduWmtsBasemap,
  GduTerrainBasemap,
} from "@gdu-gl/map";
import * as Cesium from "@gdu-gl/cesium";
import { ref } from "vue";
import {
  uuid,
  MarkerStrokeType,
  PointerType,
  GeoFeatureType,
  MarkerTextShapeType,
} from "@gdu-gl/common";

const meta = {
  title: "标注图层",
  component: GduMarkerLayer,
  parameters: {
    order: 1,
  },
} satisfies Meta<typeof GduMarkerLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduMarkerLayer",
  args: {
    ...defaultMarkerLayerProps,
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" @ready="ready"/>
      <gdu-marker-layer 
          v-if="show" 
          ref="markerLayer" 
          v-bind="args"
          :view-id="viewId" 
          v-model:select-ids="selectIds" 
          v-model:data-source="dataSource"
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
      <el-button-group style="position: absolute;z-index: 10;top:10px;left: 10px;">
        <el-button @click="startDrawPoint">绘制点</el-button>
        <el-button @click="startDrawLineString">绘制线</el-button>
        <el-button @click="startDrawPolygon">绘制面</el-button>
        <el-button @click="startDrawCircle">绘制圆</el-button>
        <el-button @click="generateRandomCoordinates">生成</el-button>
        <el-button @click="randomVisible">随机隐藏</el-button>
      </el-button-group>
    `,
    components: {
      GduMap,
      GduMarkerLayer,
      GduWmtsBasemap,
      GduTerrainBasemap,
    },
    setup() {
      const show = ref(false);
      const viewId = uuid();
      const selectIds = ref([]);

      const markerLayer = ref();
      const dataSource = ref<any[]>([]);
      const terrainUrl = Cesium.IonResource.fromAssetId(1);
      function ready() {
        show.value = true;
      }

      function startDrawPoint() {
        markerLayer.value.startDraw({
          type: GeoFeatureType.Point,
          style: {
            textBackgroundShape: MarkerTextShapeType.Circle,
            theme: "brand", // 必填：样式主题（格式通常为 "主题名-色阶"）
            text: "POI标记", // 可选：标记上显示的文本
            textSize: 14, // 可选：文本大小（像素）
            visible: true, // 可选：是否可见（默认 true）
            iconSize: 32, // 必填：图标大小（像素）
            iconName: PointerType.Location, // 必填：图标名称（取自 PointerType 枚举）
            relativeHeight: 10,
            remark: "1111",
          },
        });
      }

      function startDrawLineString() {
        markerLayer.value.startDraw({
          type: GeoFeatureType.LineString,
          style: {
            theme: "brand", // 必填：样式主题（格式通常为 "主题名-色阶"）
            text: "主要道路", // 可选：线要素上显示的文本
            textSize: 12, // 可选：文本大小（像素）
            visible: true, // 可选：是否可见（默认 true）
            strokeType: MarkerStrokeType.Solid, // 必填：线条类型（取自 MarkerStrokeType 枚举）
            strokeWidth: 4, // 必填：线条宽度（像素）
            remark: "3333",
          },
        });
      }

      function startDrawPolygon() {
        markerLayer.value.startDraw({
          type: GeoFeatureType.Polygon,
          style: {
            textBackgroundShape: MarkerTextShapeType.Circle,
            theme: "brand", // 必填：样式主题（格式通常为 "主题名-色阶"）
            text: "行政区域", // 可选：面要素上显示的文本
            textSize: 14, // 可选：文本大小（像素）
            visible: true, // 可选：是否可见（默认 true）
            strokeType: MarkerStrokeType.Dashed, // 必填：边界线条类型（取自 MarkerStrokeType 枚举）
            strokeWidth: 4, // 必填：边界线条宽度（像素）
            fillOpacity: 20, // 必填：填充透明度（0-1，此处为 60% 不透明）
            remark: "2222",
          },
        });
      }

      function startDrawCircle() {
        markerLayer.value.startDraw({
          type: GeoFeatureType.Circle,
          style: {
            textBackgroundShape: MarkerTextShapeType.Circle,
            theme: "brand", // 必填：样式主题（格式通常为 "主题名-色阶"）
            text: "1", // 可选：面要素上显示的文本
            textSize: 14, // 可选：文本大小（像素）
            visible: true, // 可选：是否可见（默认 true）
            strokeType: MarkerStrokeType.Solid, // 必填：边界线条类型（取自 MarkerStrokeType 枚举）
            strokeWidth: 4, // 必填：边界线条宽度（像素）
            fillOpacity: 20, // 必填：填充透明度（0-1，此处为 60% 不透明）
          },
        });
      }

      function generateRandomCoordinates() {
        fetch("/marker.json")
          .then((response) => response.json())
          .then((data) => {
            dataSource.value = data;
          });
      }

      function randomVisible() {
        for (let i = 0; i < 3; i++) {
          const randomIndex = Math.floor(
            Math.random() * dataSource.value.length,
          );
          dataSource.value[randomIndex].properties.options.visible =
            !dataSource.value[randomIndex].properties.options.visible;
        }
      }

      return {
        generateRandomCoordinates,
        randomVisible,
        selectIds,
        args,
        dataSource,
        markerLayer,
        ready,
        show,
        viewId,
        terrainUrl,
        startDrawPoint,
        startDrawLineString,
        startDrawPolygon,
        startDrawCircle,
      };
    },
  }),
};
