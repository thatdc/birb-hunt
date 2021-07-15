#version 300 es

#define AMBIENT_LIGHT_STRENGTH .1
#define N_DIRECTIONAL_LIGHTS 2
#define N_POINT_LIGHTS 2

precision mediump float;

in vec2 fs_uv;
in vec3 fs_normal;
in vec3 fs_position;
out vec4 out_color;

// Transformation matrices
uniform mat4 u_worldMatrix;
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
  bool isActive;
  vec3 direction;
  vec3 color;
};
uniform directionalLight u_directionalLights[N_DIRECTIONAL_LIGHTS];
vec3 calcDirectionalLight(directionalLight l, vec3 n_normal);

// Point lights
struct pointLight {
  bool isActive;
  vec3 color;
  vec3 position;
  float target;
  float decay;
};
uniform pointLight u_pointLights[N_POINT_LIGHTS];
vec3 calcPointLight(pointLight l, vec3 pos);

void main() {
  // Compute the fragment position in world space
  vec3 pos = (u_worldMatrix * vec4(fs_position, 1)).xyz;

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
    if (l.isActive) {
      color += diffuseColor * calcDirectionalLight(l, n_normal);
    }
  }

  // Directional lights
  for(int i = 0; i < N_POINT_LIGHTS; i++) {
    pointLight l = u_pointLights[i];
    if (l.isActive) {
      color += diffuseColor * calcPointLight(l, pos);
    }
  }

  // Highlight color (highlights selected objects)
  color += u_highlightColor.a * u_highlightColor.rgb;

  // Clamp the color and add the alpha component
  out_color = vec4(clamp(color, 0., 1.), 1.);
}

/**
  * Calculates the contribution of a directional light
  * @param[in] l the directional light
  * @param[in] n_normal the normal to the current point
  */
vec3 calcDirectionalLight(directionalLight l, vec3 n_normal) {
  return l.color * dot(-l.direction, n_normal);
}

/**
  * Calculates the contribution of a point light
  * @param[in] l the point light
  * @param[in] pos the position of the point being rendered
  */
vec3 calcPointLight(pointLight l, vec3 pos) {
  return l.color * pow(l.target / distance(l.position, pos), l.decay);
}