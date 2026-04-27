import type { Meta, StoryObj } from "@storybook/vue3-vite";

import { GduMap, GduScaleTool, defaultScaleToolProps } from "@gdu-gl/map";
import { uuid } from "@gdu-gl/common";
import { ref } from "vue";

const meta = {
  title: "工具组件/比例尺",
  component: GduScaleTool,
} satisfies Meta<typeof GduScaleTool>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduScaleTool",
  args: {
    ...defaultScaleToolProps,
    viewId: uuid(),
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" @ready="ready"/>
      <gdu-scale-tool v-if="show&&showTool" v-bind="args" :view-id="viewId" class="test"/>
      <el-button @click="showTool = !showTool" style="position: absolute;left: 10px;top: 10px;z-index: 999">卸载</el-button>
    `,
    components: { GduMap, GduScaleTool },
    setup() {
      const show = ref(false);
      const showTool = ref(true);
      const view = ref();
      const viewId = uuid();
      function ready() {
        show.value = true;
      }
      return { args, ready, show, view, viewId, showTool };
    },
  }),
};
