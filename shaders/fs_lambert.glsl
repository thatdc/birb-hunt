#version 300 es

#define AMBIENT_LIGHT_STRENGTH .1
#define N_DIRECTIONAL_LIGHTS 1

precision mediump float;

in vec2 fs_uv;
in vec3 fs_normal;
out vec4 out_color;

// Flags
uniform bool b_useMapDiffuse;
uniform bool b_useMapNormal;
uniform bool b_useMapSpecular;

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
uniform samplerCube u_mapEnv;

// Ambient light
// In this shadera ambient lighting is based on the env-map

// Directional lights
struct directionalLight {
  vec3 direction;
  vec3 color;
};
uniform directionalLight u_directionalLights[N_DIRECTIONAL_LIGHTS];

void main() {
  // Get the normal (from map or varying)
  vec3 n_normal = normalize(b_useMapNormal ? vec3(texture(u_mapNormal, fs_uv)) : fs_normal);
  // Get the diffuse color (from map or material)
  vec3 diffuseColor = b_useMapDiffuse ? vec3(texture(u_mapDiffuse, fs_uv)) : u_diffuse;

  // Calculate the final color
  vec3 color = vec3(0, 0, 0);
  // Ambient light
  color += u_ambient * vec3(textureLod(u_mapEnv, n_normal, 8.)) * AMBIENT_LIGHT_STRENGTH;

  // Directional lights
  for(int i = 0; i < N_DIRECTIONAL_LIGHTS; i++) {
    directionalLight l = u_directionalLights[i];
    color += diffuseColor * l.color * dot(-l.direction, n_normal);
  }

  // Clamp the color and add the alpha component
  out_color = vec4(clamp(color, 0., 1.), 1.);
}