#!/usr/local/bin/node

const fs = require('fs');

// Hacky way to read in functions
eval(String(fs.readFileSync("./obj.js")));
eval(String(fs.readFileSync("./default_normals.js")));

const obj_file = String(fs.readFileSync("../resources/sekiro.obj"));
const local_mtl = name => String(fs.readFileSync(`../resources/${name}`));

const test = async () => {
  const data = await parse_obj(obj_file, local_mtl);
};


test();
