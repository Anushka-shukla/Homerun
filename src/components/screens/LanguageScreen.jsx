import React, { useState } from "react";
import { LANGS, translator } from "../../i18n.jsx";

/* First screen a partner sees. Both options are shown in their own script, so
   the choice does not depend on reading English. */
export default function LanguageScreen({ current, onPick }) {
  const [sel, setSel] = useState(current || "en");
  const t = translator(sel);

  return (
    <div className="langpick">
      <div className="langmark">
        <svg width="20" height="25" viewBox="0 0 16 20" aria-hidden="true">
          <path d="M9.6 0 0 11.6h5.4L4.8 20 16 7.7h-6.1L9.6 0Z" fill="#1A1713" />
        </svg>
      </div>
      <h2>{t("Choose your language")}</h2>
      <p>{t("Pick the language you are comfortable reading. You can change it later from your profile.")}</p>

      <div className="langlist">
        {LANGS.map((l) => (
          <button key={l.id} className={"langopt" + (sel === l.id ? " on" : "")} onClick={() => setSel(l.id)}>
            <span className="native">{l.native}</span>
            <span className="latin">{l.label}</span>
            <span className="tick">{sel === l.id ? "\u2713" : ""}</span>
          </button>
        ))}
      </div>

      <button className="btn" onClick={() => onPick(sel)}>{t("Continue")}</button>
    </div>
  );
}
