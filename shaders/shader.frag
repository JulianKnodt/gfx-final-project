precision mediump float;

uniform mat4 world_to_cam;
uniform mat4 cam_to_world;
uniform mat4 eye_position;
// Which frame number is this
// uniform int iFrame;
// uniform float time;


const float PI = 3.1415926535897932384626433832795;


varying vec3 w_v;
varying vec3 w_n;
varying vec3 w_c;

// uniform sampler2D bump_map;
uniform sampler2D brush_texture;

uniform float edge_threshold;
uniform float shading_constant;
uniform float smoothing;
uniform float ink_dryness;

uniform vec3 velocity;
uniform vec3 sun;

float aggreg(float v, vec4 s) {
  return s[0] * step(s[0], v)
   + s[1] * step(s[1], v)
   + s[2] * step(s[2], v)
   + s[3] * step(s[3], v);
}

vec4 edges(float end) {
  vec4 steps;
  float step_size = end/4.0;
  for (int i = 0; i < 4; i++) steps[i] = float(i) * step_size;
  return steps;
}


/// Returns the world position of the camera
vec3 camera_position() { return world_to_cam[3].xyz; }
vec3 camera_dir() { return world_to_cam[2].xyz; }

float luminance(vec3 color) { return dot(vec3(0.3, 0.59, 0.11), color); }

float rand(float n){ return fract(sin(n) * 43758.5453123); }
float rand(vec2 uv) { return rand(dot(uv, vec2(12.9898, 4.1414))); }

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
// TODO make this more complex?
vec3 shade(float t) {
  return vec3(pow(t, smoothing)) * aggreg(t, edges(shading_constant));
}


vec4 silhouette() {
  vec4 cam_norm = cam_to_world * vec4(w_n, 0);

  vec4 pos = world_to_cam * vec4(w_v, 1);
  vec4 cam_eye_vec = -normalize(pos);
  float alignment = dot(cam_eye_vec, cam_norm);

  vec4 prev_pos = world_to_cam * vec4(w_v - velocity, 1);
  vec4 prev_cam_eye_vec = -normalize(prev_pos);
  float prev_alignment = dot(-normalize(prev_pos), cam_norm);

  vec3 r = vec3(normalize(reflect(cam_eye_vec, cam_norm)));
  float m = 2.0 * sqrt(r.x * r.x + r.y * r.y + (r.z + 1.0) * (r.z + 1.0));
  vec2 tex_uv = vec2(r.x/m + 0.5, r.y/m + 0.5);

  if (alignment >= 0.0 && alignment <= edge_threshold) {
    return texture2D(brush_texture, tex_uv);
  } else if (prev_alignment >= 0.0 && prev_alignment <= edge_threshold) {
    // TODO maybe make this check whether alignment < 0 && prev_alignment > edge_threshold and
    // vice-versa?
    return texture2D(brush_texture, tex_uv) *
      (dot(cam_eye_vec.xyz, prev_cam_eye_vec.xyz) + 1.0) * 0.5;
  } else {
    return vec4(1,1,1,1);
  }
}

vec4 shading() {
  vec3 light_vec = normalize(sun - w_v);
  float s = max(dot(light_vec, normalize(w_n)), 0.0);
  float u = min(s * luminance(w_c), 1.0);

  // no idea why adding 0.5 here but it makes much more robust as a parameter
  return vec4(shade(u + 0.5), 1);
  // return vec4(shade(u), 1);
}

// simulate the effect of some portions of an image being missed
vec4 fly_white() {
  float v = rand(gl_FragCoord.xy) * ink_dryness;
  return vec4(vec3(v), 0);
}

void main() {
  gl_FragColor = silhouette() * shading() + fly_white();
}
