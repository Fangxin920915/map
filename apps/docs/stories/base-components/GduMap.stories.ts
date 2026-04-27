import type { Meta, StoryObj } from "@storybook/vue3-vite";

import { defaultMapProps, GduMap } from "@gdu-gl/map";
import { uuid } from "@gdu-gl/common";

const meta = {
  title: "基础组件/地图容器",
  component: GduMap,
  tags: ["autodocs"],
} satisfies Meta<typeof GduMap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduMap",
  argTypes: {},
  render: (args) => ({
    template: `
      <gdu-map v-bind="args" :view-id="viewId"/>
    `,
    components: { GduMap },
    setup() {
      const viewId = uuid();
      return { args, viewId };
    },
  }),
  args: {
    viewId: uuid(),
    ...defaultMapProps,
  },
};
