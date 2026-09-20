import { readSnapshot } from "./channel.js";
import { CATALOG, GATES, CUSTOMERS, PARTNERS, FLOW, SLA_MS, STORE, STORES, PARTNER_START, stage, pick, rs, legPath, pathLength, canCarry, isBulky } from "./data.js";

let toastSeq = 1;

/* A refresh should not throw away a trip in progress. The snapshot the ops
   tab already reads doubles as the rehydration source. */
export function bootState() {
  try {
    const saved = readSnapshot();
    if (saved && saved.onboarded && Array.isArray(saved.orders) && saved.orders.length) {
      return { ...saved, toasts: [], busy: false, scan: null };
    }
  } catch {
    /* corrupt snapshot, start clean */
  }
  return initialState();
}

export function initialState() {
  const s = {
    speed: 10,
    demo: 0,
    online: false,
    view: "app",
    orders: [],
    liveId: null,
    me: "p1",
    partners: PARTNERS.map((p) => ({ ...p })),
    scan: null,
    otp: "",
    photo: false,
    progress: 0,
    moving: false,
    offlineMid: false,
    busy: false,
    earn: 0,
    trips: 0,
    dist: 0,
    lang: "en",
    onboarded: false,
    rating: null,
    atHome: false,
    upi: null,
    breached: {},
    toasts: [],
    seq: 4820117
  };
  seedBackground(s);
  return s;
}

export const liveOrder = (s) => s.orders.find((o) => o.id === s.liveId) || null;

/* One at a time. A second message replaces the first rather than stacking. */
function say(s, msg, vars = null, warn = false) {
  s.toasts = [{ id: toastSeq++, msg, vars, warn }];
}

function makeOrder(s, opts = {}) {
  const heavy = CATALOG.filter((c) => c.g === "A");
  const rest = CATALOG.filter((c) => c.g !== "A");
  const items = [pick(heavy)];
  const used = { [items[0].n]: 1 };
  const want = 1 + Math.floor(Math.random() * 2);
  let guard = 0;
  while (items.length < 1 + want && guard++ < 40) {
    const c = pick(rest);
    if (used[c.n]) continue;
    used[c.n] = 1;
    items.push(c);
  }
  const kg = items.reduce((a, b) => a + b.kg, 0);
  const amount = items.reduce((a, b) => a + b.rs, 0);
  const gates = ["A", "B", "C"].filter((g) => items.some((i) => i.g === g));
  const cust = pick(CUSTOMERS);
  const storeLeg = legPath(PARTNER_START, STORE.at);
  const dropLeg = legPath(STORE.at, cust.at);
  const custKm = Math.round(pathLength(dropLeg) * 10) / 10;

  const o = {
    id: String(s.seq++),
    items, kg, amount,
    pay: "COD",
    cust: { ...cust, km: custKm },
    storeLeg,
    dropLeg,
    storeKm: Math.round(pathLength(storeLeg) * 10) / 10,
    otp: String(1000 + Math.floor(Math.random() * 8999)),
    gates, gateIdx: 0, gateDone: {},
    picker: GATES[gates[0]].picker,
    status: opts.status || "placed",
    store: opts.store || STORES[0],
    region: cust.region,
    ts: {},
    ticket: null,
    placedAt: s.demo - (opts.age || 0),
    partner: opts.partner || null,
    mock: !!opts.mock,
    payout: Math.round(42 + custKm * 9 + (kg > 100 ? 45 : kg > 40 ? 25 : 0)),
    flags: [],
    next: 0,
    collected: 0,
    cashTaken: 0,
    upiPaid: 0,
    shortBy: 0
  };
  o.ts = { placed: o.placedAt };
  s.orders = [o, ...s.orders];
  return o;
}

/* Minutes a healthy order spends between one status and the next. Seeded
   orders get timestamps built from this, scaled to the total they took. */
const TEMPLATE = [
  ["placed", 0], ["routed", 1], ["packing", 2], ["ready", 7], ["allocating", 1], ["assigned", 1],
  ["accepted", 1], ["at_store", 5], ["at_gate", 1], ["gate_move", 3], ["verified", 3], ["picked", 1],
  ["en_route", 1], ["arrived", 13], ["pod_ok", 3], ["paid", 2], ["completed", 1]
];

function stampHistory(o, upto, totalMin) {
  const end = FLOW.indexOf(upto);
  const walk = TEMPLATE.slice(0, end + 1);
  const raw = walk.reduce((a, b) => a + b[1], 0) || 1;
  const scale = totalMin ? totalMin / raw : 1;
  let at = o.placedAt;
  const ts = {};
  walk.forEach(([key, min]) => {
    at += min * 60000 * scale;
    ts[key] = Math.round(at);
  });
  ts.placed = o.placedAt;
  o.ts = ts;
}

const TICKETS = [
  {
    reason: "Wrong item at the gate scan",
    status: "resolved",
    thread: [
      ["Partner", "Gate A handed me 2 bags, the slip says 3. Holding at the dock."],
      ["Ops", "Checked with the picker, third bag was on the next pallet. Reissue the scan."],
      ["Partner", "Rescanned, all three loaded."],
      ["Ops", "Closed. Picker briefed on split pallets."]
    ]
  },
  {
    reason: "Customer unreachable at the site",
    status: "open",
    thread: [
      ["Partner", "Two calls, no answer. Site gate is shut."],
      ["Ops", "Trying the alternate number on the order. Hold 5 minutes before you leave."]
    ]
  },
  {
    reason: "SLA breach, order crossed 60 minutes",
    status: "open",
    thread: [
      ["System", "Order crossed 60 minutes in transit."],
      ["Ops", "Partner is 1.2 km out. Informing the customer and waiving the delivery fee."]
    ]
  }
];

function attachTicket(s, o, spec) {
  o.ticket = {
    id: "TCK-" + o.id.slice(-4),
    reason: spec.reason,
    status: spec.status,
    openedAt: o.placedAt + 12 * 60000,
    resolvedAt: spec.status === "resolved" ? o.placedAt + 26 * 60000 : null,
    thread: spec.thread.map(([who, text], i) => ({ who, text, at: o.placedAt + (14 + i * 4) * 60000 }))
  };
}

const SEEDS = [
  { status: "completed", ageMin: 96, totalMin: 44 },
  { status: "completed", ageMin: 83, totalMin: 51 },
  { status: "completed", ageMin: 71, totalMin: 38 },
  { status: "completed", ageMin: 64, totalMin: 73, ticket: 0 },
  { status: "en_route", ageMin: 47, partner: "p5" },
  { status: "picked", ageMin: 52, partner: "p3", ticket: 2 },
  { status: "arrived", ageMin: 38, partner: "p4", ticket: 1 },
  { status: "at_gate", ageMin: 19, partner: "p2" },
  { status: "packing", ageMin: 6 },
  { status: "assigned", ageMin: 11, partner: "p3" }
];

function seedBackground(s) {
  SEEDS.forEach((spec, i) => {
    const o = makeOrder(s, {
      mock: true,
      status: spec.status,
      age: spec.ageMin * 60000,
      partner: spec.partner,
      store: STORES[i % STORES.length]
    });
    stampHistory(o, spec.status, spec.totalMin);
    if (spec.ticket != null) attachTicket(s, o, TICKETS[spec.ticket]);
    o.next = s.demo + (25 + Math.random() * 110) * 1000;
  });
}

function eligible(s, o) {
  return s.partners
    .filter((p) => p.status === "available" && canCarry(p, o))
    .sort((a, b) => a.km - b.km);
}

function assign(s, o, skipId) {
  const list = eligible(s, o).filter((p) => p.id !== skipId);
  if (!list.length) {
    say(s, "No partner can carry {kg} kg. Order held for the next Tata Ace.", { kg: o.kg }, true);
    return;
  }
  const p = list[0];
  o.partner = p.id;
  o.status = "assigned";
  s.me = p.id;
  say(s, "{name} is nearest at {km} km", { name: p.name, km: p.km });
}

function runMocks(s) {
  s.orders.forEach((o) => {
    if (!o.mock || o.status === "completed") return;
    if (s.demo < o.next) return;
    const i = stage(o);
    if (i < FLOW.length - 1) o.status = FLOW[i + 1];
    if (o.status === "assigned") {
      const free = s.partners.filter((p) => p.status === "available" && p.id !== s.me && canCarry(p, o));
      o.partner = free.length ? free[0].id : "p3";
    }
    o.next = s.demo + (25 + Math.random() * 120) * 1000;
  });
}

function complete(s, o) {
  o.deliveredAt = s.demo;
  o.surge = Math.random() < 0.4 ? 25 : 0;
  o.payoutFinal = o.payout + o.surge;
  o.status = "completed";
  s.earn += o.payoutFinal;
  s.trips += 1;
  s.dist += o.cust.km + o.storeKm;
  const me = s.partners.find((p) => p.id === s.me);
  if (me) me.status = "available";
}

/* ---------- partner actions ---------- */
function act(s, a) {
  const o = liveOrder(s);
  if (a === "simulate") {
    if (s.busy) return;
    if (!s.online) { say(s, "Go online first to receive orders", null, true); return; }
    if (o && o.status !== "completed") { say(s, "Finish the active trip first"); return; }
    s.busy = true;
    s.photo = false;
    s.otp = "";
    s.progress = 0;
    s.liveId = makeOrder(s).id;
    return;
  }
  if (!o) return;

  switch (a) {
    case "accept": {
      const me = s.partners.find((p) => p.id === s.me);
      if (me) me.status = "on trip";
      o.status = "accepted";
      s.progress = 0;
      s.moving = true;
      say(s, "Order accepted. Head to {store}.", { store: STORE.name.split(",")[0] });
      break;
    }
    case "reject":
      edge(s, "reject");
      break;
    case "reached_store":
      o.status = "at_store";
      break;
    case "start_gates":
      o.gateIdx = 0;
      o.status = "at_gate";
      say(s, "Head to Gate {g}, {what}", { g: o.gates[0], what: GATES[o.gates[0]].what.toLowerCase() });
      break;
    case "reached_gate":
      o.status = "at_gate";
      break;
    case "scan_picker":
      s.scan = { kind: "picker" };
      break;
    case "scan_cancel":
      s.scan = null;
      break;
    case "scan_ok": {
      s.scan = null;
      const g = o.gates[o.gateIdx];
      o.gateDone = { ...o.gateDone, [g]: true };
      o.flags = o.flags.filter((f) => f !== "wrong item");
      if (o.gateIdx < o.gates.length - 1) {
        o.gateIdx += 1;
        o.status = "gate_move";
        say(s, "Gate {g} collected. Next stop is Gate {next}.", { g, next: o.gates[o.gateIdx] });
      } else {
        o.status = "verified";
        say(s, "All {n} gates verified for order {id}.", { n: o.gates.length, id: o.id });
      }
      break;
    }
    case "wrong_item":
      s.scan = null;
      edge(s, "wrong");
      break;
    case "picked":
      o.status = "picked";
      s.progress = 0;
      s.moving = true;
      say(s, "Trip started. 60 minute clock is visible to ops.");
      break;
    case "call":
      say(s, "Calling {name} on {ph}", { name: o.cust.name, ph: o.cust.ph });
      break;
    case "chat":
      say(s, "Chat opened with {name}", { name: o.cust.name });
      break;
    case "arrived":
      o.status = "arrived";
      break;
    case "photo":
      s.photo = true;
      say(s, "Photo saved to the order");
      break;
    case "verify_otp":
      if (s.otp !== o.otp) { say(s, "OTP does not match. Ask the customer to read it again.", null, true); break; }
      o.status = "pod_ok";
      say(s, "Delivery confirmed with OTP {otp}. Collect {amt} now.", { otp: o.otp, amt: rs(o.amount) });
      break;
    case "cash_collected":
      o.collected = o.amount;
      o.cashTaken = o.amount;
      o.upiPaid = 0;
      o.shortBy = 0;
      o.status = "paid";
      say(s, "{amt} collected from {name}", { amt: rs(o.amount), name: o.cust.name });
      break;
    case "cash_short": {
      const short = Math.round(o.amount * 0.15);
      o.shortBy = short;
      o.collected = o.amount - short;
      o.cashTaken = o.collected;
      s.upi = { amount: short, cash: o.collected };
      say(s, "Short by {amt}. Take the balance on UPI before you leave.", { amt: rs(short) }, true);
      break;
    }
    case "upi_full":
      s.upi = { amount: o.amount, cash: 0 };
      o.collected = 0;
      o.cashTaken = 0;
      o.shortBy = 0;
      break;
    case "upi_received":
      o.collected = o.amount;
      o.shortBy = 0;
      o.upiPaid = s.upi ? s.upi.amount : 0;
      o.cashTaken = o.amount - o.upiPaid;
      s.upi = null;
      o.status = "paid";
      say(s, o.cashTaken > 0 ? "{total} settled, {upi} of it by UPI" : "{total} paid by UPI",
          { total: rs(o.amount), upi: rs(o.upiPaid) });
      break;
    case "upi_back":
      s.upi = null;
      o.collected = 0;
      o.cashTaken = 0;
      o.upiPaid = 0;
      o.shortBy = 0;
      break;
    case "complete":
      complete(s, o);
      s.rating = { value: 0 };
      break;
    case "rate_submit": {
      const v = s.rating ? s.rating.value : 0;
      o.customerRating = v;
      s.rating = null;
      say(s, "You rated {name} {n} stars", { name: o.cust.name, n: v });
      break;
    }
    case "rate_skip":
      s.rating = null;
      break;
    case "go_home":
      s.atHome = true;
      break;
    case "resume":
      s.atHome = false;
      break;
    case "emergency": {
      /* The partner cannot continue. They are freed, the order goes to the
         next eligible partner and carries on without them. */
      const old = o.partner;
      const me = s.partners.find((p) => p.id === old);
      if (me) me.status = "available";
      const next = eligible(s, o).find((p) => p.id !== old);
      o.flags = [...o.flags, "partner emergency"];
      o.status = next ? "assigned" : "ready";
      o.partner = next ? next.id : null;
      o.gateIdx = 0;
      o.gateDone = {};
      o.mock = true;
      o.next = s.demo + 25000;
      s.liveId = null;
      s.atHome = true;
      s.progress = 0;
      s.photo = false;
      s.otp = "";
      s.upi = null;
      say(s, next ? "Trip handed over. {name} is taking this order." : "Trip released. Ops is finding another partner.",
          next ? { name: next.name } : null, true);
      break;
    }
    case "next_order":
      s.liveId = null;
      s.upi = null;
      s.photo = false;
      s.otp = "";
      s.progress = 0;
      say(s, "You are back online at the dark store.");
      break;
    default:
      break;
  }
}

/* ---------- edge cases ---------- */
function edge(s, id) {
  const o = liveOrder(s);
  if (!o) return;
  if (id === "reject") {
    if (o.status !== "assigned") return;
    o.flags = [...o.flags, "reassigned"];
    say(s, "Order declined. Reassigning to the next nearest partner.", null, true);
    assign(s, o, o.partner);
    return;
  }
  if (id === "wrong") {
    if (!o.flags.includes("wrong item")) o.flags = [...o.flags, "wrong item"];
    o.status = "at_gate";
    say(s, "Item at Gate {g} does not match the packed slip. Sent back to {picker}.", { g: o.gates[o.gateIdx], picker: GATES[o.gates[o.gateIdx]].picker }, true);
    return;
  }
  if (id === "unreach") {
    o.flags = [...o.flags, "customer unreachable"];
    say(s, "No answer on two calls. Waiting 5 minutes before the return option opens.", null, true);
    return;
  }
  if (id === "payfail") {
    act(s, "cash_short");
    return;
  }
  if (id === "offline") {
    s.offlineMid = true;
    s.moving = false;
    say(s, "Network lost. Trip is frozen locally and will sync when the partner is back.", null, true);
  }
}

/* ---------- reducer ---------- */
export function reducer(prev, action) {
  const s = {
    ...prev,
    orders: prev.orders.map((o) => ({ ...o })),
    partners: prev.partners.map((p) => ({ ...p }))
  };
  const before = new Map(prev.orders.map((o) => [o.id, o.status]));
  const stamp = (out) => {
    out.orders.forEach((o) => {
      if (before.get(o.id) !== o.status) o.ts = { ...o.ts, [o.status]: out.demo };
    });
    return out;
  };

  switch (action.type) {
    case "tick": {
      s.demo += 250 * s.speed;
      runMocks(s);
      const o = liveOrder(s);
      if (s.moving && !s.offlineMid && o && ["accepted", "picked", "en_route"].includes(o.status)) {
        s.progress = Math.min(1, s.progress + 0.006 * (s.speed > 10 ? 2 : 1));
        if (o.status === "picked" && s.progress > 0.05) o.status = "en_route";
      }
      s.orders.forEach((x) => {
        if (x.status !== "completed" && !s.breached[x.id] && s.demo - x.placedAt > SLA_MS) {
          s.breached = { ...s.breached, [x.id]: 1 };
          x.flags = [...x.flags, "SLA breach"];
          if (s.liveId === x.id) say(s, "Order {id} has crossed 60 minutes. Ops has been alerted.", { id: x.id }, true);
        }
      });
      return stamp(s);
    }
    case "intakeStep": {
      const o = liveOrder(s);
      if (!o) return s;
      const next = { placed: "routed", routed: "packing", packing: "ready", ready: "allocating" }[o.status];
      if (!next) return s;
      o.status = next;
      return stamp(s);
    }
    case "assignNow": {
      const o = liveOrder(s);
      if (!o || o.status !== "allocating") return s;
      s.busy = false;
      assign(s, o);
      return stamp(s);
    }
    case "lang":
      s.lang = action.value;
      return s;
    case "onboard":
      s.lang = action.value || s.lang;
      s.onboarded = true;
      return s;
    case "speed":
      s.speed = action.value;
      return stamp(s);
    case "view":
      s.view = action.value;
      return stamp(s);
    case "toggleOnline": {
      const o = liveOrder(s);
      if (o && s.online && ["accepted", "at_store", "at_gate", "gate_move", "verified", "picked", "en_route", "arrived"].includes(o.status)) {
        say(s, "You cannot go offline during a live trip. Use the edge case control to simulate a drop in connectivity.", null, true);
        return stamp(s);
      }
      s.online = !s.online;
      return stamp(s);
    }
    case "rate":
      s.rating = { value: action.value };
      return stamp(s);
    case "otp":
      s.otp = action.value.replace(/[^0-9]/g, "").slice(0, 4);
      return stamp(s);
    case "act":
      act(s, action.value);
      return stamp(s);
    case "edge":
      edge(s, action.value);
      return stamp(s);
    case "backOnline":
      s.offlineMid = false;
      s.moving = true;
      say(s, "Back online. Trip synced.");
      return stamp(s);
    case "untoast":
      s.toasts = s.toasts.filter((t) => t.id !== action.id);
      return stamp(s);
    case "reset":
      return initialState();
    default:
      return s;
  }
}
