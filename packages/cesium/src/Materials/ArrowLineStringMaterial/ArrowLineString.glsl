uniform vec4 color;
uniform float outlineWidth;
uniform vec4 outlineColor;
uniform sampler2D image;
uniform float progress;
uniform vec4 progressColor;

in float v_polylineAngle;
in float v_width;

const float maskLength = 16.0;

mat2 rotate(float rad) {
    float c = cos(rad);
    float s = sin(rad);
    return mat2(
    c, s,
    -s, c
    );
}


czm_material czm_getMaterial(czm_materialInput materialInput) {
    czm_material material = czm_getDefaultMaterial(materialInput);
    vec2 st = materialInput.st;

    // 计算屏幕空间位置（考虑旋转）‌
    vec2 screenPos = rotate(v_polylineAngle) * gl_FragCoord.xy;

    float width = v_width * 1.5;
    float dashLength = width * 3.0;

    // 根据st.s值混合蓝色和传入的颜色，当st.s < progress时使用纯蓝色progressColor，否则使用传入的color
    vec4 colorProgress = mix(progressColor, color, step(progress, st.s));

    // 判断当前像素是否在虚线范围内：
    // mod计算屏幕x坐标在虚线周期中的位置，step判断是否小于虚线宽度
    // 结果isDash为1表示在虚线范围内，0表示在间隔范围内
    float isDash = step(mod(screenPos.x, dashLength), width);

    // 计算纹理坐标的s分量，用于采样箭头纹理
    // fract取小数部分使纹理在虚线范围内重复
    float s = fract(screenPos.x / width);

    // 从纹理图像中采样颜色，使用计算出的s坐标和传入的t坐标
    vec4 colorImage = texture(image, vec2(s, st.t));

    // 判断是否使用纹理颜色：
    // 当纹理alpha值<0.8时useImage=1(使用colorProgress)，否则=0(使用纹理颜色)
    float useImage = step(colorImage.a, 0.8);

    // 最终颜色混合：

    // 内层mix：根据useImage选择使用纹理颜色还是colorProgress
    // 外层mix：根据isDash选择使用虚线颜色还是间隔颜色
    vec4 fragColor = mix(colorProgress, mix(colorImage, colorProgress, useImage), isDash);


    // 原有颜色混合逻辑（保持原样）
    float halfInteriorWidth = 0.5 * (v_width - outlineWidth * 2.0) / v_width;
    float b = step(0.5 - halfInteriorWidth, st.t) * (1.0 - step(0.5 + halfInteriorWidth, st.t));

    vec4 currentColor = mix(outlineColor, fragColor, b);
    vec4 outColor = czm_antialias(outlineColor, fragColor, currentColor, min(abs(st.t - (0.5 - halfInteriorWidth)), abs(st.t - (0.5 + halfInteriorWidth))));
    material.diffuse = outColor.rgb;
    material.alpha = outColor.a;
    return material;
}
