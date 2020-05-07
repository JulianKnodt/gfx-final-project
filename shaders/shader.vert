precision mediump float;

uniform mat4 world_to_cam;
uniform mat4 cam_to_clip;

// Vertex position in world space
attribute vec3 v;
// Vertex Normal in world space
attribute vec3 vn;
// Color of vertex
attribute vec3 c;

// pass thru the world vertex position and normal to interpolate
varying vec3 w_v;
varying vec3 w_n;
varying vec3 w_c;

void main() {
  // read in a_position from somewhere else
  // then project it into world space
  // The Z-coordinate is incredibly important because it lets the rasterizer decide what to
  // render and what not to render.
  vec4 v_pos = world_to_cam * vec4(v, 1);
  v_pos = cam_to_clip * v_pos;
  gl_Position = v_pos;

  // interpolate the original position and normals
  w_v = v;
  w_n = vn;
  w_c = c;
}
