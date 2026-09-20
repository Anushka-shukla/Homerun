import React from "react";
import { useT } from "../../i18n.jsx";
import { rs, unitsOf, unitLine } from "../../data.js";
import { ProgressCard } from "../ui.jsx";
import LeafletMap from "../LeafletMap.jsx";

export function ToCustomerScreen({ order, progress, onCall, onChat, onArrived }) {
  const t = useT();
  const eta = Math.max(1, Math.round(((order.cust.km * (1 - progress)) / 18) * 60));
  return (
    <>
      <LeafletMap path={order.dropLeg} progress={progress} destKind="drop" originKind="store" />
      <div className="mapsheet">
        <div className="pinrow">
          <span className="tag drop">{t("Drop")}</span>
          <div className="addr"><b>{order.cust.name}</b>{order.cust.addr}<br />Order {order.id}</div>
        </div>
        <div className="eta">
          <div><b>{eta} min</b>{t("to drop")}</div>
          <div><b>{(order.cust.km * (1 - progress)).toFixed(1)} km</b>{t("remaining")}</div>
          <div><b>{rs(order.amount)}</b>{t("cash to collect")}</div>
        </div>
        <div className="btnrow">
          <button className="btn ghost" style={{ flex: 1 }} onClick={onCall}>{t("Call")}</button>
          <button className="btn ghost" style={{ flex: 1 }} onClick={onChat}>{t("Chat")}</button>
        </div>
        <button className="btn green" onClick={onArrived}>{t("Reached the drop")}</button>
      </div>
    </>
  );
}

export function PodScreen({ order, photo, otp, onPhoto, onOtp, onVerify }) {
  const t = useT();
  return (
    <>
      <div className="hl">{t("Hand over {n} units", { n: unitsOf(order.items) })}</div>
      <div className="sub">{t("Count the material out with the customer, then take the photo and the OTP.")}</div>
      <div className="card">
        {order.items.map((it) => (
          <div className="rowline" key={it.n}>
            <span>{it.n}</span><b>{unitLine(it)}</b>
          </div>
        ))}
        <div className="rowline"><span>{t("Total handed over")}</span><b>{t("{n} units", { n: unitsOf(order.items) })}</b></div>
      </div>
      <div className={"photo" + (photo ? " has" : "")} aria-live="polite">
        {photo ? (
          <svg viewBox="0 0 220 132" aria-label="Delivery photo">
            <rect width="220" height="132" fill="#D9DCD2" />
            <rect x="18" y="52" width="72" height="62" rx="4" fill="#C9B79A" />
            <rect x="96" y="66" width="46" height="48" rx="3" fill="#E4D9C4" />
            <rect x="148" y="40" width="54" height="74" rx="4" fill="#B9BEB0" />
            <rect x="0" y="114" width="220" height="18" fill="#A9AC9E" />
            <circle cx="182" cy="26" r="12" fill="#EFC42E" />
          </svg>
        ) : (
          <div className="photo-empty">
            <span className="camring">
              <svg width="26" height="22" viewBox="0 0 30 26" aria-hidden="true">
                <rect x="1" y="5" width="28" height="20" rx="5" stroke="#1A1713" strokeWidth="2.4" fill="none" />
                <path d="M10 5 L12 1 H18 L20 5" stroke="#1A1713" strokeWidth="2.4" fill="none" strokeLinejoin="round" />
                <circle cx="15" cy="15" r="5.5" stroke="#1A1713" strokeWidth="2.4" fill="none" />
              </svg>
            </span>
            <span className="phead">{t("Photo of the unloaded material")}</span>
            <span className="psub">{t("Stack it at the drop point and take one clear photo")}</span>
          </div>
        )}
      </div>
      <button className={photo ? "btn ghost" : "btn"} onClick={onPhoto}>
        {photo ? t("Replace the photo") : t("Click here to upload photo of the item")}
      </button>

      <div className="k" style={{ marginTop: 14 }}>{t("Customer OTP")}</div>
      <input
        className="otp"
        inputMode="numeric"
        maxLength={4}
        placeholder="0000"
        value={otp}
        aria-label="Customer OTP"
        onChange={(e) => onOtp(e.target.value)}
      />
      <div className="sub" style={{ textAlign: "center" }}>{t("Customer reads out {otp}", { otp: order.otp })}</div>
      <button className="btn green" disabled={!photo} onClick={onVerify}>{t("Confirm delivery")}</button>
    </>
  );
}

export function PaymentScreen({ order, onCollected, onShort, onUpi, onComplete }) {
  const t = useT();
  const upi = order.upiPaid || 0;
  const cash = Math.max(0, (order.collected || 0) - upi);
  const mode = upi >= order.amount ? "UPI" : upi > 0 ? "Cash and UPI" : "Cash on delivery";

  if (order.status === "paid") {
    return (
      <>
        <div className="hl">{t("Payment completed")}</div>
        <div className="card flat" style={{ textAlign: "center", padding: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#1B7A45", color: "#fff", display: "grid", placeItems: "center", margin: "0 auto 10px", fontSize: 24 }}>&#10003;</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" }}>{rs(order.collected || order.amount)}</div>
          <div className="k" style={{ marginTop: 3 }}>
            {upi >= order.amount
              ? t("Paid by UPI by {name}", { name: order.cust.name })
              : upi > 0
              ? t("{cash} cash and {upi} UPI from {name}", { cash: rs(cash), upi: rs(upi), name: order.cust.name })
              : t("Cash collected from {name}", { name: order.cust.name })}
          </div>
        </div>
        <div className="card">
          <div className="rowline"><span>{t("Order")}</span><b>{order.id}</b></div>
          <div className="rowline"><span>{t("Mode")}</span><b>{t(mode)}</b></div>
          <div className="rowline"><span>{t("Cash in your pocket")}</span><b>{rs(cash)}</b></div>
          {upi > 0 && <div className="rowline"><span>{t("Settled to HomeRun on UPI")}</span><b>{rs(upi)}</b></div>}
        </div>
        <button className="btn green" onClick={onComplete}>{t("Complete order")}</button>
      </>
    );
  }

  return (
    <>
      <div className="hl">{t("Collect cash from the customer")}</div>
      <div className="sub">{t("Delivery is confirmed. Take the cash before you close the trip.")}</div>
      <div className="card dark" style={{ textAlign: "center", padding: 20 }}>
        <div className="k">{t("Amount due")}</div>
        <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-.03em" }}>{rs(order.amount)}</div>
        <div className="k" style={{ marginTop: 4 }}>{t("Cash on delivery · order {id}", { id: order.id })}</div>
      </div>
      <button className="btn green" onClick={onCollected}>{t("Cash collected")}</button>
      <button className="btn ghost" onClick={onShort}>{t("Customer is short on cash")}</button>
      <button className="btn ghost" onClick={onUpi}>{t("Customer wants to pay by UPI")}</button>
    </>
  );
}

export function SummaryScreen({ order, state, onNext }) {
  const t = useT();
  const surge = order.surge || 0;
  return (
    <>
      <div className="done">
        <div className="tick">&#10003;</div>
        <h2>{t("Delivery complete")}</h2>
        <div className="k" style={{ color: "#6B665E" }}>{t("Trip earnings")}</div>
        <div className="amt">{rs(order.payoutFinal || order.payout)}</div>
        {surge > 0 && <div className="surge">{t("Rain surge added {amt}", { amt: rs(surge) })}</div>}
      </div>
      <div className="card">
        <div className="rowline"><span>{t("Trip pay")}</span><b>{rs(order.payout)}</b></div>
        {surge > 0 && <div className="rowline"><span>{t("Rain surge")}</span><b>{rs(surge)}</b></div>}
        <div className="rowline"><span>{t("Trip distance")}</span><b>{(order.cust.km + order.storeKm).toFixed(1)} km</b></div>
        <div className="rowline"><span>{t("Units delivered")}</span><b>{t("{n} units", { n: unitsOf(order.items) })}</b></div>
        <div className="rowline"><span>{t("Delivered in")}</span><b>{t("{n} min", { n: Math.round((order.deliveredAt - order.placedAt) / 60000) })}</b></div>
      </div>
      <ProgressCard state={state} />
      <button className="btn" onClick={onNext}>{t("Back to the store for the next order")}</button>
    </>
  );
}
