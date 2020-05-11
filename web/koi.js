// fish are basically squished cylinders right

const lerp = (k, start, end) => (1-k)*start + k*end;

const coi = (x, y, z, {
  wave,
  wave_freq,
  size,
  mouth_size,
  body_length,
  face_length,

  fin_length,
  fin_width,
  fin_thickness,
  fin_cant,

  tail_width,
  tail_length,
  end_tail_size,

  whisker_radius,

  out,
} = {
  wave: 5,
  wave_freq: rand_in(0.5, 1.5),
  size: 5,
  mouth_size: Math.sqrt(5),
  body_length: 100,
  face_length: Math.sqrt(100/2),

  fin_length: 20,
  fin_width: 20,
  fin_thickness: 4,
  fin_cant: 0.5,

  tail_width: 0.6,
  tail_length: 20,
  end_tail_size: 2,

  whisker_radius: 0.5,

  out: new IndexList(),
}) => {
  const dir = (new THREE.Vector3(rand_in(-1, 1), rand_in(-1, 1), rand_in(-1, 1))).normalize();
  const up = (new THREE.Vector3(rand_in(-1, 1), rand_in(-1, 1), rand_in(-1, 1))).normalize();
  const right = dir.clone().cross(up);
  up.copy(right.clone().cross(up));

  let curr = new THREE.Vector3(x, y, z);

  let curr_verts = circle(curr, mouth_size, dir);
  let curr_ring = out.add_verts(curr_verts);
  out.add_face(curr_ring);
  // # segments
  const face = ~~rand_in(4, 9);
  const face_step = face_length/face;

  const add_fin = (twd, perp) => {
    const sqrt2 = Math.sqrt(2);
    const f1 = [
      curr.clone()
        .addScaledVector(twd, size),
      curr.clone()
        .addScaledVector(twd, size)
        .addScaledVector(twd, fin_width),

      curr.clone()
        .addScaledVector(twd, size + fin_length)
        .addScaledVector(dir, fin_width),

      curr.clone()
        .addScaledVector(twd, size + fin_length)
        .addScaledVector(dir, fin_width * fin_cant),
    ];
    const f1_idx = out.add_verts(f1);
    out.add_face(f1_idx);
    const f2 = f1.map(it => it.clone().addScaledVector(perp, -fin_thickness));
    const f2_idx = out.add_verts(f2);
    connect_circles(f2_idx, f1_idx).forEach(out.add_face.bind(out));
    out.add_face(f2_idx);
  };

  const add_whiskers = (curr_rad, twd, perp, n = ~~rand_in(0, 20)) => {
    const whisk_seg_len = 3;

    if (n === 0) return;
    let curr_pos = curr.clone().addScaledVector(twd, curr_rad);
    let curr_ring = out.add_verts(circle(curr_pos, whisker_radius, twd));
    for (let i = 0; i < n; i++) {
      const k = (i+1)/n;
      twd.addScaledVector(perp, Math.sin(k))
        .addScaledVector(dir, sqr(k));
      twd.normalize();
      curr_pos.addScaledVector(twd, whisk_seg_len);
      const next_ring = out.add_verts(circle(curr_pos, whisker_radius, twd));
      connect_circles(curr_ring, next_ring).forEach(out.add_face.bind(out));
      curr_ring = next_ring;
    }
    return n;
  }

  for (let i = 0; i < face; i++) {
    curr.addScaledVector(dir, face_step);
    const curr_mouth_size = lerp((i+1)/face, mouth_size, size);
    // TODO add whiskers here at face/3
    if  (i === ~~(face/3)) {
      const n = add_whiskers(curr_mouth_size, right.clone(), up);
      add_whiskers(curr_mouth_size, right.clone().negate(), up.clone().negate(), n);
    }
    const next_ring = out.add_verts(circle(curr, curr_mouth_size, dir))
    // TODO add eyes here at face/2
    connect_circles(curr_ring, next_ring).forEach(out.add_face.bind(out));
    curr_ring = next_ring;
  }

  const body = rand_in(6, 10);
  const body_step = body_length/body;
  const original_dir = dir.clone();
  for (let i = 0; i < body; i++) {
    curr.addScaledVector(dir, body_step);
    const k = (i+1)/body;
    const curr_body_size = (2 - Math.pow(2*k-1, 4)) * size;
    dir.addScaledVector(right, Math.sin(wave_freq * k) * k * wave);
    dir.normalize();

    if (i === ~~(body/5)) {
      const curr_right = dir.clone().cross(up);
      add_fin(curr_right, up);
      add_fin(curr_right.negate(), up);
    } else if (i === ~~(body/2)) {
      const curr_right = dir.clone().cross(up);
      add_fin(up, curr_right);
    }
    const next_ring = out.add_verts(circle(curr, curr_body_size, dir));
    connect_circles(curr_ring, next_ring).forEach(out.add_face.bind(out));
    curr_ring = next_ring;
  }
  // reset right after all the wiggling
  right.copy(dir.clone().cross(up));

  const tail1 = [
    curr.clone()
      .addScaledVector(dir, -2)
      .addScaledVector(up, size)
      .addScaledVector(right, -tail_width/2),
    curr.clone()
      .addScaledVector(dir, -2)
      .addScaledVector(up, -size)
      .addScaledVector(right, -tail_width/2),
    curr.clone()
      .addScaledVector(up, -size*end_tail_size)
      .addScaledVector(right, -tail_width/2)
      .addScaledVector(dir, tail_length),
    curr.clone()
      .addScaledVector(up, size*end_tail_size)
      .addScaledVector(right, -tail_width/2)
      .addScaledVector(dir, tail_length),
  ];
  const t1_idx = out.add_verts(tail1);
  out.add_face(t1_idx);
  const tail2 = tail1.map(it => it.clone().addScaledVector(right, tail_width));
  const t2_idx = out.add_verts(tail2);
  out.add_face(t2_idx);
  connect_circles(t1_idx, t2_idx).forEach(out.add_face.bind(out));

  return out;
};
