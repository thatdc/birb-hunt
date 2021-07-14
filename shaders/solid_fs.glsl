#version 300 es

// Renders a flat color object with no lighting

precision mediump float;

out vec4 out_color;

// Material colors
uniform vec3 u_diffuse;

void main() {
  // Clamp the color and add the alpha component
  out_color = vec4(clamp(u_diffuse, 0., 1.), 1.);
}