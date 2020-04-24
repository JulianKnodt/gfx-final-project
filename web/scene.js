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
  }
  initShader(program, shaderType, src) {

  }
}
