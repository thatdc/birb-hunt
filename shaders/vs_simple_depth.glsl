#version 330 es
layout (location = 0) in vec3 a_position;

uniform mat4 u_light_space_matrix;
uniform mat4 u_matrix;

void main()
{
    gl_Position = u_light_space_matrix * u_matrix * vec4(a_position, 1.0);
} 