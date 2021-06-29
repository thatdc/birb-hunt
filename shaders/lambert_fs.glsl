#version 300 es

precision mediump float;

in vec2 fs_uv;
in vec3 fs_normal;
out vec4 gl_color;

// Flags
uniform bool b_useMapDiffuse;
uniform bool b_useMapNormal;

// Material colors
uniform vec3 u_ambient;
uniform vec3 u_diffuse;
uniform vec3 u_specular;

// Specular info
// uniform float u_refractionIndex;
uniform float u_specularExponent;

// Maps
uniform sampler2D u_mapDiffuse;
uniform sampler2D u_mapNormal;
uniform sampler2D u_mapSpecular;

// Lights
uniform vec3 u_lightDirection; // directional light direction vec
uniform vec3 u_lightColor; //directional light color 

void main() {
  vec3 n_normal = normalize(b_useMapNormal ? vec3(texture(u_mapNormal, fs_uv)) : fs_normal);
  vec3 diffuseColor = b_useMapDiffuse ? vec3(texture(u_mapDiffuse, fs_uv)) : u_diffuse;
  vec3 lambertColor = diffuseColor * u_lightColor * dot(-u_lightDirection, n_normal);
  gl_color = vec4(clamp(lambertColor, 0.00, 1.0), 1.0);
}