const mtl_default = () => ({
  name: "",
  Ns: 0,
  Ni: 0,
  d: 0,
  Tr: 0,
  Tf: [0, 0, 0],
  illum: 0,
  Ka: [0, 0, 0],
  Kd: [0, 0, 0],
  Ks: [0, 0, 0],
  Ke: [0, 0, 0],
});

const assign_mtl_defaults = mtl => Object.assign(mtl_default(), mtl);

const parse_mtl = src => {
  // map of name -> MTL
  const mtls = {};
  // current MTL
  const curr = mtl_default();
  for (let l of src.split("\n")) {
    let [cmd, ...rest] = l.split(" ");
    switch (cmd) {
    case "newmtl":
      if (curr.name !== "") mtls[curr.name] = curr;
      curr = mtl_default();
      curr.name = rest[0];
      break;
    case "Ns":
      curr.Ns = Number(rest[0]);
      break;
    case "Ka":
      curr.Ka = rest.map(Number)
      break;
    case "Kd":
      curr.Kd = rest.map(Number)
      break;
    case "Ks":
      curr.Ks = rest.map(Number)
      break;
    default: console.log("Unsupported MTL command", l);
    };
  }
  return mtls;
};

const get_mtl = async mtl_file => fetch("/resources/" + mtl_file);

// Parses v/vt/vn for faces
const parse_slashed = str => str.split("/").map(Number).map(it => it - 1);

const default_group = () => ({
  name: "",
  mtl: -1,
  // which indices to use
  idxs: [],
});

const parse_obj = async src => {
  const out = {
    // vertices
    v: [],
    // vertex normals
    vn: [],
    // vertex textures(vt) can be ignored for now
    groups: [],
    mtls: [],
  };
  const curr_group = default_group();
  for (let l of src.split("\n")) {
    let [cmd, ...rest] = l.split(" ");
    switch (cmd) {
    case undefined:
    case "":
    case "c": break;
    case "v":
      out.v.push(rest.map(Number).map(v => v - 1));
      break;
    case "vn":
      out.vn.push(rest.map(Number).map(v => v - 1));
      break;
    case "vt":
      // TODO
      break;
    case "f":
      const parts = rest.map(parse_slashed);
      for (let i = 0; i < parts.length - 2; i++) curr_group.idxs.push(parts);
      break
    case "g":
      if (curr_group.idxs.length !== 0) out.groups.push(curr_group);
      curr_group = default_group();
      curr_group = rest[0];
      break;
    default: console.log("Unsupported OBJ command: ", l);
    }
  }
  if (curr_group.idxs.length !== 0) out.groups.push(curr_group);
  return out;
};

