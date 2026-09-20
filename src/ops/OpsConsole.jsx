import React, { useMemo, useState } from "react";
import { LANGS } from "../i18n.jsx";
import { SLA_MS, STORES, GATES, rs, mmss, unitsOf, unitLine } from "../data.js";
import {
  STAGES, PIPELINE, aggregates, stageAverages, stageMs, totalMs,
  leftMs, riskOf, mins, isDelivered, wasOnTime
} from "./metrics.js";

const NAV = [
  { id: "delivery", label: "Delivery management", live: true },
  { id: "orders", label: "Order management" },
  { id: "inventory", label: "Inventory" },
  { id: "support", label: "Customer support" },
  { id: "partners", label: "Partner onboarding" }
];

const EDGE = [
  { id: "reject", t: "Partner declines or times out", ok: (o) => o && o.status === "assigned" },
  { id: "wrong", t: "Wrong item at the gate scan", ok: (o) => o && o.status === "at_gate" },
  { id: "unreach", t: "Customer unreachable at the site", ok: (o) => o && ["picked", "en_route", "arrived"].includes(o.status) },
  { id: "payfail", t: "Cash short at the doorstep", ok: (o) => o && o.status === "pod_ok" },
  { id: "offline", t: "Partner drops off the network", ok: (o) => o && ["accepted", "at_store", "at_gate", "gate_move", "verified", "picked", "en_route", "arrived"].includes(o.status) }
];

const STATUS_LABEL = {
  placed: "Placed", routed: "Routed", packing: "Packing", ready: "Ready", allocating: "Allocating",
  assigned: "Assigned", accepted: "Accepted", at_store: "At store", at_gate: "At gate",
  gate_move: "Between gates", verified: "Loaded", picked: "Picked up", en_route: "In transit",
  arrived: "At drop", pod_ok: "Delivered", paid: "Paid", completed: "Completed"
};

const clock = (ms) => {
  const m = Math.floor(Math.abs(ms) / 60000);
  return (ms < 0 ? "+" : "") + m + "m";
};

export default function OpsConsole({ state, live, dispatch }) {
  const [tab, setTab] = useState("delivery");
  const [view, setView] = useState("overview");
  const [openId, setOpenId] = useState(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [store, setStore] = useState("all");

  const demo = state.demo;
  const orders = state.orders;
  const kpi = useMemo(() => aggregates(orders, demo), [orders, demo]);
  const bars = useMemo(() => stageAverages(orders), [orders]);
  const open = openId ? orders.find((o) => o.id === openId) : null;

  const rows = orders.filter((o) => {
    if (q && !(o.id.includes(q.trim()) || o.cust.name.toLowerCase().includes(q.trim().toLowerCase()))) return false;
    if (store !== "all" && o.store.id !== store) return false;
    if (status === "all") return true;
    if (status === "flight") return !isDelivered(o);
    if (status === "delivered") return isDelivered(o);
    if (status === "ontime") return wasOnTime(o);
    if (status === "late") return riskOf(o, demo) === "late";
    if (status === "risk") return riskOf(o, demo) === "risk";
    if (status === "tickets") return !!o.ticket;
    return true;
  });

  const drill = (key) => { setStatus(key); setView("orders"); setOpenId(null); };

  return (
    <div className="console">
      <nav className="console-nav">
        <div className="navtitle">HomeRun ops</div>
        {NAV.map((n) => (
          <button key={n.id} className={"navitem" + (tab === n.id ? " on" : "")} onClick={() => setTab(n.id)}>
            {n.label}
            {!n.live && <span className="soon">mock</span>}
          </button>
        ))}
        <div className="navfoot">
          <div className="navstat"><b>{kpi.inFlight}</b><span>in flight</span></div>
          <div className="navstat"><b>{kpi.openTickets}</b><span>open tickets</span></div>
        </div>

        <div className="navdemo">
          <div className="navtitle">Demo controls</div>
          <div className="langtoggle" role="group" aria-label="Partner app language">
            {LANGS.map((l) => (
              <button key={l.id} aria-pressed={state.lang === l.id} onClick={() => dispatch({ type: "lang", value: l.id })}>
                {l.native}
              </button>
            ))}
          </div>
          {EDGE.map((e) => (
            <button key={e.id} className="demobtn" disabled={!e.ok(live)} onClick={() => dispatch({ type: "edge", value: e.id })}>
              {e.t}
            </button>
          ))}
          <button className="demobtn danger" onClick={() => dispatch({ type: "reset" })}>Reset demo</button>
        </div>
      </nav>

      <div className="console-body">
        {tab !== "delivery" ? (
          <Placeholder tab={NAV.find((n) => n.id === tab)} />
        ) : open ? (
          <OrderDetail order={open} demo={demo} partners={state.partners} onBack={() => setOpenId(null)} />
        ) : (
          <>
            <div className="conhead">
              <div>
                <h1>Delivery management</h1>
                <p>Every order across the four dark stores, on the same 60 minute clock the partner app runs on.</p>
              </div>
              <div className="segs">
                <button className={view === "overview" ? "on" : ""} onClick={() => setView("overview")}>Overview</button>
                <button className={view === "orders" ? "on" : ""} onClick={() => setView("orders")}>Orders</button>
              </div>
            </div>

            {view === "overview" ? (
              <>
                <div className="kpis">
                  <Kpi big label="On-time delivery rate" value={kpi.onTimeRate == null ? "\u2014" : kpi.onTimeRate + "%"}
                       sub={`${kpi.onTime} of ${kpi.delivered} delivered inside 60 min`} tone={kpi.onTimeRate >= 90 ? "good" : kpi.onTimeRate >= 75 ? "warn" : "bad"}
                       onClick={() => drill("delivered")} />
                  <Kpi label="Orders booked" value={kpi.booked} sub={`${kpi.units} units \u00b7 ${rs(kpi.value)}`} onClick={() => drill("all")} />
                  <Kpi label="Delivered on time" value={kpi.onTime} sub="inside the SLA" tone="good" onClick={() => drill("ontime")} />
                  <Kpi label="Late or breaching" value={kpi.late} sub={`${kpi.lateDelivered} delivered late \u00b7 ${kpi.breaching} still out`} tone="bad" onClick={() => drill("late")} />
                  <Kpi label="At risk" value={kpi.atRisk} sub="under 15 min of SLA left" tone="warn" onClick={() => drill("risk")} />
                  <Kpi label="Average delivery" value={kpi.avgTotal == null ? "\u2014" : kpi.avgTotal + " min"} sub="order placed to payment taken" onClick={() => drill("delivered")} />
                </div>

                <section className="panel">
                  <div className="panelhead">
                    <h2>Live pipeline</h2>
                    <span>{kpi.inFlight} orders moving, clock runs from order placed</span>
                  </div>
                  <div className="pipeline">
                    {PIPELINE.map((col) => {
                      const list = orders.filter((o) => col.has.includes(o.status));
                      return (
                        <div className="pcol" key={col.key}>
                          <h3><span>{col.label}</span><span>{list.length}</span></h3>
                          {list.map((o) => (
                            <button className={"pcard " + riskOf(o, demo)} key={o.id} onClick={() => setOpenId(o.id)}>
                              <b>#{o.id}</b>
                              <span>{o.store.id} &middot; {unitsOf(o.items)} units</span>
                              <span className="ptime">
                                {isDelivered(o) ? mins(totalMs(o)) + " min taken" : clock(leftMs(o, demo)) + " left"}
                              </span>
                              {o.ticket && <span className="pflag">{o.ticket.status === "open" ? "ticket open" : "ticket closed"}</span>}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="panel">
                  <div className="panelhead">
                    <h2>Where the 60 minutes goes</h2>
                    <span>average per stage, across every order that has cleared it</span>
                  </div>
                  <div className="bars">
                    {bars.map((b) => {
                      const worstAvg = Math.max(...bars.map((x) => x.avgMin || 0), 1);
                      return (
                        <div className="bar" key={b.key}>
                          <div className="barhead">
                            <b>{b.label}</b>
                            <span>{b.avgMin == null ? "no data" : b.avgMin + " min avg"}</span>
                          </div>
                          <div className="bartrack">
                            <i style={{ width: ((b.avgMin || 0) / worstAvg) * 100 + "%" }} />
                          </div>
                          <div className="barfoot">{b.why}{b.worstMin != null ? ` \u00b7 worst ${b.worstMin} min` : ""}</div>
                        </div>
                      );
                    })}
                  </div>
                </section>

              </>
            ) : (
              <>
                <div className="filters">
                  <input className="search" placeholder="Search order ID or customer" value={q} onChange={(e) => setQ(e.target.value)} />
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="all">All orders</option>
                    <option value="flight">In flight</option>
                    <option value="delivered">Delivered</option>
                    <option value="ontime">Delivered on time</option>
                    <option value="risk">At risk</option>
                    <option value="late">Late or breaching</option>
                    <option value="tickets">With a support ticket</option>
                  </select>
                  <select value={store} onChange={(e) => setStore(e.target.value)}>
                    <option value="all">All dark stores</option>
                    {STORES.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
                  </select>
                  <span className="count">{rows.length} of {orders.length}</span>
                </div>

                <div className="tablewrap">
                  <table className="otable">
                    <thead>
                      <tr>
                        <th>Order</th><th>Status</th><th>Dark store</th><th>Region</th>
                        <th>Units</th><th>Amount</th><th>SLA</th><th>Ticket</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((o) => (
                        <tr key={o.id} onClick={() => setOpenId(o.id)}>
                          <td><b>#{o.id}</b><span className="sub2">{o.cust.name}</span></td>
                          <td><span className={"pill " + riskOf(o, demo)}>{STATUS_LABEL[o.status]}</span></td>
                          <td>{o.store.name}</td>
                          <td>{o.region}</td>
                          <td>{unitsOf(o.items)}</td>
                          <td>{rs(o.amount)}</td>
                          <td className={riskOf(o, demo)}>
                            {isDelivered(o) ? mins(totalMs(o)) + " min" : clock(leftMs(o, demo)) + " left"}
                          </td>
                          <td>{o.ticket ? <span className={"pill " + (o.ticket.status === "open" ? "late" : "ontime")}>{o.ticket.status}</span> : <span className="muted">none</span>}</td>
                        </tr>
                      ))}
                      {!rows.length && (
                        <tr><td colSpan="8" className="empty">No orders match that filter.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, tone, big, onClick }) {
  return (
    <button className={"kpi" + (big ? " big" : "") + (tone ? " " + tone : "")} onClick={onClick}>
      <span className="klabel">{label}</span>
      <span className="kvalue">{value}</span>
      <span className="ksub">{sub}</span>
    </button>
  );
}

function OrderDetail({ order, demo, partners, onBack }) {
  const p = partners.find((x) => x.id === order.partner);
  const risk = riskOf(order, demo);
  return (
    <>
      <button className="back" onClick={onBack}>&#8592; All orders</button>

      <div className="conhead">
        <div>
          <h1>Order #{order.id}</h1>
          <p>{order.store.name} &middot; {order.region} &middot; {STATUS_LABEL[order.status]}</p>
        </div>
        <span className={"pill big " + risk}>
          {isDelivered(order) ? mins(totalMs(order)) + " min taken" : clock(leftMs(order, demo)) + " of SLA left"}
        </span>
      </div>

      <div className="detailgrid">
        <section className="panel">
          <div className="panelhead"><h2>Summary</h2></div>
          <div className="kv"><span>Customer</span><b>{order.cust.name}</b></div>
          <div className="kv"><span>Drop</span><b>{order.cust.addr}</b></div>
          <div className="kv"><span>Partner</span><b>{p ? p.name + " \u00b7 " + p.veh : "Not assigned"}</b></div>
          <div className="kv"><span>Pickup gates</span><b>{order.gates.map((g) => "Gate " + g + " (" + GATES[g].short + ")").join(", ")}</b></div>
          <div className="kv"><span>Units</span><b>{unitsOf(order.items)} across {order.items.length} lines</b></div>
          <div className="kv"><span>Payment</span><b>{rs(order.amount)} {order.upiPaid ? "cash and UPI" : "cash on delivery"}</b></div>
          <div className="items">
            {order.items.map((it) => (
              <div className="iline" key={it.n}><span>{it.n}</span><b>{unitLine(it)}</b></div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panelhead"><h2>Stage times</h2><span>against this order, not the average</span></div>
          {STAGES.map((st) => {
            const v = stageMs(order, st);
            return (
              <div className="kv" key={st.key}>
                <span>{st.label}</span>
                <b>{v == null ? <span className="muted">not reached</span> : mins(v) + " min"}</b>
              </div>
            );
          })}
          <div className="kv total">
            <span>Total</span>
            <b>{totalMs(order) == null ? <span className="muted">in flight</span> : mins(totalMs(order)) + " min of 60"}</b>
          </div>
        </section>

        <section className="panel wide">
          <div className="panelhead">
            <h2>Support ticket</h2>
            {order.ticket && <span>{order.ticket.id} &middot; opened at {mins(order.ticket.openedAt - order.placedAt)} min into the order</span>}
          </div>
          {order.ticket ? (
            <>
              <div className="ticketbar">
                <span className={"pill " + (order.ticket.status === "open" ? "late" : "ontime")}>{order.ticket.status}</span>
                <b>{order.ticket.reason}</b>
                <span className="muted">
                  {order.ticket.resolvedAt
                    ? "closed in " + mins(order.ticket.resolvedAt - order.ticket.openedAt) + " min"
                    : "still open"}
                </span>
              </div>
              <div className="thread">
                {order.ticket.thread.map((m, i) => (
                  <div className={"msg " + m.who.toLowerCase()} key={i}>
                    <div className="who">{m.who}<span>{mins(m.at - order.placedAt)} min in</span></div>
                    <p>{m.text}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="muted" style={{ margin: 0 }}>No ticket was raised on this order.</p>
          )}
        </section>
      </div>
    </>
  );
}

function Placeholder({ tab }) {
  return (
    <div className="placeholder">
      <h1>{tab.label}</h1>
      <p>
        Out of scope for this MVP. The console is built around delivery management, since that is the flow the partner app
        actually drives. The other tabs would read from the same order object: {tab.id === "inventory"
          ? "stock at each dark store, against what orders are consuming"
          : tab.id === "support"
          ? "every ticket across orders, which is already surfaced per order under delivery management"
          : tab.id === "orders"
          ? "catalogue, pricing and order intake before it reaches a store"
          : "partner documents, vehicle capacity and shift booking"}.
      </p>
    </div>
  );
}
