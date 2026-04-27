import type { Meta, StoryObj } from "@storybook/vue3-vite";

import {
  GduMap,
  GduWmtsBasemap,
  GduClusterLayer,
  defaultClusterLayerProps,
} from "@gdu-gl/map";
import type {
  ClusterDataItem,
  ClusterStyleConfig,
  PointStyleConfig,
} from "@gdu-gl/map";
import { uuid } from "@gdu-gl/common";
import { ref } from "vue";
import { action } from "storybook/actions";

const meta = {
  title: "几何图层/点位聚合",
  component: GduClusterLayer,
  tags: ["autodocs"],
  parameters: {
    order: 1,
  },
} satisfies Meta<typeof GduClusterLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

function generateRandomPoints(count: number): ClusterDataItem[] {
  const cities: [number, number][] = [
    [114.3, 30.6], // 武汉
    [116.4, 39.9], // 北京
    [121.47, 31.23], // 上海
    [113.26, 23.13], // 广州
    [104.07, 30.67], // 成都
    [106.55, 29.56], // 重庆
    [120.15, 30.28], // 杭州
    [118.79, 32.06], // 南京
    [108.95, 34.27], // 西安
    [113.65, 34.76], // 郑州
  ];
  const items: ClusterDataItem[] = [];
  for (let i = 0; i < count; i++) {
    const city = cities[i % cities.length];
    const spread = 1.5;
    const lng = city[0] + (Math.random() - 0.5) * spread;
    const lat = city[1] + (Math.random() - 0.5) * spread;
    items.push({
      coordinates: [lng, lat] as [number, number],
      properties: { id: i, name: `POI-${i}`, city: city },
    });
  }
  return items;
}

export const Primary: Story = {
  name: "基础聚合（万级点位）",
  argTypes: {
    clusterRadius: {
      control: { type: "range", min: 20, max: 200, step: 10 },
    },
    maxZoom: {
      control: { type: "range", min: 5, max: 22, step: 1 },
    },
    showClusterCount: {
      control: "boolean",
    },
    expandOnClick: {
      control: "boolean",
    },
  },
  args: {
    ...defaultClusterLayerProps,
    onClickCluster: action("点击聚合点"),
    onClickPoint: action("点击散点"),
    onClusterChange: action("聚合变化"),
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" :center="[112, 33]" :zoom="4" @ready="onReady" />

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

      <gdu-cluster-layer
        v-if="show"
        :view-id="viewId"
        :data="points"
        :cluster-radius="args.clusterRadius"
        :max-zoom="args.maxZoom"
        :show-cluster-count="args.showClusterCount"
        :expand-on-click="args.expandOnClick"
        @click-cluster="args.onClickCluster"
        @click-point="args.onClickPoint"
        @cluster-change="args.onClusterChange"
      />

      <div style="position:absolute;left:10px;top:10px;z-index:10;display:flex;flex-direction:column;gap:8px;">
        <div>
          <el-button-group>
            <el-button @click="loadPoints(1000)">1,000 点</el-button>
            <el-button @click="loadPoints(5000)">5,000 点</el-button>
            <el-button type="primary" @click="loadPoints(10000)">10,000 点</el-button>
            <el-button type="danger" @click="loadPoints(50000)">50,000 点</el-button>
          </el-button-group>
          <el-tag style="margin-left:8px" type="info">当前: {{ points.length }} 点</el-tag>
        </div>
        <div style="background:rgba(0,0,0,0.65);color:#fff;padding:8px 12px;border-radius:6px;font-size:12px;max-width:320px;">
          点击聚合圆点可逐级展开 · 滚轮缩放地图自动重新聚合
        </div>
      </div>
    `,
    components: { GduMap, GduWmtsBasemap, GduClusterLayer },
    setup() {
      const viewId = uuid();
      const show = ref(false);
      const points = ref<ClusterDataItem[]>([]);

      function onReady() {
        show.value = true;
        loadPoints(1000);
      }

      function loadPoints(count: number) {
        points.value = generateRandomPoints(count);
      }

      return { args, viewId, show, points, onReady, loadPoints };
    },
  }),
};

export const CustomStyle: Story = {
  name: "自定义样式",
  args: {
    ...defaultClusterLayerProps,
    onClickCluster: action("点击聚合点"),
    onClickPoint: action("点击散点"),
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" :center="[112, 33]" :zoom="4" @ready="onReady" />

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

      <gdu-cluster-layer
        v-if="show"
        :view-id="viewId"
        :data="points"
        :cluster-radius="100"
        :cluster-style="customClusterStyle"
        :point-style="customPointStyle"
        @click-cluster="args.onClickCluster"
        @click-point="args.onClickPoint"
      />

      <div style="position:absolute;right:10px;top:10px;z-index:10;background:rgba(0,0,0,0.7);color:#fff;padding:12px;border-radius:8px;font-size:13px;line-height:2;">
        <div><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:#6366f1;margin-right:6px;vertical-align:middle;"></span>≤ 10 个</div>
        <div><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:#8b5cf6;margin-right:6px;vertical-align:middle;"></span>≤ 50 个</div>
        <div><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:#a855f7;margin-right:6px;vertical-align:middle;"></span>≤ 100 个</div>
        <div><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:#d946ef;margin-right:6px;vertical-align:middle;"></span>&gt; 100 个</div>
      </div>
    `,
    components: { GduMap, GduWmtsBasemap, GduClusterLayer },
    setup() {
      const viewId = uuid();
      const show = ref(false);
      const points = ref<ClusterDataItem[]>([]);

      function onReady() {
        show.value = true;
        points.value = generateRandomPoints(8000);
      }

      function customClusterStyle(count: number): ClusterStyleConfig {
        if (count <= 10)
          return {
            color: "#6366f1",
            outlineColor: "#c7d2fe",
            outlineWidth: 3,
            size: 34,
            textColor: "#fff",
            textSize: 12,
          };
        if (count <= 50)
          return {
            color: "#8b5cf6",
            outlineColor: "#ddd6fe",
            outlineWidth: 3,
            size: 42,
            textColor: "#fff",
            textSize: 13,
          };
        if (count <= 100)
          return {
            color: "#a855f7",
            outlineColor: "#e9d5ff",
            outlineWidth: 3,
            size: 50,
            textColor: "#fff",
            textSize: 14,
          };
        return {
          color: "#d946ef",
          outlineColor: "#f5d0fe",
          outlineWidth: 4,
          size: 58,
          textColor: "#fff",
          textSize: 15,
        };
      }

      function customPointStyle(item: ClusterDataItem): PointStyleConfig {
        const id = item.properties?.id ?? 0;
        const colors = ["#f43f5e", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
        return {
          shapeType: "circle",
          color: colors[id % colors.length],
          outlineColor: "#fff",
          outlineWidth: 2,
          size: 16,
        };
      }

      return {
        args,
        viewId,
        show,
        points,
        onReady,
        customClusterStyle,
        customPointStyle,
      };
    },
  }),
};
