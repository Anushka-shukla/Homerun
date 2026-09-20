/* The partner app owns the state. The ops board is a second tab that reads a
   copy of it and sends commands back, so both surfaces are looking at one
   orders array rather than two simulations that drift apart. */

export const CHANNEL = "homerun-mvp";
export const SNAPSHOT = "homerun-mvp-state";
export const OPS_HASH = "#/ops";

export const isOpsTab = () =>
  typeof window !== "undefined" && window.location.hash.startsWith(OPS_HASH);

export function openChannel() {
  if (typeof window === "undefined" || typeof window.BroadcastChannel !== "function") return null;
  try {
    return new window.BroadcastChannel(CHANNEL);
  } catch {
    return null;
  }
}

/* localStorage doubles as the handoff for a board opened after the fact, and
   as the fallback where BroadcastChannel is unavailable. */
export function writeSnapshot(state) {
  try {
    window.localStorage.setItem(SNAPSHOT, JSON.stringify(state));
  } catch {
    /* private mode, quota, nothing to do */
  }
}

export function readSnapshot() {
  try {
    const raw = window.localStorage.getItem(SNAPSHOT);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function opsUrl() {
  return window.location.href.split("#")[0] + OPS_HASH;
}
