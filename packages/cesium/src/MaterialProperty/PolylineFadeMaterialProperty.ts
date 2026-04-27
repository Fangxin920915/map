import * as Cesium from "cesium";

export default class PolylineFadeMaterialProperty {
  // @ts-ignore
  color: any = Cesium.createPropertyDescriptor("color");

  // @ts-ignore
  fadeThreshold: any = Cesium.createPropertyDescriptor("color");

  definitionChanged: Cesium.Event;

  constructor(options: { color: any; fadeThreshold: any }) {
    // 初始化属性
    this.color = options.color;
    this.fadeThreshold = options.fadeThreshold;
    this.definitionChanged = new Cesium.Event();
  }

  /**
   * 获取材质类型
   */
  getType(): string {
    return "PolylineFade";
  }

  /**
   * 获取指定时间的材质值
   */
  getValue(time: Cesium.JulianDate, result: any): Cesium.Material {
    if (!Cesium.defined(result)) {
      result = {};
    }

    // @ts-ignore
    result.color = Cesium.Property.getValueOrClonedDefault(
      this.color,
      time,
      Cesium.Color.YELLOW,
      result.color,
    );

    // @ts-ignore
    result.fadeThreshold = Cesium.Property.getValueOrDefault(
      this.fadeThreshold,
      time,
      0.5,
      result.taperPower,
    );

    return result;
  }

  /**
   * 检查此属性是否为常量
   * @returns {boolean} 是否为常量
   */
  // @ts-ignore
  get isConstant(): boolean {
    const Property = Cesium.Property as any;
    return !!(
      Property.isConstant(this.color) && Property.isConstant(this.fadeThreshold)
    );
  }

  equals(other: any) {
    const Property = Cesium.Property as any;
    return (
      this === other ||
      (other instanceof PolylineFadeMaterialProperty &&
        Property.equals(this.color, other.color) &&
        Property.equals(this.fadeThreshold, other.fadeThreshold))
    );
  }
}
