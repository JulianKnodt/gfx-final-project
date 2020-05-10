const movement = {
  speed: 2,
  rotation_degrees: 3,
};


const clamp = (v, l, h) => Math.max(Math.min(v, h), l);

const fragment_shaders = (["cel.frag", "shader.frag", "ink.frag"]).reduce((acc, n) => {
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
  window.vm = new VertexManager();
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
    if (e.which == 37) {
      // scene.deg_velocity = clamp(scene.deg_velocity - movement.rotation_degrees, -1, 1);
      scene.rotateHorizontal(-movement.rotation_degrees);
    } else if (e.which == 39) {
      // scene.deg_velocity = clamp(scene.deg_velocity + movement.rotation_degrees, -1, 1);
      scene.rotateHorizontal(movement.rotation_degrees);
    } else if (e.which == 38) {
      // scene.velocity.addScaledVector(scene.at, -movement.speed);
      // scene.velocity.clampScalar(-0.04, 0.04);
      scene.moveForward(-movement.speed);
    } else if (e.which == 40) {
      // scene.velocity.addScaledVector(scene.at, movement.speed);
      // scene.velocity.clampScalar(-0.04, 0.04);
      scene.moveForward(movement.speed);
    }
    scene.render();
  });

  build_menu(scene);
  // window.requestAnimationFrame(scene.loop.bind(scene));
};

const build_menu = scene => {
  const gui = new dat.GUI();
  const scene_settings = {
    "use_default_normals": true,
    "source": "sekiro.obj",
    "brush type": "brush1.jpg",
    "shading_constant": scene.shading_constant,
    "edge_threshold": scene.edge_threshold,
    "smoothness": scene.shading_smoothness,
    "fov": 30,

    "ink density": 0.3,
    "brush footprint": 0.5,
    "ink_dryness": scene.ink_dryness,
  };
  const camera = gui.addFolder('camera');
  camera.add({
    orthographic: scene.orthographic.bind(scene),
  }, "orthographic")
    .onFinishChange(scene.render.bind(scene));
  camera.add({
    perspective: () => scene.perspective(scene_settings.fov),
  }, "perspective").onFinishChange(scene.render.bind(scene));
  camera.add(scene_settings, "fov", 5, 180).step(1)
    .onChange(it => {
      scene.perspective(it)
      scene.render();
    });
  const update_cam = () => {
    scene.look_at();
    scene.render();
  };
  for (let v of ["x", "y", "z"])
    camera.add(scene.pos, v, -200, 500).onChange(update_cam);

  camera.add({
    "reset": () => {
      scene.pos.set(0, 0, 0);
      scene.look_at();
      scene.render();
    }
  }, "reset");
  camera.add(movement, "speed");
  camera.add(movement, "rotation_degrees");
  const sm = camera.addFolder('simulated movement');
  const sim_vel = new THREE.Vector3();
  const update_vel = () => {
    scene.velocity = sim_vel;
    scene.render();
  };
  const cap = 100;
  sm.add(sim_vel, "x", -100, 100).onChange(update_vel);
  sm.add(sim_vel, "y", -100, 100).onChange(update_vel);
  sm.add(sim_vel, "z", -100, 100).onChange(update_vel);

  const s = gui.addFolder('scene');
  s.add(scene_settings, "use_default_normals")
    .onFinishChange(it => load_obj(scene_settings["source"], it));
  const src_files = ["teapot.obj", "sponza.obj", "sekiro.obj", "Shujiro_Castle.obj", "torii.obj",
    "shanghai.obj", "sakura.obj", "banyan.obj", "catskill_statue.obj", "sphere.obj",
    "neotokyo.obj"];
  s.add(scene_settings, "source", src_files)
    .onFinishChange(src => load_obj(src, scene_settings.use_default_normals));
  load_obj(scene_settings.source, scene_settings.use_default_normals);

  s.add(scene_settings, "brush type", ["brush1.jpg", "brush2.jpg", "brush3.png"])
    .onFinishChange(txt => {
      scene.add_brush_texture(txt);
      scene.render();
    });
  scene.add_brush_texture(scene_settings["brush type"]);

  s.add({"shading texture": "shading1.png"}, "shading texture",
    ["shading1.png", "shading2.png"])
    .onFinishChange(scene.add_shading_texture.bind(scene));
  scene.add_shading_texture("shading1.png");

  const drawing = s.addFolder("Drawing");
  // random shading constant
  drawing.add(scene_settings, "shading_constant", 0, 3)
    .onChange(it => {
      scene.shading_constant = it;
      scene.render();
    });
  drawing.add(scene_settings, "edge_threshold", 0, 1)
    .onChange(it => {
      scene.edge_threshold = it;
      scene.render();
    });
  drawing.add(scene_settings, "smoothness", 0.0, 1.0)
    .onChange(it => {
      scene.shading_smoothness = it;
      scene.render();
    });
  drawing.add(scene_settings, "ink_dryness", -1, 1)
    .onChange(it => {
      scene.ink_dryness = it;
      scene.render();
    });

  const scenery = gui.addFolder('scenery');
  scenery.add({"bg": false}, 'bg').onChange(use_bg => {
    const body = document.querySelector("body");
    if (use_bg) {
      body.style.backgroundImage =
        "url(https://cdn.inspirationhut.net/wp-content/uploads/2014/09/rice-paper.jpg)";
    } else body.style.backgroundImage = "none";
  });

  scenery.add({"seal": false}, "seal").onChange(add =>  {
    if (add) {
      const seal_img = document.createElement('div');
      seal_img.id = 'seal';
      // seal_img.style = {
        seal_img.style.position = "absolute"
        seal_img.style.right = '4vw'
        seal_img.style.bottom = '4vw'
        seal_img.style.width = '4vw'
        seal_img.style.height = '4vw'
        seal_img.style.zIndex = '-1'
        seal_img.style.backgroundColor = 'red';
        seal_img.style.borderRadius = '5px';
      // };
      document.body.appendChild(seal_img);
    } else document.getElementById('seal').remove();
  });

  const sun = scenery.addFolder('sun');
  const sun_pos = scene.sun;
  for (let v of ["x", "y", "z"])
    sun.add(sun_pos, v, -1000, 1000).onChange(_ => {
      scene.sun = sun_pos;
      scene.render();
    });

  const bb = scenery.addFolder('bamboo');
  const bb_settings = {
    min_radius: 100,
    max_radius: 200,
    min_seg_height: 5,
    max_seg_height: 20,
    min_stalk_radius: 2,
    max_stalk_radius: 8,
    max_segs: 30,
    min_segs: 4,
    bevel_height: 8,
    max_total_bend: 15,
    num: 100,
  };
  bb_settings.render = () => {
    const il = new IndexList();
    for (let i = 0; i < bb_settings.num; i++) {
      const dir = (new THREE.Vector3(rand_in(-1, 1), 0, rand_in(-1, 1)))
        .normalize()
        .multiplyScalar(rand_in(bb_settings.min_radius, bb_settings.max_radius));
      il.merge(bamboo(dir.x, dir.z, bb_settings));
    }
    window.vm.add_bamboo(il);
    window.vm.mark_scene(scene);
  };
  bb.add(bb_settings, "min_radius", 0, 1000);
  bb.add(bb_settings, "max_radius", 0, 1000);
  bb.add(bb_settings, "num", 0, 500).step(1);
  bb.add(bb_settings, "min_seg_height", 1, 20);
  bb.add(bb_settings, "max_seg_height", 1, 40);

  bb.add(bb_settings, "min_segs", 1, 20).step(1);
  bb.add(bb_settings, "max_segs", 1, 40).step(1);

  bb.add(bb_settings, "min_stalk_radius", 0.1, 10);
  bb.add(bb_settings, "max_stalk_radius", 0.1, 10);
  bb.add(bb_settings, "bevel_height", 0.1, 10);
  bb.add(bb_settings, "max_total_bend", 0, 180);

  bb.add(bb_settings, "render");

  const mtn = scenery.addFolder('mountains');
  const mtn_settings = {
    render: () => {
    },
  };
  mtn_settings.render = () => {
    const il = mountain();
    const [v, vn]  = il.ordered_verts();
    scene.add_verts(new Float32Array(v));
    scene.add_normals(new Float32Array(vn));
    scene.add_colors(new Float32Array(vn));
    scene.render();
  }
  mtn.add(mtn_settings, "render");
};

const load_obj = async (name, add_norms=false) => {
  const obj_fetch = await fetch("/resources/" + name);
  const obj_src = await obj_fetch.text();
  const obj = await parse_obj(obj_src);
  if (add_norms) obj.vn = default_normals(obj);

  const v = [];
  const vn = [];
  const c = [];
  const vt = [];
  for (let group of obj.groups) {
    for (let [[v0, vt0, vn0], [v1, vt1, vn1], [v2, vt2, vn2]] of group.idxs) {
      const [v0d, v1d, v2d] = [obj.v[v0], obj.v[v1], obj.v[v2]];
      v.push(...v0d, ...v1d, ...v2d);
      if (add_norms) vn.push(...obj.vn[v0], ...obj.vn[v1],  ...obj.vn[v2]);
      else if (obj.vn[vn0] && obj.vn[vn1] && obj.vn[vn2])
        vn.push(...obj.vn[vn0], ...obj.vn[vn1], ...obj.vn[vn2]);
      if (obj.vt[vt0] && obj.vt[vt1] && obj.vt[vt2])
        vt.push(...obj.vt[vt0], ...obj.vt[vt1], ...obj.vt[vt2]);

      const mtl = obj.mtls[group.mtl];
      if (mtl) c.push(...gamma(mtl.Kd), ...gamma(mtl.Kd), ...gamma(mtl.Kd));
      else c.push(...vn.slice(-9));
    }
  }
  window.vm.add_obj({v, vn, c});
  window.vm.mark_scene(scene);
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
    window.scene.render();
  };
  img.src = url;

  return texture;
}

