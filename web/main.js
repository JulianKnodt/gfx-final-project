const help_text = `
Move forward and backward using up and down arrow keys
Turn using left and right arrows and tilt up and down using q and e.
For more macroscopic movement, use the sliders in the camera section.`;

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
    } else if (e.which == 81 /* q */) {
      scene.rotateVertical(movement.rotation_degrees);
    } else if (e.which == 69 /* e */) {
      scene.rotateVertical(-movement.rotation_degrees);
    }
    scene.render();
  });

  let prev_x = null;
  let prev_y = null;
  window.onmousedown = e => {
    if (e.target.tagName.toLowerCase() !== 'canvas') return;
    prev_x = e.clientX;
    prev_y = e.clientY;
    window.onmouseup = e => {
      window.onmousemove = null;
    };
    window.onmousemove = e => {
      const delta_x = (e.clientX - prev_x)/window.innerWidth;
      const delta_y = (e.clientY - prev_y)/window.innerHeight;

      let right = scene.at.clone().cross(scene.up)
      scene.at.addScaledVector(right, delta_x);
      scene.at.normalize();
      right = scene.at.clone().cross(scene.up);
      scene.at.addScaledVector(scene.up, delta_y);
      scene.at.normalize();
      scene.up = right.cross(scene.at);
      scene.look_at();
      scene.render();

      prev_x = e.clientX;
      prev_y = e.clientY;
    };
  };

  build_menu(scene);
  // window.requestAnimationFrame(scene.loop.bind(scene));
};

const build_menu = scene => {
  const gui = new dat.GUI();
  const scene_settings = {
    use_default_normals: true,
    source: "sekiro.obj",
    "brush type": "brush1.jpg",
    shading_constant: scene.shading_constant,
    edge_threshold: scene.edge_threshold,
    smoothness: scene.shading_smoothness,
    fov: 30,
    is_perspective: true,

    "ink density": 0.3,
    "brush footprint": 0.5,
    ink_dryness: scene.ink_dryness,
  };
  const camera = gui.addFolder('camera');
  camera.add({
      orthographic: () => {
        scene_settings.is_perspective = false;
        scene.orthographic();
      },
    }, "orthographic")
    .onFinishChange(scene.render.bind(scene));
  camera.add({
    perspective: () => {
      scene.perspective(scene_settings.fov);
      scene_settings.is_perspective = true;
    },
  }, "perspective").onFinishChange(scene.render.bind(scene));
  camera.add(scene_settings, "fov", 5, 180).step(1)
    .onChange(it => {
      scene.perspective(it)
      scene_settings.is_perspective = true;
      scene.render();
    });
  const update_camera = () => {
    if (scene_settings.is_perspective) scene.perspective(scene_settings.fov);
    else scene.orthographic();
    scene.render();
  };
  camera.add(scene, "screen_size", 0.001, 1).onChange(update_camera);
  camera.add(scene, "n", 0.1, 10).onChange(update_camera);
  camera.add(scene, "f", 1000, 10000).onChange(update_camera);
  const update_cam = () => {
    scene.look_at();
    scene.render();
  };
  for (let v of ["x", "y", "z"])
    camera.add(scene.pos, v, -200, 500).onChange(update_cam);

  camera.add({
    "reset": () => {
      scene.at.set(0, 0, 1);
      scene.up.set(0, 1, 0);
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
    "shanghai.obj", "banyan.obj", "sphere.obj", /*"wind_spirit.obj",*/ "bus_stop.obj",
    "lantern.obj", "neotokyo.obj", "shenron.obj", "isabelle.obj"];
  s.add(scene_settings, "source", src_files)
    .onFinishChange(src => load_obj(src, scene_settings.use_default_normals));
  load_obj(scene_settings.source, scene_settings.use_default_normals);

  s.add(scene_settings, "brush type", ["brush1.jpg", "brush2.jpg", "brush3.png"])
    .onFinishChange(txt => {
      scene.add_brush_texture(txt);
      scene.render();
    });
  scene.add_brush_texture("brush1.jpg");
  scene_settings.remove = () => {
    window.vm.add_obj(null);
    window.vm.mark_scene(scene);
  };

  const scale_settings = {
    curr_scale: 1,
    rescale_amt: 1.1,
  };

  s.add(scale_settings, "rescale_amt", 0.5, 1.5);
  scale_settings.rescale = () => {
    scale_settings.curr_scale *= scale_settings.rescale_amt;
    window.vm.rescale_obj(scene, scale_settings.rescale_amt);
  };
  scale_settings.reset_scale = () => {
    window.vm.rescale_obj(scene, 1/scale_settings.curr_scale);
    scale_settings.curr_scale = 1;
  };

  s.add(scale_settings, "rescale");
  s.add(scale_settings, "reset_scale");


  s.add(scene_settings, "remove");

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
      seal_img.style.position = "absolute"
      seal_img.style.right = '4vw'
      seal_img.style.bottom = '4vw'
      seal_img.style.width = '4vw'
      seal_img.style.height = '4vw'
      seal_img.style.backgroundColor = 'red';
      seal_img.style.borderRadius = '5px';
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
    base_y: 0,
    min_seg_height: 5,
    max_seg_height: 20,
    min_stalk_radius: 2,
    max_stalk_radius: 3,
    max_segs: 30,
    min_segs: 4,
    bevel_height: 4,
    max_total_bend: 15,
    num: 100,
  };
  bb_settings.render = () => {
    const il = new IndexList();
    for (let i = 0; i < bb_settings.num; i++) {
      const dir = (new THREE.Vector3(rand_in(-1, 1), 0, rand_in(-1, 1)))
        .normalize()
        .multiplyScalar(rand_in(bb_settings.min_radius, bb_settings.max_radius));
      bamboo(dir.x, dir.z, {...bb_settings, out: il});
    }
    window.vm.add_generated('bamboo', il);
    window.vm.mark_scene(scene);
  };
  bb_settings.remove = () => {
    window.vm.add_generated('bamboo', null);
    window.vm.mark_scene(scene);
  }
  bb.add(bb_settings, "min_radius", 0, 1000);
  bb.add(bb_settings, "max_radius", 0, 1000);
  bb.add(bb_settings, "base_y", -1000, 1000);
  bb.add(bb_settings, "num", 0, 500).step(1);
  bb.add(bb_settings, "bevel_height", 0.1, 10);
  bb.add(bb_settings, "max_total_bend", 0, 180);

  const stalk = bb.addFolder('stalk')
  stalk.add(bb_settings, "min_seg_height", 1, 20);
  stalk.add(bb_settings, "max_seg_height", 1, 40);
  stalk.add(bb_settings, "min_segs", 1, 20).step(1);
  stalk.add(bb_settings, "max_segs", 1, 40).step(1);
  stalk.add(bb_settings, "min_stalk_radius", 0.1, 10);
  stalk.add(bb_settings, "max_stalk_radius", 0.1, 10);

  bb.add(bb_settings, "render");
  bb.add(bb_settings, "remove");

  const mtn = scenery.addFolder('mountains');
  const mtn_settings = {
    min_rad: 500,
    max_rad: 600,
    amplitude: 30,
    rings: 5,
    precision: 150,
  };
  mtn_settings.render = () => {
    window.vm.add_generated('mountain', mountain(mtn_settings));
    window.vm.mark_scene(scene);
  };
  mtn_settings.remove = () => {
    window.vm.add_generated('mountain', null);
    window.vm.mark_scene(scene);
  };

  mtn.add(mtn_settings, "min_rad", 0, 1000);
  mtn.add(mtn_settings, "max_rad", 10, 2000);
  mtn.add(mtn_settings, "amplitude", 1, 100);
  mtn.add(mtn_settings, "rings", 1, 100).step(1);
  mtn.add(mtn_settings, "precision", 10, 200).step(1);

  mtn.add(mtn_settings, "render");
  mtn.add(mtn_settings, "remove");

  const koi = scenery.addFolder('koi');
  const koi_settings = {
    x: 0,
    y: 0,
    z: 0,
    wave: 3,
    wave_freq: 0.5,
    size: 5,
    mouth_size: Math.sqrt(5),
    body_length: 100,
    face_length: Math.sqrt(50),

    fin_length: 20,
    fin_width: 20,
    fin_thickness: 4,
    fin_cant: 2,

    tail_width: 0.6,
    tail_length: 20,
    end_tail_size: 2,

    whisker_radius: 0.5,
  };
  koi_settings.render = () => {
    koi_settings.out = new IndexList();
    window.vm.add_generated('koi',
      coi(koi_settings.x, koi_settings.y, koi_settings.z, koi_settings));
    window.vm.mark_scene(scene);
  };
  koi_settings.remove = () => {
    window.vm.add_generated('koi', null);
    window.vm.mark_scene(scene);
  }
  koi.add(koi_settings, "x", -1000, 1000);
  koi.add(koi_settings, "y", -1000, 1000);
  koi.add(koi_settings, "z", -1000, 1000);

  koi.add(koi_settings, "wave", 0, 10);
  koi.add(koi_settings, "wave_freq", -1.5, 1.5);
  koi.add(koi_settings, "size", 1, 10);
  koi.add(koi_settings, "mouth_size", 0.1, 10);
  const fin = koi.addFolder("fin")
  fin.add(koi_settings, "fin_length", 0, 20);
  fin.add(koi_settings, "fin_width", 0, 20);
  fin.add(koi_settings, "fin_thickness", 0, 10);
  fin.add(koi_settings, "fin_cant", 0, 3);

  const tail = koi.addFolder('tail');
  tail.add(koi_settings, 'tail_width', 0, 5);
  tail.add(koi_settings, 'tail_length', 1, 50);
  tail.add(koi_settings, 'end_tail_size', 0, 2);

  koi.add(koi_settings, "render");
  koi.add(koi_settings, "remove");

  const grss = scenery.addFolder('grass');
  const grass_settings = {
    min_create_radius: 0,
    max_create_radius: 200,
    num: 500,
    max_group_size: 5,
    radius: 1,
    min_height: 20,
    max_height: 100,
    max_total_bend: 90,
    thinning: 1.2
  };
  grass_settings.render = () => {
    grass_settings.out = new IndexList();
    for (let i = 0; i < grass_settings.num; i++) {
      const pos = (new THREE.Vector3(rand_in(-1, 1), 0, rand_in(-1, 1)))
        .normalize()
        .multiplyScalar(rand_in(
          grass_settings.min_create_radius, grass_settings.max_create_radius));
      // pos.y = base_y;
      const group_size = ~~rand_in(1, grass_settings.max_group_size);
      for (let i = 0; i < group_size; i++) grass(pos, grass_settings);
    };
    window.vm.add_generated('grass', grass_settings.out);
    window.vm.mark_scene(scene);
  };
  grass_settings.remove = () => {
    window.vm.add_generated('grass', null);
    window.vm.mark_scene(scene);
  };
  grss.add(grass_settings, "min_create_radius", 0, 500);
  grss.add(grass_settings, "max_create_radius", 10, 1000);
  grss.add(grass_settings, "num", 1, 5000).step(1);
  grss.add(grass_settings, "radius", 0.1, 5);
  grss.add(grass_settings, "min_height", 0.1, 50);
  grss.add(grass_settings, "max_height", 0.1, 200);
  grss.add(grass_settings, "max_total_bend", 0, 180);
  grss.add(grass_settings, "thinning", 0.1, 2);
  grss.add(grass_settings, "render");
  grss.add(grass_settings, "remove");

  gui.add({help: () => alert(help_text)}, "help");
};

const get_bounds = vs => {
  const min = new THREE.Vector3(Infinity);
  const max = new THREE.Vector3(-Infinity);
  for (let [x,y,z] of vs) {
    min.x = Math.min(min.x, x);
    min.y = Math.min(min.y, y);
    min.z = Math.min(min.z, z);

    max.x = Math.max(max.x, x);
    max.y = Math.max(max.y, y);
    max.z = Math.max(max.z, z);
  }
  return [min, max];
};


const load_obj = async (name, add_norms=false, scale=undefined) => {
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

