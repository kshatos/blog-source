#version 100
precision mediump float;
const float PI = 3.14159265359;

//////////////////////////////
// MAIN
//////////////////////////////
uniform sampler2D tex;
uniform float u_brightness;

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
    color = pow(color, vec3(2.2/1.0));
    color *= u_brightness; 

    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0/2.2)); 

    gl_FragColor = vec4(color, 1.0);
}