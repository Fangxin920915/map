export default class VideoControl {
  private videoPlayer: any;

  seiCallback: (data: any) => void;

  constructor(container: HTMLElement, seiCallback: (data: any) => void) {
    this.seiCallback = seiCallback;
    // @ts-ignore
    this.videoPlayer = new window.JessibucaPro({
      decoder: "/js/decoder-pro.js",
      container,
      videoBuffer: 0.3,
      videoBufferDelay: 1,
      useWCS: false,
      useSIMD: true,
      // isResize: true,
      hasAudio: false,
      debug: false,
      debugLevel: "debug",
      heartTimeout: 10, // 播放过程中没有流数据触发的超时（流地址没有断开）
      loadingTimeout: 5, // 播放地址通不通
      heartTimeoutReplay: true,
      heartTimeoutReplayTimes: -1, // 重试次数 ，无限次重试，设置-1
      loadingTimeoutReplay: true,
      loadingTimeoutReplayTimes: -1, // 重试次数 ，无限次重试，设置-1
      websocket1006ErrorReplay: true, // ws1006错误重播
      websocket1006ErrorReplayDelayTime: 3, // ws1006错误延迟重播时间，单位秒
      supportDblclickFullscreen: false,
      demuxUseWorker: true, // 解封装数据使用worker进程,这样可以提升性能
      wcsUseVideoRender: true, // wcs 是否使用 video 渲染
      wasmUseVideoRender: true, // wasm 用video标签渲染
      loadingIcon: true, // 加载的时候是否显示加载中icon
      loadingIconStyle: { hasAnimation: false },
      replayShowLoadingIcon: true, // 重播显示loading
      streamErrorReplay: true,
      streamErrorReplayDelayTime: 3, // 延迟3s去触发播放。
      initDecoderWorkerTimeout: 15, // 配置等待初始化解码器worker超时时长(单位秒)，超时就会抛出异常事件，并暂停播放
      operateBtns: {
        fullscreen: false,
        screenshot: false,
        play: false,
        audio: false,
      },
      isNotMute: false,
      loadingText: "",
      showPerformance: false,
      isEmitSEI: true,
      // isFullResize: true,

      // audioEngine:"worklet",
      // isFlv: true
    });
  }

  play(url: string) {
    this.videoPlayer.play(url);
    this.onSeiData();
  }

  onSeiData() {
    this.videoPlayer.on("videoSEI", (value: any) =>
      this.seiCallback(value.data),
    );
  }
}
