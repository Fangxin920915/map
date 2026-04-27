import { computed, ref } from "vue";
import {
  altitudeAccuracy,
  LineStringCoordinates,
  MouseEventParams,
  PointCoordinates,
  PolygonCoordinates,
} from "@gdu-gl/common";
import * as turf from "@turf/turf";
import { DrawCircleToolEmits } from "../props";

export function useDrawEvent(emits: DrawCircleToolEmits) {
  const drawing = ref(false);

  const hover = ref(-1);

  const points = ref<LineStringCoordinates>([]);

  const radius = computed(() => {
    if (points.value.length < 2) {
      return 0;
    }
    const [start, end] = points.value;
    return turf.distance(start as number[], end as number[]);
  });

  const centerText = computed(() => {
    if (points.value.length < 2) {
      return null;
    }
    const [start, end] = points.value;
    return {
      point: turf.midpoint(start as number[], end as number[]).geometry
        .coordinates as PointCoordinates,
      text:
        radius.value < 1
          ? `${altitudeAccuracy(radius.value * 1000)}m`
          : `${altitudeAccuracy(radius.value)}km`,
    };
  });

  const circlePolygon = computed(() => {
    if (points.value.length < 2) {
      return [] as PolygonCoordinates;
    }
    const [center] = points.value;
    return turf.circle(center as number[], radius.value, {
      steps: 48,
    }).geometry.coordinates as PolygonCoordinates;
  });

  function mouseClick(params: MouseEventParams) {
    if (points.value.length >= 2 || !params.coordinates || !drawing.value) {
      return;
    }
    points.value.push(params.coordinates, params.coordinates);
    hover.value = 1;
  }

  function mouseMove(params: MouseEventParams) {
    if (points.value.length < 2 || !params.coordinates || !drawing.value) {
      return;
    }
    points.value[1] = params.coordinates;
    hover.value = 1;
  }

  function startDraw() {
    drawing.value = true;
    points.value = [];
    hover.value = -1;
    emits("start");
  }

  function cancelDraw() {
    if (drawing.value) {
      emits("cancel");
    }
    drawing.value = false;
    hover.value = -1;
    points.value = [];
  }

  function finishDraw() {
    const [center] = points.value;
    emits("finish", center, radius.value);
    drawing.value = false;
    points.value = [];
    hover.value = -1;
  }

  return {
    centerText,
    points,
    drawing,
    circlePolygon,
    startDraw,
    cancelDraw,
    finishDraw,
    mouseClick,
    mouseMove,
    hover,
    radius,
  };
}
