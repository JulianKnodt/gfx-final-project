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

// previous vertex position on screen space
varying vec4 prev_v;

// uniform sampler2D bump_map;
uniform sampler2D brush_texture;

uniform float edge_threshold;
uniform float shading_constant;
uniform float smoothing;

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
  // TODO convert this into a multiplication for efficiency?
  if (alignment >= 0.0 && alignment <= edge_threshold) {
    vec3 r = vec3(normalize(reflect(cam_eye_vec, cam_norm)));
    float m = 2.0 * sqrt(r.x * r.x + r.y * r.y + (r.z + 1.0) * (r.z + 1.0));
    vec2 tex_uv = vec2(r.x/m + 0.5, r.y/m + 0.5);
    return texture2D(brush_texture, tex_uv);
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



void main() {
  float k = clamp(length(gl_FragCoord.xy - prev_v.xy), 0.0, 1.0);
  gl_FragColor = k * silhouette() * shading();
}
