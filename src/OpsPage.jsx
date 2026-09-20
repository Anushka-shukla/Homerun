import React, { useEffect, useRef, useState } from "react";
import OpsConsole from "./ops/OpsConsole.jsx";
import { openChannel, readSnapshot, SNAPSHOT } from "./channel.js";

export default function OpsPage() {
  const [state, setState] = useState(() => readSnapshot());
  const [seenAt, setSeenAt] = useState(0);
  const chan = useRef(null);

  useEffect(() => {
    const c = openChannel();
    chan.current = c;

    if (c) {
      c.onmessage = (e) => {
        if (e.data && e.data.kind === "state") {
          setState(e.data.state);
          setSeenAt(Date.now());
        }
      };
      c.postMessage({ kind: "hello" });
    }

    const onStorage = (e) => {
      if (e.key !== SNAPSHOT || !e.newValue) return;
      try {
        setState(JSON.parse(e.newValue));
        setSeenAt(Date.now());
      } catch {
        /* ignore a half written snapshot */
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      if (c) c.close();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  /* Commands travel the other way: the board asks, the app tab decides. */
  const dispatch = (action) => {
    if (chan.current) chan.current.postMessage({ kind: "command", action });
  };

  const live = state ? state.orders.find((o) => o.id === state.liveId) || null : null;
  const fresh = Date.now() - seenAt < 4000;

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
            <small>Ops board &middot; Indiranagar DS-04</small>
          </div>
        </div>
        <div className="spacer" />
        <div className="chip">
          <span className={"pip" + (fresh ? " on" : "")} />
          {fresh ? "Live from the partner app" : state ? "Last known state" : "Waiting for the partner app"}
        </div>
      </header>

      <main className="layout ops">
        {state ? (
          <OpsConsole state={state} live={live} dispatch={dispatch} />
        ) : (
          <div className="block">
            <h2>Nothing to show yet</h2>
            <p className="note">
              Open the partner app in another tab on this machine and start a demo. Orders appear here the moment they are
              created, and the edge case triggers below act on whatever that tab is doing.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
