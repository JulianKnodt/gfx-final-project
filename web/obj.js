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

const parse_mtl = (src, log=console.log) => {
  // map of name -> MTL
  const mtls = {};
  // current MTL
  let curr = mtl_default();
  for (let l of src.split("\n")) {
    let [cmd, ...rest] = l.trim().split(" ");
    switch (cmd) {
    case "":
    case "#": break
    case "newmtl":
      if (curr.name !== "") mtls[curr.name] = curr;
      curr = mtl_default();
      curr.name = rest[0];
      break;
    case "Ns":
      curr.Ns = Number(rest[0]);
      break;
    case "d":
      curr.d = Number(rest[0]);
      break
    case "illum":
      curr.illum = Number(rest[0]);
      break
    case "Ni":
      curr.Ni = Number(rest[0]);
      break
    case "Tr":
      curr.Tr = Number(rest[0]);
      break
    case "Tf":
      curr.Tf = rest.map(Number);
      break
    case "Ka":
      curr.Ka = rest.map(Number)
      break;
    case "Kd":
      curr.Kd = rest.map(Number)
      break;
    case "Ks":
      curr.Ks = rest.map(Number)
      break;
    case "Ke":
      curr.Ke = rest.map(Number)
      break;
    case "map_Ka": curr.map_Ka = rest[0];
      break
    case "map_Kd": curr.map_Kd = rest[0];
      break
    case "map_Ke": curr.map_Ke = rest[0];
      break
    case "bump":
    case "map_bump":
      curr.map_bump = rest[0];
      break
    default: log("Unsupported MTL command", l);
    };
  }
  return mtls;
};

async function get_mtl(mtl_file) {
  const mtl = await fetch("/resources/" + mtl_file);
  return mtl.text();
}

// Parses v/vt/vn for faces
const parse_slashed = str => str.split("/")
  .map(Number)
  .map(it => typeof it === "number" ? it - 1 : it);

const triangulate = vs => {
  const out = [];
  const fixed = vs[0];
  for (let i = 1; i < vs.length-1; i++) out.push([fixed, vs[i], vs[i+1]]);
  return out;
};

const default_group = () => ({
  name: "",
  mtl: "",
  idxs: [],
});

async function parse_obj(src, load_mtl=get_mtl, log=console.log) {
  const out = {
    // vertices
    v: [],
    // vertex normals
    vn: [],
    // vertex texture coordinates
    vt: [],
    groups: [],
    mtls: {},
  };
  let curr_group = default_group();
  for (let l of src.split("\n")) {
    let [cmd, ...rest] = l.trim().split(" ");
    if (cmd.startsWith("#")) continue;
    switch (cmd) {
    case undefined:
    case "":
    case "#": break;
    case "v":
      const v = rest.filter(it => it !== "").map(Number).map(v => v - 1);
      out.v.push(v);
      break;
    case "vn":
      const vn = rest.filter(it => it !== "").map(Number).map(vn => vn - 1);
      out.vn.push(vn);
      break;
    case "vt":
      const vt = rest.filter(it => it !== "").map(Number).map(vt => vt - 1);
      out.vt.push(vt);
      break;
    case "s":
      // TODO explicitly not supported yet
      break;
    case "f":
      const parts = rest.map(parse_slashed);
      curr_group.idxs.push(...triangulate(parts));
      break;
    case "mtllib":
      const mtl_src = await load_mtl(rest[0]);
      Object.assign(out.mtls, parse_mtl(mtl_src, log));
      break;
    case "usemtl":
      curr_group.mtl = rest[0];
      break;
    case "g":
      if (curr_group.idxs.length !== 0) out.groups.push(curr_group);
      curr_group = default_group();
      curr_group.name = rest[0];
      break;
    default: log("Unsupported OBJ command: ", l);
    }
  }
  if (curr_group.idxs.length !== 0) out.groups.push(curr_group);
  return out;
};

