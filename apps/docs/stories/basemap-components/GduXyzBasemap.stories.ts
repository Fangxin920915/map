import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defaultXyzBasemapProps, GduMap, GduXyzBasemap } from "@gdu-gl/map";
import { uuid } from "@gdu-gl/common";
import { ref } from "vue";

const meta = {
  title: "底图组件/TMS底图",
  component: GduXyzBasemap,
} satisfies Meta<typeof GduXyzBasemap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduXyzBasemap",
  args: {
    ...defaultXyzBasemapProps,
    viewId: uuid(),
    url: "http://172.16.63.106:86/las/zhang/tif_png/{z}/{x}/{y}.png",
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" @ready="ready"/>
      <gdu-xyz-basemap 
          v-if="showBasemap" 
          v-bind="args"
          :view-id="viewId"
          :z-index="1"
      />
    `,
    components: { GduXyzBasemap, GduMap },
    setup() {
      const showBasemap = ref(false);
      const viewId = uuid();
      const extent = [100, 15, 150, 50];

      function ready() {
        showBasemap.value = true;
      }
      return { args, ready, showBasemap, extent, viewId };
    },
  }),
};
