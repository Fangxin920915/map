import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defaultWmtsBasemapProps, GduMap, GduWmtsBasemap } from "@gdu-gl/map";
import { uuid } from "@gdu-gl/common";
import { ref } from "vue";

const meta = {
  title: "底图组件/WMTS底图",
  component: GduWmtsBasemap,
} satisfies Meta<typeof GduWmtsBasemap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduWmtsBasemap",
  args: {
    ...defaultWmtsBasemapProps,
    viewId: uuid(),
    url: "http://t{0-7}.tianditu.gov.cn/img_w/wmts?tk=490c03d5e1875b979156869f31651c6f",
    layer: "img",
    tileStyle: "default",
    format: "tiles",
    tileMatrixSetID: "w",
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" @ready="ready"/>
      <gdu-wmts-basemap
          v-if="showBasemap" 
          v-bind="args"
          :view-id="viewId"
      />
      <gdu-wmts-basemap
          v-if="showBasemap"
          v-bind="args"
          :view-id="viewId"
          url="http://t{0-7}.tianditu.gov.cn/cia_w/wmts?tk=490c03d5e1875b979156869f31651c6f"
          layer="cia"
          tileStyle="default"
          format="tiles"
          tileMatrixSetID="w"
          :z-index="1"
      />
    `,
    components: { GduWmtsBasemap, GduMap },
    setup() {
      const showBasemap = ref(false);
      const viewId = uuid();
      function ready() {
        showBasemap.value = true;
      }
      return { args, ready, showBasemap, viewId };
    },
  }),
};
