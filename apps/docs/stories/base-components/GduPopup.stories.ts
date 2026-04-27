import type { Meta, StoryObj } from "@storybook/vue3-vite";

import {
  defaultPopupProps,
  GduMap,
  GduPopup,
  GduVectorLayer,
  GduPoint,
} from "@gdu-gl/map";
import { uuid } from "@gdu-gl/common";
import { ref } from "vue";

const meta = {
  title: "基础组件/地图弹窗",
  component: GduPopup,
  parameters: {},
} satisfies Meta<typeof GduPopup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "GduPopup",
  args: {
    ...defaultPopupProps,
    coordinates: [113, 40],
  },
  render: (args) => ({
    template: `
      <gdu-map :view-id="viewId" @ready="ready"/>
      <template v-if="showPopup">

        <gdu-vector-layer :view-id="viewId">
          <gdu-point v-for="(coordinates,i) in arr" :view-id="viewId" :coordinates="coordinates" @click="clickPoint(coordinates)"/>
        </gdu-vector-layer>
        <gdu-popup 
           v-bind="args"
           :visible="popupVisible"
           :view-id="viewId"
           :coordinates="popupPosition"
        >
          <div style="width: 80px;height: 40px;background-color: white;box-shadow:0 4px 10px rgba(0, 0, 0, 0.7);">我是弹框</div>
        </gdu-popup>
      </template>
    `,
    components: { GduPopup, GduMap, GduVectorLayer, GduPoint },
    setup() {
      const showPopup = ref(false);
      const arr = [];
      const viewId = uuid();

      const popupPosition = ref([0, 0, 0]);
      const popupVisible = ref(false);

      for (let i = 0; i < 100; i++) {
        const lon = args.coordinates ? args.coordinates[0] : 110;
        const lat = args.coordinates ? args.coordinates[1] : 40;
        arr.push([lon + Math.random() * 60, lat + Math.random() * 20]);
      }
      function ready() {
        showPopup.value = true;
      }

      function clickPoint(coordinates: any) {
        popupPosition.value = coordinates;
        popupVisible.value = true;
      }
      return {
        args,
        ready,
        showPopup,
        arr,
        viewId,
        clickPoint,
        popupPosition,
        popupVisible,
      };
    },
  }),
};
