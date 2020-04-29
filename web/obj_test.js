const fs = require('fs');

// Hacky way to read in functions
eval(String(fs.readFileSync("./obj.js")));

const sponza = String(fs.readFileSync("../resources/sponza.obj"));
const get_mtl = name => String(fs.readFileSync(`../resources/${name}`));

parse_obj(sponza, get_mtl).then(console.log);

