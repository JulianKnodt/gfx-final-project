precision mediump float;

uniform mat4 world_to_cam;
uniform mat4 cam_to_world;
uniform mat4 eye_position;
// Which frame number is this
uniform int iFrame;

const float PI = 3.1415926535897932384626433832795;

// TODO make the light a uniform
const vec3 sun = vec3(100, 100, 100);

varying vec3 w_v;
varying vec3 w_n;
varying vec3 w_c;
// uniform sampler2D bump_map;
uniform sampler2D brush_texture;
// TODO change this into a uniform and make it user-specifiable
uniform float edge_threshold;
uniform float shading_constant;

/// Returns the world position of the camera
vec3 camera_position() {
  // return world_to_cam[3].xyz;
  return vec3(world_to_cam[0][3], world_to_cam[1][3], world_to_cam[2][3]);
}
vec3 camera_dir() {
  return world_to_cam[2].xyz;
}

float luminance(vec3 color) {
  return dot(vec3(0.3, 0.59, 0.11), color);
}


// https://en.wikibooks.org/wiki/GLSL_Programming/GLUT/Textured_Spheres#Texture_Mapping
// should be used for indexing into a texture to get it's position on a sphere.
vec2 spherical_coordinate(vec3 p) {
  return vec2(
    // map x & y to [-pi, pi] -> [0, 1]
    (atan(p.x, p.y)/PI + 1.0) * 0.5,
    // map z to +/- pi/2 -> 0, 1
    asin(p.z)/PI + 0.5);
}

// Shading algorithm which returns color
vec3 shade(float t, float expo) {
  return vec3(pow(t, expo));
}

void main() {
 //  vec3 normal = texture2D(bump_map, tex_uv);
  // vec3 pos = camera_position();
  // have to do a different transformation for normals (see PBRT)
  vec4 cam_norm = cam_to_world * vec4(w_n, 0);

  // transform position to camera space
  vec4 pos = world_to_cam * vec4(w_v, 1);

  vec4 cam_eye_vec = -normalize(pos);
  float alignment = dot(cam_eye_vec, cam_norm);
  if (alignment >= 0.0 && alignment <= edge_threshold) {
    vec3 r = vec3(normalize(reflect(cam_eye_vec, cam_norm)));
    float m = 2.0 * sqrt(r.x * r.x + r.y * r.y + (r.z + 1.0) * (r.z + 1.0));
    vec2 tex_uv = vec2(r.x/m + 0.5, r.y/m + 0.5);
    gl_FragColor = texture2D(brush_texture, tex_uv);
  } else {
    // These are points which are not on the edge, need to do interior shading here
    vec3 light_vec = normalize(sun - w_v);
    float s = max(dot(light_vec, normalize(w_n)), 0.0);
    float u = min(s * luminance(w_c), 1.0);

    gl_FragColor = vec4(shade(u, shading_constant), 1);
  }
}
