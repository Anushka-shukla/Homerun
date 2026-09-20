import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { pointOnPath, pathUpTo } from "../data.js";

/* Leaflet's default marker pulls in image files, so every marker here is a
   divIcon built from inline HTML. Nothing outside the tile layer is fetched. */
/* The dark store and the customer must never read as the same thing: the
   store is the HomeRun bolt on yellow, the drop is a blue house. */
const ICONS = {
  store: L.divIcon({
    className: "", iconSize: [30, 36], iconAnchor: [15, 36],
    html: `<svg width="30" height="36" viewBox="0 0 30 36">
      <path d="M15 36 L9 26 h12 z" fill="#1A1713"/>
      <rect x="1" y="1" width="28" height="26" rx="7" fill="#EFC42E" stroke="#1A1713" stroke-width="2"/>
      <path d="M17 6 L9 16h4.2l-.6 6L21 12h-4.6L17 6z" fill="#1A1713"/></svg>`
  }),
  drop: L.divIcon({
    className: "", iconSize: [30, 36], iconAnchor: [15, 36],
    html: `<svg width="30" height="36" viewBox="0 0 30 36">
      <path d="M15 36 L9 26 h12 z" fill="#1F4EA8"/>
      <rect x="1" y="1" width="28" height="26" rx="7" fill="#2A64D6" stroke="#1F4EA8" stroke-width="2"/>
      <path d="M15 7 L23 14v8h-5v-5h-6v5H7v-8z" fill="#fff"/></svg>`
  }),
  you: L.divIcon({
    className: "", iconSize: [16, 16], iconAnchor: [8, 8],
    html: `<svg width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="7" fill="#fff"/><circle cx="8" cy="8" r="4.5" fill="#6B665E"/></svg>`
  })
};
const pinIcon = (kind) => ICONS[kind] || ICONS.you;

const riderIcon = L.divIcon({
  className: "",
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  html: `<svg width="26" height="26" viewBox="0 0 26 26">
    <circle cx="13" cy="13" r="11" fill="#fff"/>
    <circle cx="13" cy="13" r="8" fill="#1B7A45"/>
    <rect x="8.5" y="10" width="9" height="6" rx="1.4" fill="#fff"/></svg>`
});

export default function LeafletMap({ path, progress, destKind, originKind = "you", overlay = null }) {
  const box = useRef(null);
  const map = useRef(null);
  const rider = useRef(null);
  const done = useRef(null);
  const legs = useRef([]);
  const drawn = useRef("");
  const latest = useRef(path);
  latest.current = path;

  const key = path.map((p) => p[0].toFixed(5) + "," + p[1].toFixed(5)).join(";");

  /* Built once. The parent re-renders four times a second for the clock, so
     nothing here may depend on a prop identity or the map would tear down and
     rebuild on every tick. A view is set before any layer is added, since
     Leaflet refuses layers on a map with no centre. */
  useEffect(() => {
    if (!box.current || map.current) return;
    const start = latest.current;

    map.current = L.map(box.current, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false
    });
    map.current.setView(start[0], 14);
    map.current.attributionControl.setPrefix("");

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap"
    }).addTo(map.current);

    done.current = L.polyline([start[0]], { color: "#15398C", weight: 7, lineJoin: "round", lineCap: "round" }).addTo(map.current);
    rider.current = L.marker(start[0], { icon: riderIcon, zIndexOffset: 500 }).addTo(map.current);

    return () => {
      map.current.remove();
      map.current = null;
      rider.current = null;
      done.current = null;
      legs.current = [];
      drawn.current = "";
    };
  }, []);

  /* The route is redrawn only when the leg itself changes. */
  useEffect(() => {
    if (!map.current || drawn.current === key) return;
    drawn.current = key;

    legs.current.forEach((l) => map.current.removeLayer(l));
    legs.current = [
      L.polyline(path, { color: "#FFFFFF", weight: 11, opacity: 0.95, lineJoin: "round", lineCap: "round" }).addTo(map.current),
      L.polyline(path, { color: "#2A64D6", weight: 7, opacity: 0.95, lineJoin: "round", lineCap: "round" }).addTo(map.current),
      L.marker(path[0], { icon: pinIcon(originKind) }).addTo(map.current),
      L.marker(path[path.length - 1], { icon: pinIcon(destKind) }).addTo(map.current)
    ];
    done.current.setLatLngs([path[0]]).bringToFront();
    rider.current.setLatLng(path[0]);
    map.current.fitBounds(L.latLngBounds(path), { padding: [30, 30] });
  }, [key, destKind, originKind, path]);

  /* Movement is simulated: the trip progress that drives the ETA moves the
     marker, and the road behind it fills in solid blue. */
  useEffect(() => {
    if (!map.current || !rider.current) return;
    const at = pointOnPath(path, progress);
    rider.current.setLatLng(at);
    done.current.setLatLngs(pathUpTo(path, progress));
    const inner = map.current.getBounds().pad(-0.25);
    if (progress > 0 && !inner.contains(at)) map.current.panTo(at, { animate: true, duration: 0.5 });
  }, [progress, key, path]);

  return (
    <div className="mapwrap">
      <div className="leafmap" ref={box} />
      {overlay}
    </div>
  );
}
