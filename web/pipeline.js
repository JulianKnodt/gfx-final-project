class Pipeline {
  constructor(gl) {
    this.gl = gl;
    gl.clearColor(0, 0, 0, 1);
    // TODO decide to if it is necessary to clear each of these every time
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.programs = [];
  }
  add_program(frag_src, vert_src, initialize, run) {
    this.programs.push({
      frag_src,
      vert_src,
      initialize,
      run,
    });
  }
  execute() {
    for (let prog of this.programs) this.run(prog);
  }
  run({frag_src, vert_src, initialize, run}) {
    const gl = this.gl;
    const frag = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(frag, frag_src);
    gl.compileShader(frag);
    if (!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
      console.log(gl.getShaderInfoLog(frag));
      gl.deleteShader(frag);
      throw "Failed to compile fragment shader";
    }
    const vert = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vert, vert_src);
    gl.compileShader(vert);
    if (!gl.getShaderParameter(vert, gl.COMPILE_STATUS)) {
      console.log(gl.getShaderInfoLog(vert));
      gl.deleteShader(vert);
      throw "Failed to compile vertex shader";
    }
    const program = gl.createProgram();
    gl.attachShader(program, frag);
    gl.attachShader(program, vert);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.log(this.gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      throw "Failed to link program";
    }
    initialize(program, gl);
    run(gl);
  }
}
