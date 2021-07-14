#version 300 es

// Vertex attributes
in vec3 a_position;

// Transformation matrices
uniform mat4 u_matrix; 

void main() {
  gl_Position = u_matrix * vec4(a_position, 1.0);
}