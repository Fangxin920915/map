import type { Meta, StoryObj } from "@storybook/vue3-vite";

import { GduGeojsonLayer } from "@gdu-gl/map";

const meta = {
  title: "几何图层/GEOJSON图层",
  component: GduGeojsonLayer,
  // render: (args: any) => ({
  //   components: { GeojsonLayer },
  //   setup() {
  //     return { args };
  //   },
  //   template: '<gdu-map v-bind="args" />',
  // }),
  parameters: {},
} satisfies Meta<typeof GduGeojsonLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduGeojsonLayer",
  args: {
    center: [130, 20],
    zoom: 10,
  },
};
