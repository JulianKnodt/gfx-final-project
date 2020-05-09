class IndexList {
  constructor() {
    this.verts = [];
    this.faces = [];
  }
  add_verts(vs) {
    return vs.map(v => this.verts.push(v) - 1);
  }
  add_face(f) { this.faces.push(f) }
  // triangulates all the faces of this index list
  triangulate() {
    const triangles = [];
    for (let f of this.faces) {
      const fixed = f[0];
      for (let i = 1; i < f.length-1; i++) triangles.push([fixed, f[i], f[i+1]]);
    }
    this.faces = triangles;
  }
  // computes the normals of this index list
  normals() {
    const normal_sets = {};
    this.triangulate();
    for (let [v0, v1, v2] of this.faces) {
      const e0 = this.verts[v0].clone().sub(this.verts[v1]);
      const e1 = this.verts[v0].clone().sub(this.verts[v2]);
      const norm = e0.cross(e1).normalize();
      (normal_sets[v0] = normal_sets[v0] || []).push(norm);
      (normal_sets[v1] = normal_sets[v1] || []).push(norm);
      (normal_sets[v2] = normal_sets[v2] || []).push(norm);
    }
    const out = [];
    for (let k in normal_sets) {
      const normals = normal_sets[k];
      out[Number(k)] = normals.reduce((a, n) => a.add(n)).normalize();
    }
    return out;
  }
  // combines this index list with another index list
  merge(other) {
    const base = this.verts.length;
    this.verts.push(...other.verts);
    this.faces.push(...other.faces.map(f => f.map(it => it + base)));
    return this;
  }
  ordered_verts() {
    const de = ({x, y, z}) => [x, y, z];
    const v = [];
    const vn = [];
    const n = this.normals();
    for (let [v0, v1, v2] of this.faces) {
      v.push(...de(this.verts[v0]), ...de(this.verts[v1]), ...de(this.verts[v2]));
      vn.push(...de(n[v0]), ...de(n[v1]), ...de(n[v2]));
    }
    return [v, vn];
  }
}


// just assume they're not all 0
const perp = v => {
  if (v.y !== 0) return new THREE.Vector3(v.y, -v.x, 0);
  else return new THREE.Vector3(v.z, 0, -v.x);
};

// creates a circle of vertices around some center
const circle = (center, rad, up, n=6) => {
  const out = [];
  const per = deg_to_rad(360/n);
  const curr = perp(up).normalize();
  for (let i = 0; i < n; i++) {
    out.push(curr.clone().multiplyScalar(rad).add(center));
    curr.applyAxisAngle(up, per);
  }
  return out;
}

// returns the faces that connect the two circles
// number of vertices
const connect_circles = (a, b) => {
  // assert(a.length == b.length)
  const len = a.length;
  const out = [];
  for (let i = 0; i < len; i++) out.push([a[i], b[i], b[(i+1)%len], a[(i+1)%len]]);
  return out;
};

const rand_in = (min, max) => Math.random() * (max-min) + min;

const qerp = (k, start, end) => {
  k = sqr(k);
  return (1-k)*start + k*end;
}

// takes a position and returns a list of triangles to render
const bamboo = (x, z,
  {
    min_seg_height,
    max_seg_height,
    max_total_bend,
    min_stalk_radius,
    max_stalk_radius,
    max_segs,
    min_segs,
    verts_per_circle,
    bevel_height,
  } = {
    min_seg_height: 5,
    max_seg_height: 10,
    max_total_bend: 30,
    min_stalk_radius: 5,
    max_stalk_radius: 7,
    max_segs: 15,
    min_segs: 6,
    verts_per_circle: 6,
    bevel_height: 10,
  }) => {
  const out = new IndexList();

  // Select random direction to bend in
  const bend = (new THREE.Vector3(rand_in(-1, 1), 0, rand_in(-1, 1))).normalize();

  const stalk_radius = rand_in(min_stalk_radius, max_stalk_radius);

  // maintain direction upwards
  let up = new THREE.Vector3(0, 1, 0);
  let curr = new THREE.Vector3(x, 0, z);

  const right = up.clone().cross(bend);

  // generate random number of segments
  const segments = ~~rand_in(min_segs, max_segs);

  // how much is each segment allowed to bend
  const bend_max = max_total_bend/segments;

  let curr_ring = out.add_verts(circle(curr, stalk_radius, up, verts_per_circle));

  const add_leaf = (start, seg) => {
    // downward pointing
    const dir = (new THREE.Vector3(rand_in(-1, 1), -5, rand_in(-1, 1))).normalize();
    const normal = (new THREE.Vector3(1, 0, 0)).cross(dir);
    const ang = deg_to_rad(rand_in(5, 70));
    const bottom = out.add_verts([
      start.clone(),
      start.clone().addScaledVector(dir.clone().applyAxisAngle(normal, -ang), 0.33 * seg),
      start.clone().addScaledVector(dir, seg),
      start.clone().addScaledVector(dir.clone().applyAxisAngle(normal, ang), 0.33 * seg),
    ]);
    seg = Math.sqrt(seg);
    start = start.clone().addScaledVector(normal, 1);
    const bump = out.add_verts([
      start,
      start.clone().addScaledVector(dir.clone().applyAxisAngle(normal, -ang), 0.33 * seg),
      start.clone().addScaledVector(dir, seg),
      start.clone().addScaledVector(dir.clone().applyAxisAngle(normal, ang), 0.33 * seg),
    ]);
    connect_circles(bottom, bump).forEach(it => out.add_face(it));
    out.add_face(bump);
  };

  // adds a branch to this bamboo
  const add_branch = (radius, segment, r0, r1) => {
    const len = r0.length;
    const idx = ~~(Math.random() * len);
    let curr_face = [r0[idx], r1[idx], r1[(idx+1)%len], r0[(idx+1)%len]];
    const e0 = out.verts[curr_face[0]].clone().sub(out.verts[curr_face[1]]);
    const e1 = out.verts[curr_face[0]].clone().sub(out.verts[curr_face[2]]);
    const dir = e0.cross(e1).normalize()
      .add((new THREE.Vector3(rand_in(-1, 1), rand_in(-1, 1), rand_in(-1, 1)))
        .normalize()
        .divideScalar(2)
      ).normalize();
    let curr = curr_face.reduce((a, n) => a.add(out.verts[n]), new THREE.Vector3(0))
      .divideScalar(4);
    const num_segments = rand_in(4, segment);
    const seg_len = Math.min(3, Math.sqrt(segment));
    for (let i = 0; i < num_segments; i++) {
      curr.addScaledVector(dir, seg_len);
      const next_face = out.add_verts(circle(curr, radius, dir, 4));
      connect_circles(curr_face, next_face).forEach(it => out.add_face(it));
      curr_face = next_face;
      if (Math.pow(Math.random(), 8) < (i+1)/num_segments) {
        add_leaf(curr, segment)
        dir.y -= 0.2;
        dir.normalize()
      }
    }
  };

  // adds a bevel at the joints of a given height and with a given number of rings
  const bevel_rad = 1.25 * Math.sqrt(sqr(stalk_radius) + sqr(bevel_height/2));
  const add_bevel = (iter, n=15) => {
    // round to nearest two and take half
    n = ((n+1) ^ 1)/2;
    const step = bevel_height/n;
    let prev_ring;
    for (let i = 0; i < n; i++) {
      curr.addScaledVector(up, step);
      const k = (i+1)/n;
      const rad = qerp(k, stalk_radius, bevel_rad);
      const next_ring = out.add_verts(circle(curr, rad, up));
      connect_circles(curr_ring, next_ring).forEach(it => out.add_face(it));
      prev_ring = curr_ring;
      curr_ring = next_ring;
    }
    const num_branches = ~~(sqr(iter/segments) * Math.random() * 6);
    for (let i = 0; i < num_branches; i++) add_branch(1, iter, prev_ring, curr_ring);

    for (let i = 0; i < n; i++) {
      curr.addScaledVector(up, step);
      const k = 1-((i+1)/n);
      const rad = qerp(k, stalk_radius, bevel_rad);
      const next_ring = out.add_verts(circle(curr, rad, up));
      connect_circles(curr_ring, next_ring).forEach(it => out.add_face(it));
      curr_ring = next_ring;
    }
  }

  for (let i = 0; i < segments; i ++) {
    const h = rand_in(min_seg_height, max_seg_height);
    const bend = deg_to_rad(Math.random() * bend_max) * Math.sqrt(i/segments);

    up.applyAxisAngle(right, bend)
    curr.addScaledVector(up, h);

    const next_ring = out.add_verts(circle(curr, stalk_radius, up))
    // TODO branching should go here

    // also think about adding an intermediate
    // ring which is slightly smaller

    connect_circles(curr_ring, next_ring).forEach(it => out.add_face(it));

    curr_ring = next_ring;
    add_bevel(i);
  }
  // cap the top
  out.add_face(curr_ring);
  return out;
};
