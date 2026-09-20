import React, { createContext, useContext } from "react";

/* The partner app is translated. The ops console stays in English, since it is
   used by the internal team. Keys are the English strings themselves, so a
   missing translation falls back to English rather than showing a key. */
export const LANGS = [
  { id: "en", label: "English", native: "English" },
  { id: "hi", label: "Hindi", native: "\u0939\u093F\u0928\u094D\u0926\u0940" }
];

const HI = {
  // chrome
  "HomeRun partner": "होमरन पार्टनर",
  Online: "ऑनलाइन",
  Offline: "ऑफ़लाइन",
  Feed: "फ़ीड",
  Pocket: "पॉकेट",
  Gigs: "गिग्स",
  Updates: "अपडेट",

  // onboarding
  "Choose your language": "अपनी भाषा चुनें",
  "Pick the language you are comfortable reading. You can change it later from your profile.":
    "वह भाषा चुनें जो आपको पढ़ने में आसान लगे। इसे बाद में प्रोफ़ाइल से बदल सकते हैं।",
  Continue: "आगे बढ़ें",

  // home
  "Dark store simulator": "डार्क स्टोर सिम्युलेटर",
  "Creates a consumer order at DS-04 and packs it": "DS-04 पर ग्राहक का ऑर्डर बनाकर पैक करता है",
  "Simulate new order": "नया ऑर्डर बनाएँ",
  "Packing the order": "ऑर्डर पैक हो रहा है",
  "Go online to start receiving orders": "ऑर्डर पाने के लिए ऑनलाइन हों",
  "Indiranagar DS-04 is open 8 am to 8 pm. Heavy load gigs pay extra.":
    "इंदिरानगर DS-04 सुबह 8 से रात 8 बजे तक खुला है। भारी लोड वाले गिग पर ज़्यादा कमाई।",
  "Offers for you": "आपके लिए ऑफ़र",
  "Cement run bonus, weekend": "सीमेंट रन बोनस, वीकेंड",
  "Sat 8 am to Sun 8 pm · Live": "शनि सुबह 8 से रवि रात 8 · लाइव",
  Extra: "अतिरिक्त",
  "Today so far": "आज अब तक",
  Earnings: "कमाई",
  Distance: "दूरी",
  Trips: "ट्रिप",
  Trip: "ट्रिप",
  Sessions: "सेशन",
  "{n} gig": "{n} गिग",
  "Searching for orders": "ऑर्डर खोजे जा रहे हैं",
  "You are here": "आप यहाँ हैं",
  "Orders from this store come to you first": "इस स्टोर के ऑर्डर पहले आपको मिलेंगे",
  "Incoming order {id}": "आ रहा ऑर्डर {id}",
  "Order placed": "ऑर्डर मिला",
  "Routed to DS-04": "DS-04 भेजा गया",
  "Packing in progress": "पैकिंग चल रही है",
  "Ready for pickup": "पिकअप के लिए तैयार",

  // allocation
  "Matching a partner": "पार्टनर चुना जा रहा है",
  "Order {id} weighs {kg} kg. Nearest first, skipping anyone whose vehicle cannot take it.":
    "ऑर्डर {id} का वज़न {kg} किलो है। सबसे नज़दीकी पहले, जिनकी गाड़ी में यह नहीं आएगा उन्हें छोड़ते हुए।",
  assigning: "दिया जा रहा है",
  "load too heavy": "लोड बहुत भारी",
  "on another trip": "दूसरी ट्रिप पर",
  standby: "खाली",
  " (you)": " (आप)",
  "up to {cap} kg": "{cap} किलो तक",
  "Pickup gates": "पिकअप गेट",
  "{km} km away": "{km} किमी दूर",

  // new order
  "New order": "नया ऑर्डर",
  "ORDER ID": "ऑर्डर आईडी",
  PAYOUT: "कमाई",
  "Pick up": "पिकअप",
  "to store": "स्टोर तक",
  "to drop": "ड्रॉप तक",
  load: "लोड",
  Items: "सामान",
  "Pick up from": "यहाँ से लें",
  Payment: "भुगतान",
  "Cash on delivery {amt}": "कैश ऑन डिलीवरी {amt}",
  "Assigned to": "दिया गया",
  Decline: "मना करें",
  "Accept order": "ऑर्डर लें",
  "Gate {g}": "गेट {g}",
  " then ": " फिर ",

  // to store
  pickup: "पिकअप",
  "Reached the store": "स्टोर पहुँच गया",
  "Your gate sequence opens once you reach the store": "स्टोर पहुँचते ही आपका गेट क्रम खुल जाएगा",

  // gates
  "You are at the store. Pick from {n} gate": "आप स्टोर पर हैं। {n} गेट से सामान लेना है",
  "You are at the store. Pick from {n} gates": "आप स्टोर पर हैं। {n} गेट से सामान लेना है",
  "Gates are split by material so heavy loads never cross the floor. Follow the order below.":
    "सामान के हिसाब से गेट अलग हैं, ताकि भारी माल स्टोर के अंदर से न ले जाना पड़े। नीचे दिए क्रम में जाएँ।",
  "Start at Gate {g}": "गेट {g} से शुरू करें",
  picker: "पिकर",
  "Gate A, heavy loading dock": "गेट A, भारी माल का डॉक",
  "Gate B, paints and chemicals": "गेट B, पेंट और केमिकल",
  "Gate C, electrical and hardware": "गेट C, बिजली का सामान और हार्डवेयर",
  "Cement, tiles, pipes": "सीमेंट, टाइल्स, पाइप",
  "Paints, chemicals": "पेंट, केमिकल",
  "Electrical, tools": "बिजली का सामान, औज़ार",
  "The vehicle backs in here, so nothing heavy is carried across the store floor.":
    "गाड़ी यहीं तक पीछे आती है, इसलिए भारी सामान स्टोर के अंदर से नहीं ले जाना पड़ता।",
  "Sealed bay away from cement dust, opened only for a scan.":
    "सीमेंट की धूल से दूर बंद बे, स्कैन के समय ही खुलती है।",
  "Small SKUs handed over at the counter.": "छोटा सामान काउंटर पर ही मिल जाता है।",
  "first roller shutter on your left. Reverse up to the dock, the picker loads from there":
    "बाईं ओर का पहला शटर। गाड़ी डॉक तक पीछे लगाएँ, पिकर वहीं से लोड करेगा",
  "shutter on the far side of the yard, past the ramp. Park nose out":
    "यार्ड के दूसरी तरफ का शटर, रैंप के आगे। गाड़ी मुँह बाहर की ओर लगाएँ",
  "counter window on the right. Park on the kerb, no need to reverse":
    "दाईं ओर की काउंटर खिड़की। किनारे पर लगाएँ, पीछे करने की ज़रूरत नहीं",
  "Enter from 80 Feet Road and keep left along the yard": "80 फीट रोड से अंदर आएँ और यार्ड में बाएँ चलें",
  "Gate {g} · step {i} of {n}": "गेट {g} · चरण {i}/{n}",
  "Read this out to {picker} before you scan": "स्कैन करने से पहले {picker} को यह नंबर बताएँ",
  "Picker at Gate {g}": "गेट {g} का पिकर",
  "Collect here · {n} units": "यहाँ से लें · {n} यूनिट",
  "Scan the picker QR at Gate {g}": "गेट {g} पर पिकर का QR स्कैन करें",
  "Item mismatch reported": "गलत सामान की शिकायत दर्ज",
  "{picker} is repacking. Rescan once the corrected bag is handed over.":
    "{picker} दोबारा पैक कर रहे हैं। सही सामान मिलते ही फिर स्कैन करें।",
  "Move to Gate {g}": "गेट {g} पर जाएँ",
  "Gate {g} is collected and loaded. Keep the vehicle and drive around to the next gate.":
    "गेट {g} का सामान लोड हो गया। गाड़ी लेकर अगले गेट तक जाएँ।",
  From: "कहाँ से",
  To: "कहाँ तक",
  "Inside the yard": "यार्ड के अंदर",
  "about 60 m, keep left": "करीब 60 मीटर, बाएँ चलें",
  "Picker waiting": "पिकर इंतज़ार में",
  "Reached Gate {g}": "गेट {g} पहुँच गया",

  // scanner
  "Order {id} · Gate {g}": "ऑर्डर {id} · गेट {g}",
  "Ask {picker} at {zone} to show the Gate {g} QR": "{zone} पर {picker} से गेट {g} का QR दिखाने को कहें",
  Scan: "स्कैन करें",
  "This is not the right item": "यह सही सामान नहीं है",

  // collected
  LOADED: "लोड हुआ",
  "{n} units": "{n} यूनिट",
  "Verified with {picker}": "{picker} के साथ जाँचा गया",
  "Order details": "ऑर्डर का ब्योरा",
  Customer: "ग्राहक",
  Drop: "ड्रॉप",
  "Collect at drop": "ड्रॉप पर लेना है",
  "{amt} cash": "{amt} कैश",
  "Slide to mark order picked": "ऑर्डर उठाया, स्लाइड करें",

  // to customer
  remaining: "बाकी",
  "cash to collect": "कैश लेना है",
  Call: "कॉल",
  Chat: "चैट",
  "Reached the drop": "ड्रॉप पर पहुँच गया",

  // proof of delivery
  "Hand over {n} units": "{n} यूनिट सौंपें",
  "Count the material out with the customer, then take the photo and the OTP.":
    "ग्राहक के साथ सामान गिनें, फिर फोटो लें और OTP डालें।",
  "Total handed over": "कुल सौंपा गया",
  "No photo of the unloaded material yet": "उतारे गए सामान की फोटो अभी नहीं है",
  "Click here to upload photo of the item": "सामान की फोटो अपलोड करने के लिए यहाँ दबाएँ",
  "Replace the photo": "फोटो बदलें",
  "Customer OTP": "ग्राहक का OTP",
  "Customer reads out {otp}": "ग्राहक {otp} बताएगा",
  "Confirm delivery": "डिलीवरी पक्की करें",

  // payment
  "Collect cash from the customer": "ग्राहक से कैश लें",
  "Delivery is confirmed. Take the cash before you close the trip.":
    "डिलीवरी हो गई। ट्रिप बंद करने से पहले कैश ले लें।",
  "Amount due": "बकाया रकम",
  "Cash on delivery · order {id}": "कैश ऑन डिलीवरी · ऑर्डर {id}",
  "Material value": "सामान की कीमत",
  Delivery: "डिलीवरी",
  "Free above ₹500": "₹500 से ऊपर मुफ़्त",
  "Cashback to customer": "ग्राहक को कैशबैक",
  "Cash collected": "कैश मिल गया",
  "Customer is short on cash": "ग्राहक के पास पूरे पैसे नहीं हैं",
  "Customer wants to pay by UPI": "ग्राहक UPI से देना चाहता है",
  "Payment completed": "भुगतान पूरा",
  "Cash collected from {name}": "{name} से कैश मिला",
  "Paid by UPI by {name}": "{name} ने UPI से भुगतान किया",
  "{cash} cash and {upi} UPI from {name}": "{name} से {cash} कैश और {upi} UPI",
  "Settled to HomeRun on UPI": "HomeRun को UPI पर मिला",
  UPI: "UPI",
  "Go online first to receive orders": "ऑर्डर पाने के लिए पहले ऑनलाइन हों",
  "{total} paid by UPI": "{total} UPI से मिले",
  Order: "ऑर्डर",
  Mode: "तरीका",
  "Cash and UPI": "कैश और UPI",
  "Cash on delivery": "कैश ऑन डिलीवरी",
  "Cash in your pocket": "आपके पास कैश",
  "Complete order": "ऑर्डर पूरा करें",

  // UPI
  "Ask the customer to scan and pay": "ग्राहक से स्कैन करके भुगतान करने को कहें",
  "Cash of {amt} is already in hand. This QR covers the balance.":
    "{amt} कैश मिल चुका है। बाकी रकम इस QR से लें।",
  "The full amount can be paid by UPI instead of cash.": "पूरी रकम कैश की जगह UPI से ली जा सकती है।",
  "Order total": "कुल रकम",
  "Due on this QR": "इस QR पर बकाया",
  "UPI payment received": "UPI से भुगतान मिल गया",
  "The trip cannot close until the full {amt} is settled.":
    "जब तक पूरे {amt} नहीं मिल जाते, ट्रिप बंद नहीं होगी।",
  "Back to cash": "कैश पर वापस",

  // summary and rating
  "Delivery complete": "डिलीवरी पूरी",
  "Trip earnings": "ट्रिप की कमाई",
  "Rain surge added {amt}": "बारिश सर्ज जुड़ा {amt}",
  "Trip pay": "ट्रिप पेमेंट",
  "Rain surge": "बारिश सर्ज",
  "Trip distance": "ट्रिप की दूरी",
  "Units delivered": "डिलीवर यूनिट",
  "Delivered in": "कितनी देर में",
  "{n} min of 60": "60 में से {n} मिनट",
  "Back to the store for the next order": "अगले ऑर्डर के लिए स्टोर वापस",
  "Order delivered and payment collected": "डिलीवरी और भुगतान, दोनों हो गए",
  "Rate your customer, {name}": "ग्राहक {name} को रेटिंग दें",
  "Tap a star": "स्टार चुनें",
  "Rude or unsafe site": "बदतमीज़ी या असुरक्षित साइट",
  "Hard to reach": "पहुँचना मुश्किल",
  Fine: "ठीक",
  Helpful: "मददगार",
  "Great to deliver to": "डिलीवरी के लिए बढ़िया",
  "Submit rating": "रेटिंग भेजें",
  Skip: "छोड़ें",

  Home: "होम",
  Emergency: "इमरजेंसी",
  Help: "मदद",
  "Hand this order to another partner?": "यह ऑर्डर किसी और पार्टनर को दे दें?",
  "Trip in progress": "ट्रिप चल रही है",
  "Order {id}": "ऑर्डर {id}",
  Resume: "फिर से शुरू करें",
  Session: "सेशन",
  Entry: "प्रवेश",
  "Photo of the unloaded material": "उतारे गए सामान की फोटो",
  "Stack it at the drop point and take one clear photo": "सामान ड्रॉप पॉइंट पर रखें और एक साफ़ फोटो लें",
  "{amt} received on UPI from {name}": "{name} से UPI पर {amt} मिले",
  "{n} min": "{n} मिनट",

  // toasts
  "{name} is nearest at {km} km": "{name} सबसे नज़दीक हैं, {km} किमी पर",
  "No partner can carry {kg} kg. Order held for the next Tata Ace.":
    "{kg} किलो कोई पार्टनर नहीं ले सकता। ऑर्डर अगली टाटा ऐस के लिए रोका गया।",
  "Order accepted. Head to {store}.": "ऑर्डर लिया। {store} की ओर चलें।",
  "Order declined. Reassigning to the next nearest partner.":
    "ऑर्डर मना किया। अगले नज़दीकी पार्टनर को दिया जा रहा है।",
  "Head to Gate {g}, {what}": "गेट {g} की ओर चलें, {what}",
  "Gate {g} collected. Next stop is Gate {next}.": "गेट {g} हो गया। अगला पड़ाव गेट {next}।",
  "All {n} gates verified for order {id}.": "ऑर्डर {id} के सभी {n} गेट जाँचे गए।",
  "Trip started. 60 minute clock is visible to ops.": "ट्रिप शुरू। 60 मिनट की घड़ी ऑप्स को दिख रही है।",
  "Calling {name} on {ph}": "{name} को {ph} पर कॉल किया जा रहा है",
  "Chat opened with {name}": "{name} के साथ चैट खुली",
  "Photo saved to the order": "फोटो ऑर्डर में सेव हो गई",
  "OTP does not match. Ask the customer to read it again.":
    "OTP मेल नहीं खाता। ग्राहक से दोबारा पूछें।",
  "Delivery confirmed with OTP {otp}. Collect {amt} now.":
    "OTP {otp} से डिलीवरी पक्की। अब {amt} लें।",
  "{amt} collected from {name}": "{name} से {amt} मिले",
  "Short by {amt}. Take the balance on UPI before you leave.":
    "{amt} कम हैं। निकलने से पहले बाकी रकम UPI पर लें।",
  "{total} settled, {upi} of it by UPI": "{total} मिल गए, जिसमें {upi} UPI से",
  "You rated {name} {n} stars": "आपने {name} को {n} स्टार दिए",
  "You are back online at the dark store.": "आप डार्क स्टोर पर फिर ऑनलाइन हैं।",
  "Item at Gate {g} does not match the packed slip. Sent back to {picker}.":
    "गेट {g} का सामान पैकिंग पर्ची से मेल नहीं खाता। {picker} को वापस भेजा।",
  "No answer on two calls. Waiting 5 minutes before the return option opens.":
    "दो कॉल पर जवाब नहीं। वापसी का विकल्प खुलने में 5 मिनट।",
  "Network lost. Trip is frozen locally and will sync when the partner is back.":
    "नेटवर्क गया। ट्रिप यहीं रुकी है, वापस आने पर सिंक होगी।",
  "Back online. Trip synced.": "फिर ऑनलाइन। ट्रिप सिंक हो गई।",
  "Order {id} has crossed 60 minutes. Ops has been alerted.":
    "ऑर्डर {id} 60 मिनट पार कर गया। ऑप्स को बता दिया गया।",
  "You cannot go offline during a live trip. Use the edge case control to simulate a drop in connectivity.":
    "चालू ट्रिप के दौरान ऑफ़लाइन नहीं हो सकते। नेटवर्क जाने की स्थिति डेमो कंट्रोल से आज़माएँ।",
  "Finish the active trip first": "पहले चालू ट्रिप पूरी करें",
  "Trip handed over. {name} is taking this order.": "ट्रिप सौंप दी गई। {name} यह ऑर्डर ले रहे हैं।",
  "Trip released. Ops is finding another partner.": "ट्रिप छोड़ दी गई। ऑप्स दूसरा पार्टनर ढूँढ रहे हैं।"
};

const DICTS = { en: {}, hi: HI };

export function translator(lang) {
  const dict = DICTS[lang] || {};
  return function t(text, vars) {
    let out = dict[text] || text;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        out = out.split("{" + k + "}").join(String(vars[k]));
      });
    }
    return out;
  };
}

const Ctx = createContext(translator("en"));
export const LangProvider = ({ lang, children }) => (
  <Ctx.Provider value={translator(lang)}>{children}</Ctx.Provider>
);
export const useT = () => useContext(Ctx);
