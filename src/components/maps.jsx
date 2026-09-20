import React from "react";
import { GATES } from "../data.js";

/* ---------- compound driveway ----------
   One loop road around the store, clockwise from the entrance at bottom
   centre. Gate marks are distances along that road, so the green line is the
   path the four wheeler drives, never a line drawn across the building. */
const RING_D = "M 150 200 L 40 200 A 20 20 0 0 1 20 180 L 20 40 A 20 20 0 0 1 40 20 L 260 20 A 20 20 0 0 1 280 40 L 280 180 A 20 20 0 0 1 260 200 Z";
const RING_LEN = 845.66;
const GATE_AT = { A: 211.42, B: 422.84, C: 634.26 };
const ARC = (Math.PI / 2) * 20;

const RING_SEGS = [
  { t: "l", x0: 150, y0: 200, x1: 40, y1: 200, len: 110 },
  { t: "a", cx: 40, cy: 180, a0: 90, a1: 180, len: ARC },
  { t: "l", x0: 20, y0: 180, x1: 20, y1: 40, len: 140 },
  { t: "a", cx: 40, cy: 40, a0: 180, a1: 270, len: ARC },
  { t: "l", x0: 40, y0: 20, x1: 260, y1: 20, len: 220 },
  { t: "a", cx: 260, cy: 40, a0: 270, a1: 360, len: ARC },
  { t: "l", x0: 280, y0: 40, x1: 280, y1: 180, len: 140 },
  { t: "a", cx: 260, cy: 180, a0: 0, a1: 90, len: ARC },
  { t: "l", x0: 260, y0: 200, x1: 150, y1: 200, len: 110 }
];

function ringPoint(s) {
  let left = Math.max(0, Math.min(RING_LEN, s));
  for (let i = 0; i < RING_SEGS.length; i++) {
    const g = RING_SEGS[i];
    if (left > g.len && i < RING_SEGS.length - 1) { left -= g.len; continue; }
    const f = g.len ? left / g.len : 0;
    if (g.t === "l") {
      const dx = g.x1 - g.x0;
      const dy = g.y1 - g.y0;
      return { x: g.x0 + dx * f, y: g.y0 + dy * f, a: (Math.atan2(dy, dx) * 180) / Math.PI };
    }
    const ang = ((g.a0 + (g.a1 - g.a0) * f) * Math.PI) / 180;
    return { x: g.cx + 20 * Math.cos(ang), y: g.cy + 20 * Math.sin(ang), a: (ang * 180) / Math.PI + 90 };
  }
  return { x: 150, y: 200, a: 180 };
}

function Chevron({ at }) {
  const p = ringPoint(at);
  return (
    <g transform={`translate(${p.x.toFixed(1)},${p.y.toFixed(1)}) rotate(${p.a.toFixed(1)})`}>
      <path d="M -4 -4 L 2 0 L -4 4" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

export function GateMap({ order, activeIdx }) {
  const seqOf = {};
  order.gates.forEach((g, i) => { seqOf[g] = i + 1; });

  const routeEnd = GATE_AT[order.gates[order.gates.length - 1]];
  const doneLen = order.gates.reduce((a, g) => (order.gateDone[g] ? Math.max(a, GATE_AT[g]) : a), 0);
  const van = ringPoint(doneLen);
  const next = order.gates[activeIdx];
  const arrows = [0.3, 0.62, 0.9].map((f) => routeEnd * f).filter((at) => at > doneLen + 14);

  const fillFor = (g) => {
    if (order.gateDone[g]) return "#1B7A45";
    if (!seqOf[g]) return "#D6D9CF";
    return next === g ? "#EFC42E" : "#FBEAB0";
  };

  /* A key inside the building: one row per gate, never overlapping. */
  const row = (g, y) => {
    const done = !!order.gateDone[g];
    const on = !!seqOf[g];
    return (
      <g key={"row" + g}>
        <rect x="70" y={y - 8} width="16" height="16" rx="4" fill={fillFor(g)} />
        <text x="78" y={y + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill={done ? "#fff" : "#1A1713"}>
          {done ? "\u2713" : g}
        </text>
        <text x="93" y={y + 4} fontSize="10.5" fontWeight="700" fill={on ? "#1A1713" : "#A19B92"}>
          {GATES[g].short}
        </text>
      </g>
    );
  };

  return (
    <div className="card" style={{ padding: 10 }}>
      <svg viewBox="0 0 320 268" style={{ width: "100%", height: "auto" }} role="img" aria-label="Which gate to drive to inside the dark store yard">
        <rect width="320" height="268" rx="10" fill="#EDF0E8" />
        <g transform="translate(0,12)">
          {/* the yard road */}
          <path d={RING_D} stroke="#CFD5C6" strokeWidth="26" fill="none" />
          <path d={RING_D} stroke="#FFFFFF" strokeWidth="22" fill="none" />
          <path d={RING_D} stroke="#DDE1D6" strokeWidth="1.5" strokeDasharray="6 7" fill="none" />

          {/* the building, with a shutter cut at each gate */}
          <rect x="62" y="50" width="176" height="118" rx="7" fill="#E4E3DD" />
          <rect x="58" y="96" width="8" height="34" rx="2" fill={fillFor("A")} />
          <rect x="132" y="46" width="36" height="8" rx="2" fill={fillFor("B")} />
          <rect x="234" y="96" width="8" height="34" rx="2" fill={fillFor("C")} />

          {row("A", 76)}
          {row("B", 108)}
          {row("C", 140)}

          {/* route, then the part already driven */}
          <path d={RING_D} stroke="#2A64D6" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.26" strokeDasharray={`${routeEnd} ${RING_LEN}`} />
          {doneLen > 0 && (
            <path d={RING_D} stroke="#2A64D6" strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray={`${doneLen} ${RING_LEN}`} />
          )}
          {arrows.map((at) => <Chevron key={at} at={at} />)}

          {/* gate markers on the road */}
          {["A", "B", "C"].map((g) => {
            const at = ringPoint(GATE_AT[g]);
            const seq = seqOf[g];
            const cur = next === g;
            const done = !!order.gateDone[g];
            return (
              <g key={g} transform={`translate(${at.x},${at.y})`}>
                {cur && <circle r="21" fill="none" stroke="#1A1713" strokeWidth="1.5" strokeDasharray="3 4" />}
                <circle r="15" fill={fillFor(g)} stroke="#fff" strokeWidth="2.5" />
                <text y="5" textAnchor="middle" fontSize="14" fontWeight="800" fill={done ? "#fff" : "#1A1713"}>{done ? "\u2713" : g}</text>
                {seq ? (
                  <>
                    <circle cx="13" cy="-13" r="8.5" fill="#1A1713" />
                    <text x="13" y="-9.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff">{seq}</text>
                  </>
                ) : null}
              </g>
            );
          })}

          {/* you, and the way in */}
          <g transform={`translate(${van.x.toFixed(1)},${van.y.toFixed(1)})`}>
            <g transform={`rotate(${van.a.toFixed(1)})`}>
              <rect x="-12" y="-7.5" width="24" height="15" rx="3" fill="#1A1713" />
              <rect x="-12" y="-7.5" width="8" height="15" rx="3" fill="#EFC42E" />
            </g>
            <g transform="translate(0,-25)">
              <rect x="-18" y="-10" width="36" height="16" rx="8" fill="#1A1713" />
              <text y="1" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff">YOU</text>
            </g>
          </g>
          <g transform="translate(150,224)">
            <path d="M 0 -7 L 6 4 L -6 4 Z" fill="#1A1713" />
            <text y="18" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#6B665E">ENTRY from 80 Feet Road</text>
          </g>
        </g>
      </svg>

      <ol className="drivesteps">
        <li className={doneLen > 0 ? "done" : "now"}>
          <b>{doneLen > 0 ? "\u2713" : "1"}</b>
          <span>Enter from 80 Feet Road and keep left along the yard</span>
        </li>
        {order.gates.map((g, i) => {
          const done = !!order.gateDone[g];
          const cls = done ? "done" : next === g ? "now" : "";
          return (
            <li className={cls} key={g}>
              <b>{done ? "\u2713" : i + 2}</b>
              <span><strong>Gate {g}</strong>, {GATES[g].where}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
