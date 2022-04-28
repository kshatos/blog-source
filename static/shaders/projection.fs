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
    vec3 direction = normalize(Pos);
    vec2 uv = vec2(0.0, 0.0);
    uv.x = (direction.x == 0.0) ? 0.0 : 0.5 * atan(-direction.z, direction.x) / PI;
    uv.x = (uv.x > 0.0) ? uv.x : uv.x + 1.0;
    uv.y = acos(-direction.y) / PI;
    uv.y = uv.y < 0.0 ? uv.y + 1.0 : uv.y;

    vec3 color = texture2D(tex, uv).rgb;
    gl_FragColor = vec4(color, 1.0);
}