# HomeRun Delivery Partner MVP

Delivery partner app and ops dashboard for a 60 minute construction materials
delivery, built as a single React app with no backend.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
```

Deploy: `vercel` from this folder, or push to Git and import. Vite preset,
build command `npm run build`, output `dist`.

## The ops console

`src/ops/` holds the internal dashboard. It renders slices of the same
`orders` array the partner screens mutate, so there is no second data source
and nothing to sync.

**Data model.** Every status change is stamped once, centrally, in the reducer:
if an order's status differs from the previous state, `o.ts[status] = demo`.
Every branch of the KPI tree is then arithmetic on those stamps, in
`src/ops/metrics.js`:

| KPI tree branch | computed as |
| --- | --- |
| Assignment time | `ts.assigned - ts.placed` |
| Packaging time | `ts.ready - ts.routed` |
| Pickup time | `ts.picked - ts.accepted` |
| Transit time | `ts.arrived - ts.picked` |
| Drop-off time | `ts.completed - ts.arrived` |
| On-time delivery rate | delivered orders where `ts.completed - ts.placed <= 60 min` |

**Layout.** Left nav with Delivery management live and the other four tabs
carrying a scope note. Inside it: headline KPI cards that filter the order
table when clicked, a six column live pipeline with an SLA countdown per card,
and a bar per stage showing where the 60 minutes actually goes. The Orders view
adds search by order ID or customer, and filters for status, risk, ticket and
dark store. Any row opens an order summary with its own stage times and the
support ticket thread.

**Seed.** Ten orders load across every stage from four dark stores, including
delivered on time, delivered late, at risk, and three with support tickets, so
the aggregates and the stage bars have something to say before you touch
anything.

## The ops dashboard

The phone sits alone in the middle of the page by default. **Show ops
dashboard** in the header opens the board to the right of it, and hiding it
returns the phone to the centre. Both read the same `orders` array, so nothing
can drift.

The board can also be popped into its own tab at `#/ops`. That tab receives a
copy of the state over a `BroadcastChannel`, with a `localStorage` snapshot so a
board opened later picks up immediately and so it still works where
BroadcastChannel is missing. Commands travel the other way: the edge case
triggers and Reset post an action back to the app tab, which is the only place
the reducer runs.

## Demo path

1. Tap **Simulate new order** on the phone home screen. States 1 to 4 run as a
   mock and are shown in the app as an incoming order card.
2. The Matching a partner screen ranks every partner by distance and skips
   anyone whose vehicle cannot take the load, then assigns the winner.
3. Accept, ride to the store, work through the gate sequence, scan each gate picker QR.
4. Slide to mark picked, ride to the drop, photo, OTP, collect cash, complete.

Demo speed in the header runs the SLA clock at 1x, 10x or 30x.

## Structure

```
src/
  data.js                      catalog, gates, partners, customers, FLOW, helpers
  state.js                     useReducer store: order factory, allocation, actions, edge cases
  App.jsx                      routes to the app or the board, demo clock, timers, channel owner
  OpsPage.jsx                  the board tab: subscribes to state, posts commands back
  channel.js                   BroadcastChannel plus localStorage snapshot
  styles.css                   all styling, no framework
  components/
    Phone.jsx                  maps order status to a screen
    OpsPanel.jsx               stats, kanban, edge cases
    ui.jsx                     SlaBar, SlideToConfirm, Items, ProgressCard
    LeafletMap.jsx             OSM tiles, fixed route polyline, animated rider marker
    maps.jsx                   GateMap, the compound driveway diagram
    screens/HomeScreens.jsx    offline, searching, simulator, intake, allocation
    screens/UpiScreen.jsx      UPI QR for the balance or the full amount
    screens/PickupScreens.jsx  new order, to store, gate plan, gate, gate move, collected, scanner
    screens/DeliveryScreens.jsx to customer, proof of delivery, payment, summary
```

## State machine

`placed -> routed -> packing -> ready -> allocating -> assigned -> accepted -> at_store ->
at_gate -> gate_move -> verified -> picked -> en_route -> arrived -> pod_ok ->
paid -> completed`

`gate_move` loops back to `at_gate` until every gate on the order is collected.
Partner view and ops board read the same `orders` array, so nothing can drift.

## Maps

`LeafletMap.jsx` owns the street maps. Tiles come from
`tile.openstreetmap.org`, markers are `divIcon` elements built from inline SVG
so no image assets are fetched, and the polyline for each leg is generated in
`data.js` by `legPath()`, which bends the line twice so it reads as a road
rather than a straight hop.

The dark store compound stays a drawn SVG in `maps.jsx`. Gate positions inside
a private yard are not in OpenStreetMap, and the point of that view is the
driving order between gates.

## Language

The partner app is bilingual, English and Hindi. `src/i18n.jsx` holds the
dictionary and a `t(text, vars)` helper keyed on the English string itself, so
a missing translation falls back to English rather than showing a key. Toasts
are stored in state as a key plus variables and translated at render, not when
they are created.

A partner picks their language on first launch, before anything else, with both
options shown in their own script. The ops nav carries a toggle so you can flip
the phone mid demo. The console itself stays in English, since it is used by the
internal team.

## Units, not kilos

Weight decides which vehicle can take the order, so it appears in allocation
and on the order card. Everywhere the partner counts material with the
customer it is trade units: bags, lengths, boxes, cans, bundles, pieces.
`unitLine()` renders "4 lengths &middot; 3 m each"; `unitsOf()` totals them for the
handover checklist and the trip summary.

## Gates

Pickup is split by material so heavy loads never cross the store floor.

| Gate | Materials | Why |
| --- | --- | --- |
| A | cement, tiles, adhesive, UPVC pipes | vehicle backs into the loading dock |
| B | paints, white cement, Fevicol | sealed bay away from cement dust |
| C | wire, fittings, tools | counter handover |

Each order carries a `gates` array and a `gateIdx`. The app shows the numbered
sequence on a store map, then one screen per gate with picker, bay and items.

## What is mocked

- Order intake, states 1 to 4, behind the simulator card
- Maps are real OpenStreetMap tiles through Leaflet, with no API key. The route
  is a fixed polyline between two Bengaluru coordinates and the marker is moved
  along it by the trip progress value, so there is no GPS, no permission prompt
  and no routing engine. Distances and ETAs are derived from those coordinates.
- The QR step is a full scanner UI that confirms on tap, not a camera read
- Payments start as cash on delivery. If the customer is short, or asks to pay
  digitally, the app shows a real UPI QR generated with `qrcode-generator` from
  a `upi://pay` intent. Any UPI app will read it, though nothing settles. There
  is no pending or unpaid exit: the trip only closes once the full amount is in,
  as cash, as UPI, or as a split of both.

## Edge cases wired in

Partner declines or times out, wrong item at a gate scan, customer unreachable,
cash short at the doorstep, partner drops off the network mid trip. SLA breach
fires on its own once an order crosses 60 minutes.
