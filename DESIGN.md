# DESIGN.md

The design system and experience spec for our **Intelligent Supply-Chain Risk & Route Management** platform. It covers what we're building, how it should look, how it moves, and the rules that keep every screen consistent.

> If a decision isn't covered here, choose whatever makes the **disruption → decision** story clearer and calmer, then add the rule to this file.

---

## 1. What we're building

### The problem
Goods move through a network of suppliers, factories, warehouses and stores. Four kinds of disruption break that flow:

| Disruption | Example | What it hits |
|---|---|---|
| **Traffic** | Port-gate congestion, an accident on a national highway | Shipments in transit |
| **Weather** | A heavy-rain red alert over a corridor, a cyclone landfall | Whole routes or regions |
| **Supplier delay** | A component supplier slips by 4 days | Stock that hasn't shipped yet |
| **Inventory shortage** | A warehouse falls below safety stock | The ability to fulfil orders |

Traffic and weather hit **routes**. Supplier delays and shortages hit **stock**. So we recommend two kinds of response: **better routes** and **better actions**.

### The product
A **decision-support platform**: the system detects and advises, and a human decides. Every screen serves one loop:

```
  DETECT            ASSESS              RECOMMEND             DECIDE            TRACK
  a disruption  →   who's affected,  →  ranked options    →   operator       →  the network
  is sensed         how badly, why      with trade-offs       approves one      updates live
```

### Who it's for
An **operations manager in a control room**. They watch many shipments at once, need to spot what's wrong in seconds, and must trust a recommendation before acting on it. They care about **time, cost, and what's at stake**, not raw data.

### Where it'll be seen
On a projector or large screen in front of judges, driven live. This shapes everything:
- It must read from **3 metres away** (big type, strong contrast, few colours).
- It must **tell a story in under 2 minutes** (scenario mode, section 9.4).
- It must **never break on stage** (it runs fully on local mock data, section 11).

---

## 2. Design principles

1. **Exceptions first.** Lead with what's wrong *right now*. Healthy things stay quiet and muted; problems glow.
2. **Show the why.** Every risk score and recommendation shows its evidence: the signal, the predicted impact, the comparison. No black boxes.
3. **One colour means one thing.** Orange is *always* a disruption or the primary action. Teal is *always* healthy or flowing. Never use them decoratively.
4. **Calm surface, sharp signal.** Dark, quiet, generous space, so a single orange pulse is impossible to miss.
5. **Cinematic, then precise.** The landing experience is filmic and emotional. The control tower is exact, dense and fast. Both share one visual language.
6. **Motion explains.** Animation shows cause and effect (a storm hits a route → the route turns orange → a new route draws itself). It never exists only to decorate.
7. **The human decides.** Recommendations are proposals with an **Approve** action, never silent automation.

---

## 3. Colour

### 3.1 Core palette

| Token | Hex | Name | Role |
|---|---|---|---|
| `night` | `#16232A` | Night | Primary dark surface. The control room. |
| `tide` | `#075056` | Tide | Secondary surface, healthy network, brand depth |
| `signal` | `#FF5B04` | Signal | **Disruptions, alerts, the primary action.** Used sparingly. |
| `mist` | `#E4EEF0` | Mist | Primary text on dark, light surfaces |
| `abyss` | `#0F1A1F` | Abyss | Deepest background, behind panels and the map |
| `graphite` | `#212121` | Graphite | Neutral dark, for imagery overlays and footers |

### 3.2 Extended scales

Generate full 50–950 scales from the core hexes for Tailwind. The steps below are the ones we use most.

**Night (neutrals, cool):**
| Step | Hex | Use |
|---|---|---|
| `night-950` | `#0F1A1F` | App background (= `abyss`) |
| `night-900` | `#16232A` | Panels, sidebar (= `night`) |
| `night-850` | `#1D2D35` | Raised cards, hover |
| `night-800` | `#253842` | Inputs, pressed, active rows |
| `night-700` | `#344A55` | Borders (strong) |
| `night-600` | `#4A616C` | Disabled text, chart gridlines |
| `night-400` | `#7D9198` | Tertiary text, captions (4.9:1 on night) |
| `night-300` | `#9DB0B6` | Secondary text (7.1:1 on night) |
| `night-100` | `#E4EEF0` | Primary text (= `mist`, 13.6:1 on night) |
| `night-50`  | `#F4F7F8` | Light-mode page background |

**Tide (teal):** `tide-700 #075056` · `tide-500 #0E7C74` · `tide-400 #2FB8A6` · `tide-300 #3FD0BC`
**Signal (orange):** `signal-700 #C2410C` · `signal-500 #FF5B04` · `signal-400 #FF7A33` · `signal-200 #FFC9A8`

**Borders and hairlines:** `rgba(228, 238, 240, 0.08)` default · `0.14` strong · `0.24` focus-adjacent.

### 3.3 Semantic tokens

Components never use raw hexes. They use these:

```css
:root {                         /* dark is the default theme */
  --bg:            #0F1A1F;     /* night-950 */
  --surface:       #16232A;     /* night-900 */
  --surface-raised:#1D2D35;     /* night-850 */
  --surface-sunken:#0B1418;
  --border:        rgba(228, 238, 240, .08);
  --border-strong: rgba(228, 238, 240, .14);

  --text:          #E4EEF0;     /* 13.6:1 */
  --text-muted:    #9DB0B6;     /*  7.1:1 */
  --text-subtle:   #7D9198;     /*  4.9:1, the minimum for small text */

  --accent:        #FF5B04;     /* signal */
  --accent-hover:  #FF7A33;
  --on-accent:     #16232A;     /* dark text on orange: 5.2:1. White on orange fails (3.1:1). */

  --brand:         #075056;     /* tide */
  --flow:          #2FB8A6;     /* healthy routes and "on track" */
}

[data-theme="light"] {          /* landing-page light sections and print */
  --bg:            #F4F7F8;
  --surface:       #FFFFFF;
  --surface-raised:#FFFFFF;
  --border:        rgba(22, 35, 42, .10);
  --text:          #16232A;     /* 13.6:1 */
  --text-muted:    #5B6B71;     /*  5.2:1 */
  --accent:        #FF5B04;     /* fills only. Orange text on light fails. */
  --accent-text:   #C2410C;     /* orange text on light: 4.8:1 */
  --brand:         #075056;     /*  8.5:1, the light-mode heading colour */
}
```

### 3.4 Risk scale

This is the most important colour system in the product. Four levels, always shown in this order, and **always paired with a label or icon**, never colour alone.

| Level | Token | On dark | Text on dark | Meaning |
|---|---|---|---|---|
| **Clear** | `risk-clear` | `#2FB8A6` | 6.5:1 | On track, no action needed |
| **Watch** | `risk-watch` | `#F2B33D` | 8.6:1 | A signal detected, impact uncertain |
| **At risk** | `risk-high` | `#FF5B04` | 5.2:1 | Delay or shortage likely, action recommended |
| **Critical** | `risk-critical` | `#FF5A65` | 5.3:1 | SLA breach or stock-out imminent, act now |

In light mode, use the ink variants for text: Clear `#0E7C74` · Watch `#9A6700` · At risk `#C2410C` · Critical `#B42318`.

**Risk score (0–100):** 0–29 Clear · 30–59 Watch · 60–84 At risk · 85–100 Critical.

**Disruption type colour is never used.** Type is shown with an icon (section 6). Colour is reserved for *severity*, so the map never turns into a rainbow.

### 3.5 Colour ratios
On any screen, aim for roughly **70% night/abyss · 20% mist text · 8% tide · 2% signal.** If more than a few things are orange, the screen is shouting. Re-check the severity logic.

---

## 4. Typography

### 4.1 Families

| Role | Family | Why |
|---|---|---|
| **Display + UI** | **Geist** (variable, 300–700) | Neutral, precise grotesk. Tight at large sizes, very legible at small sizes. |
| **Labels, data, codes** | **Geist Mono** (400, 500) | Shipment IDs, timestamps, coordinates, numbers in tables, uppercase micro-labels |

Load via the `geist` npm package (`geist/font/sans`, `geist/font/mono`) so they're self-hosted with no layout shift.

### 4.2 Scale

| Token | Size / line-height | Weight | Tracking | Use |
|---|---|---|---|---|
| `display-xl` | `clamp(3.5rem, 8vw, 7.5rem)` / 0.95 | 400 | -0.04em | Landing hero headline |
| `display-lg` | `clamp(2.5rem, 5vw, 4.5rem)` / 1.0 | 400 | -0.035em | Section headlines |
| `display-md` | `clamp(2rem, 3.5vw, 3rem)` / 1.05 | 450 | -0.03em | Sub-sections, big numbers |
| `h1` | 1.75rem / 1.15 | 500 | -0.02em | App page titles |
| `h2` | 1.375rem / 1.25 | 500 | -0.015em | Panel titles |
| `h3` | 1.125rem / 1.35 | 500 | -0.01em | Card titles |
| `body-lg` | 1.125rem / 1.6 | 400 | 0 | Landing body copy |
| `body` | 0.9375rem / 1.55 | 400 | 0 | App body (15px) |
| `body-sm` | 0.8125rem / 1.5 | 400 | 0 | Dense tables, secondary info |
| `label` | 0.6875rem / 1.2 | 500 mono | +0.12em, UPPERCASE | Buttons, eyebrow labels, tabs, table headers |
| `data` | 0.8125rem / 1.4 | 400 mono | 0, `tabular-nums` | IDs, ETAs, coordinates, ₹ amounts |
| `metric` | `clamp(2rem, 4vw, 3.5rem)` / 1 | 400 | -0.03em, `tabular-nums` | KPI numbers |

### 4.3 Rules
- **Display type is light and huge.** Large headlines use weight 400 with tight negative tracking. Never bold a display headline.
- **Mono uppercase for system voice.** Anything the *system* says (labels, statuses, IDs, buttons) is Geist Mono uppercase with wide tracking. Anything a *human* reads as prose is Geist.
- **Numbers are always `tabular-nums`** so ETAs and counters don't jitter.
- **Indexing:** sections and steps are numbered in mono: `01`, `02`, `03`.
- Minimum text size is **12px** (labels at 11px are allowed only in uppercase mono with tracking ≥ 0.1em).
- Max line length is 68ch for prose.
- **Emphasis by colour, not weight:** in a headline, emphasise a phrase by colouring it `signal` or `tide-300`, or by fading the rest to `text-muted`.

---

## 5. Space, layout and shape

### 5.1 Spacing
4px base: `1=4 · 2=8 · 3=12 · 4=16 · 5=20 · 6=24 · 8=32 · 10=40 · 12=48 · 16=64 · 20=80 · 24=96 · 32=128 · 40=160`.
Landing sections breathe (`py-32` to `py-40`). The app is dense (`gap-3` to `gap-4` inside panels).

### 5.2 Grid
- **Landing:** 12 columns, max width 1440px, gutter `clamp(16px, 4vw, 64px)`. Headlines are centred, at most 14ch wide.
- **App:** full-bleed, fixed shell (section 8.1). Panels snap to a 4px grid.
- **Visible grid motif:** a faint background grid (hairlines at `rgba(228,238,240,.05)`, 120px cells) with small `+` crosshair marks at some intersections. Occasionally one cell glows `signal` or `tide-300` at low opacity, like a sensor lighting up. Used on landing sections and empty states.

### 5.3 Radius
| Token | Value | Use |
|---|---|---|
| `r-xs` | 4px | Badges, chips, map tooltips |
| `r-sm` | 8px | Buttons, inputs |
| `r-md` | 14px | Cards, panels |
| `r-lg` | 24px | Landing feature cards, media frames |
| `r-full` | 999px | Status dots, toggles, the floating nav |

### 5.4 The notch: our signature shape
Large panels and media frames get a **notch**: a cut-out along one edge with 45° shoulders and softly rounded corners, as if a panel was machined to fit a part. It appears:
- On the **top edge** of feature panels (a shallow tab-shaped cut, 25–35% of the panel width, 20–28px deep)
- On the **left edge** of media frames (a vertical cut at mid-height)
- As the **ends of the intro aperture** (section 7.3)
- On **section transitions**, where a dark section ends in a notched edge into the next one

Build it with an SVG `clip-path: path()` generated per size, or a reusable `<Notch side="top" />` mask component. **Use it sparingly**: at most one or two notched elements per viewport. Small UI (buttons, badges, table rows) is never notched.

### 5.5 Depth
Depth comes from **light, not shadow**.
- Panels sit on `abyss` with a 1px `--border` and a very subtle top highlight (`inset 0 1px 0 rgba(228,238,240,.04)`).
- **Glass** is used only for floating chrome (nav pill, map overlays, toasts): `background: rgba(22,35,42,.55); backdrop-filter: blur(20px) saturate(140%); border: 1px solid rgba(228,238,240,.10)`.
- **Glow** is used only for signal: active disruptions get `box-shadow: 0 0 0 1px rgba(255,91,4,.5), 0 0 24px -4px rgba(255,91,4,.45)`.
- No drop-shadow stacks or grey shadows on dark surfaces.

---

## 6. Iconography and imagery

### Icons
- **Lucide**, 1.5px stroke, 16px in dense UI, 20px default, 24px in empty states.
- Disruption types always use these icons:

| Type | Icon |
|---|---|
| Traffic | `traffic-cone` |
| Weather | `cloud-lightning` (rain: `cloud-rain`) |
| Supplier delay | `factory` |
| Inventory shortage | `package-x` |
| Route / reroute | `route` |
| Recommendation | `sparkles` (AI) / `lightbulb` (rule-based) |

### Imagery
- **Cinematic, dusk-lit, real.** Trucks on highways, ports from above, warehouses at blue hour, storms over open land. Set in **India**: national highways, container ports, monsoon skies.
- Graded towards the palette: deep teal shadows, warm orange highlights. No saturated stock-photo blues.
- **Real-to-wireframe treatment:** key images have a "digital twin" twin, the same scene rendered as thin `mist` line-work with point-cloud dots and mono annotations (`SHP-1042 · ETA 14:20`). We crossfade between them to show *the system seeing the world*.
- Isolated assets (truck silhouettes, containers) are transparent PNG or WebP so they can animate independently.
- All images: WebP or AVIF, `next/image`, explicit dimensions, blur placeholder.
- **No text baked into images.**

### Hero footage (scroll-scrubbed frames)
The landing hero plays a pre-rendered frame sequence drawn to a canvas: scroll position picks the frame, so the camera only moves when the reader scrolls.
- Source: one continuous 8–10 s clip, 16:9, ≥1080p, no cuts, no text or logos. Frame 0 is the resting hero: truck in side profile, horizon at ~60% height, sky above and dark ground below with room for the headline.
- Convert with `frontend/scripts/make-frames.sh <clip.mp4> [count]` (default 300 frames). It writes desktop (1920w) and mobile (1080w) WebP frames plus `public/frames/hero/manifest.json`; the hero picks them up automatically.
- Without a manifest the hero falls back to the drawn parallax scene.

---

## 7. Motion

### 7.1 Principles
- Motion shows **cause → effect** or **where something went**.
- Landing motion is **scroll-driven and filmic**. App motion is **fast and functional**.
- Everything respects `prefers-reduced-motion` (section 7.6).

### 7.2 Tokens

| Token | Value | Use |
|---|---|---|
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Default for entrances and reveals |
| `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Camera moves, aperture, morphs |
| `ease-snap` | `cubic-bezier(0.2, 0.9, 0.1, 1)` | Hover, press, toggles |
| `dur-instant` | 100ms | Press feedback |
| `dur-fast` | 180ms | Hover, tooltips |
| `dur-base` | 280ms | Panels, drawers, cards |
| `dur-slow` | 600ms | Route redraws, map fly-to |
| `dur-cinema` | 1200–2400ms | Intro, hero transitions |
| `stagger` | 40ms (UI) / 80ms (words) | Lists, word reveals |

### 7.3 Signature moment 1: the intro aperture (landing load, ~3.2s)

```
 0.0s  Light mist screen (#E4EEF0) with the faint grid and notched corner lines.
       A tiny logo mark sits in the centre.
 0.6s  The mark collapses into a hairline that stretches horizontally across the screen.
 0.9s  The hairline opens into a thin APERTURE (~6vh tall). Its ends flare out with
       notch-shaped shoulders. Through it: a dusk sky with an orange horizon.
 1.3s  A truck silhouette, rim-lit and headlights on, glides in from the left
       through the aperture and settles in the frame.
 2.0s  The aperture expands vertically to full-bleed (ease-in-out, 900ms).
       The headlight beam blooms.
 2.6s  The floating glass nav fades down from the top, and the hero headline
       reveals word by word.
 3.2s  Idle: subtle parallax between the sky, truck and ground layers on pointer move.
```
- Built from **layered assets** (sky, ground, truck PNG, headlight glow) composed in the DOM, animated with GSAP.
- Plays **once per session** (a `sessionStorage` flag). Repeat visits jump to the final frame. A **Skip** button (label style) is shown in the bottom-right.
- It must stay at 60fps on a laptop: animate only `transform`, `opacity` and `clip-path`.

### 7.4 Signature moment 2: scroll-scrubbed hero
After the intro, scrolling **scrubs** through the scene (a pre-rendered frame sequence drawn to `<canvas>`, or layered parallax as a fallback). The camera pushes forward along a highway at dusk. Meanwhile:
- Headline lines reveal **word by word**: each word fades from `text-muted` at 20% opacity to `mist`, tied to scroll progress.
- At ~60% of the scrub, the real scene **crossfades into its wireframe twin** (point-cloud trucks, mono labels). This is the "the system sees your network" moment.
- The section is pinned for ~250vh, then releases into a notched transition.

### 7.5 Signature moment 3: signal → decision (scroll story)
This is the core narrative section. It explains the product without a paragraph of text.

```
STAGE 1  "Thousands of signals"
         A wide field of thin vertical bars (each one a shipment or data feed:
         GPS pings, weather cells, supplier ETAs, stock levels) drifts gently,
         drawn in pale mist outlines on a light section.

STAGE 2  "A few of them matter"
         As you scroll, 3–4 bars light up: two in tide-300 (signals worth watching),
         one in SIGNAL orange (a real disruption). They detach, tilt, and fall
         out of the field.

STAGE 3  "Traced to impact"
         Each lit bar travels down its own dotted route line (1px dashed, mist 40%),
         curving and crossing the others, to small connector nodes. Short captions
         appear beside each path: "Landslide risk at Khandala ghat", "Supplier ETA +4 days",
         "Delhi DC below safety stock".

STAGE 4  "One clear decision"
         The paths converge into a single recommendation card that assembles itself:
         ┌───────────────────────────────────────────┐
         │ RECOMMENDED ACTION              AT RISK ● │
         │ Reroute SHP-1042 via old NH-48            │
         │ +1h 40m · ₹4,200 · saves ₹1.8L in penalty │
         │ [ APPROVE ]  [ VIEW ALTERNATIVES ]         │
         └───────────────────────────────────────────┘
```
- Built in SVG (bars, paths) and animated with GSAP ScrollTrigger (`scrub: true`). Paths draw in with `stroke-dashoffset`.
- Captions use the "fade the rest" emphasis: the active caption is `text`, the others `text-subtle`.
- Mobile version: fewer bars (24 instead of ~60), straight vertical paths.

### 7.6 Supporting motion
- **Odometer counters:** KPI numbers roll digit by digit (each digit is a vertical strip from 0 to 9) when they enter the viewport or update live. Used for headline stats and app KPIs.
- **Sticky feature scroller:** left column lists 3–4 capabilities. The active item is `text`, the others fade to `text-subtle`, and a mono index (`01`–`04`) tracks progress. The right column is a sticky notched media frame that crossfades per item, from real image to wireframe twin with live mono annotations.
- **Map (app):**
  - Shipments move along routes with a soft trail (deck.gl `TripsLayer` style).
  - A disruption appears as a **pulse ring** (signal, 1.6s loop, max 3 rings) plus an affected-area polygon fading in.
  - The affected route recolours from `flow` to `signal` over 600ms.
  - **Approving a reroute:** the old route dims to a dashed `night-600` line, the new route **draws itself** from origin to destination (`dur-slow`, `ease-in-out`), the truck marker transfers onto it, and the ETA odometer rolls to its new value.
- **Alerts:** new alerts slide in at the top of the feed (`y: -8 → 0`, opacity, `dur-base`) with a one-time glow pulse. No sound.
- **Hover:** cards raise their border to `--border-strong` and nudge up 1px. Buttons brighten. No scaling except on map markers (1 → 1.15).

### 7.7 Reduced motion
With `prefers-reduced-motion: reduce`:
- The intro is skipped and the hero shows its final frame.
- Scroll scrubs become simple section fades.
- Counters render their final value.
- Map routes swap instantly, and pulse rings become a static ring.
- Information must never depend on motion.

---

## 8. The app: control tower

### 8.1 Shell
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ▣ LOGO   CONTROL TOWER  SHIPMENTS  NETWORK  SCENARIOS     ⌕ ⌘K  ● LIVE  👤  │ ← 56px top bar
├────────┬──────────────────────────────────────────────────────┬──────────────┤
│ KPI    │                                                      │ DISRUPTIONS  │
│ rail   │                     LIVE MAP                         │ feed         │
│        │       (routes, shipments, hubs, risk overlays)       │              │
│ 4 tiles│                                                      │ newest first │
│ stacked│   ┌ legend ┐                    ┌ layer toggles ┐    │ grouped by   │
│        │   └────────┘                    └───────────────┘    │ severity     │
│ 280px  │                                                      │ 380px        │
├────────┴──────────────────────────────────────────────────────┴──────────────┤
│ Recommendation drawer: slides up from the bottom or in from the right on select │
└──────────────────────────────────────────────────────────────────────────────┘
```
- The map is the main element and always takes the remaining space.
- Side panels collapse to icon rails below 1280px. Below 768px it becomes a tabbed single column (Map · Alerts · Shipments).
- `⌘K` opens a command palette (jump to a shipment, a hub or a scenario).

### 8.2 Screens

| Route | Screen | Purpose |
|---|---|---|
| `/` | **Landing** | The cinematic story (intro, hero, signal → decision, features, live stats, CTA → app) |
| `/control-tower` | **Control Tower** | Map, KPI rail and disruption feed. The home of the app. |
| `/control-tower?d=<id>` | **Disruption detail** (drawer) | Evidence, affected shipments and stock, ranked recommendations, Approve |
| `/shipments` | **Shipments** | A table of all shipments with risk, ETA vs plan, route and status. Filterable. |
| `/shipments/[id]` | **Shipment detail** | Route timeline, risk history, events log, current recommendation |
| `/network` | **Network** | Suppliers, warehouses and stock levels. Inventory health and supplier reliability. |
| `/scenarios` | **Scenario lab** | Trigger demo disruptions (section 9.4) |

### 8.3 Disruption detail: the decision screen
This is the most important screen in the product. Top to bottom:

1. **Header:** type icon, title ("Landslide risk: Mumbai–Pune Expressway, Khandala ghat"), risk badge, detected time (mono), source (mono label, e.g. `IMD ALERT`).
2. **Impact summary:** 3 metrics with odometers: **Shipments affected** · **Avg delay** · **Value at risk (₹)**.
3. **Why we flagged this (evidence):** a short list of signals, each with a source and a confidence bar. Collapsed by default to 3 items.
4. **Affected:** a compact list of shipments and SKUs, each with its own mini risk badge and ETA delta (`+9h 20m` in signal).
5. **Recommendations:** 2–3 **option cards** ranked best-first. The top one is marked `RECOMMENDED`.
   - Each card shows the action, **Δ time · Δ cost · risk after**, and a one-line rationale.
   - Hovering a card **previews** its route on the map (dashed, `tide-300`).
6. **Actions:** `APPROVE` (primary, signal) · `ASSIGN` · `DISMISS` (with a reason). After approval, a toast and a timeline entry appear, and the map animates the change.

### 8.4 Components

| Component | Spec |
|---|---|
| **Floating nav (landing)** | A glass pill, 64px tall, `r-full`, centred, max 1100px, floating 24px from the top. Logo left, links centre (body-sm), CTAs right. Gets more opaque after 80px of scroll. |
| **Button: primary** | `signal` fill, `--on-accent` text, label style (mono uppercase), height 40 (app) or 48 (landing), `r-sm`. Hover: `signal-400`. |
| **Button: secondary** | `mist` fill, `night` text, same shape. |
| **Button: ghost** | Transparent, 1px `--border-strong`, `text` colour. |
| **Risk badge** | `r-xs`, 20px tall, mono label, 6px status dot plus the level text. Background is the risk colour at 14% opacity, text is the risk colour. Critical's dot pulses. |
| **Alert card** | `surface` background, `r-md`, 1px border, a 3px severity bar on the left edge. Shows type icon, title, location, mono time-ago, and affected count. When selected: glow (section 5.5) and the map flies to it. |
| **Recommendation card** | `surface-raised`, `r-md`. The `RECOMMENDED` card gets a 1px signal border plus a mono eyebrow. Deltas are shown as three mono stat cells. |
| **KPI tile** | Mono label, `metric` number with odometer, delta chip (▲/▼ with colour by *meaning*, not direction), and an optional 48px sparkline in `tide-300`. |
| **Map tooltip** | Glass, `r-xs`, mono data rows, 240px max width. |
| **Table** | Sticky header in label style on `surface-sunken`. 44px rows. Mono for IDs, ETAs and money. Hover row is `night-850`. Risk column is a badge. |
| **Timeline** | A vertical 1px line with nodes. Node colour comes from event severity. Mono timestamps on the left. |
| **Toast** | Glass, bottom-right, 4s, with an action link ("View on map"). |
| **Empty state** | Faint grid motif, a 24px Lucide icon, one line of copy, one action. |
| **Skeletons** | `night-850` blocks with a slow (1.6s) left-to-right sheen. |

### 8.5 Map styling
- **Base map:** a custom dark vector style. Land `#121E24`, water `#0B1418`, roads `#1F3039` (highways `#2A3F4A`), labels `night-400` in Geist. Few labels: states and major cities only.
- **Hubs** (warehouses, ports, suppliers): 10px squares (`r-xs`) in `mist` with a mono label on hover. Type is shown by a small inner glyph.
- **Routes:** 2px lines. Healthy routes are `flow` at 70% opacity, at-risk routes are `signal`, and a selected route gets a 4px width plus a glow. Alternatives are dashed `tide-300`.
- **Shipments:** 8px dots in their risk colour, moving along routes, with a soft trail.
- **Weather overlay:** a translucent animated precipitation field (blue-teal at 25% → signal at 40% for severe cells). Toggled from the layer controls.
- **Traffic overlay:** road segments tinted by congestion (watch → high).
- **Default view:** all of India, fitted to the active network. Selecting a disruption flies to its bounds (`dur-slow`).

---

## 9. Content and voice

### 9.1 Voice
**Calm, specific, decisive.** Like a great operations lead on the radio.
- ✅ "A landslide on the Mumbai–Pune Expressway will delay 6 shipments by ~7h. Reroute 4 via old NH-48."
- ❌ "Uh-oh! Weather issues detected 🌧️ Click here to learn more!"

### 9.2 Rules
- Lead with impact, then cause: "**6 shipments delayed** · landslide, Mumbai–Pune Expressway".
- Always quantify: hours, ₹, units, %. Use the Indian number format (₹1,80,000 or ₹1.8L).
- Times in IST, 24h, mono: `14:20 IST`. Relative times in the feed: `4m ago`.
- IDs: `SHP-1042`, `WH-DEL-02`, `SUP-CHN-11`.
- Button labels are verbs: Approve, Reroute, Transfer stock, Notify customer.
- No exclamation marks. No emoji in the UI.

### 9.3 Landing copy skeleton
1. **Hero:** "See disruptions before they reach your customers."
2. **Signal → decision:** "Thousands of signals. A few that matter. One clear decision."
3. **Features (sticky scroller):** 01 Detect · 02 Assess · 03 Recommend · 04 Track
4. **Live stats (odometers):** shipments monitored · disruptions caught · hours saved · ₹ protected
5. **CTA:** "Open the control tower →"

### 9.4 Scenario mode (for the demo)
`/scenarios` lists pre-built, India-specific disruptions you can fire with one click, e.g.:
- **Monsoon red alert:** Mumbai–Ahmedabad corridor
- **Port congestion:** JNPT gate, 14h backlog
- **Supplier slip:** Chennai electronics supplier, +4 days
- **Stock-out risk:** Delhi DC, SKU below safety stock

Firing one plays the whole loop on the control tower (alert slides in → map pulses → route turns orange → recommendation drawer opens), ready for a one-click **Approve**. A `RESET` button restores the calm baseline. A keyboard shortcut (`Shift + D`) fires the next scenario so the presenter never has to hunt for buttons.

---

## 10. Accessibility
- All text meets **WCAG AA** (contrast ratios are listed next to each token above). Orange buttons use **dark text**.
- Severity is never shown by colour alone: there is always a label, icon or pattern (e.g. dashed for alternative routes).
- Full keyboard support: visible focus ring `0 0 0 2px var(--bg), 0 0 0 4px var(--accent)`, logical tab order, `Esc` closes drawers.
- Live regions: new critical alerts are announced politely via `aria-live`.
- Map content has a table equivalent (Shipments screen) for screen-reader users.
- Respect reduced motion (section 7.7).
- Hit targets are at least 32px in the app and 44px on touch.

---

## 11. Engineering

### 11.1 Stack

| Concern | Choice |
|---|---|
| Framework | **Next.js** (App Router) + **TypeScript** |
| Styling | **Tailwind CSS v4** with the tokens above as CSS variables (`@theme`) |
| Components | **shadcn/ui** (Radix primitives), restyled to this system |
| Scroll and cinematic motion | **GSAP** + **ScrollTrigger**, with **Lenis** smooth scroll on the landing page only |
| UI micro-motion | **Motion** (`motion/react`) |
| Map | **MapLibre GL** (custom dark style) + **deck.gl** layers for routes, trips and overlays |
| Charts | **Recharts**, themed |
| Icons | **lucide-react** |
| Fonts | `geist` package |

### 11.2 Data layer: built to be swapped
The frontend ships with **realistic mock data** so it works fully offline and on stage. The backend team can replace it without touching any UI.

```
src/lib/data/
  types.ts        ← the contract: Shipment, Route, Hub, Disruption, RiskAssessment,
                    Recommendation, InventoryItem, Supplier, TimelineEvent
  provider.ts     ← interface DataProvider { getShipments(), getDisruptions(),
                    getRecommendations(id), approveRecommendation(id), subscribe(cb) }
  mock/           ← MockProvider: seeded India network + scenario engine
  api/            ← ApiProvider: fetch/WebSocket implementation (backend team)
```
- Pick the provider with `NEXT_PUBLIC_DATA_SOURCE=mock | api`.
- UI components only ever import from `provider.ts` and `types.ts`.
- `types.ts` is the agreed contract with the backend. Change it deliberately and tell the team.

### 11.3 Quality bar
- Lighthouse on the landing page: Performance ≥ 85, Accessibility ≥ 95.
- The landing page's heavy media lazy-loads after the intro. Frame sequences are WebP, ≤ 120 frames, preloaded progressively.
- The control tower stays smooth with 200 moving shipments on the map.
- It works offline in mock mode.
- It's tested at 1920×1080 (the projector), 1440×900 and 390×844.

---

## 12. Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| Keep the screen mostly dark and quiet | Use orange for decoration, headings or icons that aren't alerts |
| Pair every risk colour with a label | Add a fifth risk colour or colour-code disruption types |
| Put the evidence next to every recommendation | Show a recommendation without trade-offs |
| Use mono uppercase for system labels | Use mono for paragraphs |
| Animate cause → effect | Animate things just because they can move |
| Use India-specific places, ₹ and IST | Use generic "Location A → Location B" placeholder data in demos |
| Notch one or two hero elements per view | Notch every card |
| Make headlines huge and light | Bold display text or use all-caps headlines |
