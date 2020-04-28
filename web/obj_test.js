const fs = require('fs');
const obj = require('./obj.js');

const obj_src = fs.readFileSync("../resources/teapot.obj");

// TODO actually test

/*
obj.parse_obj(String(obj_src)).then(out => {
  console.log(out);
});
*/
