precision mediump float;

uniform mat4 world_to_cam;
// maybe we don't want to pass cam_to_screen explicitly
// but just pass a flag to compute it
uniform vec2 iResolution;
uniform vec2 s_min;
uniform vec2 s_max;
// field of view in degrees
uniform float fov;
const float near = -1.0;
const float far = 1.0;

// Vertex position in world space
attribute vec3 v;
// Vertex Normal in world space
attribute vec3 vn;

// pass thru the world vertex position and normal to interpolate
varying vec3 w_v;
varying vec3 w_n;

/// Creates a translation matrix which when applied shifts the vector.
mat4 translate(vec3 by) {
  mat4 tf = mat4(1.0);
  tf[3] = vec4(by, 1.0);
  return tf;
}

// Creates a matrix that scales the input by the given factor
mat4 scale(vec3 by) {
  return mat4(mat3(
    vec3(by.x, 0, 0),
    vec3(0, by.y, 0),
    vec3(0, 0, by.z)
  ));
}

mat4 perspective(float fov) {
  mat4 persp = mat4(
    vec4(1, 0, 0, 0),
    vec4(0, 1, 0, 0),
    vec4(0, 0, far/(far-near), 1),
    vec4(0, 0, -far*near/(far-near), 0)
  );
  float inv_tan = 1.0/tan(radians(fov)/2.0);
  return scale(vec3(inv_tan, inv_tan, 1.0)) * persp;
}


// TODO we can mess with this later :)
// mat4 rot(vec3 axis, float theta) {}}

// This is what is passed to the fragment shader
varying vec3 position;

void main() {
  // read in a_position from somewhere else
  // then project it into world space
  // The Z-coordinate is incredibly important because it lets the rasterizer decide what to
  // render and what not to render.
  mat4 screen_to_raster = scale(vec3(iResolution.x, iResolution.y, 0.0))
    * scale(vec3(1.0/(s_max.x - s_min.x), 1.0/(s_min.y - s_max.y), 1.0))
    * translate(vec3(s_min.x, s_max.y, 0.0));
  gl_Position = screen_to_raster *
    perspective(fov) * world_to_cam * vec4(v, 0);

  w_v = v;
  w_n = vn;
}
