const fs = require('fs');

// Hacky way to read in functions
eval(String(fs.readFileSync("./obj.js")));

const sponza = String(fs.readFileSync("../resources/sponza.obj"));
const local_mtl = name => String(fs.readFileSync(`../resources/${name}`));

parse_obj(sponza, local_mtl).then(it => {
  console.log(it.groups[0].idxs);
});

