uniform vec4 color;
uniform vec4 gapColor;
uniform float dashLength;
uniform float dashPattern;
uniform vec4 outlineColor;
uniform float outlineWidth;

in float v_width;
in float v_polylineAngle;

const float maskLength = 16.0;

mat2 rotate(float rad) {
    float c = cos(rad);
    float s = sin(rad);
    return mat2(
    c, s,
    -s, c
    );
}

czm_material czm_getMaterial(czm_materialInput materialInput)
{
    czm_material material = czm_getDefaultMaterial(materialInput);

    vec2 st = materialInput.st;

    vec2 pos = rotate(v_polylineAngle) * gl_FragCoord.xy;

    // Get the relative position within the dash from 0 to 1
    float dashPosition = fract(pos.x / (dashLength * czm_pixelRatio));
    // Figure out the mask index.
    float maskIndex = floor(dashPosition * maskLength);
    // Test the bit mask.
    float maskTest = floor(dashPattern / pow(2.0, maskIndex));

    float halfInteriorWidth =  0.5 * (v_width - outlineWidth * 2.0) / v_width;
    float b = step(0.5 - halfInteriorWidth, st.t);
    b *= 1.0 - step(0.5 + halfInteriorWidth, st.t);

    // Find the distance from the closest separator (region between two colors)
    float d1 = abs(st.t - (0.5 - halfInteriorWidth));
    float d2 = abs(st.t - (0.5 + halfInteriorWidth));
    float dist = min(d1, d2);

    vec4 currentColor = mix(outlineColor, color, b);

    vec4 fragColor = (mod(maskTest, 2.0) < 1.0) ? gapColor : currentColor;


    if (fragColor.a < 0.09) {   // matches 0/255 and 1/255
        discard;
    }


    fragColor = czm_gammaCorrect(fragColor);
    material.emission = fragColor.rgb;
    material.alpha = fragColor.a;
    return material;
}
