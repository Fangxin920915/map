import * as Cesium from "cesium";
import {
  AppearanceProperties,
  AppearanceType,
  Feature,
  MaterialType,
  PrimitiveProperties,
  SymbolProperties,
  CanvasDrawer,
  GeometryProperties,
} from "@gdu-gl/common";

const APPEARANCE_CONSTRUCTOR_MAP: Map<string, any> = new Map<string, any>([
  ["MaterialAppearance", Cesium.MaterialAppearance],
  ["PerInstanceColorAppearance", Cesium.PerInstanceColorAppearance],
  ["PolylineMaterialAppearance", Cesium.PolylineMaterialAppearance],
]);
export default class GeometryParamsTransform {
  static createPointGeometry(
    feature: Feature,
  ): Cesium.Cartesian3[] | undefined {
    const { appearance } = feature.properties;
    const geometryType = feature.geometry.type;
    if (geometryType === "Point" || geometryType === "GroundPoint") {
      const [lon, lat, h] = feature.geometry.coordinates;
      return [
        Cesium.Cartesian3.fromDegrees(
          // @ts-ignore
          lon,
          lat,
          appearance?.symbolProperties?.clampToGround ? undefined : h,
        ),
      ];
    }
    if (geometryType === "Popup") {
      const [lon, lat, h] = feature.geometry.coordinates;
      return [
        Cesium.Cartesian3.fromDegrees(
          // @ts-ignore
          lon,
          lat,
          appearance?.popUpProperties?.clampToGround ? undefined : h,
        ),
      ];
    }
    if (geometryType === "MultiPoint" || geometryType === "GroundMultiPoint") {
      // @ts-ignore
      return feature.geometry.coordinates.map((v) =>
        // @ts-ignore
        Cesium.Cartesian3.fromDegrees(
          // @ts-ignore
          v[0],
          // @ts-ignore
          v[1],
          // @ts-ignore
          appearance?.symbolProperties?.clampToGround ? undefined : v[2],
        ),
      );
    }
    return undefined;
  }

  static createWallGeometry(feature: Feature): Cesium.Cartesian3[] | undefined {
    const geometryType = feature.geometry.type;
    if (geometryType === "Wall") {
      // @ts-ignore
      return feature.geometry.coordinates.map((v) =>
        // @ts-ignore
        Cesium.Cartesian3.fromDegrees(v[0], v[1]),
      );
    }
    return undefined;
  }

  static createPointCanvas(symbolProperties: SymbolProperties) {
    return CanvasDrawer.draw(symbolProperties);
  }

  static createLineStringGeometry(
    feature: Feature,
  ): Cesium.Cartesian3[][] | undefined {
    const geometryType = feature.geometry.type;
    if (geometryType === "LineString" || geometryType === "GroundLineString") {
      // @ts-ignore
      return [
        feature.geometry.coordinates.map((v) =>
          // @ts-ignore
          Cesium.Cartesian3.fromDegrees(v[0], v[1], v[2]),
        ),
      ];
    }
    if (
      geometryType === "MultiLineString" ||
      geometryType === "GroundMultiLineString"
    ) {
      // @ts-ignore
      return feature.geometry.coordinates.map((f) =>
        // @ts-ignore
        f.map((v) => Cesium.Cartesian3.fromDegrees(v[0], v[1], v[2])),
      );
    }
    return undefined;
  }

  static createGroundLineStringPrimitive(
    instances: Cesium.GeometryInstance[],
    appearance: Cesium.Appearance,
    primitiveProperties?: PrimitiveProperties,
  ): Cesium.GroundPolylinePrimitive {
    return new Cesium.GroundPolylinePrimitive({
      geometryInstances: instances,
      appearance,
      ...primitiveProperties,
    });
  }

  static createLineStringPrimitive(
    instances: Cesium.GeometryInstance[],
    appearance: Cesium.Appearance,
    primitiveProperties?: PrimitiveProperties,
  ): Cesium.Primitive {
    // if (appearance && appearance.material) {
    //   appearance.material.isTranslucent = () => true;
    // }
    return new Cesium.Primitive({
      geometryInstances: instances,
      appearance,
      ...primitiveProperties,
    });
  }

  static createGroundPrimitive(
    instances: Cesium.GeometryInstance[],
    appearance: Cesium.Appearance,
    primitiveProperties?: PrimitiveProperties,
  ): Cesium.GroundPrimitive {
    return new Cesium.GroundPrimitive({
      geometryInstances: instances,
      appearance,
      ...primitiveProperties,
    });
  }

  /**
   * 转换参数为cesium类型对象
   */
  static transformParma(properties: any): any {
    const param = {} as any;
    // @ts-ignore
    // eslint-disable-next-line no-restricted-syntax
    for (const key in properties) {
      if (Object.prototype.hasOwnProperty.call(properties, key)) {
        const element = properties[key];
        if (
          key.toLowerCase().includes("color") &&
          typeof element === "string"
        ) {
          param[key] = Cesium.Color.fromCssColorString(element);
        } else if (Array.isArray(element) && element.length === 2) {
          param[key] = new Cesium.Cartesian2(...element);
        } else if (Array.isArray(element) && element.length === 3) {
          param[key] = new Cesium.Cartesian3(...element);
        } else {
          param[key] = element;
        }
      }
    }
    return param;
  }

  /**
   * 创建材质对象
   * @param materialType 材质类型
   * @param materialProperties 材质属性
   * @returns Cesium.Material 材质对象
   */
  static createMaterial(
    materialType: MaterialType,
    materialProperties: any,
  ): Cesium.Material {
    const param = GeometryParamsTransform.transformParma(materialProperties);
    return Cesium.Material.fromType(materialType, {
      ...param,
    });
  }

  /**
   * 创建材质id
   * @param material Cesium.Material 材质对象
   * @param properties
   * @returns string 通过uniform属性拼接成的字符串id
   */
  static createMaterialId(
    material: Cesium.Material,
    properties: GeometryProperties & Record<string, any>,
  ) {
    const {
      appearanceType = "MaterialAppearance",
      lineStringProperties,
      primitiveProperties,
    } = properties;
    const scratchUniformArray = [];
    const replacer = (_key: any, value: { id: any }) => {
      // @ts-ignore
      if (value instanceof Cesium.Texture) {
        return value.id;
      }

      return value;
    };
    // @ts-ignore
    const uniforms = Cesium.Material._uniformList[material.type];
    const { length } = uniforms;
    scratchUniformArray.length = 2.0 * length;
    let index = 0;
    for (let i = 0; i < length; ++i) {
      const uniform = uniforms[i];
      scratchUniformArray[index] = uniform;
      // @ts-ignore
      scratchUniformArray[index + 1] = material._uniforms[uniform]();
      index += 2;
    }
    let materialId = `${appearanceType}:${material.type}:${JSON.stringify(scratchUniformArray, replacer)}`;
    if (lineStringProperties) {
      materialId += `${lineStringProperties.loop ? "loop" : "unloop"}`;
      materialId += `${lineStringProperties.width ? "width" : "noWidth"}`;
    }
    if (primitiveProperties) {
      materialId += `${primitiveProperties.allowPicking ? "allowPicking" : "unAllowPicking"}`;
    }
    return materialId;
  }

  // /**
  //  * 转换笛卡尔坐标
  //  * @param coordinates 要素坐标
  //  * @returns 笛卡尔坐标类集合
  //  */
  // static createPositions(coordinates:Coordinates):Array<Cesium.Cartesian3>{
  //     return coordinates.map(item => item.map( v=> Cesium.Cartesian3.fromDegrees(...(v as [number, number, number?]))))
  // }
  /**
   * 创建外观对象
   * @param appearanceType 外观类型
   * @param material Cesium材质对象
   * @param appearanceProperties 外观属性
   * @returns appearance构造函数
   */
  static createAppearance(
    appearanceType: AppearanceType,
    material: Cesium.Material,
    appearanceProperties?: AppearanceProperties,
  ) {
    const AppearanceConstructor =
      APPEARANCE_CONSTRUCTOR_MAP.get(appearanceType);
    return new AppearanceConstructor({
      material,
      ...appearanceProperties,
    });
  }

  /**
   * 创建primitive图元
   * @param geometryInstances
   * @param appearance
   * @param primitiveProperties
   * @returns
   */
  static createPrimitive(
    geometryInstances: Array<Cesium.GeometryInstance>,
    appearance: Cesium.Appearance,
    primitiveProperties?: PrimitiveProperties,
  ) {
    return new Cesium.Primitive({
      geometryInstances,
      appearance,
      ...primitiveProperties,
    });
  }

  static createModelMatrix(
    translate: [number, number, number?] = [0, 0, 0],
    rotate: [number, number, number] = [0, 0, 0],
    scale: [number, number, number] = [1, 1, 1],
  ): Cesium.Matrix4 {
    const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromDegrees(...translate),
    );
    const [heading = 0, pitch = 0, roll = 0] = rotate;
    const rotation = Cesium.Matrix3.fromHeadingPitchRoll(
      new Cesium.HeadingPitchRoll(heading, -pitch, roll),
    );
    const scaleMatrix = Cesium.Matrix3.fromScale(
      new Cesium.Cartesian3(...scale),
    );
    const result = Cesium.Matrix4.multiplyByMatrix3(
      modelMatrix,
      rotation,
      modelMatrix,
    );
    return Cesium.Matrix4.multiplyByMatrix3(result, scaleMatrix, modelMatrix);
  }
}
