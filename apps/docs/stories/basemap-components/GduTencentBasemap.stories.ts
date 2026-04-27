import type { Meta, StoryObj } from "@storybook/vue3-vite";
import {
  defaultTencentBasemapProps,
  GduMap,
  GduTencentBasemap,
  GduWmtsBasemap,
} from "@gdu-gl/map";
import { uuid } from "@gdu-gl/common";
import { computed, ref } from "vue";

const meta = {
  title: "底图组件/腾讯底图",
  component: GduTencentBasemap,
} satisfies Meta<typeof GduTencentBasemap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduTencentBasemap",
  args: {
    ...defaultTencentBasemapProps,
    viewId: uuid(),
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" @ready="ready"/>
      <gdu-tencent-basemap
          v-if="showBasemap" 
          v-bind="args"
          :view-id="viewId"
          :url="url"
          :z-index="6"
      />
       
    `,
    components: { GduTencentBasemap, GduMap, GduWmtsBasemap },
    setup() {
      const showBasemap = ref(false);
      const viewId = uuid();
      const extent = [100, 15, 150, 50];

      const now = ref(Date.now());

      const url = computed(() => {
        return `https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=9&x={x}&y={y}&z={z}`;
      });

      function ready() {
        showBasemap.value = true;
        // setInterval(()=>{
        //   now.value=Date.now()
        // },5000)
      }
      return { args, ready, showBasemap, extent, viewId, url };
    },
  }),
};
