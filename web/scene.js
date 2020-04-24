const assert = (value, error) => {
  if (value) return;
  console.trace(error);
  throw error;
}

class Scene {
  constructor() {
    const canvas = document.getElementById("c");
    this.gl = canvas.getContext("webgl");
    if (!this.gl) {
      throw "WebGL not supported in this browser";
    }
    this.gl.viewportWidth = canvas.width;
    this.gl.viewportHeight = canvas.height;
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.log = console.log;
    // this.log = () => {}; // uncomment this line to remove debug output
  }
  initShader(src, isVertex) {
    const gl = this.gl;
    const shader = gl.createShader(isVertex ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, src);
    gl.compileShader();
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    // TODO maybe update a local variable instead of returning
    if (success) return shader;
    this.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
  }
  attachShaders(fragSrc, vertSrc) {
    const program = this.gl.createProgram();
    this.gl.attachShader(program, this.initFragShader(fragSrc, false));
    this.gl.attachShader(program, this.initVertexShader(vertSrc, true));
    this.gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) return program;
    this.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
  }
  // Writes a uniform to this GLSL shader
  // Which is essentially a global variable
  writeUniform(name, glslType, v0 = 0, v1 = 0, v2 = 0) {
    this.gl["uniform" + varType](this.gl.getUniformLocation(this.program, name), v0, v1, v2);
  }
  // Writes some data to some buffer... TODO figure out how to do this better
  writeBuffer(data) {
    assert(data instanceof Float32Array, "Expected Float32Array");
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  }
  render() {
    if (!this.needsRender) return;
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    this.needsRender = false;
  }
}
