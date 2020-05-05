const sub = ([x,y,z], [i,j,k]) => [x-i,y-j,z-k];
const cross = ([x, y, z], [i, j, k]) => ([
    y * k - z * j,
    z * i - x * k,
    x * j - y * i,
]);
const add = ([x,y,z], [i,j,k]) => [x+i,y+j,z+k];
const kdiv = ([x,y,z], k) => [x/k,y/k,z/k];

const normalize = ([x, y, z]) => {
  const magn = Math.sqrt(x*x + y*y + z*z);
  return [x/magn, y/magn, z/magn];
};


// produces a set of vertex normals for each vertex in an obj file
function default_normals(obj) {
  const normal_sets = {};
  for (let g of obj.groups) {
    for (let [[v0], [v1], [v2]] of g.idxs) {
      const e0 = sub(obj.v[v0], obj.v[v1]);
      const e1 = sub(obj.v[v0], obj.v[v2]);
      const norm = normalize(cross(e0, e1));
      (normal_sets[v0] = normal_sets[v0] || []).push(norm);
      (normal_sets[v1] = normal_sets[v1] || []).push(norm);
      (normal_sets[v2] = normal_sets[v2] || []).push(norm);
    }
  }
  const out = [];
  for (let k in normal_sets) {
    const normals = normal_sets[k];
    out[Number(k)] = kdiv(normals.reduce(add), normals.length);
  }
  return out;
}
