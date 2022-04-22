#version 100
precision mediump float;
const float PI = 3.14159265359;

//////////////////////////////
// MAIN
//////////////////////////////
uniform sampler2D tex;
varying vec3 Pos;
varying vec3 Normal;
varying vec3 UV;


void main()
{
    vec3 normal = normalize(Normal);
    vec2 uv = vec2(0.0, 0.0);
    uv.x = 0.5 * atan(normal.x, normal.z) / PI;
    uv.x = (uv.x>0.0) ? uv.x : uv.x + 1.0;
    uv.y = 0.5 * (normal.y + 1.0);

    vec4 color = texture2D(tex, uv);
    gl_FragColor = vec4(color.xyz, 1.0);
}