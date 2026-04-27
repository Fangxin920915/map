import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defaultWmsBasemapProps, GduMap, GduWmsBasemap } from "@gdu-gl/map";
import { uuid } from "@gdu-gl/common";
import { ref } from "vue";

const meta = {
  title: "底图组件/WMS底图",
  component: GduWmsBasemap,
} satisfies Meta<typeof GduWmsBasemap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduWmsBasemap",
  args: {
    ...defaultWmsBasemapProps,
    viewId: uuid(),
    url: "https://mesonet.agron.iastate.edu/cgi-bin/wms/goes/conus_ir.cgi",
    layer: "goes_conus_ir",
    format: "image/png",
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" @ready="ready"/>
      <gdu-wms-basemap
          v-if="showBasemap" 
          v-bind="args"
          :view-id="viewId"
          :z-index="1"
      />
    `,
    components: { GduWmsBasemap, GduMap },
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
