const assert = (value, error) => {
  if (value) return;
  console.trace();
  console.error(error);
  throw error;
}

const sqr = v => v * v;

const deg_to_rad = deg => deg * Math.PI/180;

// Must pass false to transpose matrix
const MAT_T = false;

class Scene {
  constructor(frag_src, vert_src) {
    this.start = performance.now();
    this.uniforms = {};
    this.canvas = document.getElementById("c");
    this.gl = this.canvas.getContext("webgl");
    if (!this.gl) throw "WebGL not supported in this browser";
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.log = console.log;
    // this.log = () => {}; // uncomment this line to remove debug output
    this.program = this.attachShaders(frag_src, vert_src);
    this.gl.useProgram(this.program);

    this.frame = 0;
    this.pos = new THREE.Vector3(-10, 120, 70);
    this.at = new THREE.Vector3(0, 0, 1);
    this.up = new THREE.Vector3(0, 1, 0);
    this.n = 0.1;
    this.f = 1000;
    this.screen_size = 1;

    this.look_at();
    this.look_at();
    this.perspective(30);
    this.resize();
    this.shading_constant = 0.74;
    this.edge_threshold = 0.36;
    this.shading_smoothness = 0.1;
    this.ink_dryness = 0.1;
    this.sun = {x: 100, y: 100, z: 100};

    this.gl.enable(this.gl.DEPTH_TEST);
  }
  add_verts(v) {
    assert(v.length % 3 == 0);
    const v_loc = this.gl.getAttribLocation(this.program, "v");
    this.gl.enableVertexAttribArray(v_loc);
    this.writeBuffer(v);
    this.gl.vertexAttribPointer(v_loc, 3, this.gl.FLOAT, false, 0, 0);
    this.triangles = v.length/3;
  }
  add_normals(vn) {
    assert(vn.length % 3 == 0, "normals do not seem correct");
    const vn_loc = this.gl.getAttribLocation(this.program, "vn");
    this.gl.enableVertexAttribArray(vn_loc);
    this.writeBuffer(vn);
    this.gl.vertexAttribPointer(vn_loc, 3, this.gl.FLOAT, true, 0, 0);
  }
  // add colors to the scene, one per vertex
  add_colors(c) {
    assert(c.length % 3 == 0, "colors are invalid length");
    const c_loc = this.gl.getAttribLocation(this.program, "c");
    this.gl.enableVertexAttribArray(c_loc);
    this.writeBuffer(c);
    this.gl.vertexAttribPointer(c_loc, 3, this.gl.FLOAT, false, 0, 0);
  }
  add_vertex_textures(vt) {
    return
    assert(vt.length % 3 == 0, "colors are invalid length");
    this.vertex_textures = new Float32Array(c);
    const vt_loc = this.gl.getAttribLocation(this.program, "vt");
    this.gl.enableVertexAttribArray(vt_loc);
    this.writeBuffer(this.vertex_textures);
    this.gl.vertexAttribPointer(vt_loc, 3, this.gl.FLOAT, false, 0, 0);
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
    this.uniforms[name] = {glslType, v0, v1, v2};
    assert(this.program != null, "Tried to write uniform to null program");
    const loc = this.gl.getUniformLocation(this.program, name);
    if (loc === null) this.log(`${name} appears to be unused or invalid`);
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
    const s = Math.min(window.innerWidth, window.innerHeight);
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.gl.viewportWidth = s;
    this.gl.viewportHeight = s;
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
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
    this.writeUniform("cam_to_world", "Matrix4fv", MAT_T, cam_to_world.elements);
    this.writeUniform("world_to_cam", "Matrix4fv", MAT_T, [...cam_to_world.getInverse(cam_to_world).elements]);
    return cam_to_world;
  }
  render() {
    // this.frame = this.frame + 1;
    // this.time = performance.now() - this.start;
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.triangles);
    // TODO postprocessing here to add paper effect
  }

  set frame(frame) {
    this._frame = frame;
    this.writeUniform("frame", "1f", frame);
  }
  get frame() { return this._frame; }

  // use an orthographic camera to project things
  orthographic() {
    const cam_to_clip = new THREE.Matrix4();
    const n = this.n;
    const f = this.f;
    const s = this.screen_size;
    cam_to_clip.elements = [
      s, 0, 0, 0,
      0, s, 0, 0,
      0, 0, -2/(f-n), 0,
      0, 0, -(f+n)/(f-n), 1
    ];
    this.writeUniform("cam_to_clip", "Matrix4fv", MAT_T, [...cam_to_clip.elements]);
    // cam.to_clip.getInverse(cam_to_clip);
    // this.writeUniform("clip_to_cam", "Matrix4fv", MAT_T, [...cam_to_clip.elements]);
    return cam_to_clip;
  }
  perspective(fov=90) {
    const cam_to_clip = new THREE.Matrix4();
    const aspect = 1/Math.tan(deg_to_rad(fov)/2);
    const n = this.n;
    const f = this.f;
    const s = this.screen_size;
    cam_to_clip.elements = [
      aspect * n/s, 0, 0, 0,
      0, aspect * n/s, 0, 0,
      0, 0, -(f+n)/(f-n), -1,
      0, 0, -2*f*n/(f-n), 0,
    ];
    this.writeUniform("cam_to_clip", "Matrix4fv", MAT_T, [...cam_to_clip.elements]);
    // this.writeUniform("clip_to_cam", "Matrix4fv", MAT_T, [...cam_to_clip.getInverse(cam_to_clip).elements]);
    return cam_to_clip;
  }
  add_brush_texture(name) {
    const gl = this.gl;
    const txt = load_texture("/resources/" + name, gl);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, txt);
    this.writeUniform("brush_texture", "1i", 0);
  }
  add_shading_texture(name) {
    const gl = this.gl;
    const txt = load_texture("/resources/" + name, gl);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, txt);
    this.writeUniform("shading_texture", "1i", 1);
  }

  set shading_constant(t) { this.writeUniform("shading_constant", "1f", t); }
  get shading_constant() { return this.uniforms["shading_constant"].v0; }

  set edge_threshold(t) { this.writeUniform("edge_threshold", "1f", t); }
  get edge_threshold() { return this.uniforms["edge_threshold"].v0; }

  set shading_smoothness(t) { this.writeUniform("smoothing", "1f", t); }
  get shading_smoothness() { return this.uniforms.smoothing.v0; }

  set ink_dryness(t) { this.writeUniform("ink_dryness", "1f", t) }
  get ink_dryness() { return this.uniforms.ink_dryness.v0; }

  set velocity({x, y, z}) { this.writeUniform("velocity", "3fv", [x, y, z]) }
  get velocity() { return this.uniforms.velocity.v0; }

  set time(t) { this.writeUniform("time", "1f", t) }
  get velocity() { return this.uniforms.time.v0; }

  set sun({x, y, z}) { this.writeUniform("sun", "3f", x, y, z) }
  get sun() {
    const s = this.uniforms.sun;
    return {x: s.v0, y: s.v1, z: s.v2};
  }

  rotateHorizontal(theta) {
    this.at.applyAxisAngle(this.up, deg_to_rad(theta));
    this.at.normalize();
    this.look_at();
  }
  rotateVertical(theta) {
    const r = this.at.clone().cross(this.up);
    this.at.applyAxisAngle(r, deg_to_rad(theta));
    this.at.normalize();
    this.up = r.cross(this.at);
    this.look_at();
  }
  moveForward(speed) {
    this.pos.addScaledVector(this.at, speed);
    this.look_at();
  }
  /*
  // returns whether it needs another render
  update(dt) {
    const prev = this.pos.clone();
    this.pos.addScaledVector(this.velocity, dt);
    this.velocity.divideScalar(sqr(1 + dt/1000.0));

    const prev_at = this.at.clone();
    this.at.applyAxisAngle(this.up, deg_to_rad(dt * this.deg_velocity));
    this.deg_velocity /= sqr(1 + dt/1000.0);
    this.at.normalize();

    this.look_at();
    return !(this.pos.equals(prev) && this.at.equals(prev_at));
  }
  loop(ts) {
    const delta = performance.now() - this.time;
    const needs_render = this.update(delta);
    this.time = performance.now();
    if (needs_render) this.render();
    window.requestAnimationFrame(this.loop.bind(this));
  }
  */
}

