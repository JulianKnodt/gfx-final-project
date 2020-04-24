attribute vec2 a_position;
varying vec2 v_position;
void main() {
  // read in a_position from somewhere else
  gl_Position = vec4(a_position, 0, 1);
  // mark v_position to be used in the fragment shader
  v_position = a_position;
}
