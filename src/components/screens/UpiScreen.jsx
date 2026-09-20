import React, { useMemo } from "react";
import { useT } from "../../i18n.jsx";
import qrcode from "qrcode-generator";
import { rs } from "../../data.js";

const VPA = "homerun.ds04@icici";

/* A real UPI intent string, encoded as an inline SVG QR. Any UPI app reads it. */
function upiSvg(order, amount) {
  const intent =
    "upi://pay?pa=" + VPA +
    "&pn=HomeRun%20Dark%20Store" +
    "&am=" + amount.toFixed(2) +
    "&cu=INR" +
    "&tn=Order%20" + order.id;
  const qr = qrcode(0, "M");
  qr.addData(intent);
  qr.make();
  return qr.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
}

export default function UpiScreen({ order, amount, cash, onReceived, onBack }) {
  const t = useT();
  const svg = useMemo(() => upiSvg(order, amount), [order.id, amount]);

  return (
    <>
      <div className="hl">{t("Ask the customer to scan and pay")}</div>
      <div className="sub">
        {cash > 0
          ? t("Cash of {amt} is already in hand. This QR covers the balance.", { amt: rs(cash) })
          : t("The full amount can be paid by UPI instead of cash.")}
      </div>

      <div className="qrcard">
        <div className="qrbox" dangerouslySetInnerHTML={{ __html: svg }} />
        <div className="qramt">{rs(amount)}</div>
        <div className="qrvpa">{VPA}</div>
        <div className="qrapps">
          <span>GPay</span><span>PhonePe</span><span>Paytm</span><span>BHIM</span>
        </div>
      </div>

      <div className="card flat">
        <div className="rowline"><span>{t("Order total")}</span><b>{rs(order.amount)}</b></div>
        <div className="rowline"><span>{t("Cash collected")}</span><b>{rs(cash)}</b></div>
        <div className="rowline"><span>{t("Due on this QR")}</span><b>{rs(amount)}</b></div>
      </div>

      <button className="btn green" onClick={onReceived}>{t("UPI payment received")}</button>
      <div className="sub" style={{ textAlign: "center", marginTop: 8 }}>
        {t("The trip cannot close until the full {amt} is settled.", { amt: rs(order.amount) })}
      </div>
      <button className="btn ghost" onClick={onBack}>{t("Back to cash")}</button>
    </>
  );
}
