import React, { useRef, useState } from "react";
import { useT } from "../i18n.jsx";
import { rs, unitLine } from "../data.js";

export function SlideToConfirm({ label, onConfirm }) {
  const track = useRef(null);
  const [x, setX] = useState(0);
  const [done, setDone] = useState(false);
  const drag = useRef(false);
  const startX = useRef(0);

  const max = () => (track.current ? track.current.clientWidth - 56 : 0);

  const finish = () => {
    setDone(true);
    setX(max());
    setTimeout(onConfirm, 180);
  };

  return (
    <div
      className="slide"
      ref={track}
      data-done={done}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); finish(); }
      }}
    >
      <span
        className="knob"
        style={{ transform: `translateX(${x}px)` }}
        onPointerDown={(e) => {
          drag.current = true;
          startX.current = e.clientX - x;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setX(Math.max(0, Math.min(max(), e.clientX - startX.current)));
        }}
        onPointerUp={() => {
          drag.current = false;
          if (x > max() * 0.7) finish();
          else setX(0);
        }}
      >
        &#8594;
      </span>
      <span className="label">{label}</span>
    </div>
  );
}

export function Items({ items, showBay = false }) {
  return (
    <>
      {items.map((it) => (
        <div className="item" key={it.n}>
          <span className="sq">{it.ic}</span>
          <span style={{ flex: 1 }}>
            {it.n}
            <br />
            <span className="qty">
              {unitLine(it)}{showBay ? " \u00b7 " + it.bay : ""}
            </span>
          </span>
        </div>
      ))}
    </>
  );
}

export function Row({ label, value }) {
  return (
    <div className="rowline"><span>{label}</span><b>{value}</b></div>
  );
}

export function ProgressCard({ state }) {
  const t = useT();
  return (
    <div className="card">
      <div className="k">{t("Today so far")}</div>
      <div className="grid2" style={{ marginTop: 10 }}>
        <div><div className="v">{rs(Math.round(state.earn))}</div><div className="k">{t("Earnings")}</div></div>
        <div><div className="v">{state.dist.toFixed(1)} km</div><div className="k">{t("Distance")}</div></div>
        <div><div className="v">{state.trips}</div><div className="k">{t("Trips")}</div></div>
        <div><div className="v">{t("{n} gig", { n: state.trips ? 1 : 0 })}</div><div className="k">{t("Sessions")}</div></div>
      </div>
    </div>
  );
}

/* Shown once the order is delivered and the cash is in hand. */
export function RatingSheet({ customer, value, onPick, onSubmit, onSkip }) {
  const t = useT();
  const words = ["", "Rude or unsafe site", "Hard to reach", "Fine", "Helpful", "Great to deliver to"];
  return (
    <div className="sheetbg">
      <div className="sheet">
        <div className="cap">{t("Order delivered and payment collected")}</div>
        <div className="who">{t("Rate your customer, {name}", { name: customer.name.split(" ")[0] })}</div>
        <div className="stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={"star" + (n <= value ? " on" : "")}
              aria-label={n + " star" + (n > 1 ? "s" : "")}
              onClick={() => onPick(n)}
            >
              &#9733;
            </button>
          ))}
        </div>
        <div className="hintline">{t(value ? words[value] : "Tap a star")}</div>
        <button className="btn" disabled={!value} onClick={onSubmit}>{t("Submit rating")}</button>
        <button className="btn ghost" onClick={onSkip}>{t("Skip")}</button>
      </div>
    </div>
  );
}
