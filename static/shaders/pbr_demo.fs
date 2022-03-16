#version 100
precision mediump float;

varying vec3 Pos;
varying vec3 Normal;


void main()
{
    vec3 color = vec3(1.0, 0.0, 0.5);
    float brightness = dot(Normal, vec3(0.0, 0.0, 1.0));
    vec3 x = 0.5 * (Normal + 1.0);
    gl_FragColor = vec4(x, 1.0);
}