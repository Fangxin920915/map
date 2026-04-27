import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { defaultARMapContainerProps, GduARMapContainer } from "@gdu-gl/map";
import { uuid } from "@gdu-gl/common";
import VideoControl from "./VideoControl";
import "./ar.css";
import testJson from "./1.json";

const meta = {
  title: "工具组件/AR地图",
  component: GduARMapContainer,
  tags: ["autodocs"],
} satisfies Meta<typeof GduARMapContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

function bigIntToNumberViaStr(value) {
  if (typeof value !== "bigint") return value;

  // 安全范围校验（避免精度丢失）
  const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
  const MIN_SAFE = BigInt(Number.MIN_SAFE_INTEGER);
  if (value > MAX_SAFE || value < MIN_SAFE) {
    throw new Error(`BigInt ${value} 超出 Number 安全范围，禁止转数字`);
  }

  // 核心：先转字符串，再转数字
  return Number(value.toString());
}

export const Primary: Story = {
  name: "GduARMapContainer",
  argTypes: {},
  render: (args) => ({
    template: `
      <div class="ar-map-test"  >
        <div class="video-input">
          <input type="text" placeholder="请输入视频地址" v-model="videoUrl">
          <button @click="playVideo">播放</button>
        </div>
        <div id="video-container" ref="videoRef"></div>
        <GduARMapContainer v-bind="args" :view-id="viewId" ref="arMapContainerRef" />
      </div>
    `,
    components: { GduARMapContainer },
    setup() {
      const videoRef = ref();
      const viewId = uuid();
      const videoUrl = ref("");
      const arMapContainerRef = ref();

      let offset = 0;
      const testData = testJson[offset];

      // setTimeout(() => {
      //   console.log("xiaoxi");
      //   arMapContainerRef.value.onSeiDataReceived(testData);
      // }, 2000);
      // const timer = setInterval(() => {
      //   if (offset >= testJson.length - 1) {
      //     clearInterval(timer);
      //     return;
      //   }
      //   offset++;
      //   const item = testJson[offset];
      //   const ran = Math.ceil(Math.random() * 100);
      //   if (ran % 3 === 0) {
      //     item.videoTs += 10000 + offset;
      //     item.positionAttitudeInfo.gimbalPitch = 0;
      //   }
      //
      //   // arMapContainerRef.value.onSeiDataReceived(testJson[offset]);
      // }, 30);

      //@ts-ignore
      const dataList = [];
      const playVideo = () => {
        if (!videoUrl.value) {
          return;
        }
        const videoControl = new VideoControl(videoRef.value, (data) => {
          if (!data) return;
          arMapContainerRef.value.onSeiDataReceived(data);
          // dataList.push({
          //   positionAttitudeInfo: data.positionAttitudeInfo,
          //   cameraParams: data.cameraParams,
          //   speedInfo: data.speedInfo,
          //   videoTs: bigIntToNumberViaStr(data.videoTs),
          // });
        });

        // eslint-disable-next-line storybook/context-in-play-function
        videoControl.play(videoUrl.value);
      };
      document.body.addEventListener("keydown", function (e) {
        // 两种判断方式均可，key 更直观，keyCode 兼容性更广
        if (e.key === " " || e.keyCode === 32) {
          console.log("空格键被按下");
          // 可添加自定义逻辑，如暂停播放、提交表单等
          e.preventDefault(); // 可选：阻止空格键默认行为（如页面滚动）
          // @ts-ignore
          console.log(JSON.stringify(dataList));
        }
      });
      return { args, viewId, videoRef, videoUrl, playVideo, arMapContainerRef };
    },
  }),
  args: {
    viewId: uuid(),
    ...defaultARMapContainerProps,
  },
};
