precision mediump float;

uniform mat4 world_to_cam;
uniform mat4 cam_to_world;
uniform mat4 cam_to_screen;
uniform mat4 screen_to_cam;
uniform mat4 screen_to_raster;
uniform mat4 raster_to_screen;
uniform mat4 temp;

// Vertex position in world space
attribute vec3 v;
// Vertex Normal in world space
attribute vec3 vn;

// pass thru the world vertex position and normal to interpolate
varying vec3 w_v;
varying vec3 w_n;

void main() {
  const float f = 1000.0;
  const float n = 0.0;
  // identity look at
  mat4 proj = mat4(
    vec4(1.0/4.0, 0, 0, 0),
    vec4(0, 1.0/4.0, 0, 0),
    vec4(0, 0, -2.0/(f-n), 0),
    vec4(0, 0, -(f+n)/(f-n), 1)
  );
  // read in a_position from somewhere else
  // then project it into world space
  // The Z-coordinate is incredibly important because it lets the rasterizer decide what to
  // render and what not to render.
  vec4 v_pos = world_to_cam * vec4(v, 1);
  v_pos = proj * v_pos;
  /*
  v_pos = cam_to_screen * v_pos;
  v_pos = screen_to_raster * v_pos;
  */
  gl_Position = v_pos;

  // interpolate the original position and normals
  w_v = v;
  w_n = vn;
}
