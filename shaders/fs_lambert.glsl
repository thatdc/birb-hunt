#version 300 es

#define AMBIENT_LIGHT_STRENGTH .3
#define N_DIRECTIONAL_LIGHTS 2
#define N_POINT_LIGHTS 2
#define N_SPOT_LIGHTS 2

precision mediump float;
precision mediump sampler2DShadow;

in vec2 fs_uv;
in vec3 fs_normal;
in vec3 fs_position;
out vec4 out_color;

// Camera position
uniform vec3 u_cameraPosition;

// Transformation matrices
uniform mat4 u_worldMatrix;
uniform mat3 u_normalMatrix;

// Flags
uniform bool b_useMapDiffuse;
uniform bool b_useMapNormal;
uniform bool b_useMapSpecularExponent;

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
uniform sampler2D u_mapSpecularExponent;
uniform samplerCube u_mapEnv;

// Ambient light
// In this shader ambient lighting is based on the env-map

// Directional lights
struct directionalLight {
  bool isActive;
  vec3 direction;
  vec3 color;
  mat4 viewProjectionMatrix;
};
uniform directionalLight u_directionalLights[N_DIRECTIONAL_LIGHTS];
uniform sampler2DShadow u_directionalLightShadowMap; // for OpenGL 3.0 limitations, we only support a shadow map for light #0
vec3 calcDirectionalLight(directionalLight l);

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

// Spot lights
struct spotLight {
  bool isActive;
  vec3 color;
  vec3 position;
  vec3 direction;
  float innerCone;
  float outerCone;
  float target;
  float decay;
  mat4 viewProjectionMatrix;
};
uniform spotLight u_spotLights[N_SPOT_LIGHTS];
uniform sampler2DShadow u_spotLightShadowMap; // for OpenGL 3.0 limitations, we only support a shadow map for light #0
vec3 calcSpotLight(spotLight l, vec3 pos);

// Shadow maps
float calcShadow(mat4 lightViewProjectionMatrix, sampler2DShadow shadowMap, vec3 pos, vec3 n_normal, vec3 light_dir);

// Lambert diffuse component
float calcLambertDiffuse(vec3 light_dir, vec3 n_normal);

// Blinn specular component
float calcBlinnSpecular(vec3 light_dir, vec3 view_dir, vec3 n_normal, float specular_exponent);

void main() {
  // Compute the fragment position in world space
  vec3 pos = (u_worldMatrix * vec4(fs_position, 1)).xyz;

  // Compute the viewer direction
  vec3 view_dir = normalize(u_cameraPosition - pos);

  // Compute the normalized normal (from map or varying)
  vec3 n_normal;
  if(b_useMapNormal) {
    // From map: transform from [0,1] -> [-1,1]
    n_normal = texture(u_mapNormal, fs_uv).rgb * 2. - 1.;
  } else {
    n_normal = fs_normal;
  }
  n_normal = normalize(u_normalMatrix * n_normal);

  // Get the diffuse color (from map or material)
  vec3 mtl_diffuse = b_useMapDiffuse ? texture(u_mapDiffuse, fs_uv).rgb : u_diffuse;

  // Get the specular exponent (from map or material)
  float specular_exponent = b_useMapSpecularExponent ? texture(u_mapSpecularExponent, fs_uv).r : u_specularExponent;

  // Ambient light
  vec3 ambient = mtl_diffuse * textureLod(u_mapEnv, n_normal, 7.).rgb * AMBIENT_LIGHT_STRENGTH;

  // Diffuse and specular accumulator
  vec3 diffuseSpecular = vec3(0);

  // Directional lights
  for(int i = 0; i < N_DIRECTIONAL_LIGHTS; i++) {
    directionalLight l = u_directionalLights[i];
    if(l.isActive) {
      // Dimming due to shadow
      float shadow;
      if(i == 0) {
        shadow = calcShadow(l.viewProjectionMatrix, u_directionalLightShadowMap, pos, n_normal, -l.direction);
      } else {
        shadow = 1.;
      }
      // Diffuse component from the BRDF
      vec3 diffuse = mtl_diffuse * calcLambertDiffuse(-l.direction, n_normal);
      // Specular component from the BRDF
      vec3 specular = u_specular * calcBlinnSpecular(-l.direction, view_dir, n_normal, specular_exponent);
      // Light contribution according to light model
      diffuseSpecular += (diffuse + specular) * calcDirectionalLight(l) * shadow;
    }
  }

  // Point lights
  for(int i = 0; i < N_POINT_LIGHTS; i++) {
    pointLight l = u_pointLights[i];
    if(l.isActive) {
      // Direction from point to light
      vec3 light_dir = normalize(l.position - pos);
      // Diffuse component from the BRDF
      vec3 diffuse = mtl_diffuse * calcLambertDiffuse(light_dir, n_normal);
      // Specular component from the BRDF
      vec3 specular = u_specular * calcBlinnSpecular(light_dir, view_dir, n_normal, specular_exponent);
      // Light contribution according to light model
      diffuseSpecular += (diffuse + specular) * calcPointLight(l, pos);
    }
  }

  // Spot lights
  for(int i = 0; i < N_SPOT_LIGHTS; i++) {
    spotLight l = u_spotLights[i];
    if(l.isActive) {// Direction from point to light
      vec3 light_dir = normalize(l.position - pos);
      // Dimming due to shadow
      float shadow;
      if(i == 0) {
        shadow = calcShadow(l.viewProjectionMatrix, u_spotLightShadowMap, pos, n_normal, light_dir);
      } else {
        shadow = 1.;
      }
      // Diffuse component from the BRDF
      vec3 diffuse = mtl_diffuse * calcLambertDiffuse(light_dir, n_normal);
      // Specular component from the BRDF
      vec3 specular = u_specular * calcBlinnSpecular(light_dir, view_dir, n_normal, specular_exponent);
      // Light contribution according to light model
      diffuseSpecular += (diffuse + specular) * calcSpotLight(l, pos) * shadow;
    }
  }

  // Sum the lighting components together, taking into account the shadows
  vec3 color = ambient + diffuseSpecular;

  // Highlight color (highlights selected objects)
  color += u_highlightColor.a * u_highlightColor.rgb;

  // Clamp the color and add the alpha component
  out_color = vec4(clamp(color, 0., 1.), 1.);
}

/**
  * Calculates the diffuse BRDF according to Lambert rule.
  * The diffuse color of the material is not taken inot account
  * @param[in] light_dir direction of the light from the current point
  * @param[in] n_normal normalized normal to the surface
  */
float calcLambertDiffuse(vec3 light_dir, vec3 n_normal) {
  return clamp(dot(light_dir, n_normal), 0., 1.);
}

/**
  * Calculates the specular BRDF according to Blinn rule.
  * @param[in] light_dir direction of the light from the current point
  * @param[in] light_dir direction of the viewer (camera) from the current point
  * @param[in] n_normal normalized normal to the surface
  * @param[in] specular_exponent specular exponent between 0 and 1000
  */
float calcBlinnSpecular(vec3 light_dir, vec3 view_dir, vec3 n_normal, float specular_exponent) {
  // Compute half-vector: average view and light dir
  vec3 h = normalize(light_dir + view_dir);
  return pow(clamp(dot(h, n_normal), 0., 1.), specular_exponent);
}

/**
  * Calculates the contribution of a directional light
  * @param[in] l the directional light
  */
vec3 calcDirectionalLight(directionalLight l) {
  return l.color;
}

/**
  * Calculates the contribution of a point light
  * @param[in] l the point light
  * @param[in] pos the position of the point being rendered
  */
vec3 calcPointLight(pointLight l, vec3 pos) {
  return l.color * pow(l.target / distance(l.position, pos), l.decay);
}

/**
  * Calculates the contribution of a spot light
  * @param[in] l the spot light
  * @param[in] pos the position of the point being rendered
  */
vec3 calcSpotLight(spotLight l, vec3 pos) {
  // Incident direction (from light to point)
  vec3 dir_incident = normalize(pos - l.position);

  // Cosine of the angle between the light's own direction and the incident direction
  float cos_a = dot(dir_incident, l.direction);

  // Compute the dimming effect (the cones are already encoded as cosines)
  float dimming = (cos_a - l.outerCone) / (l.innerCone - l.outerCone);
  dimming = clamp(dimming, 0., 1.);

  // Apply the target distance and decay
  return l.color * dimming * pow(l.target / distance(l.position, pos), l.decay);
}

/**
  * Calculate the dimming factor produced by the shadow
  * @param[in] lightViewProjectionMatrix
  * @param[in] shadowMap
  * @param[in] pos position of the current fragment in world space
  * @param[in] n_normal
  * @param[in] light_dir direction of the light from the current fragment
  * @returns 1.0 if the object is lit, 0.0 if it is in shadow
  */
float calcShadow(mat4 lightViewProjectionMatrix, sampler2DShadow shadowMap, vec3 pos, vec3 n_normal, vec3 light_dir) {
  // Compute coordinates in camera space
  vec4 projCoords4 = lightViewProjectionMatrix * vec4(pos, 1.);
  // Perform perspective divide
  vec3 projCoords = projCoords4.xyz / projCoords4.w;
  // Convert from [-1, 1] of normalized coordinates to [0, 1] of texture space
  projCoords = projCoords * .5 + .5;

  // Check if the coordinate is inside the texture
  bool isInsideMap = projCoords.x >= 0. && projCoords.x <= 1. && projCoords.y >= 0. && projCoords.y <= 1. && projCoords.z <= 1.;

  // If not inside the shadow map, draw the fragment as fully illuminated
  if(!isInsideMap) {
    return 1.;
  }

  // Calculate shadow bias
  float bias = max(5e-3 * (1. - dot(n_normal, light_dir)), 5e-4);
  projCoords.z -= bias;

  // Sample the filtered shadow map, and do the depth comparison
  float shadow = texture(shadowMap, projCoords);

  // If the current depth is further than the closest one, the object is not lit
  return shadow;
}