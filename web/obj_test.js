#!/usr/local/bin/node

const fs = require('fs');

// Hacky way to read in functions
eval(String(fs.readFileSync("./obj.js")));

const obj = String(fs.readFileSync("../resources/sekiro.obj"));
const local_mtl = name => String(fs.readFileSync(`../resources/${name}`));

parse_obj(obj, local_mtl).then(it => {});

