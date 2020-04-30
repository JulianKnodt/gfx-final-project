let rot_deg = 1;
let speed = 0.1;

const gamma = (color, k=2) => {
  const [r, g, b] = color;
  return [Math.pow(r, k), Math.pow(g, k), Math.pow(b, k)];
}

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
  const [f_src, v_src] = await reload();
  // Loads a new scene after reloading
  const scene = new Scene(f_src, v_src);
  window.scene = scene;

  window.addEventListener('resize', () => {
    scene.resize();
    scene.render();
  }, false);
  const movement = {
    speed: 1,
    "rotation degrees": 3,
  };
  window.addEventListener('keydown', e => {
    if (e.which == 37) scene.rotateHorizontal(-movement["rotation degrees"]);
    if (e.which == 39) scene.rotateHorizontal(movement["rotation degrees"]);
    if (e.which == 38) scene.moveForward(-movement.speed);
    if (e.which == 40) scene.moveForward(movement.speed);
    scene.render();
  });
  const gui = new dat.GUI();
  const camera = gui.addFolder('camera');
  camera.add({
    orthographic: () => {
      scene.orthographic();
      scene.render();
    },
  }, "orthographic");
  camera.add({
    perspective: () => {
      scene.perspective(90);
    }
  }, "perspective");
  camera.add(movement, "speed");
  camera.add(movement, "rotation degrees");
  const s = gui.addFolder('scene');
  s.add({"source":""}, "source", ["teapot.obj", "sponza.obj", "sekiro.obj"])
    .onFinishChange(src => {
      load_obj(src, true);
    });
};

const load_obj = async (name, add_norms=false) => {
  const obj_fetch = await fetch("/resources/" + name);
  const obj_src = await obj_fetch.text();
  const obj = await parse_obj(obj_src);
  const v = [];
  const vn = [];
  const c = [];
  // const vt = [];
  for (let group of obj.groups) {
    for (let [[v0, vt0, vn0], [v1, vt1, vn1], [v2, vt2, vn2]] of group.idxs) {
      const [v0d, v1d, v2d] = [obj.v[v0], obj.v[v1], obj.v[v2]];
      v.push(...v0d, ...v1d, ...v2d);
      if (vn0 === undefined && vn1 === undefined && vn2 === undefined) {
        if (add_norms) {
          const def_norm = normalize(cross(sub(v0d, v1d), sub(v0d, v2d)));
          vn.push(...def_norm, ...def_norm, ...def_norm);
        }
      } else vn.push(...obj.vn[vn0], ...obj.vn[vn1], ...obj.vn[vn2]);
      const mtl = obj.mtls[group.mtl];
      if (mtl) c.push(...gamma(mtl.Kd), ...gamma(mtl.Kd), ...gamma(mtl.Kd));
      else c.push(...vn.slice(-9));
    }
  }
  scene.add_verts(v);
  scene.add_normals(vn);
  scene.add_colors(c);
  scene.render();
};
