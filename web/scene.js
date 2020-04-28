const assert = (value, error) => {
  if (value) return;
  console.trace();
  console.error(error);
  throw error;
}

const cross = ([x, y, z], [i, j, k]) => ([
    y * k - z * j,
    z * i - x * k,
    x * j - y * i,
]);

const normalize = ([x, y, z]) => {
  const magn = Math.sqrt(x*x + y*y + z*z);
  return [x/magn, y/magn, z/magn];
};

const sub = ([x, y, z], [i, j, k]) => [x-i, y-j, z-k];

const f = 100;
const n = 0.1;

const deg_to_rad = deg => deg * Math.PI/180;

// This actually must be false
const MAT_T = false;

class Scene {
  constructor(frag_src, vert_src) {
    this.start = performance.now();
    // Attributes of the scene
    // keep a log of the uniforms for debugging purposes
    this.uniforms = {};
    this.canvas = document.getElementById("c");
    this.gl = this.canvas.getContext("webgl");
    if (!this.gl) {
      throw "WebGL not supported in this browser";
    }
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.log = console.log;
    // this.log = () => {}; // uncomment this line to remove debug output
    this.program = this.attachShaders(frag_src, vert_src);
    this.gl.useProgram(this.program);

    this.frame = 0;
    this.pos = new THREE.Vector3(0, 0, 0);
    this.at = new THREE.Vector3(0, 0, -1);
    this.up = new THREE.Vector3(0, 1, 0);
    this.look_at();
    this.orthographic();
    this.resize();
    this.gl.enable(this.gl.DEPTH_TEST);
  }
  add_verts(v) {
    if (v.length == 0) return;
    assert(v.length % 3 == 0);
    const v_loc = this.gl.getAttribLocation(this.program, "v");
    this.gl.enableVertexAttribArray(v_loc);
    this.writeBuffer(new Float32Array(v));
    this.gl.vertexAttribPointer(v_loc, 3, this.gl.FLOAT, false, 0, 0);
    this.triangles = v.length/3;
  }
  add_normals(vn) {
    if (vn.length == 0) return;
    assert(vn.length % 3 == 0);
    const vn_loc = this.gl.getAttribLocation(this.program, "vn");
    this.gl.enableVertexAttribArray(vn_loc);
    this.writeBuffer(new Float32Array(vn));
    this.gl.vertexAttribPointer(vn_loc, 3, this.gl.FLOAT, true, 0, 0);
  }
  initShader(src, isVertex) {
    const gl = this.gl;
    const shader = gl.createShader(isVertex ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) return shader;
    this.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
  }
  attachShaders(fragSrc, vertSrc) {
    const program = this.gl.createProgram();
    this.gl.attachShader(program, this.initShader(fragSrc, false));
    this.gl.attachShader(program, this.initShader(vertSrc, true));
    this.gl.linkProgram(program);
    const success = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
    if (success) return program;
    this.log(this.gl.getProgramInfoLog(program));
    this.gl.deleteProgram(program);
  }
  // Writes a uniform to this GLSL shader which is variable accessible to all shaders
  writeUniform(name, glslType, v0 = 0, v1 = 0, v2 = 0) {
    this.uniforms[name] = {type: glslType, v0, v1, v2};
    assert(this.program != null, "Tried to write uniform to null program");
    const loc = this.gl.getUniformLocation(this.program, name);
    // assert(loc != null, `Null location for ${name}: ${loc}`);
    this.gl["uniform" + glslType](loc, v0, v1, v2);
  }
  writeBuffer(data) {
    assert(data instanceof Float32Array, "Expected Float32Array");
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
  }
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.gl.viewportWidth = this.canvas.width;
    this.gl.viewportHeight = this.canvas.height;
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    this.screen_to_raster(this.gl.viewportWidth, this.gl.viewportHeight, -100, -100, 100, 100);
  }
  look_at() {
    const up = this.up.normalize();
    const dir = this.at.normalize();
    const r = this.at.clone().cross(this.up);
    const pos = this.pos;
    const cam_to_world = new THREE.Matrix4();
    cam_to_world.elements = [
      r.x, r.y, r.z, 0,
      up.x, up.y, up.z, 0,
      dir.x, dir.y, dir.z, 0,
      pos.x, pos.y, pos.z, 1,
    ];
    // cam_to_world.lookAt(this.pos, this.at, this.up);
    // this.writeUniform("cam_to_world", "Matrix4fv", MAT_T, mat.elements);
    this.writeUniform("world_to_cam", "Matrix4fv", MAT_T, [...cam_to_world.getInverse(cam_to_world).elements]);
    return cam_to_world;
  }
  // use an orthographic camera to project things
  orthographic() {
    // what range of z values do we allow
    const n = 1;
    const f = 1000;
    const cam_to_screen = new THREE.Matrix4();
    cam_to_screen.elements = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, -2/(f-n), 0,
      0, 0, -(f+n)/(f-n), 1
    ];
    // this.writeUniform("cam_to_screen", "Matrix4fv", MAT_T, [...cam_to_screen.elements]);
    // this.writeUniform("screen_to_cam", "Matrix4fv", MAT_T, mat.getInverse(mat).elements);
    return cam_to_screen;
  }
  rotateHorizontal(theta) {
    this.at.applyAxisAngle(this.up, deg_to_rad(theta));
    this.at.normalize();
    this.look_at();
  }
  moveForward(speed) {
    this.pos.addScaledVector(this.at, speed);
    this.look_at();
  }
  /*
  // TODO add a perspective matrix
  perspective(fov) {
    const mat = new THREE.Matrix4();
    mat.set(
  }
  */
  screen_to_raster(res_x, res_y, lx, ly, hx, hy) {
    const mt = new THREE.Matrix4();
    mt.makeTranslation(-lx, -hy, 0);
    const m1 = new THREE.Matrix4();
    m1.makeScale(res_x/(hx-lx), res_y/(ly-hy), 1);
    const mat = new THREE.Matrix4();
    mat.set(
      res_x/(hx-lx), 0, 0, -lx,
      0, res_y/(ly-hy), 0, -hy,
      0, 0, 1, 0,
      0, 0, 0, 1,
    );
    // m1.multiply(mt);
    m1.multiply(mt);
    // this.writeUniform("screen_to_raster", "Matrix4fv", MAT_T, [...m1.elements]);
    // this.writeUniform("raster_to_screen", "Matrix4fv", MAT_T, mat.getInverse(mat).elements);
    return mat;
  }
  // TODO maybe add something for adding the perspective transformation here
  render() {
    this.frame = this.frame + 1;
    // this.writeUniform("time", "1f", performance.now() - this.start);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.triangles);
    this.writeUniform("temp", "Matrix4fv", MAT_T, [
      1/100, 0, 0, 0,
      0, 1/100, 0, 0,
      0, 0, -2/(f-n), 0,
      0, 0, -(f+n)/(f-n), 1,
    ]);
    /*
    this.log(`Rendered
      vertices: ${this.triangles}
      state:`, this.uniforms);
    */
  }
  set frame(frame) {
    this._frame = frame;
    // this.writeUniform("frame", "1f", frame);
  }
  get frame() { return this._frame; }
  set fov(fov) {
    this._fov = fov;
    this.writeUniform("fov", "1f", fov);
  }
  get fov() { return this._fov; }
}

