const fract = fp => fp % 1;
const kmul = (k, v) => v.map(it => it * k);
const krand = n => fract(Math.sin(n) * 43758.5453123);
const rand = v3 => krand(v3.dot({x: 12.189238, y: 4.3494, z: 37.80234}));

const fbm = (x, h, num_octaves=3, noise=rand) => {
  const g = Math.pow(2, h);
  let freq = 1;
  let amp = 1;
  let t = 0;
  for (let i = 0; i < num_octaves; i++) {
    t += amp*noise(x.clone().multiplyScalar(freq));
    freq *= 2.0;
    amp *= g;
  }
  return t;
};

const to_polar = (x, y) => {
  const l = Math.sqrt(sqr(x) + sqr(y));
  const theta = Math.atan2(y, x);
  return [l, theta];
}


const mountain = ({
  min_rad,
  max_rad,
  amplitude,
  rings,
  precision,
} = {
  min_rad: 200,
  max_rad: 300,
  amplitude: 30,
  rings: 500,
  precision: 150,
}) => {
  const out = new IndexList();

  const center = new THREE.Vector3(0, 0, 0);
  const up = new THREE.Vector3(0, 1, 0);

  const step = (max_rad - min_rad)/rings;

  let curr_rad = min_rad;
  // start out with a ring on the ground
  let curr_verts = circle(center, curr_rad, up, precision);
  let curr_ring = out.add_verts(curr_verts);
  for (let i = 0; i < rings; i++) {
    curr_rad += step;
    const k = 2 * (0.5 - Math.abs(((i+1)/rings - 0.5)));
    const next_verts = circle(center, curr_rad, up, precision)
      .map(it => {
        const [x, z] = [it.x, it.z];
        const [r, theta] = to_polar(x, z);
        it.x = r;
        it.z = theta;
        it.y = Math.max(fbm(it, 0.5) * amplitude * k, 0);
        it.x = x;
        it.z = z;
        return it;
      }).map((it, i, arr) => {
        const prev = arr[i === 0 ? arr.length - 1 : i -1];
        const inner = curr_verts[i];
        const next = arr[(i+1)%arr.length];
        it.y = (it.y + inner.y + next.y + prev.y)/4;
        return it;
      });
    const next_ring = out.add_verts(next_verts);
    connect_circles(curr_ring, next_ring).forEach(out.add_face.bind(out));
    curr_verts = next_verts;
    curr_ring = next_ring;
  }
  curr_rad += step;
  const last_ring = out.add_verts(circle(center, curr_rad, up, precision));
  connect_circles(curr_ring, last_ring).forEach(out.add_face.bind(out));
  return out;
};
