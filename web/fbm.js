const fract = fp => fp % 1;
const kmul = (k, v) => v.map(it => it * k);
const krand = n => fract(Math.sin(n) * 43758.5453123);
const dot = ([x,y,z], [i,j,k]) => x * i + y * j + z * k;
const rand = v3 => krand(dot(v3, [12.189238, 4.3494, 37.80234]));

const fbm = (x, h, num_octaves=3, noise=rand) => {
  const g = Math.pow(2, h);
  let freq = 1;
  let amp = 1;
  let t = 0;
  for (let i = 0; i < num_octaves; i++) {
    t += amp*noise(kmul(freq, x));
    freq *= 2.0;
    amp *= g;
  }
  return t;
};



// generates 3rd coordinate given two input coordinates
const generate = (w, h, out=[]) => {
  for (let i = 0; i < w; i++) {
    for (let j = 0; j < h; j++) {
      out.push(fbm([i, j, 0], 0.5));
    }
  }
  return out;
}

