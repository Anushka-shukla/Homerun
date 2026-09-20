import React from "react";
import { WEEK_HISTORY, STAGE_TARGET } from "../data.js";
import { STAGES, stageMs, isDelivered, wasOnTime, mins } from "./metrics.js";

/* Bars are orders delivered, the line is on-time rate. Same chart, because the
   question is always "did volume go up and did we hold the promise". */
function WeekChart({ points }) {
  const W = 320;
  const H = 150;
  const padL = 26;
  const padB = 22;
  const padT = 10;
  const maxOrders = Math.max(...points.map((p) => p.orders), 1);
  const bw = (W - padL - 8) / points.length;

  const xy = (i, rate) => [
    padL + bw * i + bw / 2,
    padT + (1 - rate / 100) * (H - padT - padB)
  ];
  const line = points.map((p, i) => xy(i, p.rate).join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="wchart" role="img" aria-label="Deliveries and on-time rate by week">
      {[0, 50, 100].map((g) => {
        const y = padT + (1 - g / 100) * (H - padT - padB);
        return (
          <g key={g}>
            <line x1={padL} y1={y} x2={W - 4} y2={y} stroke="var(--line)" strokeWidth="1" />
            <text x={padL - 5} y={y + 3} textAnchor="end" fontSize="8" fill="var(--ink-soft)">{g}%</text>
          </g>
        );
      })}

      {points.map((p, i) => {
        const h = (p.orders / maxOrders) * (H - padT - padB) * 0.78;
        return (
          <g key={p.label}>
            <rect x={padL + bw * i + bw * 0.22} y={H - padB - h} width={bw * 0.56} height={h} rx="2"
                  fill={p.live ? "#EFC42E" : "#D9DCD2"} />
            <text x={padL + bw * i + bw / 2} y={H - padB + 11} textAnchor="middle" fontSize="8"
                  fontWeight={p.live ? 800 : 600} fill="var(--ink-soft)">{p.label}</text>
          </g>
        );
      })}

      <polyline points={line} fill="none" stroke="#1B7A45" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => {
        const [x, y] = xy(i, p.rate);
        return <circle key={p.label} cx={x} cy={y} r={p.live ? 4 : 3} fill="#fff" stroke="#1B7A45" strokeWidth="2.5" />;
      })}
    </svg>
  );
}

export default function Trends({ orders }) {
  const delivered = orders.filter(isDelivered);
  const live = {
    label: "Now",
    orders: delivered.length,
    rate: delivered.length ? Math.round((delivered.filter(wasOnTime).length / delivered.length) * 100) : 0,
    live: true
  };
  const points = [
    ...WEEK_HISTORY.map((w) => ({ label: w.label, orders: w.orders, rate: Math.round((w.onTime / w.orders) * 100) })),
    live
  ];

  const last = WEEK_HISTORY[WEEK_HISTORY.length - 1];
  const prev = WEEK_HISTORY[WEEK_HISTORY.length - 2];

  /* This week's stage times come from the live orders where they exist, and
     fall back to last week's average where nothing has cleared that stage. */
  const nowStage = (key) => {
    const st = STAGES.find((x) => x.key === key);
    const vals = orders.map((o) => stageMs(o, st)).filter((v) => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length / 60000 : last.stages[key];
  };

  const gaps = STAGES.map((st) => {
    const now = nowStage(st.key);
    const target = STAGE_TARGET[st.key];
    const before = prev.stages[st.key];
    return { key: st.key, label: st.label, now, target, delta: now - target, wow: now - before };
  }).sort((a, b) => b.delta - a.delta);

  const worst = gaps[0];
  const reasonFor = {
    transit: "Evening traffic on 100 Feet Road",
    pickup: "Picker queue at the heavy gate",
    assignment: "No four wheeler free",
    dropoff: "Cash handling at the door",
    packaging: "Picker queue at the heavy gate"
  };

  return (
    <>
      <section className="panel">
        <div className="panelhead">
          <h2>Week on week</h2>
          <span>bars are orders delivered, line is on-time rate</span>
        </div>
        <WeekChart points={points} />
        <div className="wnote">
          On-time moved from {Math.round((prev.onTime / prev.orders) * 100)}% to{" "}
          {Math.round((last.onTime / last.orders) * 100)}% last week on {last.orders} orders. The yellow bar is this demo.
        </div>
      </section>

      <section className="panel">
        <div className="panelhead">
          <h2>Where the gap is</h2>
          <span>this week against the stage target, worst first</span>
        </div>

        <div className="gaps">
          {gaps.map((g) => {
            const over = g.delta > 0;
            const scale = Math.max(...gaps.map((x) => Math.max(x.now, x.target)));
            return (
              <div className="gap" key={g.key}>
                <div className="gaphead">
                  <b>{g.label}</b>
                  <span className={over ? "over" : "under"}>
                    {g.now.toFixed(1)} min against {g.target} min target
                  </span>
                </div>
                <div className="gaptrack">
                  <i className={over ? "over" : ""} style={{ width: (g.now / scale) * 100 + "%" }} />
                  <u style={{ left: (g.target / scale) * 100 + "%" }} />
                </div>
                <div className="gapfoot">
                  {over ? `${g.delta.toFixed(1)} min over target` : `${Math.abs(g.delta).toFixed(1)} min inside target`}
                  {" \u00b7 "}
                  {g.wow > 0 ? `${g.wow.toFixed(1)} min worse than last week` : `${Math.abs(g.wow).toFixed(1)} min better than last week`}
                  {over ? ` \u00b7 ${reasonFor[g.key]}` : ""}
                </div>
              </div>
            );
          })}
        </div>

        <div className="reasons">
          <div className="rhead">Why last week's orders ran late</div>
          {last.reasons.map(([reason, share]) => (
            <div className="reason" key={reason}>
              <span className="rname">{reason}</span>
              <span className="rbar"><i style={{ width: share + "%" }} /></span>
              <span className="rpct">{share}%</span>
            </div>
          ))}
          <div className="rfoot">
            Biggest lever right now is <b>{worst.label.toLowerCase()}</b>, running {worst.delta.toFixed(1)} min over target.
          </div>
        </div>
      </section>
    </>
  );
}
