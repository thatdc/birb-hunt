#version 300 es

// Vertex attributes
in vec2 a_position;

out vec3 fs_position;

uniform mat4 u_inverseViewProjectionMatrix;

void main() {
    // Transform the position from clip space to world space
    vec4 pos = u_inverseViewProjectionMatrix * vec4(a_position.xy, 1, 1);
    fs_position = pos.xyz;
    // Set z = 1 to place the skybox as far as possible
    gl_Position = vec4(a_position.xy, 1, 1);
}