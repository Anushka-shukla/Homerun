import React from "react";
import { useT } from "../i18n.jsx";
import LanguageScreen from "./screens/LanguageScreen.jsx";
import { FLOW, stage } from "../data.js";
import { RatingSheet } from "./ui.jsx";
import { OfflineScreen, SearchingScreen, AllocationScreen } from "./screens/HomeScreens.jsx";
import { NewOrderScreen, ToStoreScreen, GatePlanScreen, GateScreen, GateMoveScreen, CollectedScreen, ScannerScreen } from "./screens/PickupScreens.jsx";
import { ToCustomerScreen, PodScreen, PaymentScreen, SummaryScreen } from "./screens/DeliveryScreens.jsx";
import UpiScreen from "./screens/UpiScreen.jsx";

const NAV = [["\u2630", "Feed"], ["\uD83D\uDCBC", "Pocket"], ["\u24BC", "Gigs"], ["\uD83D\uDD14", "Updates"]];
const FLUSH = ["accepted", "picked", "en_route", "completed"];

export default function Phone({ state, live, dispatch }) {
  const t = useT();
  const act = (value) => dispatch({ type: "act", value });
  const me = state.partners.find((p) => p.id === state.me);
  const partner = live ? state.partners.find((p) => p.id === live.partner) : null;
  const mins = Math.floor(state.demo / 60000);
  const clock = 9 + Math.floor(mins / 60) + ":" + String(mins % 60).padStart(2, "0");

  let screen;
  const onboarding = !state.onboarded;
  const preAssign = !live || stage(live) < FLOW.indexOf("assigned");

  if (onboarding) {
    screen = <LanguageScreen current={state.lang} onPick={(value) => dispatch({ type: "onboard", value })} />;
  } else if (state.scan && live) {
    screen = <ScannerScreen order={live} onScan={() => act("scan_ok")} onCancel={() => act("scan_cancel")} onWrongItem={() => act("wrong_item")} />;
  } else if (live && live.status === "allocating") {
    screen = <AllocationScreen order={live} partners={state.partners} meId={state.me} />;
  } else if (preAssign) {
    screen = state.online
      ? <SearchingScreen state={state} live={live} me={me} onSimulate={() => act("simulate")} />
      : <OfflineScreen state={state} onSimulate={() => act("simulate")} />;
  } else {
    switch (live.status) {
      case "assigned":
        screen = <NewOrderScreen order={live} partner={partner} onAccept={() => act("accept")} onReject={() => act("reject")} />;
        break;
      case "accepted":
        screen = <ToStoreScreen order={live} progress={state.progress} onReached={() => act("reached_store")} />;
        break;
      case "at_store":
        screen = <GatePlanScreen order={live} onStart={() => act("start_gates")} />;
        break;
      case "at_gate":
        screen = <GateScreen order={live} onScan={() => act("scan_picker")} />;
        break;
      case "gate_move":
        screen = <GateMoveScreen order={live} onReached={() => act("reached_gate")} />;
        break;
      case "verified":
        screen = <CollectedScreen order={live} onPicked={() => act("picked")} />;
        break;
      case "picked":
      case "en_route":
        screen = <ToCustomerScreen order={live} progress={state.progress} onCall={() => act("call")} onChat={() => act("chat")} onArrived={() => act("arrived")} />;
        break;
      case "arrived":
        screen = (
          <PodScreen
            order={live}
            photo={state.photo}
            otp={state.otp}
            onPhoto={() => act("photo")}
            onOtp={(value) => dispatch({ type: "otp", value })}
            onVerify={() => act("verify_otp")}
          />
        );
        break;
      case "pod_ok":
      case "paid":
        screen = state.upi ? (
          <UpiScreen
            order={live}
            amount={state.upi.amount}
            cash={state.upi.cash}
            onReceived={() => act("upi_received")}
            onBack={() => act("upi_back")}
          />
        ) : (
          <PaymentScreen
            order={live}
            onCollected={() => act("cash_collected")}
            onShort={() => act("cash_short")}
            onUpi={() => act("upi_full")}
            onComplete={() => act("complete")}
          />
        );
        break;
      case "completed":
        screen = <SummaryScreen order={live} state={state} onNext={() => act("next_order")} />;
        break;
      default:
        screen = null;
    }
  }

  const flush = !!state.scan || (live && FLUSH.includes(live.status));

  return (
    <div className="phone">
      <div className="screen">
        <div className="statusbar"><span>{clock}</span><span>{t("HomeRun partner")}</span></div>

        <div className="appbar">
          <button className="toggle" data-on={state.online} onClick={() => dispatch({ type: "toggleOnline" })}>
            {state.online
              ? (<><span>{t("Online")}</span><span className="dot" /></>)
              : (<><span className="dot" /><span>{t("Offline")}</span></>)}
          </button>
          <div className="grow" />
          <button className="icon" title="Emergency help">&#128680;</button>
          <button className="icon" title="Help centre">?</button>
          <button className="icon" title="Profile">&#128100;</button>
        </div>

        <div className={"body" + (flush ? " flush" : "")}>{screen}</div>

        {state.rating && live && (
          <RatingSheet
            customer={live.cust}
            value={state.rating.value}
            onPick={(value) => dispatch({ type: "rate", value })}
            onSubmit={() => act("rate_submit")}
            onSkip={() => act("rate_skip")}
          />
        )}

        <div className="toasts">
          {state.toasts.map((msg) => (
            <div className={"toast" + (msg.warn ? " warn" : "")} key={msg.id}>{t(msg.msg, msg.vars)}</div>
          ))}
        </div>

        <div className="navbar">
          {NAV.map(([ic, label], i) => (
            <div className={i === 0 ? "on" : ""} key={label}>
              <span className="ic">{ic}</span>{t(label)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
