// 只保留需要的颜色参数
uniform vec4 color;  // 底部颜色（渐变起始颜色）
uniform float fadeThreshold; // 顶部颜色（渐变结束颜色）

// Cesium 材质获取函数（标准接口）
czm_material czm_getMaterial(czm_materialInput materialInput)
{
    czm_material material = czm_getDefaultMaterial(materialInput);

    // 获取纹理坐标，其中 st.t 表示垂直方向（0=底部，1=顶部）
    vec2 st = materialInput.st;

    float gradientFactor = 1.0 - st.s;

    // 计算渐变因子：在 fadeStart 到 fadeEnd 之间平滑过渡
    // smoothstep 函数会创建一个从 0 到 1 的平滑过渡曲线
    float fadeFactor = smoothstep(fadeThreshold, 1.0, gradientFactor);

    // 根据渐变因子混合两种颜色
    vec4 color = mix(color, vec4(1.0, 1.0, 1.0, 0.0), fadeFactor);

    // 应用伽马校正确保颜色显示一致
    color = czm_gammaCorrect(color);

    // 设置材质属性
    material.emission = color.rgb;
    material.alpha = color.a;

    return material;
}
