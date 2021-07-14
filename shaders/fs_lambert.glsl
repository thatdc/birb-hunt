#version 300 es

#define AMBIENT_LIGHT_STRENGTH .1
#define N_DIRECTIONAL_LIGHTS 1

precision mediump float;

in vec2 fs_uv;
in vec3 fs_normal;
out vec4 out_color;

// Transformation matrices
uniform mat3 u_normalMatrix;

// Flags
uniform bool b_useMapDiffuse;
uniform bool b_useMapNormal;
uniform bool b_useMapSpecular;

// Material colors
uniform vec3 u_ambient;
uniform vec3 u_diffuse;
uniform vec3 u_specular;

// Color to highlight selected objects (alpha component indicates blending factor)
uniform vec4 u_highlightColor;

// Specular info
// uniform float u_refractionIndex;
uniform float u_specularExponent;

// Maps
uniform sampler2D u_mapDiffuse;
uniform sampler2D u_mapNormal;
uniform sampler2D u_mapSpecular;
uniform samplerCube u_mapEnv;

// Ambient light
// In this shader ambient lighting is based on the env-map

// Directional lights
struct directionalLight {
  vec3 direction;
  vec3 color;
};
uniform directionalLight u_directionalLights[N_DIRECTIONAL_LIGHTS];

void main() {
  // Compute the normalized normal (from map or varying)
  vec3 n_normal;
  if (b_useMapNormal) {
    // From map: transform from [0,1] -> [-1,1]
    n_normal = texture(u_mapNormal, fs_uv).rgb * 2. - 1.;
  } else {
    n_normal = fs_normal;
  }
  n_normal = normalize(u_normalMatrix * n_normal);
  // Get the diffuse color (from map or material)
  vec3 diffuseColor = b_useMapDiffuse ? texture(u_mapDiffuse, fs_uv).rgb : u_diffuse;

  // Calculate the final color
  vec3 color = vec3(0, 0, 0);
  // Ambient light
  color += u_ambient * textureLod(u_mapEnv, n_normal, 7.).rgb * AMBIENT_LIGHT_STRENGTH;

  // Directional lights
  for(int i = 0; i < N_DIRECTIONAL_LIGHTS; i++) {
    directionalLight l = u_directionalLights[i];
    color += diffuseColor * l.color * dot(-l.direction, n_normal);
  }

  // Highlight color (highlights selected objects)
  color += u_highlightColor.a * u_highlightColor.rgb;

  // Clamp the color and add the alpha component
  out_color = vec4(clamp(color, 0., 1.), 1.);
}