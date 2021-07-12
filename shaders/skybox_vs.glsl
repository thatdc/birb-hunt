#version 300 es

// Vertex attributes
in vec2 a_position;

out vec3 fs_position;

uniform mat4 u_cameraMatrix;

void main() {
    // Transform the position according to the camera matrix
    vec4 pos = u_cameraMatrix * vec4(a_position.xy, 1, 0);
    fs_position = pos.xyz;
    // Set z = 1 to place the skybox as far as possible
    gl_Position = vec4(a_position.xy, 1, 1);
}