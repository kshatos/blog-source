#version 100
precision mediump float;
const float PI = 3.14159265359;

//////////////////////////////
// MAIN
//////////////////////////////
uniform sampler2D tex;
varying vec3 Pos;
varying vec3 Normal;


void main()
{
    vec2 UV = vec2(0.0, 0.0);
    UV.x = 0.5 * atan(Normal.x, -Normal.z) / PI;
    UV.x = (UV.x>0.0) ? UV.x : UV.x + 1.0;
    UV.y = 0.5 * (-Normal.y + 1.0);

    vec4 color = texture2D(tex, UV);
    gl_FragColor = vec4(color.xyz, 1.0);
}