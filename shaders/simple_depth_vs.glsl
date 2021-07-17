#version 300 es

precision mediump float;

in vec3 a_position;

uniform mat4 u_matrix;

void main() {
    gl_Position = u_matrix * vec4(a_position, 1.0);
}