#version 300 es

precision mediump float;

// Vertex attributes
in vec3 a_position;
in vec3 a_normal;
in vec2 a_uv;

out vec2 fs_uv;
out vec3 fs_normal;

// Transformation matrices
uniform mat4 u_matrix;

void main() {
  fs_uv = a_uv;
  fs_normal = a_normal; 
  gl_Position = u_matrix * vec4(a_position, 1.0);
}