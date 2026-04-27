import { onBeforeUnmount, Ref, watch } from "vue";
import * as Cesium from "cesium";
import { mapViewInternal } from "@gdu-gl/core";
import {
  ClusterLayerEmits,
  ClusterLayerProps,
  defaultClusterStyle,
  defaultPointStyle,
} from "../props";
import { ClusterResult } from "./useCluster";

const canvasCache = new Map<string, HTMLCanvasElement>();

function getCanvasCacheKey(
  color: string,
  size: number,
  outlineColor?: string,
  outlineWidth?: number,
): string {
  const dpr = window.devicePixelRatio || 1;
  return `circle_${color}_${size}_${outlineColor}_${outlineWidth}_${dpr}`;
}

function drawCircleCanvas(config: {
  color: string;
  size: number;
  outlineColor?: string;
  outlineWidth?: number;
}): HTMLCanvasElement {
  const key = getCanvasCacheKey(
    config.color,
    config.size,
    config.outlineColor,
    config.outlineWidth,
  );
  const cached = canvasCache.get(key);
  if (cached) return cached;

  const dpr = window.devicePixelRatio || 1;
  const bw = config.outlineWidth ?? 0;
  const cssTotal = config.size + bw * 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cssTotal * dpr);
  canvas.height = Math.round(cssTotal * dpr);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  const cx = cssTotal / 2;
  const cy = cssTotal / 2;
  const r = config.size / 2;

  ctx.globalAlpha = 0.88;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = config.color;
  ctx.fill();
  ctx.globalAlpha = 1;

  if (bw > 0 && config.outlineColor) {
    ctx.strokeStyle = config.outlineColor;
    ctx.lineWidth = bw;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  canvasCache.set(key, canvas);
  return canvas;
}

export function useClusterRenderer(
  props: ClusterLayerProps,
  emits: ClusterLayerEmits,
  clusters: Ref<ClusterResult[]>,
  expandCluster: (clusterId: number, lng: number, lat: number) => void,
) {
  const cesiumViewer = mapViewInternal.getViewer(props.viewId!)
    ?.mapProviderDelegate.map as Cesium.Viewer;
  if (!cesiumViewer) return;

  const billboardCollection = new Cesium.BillboardCollection({
    scene: cesiumViewer.scene,
  });
  const labelCollection = new Cesium.LabelCollection({
    scene: cesiumViewer.scene,
  });
  cesiumViewer.scene.primitives.add(billboardCollection);
  cesiumViewer.scene.primitives.add(labelCollection);

  const billboardMap = new Map<string, Cesium.Billboard>();
  const labelMap = new Map<string, Cesium.Label>();
  const clusterDataMap = new Map<string, ClusterResult>();

  function getClusterKey(item: ClusterResult): string {
    return item.isCluster ? `c_${item.id}` : `p_${item.id}`;
  }

  function renderClusters(items: ClusterResult[]) {
    const newKeys = new Set<string>();

    items.forEach((item) => {
      const key = getClusterKey(item);
      newKeys.add(key);
      clusterDataMap.set(key, item);

      const position = Cesium.Cartesian3.fromDegrees(
        item.lng,
        item.lat,
        item.isCluster ? 0 : (item.items[0]?.coordinates[2] ?? 0),
      );

      const existing = billboardMap.get(key);
      if (existing) {
        existing.position = position;
        return;
      }

      if (item.isCluster) {
        addClusterBillboard(key, item, position);
      } else {
        addPointBillboard(key, item, position);
      }
    });

    const keysToRemove: string[] = [];
    billboardMap.forEach((_, key) => {
      if (!newKeys.has(key)) keysToRemove.push(key);
    });
    keysToRemove.forEach((key) => {
      const bb = billboardMap.get(key);
      if (bb) billboardCollection.remove(bb);
      billboardMap.delete(key);

      const lb = labelMap.get(key);
      if (lb) labelCollection.remove(lb);
      labelMap.delete(key);

      clusterDataMap.delete(key);
    });

    let clusterCount = 0;
    let singleCount = 0;
    items.forEach((item) => {
      if (item.isCluster) clusterCount++;
      else singleCount++;
    });
    emits("clusterChange", clusterCount, singleCount);
  }

  function addClusterBillboard(
    key: string,
    item: ClusterResult,
    position: Cesium.Cartesian3,
  ) {
    const styleFn = props.clusterStyle ?? defaultClusterStyle;
    const style = styleFn(item.count, item.id);

    const circleSize = style.size ?? 36;
    const bw = style.outlineWidth ?? 0;
    const cssTotal = circleSize + bw * 2;

    let image: HTMLCanvasElement | string;
    let bbWidth: number | undefined;
    let bbHeight: number | undefined;

    if (style.iconUrl) {
      image = style.iconUrl;
      bbWidth = style.iconWidth;
      bbHeight = style.iconHeight;
    } else {
      image = drawCircleCanvas({
        color: style.color ?? "#3388ff",
        size: circleSize,
        outlineColor: style.outlineColor,
        outlineWidth: bw,
      });
      bbWidth = cssTotal;
      bbHeight = cssTotal;
    }

    const bb = billboardCollection.add({
      id: key,
      position,
      image,
      width: bbWidth,
      height: bbHeight,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      disableDepthTestDistance: props.disableDepthTestDistance,
    });
    billboardMap.set(key, bb);

    if (props.showClusterCount !== false) {
      const lb = labelCollection.add({
        id: key,
        position,
        text: String(item.count),
        font: `bold ${style.textSize ?? 14}px sans-serif`,
        fillColor: Cesium.Color.fromCssColorString(style.textColor ?? "#fff"),
        outlineColor: Cesium.Color.fromCssColorString("#000"),
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        disableDepthTestDistance: props.disableDepthTestDistance,
        eyeOffset: new Cesium.Cartesian3(0, 0, -1),
      });
      labelMap.set(key, lb);
    }
  }

  function addPointBillboard(
    key: string,
    item: ClusterResult,
    position: Cesium.Cartesian3,
  ) {
    const styleFn = props.pointStyle ?? defaultPointStyle;
    const style = styleFn(item.items[0]);

    const ptSize = style.size ?? 20;
    const bw = style.outlineWidth ?? 0;
    const cssTotal = ptSize + bw * 2;

    let image: HTMLCanvasElement | string;
    let bbWidth: number | undefined;
    let bbHeight: number | undefined;

    if (style.iconUrl) {
      image = style.iconUrl;
      bbWidth = style.iconWidth;
      bbHeight = style.iconHeight;
    } else {
      image = drawCircleCanvas({
        color: style.color ?? "#409EFF",
        size: ptSize,
        outlineColor: style.outlineColor,
        outlineWidth: bw,
      });
      bbWidth = cssTotal;
      bbHeight = cssTotal;
    }

    const bb = billboardCollection.add({
      id: key,
      position,
      image,
      width: bbWidth,
      height: bbHeight,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      disableDepthTestDistance: props.disableDepthTestDistance,
    });
    billboardMap.set(key, bb);

    if (style.text) {
      const lb = labelCollection.add({
        id: key,
        position,
        text: style.text,
        font: `${style.textSize ?? 14}px sans-serif`,
        fillColor: Cesium.Color.fromCssColorString(style.textColor ?? "#fff"),
        outlineColor: Cesium.Color.fromCssColorString("#000"),
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.TOP,
        pixelOffset: new Cesium.Cartesian2(0, ptSize / 2 + 4),
        disableDepthTestDistance: props.disableDepthTestDistance,
      });
      labelMap.set(key, lb);
    }
  }

  const handler = new Cesium.ScreenSpaceEventHandler(cesiumViewer.canvas);
  handler.setInputAction(
    (event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      cesiumViewer.scene
        .pickAsync(event.position)
        .then((picked: any) => {
          if (!picked) return;

          let key: string | undefined;
          if (typeof picked.id === "string") {
            key = picked.id;
          } else if (typeof picked.primitive?.id === "string") {
            key = picked.primitive.id;
          }
          if (!key) return;

          const data = clusterDataMap.get(key);
          if (!data) return;

          if (data.isCluster) {
            emits("clickCluster", {
              center: [data.lng, data.lat],
              count: data.count,
              items: data.items,
            });
            if (props.expandOnClick !== false) {
              expandCluster(data.id, data.lng, data.lat);
            }
          } else {
            emits("clickPoint", data.items[0]);
          }
        })
        .catch(() => {});
    },
    Cesium.ScreenSpaceEventType.LEFT_CLICK,
  );

  watch(clusters, (val) => renderClusters(val), { immediate: true });

  onBeforeUnmount(() => {
    handler.destroy();
    cesiumViewer.scene.primitives.remove(billboardCollection);
    cesiumViewer.scene.primitives.remove(labelCollection);
    billboardMap.clear();
    labelMap.clear();
    clusterDataMap.clear();
  });
}
