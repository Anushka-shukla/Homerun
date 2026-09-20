export const STORE = {
  name: "HomeRun Dark Store, Indiranagar DS-04",
  addr: "80 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru 560038",
  at: [12.9784, 77.6408]
};

/* Where the partner is sitting when the order lands. */
export const PARTNER_START = [12.9721, 77.6469];

/* The compound: a building with a service road around it. Gates sit on that
   road, so the route drawn between them is the road the vehicle takes. */
export const YARD = {
  building: [[12.97858, 77.64055], [12.97858, 77.64105], [12.97822, 77.64105], [12.97822, 77.64055]],
  loop: {
    entry: [12.97812, 77.64080],
    sw: [12.97812, 77.64045],
    nw: [12.97868, 77.64045],
    ne: [12.97868, 77.64115],
    se: [12.97812, 77.64115]
  },
  gates: { A: [12.97840, 77.64045], B: [12.97868, 77.64080], C: [12.97840, 77.64115] }
};

/* Clockwise from the entry, the way the yard is one way. */
export function yardRoute(gates) {
  const L = YARD.loop;
  const G = YARD.gates;
  const full = [
    { at: L.entry }, { at: L.sw }, { at: G.A, gate: "A" }, { at: L.nw },
    { at: G.B, gate: "B" }, { at: L.ne }, { at: G.C, gate: "C" }
  ];
  const last = gates[gates.length - 1];
  const end = full.findIndex((p) => p.gate === last);
  return full.slice(0, end + 1).map((p) => p.at);
}

export function yardPointOf(gates, doneGates) {
  const done = gates.filter((g) => doneGates[g]);
  if (!done.length) return YARD.loop.entry;
  return YARD.gates[done[done.length - 1]];
}

export const SLA_MS = 60 * 60 * 1000;

/* The partner app runs out of DS-04. The others exist so the console has a
   network to report on. */
export const STORES = [
  { id: "DS-04", name: "Indiranagar DS-04", region: "East" },
  { id: "DS-07", name: "HSR Layout DS-07", region: "South" },
  { id: "DS-11", name: "Koramangala DS-11", region: "South" },
  { id: "DS-02", name: "Whitefield DS-02", region: "East" }
];

/* Every SKU carries the gate it is picked from. Gate A is the heavy dock. */
/* Every SKU carries the gate it is picked from, and the unit the trade
   actually counts it in. Pipes are lengths, wire is a bundle, paint is a can.
   kg is only used to match the order to a vehicle. */
export const CATALOG = [
  { n: "UltraTech PPC Cement", q: 3, unit: "bags", size: "50 kg each", kg: 150, rs: 1185, ic: "\uD83E\uDDF1", g: "A", bay: "Floor bay G2", bulky: true },
  { n: "Johnson Vitrified Tile 600x600", q: 4, unit: "boxes", size: "4 tiles each", kg: 88, rs: 2960, ic: "\u25A6", g: "A", bay: "Floor bay G5", bulky: true },
  { n: "Supreme UPVC Pipe 3 inch", q: 4, unit: "pipes", size: "3 m long each", kg: 24, rs: 1480, ic: "\uD83E\uDEA0", g: "A", bay: "Pipe rack P1", bulky: true },
  { n: "Roff Tile Adhesive T20", q: 2, unit: "bags", size: "20 kg each", kg: 40, rs: 940, ic: "\uD83E\uDDF4", g: "A", bay: "Floor bay G3", bulky: true },
  { n: "Asian Paints Royale", q: 1, unit: "can", size: "10 L", kg: 13, rs: 3890, ic: "\uD83E\uDEA3", g: "B", bay: "Aisle B / Rack 2" },
  { n: "Birla White Cement", q: 2, unit: "bags", size: "5 kg each", kg: 10, rs: 490, ic: "\u26AA", g: "B", bay: "Aisle B / Rack 3" },
  { n: "Fevicol Marine Waterproof Adhesive", q: 2, unit: "jars", size: "1 kg each", kg: 2, rs: 728, g: "B", ic: "\uD83E\uDDF4", bay: "Aisle B / Rack 1" },
  { n: "Polycab Green Wire", q: 1, unit: "roll", size: "90 m", kg: 6, rs: 2240, ic: "\uD83D\uDD0C", g: "C", bay: "Aisle C / Rack 2" },
  { n: "Ashirvad Flowguard CPVC 90 degree Elbow", q: 20, unit: "pieces", size: "1 inch", kg: 2, rs: 720, ic: "\uD83D\uDD29", g: "C", bay: "Counter R" }
];

export const GATES = {
  A: {
    id: "A", name: "Gate A, heavy loading dock", what: "Cement, tiles, adhesive and pipes",
    why: "The vehicle backs in here, so nothing heavy is carried across the store floor.",
    picker: "Rakesh Gowda", zone: "Floor bays G1 to G6", x: 44, y: 112,
    short: "Cement, tiles, pipes",
    where: "first roller shutter on your left. Reverse up to the dock, the picker loads from there"
  },
  B: {
    id: "B", name: "Gate B, paints and chemicals", what: "Paints, white cement and adhesives",
    why: "Sealed bay away from cement dust, opened only for a scan.",
    picker: "Mohammed Ayaan", zone: "Aisle B, racks 1 to 4", x: 256, y: 60,
    short: "Paints, chemicals",
    where: "shutter on the far side of the yard, past the ramp. Park nose out"
  },
  C: {
    id: "C", name: "Gate C, electrical and hardware", what: "Wires, fittings and tools",
    why: "Small SKUs handed over at the counter.",
    picker: "Nithin Rao", zone: "Aisle C, rack 2", x: 256, y: 170,
    short: "Electrical, tools",
    where: "counter window on the right. Park on the kerb, no need to reverse"
  }
};

export const CUSTOMERS = [
  { name: "Anitha Reddy", addr: "Site 14, 5th Cross, Domlur 2nd Stage, Bengaluru 560071", ph: "+91 98861 20114", at: [12.9612, 77.6385], region: "Domlur" },
  { name: "Mohan Kumar", addr: "Plot 62, 7th Main, CV Raman Nagar, Bengaluru 560093", ph: "+91 99001 77320", at: [12.9853, 77.6631], region: "CV Raman Nagar" },
  { name: "Farid Basha", addr: "B-204, Sai Enclave, Jeevan Bheema Nagar, Bengaluru 560075", ph: "+91 97412 66408", at: [12.9709, 77.6588], region: "Jeevan Bheema Nagar" },
  { name: "Sneha Iyer", addr: "Site 7, 12th Main, Koramangala 6th Block, Bengaluru 560095", ph: "+91 98450 31277", at: [12.9352, 77.6245], region: "Koramangala" }
];

export const PARTNERS = [
  { id: "p1", name: "Ramesh Yadav", veh: "Tata Ace", type: "four", cap: 700, km: 0.4, rating: 4.8, status: "available" },
  { id: "p2", name: "Imran Shaikh", veh: "Bike", type: "bike", cap: 35, km: 0.9, rating: 4.7, status: "available" },
  { id: "p3", name: "Kulveer Singh", veh: "Mahindra Jeeto", type: "four", cap: 600, km: 1.6, rating: 4.6, status: "available" },
  { id: "p4", name: "Suresh Naik", veh: "Bike", type: "bike", cap: 35, km: 2.1, rating: 4.9, status: "available" },
  { id: "p5", name: "Arif Pasha", veh: "Tata Ace", type: "four", cap: 700, km: 3.2, rating: 4.5, status: "on trip" }
];

/* The order state machine, in sequence. gate_move loops back to at_gate. */
export const FLOW = [
  "placed", "routed", "packing", "ready", "allocating",
  "assigned", "accepted", "at_store", "at_gate", "gate_move", "verified",
  "picked", "en_route", "arrived", "pod_ok", "paid", "completed"
];

export const KANBAN = [
  ["Placed", ["placed", "routed"]],
  ["Packing", ["packing"]],
  ["Ready", ["ready"]],
  ["At store", ["allocating", "assigned", "accepted", "at_store", "at_gate", "gate_move", "verified"]],
  ["In transit", ["picked", "en_route", "arrived", "pod_ok", "paid"]],
  ["Delivered", ["completed"]]
];

export const LIVE_TRIP = ["accepted", "at_store", "at_gate", "gate_move", "verified", "picked", "en_route", "arrived"];

export const stage = (o) => FLOW.indexOf(o.status);
export const slaLeft = (o, demo) => SLA_MS - (demo - o.placedAt);
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
/* What the trade counts: bags, lengths, boxes, not kilos. */
export const unitsOf = (items) => items.reduce((a, b) => a + b.q, 0);
export const isBulky = (items) => items.some((i) => i.bulky);
export const canCarry = (p, o) => p.cap >= o.kg && (!isBulky(o.items) || p.type === "four");
export const unitLine = (it) => `${it.q} ${it.unit} \u00b7 ${it.size}`;

export const rs = (n) => "\u20B9" + Number(n).toLocaleString("en-IN");

export function mmss(ms) {
  const neg = ms < 0;
  const v = Math.abs(ms);
  const m = Math.floor(v / 60000);
  const s = Math.floor((v % 60000) / 1000);
  return (neg ? "-" : "") + m + ":" + (s < 10 ? "0" : "") + s;
}

export function slaTone(o, demo) {
  const left = slaLeft(o, demo);
  return left < 0 ? "late" : left < 15 * 60 * 1000 ? "warn" : "ok";
}

/* ---------- map geometry ----------
   No routing engine in the MVP. Each leg is a fixed polyline with two bends,
   so the marker travels a road-like shape rather than a straight line. The
   tiles under it are real OpenStreetMap. */
export function km(a, b) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function legPath(a, b) {
  const dLat = b[0] - a[0];
  const dLng = b[1] - a[1];
  const pLat = -dLng;
  const pLng = dLat;
  return [
    a,
    [a[0] + dLat * 0.28 + pLat * 0.16, a[1] + dLng * 0.28 + pLng * 0.16],
    [a[0] + dLat * 0.58 + pLat * 0.1, a[1] + dLng * 0.58 + pLng * 0.1],
    [a[0] + dLat * 0.82 - pLat * 0.07, a[1] + dLng * 0.82 - pLng * 0.07],
    b
  ];
}

export function pathLength(path) {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += km(path[i - 1], path[i]);
  return total;
}

/* Position at fraction t of the way along the polyline. */
export function pointOnPath(path, t) {
  const total = pathLength(path);
  let want = Math.max(0, Math.min(1, t)) * total;
  for (let i = 1; i < path.length; i++) {
    const seg = km(path[i - 1], path[i]);
    if (want > seg && i < path.length - 1) { want -= seg; continue; }
    const f = seg ? want / seg : 0;
    return [
      path[i - 1][0] + (path[i][0] - path[i - 1][0]) * f,
      path[i - 1][1] + (path[i][1] - path[i - 1][1]) * f
    ];
  }
  return path[path.length - 1];
}

/* Coordinates travelled so far, for the highlighted part of the route. */
export function pathUpTo(path, t) {
  const here = pointOnPath(path, t);
  const total = pathLength(path);
  let want = Math.max(0, Math.min(1, t)) * total;
  const out = [path[0]];
  for (let i = 1; i < path.length; i++) {
    const seg = km(path[i - 1], path[i]);
    if (want >= seg) { out.push(path[i]); want -= seg; continue; }
    break;
  }
  out.push(here);
  return out;
}
