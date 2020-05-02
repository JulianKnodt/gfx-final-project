const movement = {
  speed: 1,
  "rotation degrees": 3,
};

const fragment_shaders = (["cel.frag", "shader.frag"]).reduce((acc, n) => {
  acc[n] = undefined;
  return acc;
}, {});

const vertex_shaders = (["shader.vert", "shader_text.vert"]).reduce((acc, n) => {
  acc[n] = undefined;
  return acc;
}, {});

const gamma = (color, k=2) => {
  const [r, g, b] = color;
  return [Math.pow(r, k), Math.pow(g, k), Math.pow(b, k)];
}

window.onload = async () => {
  if (!window.fetch)
    throw "This browser does not support fetch, many things may break";
  // reloads the shaders
  const reload = () => {
    for (let name in fragment_shaders)
      fragment_shaders[name] = fetch("/shaders/" + name).then(it => it.text());
    for (let name in vertex_shaders)
      vertex_shaders[name] = fetch("/shaders/" + name).then(it => it.text());
  };
  reload();
  const f_src = await fragment_shaders["shader.frag"];
  const v_src = await vertex_shaders["shader.vert"];

  // Loads a new scene after reloading
  const scene = new Scene(f_src, v_src);
  window.scene = scene;

  window.addEventListener('resize', () => {
    scene.resize();
    scene.render();
  }, false);
  window.addEventListener('keydown', e => {
    if (e.which == 37) scene.rotateHorizontal(-movement["rotation degrees"]);
    else if (e.which == 39) scene.rotateHorizontal(movement["rotation degrees"]);
    else if (e.which == 38) scene.moveForward(-movement.speed);
    else if (e.which == 40) scene.moveForward(movement.speed);
    scene.render();
  });

  build_menu(scene);
};

const build_menu = scene => {
  const gui = new dat.GUI();
  const camera = gui.addFolder('camera');
  camera.add({
    orthographic: scene.orthographic.bind(scene),
  }, "orthographic")
    .onFinishChange(scene.render.bind(scene));
  camera.add({
    perspective: scene.perspective.bind(scene, 30),
  }, "perspective").onFinishChange(scene.render.bind(scene));
  camera.add(movement, "speed");
  camera.add(movement, "rotation degrees");
  const s = gui.addFolder('scene');
  s.add({"source":"sponza.obj"}, "source", ["teapot.obj", "sponza.obj", "sekiro.obj"])
    .onFinishChange(src => load_obj(src, true));
  load_obj("sekiro.obj", true);

  s.add({"brush type": "brush1.jpg"}, "brush type", ["brush1.jpg"])
    .onFinishChange(scene.add_brush_texture.bind(scene));
  scene.add_brush_texture("brush1.jpg");

  s.add({"shading texture": "shading1.png"}, "shading texture",
    ["shading1.png", "shading2.png"])
    .onFinishChange(scene.add_shading_texture.bind(scene));
  scene.add_shading_texture("shading1.png");
  s.add({"shading constant": 0.3}, "shading constant", 0, 2)
    .onChange(it => {
      scene.shading_constant = it;
      scene.render();
    });
  s.add({"edge threshold": 0.3}, "edge threshold", 0, 1)
    .onChange(it => {
      scene.edge_threshold = it;
      scene.render();
    });
};

const load_obj = async (name, add_norms=false) => {
  const obj_fetch = await fetch("/resources/" + name);
  const obj_src = await obj_fetch.text();
  const obj = await parse_obj(obj_src);
  const v = [];
  const vn = [];
  const c = [];
  const vt = [];
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
      if (obj.vt[vt0] && obj.vt[vt1] && obj.vt[vt2])
        vt.push(...obj.vt[vt0], ...obj.vt[vt1], ...obj.vt[vt2]);

      const mtl = obj.mtls[group.mtl];
      if (mtl) c.push(...gamma(mtl.Kd), ...gamma(mtl.Kd), ...gamma(mtl.Kd));
      else c.push(...vn.slice(-9));
    }
  }
  scene.add_verts(v);
  scene.add_normals(vn);
  scene.add_colors(c);
  scene.add_vertex_textures(vt);

  scene.render();
};

const isPowerOf2 = n => (n & (n - 1)) == 0;
// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
const load_texture = (url, gl) => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));

  const img = new Image();
  img.onload = () =>  {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                  gl.RGBA, gl.UNSIGNED_BYTE, img);

    if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  img.src = url;

  return texture;
}

