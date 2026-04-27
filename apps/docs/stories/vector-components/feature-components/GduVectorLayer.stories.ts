import type { Meta, StoryObj } from "@storybook/vue3-vite";

import { defaultVectorLayerProps, GduVectorLayer } from "@gdu-gl/map";

const meta = {
  title: "几何图层/矢量图层/容器",
  component: GduVectorLayer,
  // render: (args: any) => ({
  //   components: { GduVectorLayer },
  //   setup() {
  //     return { args };
  //   },
  //   template: '<gdu-map v-bind="args" />',
  // }),
} satisfies Meta<typeof GduVectorLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduVectorLayer",
  args: defaultVectorLayerProps,
};
