!(function (e, t) {
  "object" == typeof exports && "undefined" != typeof module
    ? (module.exports = t())
    : "function" == typeof define && define.amd
      ? define(t)
      : ((e = "undefined" != typeof globalThis ? globalThis : e || self)[
          "jessibuca-talk"
        ] = t());
})(this, function () {
  "use strict";
  class e {
    on(e, t, i) {
      const s = this.e || (this.e = {});
      return (s[e] || (s[e] = [])).push({ fn: t, ctx: i }), this;
    }
    once(e, t, i) {
      const s = this;
      function r() {
        s.off(e, r);
        for (var o = arguments.length, n = new Array(o), a = 0; a < o; a++)
          n[a] = arguments[a];
        t.apply(i, n);
      }
      return (r._ = t), this.on(e, r, i);
    }
    emit(e) {
      const t = ((this.e || (this.e = {}))[e] || []).slice();
      for (
        var i = arguments.length, s = new Array(i > 1 ? i - 1 : 0), r = 1;
        r < i;
        r++
      )
        s[r - 1] = arguments[r];
      for (let e = 0; e < t.length; e += 1) t[e].fn.apply(t[e].ctx, s);
      return this;
    }
    off(e, t) {
      const i = this.e || (this.e = {});
      if (!e)
        return (
          Object.keys(i).forEach((e) => {
            delete i[e];
          }),
          void delete this.e
        );
      const s = i[e],
        r = [];
      if (s && t)
        for (let e = 0, i = s.length; e < i; e += 1)
          s[e].fn !== t && s[e].fn._ !== t && r.push(s[e]);
      return r.length ? (i[e] = r) : delete i[e], this;
    }
  }
  const t = "debug",
    i = "warn",
    s = "error",
    r = "talkGetUserMediaSuccess",
    o = "talkGetUserMediaFail",
    n = "talkGetUserMediaTimeout",
    a = "talkStreamStart",
    l = "talkStreamOpen",
    h = "talkStreamClose",
    u = "talkStreamError",
    c = "talkStreamInactive",
    d = "talkStreamMsg",
    p = "talkFailedAndStop",
    f = {
      talkStreamClose: h,
      talkStreamError: u,
      talkStreamInactive: c,
      talkGetUserMediaTimeout: n,
      talkFailedAndStop: p,
      talkStreamMsg: d,
      error: s,
    },
    m = {
      playError: "playIsNotPauseOrUrlIsNull",
      fetchError: "fetchError",
      websocketError: "websocketError",
      webcodecsH265NotSupport: "webcodecsH265NotSupport",
      webcodecsDecodeError: "webcodecsDecodeError",
      webcodecsUnsupportedConfigurationError:
        "webcodecsUnsupportedConfigurationError",
      webcodecsDecodeConfigureError: "webcodecsDecodeConfigureError",
      webcodecsAudioInitTimeout: "webcodecsAudioInitTimeout",
      webcodecsAudioNoDataTimeout: "webcodecsAudioNoDataTimeout",
      mediaSourceH265NotSupport: "mediaSourceH265NotSupport",
      mediaSourceAudioG711NotSupport: "mediaSourceAudioG711NotSupport",
      mediaSourceAudioInitTimeout: "mediaSourceAudioInitTimeout",
      mediaSourceAudioNoDataTimeout: "mediaSourceAudioNoDataTimeout",
      mediaSourceDecoderConfigurationError:
        "mediaSourceDecoderConfigurationError",
      mediaSourceFull: "mseSourceBufferFull",
      mseSourceBufferError: "mseSourceBufferError",
      mseAddSourceBufferError: "mseAddSourceBufferError",
      mseWorkerAddSourceBufferError: "mseWorkerAddSourceBufferError",
      mediaSourceAppendBufferError: "mediaSourceAppendBufferError",
      mediaSourceTsIsMaxDiff: "mediaSourceTsIsMaxDiff",
      mediaSourceUseCanvasRenderPlayFailed:
        "mediaSourceUseCanvasRenderPlayFailed",
      mediaSourceBufferedIsZeroError: "mediaSourceBufferedIsZeroError",
      wasmDecodeError: "wasmDecodeError",
      wasmUseVideoRenderError: "wasmUseVideoRenderError",
      hlsError: "hlsError",
      webrtcError: "webrtcError",
      webrtcClosed: "webrtcClosed",
      webrtcIceCandidateError: "webrtcIceCandidateError",
      webglAlignmentError: "webglAlignmentError",
      wasmWidthOrHeightChange: "wasmWidthOrHeightChange",
      mseWidthOrHeightChange: "mseWidthOrHeightChange",
      wcsWidthOrHeightChange: "wcsWidthOrHeightChange",
      widthOrHeightChange: "widthOrHeightChange",
      tallWebsocketClosedByError: "tallWebsocketClosedByError",
      flvDemuxBufferSizeTooLarge: "flvDemuxBufferSizeTooLarge",
      audioChannelError: "audioChannelError",
      simdH264DecodeVideoWidthIsTooLarge: "simdH264DecodeVideoWidthIsTooLarge",
      simdDecodeError: "simdDecodeError",
      webglContextLostError: "webglContextLostError",
      videoElementPlayingFailed: "videoElementPlayingFailed",
      videoElementPlayingFailedForWebrtc: "videoElementPlayingFailedForWebrtc",
      decoderWorkerInitError: "decoderWorkerInitError",
      decoderWorkerWasmError: "decoderWorkerWasmError",
      videoInfoError: "videoInfoError",
      streamEnd: "streamEnd",
      websocket1006Error: "websocket1006Error",
      delayTimeout: "delayTimeout",
      loadingTimeout: "loadingTimeout",
      networkDelayTimeout: "networkDelayTimeout",
      aliyunRtcError: "aliyunRtcError",
      mseWaitVideoCanplayTimeout: "mseWaitVideoCanplayTimeout",
      initDecoderWorkerTimeout: "initDecoderWorkerTimeout",
      ...{ talkStreamError: u, talkStreamClose: h },
    },
    g = "notConnect",
    w = "open",
    k = "close",
    T = "error",
    b = "g711a",
    _ = "g711u",
    y = "pcm",
    A = "opus",
    E = 8,
    S = 0,
    v = 98,
    U = "empty",
    M = "rtp",
    G = "tcp",
    L = "open",
    B = "close",
    R = "error",
    W = "message",
    C = "worklet",
    F = "script",
    O = {
      encType: b,
      packetType: M,
      packetTcpSendType: G,
      rtpSsrc: "0000000000",
      numberChannels: 1,
      sampleRate: 8e3,
      sampleBitsWidth: 16,
      frameDuration: 20,
      debug: !1,
      debugLevel: i,
      testMicrophone: !1,
      saveToTempFile: !1,
      audioBufferLength: 160,
      engine: C,
      checkGetUserMediaTimeout: !1,
      getUserMediaTimeout: 1e4,
      audioConstraints: {
        latency: !0,
        noiseSuppression: !0,
        autoGainControl: !0,
        echoCancellation: !0,
        sampleRate: 48e3,
        channelCount: 1,
      },
      isG711a: !1,
      isG711u: !1,
    };
  function N() {
    return new Date().getTime();
  }
  (function (e, t) {
    return e((t = { exports: {} }), t.exports), t.exports;
  })(function (e) {
    !(function () {
      var t =
          "undefined" != typeof window && void 0 !== window.document
            ? window.document
            : {},
        i = e.exports,
        s = (function () {
          for (
            var e,
              i = [
                [
                  "requestFullscreen",
                  "exitFullscreen",
                  "fullscreenElement",
                  "fullscreenEnabled",
                  "fullscreenchange",
                  "fullscreenerror",
                ],
                [
                  "webkitRequestFullscreen",
                  "webkitExitFullscreen",
                  "webkitFullscreenElement",
                  "webkitFullscreenEnabled",
                  "webkitfullscreenchange",
                  "webkitfullscreenerror",
                ],
                [
                  "webkitRequestFullScreen",
                  "webkitCancelFullScreen",
                  "webkitCurrentFullScreenElement",
                  "webkitCancelFullScreen",
                  "webkitfullscreenchange",
                  "webkitfullscreenerror",
                ],
                [
                  "mozRequestFullScreen",
                  "mozCancelFullScreen",
                  "mozFullScreenElement",
                  "mozFullScreenEnabled",
                  "mozfullscreenchange",
                  "mozfullscreenerror",
                ],
                [
                  "msRequestFullscreen",
                  "msExitFullscreen",
                  "msFullscreenElement",
                  "msFullscreenEnabled",
                  "MSFullscreenChange",
                  "MSFullscreenError",
                ],
              ],
              s = 0,
              r = i.length,
              o = {};
            s < r;
            s++
          )
            if ((e = i[s]) && e[1] in t) {
              for (s = 0; s < e.length; s++) o[i[0][s]] = e[s];
              return o;
            }
          return !1;
        })(),
        r = { change: s.fullscreenchange, error: s.fullscreenerror },
        o = {
          request: function (e, i) {
            return new Promise(
              function (r, o) {
                var n = function () {
                  this.off("change", n), r();
                }.bind(this);
                this.on("change", n);
                var a = (e = e || t.documentElement)[s.requestFullscreen](i);
                a instanceof Promise && a.then(n).catch(o);
              }.bind(this),
            );
          },
          exit: function () {
            return new Promise(
              function (e, i) {
                if (this.isFullscreen) {
                  var r = function () {
                    this.off("change", r), e();
                  }.bind(this);
                  this.on("change", r);
                  var o = t[s.exitFullscreen]();
                  o instanceof Promise && o.then(r).catch(i);
                } else e();
              }.bind(this),
            );
          },
          toggle: function (e, t) {
            return this.isFullscreen ? this.exit() : this.request(e, t);
          },
          onchange: function (e) {
            this.on("change", e);
          },
          onerror: function (e) {
            this.on("error", e);
          },
          on: function (e, i) {
            var s = r[e];
            s && t.addEventListener(s, i, !1);
          },
          off: function (e, i) {
            var s = r[e];
            s && t.removeEventListener(s, i, !1);
          },
          raw: s,
        };
      s
        ? (Object.defineProperties(o, {
            isFullscreen: {
              get: function () {
                return Boolean(t[s.fullscreenElement]);
              },
            },
            element: {
              enumerable: !0,
              get: function () {
                return t[s.fullscreenElement];
              },
            },
            isEnabled: {
              enumerable: !0,
              get: function () {
                return Boolean(t[s.fullscreenEnabled]);
              },
            },
          }),
          i ? (e.exports = o) : (window.screenfull = o))
        : i
          ? (e.exports = { isEnabled: !1 })
          : (window.screenfull = { isEnabled: !1 });
    })();
  }).isEnabled,
    (() => {
      try {
        if (
          "object" == typeof WebAssembly &&
          "function" == typeof WebAssembly.instantiate
        ) {
          const e = new WebAssembly.Module(
            Uint8Array.of(0, 97, 115, 109, 1, 0, 0, 0),
          );
          if (e instanceof WebAssembly.Module)
            return new WebAssembly.Instance(e) instanceof WebAssembly.Instance;
        }
      } catch (e) {}
    })();
  function x(e) {
    let t = "";
    if ("object" == typeof e)
      try {
        (t = JSON.stringify(e)), (t = JSON.parse(t));
      } catch (i) {
        t = e;
      }
    else t = e;
    return t;
  }
  function D(e) {
    return !0 === e || "true" === e;
  }
  class P {
    constructor(e) {
      const {
        fromSampleRate: t,
        toSampleRate: i,
        channels: s,
        inputBufferSize: r,
      } = e;
      if (!t || !i || !s)
        throw new Error("Invalid settings specified for the resampler.");
      (this.resampler = null),
        (this.fromSampleRate = t),
        (this.toSampleRate = i),
        (this.channels = s || 0),
        (this.inputBufferSize = r),
        this.initialize();
    }
    destroy() {
      (this.resampler = null),
        (this.fromSampleRate = null),
        (this.toSampleRate = null),
        (this.channels = null),
        (this.inputBufferSize = null);
    }
    initialize() {
      this.fromSampleRate == this.toSampleRate
        ? ((this.resampler = (e) => e), (this.ratioWeight = 1))
        : (this.fromSampleRate < this.toSampleRate
            ? (this.linearInterpolation(), (this.lastWeight = 1))
            : (this.multiTap(), (this.tailExists = !1), (this.lastWeight = 0)),
          this.initializeBuffers(),
          (this.ratioWeight = this.fromSampleRate / this.toSampleRate));
    }
    bufferSlice(e) {
      try {
        return this.outputBuffer.subarray(0, e);
      } catch (t) {
        try {
          return (this.outputBuffer.length = e), this.outputBuffer;
        } catch (t) {
          return this.outputBuffer.slice(0, e);
        }
      }
    }
    initializeBuffers() {
      this.outputBufferSize =
        Math.ceil(
          ((this.inputBufferSize * this.toSampleRate) /
            this.fromSampleRate /
            this.channels) *
            1.0000004768371582,
        ) +
        this.channels +
        this.channels;
      try {
        (this.outputBuffer = new Float32Array(this.outputBufferSize)),
          (this.lastOutput = new Float32Array(this.channels));
      } catch (e) {
        (this.outputBuffer = []), (this.lastOutput = []);
      }
    }
    linearInterpolation() {
      this.resampler = (e) => {
        let t,
          i,
          s,
          r,
          o,
          n,
          a,
          l,
          h,
          u = e.length,
          c = this.channels;
        if (u % c != 0)
          throw new Error("Buffer was of incorrect sample length.");
        if (u <= 0) return [];
        for (
          t = this.outputBufferSize,
            i = this.ratioWeight,
            s = this.lastWeight,
            r = 0,
            o = 0,
            n = 0,
            a = 0,
            l = this.outputBuffer;
          s < 1;
          s += i
        )
          for (
            o = s % 1, r = 1 - o, this.lastWeight = s % 1, h = 0;
            h < this.channels;
            ++h
          )
            l[a++] = this.lastOutput[h] * r + e[h] * o;
        for (s -= 1, u -= c, n = Math.floor(s) * c; a < t && n < u; ) {
          for (o = s % 1, r = 1 - o, h = 0; h < this.channels; ++h)
            l[a++] = e[n + (h > 0 ? h : 0)] * r + e[n + (c + h)] * o;
          (s += i), (n = Math.floor(s) * c);
        }
        for (h = 0; h < c; ++h) this.lastOutput[h] = e[n++];
        return this.bufferSlice(a);
      };
    }
    multiTap() {
      this.resampler = (e) => {
        let t,
          i,
          s,
          r,
          o,
          n,
          a,
          l,
          h,
          u,
          c,
          d = e.length,
          p = this.channels;
        if (d % p != 0)
          throw new Error("Buffer was of incorrect sample length.");
        if (d <= 0) return [];
        for (
          t = this.outputBufferSize,
            i = [],
            s = this.ratioWeight,
            r = 0,
            n = 0,
            a = 0,
            l = !this.tailExists,
            this.tailExists = !1,
            h = this.outputBuffer,
            u = 0,
            c = 0,
            o = 0;
          o < p;
          ++o
        )
          i[o] = 0;
        do {
          if (l) for (r = s, o = 0; o < p; ++o) i[o] = 0;
          else {
            for (r = this.lastWeight, o = 0; o < p; ++o)
              i[o] = this.lastOutput[o];
            l = !0;
          }
          for (; r > 0 && n < d; ) {
            if (((a = 1 + n - c), !(r >= a))) {
              for (o = 0; o < p; ++o) i[o] += e[n + (o > 0 ? o : 0)] * r;
              (c += r), (r = 0);
              break;
            }
            for (o = 0; o < p; ++o) i[o] += e[n++] * a;
            (c = n), (r -= a);
          }
          if (0 !== r) {
            for (this.lastWeight = r, o = 0; o < p; ++o)
              this.lastOutput[o] = i[o];
            this.tailExists = !0;
            break;
          }
          for (o = 0; o < p; ++o) h[u++] = i[o] / s;
        } while (n < d && u < t);
        return this.bufferSlice(u);
      };
    }
    resample(e) {
      return (
        this.fromSampleRate == this.toSampleRate
          ? (this.ratioWeight = 1)
          : (this.fromSampleRate < this.toSampleRate
              ? (this.lastWeight = 1)
              : ((this.tailExists = !1), (this.lastWeight = 0)),
            this.initializeBuffers(),
            (this.ratioWeight = this.fromSampleRate / this.toSampleRate)),
        this.resampler(e)
      );
    }
  }
  const I = [255, 511, 1023, 2047, 4095, 8191, 16383, 32767];
  function z(e, t, i) {
    for (let s = 0; s < i; s++) if (e <= t[s]) return s;
    return i;
  }
  function q(e) {
    const t = [];
    return (
      Array.prototype.slice.call(e).forEach((e, i) => {
        t[i] = (function (e) {
          let t, i, s;
          return (
            e >= 0 ? (t = 213) : ((t = 85), (e = -e - 1) < 0 && (e = 32767)),
            (i = z(e, I, 8)),
            i >= 8
              ? 127 ^ t
              : ((s = i << 4),
                (s |= i < 2 ? (e >> 4) & 15 : (e >> (i + 3)) & 15),
                s ^ t)
          );
        })(e);
      }),
      t
    );
  }
  function j(e) {
    const t = [];
    return (
      Array.prototype.slice.call(e).forEach((e, i) => {
        t[i] = (function (e) {
          let t = 0;
          e < 0 ? ((e = 132 - e), (t = 127)) : ((e += 132), (t = 255));
          let i = z(e, I, 8);
          return i >= 8 ? 127 ^ t : ((i << 4) | ((e >> (i + 3)) & 15)) ^ t;
        })(e);
      }),
      t
    );
  }
  class $ {
    constructor(e) {
      (this.log = function (i) {
        if (e._opt.debugLevel == t) {
          const t = e._opt.debugUuid ? `[${e._opt.debugUuid}]` : "";
          for (
            var s = arguments.length, r = new Array(s > 1 ? s - 1 : 0), o = 1;
            o < s;
            o++
          )
            r[o - 1] = arguments[o];
          console.log(`JbPro${t}[✅✅✅][${i}]`, ...r);
        }
      }),
        (this.warn = function (s) {
          if (e._opt.debugLevel == t || e._opt.debugLevel == i) {
            const t = e._opt.debugUuid ? `[${e._opt.debugUuid}]` : "";
            for (
              var r = arguments.length, o = new Array(r > 1 ? r - 1 : 0), n = 1;
              n < r;
              n++
            )
              o[n - 1] = arguments[n];
            console.log(`JbPro${t}[❗❗❗][${s}]`, ...o);
          }
        }),
        (this.error = function (t) {
          const i = e._opt.debugUuid ? `[${e._opt.debugUuid}]` : "";
          for (
            var s = arguments.length, r = new Array(s > 1 ? s - 1 : 0), o = 1;
            o < s;
            o++
          )
            r[o - 1] = arguments[o];
          console.error(`JbPro${i}[❌❌❌][${t}]`, ...r);
        });
    }
  }
  class H {
    constructor(e) {
      (this.destroys = []),
        (this.proxy = this.proxy.bind(this)),
        (this.master = e);
    }
    proxy(e, t, i) {
      let s =
        arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : {};
      if (!e) return;
      if (Array.isArray(t)) return t.map((t) => this.proxy(e, t, i, s));
      e.addEventListener(t, i, s);
      const r = () => {
        "function" == typeof e.removeEventListener &&
          e.removeEventListener(t, i, s);
      };
      return this.destroys.push(r), r;
    }
    destroy() {
      this.master.debugLog("Events", "destroy"),
        this.destroys.forEach((e) => e()),
        (this.destroys = []);
    }
  }
  class V extends e {
    constructor(e) {
      let t =
        arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
      super(),
        (this._opt = {}),
        e && (this.player = e),
        (this.TAG_NAME = "talk");
      const i = x(O);
      (this._opt = Object.assign({}, i, t)),
        this.player || (this.debug = new $(this)),
        this.log(this.TAG_NAME, "init and version is", '"7-29-2024"'),
        (this._opt.sampleRate = parseInt(this._opt.sampleRate, 10)),
        (this._opt.sampleBitsWidth = parseInt(this._opt.sampleBitsWidth, 10)),
        (this._opt.encType !== b && this._opt.encType !== _) ||
          (8e3 === this._opt.sampleRate && 16 === this._opt.sampleBitsWidth) ||
          (this.warn(
            this.TAG_NAME,
            `\n            encType is ${this._opt.encType} and sampleRate is ${this._opt.sampleRate}, and sampleBitsWidth is ${this._opt.sampleBitsWidth}。\n            ${this._opt.encType} only support sampleRate 8000 and sampleBitsWidth 16`,
          ),
          (this._opt.sampleRate = 8e3),
          (this._opt.sampleBitsWidth = 16)),
        this._opt.packetType === M &&
          this._opt.encType === y &&
          (this.warn(
            this.TAG_NAME,
            `packetType is ${this._opt.packetType} and encType is ${this._opt.encType}, rtp only support g711a or g711u or opus so set packetType to empty`,
          ),
          (this._opt.packetType = U)),
        this._opt.encType,
        (this.audioContext = null),
        (this.gainNode = null),
        (this.recorder = null),
        (this.workletRecorder = null),
        (this.biquadFilter = null),
        (this.userMediaStream = null),
        (this.clearWorkletUrlTimeout = null),
        (this.bufferSize = 512),
        (this._opt.audioBufferLength = this.calcAudioBufferLength()),
        (this.audioBufferList = []),
        (this.opusEncoder = null),
        (this.opusDecoder = null),
        (this.resampler = null),
        this._opt.encType,
        (this.socket = null),
        (this.socketStatus = g),
        (this.mediaStreamSource = null),
        (this.heartInterval = null),
        (this.checkGetUserMediaTimeout = null),
        (this.wsUrl = null),
        (this.startTimestamp = 0),
        (this.sequenceId = 0),
        (this.tempTimestamp = null),
        (this._destroyed = !1),
        (this.tempG711BufferList = new Uint8Array(0)),
        (this.tempRtpBufferList = new Uint8Array(0)),
        (this.tempPcmBufferList = new Uint8Array(0)),
        (this.tempOpusBufferList = new Uint8Array(0)),
        (this.events = new H(this)),
        this._initTalk();
      try {
        this.log(this.TAG_NAME, "init", JSON.stringify(this._opt));
      } catch (e) {
        this.log(this.TAG_NAME, "init", this._opt);
      }
    }
    destroy() {
      (this._destroyed = !0),
        this.clearWorkletUrlTimeout &&
          (clearTimeout(this.clearWorkletUrlTimeout),
          (this.clearWorkletUrlTimeout = null)),
        this.userMediaStream &&
          (this.userMediaStream.getTracks &&
            this.userMediaStream.getTracks().forEach((e) => {
              e.stop();
            }),
          (this.userMediaStream = null)),
        this.mediaStreamSource &&
          (this.mediaStreamSource.disconnect(),
          (this.mediaStreamSource = null)),
        this.recorder &&
          (this.recorder.disconnect(),
          (this.recorder.onaudioprocess = null),
          (this.recorder = null)),
        this.biquadFilter &&
          (this.biquadFilter.disconnect(), (this.biquadFilter = null)),
        this.gainNode && (this.gainNode.disconnect(), (this.gainNode = null)),
        this.workletRecorder &&
          (this.workletRecorder.disconnect(), (this.workletRecorder = null)),
        this.opusEncoder &&
          (this.opusEncoder.destroy(), (this.opusEncoder = null)),
        this.opusDecoder &&
          (this.opusDecoder.destroy(), (this.opusDecoder = null)),
        this.resampler && (this.resampler.destroy(), (this.resampler = null)),
        this.socket &&
          (this.socketStatus === w && this._sendClose(),
          this.socket.close(),
          (this.socket = null)),
        this._stopHeartInterval(),
        this._stopCheckGetUserMediaTimeout(),
        (this.audioContext = null),
        (this.gainNode = null),
        (this.recorder = null),
        (this.audioBufferList = []),
        (this.sequenceId = 0),
        (this.wsUrl = null),
        (this.tempTimestamp = null),
        (this.tempRtpBufferList = null),
        (this.tempG711BufferList = null),
        (this.tempPcmBufferList = null),
        (this.tempOpusBufferList = null),
        (this.startTimestamp = 0),
        this.log(this.TAG_NAME, "destroy");
    }
    isDestroyed() {
      return this._destroyed;
    }
    addRtpToBuffer(e) {
      const t = e.length + this.tempRtpBufferList.length,
        i = new Uint8Array(t);
      i.set(this.tempRtpBufferList, 0),
        i.set(e, this.tempRtpBufferList.length),
        (this.tempRtpBufferList = i);
    }
    addG711ToBuffer(e) {
      const t = e.length + this.tempG711BufferList.length,
        i = new Uint8Array(t);
      i.set(this.tempG711BufferList, 0),
        i.set(e, this.tempG711BufferList.length),
        (this.tempG711BufferList = i);
    }
    addPcmToBuffer(e) {
      const t = e.length + this.tempPcmBufferList.length,
        i = new Uint8Array(t);
      i.set(this.tempPcmBufferList, 0),
        i.set(e, this.tempPcmBufferList.length),
        (this.tempPcmBufferList = i);
    }
    addOpusToBuffer_1(e) {
      this.opusDecoder ||
        (this.opusDecoder = new OpusDecoder(
          this._opt.sampleRate,
          this._opt.numberChannels,
        ));
      const t = this.opusDecoder.decode(e),
        i = new Uint8Array(t.buffer);
      this.addPcmToBuffer(i);
    }
    addOpusToBuffer(e) {
      const t = this.tempOpusBufferList.length + 1 + e.length,
        i = new Uint8Array(t);
      i.set(this.tempOpusBufferList, 0),
        i.set([e.length], this.tempOpusBufferList.length),
        i.set(e, this.tempOpusBufferList.length + 1),
        (this.tempOpusBufferList = i);
    }
    downloadRtpFile() {
      this.debugLog(this.TAG_NAME, "downloadRtpFile");
      const e = new Blob([this.tempRtpBufferList]);
      try {
        const t = document.createElement("a");
        (t.href = window.URL.createObjectURL(e)),
          (t.download = Date.now() + ".rtp"),
          t.click(),
          (this.tempRtpBufferList = new Uint8Array(0)),
          window.URL.revokeObjectURL(t.href);
      } catch (e) {
        console.error("downloadRtpFile", e);
      }
    }
    downloadG711File() {
      this.debugLog(this.TAG_NAME, "downloadG711File");
      const e = new Blob([this.tempG711BufferList]);
      try {
        const t = document.createElement("a");
        (t.href = window.URL.createObjectURL(e)),
          (t.download = Date.now() + "." + this._opt.encType),
          t.click(),
          (this.tempG711BufferList = new Uint8Array(0)),
          window.URL.revokeObjectURL(t.href);
      } catch (e) {
        console.error("downloadG711File", e);
      }
    }
    downloadOpusFile_1() {
      this.debugLog(this.TAG_NAME, "downloadOpusFile"), this.downloadPcmFile();
    }
    downloadOpusFile() {
      this.debugLog(this.TAG_NAME, "downloadOpusFile");
      const e = (function (e, t, i) {
          const s = new Uint8Array([
              79, 103, 103, 83, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0, 0, 0,
            ]),
            r = new Uint8Array([
              79,
              112,
              117,
              115,
              72,
              101,
              97,
              100,
              1,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              255 & t,
              (t >> 8) & 255,
              (t >> 16) & 255,
              (t >> 24) & 255,
              255 & i,
              (i >> 8) & 255,
              0,
              0,
              0,
              0,
            ]),
            o = new Uint8Array(s.length + r.length + e.length);
          return o.set(s), o.set(r, s.length), o.set(e, s.length + r.length), o;
        })(
          this.tempOpusBufferList,
          this._opt.sampleRate,
          this._opt.numberChannels,
        ),
        t = new Blob([e], { type: "audio/ogg" });
      try {
        const e = document.createElement("a");
        (e.href = window.URL.createObjectURL(t)),
          (e.download = Date.now() + ".ogg"),
          e.click(),
          (this.tempOpusBufferList = new Uint8Array(0)),
          window.URL.revokeObjectURL(e.href);
      } catch (e) {
        console.error("downloadOpusFile", e);
      }
    }
    downloadPcmFile() {
      let e = arguments.length > 0 && void 0 !== arguments[0] && arguments[0];
      this.debugLog(
        this.TAG_NAME,
        "downloadPcmFile",
        this._opt.sampleRate,
        this._opt.numberChannels,
        this._opt.sampleBitsWidth,
      );
      let t = new DataView(this.tempPcmBufferList.buffer),
        i = null,
        s = "";
      e
        ? ((t = (function (e, t, i, s) {
            var r = function (e, t, i) {
                for (var s = 0; s < i.length; s++)
                  e.setUint8(t + s, i.charCodeAt(s));
              },
              o = t,
              n = s,
              a = new ArrayBuffer(44 + e.byteLength),
              l = new DataView(a),
              h = i,
              u = 0;
            r(l, u, "RIFF"),
              (u += 4),
              l.setUint32(u, 36 + e.byteLength, !0),
              r(l, (u += 4), "WAVE"),
              r(l, (u += 4), "fmt "),
              (u += 4),
              l.setUint32(u, 16, !0),
              (u += 4),
              l.setUint16(u, 1, !0),
              (u += 2),
              l.setUint16(u, h, !0),
              (u += 2),
              l.setUint32(u, o, !0),
              (u += 4),
              l.setUint32(u, h * o * (n / 8), !0),
              (u += 4),
              l.setUint16(u, h * (n / 8), !0),
              (u += 2),
              l.setUint16(u, n, !0),
              r(l, (u += 2), "data"),
              (u += 4),
              l.setUint32(u, e.byteLength, !0),
              (u += 4);
            for (let t = 0; t < e.byteLength; )
              l.setUint8(u, e.getUint8(t)), u++, t++;
            return l;
          })(
            t,
            this._opt.sampleRate,
            this._opt.numberChannels,
            this._opt.sampleBitsWidth,
          )),
          (s = ".wav"),
          (i = new Blob([t], { type: "audio/wav" })))
        : ((s = ".pcm"), (i = new Blob([this.tempPcmBufferList])));
      try {
        const e = document.createElement("a");
        (e.href = window.URL.createObjectURL(i)),
          (e.download = Date.now() + s),
          e.click(),
          (this.tempPcmBufferList = new Uint8Array(0)),
          window.URL.revokeObjectURL(e.href);
      } catch (e) {
        console.error("downloadRtpFile", e);
      }
    }
    downloadFile() {
      this._opt.packetType === M
        ? this.downloadRtpFile()
        : this._opt.encType === b || this._opt.encType === _
          ? this.downloadG711File()
          : this._opt.encType === A
            ? this.downloadOpusFile()
            : this._opt.encType === y && this.downloadPcmFile();
    }
    calcAudioBufferLength() {
      const { sampleRate: e, sampleBitsWidth: t, frameDuration: i } = this._opt;
      return (e * t * (i / 1e3)) / 8;
    }
    get socketStatusOpen() {
      return this.socketStatus === w;
    }
    log() {
      for (var e = arguments.length, t = new Array(e), i = 0; i < e; i++)
        t[i] = arguments[i];
      this._log("log", ...t);
    }
    warn() {
      for (var e = arguments.length, t = new Array(e), i = 0; i < e; i++)
        t[i] = arguments[i];
      this._log("warn", ...t);
    }
    error() {
      for (var e = arguments.length, t = new Array(e), i = 0; i < e; i++)
        t[i] = arguments[i];
      this._log("error", ...t);
    }
    _log(e) {
      for (
        var t = arguments.length, i = new Array(t > 1 ? t - 1 : 0), s = 1;
        s < t;
        s++
      )
        i[s - 1] = arguments[s];
      this.player
        ? this.player.debug[e](...i)
        : this.debug
          ? this.debug[e](...i)
          : console[e](...i);
    }
    _getSequenceId() {
      return ++this.sequenceId;
    }
    _createWebSocket(e) {
      return new Promise((t, i) => {
        const s = this.events.proxy;
        (this.socket = new WebSocket(this.wsUrl, e.protocols || [])),
          (this.socket.binaryType = "arraybuffer"),
          this.emit(a),
          s(this.socket, L, () => {
            (this.socketStatus = w),
              this.log(this.TAG_NAME, "websocket open -> do talk"),
              this.emit(l),
              t(),
              this._doTalk();
          }),
          s(this.socket, W, (e) => {
            this.log(this.TAG_NAME, "websocket message", e.data);
          }),
          s(this.socket, B, (e) => {
            (this.socketStatus = k),
              this.warn(this.TAG_NAME, "websocket close -> reject", e),
              this.emitError(h),
              i(e);
          }),
          s(this.socket, R, (e) => {
            (this.socketStatus = T),
              this.error(this.TAG_NAME, "websocket error -> reject", e),
              this.emitError(u, e),
              i(e);
          });
      });
    }
    _sendClose() {}
    _initTalk() {
      this._initMethods(),
        this._opt.engine === C
          ? this._initWorklet()
          : this._opt.engine === F && this._initScriptProcessor(),
        this.log(
          this.TAG_NAME,
          "audioContext samplerate",
          this.audioContext.sampleRate,
        );
    }
    _initMethods() {
      (this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)({ sampleRate: 48e3 })),
        (this.gainNode = this.audioContext.createGain()),
        (this.gainNode.gain.value = 1),
        (this.biquadFilter = this.audioContext.createBiquadFilter()),
        (this.biquadFilter.type = "lowpass"),
        (this.biquadFilter.frequency.value = 3e3),
        (this.resampler = new P({
          fromSampleRate: this.audioContext.sampleRate,
          toSampleRate: this._opt.sampleRate,
          channels: this._opt.numberChannels,
          inputBufferSize: this.bufferSize,
        }));
    }
    _initScriptProcessor() {
      const e =
        this.audioContext.createScriptProcessor ||
        this.audioContext.createJavaScriptNode;
      (this.recorder = e.apply(this.audioContext, [
        this.bufferSize,
        this._opt.numberChannels,
        this._opt.numberChannels,
      ])),
        (this.recorder.onaudioprocess = (e) => this._onaudioprocess(e));
    }
    _initWorklet() {
      const e = (function (e) {
        const t = e
            .toString()
            .trim()
            .match(/^function\s*\w*\s*\([\w\s,]*\)\s*{([\w\W]*?)}$/)[1],
          i = new Blob([t], { type: "application/javascript" });
        return URL.createObjectURL(i);
      })(function () {
        class e extends AudioWorkletProcessor {
          constructor(e) {
            super(),
              (this._cursor = 0),
              (this._bufferSize = e.processorOptions.bufferSize),
              (this._buffer = new Float32Array(this._bufferSize));
          }
          process(e, t, i) {
            if (!e.length || !e[0].length) return !0;
            for (let t = 0; t < e[0][0].length; t++)
              (this._cursor += 1),
                this._cursor === this._bufferSize &&
                  ((this._cursor = 0),
                  this.port.postMessage({
                    eventType: "data",
                    buffer: this._buffer,
                  })),
                (this._buffer[this._cursor] = e[0][0][t]);
            return !0;
          }
        }
        registerProcessor("talk-processor", e);
      });
      this.audioContext.audioWorklet &&
        this.audioContext.audioWorklet.addModule(e).then(() => {
          const e = new AudioWorkletNode(this.audioContext, "talk-processor", {
            processorOptions: { bufferSize: this.bufferSize },
          });
          e.connect(this.gainNode),
            (e.port.onmessage = (e) => {
              "data" === e.data.eventType &&
                this._encodeAudioData(e.data.buffer);
            }),
            (this.workletRecorder = e);
        }),
        (this.clearWorkletUrlTimeout = setTimeout(() => {
          URL.revokeObjectURL(e), (this.clearWorkletUrlTimeout = null);
        }, 1e4));
    }
    _onaudioprocess(e) {
      const t = e.inputBuffer.getChannelData(0);
      this._encodeAudioData(new Float32Array(t));
    }
    _encodeAudioData(e) {
      if (this.isDestroyed()) return;
      if (0 === e[0] && 0 === e[1])
        return void this.log(this.TAG_NAME, "empty audio data");
      const t = this.resampler.resample(e);
      if (this._opt.encType === A);
      else {
        let e = t;
        16 === this._opt.sampleBitsWidth
          ? (e = (function (e) {
              let t = e.length,
                i = new Int16Array(t);
              for (; t--; ) {
                let s = Math.max(-1, Math.min(1, e[t]));
                i[t] = s < 0 ? 32768 * s : 32767 * s;
              }
              return i;
            })(t))
          : 8 === this._opt.sampleBitsWidth
            ? (e = (function (e) {
                let t = e.length,
                  i = new Int8Array(t);
                for (; t--; ) {
                  let s = Math.max(-1, Math.min(1, e[t]));
                  const r = s < 0 ? 32768 * s : 32767 * s;
                  i[t] = parseInt(255 / (65535 / (32768 + r)), 10);
                }
                return i;
              })(t))
            : 32 === this._opt.sampleBitsWidth &&
              (e = (function (e) {
                let t = e.length,
                  i = new Int32Array(t);
                for (; t--; ) {
                  let s = Math.max(-1, Math.min(1, e[t]));
                  i[t] = s < 0 ? 2147483648 * s : 2147483647 * s;
                }
                return i;
              })(t));
        let i = null;
        this._opt.encType === b
          ? (i = q(e))
          : this._opt.encType === _
            ? (i = j(e))
            : this._opt.encType === y && (i = e.buffer);
        const s = new Uint8Array(i);
        for (let e = 0; e < s.length; e++) {
          let t = this.audioBufferList.length;
          (this.audioBufferList[t++] = s[e]),
            this.audioBufferList.length === this._opt.audioBufferLength &&
              (this._sendTalkMsg(new Uint8Array(this.audioBufferList)),
              (this.audioBufferList = []));
        }
      }
    }
    _parseAudioMsg(e) {
      let t = null;
      return (
        this._opt.packetType !== M ||
        (this._opt.encType !== b &&
          this._opt.encType !== _ &&
          this._opt.enc !== A)
          ? this._opt.packetType === U && (t = e)
          : (t = this.rtpPacket(e)),
        t
      );
    }
    rtpPacket(e) {
      const t = [];
      let i = 0,
        s = 0,
        r = 0;
      const o = this._opt.rtpSsrc,
        n = e.length;
      this._opt.encType === b
        ? (i = E)
        : this._opt.encType === _
          ? (i = S)
          : this._opt.encType === A && (i = v),
        this.startTimestamp || (this.startTimestamp = N()),
        (r = N() - this.startTimestamp),
        (s = this._getSequenceId());
      let a = 0;
      if (this._opt.packetTcpSendType === G) {
        const e = n + 12;
        (t[a++] = 255 & (e >> 8)), (t[a++] = 255 & (e >> 0));
      }
      (t[a++] = 128),
        (t[a++] = 128 + i),
        (t[a++] = s / 256),
        (t[a++] = s % 256),
        (t[a++] = r / 65536 / 256),
        (t[a++] = (r / 65536) % 256),
        (t[a++] = (r % 65536) / 256),
        (t[a++] = (r % 65536) % 256),
        (t[a++] = o / 65536 / 256),
        (t[a++] = (o / 65536) % 256),
        (t[a++] = (o % 65536) / 256),
        (t[a++] = (o % 65536) % 256);
      let l = t.concat([...e]),
        h = new Uint8Array(l.length);
      for (let e = 0; e < l.length; e++) h[e] = l[e];
      return h;
    }
    _sendTalkMsg(e) {
      null === this.tempTimestamp && (this.tempTimestamp = N());
      const t = N(),
        i = t - this.tempTimestamp,
        s = this._parseAudioMsg(e);
      this.log(
        this.TAG_NAME,
        `send talk msg and diff is ${i} and byteLength is ${s.byteLength} and length is ${s.length}, and ${this._opt.encType} length is ${e.length}`,
      ),
        D(this._opt.saveToTempFile) &&
          D(this._opt.debug) &&
          (this._opt.packetType === M
            ? this.addRtpToBuffer(s)
            : this._opt.encType === b || this._opt.encType === _
              ? this.addG711ToBuffer(s)
              : this._opt.encType === y
                ? this.addPcmToBuffer(s)
                : this._opt.encType === A && this.addOpusToBuffer(s)),
        s &&
          (this._opt.testMicrophone
            ? this.emit(d, s.buffer)
            : this.socketStatusOpen
              ? this.socket.send(s.buffer)
              : this.emitError(m.tallWebsocketClosedByError)),
        (this.tempTimestamp = t);
    }
    _doTalk() {
      this._getUserMedia();
    }
    _getUserMedia() {
      this.log(this.TAG_NAME, "getUserMedia"),
        void 0 === window.navigator.mediaDevices &&
          (window.navigator.mediaDevices = {}),
        void 0 === window.navigator.mediaDevices.getUserMedia &&
          (this.log(
            this.TAG_NAME,
            "window.navigator.mediaDevices.getUserMedia is undefined and init function",
          ),
          (window.navigator.mediaDevices.getUserMedia = function (e) {
            var t =
              navigator.getUserMedia ||
              navigator.webkitGetUserMedia ||
              navigator.mozGetUserMedia ||
              navigator.msGetUserMedia;
            return t
              ? new Promise(function (i, s) {
                  t.call(navigator, e, i, s);
                })
              : Promise.reject(
                  new Error("getUserMedia is not implemented in this browser"),
                );
          })),
        this._opt.checkGetUserMediaTimeout &&
          this._startCheckGetUserMediaTimeout(),
        window.navigator.mediaDevices
          .getUserMedia({ audio: this._opt.audioConstraints, video: !1 })
          .then((e) => {
            this.log(this.TAG_NAME, "getUserMedia success"),
              (this.userMediaStream = e),
              (this.mediaStreamSource =
                this.audioContext.createMediaStreamSource(e)),
              this.mediaStreamSource.connect(this.biquadFilter),
              this.recorder
                ? (this.biquadFilter.connect(this.recorder),
                  this.recorder.connect(this.gainNode))
                : this.workletRecorder &&
                  (this.biquadFilter.connect(this.workletRecorder),
                  this.workletRecorder.connect(this.gainNode)),
              this.gainNode.connect(this.audioContext.destination),
              this.emit(r),
              null === e.oninactive &&
                (e.oninactive = (e) => {
                  this._handleStreamInactive(e);
                });
          })
          .catch((e) => {
            this.error(this.TAG_NAME, "getUserMedia error", e.toString()),
              this.emit(o, e.toString());
          })
          .finally(() => {
            this.log(this.TAG_NAME, "getUserMedia finally"),
              this._stopCheckGetUserMediaTimeout();
          });
    }
    _getUserMedia2() {
      this.log(this.TAG_NAME, "getUserMedia"),
        navigator.mediaDevices
          ? navigator.mediaDevices.getUserMedia({ audio: !0 }).then((e) => {
              this.log(this.TAG_NAME, "getUserMedia2 success");
            })
          : navigator.getUserMedia(
              { audio: !0 },
              this.log(this.TAG_NAME, "getUserMedia2 success"),
              this.log(this.TAG_NAME, "getUserMedia2 fail"),
            );
    }
    async _getUserMedia3() {
      this.log(this.TAG_NAME, "getUserMedia3");
      try {
        const e = await navigator.mediaDevices.getUserMedia({
          audio: {
            latency: !0,
            noiseSuppression: !0,
            autoGainControl: !0,
            echoCancellation: !0,
            sampleRate: 48e3,
            channelCount: 1,
          },
          video: !1,
        });
        console.log("getUserMedia() got stream:", e),
          this.log(this.TAG_NAME, "getUserMedia3 success");
      } catch (e) {
        this.log(this.TAG_NAME, "getUserMedia3 fail");
      }
    }
    _handleStreamInactive(e) {
      this.userMediaStream &&
        (this.warn(this.TAG_NAME, "stream oninactive", e), this.emit(c));
    }
    _startCheckGetUserMediaTimeout() {
      this._stopCheckGetUserMediaTimeout(),
        (this.checkGetUserMediaTimeout = setTimeout(() => {
          this.log(this.TAG_NAME, "check getUserMedia timeout"), this.emit(n);
        }, this._opt.getUserMediaTimeout));
    }
    _stopCheckGetUserMediaTimeout() {
      this.checkGetUserMediaTimeout &&
        (this.log(this.TAG_NAME, "stop checkGetUserMediaTimeout"),
        clearTimeout(this.checkGetUserMediaTimeout),
        (this.checkGetUserMediaTimeout = null));
    }
    _startHeartInterval() {
      this.heartInterval = setInterval(() => {
        this.log(this.TAG_NAME, "heart interval");
        let e = [35, 36, 0, 0, 0, 0, 0, 0];
        (e = new Uint8Array(e)), this.socket.send(e.buffer);
      }, 15e3);
    }
    _stopHeartInterval() {
      this.heartInterval &&
        (this.log(this.TAG_NAME, "stop heart interval"),
        clearInterval(this.heartInterval),
        (this.heartInterval = null));
    }
    startTalk(e) {
      let t =
        arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
      return new Promise((i, s) => {
        if (
          !(function () {
            let e = !1;
            const t = window.navigator;
            return (
              t &&
                ((e = !(!t.mediaDevices || !t.mediaDevices.getUserMedia)),
                e ||
                  (e = !!(
                    t.getUserMedia ||
                    t.webkitGetUserMedia ||
                    t.mozGetUserMedia ||
                    t.msGetUserMedia
                  ))),
              e
            );
          })()
        )
          return s("not support getUserMedia");
        if (((this.wsUrl = e), this._opt.testMicrophone)) this._doTalk();
        else {
          if (!this.wsUrl) return s("wsUrl is null");
          this._createWebSocket(t).catch((e) => {
            s(e);
          });
        }
        this.once(o, () => {
          s("getUserMedia fail");
        }),
          this.once(r, () => {
            i();
          });
      });
    }
    setVolume(e) {
      var t, i, s;
      ((e = parseFloat(e).toFixed(2)), isNaN(e)) ||
        ((t = e),
        (i = 0),
        (s = 1),
        (e = Math.max(Math.min(t, Math.max(i, s)), Math.min(i, s))),
        (this.gainNode.gain.value = e));
    }
    getOption() {
      return this._opt;
    }
    get volume() {
      return this.gainNode
        ? parseFloat(100 * this.gainNode.gain.value).toFixed(0)
        : null;
    }
    debugLog(e) {
      if (this._opt.debug && this.debug) {
        for (
          var t = arguments.length, i = new Array(t > 1 ? t - 1 : 0), s = 1;
          s < t;
          s++
        )
          i[s - 1] = arguments[s];
        this.debug.log(e, ...i);
      }
    }
    debugWarn(e) {
      if (this._opt.debug && this.debug) {
        for (
          var t = arguments.length, i = new Array(t > 1 ? t - 1 : 0), s = 1;
          s < t;
          s++
        )
          i[s - 1] = arguments[s];
        this.debug.warn(e, ...i);
      }
    }
    debugError(e) {
      if (this.debug) {
        for (
          var t = arguments.length, i = new Array(t > 1 ? t - 1 : 0), s = 1;
          s < t;
          s++
        )
          i[s - 1] = arguments[s];
        this.debug.error(e, ...i);
      }
    }
    emitError(e) {
      let t =
        arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "";
      this.emit(s, e, t), this.emit(e, t);
    }
  }
  class J extends e {
    constructor() {
      let e =
        arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
      super(),
        (this.talk = null),
        (this._opt = e),
        (this.LOG_TAG = "JbProTalk"),
        (this.debug = new $(this));
      try {
        this.debugLog(this.LOG_TAG, "init", JSON.stringify(e));
      } catch (t) {
        this.debugLog(this.LOG_TAG, "init", e);
      }
    }
    destroy() {
      this.debugLog(this.LOG_TAG, "destroy()"),
        this.off(),
        this.talk && (this.talk.destroy(), (this.talk = null)),
        this.debugLog(this.LOG_TAG, "destroy");
    }
    _initTalk() {
      let e =
        arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
      this.talk &&
        (this.debugLog(
          this.LOG_TAG,
          "_initTalk this.talk is not null and destroy",
        ),
        this.talk.destroy(),
        (this.talk = null));
      const t = Object.assign({}, x(this._opt), e);
      (this._opt = t),
        (this.talk = new V(null, t)),
        this.debugLog(this.LOG_TAG, "_initTalk", this.talk.getOption()),
        this._bindTalkEvents();
    }
    _bindTalkEvents() {
      Object.keys(f).forEach((e) => {
        this.talk.on(f[e], (t) => {
          this.emit(e, t);
        });
      });
    }
    startTalk(e) {
      let t =
          arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
        i = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
      return new Promise((s, r) => {
        try {
          this.debugLog(this.LOG_TAG, "startTalk", e, JSON.stringify(t));
        } catch (i) {
          this.debugLog(this.LOG_TAG, "startTalk", e, t);
        }
        this._initTalk(t),
          this.talk
            .startTalk(e, i)
            .then(() => {
              s(),
                this.talk.once(h, this._handleTalkStreamClose.bind(this)),
                this.talk.once(u, this._handleTalkStreamError.bind(this)),
                this.talk.once(c, this._handleTalkStreamInactive.bind(this)),
                this.talk.once(
                  n,
                  this._handleTalkGetUserMediaTimeout.bind(this),
                ),
                this.talk.once(
                  m.tallWebsocketClosedByError,
                  this._handleTalkWebsocketClosedByError.bind(this),
                );
            })
            .catch((e) => {
              r(e);
            });
      });
    }
    stopTalk() {
      return new Promise((e, t) => {
        this.debugLog(this.LOG_TAG, "stopTalk()"),
          this.talk || t("talk is not init"),
          this.talk.destroy(),
          (this.talk = null),
          e();
      });
    }
    getTalkVolume() {
      return new Promise((e, t) => {
        this.talk || t("talk is not init"), e(this.talk.volume);
      });
    }
    setTalkVolume(e) {
      return new Promise((t, i) => {
        this.debugLog(this.LOG_TAG, "setTalkVolume", e),
          this.talk || i("talk is not init"),
          this.talk.setVolume(e / 100),
          t();
      });
    }
    downloadTempRtpFile() {
      return new Promise((e, t) => {
        this.talk ? (this.talk.downloadRtpFile(), e()) : t("talk is not init");
      });
    }
    downloadTempG711File() {
      return new Promise((e, t) => {
        this.talk ? (this.talk.downloadG711File(), e()) : t("talk is not init");
      });
    }
    downloadTempPcmFile(e) {
      return new Promise((t, i) => {
        this.talk ? (this.talk.downloadPcmFile(e), t()) : i("talk is not init");
      });
    }
    downloadTempOpusFile() {
      return new Promise((e, t) => {
        this.talk ? (this.talk.downloadOpusFile(), e()) : t("talk is not init");
      });
    }
    downloadTempFile() {
      return new Promise((e, t) => {
        this.talk ? (this.talk.downloadFile(), e()) : t("talk is not init");
      });
    }
    debugLog(e) {
      if (this._opt.debug && this.debug) {
        for (
          var t = arguments.length, i = new Array(t > 1 ? t - 1 : 0), s = 1;
          s < t;
          s++
        )
          i[s - 1] = arguments[s];
        this.debug.log(e, ...i);
      }
    }
    debugWarn(e) {
      if (this._opt.debug && this.debug) {
        for (
          var t = arguments.length, i = new Array(t > 1 ? t - 1 : 0), s = 1;
          s < t;
          s++
        )
          i[s - 1] = arguments[s];
        this.debug.warn(e, ...i);
      }
    }
    debugError(e) {
      if (this.debug) {
        for (
          var t = arguments.length, i = new Array(t > 1 ? t - 1 : 0), s = 1;
          s < t;
          s++
        )
          i[s - 1] = arguments[s];
        this.debug.error(e, ...i);
      }
    }
    _handleTalkStreamClose() {
      this.debugWarn(this.LOG_TAG, "talkStreamClose -> stopTalk"),
        this.stopTalk()
          .catch((e) => {
            this.debugWarn(this.LOG_TAG, "talkStreamClose stopTalk", e);
          })
          .finally(() => {
            this.emit(p, h);
          });
    }
    _handleTalkStreamError() {
      this.debugError(this.LOG_TAG, "talkStreamError -> stopTalk"),
        this.stopTalk()
          .catch((e) => {
            this.debugWarn(this.LOG_TAG, "talkStreamError stopTalk", e);
          })
          .finally(() => {
            this.emit(p, u);
          });
    }
    _handleTalkStreamInactive() {
      this.debugWarn(this.LOG_TAG, "talkStreamInactive -> stopTalk"),
        this.stopTalk()
          .catch((e) => {
            this.debugWarn(this.LOG_TAG, "talkStreamInactive stopTalk", e);
          })
          .finally(() => {
            this.emit(p, c);
          });
    }
    _handleTalkGetUserMediaTimeout() {
      this.debugWarn(this.LOG_TAG, "talkGetUserMediaTimeout -> stopTalk"),
        this.stopTalk()
          .catch((e) => {
            this.debugWarn(this.LOG_TAG, "talkGetUserMediaTimeout stopTalk", e);
          })
          .finally(() => {
            this.emit(p, n);
          });
    }
    _handleTalkWebsocketClosedByError() {
      this.debugWarn(this.LOG_TAG, "talkWebsocketClosedByError -> stopTalk"),
        this.stopTalk()
          .catch((e) => {
            this.debugWarn(
              this.LOG_TAG,
              "talkWebsocketClosedByError stopTalk",
              e,
            );
          })
          .finally(() => {
            this.emit(p, m.tallWebsocketClosedByError);
          });
    }
  }
  return (
    (J.EVENTS = f),
    (window.JessibucaProTalk = J),
    (window.JbProTalk = J),
    (window.WebPlayerProTalk = J),
    J
  );
});
