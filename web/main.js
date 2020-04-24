window.onload = async () => {
  if (!window.fetch)
    throw "This browser does not support fetch, many things may break";
  // reloads the shaders
  const reload = async () => {
    let frag_shader = fetch("/shaders/shader.frag");
    let vert_shader = fetch("/shaders/shader.vert");
    frag_shader = await frag_shader;
    vert_shader = await vert_shader;
    window.frag_shader = await frag_shader.text();
    window.vert_shader = await vert_shader.text();
    return [window.frag_shader, window.vert_shader];
  };
  const canvas = document.getElementById('c');
  const context = canvas.getContext('webgl');
  const resizeCanvas = () => {
    canvas.width = window.innerWidth-10;
    canvas.height = window.innerHeight;
    // TODO redraw here
  }
  window.addEventListener('resize', resizeCanvas, false);
  resizeCanvas();
  const [f_src, v_src] = await reload();
  // Loads a new scene after reloading
  window.scene = new Scene();
};
