#version 300 es

// Vertex attributes
in vec3 a_position;
in vec3 a_normal;
in vec2 a_uv;

out vec2 uv_fs;
out vec3 fs_normal;

// Transformation matrices
uniform mat4 u_matrix; 
uniform mat4 u_NormalMatrix;     // matrix to transform normals

void main() {
  uv_fs = a_uv;
  fs_normal = mat3(n_matrix) * a_normal; 
  gl_Position = matrix * vec4(a_position, 1.0);
}