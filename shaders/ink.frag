precision mediump float;

uniform mat4 world_to_cam;
uniform mat4 cam_to_world;
uniform mat4 eye_position;
// Which frame number is this

const float PI = 3.1415926535897932384626433832795;

uniform float ink_density;
uniform float brush_footprint;
uniform float ink_dryness;
uniform float paper_blending_weight;
uniform float dry_paper_blending_weight;

uniform sampler2D brush_texture;

varying vec3 w_v;
varying vec3 w_n;
varying vec3 w_c;

/// Returns the world position of the camera
vec3 camera_position() { return world_to_cam[3].xyz; }
vec3 camera_dir() { return world_to_cam[2].xyz; }

// or gray scale of a color
float luminance(vec3 color) { return dot(vec3(0.3, 0.59, 0.11), color); }

// returns random noise
float rand() {
  return 0.3;
}

// (r, theta)
vec2 polar_coord(vec2 uv) {
  float l = length(uv);
  return vec2(l, atan(uv.y/l, uv.x/l));
}


void main() {
  float edge = dot(w_v - camera_position(), w_n);
  vec2 o = polar_coord((world_to_cam * vec4(w_v, 1)).xy);

  // gray value for this pixelv
  float gray = luminance(w_c);

  float rho = 1.0 - gray;

  float pressure = pow(0.3 * rho * (1.0 - edge), 0.8)
  float density = pow(0.3 * rho, 0.27) * texture2D(brush_texture, gl_FragCoord.xy);
  float dryness = pow(0.3 * gray * (1.0 - edge), 0.7);

  float a = (0.5 * brush_footprint) * ink_density
  - dry_paper_blending_weight * rand() * ink_dryness;

  // gl_FragColor = vec4(vec3(gray) * o.x, a);
  gl_FragColor = vec4(vec3(gray), 1);
}
