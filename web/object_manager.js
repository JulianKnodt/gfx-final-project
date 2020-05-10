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

class VertexManager {
  constructor() {
    this.v = new Float32Array([]);
    this.vn = new Float32Array([]);
    this.c = new Float32Array([]);

  }
  add_bamboo(il) { this.bamboo = il; }
  add_obj(obj) { this.obj = obj; }

  update() {
    const vs = [];
    const vns = [];
    const cs = [];
    if (this.obj) {
      this.obj.v.forEach(v => vs.push(v));
      this.obj.vn.forEach(vn => vns.push(vn));
      this.obj.c.forEach(c => cs.push(c));
    }

    if (this.bamboo) {
      const [v, vn] = this.bamboo.ordered_verts();
      v.forEach(v => vs.push(v));
      vn.forEach(vn => vns.push(vn));
      vn.forEach(c => cs.push(c));
    }
    this.v = new Float32Array(vs);
    this.vn = new Float32Array(vns);
    this.c = new Float32Array(cs);
  }
  mark_scene(scene) {
    this.update();
    scene.add_verts(this.v);
    scene.add_normals(this.vn);
    scene.add_colors(this.c);

    scene.render();
  }
}
