const grass = (pos, {
  min_height,
  max_height,
  max_total_bend,
  radius,
  out,
  thinning,
}= {
  out: new IndexList(),
}) => {
  const height = rand_in(min_height, max_height);
  const bend_perp = (new THREE.Vector3(rand_in(-1, 1), 0, rand_in(-1, 1))).normalize();
  const bend_angle = deg_to_rad(rand_in(0, max_total_bend));
  const n = rand_in(5, 7);
  const step = height/n;
  const bend_step = bend_angle/n;

  let curr = pos.clone();
  let dir = new THREE.Vector3(0, 1, 0);
  let curr_ring = out.add_verts(circle(curr, radius, dir));

  for (let i = 0; i < n; i++) {
    const k = (i+1)/n;
    dir.applyAxisAngle(bend_perp, bend_step * Math.sqrt(k));
    dir.normalize();
    curr.addScaledVector(dir, step);
    const next_ring = out.add_verts(circle(curr, Math.pow(1-k, thinning) * radius, dir));
    connect_circles(curr_ring, next_ring).forEach(out.add_face.bind(out));

    curr_ring = next_ring;
  }
  out.add_face(curr_ring);

  return out;
};
