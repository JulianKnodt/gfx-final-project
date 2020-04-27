const assert = (value, error) => {
  if (value) return;
  console.trace(error);
  throw error;
}

const deg_to_rad = deg => deg * Math.PI/180;

class Scene {
  constructor(frag_src, vert_src) {
    this.start = performance.now();
    // Attributes of the scene
    this.view_matrix = new THREE.Matrix4();
    this.look_at(); // set view to be default
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
    this.resize();
  }
  add_verts(v) {
    if (v.length == 0) return;
    assert(v.length % 3 == 0);
    const v_loc = this.gl.getAttribLocation(this.program, "v");
    this.gl.enableVertexAttribArray(v_loc);
    this.writeBuffer(new Float32Array(v));
    this.gl.vertexAttribPointer(positionLocation, v.length/3, this.gl.FLOAT, false, 0, 0);
    this.triangles = v.length/3;
  }
  add_normals(vn) {
    if (vn.length == 0) return;
    assert(vn.length % 3 == 0);
    const vn_loc = this.gl.getAttribLocation(this.program, "vn");
    this.gl.enableVertexAttribArray(vn_loc);
    this.writeBuffer(new Float32Array(vn));
    this.gl.vertexAttribPointer(positionLocation, vn.length/3, this.gl.FLOAT, true, 0, 0);
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
    this.gl["uniform" + glslType](this.gl.getUniformLocation(this.program, name), v0, v1, v2);
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
    this.writeUniform("iResolution", "2f", this.gl.viewportWidth, this.gl.viewportHeight);
    this.writeUniform("width", "1f", this.canvas.width);
    this.writeUniform("height", "1f", this.canvas.height);
  }
  look_at(pos, at, up) {
    if (!pos) pos = new THREE.Vector3();
    if (!at) at = new THREE.Vector3(0, 0, 1);
    if (!up) up = new THREE.Vector3(0, 1, 0);
    this.view_matrix.lookAt(pos, at, up);
  }
  render() {
    this.frame = this.frame + 1;
    this.writeUniform("iTime", "1f", performance.now() - this.start);
    this.writeUniform("camera", "Matrix4fv", false, this.view_matrix.elements);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.num_triangles);
  }
  set frame(frame) {
    this._frame = frame;
    this.writeUniform("frame", "1f", frame);
  }
  get frame() { return this._frame; }
  set fov(fov) {
    this._fov = fov;
    this.writeUniform("fov", "1f", fov);
  }
  get fov() { return this._fov; }
}

