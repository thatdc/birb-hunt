#version 300 es

precision mediump float;

in vec3 fs_position;

uniform samplerCube u_skybox;

out vec4 out_color;

void main() {
    // Lookup the cube map for the color.
    // Since the camera sits in the origin
    // and fs_position is already in clip coordinates,
    // fs_position is the view direction
    out_color = texture(u_skybox, normalize(fs_position));
}