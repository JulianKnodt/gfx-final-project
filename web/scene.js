const assert = (value, error) => {
  if (value) return;
  console.trace(error);
  throw error;
}

const deg_to_rad = deg => deg * Math.PI/180;

class Scene {
  constructor(frag_src, vert_src) {
    // Attributes of the scene
    this.frame = 0;
    this.view_matrix = new THREE.Matrix4();
    // TODO add more here so we can play around more

    this.needsRender = true;


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
    this.writeUniform("width", "1f", this.canvas.width);
    this.writeUniform("height", "1f", this.canvas.height);

    const positionLocation = this.gl.getAttribLocation(this.program, "a_position");
    this.gl.enableVertexAttribArray(positionLocation);

    const positions = new Float32Array([
      // Bottom left triangle
      -1, -1,
      -1, 1,
      1, -1,
      // Top right triangle
      1, 1,
      -1, 1,
      1, -1,
    ]);
    this.writeBuffer(positions);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    // set an integer indicating the frame number
    this.start = performance.now();
    // draw after sizing it correctly
    this.resize();
  }
  initShader(src, isVertex) {
    const gl = this.gl;
    const shader = gl.createShader(isVertex ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    // TODO maybe update a local variable instead of returning
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
  // Writes a uniform to this GLSL shader
  // Which is essentially a global variable
  writeUniform(name, glslType, v0 = 0, v1 = 0, v2 = 0) {
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
    this.writeUniform("iResolution", "2i", this.gl.viewportWidth, this.gl.viewportHeight);
    this.render()
  }
  lookAt(pos, at, up) {
    if (!pos) pos = new THREE.Vector3();
    if (!at) at = new THREE.Vector3(0, 0, 1);
    if (!up) up = new THREE.Vector3(0, 1, 0);
    this.view_matrix.lookAt(pos, at, up);
  }
  render() {
    if (!this.needsRender) return;
    this.writeUniform("iTime", "1f", performance.now() - this.start);
    this.writeUniform("iFrame", "1i", this.frame);
    this.writeUniform("camera", "Matrix4fv", false, this.view_matrix.elements);
    this.frame += 1;
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    this.needsRender = false;
  }
}

