precision mediump float;

uniform mat4 world_to_cam;
uniform mat4 eye_position;
// Which frame number is this
uniform int iFrame;
varying vec3 w_v;
varying vec3 w_n;

void main() {
  gl_FragColor = vec4(1.0, 0, 0, 1);
  // gl_FragColor = vec4(w_n, 1.0);
}
