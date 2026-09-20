import React, { useEffect, useReducer, useRef, useState } from "react";
import { reducer, bootState, liveOrder } from "./state.js";
import Phone from "./components/Phone.jsx";
import OpsPage from "./OpsPage.jsx";
import OpsConsole from "./ops/OpsConsole.jsx";
import { openChannel, writeSnapshot, opsUrl, isOpsTab } from "./channel.js";
import { LangProvider } from "./i18n.jsx";

export default function App() {
  if (isOpsTab()) return <OpsPage />;
  return <PartnerApp />;
}

function PartnerApp() {
  const [state, dispatch] = useReducer(reducer, undefined, bootState);
  const live = liveOrder(state);
  const chan = useRef(null);
  const latest = useRef(state);
  latest.current = state;
  const [showBoard, setShowBoard] = useState(false);
  const [boardTab, setBoardTab] = useState(false);

  /* This tab owns the state. The ops board tab gets a copy of it on every
     change and can send commands back. */
  useEffect(() => {
    const c = openChannel();
    chan.current = c;
    if (!c) return undefined;
    c.onmessage = (e) => {
      if (!e.data) return;
      if (e.data.kind === "hello") {
        setBoardTab(true);
        c.postMessage({ kind: "state", state: latest.current });
      }
      if (e.data.kind === "command") dispatch(e.data.action);
    };
    return () => c.close();
  }, []);

  useEffect(() => {
    if (chan.current) chan.current.postMessage({ kind: "state", state });
    writeSnapshot(state);
  }, [state]);

  /* Demo clock. One real second is `speed` seconds of store time. */
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: "tick" }), 250);
    return () => clearInterval(id);
  }, []);

  /* Mocked intake walks itself from placed through to allocation. */
  useEffect(() => {
    if (!state.busy || !live) return;
    if (!["placed", "routed", "packing", "ready"].includes(live.status)) return;
    const id = setTimeout(() => dispatch({ type: "intakeStep" }), 1100);
    return () => clearTimeout(id);
  }, [state.busy, live && live.status]);

  /* A partner is matched a moment after the order is packed. */
  useEffect(() => {
    if (!live || live.status !== "allocating") return;
    const id = setTimeout(() => dispatch({ type: "assignNow" }), 1900);
    return () => clearTimeout(id);
  }, [live && live.status]);

  /* Toasts clear themselves. */
  useEffect(() => {
    if (!state.toasts.length) return;
    const id = setTimeout(() => dispatch({ type: "untoast", id: state.toasts[0].id }), 1900);
    return () => clearTimeout(id);
  }, [state.toasts]);

  /* The mid trip network drop recovers on its own. */
  useEffect(() => {
    if (!state.offlineMid) return;
    const id = setTimeout(() => dispatch({ type: "backOnline" }), 5000);
    return () => clearTimeout(id);
  }, [state.offlineMid]);

  return (
    <>
      <header className="topbar">
        <div className="mark">
          <div className="tile">
            <svg width="16" height="20" viewBox="0 0 16 20" aria-hidden="true">
              <path d="M9.6 0 0 11.6h5.4L4.8 20 16 7.7h-6.1L9.6 0Z" fill="#1A1713" />
            </svg>
          </div>
          <div>
            <div className="name">Home<i>Run</i></div>
            <small>Delivery partner app &middot; MVP demo</small>
          </div>
        </div>
        <div className="spacer" />
        <button className="openops" aria-pressed={showBoard} onClick={() => setShowBoard((v) => !v)}>
          {showBoard ? "Hide ops dashboard" : "Show ops dashboard"}
        </button>
      </header>

      <main className={"layout" + (showBoard ? " withboard" : " solo")}>
        <section className="stage">
          <LangProvider lang={state.lang}>
            <Phone state={state} live={live} dispatch={dispatch} />
          </LangProvider>
        </section>
        {showBoard ? (
          <>
            <button className="backtoapp" onClick={() => setShowBoard(false)}>&#8592; Partner app</button>
            <OpsConsole state={state} live={live} dispatch={dispatch} />
          </>
        ) : (
          <p className="boardhint">{boardTab ? "The ops board tab you opened is reading the same orders." : ""}</p>
        )}
      </main>
    </>
  );
}
