import type { Meta, StoryObj } from "@storybook/vue3-vite";

import { GduWall } from "@gdu-gl/map";

const meta = {
  title: "几何图层/矢量图层/几何形状/墙",
  component: GduWall,
  // render: (args: any) => ({
  //   components: { GduWall },
  //   setup() {
  //     return { args };
  //   },
  //   template: '<gdu-map v-bind="args" />',
  // }),
  parameters: {
    order: 5,
  },
} satisfies Meta<typeof GduWall>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduWall",
  args: {
    center: [130, 20],
    zoom: 10,
  },
};
