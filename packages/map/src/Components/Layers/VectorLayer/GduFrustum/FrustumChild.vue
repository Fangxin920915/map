<template>
  <slot />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from "vue";
import * as Cesium from "cesium";
import { mapViewInternal } from "@gdu-gl/core";
import {
  createDashLine,
  isValidCoordinates,
  PointCoordinates,
  uuid,
} from "@gdu-gl/common";
import { sum } from "lodash-es";
import { VectorFrustumProps, defaultVectorFrustumProps } from "./props";

const props = withDefaults(defineProps<VectorFrustumProps>(), {
  ...defaultVectorFrustumProps,
});

const viewer = mapViewInternal.getViewer(props.viewId as string)
  ?.mapProviderDelegate.map;

const id = uuid();

const frustum = new Cesium.PerspectiveFrustum({
  fov: Cesium.Math.toRadians(props.fov),
  aspectRatio: props.aspectRatio,
  near: props.near,
  far: props.far,
});

let frustumPrimitive: Cesium.Primitive | null = null;

let frustumOutlinePrimitive: Cesium.Primitive | null = null;

let centerLinePrimitive: Cesium.Primitive | null = null;

let postRenderRemove: Cesium.Event.RemoveCallback | null = null;

const frustumColorCollection: string[] = [];
const frustumOutlineColorCollection: string[] = [];
const centerLineColorCollection: string[] = [];

watch(
  [
    () => props.aspectRatio,
    () => props.fov,
    () => props.near,
    () => props.far,
    () => props.centerLineWidth,
  ],
  () => {
    removeGeometry();
    frustum.far = props.far;
    frustum.fov = Cesium.Math.toRadians(props.fov);
    frustum.near = props.near;
    frustum.aspectRatio = props.aspectRatio;
    createGeometry();
  },
);

watch(
  [
    () => props.coordinates?.toString(),
    () => props.heading,
    () => props.pitch,
    () => props.roll,
    () => props.color,
    () => props.outlineColor,
    () => props.centerLineColor,
    () => props.visible,
  ],
  (
    [
      coordinatesStr,
      heading,
      pitch,
      roll,
      color,
      outlineColor,
      centerLineColor,
      visible,
    ],
    [
      coordinatesStrOld,
      headingOld,
      pitchOld,
      rollOld,
      colorOld,
      outlineColorOld,
      centerLineColorOld,
      visibleOld,
    ],
  ) => {
    if (
      coordinatesStr !== coordinatesStrOld ||
      heading !== headingOld ||
      pitch !== pitchOld ||
      roll !== rollOld ||
      visible !== visibleOld
    ) {
      setHeadingPitchRoll();
    }
    if (color !== colorOld) {
      frustumColorCollection.push(color);
    }
    if (outlineColor !== outlineColorOld) {
      frustumOutlineColorCollection.push(outlineColor);
    }
    if (centerLineColor !== centerLineColorOld) {
      centerLineColorCollection.push(centerLineColor);
    }
  },
);

onMounted(() => {
  createGeometry();
});

onBeforeUnmount(() => {
  removeGeometry();
  frustumColorCollection.length = 0;
  frustumOutlineColorCollection.length = 0;
  centerLineColorCollection.length = 0;
});

function removeGeometry() {
  if (postRenderRemove) {
    postRenderRemove();
    postRenderRemove = null;
  }
  if (frustumPrimitive) {
    viewer?.scene.primitives.remove(frustumPrimitive);
    frustumPrimitive = null;
  }
  if (frustumOutlinePrimitive) {
    viewer?.scene.primitives.remove(frustumOutlinePrimitive);
    frustumOutlinePrimitive = null;
  }

  if (centerLinePrimitive) {
    viewer?.scene.primitives.remove(centerLinePrimitive);
    centerLinePrimitive = null;
  }
}

function createGeometry() {
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(
    Cesium.Cartesian3.ZERO,
    new Cesium.HeadingPitchRoll(
      Cesium.Math.toRadians(0),
      Cesium.Math.toRadians(0),
      Cesium.Math.toRadians(0),
    ),
  );

  const frustumGeometry = new Cesium.FrustumGeometry({
    frustum,
    origin: Cesium.Cartesian3.ZERO,
    orientation,
    vertexFormat: Cesium.VertexFormat.POSITION_ONLY,
  });

  const frustumOutlineGeometry = new Cesium.FrustumOutlineGeometry({
    frustum,
    origin: Cesium.Cartesian3.ZERO,
    orientation,
  });

  const lineGeometry = new Cesium.PolylineGeometry({
    positions: [
      new Cesium.Cartesian3(0, 0, props.near),
      new Cesium.Cartesian3(0, 0, props.far),
    ],
    width: props.centerLineWidth,
    arcType: Cesium.ArcType.NONE,
  });

  const frustumGeometryInstance = new Cesium.GeometryInstance({
    geometry: frustumGeometry,
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(
        Cesium.Color.fromCssColorString(props.color),
      ),
    },
    id: `${id}`,
  });

  const frustumOutlineGeometryInstance = new Cesium.GeometryInstance({
    geometry: frustumOutlineGeometry,
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(
        Cesium.Color.fromCssColorString(props.outlineColor),
      ),
    },
    id: `${id}-outline`,
  });

  const centerLineGeometryInstance = new Cesium.GeometryInstance({
    geometry: lineGeometry,
    id: `${id}-line`,
  });

  frustumPrimitive = viewer?.scene.primitives.add(
    new Cesium.Primitive({
      show: props.visible,
      allowPicking: false,
      asynchronous: false,
      geometryInstances: frustumGeometryInstance,
      appearance: new Cesium.PerInstanceColorAppearance({
        closed: true,
        flat: true,
      }),
    }),
  );

  frustumOutlinePrimitive = viewer?.scene.primitives.add(
    new Cesium.Primitive({
      show: props.visible,
      allowPicking: false,
      asynchronous: false,
      geometryInstances: frustumOutlineGeometryInstance,
      appearance: new Cesium.PerInstanceColorAppearance({
        flat: true,
      }),
    }),
  );
  const lineDash = [10, 5];
  centerLinePrimitive = viewer?.scene.primitives.add(
    new Cesium.Primitive({
      show: props.visible,
      allowPicking: false,
      asynchronous: false,
      geometryInstances: centerLineGeometryInstance,
      appearance: new Cesium.PolylineMaterialAppearance({
        material: Cesium.Material.fromType("PolylineDashArrow", {
          color: Cesium.Color.fromCssColorString(props.centerLineColor),
          dashLength: sum(lineDash),
          dashPattern: createDashLine(lineDash),
        }),
      }),
    }),
  );
  setHeadingPitchRoll();
  addListener();
}

function setHeadingPitchRoll() {
  let position: PointCoordinates;
  let show: boolean;
  try {
    show = true;
    position = isValidCoordinates(props.coordinates);
  } catch {
    show = false;
    position = [0, 0, 0];
  }
  const [lon, lat, alt] = position;
  const positionOnEllipsoid = Cesium.Cartesian3.fromDegrees(lon, lat, alt);
  const rotationMatrix4 = Cesium.Transforms.headingPitchRollToFixedFrame(
    positionOnEllipsoid,
    new Cesium.HeadingPitchRoll(
      Cesium.Math.toRadians(Number(props.heading) - 90),
      Cesium.Math.toRadians(Number(props.pitch) - 90),
      Cesium.Math.toRadians(props.roll),
    ),
  );

  if (frustumPrimitive) {
    frustumPrimitive.modelMatrix = rotationMatrix4;
    frustumPrimitive.show = show && props.visible;
  }
  if (frustumOutlinePrimitive) {
    frustumOutlinePrimitive.modelMatrix = rotationMatrix4;
    frustumOutlinePrimitive.show = show && props.visible;
  }

  if (centerLinePrimitive) {
    centerLinePrimitive.modelMatrix = rotationMatrix4;
    centerLinePrimitive.show = show && props.visible;
  }
}

function addListener() {
  postRenderRemove = viewer.scene.postRender.addEventListener(() => {
    if (frustumPrimitive?.ready && frustumColorCollection.length > 0) {
      const lastColor =
        frustumColorCollection[frustumColorCollection.length - 1];
      const frustumAttributes =
        frustumPrimitive.getGeometryInstanceAttributes(id);
      frustumAttributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(
        Cesium.Color.fromCssColorString(lastColor),
        frustumAttributes.color,
      );
      frustumColorCollection.length = 0;
    }

    if (
      frustumOutlinePrimitive?.ready &&
      frustumOutlineColorCollection.length > 0
    ) {
      const lastColor =
        frustumOutlineColorCollection[frustumOutlineColorCollection.length - 1];
      const frustumOutlineAttributes =
        frustumOutlinePrimitive.getGeometryInstanceAttributes(`${id}-outline`);
      frustumOutlineAttributes.color =
        Cesium.ColorGeometryInstanceAttribute.toValue(
          Cesium.Color.fromCssColorString(lastColor),
          frustumOutlineAttributes.color,
        );
      frustumOutlineColorCollection.length = 0;
    }

    if (centerLinePrimitive?.ready && centerLineColorCollection.length > 0) {
      const lastColor =
        centerLineColorCollection[centerLineColorCollection.length - 1];
      centerLinePrimitive.appearance.material.uniforms.color =
        Cesium.Color.fromCssColorString(lastColor);
      centerLineColorCollection.length = 0;
    }
  });
}
</script>
