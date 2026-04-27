// 只保留需要的颜色参数
uniform vec4 fadeInColor;  // 底部颜色（渐变起始颜色）
uniform vec4 fadeOutColor; // 顶部颜色（渐变结束颜色）

// Cesium 材质获取函数（标准接口）
czm_material czm_getMaterial(czm_materialInput materialInput)
{
    czm_material material = czm_getDefaultMaterial(materialInput);

    // 获取纹理坐标，其中 st.t 表示垂直方向（0=底部，1=顶部）
    vec2 st = materialInput.st;

    // 使用纹理坐标的 t 分量作为渐变因子（自下而上）
    // 注意：如果需要反向（自上而下），可以使用 1.0 - st.t
    float gradientFactor = st.t;

    // 根据渐变因子混合两种颜色
    vec4 color = mix(fadeInColor, fadeOutColor, gradientFactor);

    // 应用伽马校正确保颜色显示一致
    color = czm_gammaCorrect(color);

    // 设置材质属性
    material.emission = color.rgb;
    material.alpha = color.a;

    return material;
}
