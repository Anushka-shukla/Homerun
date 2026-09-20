import { SLA_MS, unitsOf } from "../data.js";

/* Every branch of the KPI tree is arithmetic on the stage timestamps the
   reducer stamps when an order changes status. Nothing is tracked twice. */
export const STAGES = [
  { key: "packaging", label: "Packaging", from: "routed", to: "ready", why: "Picker time inside the store" },
  { key: "assignment", label: "Assignment", from: "ready", to: "assigned", why: "How long a packed order waits for a partner" },
  { key: "pickup", label: "Pickup", from: "assigned", to: "picked", why: "Accepting, riding to the store, gates, scans and loading" },
  { key: "transit", label: "Transit", from: "picked", to: "arrived", why: "On the road to the customer" },
  { key: "dropoff", label: "Drop-off", from: "arrived", to: "completed", why: "Unload, proof of delivery and payment" }
];

export const IN_FLIGHT = ["placed", "routed", "packing", "ready", "allocating", "assigned", "accepted", "at_store", "at_gate", "gate_move", "verified", "picked", "en_route", "arrived", "pod_ok", "paid"];

export const PIPELINE = [
  { key: "placed", label: "Placed", has: ["placed", "routed"] },
  { key: "packing", label: "Packing", has: ["packing", "ready"] },
  { key: "assigned", label: "Assigned", has: ["allocating", "assigned", "accepted"] },
  { key: "pickup", label: "At store", has: ["at_store", "at_gate", "gate_move", "verified"] },
  { key: "transit", label: "In transit", has: ["picked", "en_route", "arrived", "pod_ok", "paid"] },
  { key: "delivered", label: "Delivered", has: ["completed"] }
];

export const stageMs = (o, st) => {
  const a = o.ts ? o.ts[st.from] : null;
  const b = o.ts ? o.ts[st.to] : null;
  return a == null || b == null ? null : b - a;
};

export const totalMs = (o) => (o.ts && o.ts.completed != null ? o.ts.completed - o.ts.placed : null);
export const elapsed = (o, demo) => demo - o.placedAt;
export const leftMs = (o, demo) => SLA_MS - elapsed(o, demo);
export const isDelivered = (o) => o.status === "completed";
export const wasOnTime = (o) => isDelivered(o) && totalMs(o) != null && totalMs(o) <= SLA_MS;

export function riskOf(o, demo) {
  if (isDelivered(o)) return wasOnTime(o) ? "ontime" : "late";
  const left = leftMs(o, demo);
  if (left < 0) return "late";
  if (left < 15 * 60 * 1000) return "risk";
  return "ok";
}

export const mins = (ms) => (ms == null ? null : Math.max(0, Math.round(ms / 60000)));

export function aggregates(orders, demo) {
  const delivered = orders.filter(isDelivered);
  const onTime = delivered.filter(wasOnTime);
  const lateDelivered = delivered.length - onTime.length;
  const flight = orders.filter((o) => !isDelivered(o));
  const breaching = flight.filter((o) => leftMs(o, demo) < 0);
  const atRisk = flight.filter((o) => riskOf(o, demo) === "risk");
  const totals = delivered.map(totalMs).filter((v) => v != null);
  const tickets = orders.filter((o) => o.ticket);

  return {
    booked: orders.length,
    delivered: delivered.length,
    onTime: onTime.length,
    late: lateDelivered + breaching.length,
    lateDelivered,
    breaching: breaching.length,
    atRisk: atRisk.length,
    inFlight: flight.length,
    onTimeRate: delivered.length ? Math.round((onTime.length / delivered.length) * 100) : null,
    avgTotal: totals.length ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length / 60000) : null,
    units: orders.reduce((a, o) => a + unitsOf(o.items), 0),
    value: orders.reduce((a, o) => a + o.amount, 0),
    openTickets: tickets.filter((o) => o.ticket.status === "open").length,
    tickets: tickets.length
  };
}

/* Average duration per stage across every order that has cleared it. */
export function stageAverages(orders) {
  return STAGES.map((st) => {
    const vals = orders.map((o) => stageMs(o, st)).filter((v) => v != null);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    const worst = vals.length ? Math.max(...vals) : null;
    return { ...st, count: vals.length, avgMin: mins(avg), worstMin: mins(worst) };
  });
}
