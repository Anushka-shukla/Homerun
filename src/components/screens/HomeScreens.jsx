import React, { useMemo } from "react";
import { useT } from "../../i18n.jsx";
import { STORE, FLOW, stage } from "../../data.js";
import { ProgressCard } from "../ui.jsx";
import LeafletMap from "../LeafletMap.jsx";
import { legPath, PARTNER_START, STORE as S2 } from "../../data.js";

export function SimCard({ busy, onSimulate }) {
  const t = useT();
  return (
    <div className="card dark" style={{ marginTop: 14 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--yellow)", display: "grid", placeItems: "center", flex: "none" }}>
          <svg width="12" height="16" viewBox="0 0 16 20" aria-hidden="true"><path d="M9.6 0 0 11.6h5.4L4.8 20 16 7.7h-6.1L9.6 0Z" fill="#1A1713" /></svg>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14 }}>{t("Dark store simulator")}</div>
          <div className="k" style={{ marginTop: 2 }}>{t("Creates a consumer order at DS-04 and packs it")}</div>
        </div>
      </div>
      <button className="btn" style={{ background: "var(--yellow)", color: "#3D2F03" }} disabled={busy} onClick={onSimulate}>
        {busy ? t("Packing the order") : t("Simulate new order")}
      </button>
    </div>
  );
}

export function IntakeCard({ order }) {
  const t = useT();
  const steps = [["Order placed", "placed"], ["Routed to DS-04", "routed"], ["Packing in progress", "packing"], ["Ready for pickup", "ready"]];
  return (
    <div className="card">
      <div className="k">{t("Incoming order {id}", { id: order.id })}</div>
      {steps.map(([label, st]) => {
        const on = stage(order) >= FLOW.indexOf(st);
        return (
          <div className="rowline" key={st}>
            <span style={{ color: on ? "#1A1713" : "#A19B92" }}>{t(label)}</span>
            <b style={{ color: on ? "#1B7A45" : "#A19B92" }}>{on ? "\u2713" : "\u2022 \u2022 \u2022"}</b>
          </div>
        );
      })}
    </div>
  );
}

export function OfflineScreen({ state, onSimulate }) {
  const t = useT();
  return (
    <>
      <SimCard busy={state.busy} onSimulate={onSimulate} />
      <div className="card flat">
        <div className="k">{t("Go online to start receiving orders")}</div>
        <div style={{ fontSize: 13, marginTop: 6, color: "#5E594F" }}>
          {t("Indiranagar DS-04 is open 8 am to 8 pm. Heavy load gigs pay extra.")}
        </div>
      </div>
      <ProgressCard state={state} />
      <div className="hl">{t("Offers for you")}</div>
      <div className="card dark">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{t("Cement run bonus, weekend")}</div>
            <div className="k" style={{ marginTop: 3 }}>{t("Sat 8 am to Sun 8 pm · Live")}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 19, fontWeight: 800 }}>&#8377;640</div>
            <div className="k">{t("Extra")}</div>
          </div>
        </div>
      </div>
    </>
  );
}

export function SearchingScreen({ state, live, me, onSimulate }) {
  const t = useT();
  const idlePath = useMemo(() => legPath(PARTNER_START, S2.at), []);
  const packing = live && stage(live) < FLOW.indexOf("assigned");
  return (
    <>
      <LeafletMap
        path={idlePath}
        progress={0}
        destKind="store"
        originKind="you"
        overlay={
          <>
            <div className="radar"><span className="ping" />{t("Searching for orders")}</div>
            <div className="youare">{t("You are here")}</div>
          </>
        }
      />
      <div className="card flat" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13.5, fontWeight: 800 }}>{STORE.name}</div>
        <div className="k" style={{ marginTop: 3 }}>{t("Orders from this store come to you first")}</div>
      </div>
      {packing ? <IntakeCard order={live} /> : <SimCard busy={state.busy} onSimulate={onSimulate} />}
      <div className="card">
        <div className="rowline"><span>You are at</span><b>Dark store, 0.0 km</b></div>
        <div className="rowline"><span>Load capacity</span><b>{me ? me.cap : 0} kg</b></div>
      </div>
      <ProgressCard state={state} />
    </>
  );
}

/* Allocation used to sit in the ops panel. It belongs here: the partner sees
   why the job came to them and who else was in the running. */
export function AllocationScreen({ order, partners, meId }) {
  const t = useT();
  const ranked = [...partners].sort((a, b) => a.km - b.km);
  const winner = ranked.find((p) => p.status === "available" && p.cap >= order.kg);

  return (
    <>
      <div className="hl">{t("Matching a partner")}</div>
      <div className="sub">
        {t("Order {id} weighs {kg} kg. Nearest first, skipping anyone whose vehicle cannot take it.", { id: order.id, kg: order.kg })}
      </div>

      <div className="card" style={{ padding: 10 }}>
        {ranked.map((p) => {
          const tooHeavy = p.cap < order.kg;
          const busy = p.status !== "available";
          const out = tooHeavy || busy;
          const chosen = winner && p.id === winner.id;
          return (
            <div className={"alloc" + (chosen ? " win" : "") + (out ? " out" : "")} key={p.id}>
              <div className="av">{p.name.charAt(0)}</div>
              <div className="who">
                <b>{p.name}{p.id === meId ? t(" (you)") : ""}</b>
                <span>{p.veh} &middot; {t("up to {cap} kg", { cap: p.cap })} &middot; {p.rating}&#9733;</span>
              </div>
              <div className="verdict">
                {t(chosen ? "assigning" : tooHeavy ? "load too heavy" : busy ? "on another trip" : "standby")}
                <span>{t("{km} km away", { km: p.km })}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card flat">
        <div className="rowline"><span>{t("Pickup gates")}</span><b>{order.gates.map((g) => t("Gate {g}", { g })).join(t(" then "))}</b></div>
        <div className="rowline"><span>{t("Drop")}</span><b>{t("{km} km away", { km: order.cust.km })}</b></div>
      </div>
    </>
  );
}
