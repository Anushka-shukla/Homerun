import React from "react";
import { useT } from "../../i18n.jsx";
import { STORE, GATES, rs, unitsOf } from "../../data.js";
import { SlideToConfirm, Items } from "../ui.jsx";
import { GateMap } from "../maps.jsx";
import LeafletMap from "../LeafletMap.jsx";

export function NewOrderScreen({ order, partner, onAccept, onReject }) {
  const t = useT();
  return (
    <>
      <div className="neworder"><span>{t("New order")}</span></div>
      <div>
        <div className="orderhead">
          <div><div className="id">{t("ORDER ID")}</div><div className="num">{order.id}</div></div>
          <div style={{ textAlign: "right" }}><div className="id">{t("PAYOUT")}</div><div className="num">{rs(order.payout)}</div></div>
        </div>
        <div className="orderbody">
          <div className="pinrow">
            <span className="tag">{t("Pick up")}</span>
            <div className="addr"><b>{STORE.name}</b>{STORE.addr}</div>
          </div>
          <div className="eta">
            <div><b>{order.storeKm} km</b>{t("to store")}</div>
            <div><b>{order.cust.km} km</b>{t("to drop")}</div>
            <div><b>{order.kg} kg</b>{t("load")}</div>
          </div>
          <div className="k" style={{ marginTop: 12 }}>{t("Items")}</div>
          <Items items={order.items} />
          <div className="rowline" style={{ marginTop: 6 }}>
            <span>{t("Pick up from")}</span><b>{order.gates.map((g) => t("Gate {g}", { g })).join(t(" then "))}</b>
          </div>
          <div className="rowline"><span>{t("Payment")}</span><b>{t("Cash on delivery {amt}", { amt: rs(order.amount) })}</b></div>
          <div className="rowline"><span>{t("Assigned to")}</span><b>{partner ? partner.name + " \u00b7 " + partner.veh : "\u2014"}</b></div>
        </div>
      </div>
      <div className="btnrow">
        <button className="btn danger" style={{ flex: 1 }} onClick={onReject}>{t("Decline")}</button>
        <button className="btn green" style={{ flex: 2 }} onClick={onAccept}>{t("Accept order")}</button>
      </div>
    </>
  );
}

export function ToStoreScreen({ order, progress, onReached }) {
  const t = useT();
  const eta = Math.max(1, Math.round(((order.storeKm * (1 - progress)) / 18) * 60));
  return (
    <>
      <LeafletMap path={order.storeLeg} progress={progress} destKind="store" originKind="you" />
      <div className="mapsheet">
        <div className="pinrow">
          <span className="tag">{t("Pick up")}</span>
          <div className="addr"><b>{STORE.name}</b>{STORE.addr}</div>
        </div>
        <div className="eta">
          <div><b>{eta} min</b>{t("to store")}</div>
          <div><b>{t("Gate {g}", { g: order.gates.join(", ") })}</b>{t("pickup")}</div>
        </div>
        <button className="btn" onClick={onReached}>{t("Reached the store")}</button>
        <div className="sub" style={{ textAlign: "center", marginTop: 8 }}>
          {t("Your gate sequence opens once you reach the store")}
        </div>
      </div>
    </>
  );
}

export function GatePlanScreen({ order, onStart }) {
  const t = useT();
  return (
    <>
      <div className="hl">{t("You are at the store. Pick from {n} gates", { n: order.gates.length })}</div>
      <div className="sub">{t("Gates are split by material so heavy loads never cross the floor. Follow the order below.")}</div>
      <GateMap order={order} activeIdx={0} />
      {order.gates.map((g, i) => {
        const G = GATES[g];
        return (
          <div className="card" key={g} style={{ borderLeft: "3px solid " + (i === 0 ? "#EFC42E" : "#DCDAD4") }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: "#1A1713", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13, flex: "none" }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{t(G.name)}</div>
                <div className="k" style={{ marginTop: 2 }}>{G.zone} &middot; {t("picker")} {G.picker}</div>
              </div>
            </div>
            <div className="sub" style={{ margin: "8px 0 0" }}>{t(G.why)}</div>
            <Items items={order.items.filter((i2) => i2.g === g)} showBay />
          </div>
        );
      })}
      <button className="btn" onClick={onStart}>{t("Start at Gate {g}", { g: order.gates[0] })}</button>
    </>
  );
}

export function GateScreen({ order, onScan }) {
  const t = useT();
  const g = order.gates[order.gateIdx];
  const G = GATES[g];
  const items = order.items.filter((i) => i.g === g);
  const units = unitsOf(items);
  return (
    <>
      <div className="hl">{t("Gate {g} · step {i} of {n}", { g, i: order.gateIdx + 1, n: order.gates.length })}</div>
      <div className="sub">{(() => { const w = t(G.where); return w.charAt(0).toUpperCase() + w.slice(1); })()}.</div>
      <div className="orderid">
        <span className="olabel">{t("ORDER ID")}</span>
        <b>{order.id}</b>
        <span className="ohint">{t("Read this out to {picker} before you scan", { picker: G.picker })}</span>
      </div>
      <GateMap order={order} activeIdx={order.gateIdx} />
      <div className="card">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: "#C23A22", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800 }}>R</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{G.picker}</div>
            <div className="k">{t("Picker at Gate {g}", { g })}</div>
          </div>
        </div>
        <div className="k" style={{ marginTop: 12 }}>{t("Collect here · {n} units", { n: units })}</div>
        <Items items={items} showBay />
      </div>
      {order.flags.includes("wrong item") && (
        <div className="card" style={{ borderColor: "#F0CFC7", background: "#FBE9E5" }}>
          <b style={{ fontSize: 13 }}>{t("Item mismatch reported")}</b>
          <div className="sub" style={{ marginTop: 2 }}>{t("{picker} is repacking. Rescan once the corrected bag is handed over.", { picker: G.picker })}</div>
        </div>
      )}
      <button className="btn" onClick={onScan}>{t("Scan the picker QR at Gate {g}", { g })}</button>
    </>
  );
}

export function GateMoveScreen({ order, onReached }) {
  const t = useT();
  const from = order.gates[order.gateIdx - 1];
  const to = order.gates[order.gateIdx];
  return (
    <>
      <div className="hl">{t("Move to Gate {g}", { g: to })}</div>
      <div className="sub">{t("Gate {g} is collected and loaded. Keep the vehicle and drive around to the next gate.", { g: from })}</div>
      <GateMap order={order} activeIdx={order.gateIdx} />
      <div className="card">
        <div className="rowline"><span>{t("From")}</span><b>{t("Gate {g}", { g: from })}, {t(GATES[from].short).toLowerCase()}</b></div>
        <div className="rowline"><span>{t("To")}</span><b>{t("Gate {g}", { g: to })}, {t(GATES[to].short).toLowerCase()}</b></div>
        <div className="rowline"><span>{t("Inside the yard")}</span><b>{t("about 60 m, keep left")}</b></div>
        <div className="rowline"><span>{t("Picker waiting")}</span><b>{GATES[to].picker}</b></div>
      </div>
      <button className="btn" onClick={onReached}>{t("Reached Gate {g}", { g: to })}</button>
    </>
  );
}

export function CollectedScreen({ order, onPicked }) {
  const t = useT();
  return (
    <>
      <div style={{ marginTop: 12 }}>
        <div className="orderhead">
          <div><div className="id">{t("ORDER ID")}</div><div className="num">{order.id}</div></div>
          <div style={{ textAlign: "right" }}><div className="id">{t("LOADED")}</div><div className="num">{t("{n} units", { n: unitsOf(order.items) })}</div></div>
        </div>
        <div className="orderbody">
          {order.gates.map((g) => (
            <div key={g} style={{ display: "flex", gap: 10, alignItems: "center", background: "#F5F5F2", borderRadius: 12, padding: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "#1B7A45", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800 }}>&#10003;</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{t("Gate {g}", { g })} &middot; {t(GATES[g].short).toLowerCase()}</div>
                <div className="k">{t("Verified with {picker}", { picker: GATES[g].picker })}</div>
              </div>
            </div>
          ))}
          <div className="k" style={{ marginTop: 4 }}>{t("Order details")}</div>
          <Items items={order.items} />
          <div className="rowline"><span>{t("Customer")}</span><b>{order.cust.name}</b></div>
          <div className="rowline"><span>{t("Drop")}</span><b style={{ textAlign: "right", maxWidth: 190 }}>{order.cust.addr}</b></div>
          <div className="rowline"><span>{t("Collect at drop")}</span><b>{t("{amt} cash", { amt: rs(order.amount) })}</b></div>
        </div>
      </div>
      <SlideToConfirm label={t("Slide to mark order picked")} onConfirm={onPicked} />
    </>
  );
}

export function ScannerScreen({ order, onScan, onCancel, onWrongItem }) {
  const t = useT();
  const g = order.gates[order.gateIdx];
  const G = GATES[g];
  return (
    <div className="scanner">
      <div className="top">
        <button style={{ background: "none", border: 0, color: "#fff", fontSize: 18 }} onClick={onCancel}>&#10005;</button>
        <span>{t("Order {id} · Gate {g}", { id: order.id, g })}</span>
        <span>&#9728;</span>
      </div>
      <div className="mid">
        <div>
          <div className="viewf"><i /></div>
          <p>{t("Ask {picker} at {zone} to show the Gate {g} QR", { picker: G.picker, zone: G.zone, g })}</p>
        </div>
      </div>
      <div className="acts">
        <button className="btn green" onClick={onScan}>{t("Scan")}</button>
        <button className="btn ghost" style={{ background: "transparent", color: "#fff", borderColor: "#4A473F" }} onClick={onWrongItem}>
          {t("This is not the right item")}
        </button>
      </div>
    </div>
  );
}
