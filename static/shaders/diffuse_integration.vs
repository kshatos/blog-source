#version 100

attribute vec3 a_Position;
attribute vec3 a_Normal;
attribute vec2 a_UV;

varying vec2 v_UV;


void main()
{
    gl_Position = vec4(a_Position, 1.0);
}