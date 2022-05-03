#version 100
precision mediump float;
const float PI = 3.14159265359;

uniform sampler2D u_EnvironmentTexture;

varying vec3 v_Position;
varying vec3 v_Normal;
varying vec2 v_UV;


vec3 calculateNormal(float theta, float phi)
{
    float cosTheta = cos(theta);
    float sinTheta = sin(theta);
    float cosPhi = cos(phi);
    float sinPhi = sin(phi);

    return vec3(
        cosTheta * sinPhi,
        sinTheta * sinPhi,
        cosPhi
    );
}

void main()
{
    vec3 normal = calculateNormal(v_UV.x * 2.0 * PI, v_UV.y * PI);

    vec3 irradiance = vec3(0.0);
    const float nXSamples = 100.0;
    const float nYSamples = 100.0;
    for(float i=0.0; i < nXSamples; i += 1.0)
    {
        float u = i / (nXSamples - 1.0);
        float theta = 2.0 * PI * u;
        for(float j=0.0; j < nYSamples; j+=1.0)
        {
            float v = j / (nYSamples - 1.0);
            float phi = PI * v;

            vec3 light = calculateNormal(theta, phi);

            float cosNL = dot(light, normal);
            cosNL = cosNL > 0.0 ? cosNL : 0.0;

            vec2 sampleUV = vec2(u, v);
            vec3 sample = texture2D(u_EnvironmentTexture, sampleUV).rgb;
            irradiance +=  vec3(1.0) * sample * cosNL * sin(phi);
        }
    }
    irradiance = PI * irradiance * (1.0 / (nXSamples * nYSamples));

    gl_FragColor = vec4(irradiance, 1.0);
}