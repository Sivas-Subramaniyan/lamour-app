# Building L'Amour screens

A clickable prototype of L'Amour, a premium dating app with:
- no feed and no swiping
- a voice concierge, **Aura**
- explainable compatibility
- an agent that turns matches into booked dates

The setting is New York in autumn 2026. The demo user is **Ananya Rao** (29, product designer and potter, Brooklyn). Her own name and date of birth can be changed in onboarding.

```
npm run dev      # http://localhost:5179 (desktop shows the phone + Flow Navigator + Director panel)
npm run build    # tsc + vite build — must stay green
npm run check    # numerology + compatibility self-check
```

## The concept in one breath

- **Days are quiet.** The Tonight tab shows `tonight/dusk`.
- **At dusk the app turns to ink** and an evening **letter** arrives. You hold to break the seal.
- The letter holds **up to three introductions**, numbered I–III. Each is person-first:
  - photos, their own words and voice pages
  - **Why you two**: a band, a confidence level, 3 sourced reasons and 1 honest care note
  - a separate **Resonance** numerology card
- **You decide** with **Lean in**, **Not tonight** (the reason trains Aura) or **Hold**.
- **Both lean in → Introduced.** A chair fills (**Three Chairs** = at most 3 open connections), a 72-hour arc starts, and you get a private **Bridge Brief**.
- **The conversation** opens with a voice hello, then chat, then an optional **Voice Hour**.
- **Aura plans the date.** She asks "Shall I set a table?", then offers **Three Evenings** and **Parley Minutes**. Both people **seal**, and a **Date Pass** is issued.
- **Date day:** the **Brief**, **Guardian Circle**, an "All well?" check-in, **Call me out**, SOS, and "running late".
- **After:** a **Morning After** debrief at 10 AM, then **What Aura learned**, then a second evening or **Close kindly**.

## Rules (non-negotiable)

1. **Never use `position: fixed`.** The app lives inside a phone frame. Use `position: absolute` inside the screen, and use `<Sheet>` for modals.
2. **Every screen must render with empty `params`.**
   - Person screens take `params.id` (a persona id). Use `leadId(s, params)` from the store; it falls back to tonight's first introduction.
   - If a plan is needed and missing, show a graceful state or create one with `startPlan(s, id, proposalsFor(s, id))`.
3. **No dead ends.** Every button does something real:
   - navigate
   - change state
   - open a sheet
   - show a toast
   
   No `alert()`. Simulated outcomes are fine (e.g. "the other person seals 2s later"), but show the waiting state first.
4. **Integrity of the product.**
   - Show compatibility as bands (Strong / Promising / Exploratory), **never percentages**, and never put a score above a face.
   - Numerology (Resonance) always sits **below and apart from** the science. Copy: it "doesn't change your band".
   - Aura writes *about* the two of you, **never as you**. Any assisted text is labelled ("drafted with Aura"), and nothing is sent without a confirm.
   - Wording is dyadic, never diagnostic ("one of you moves toward, one steps back"), never "he is anxiously attached".
   - Locations are **minutes only**, never home addresses. Rides are booked separately for each person.
5. **No engineering words in the consumer UI.** Banned: GraphRAG, node, telemetry, API, agent log, LLM, model, vector, weight %, snake_case, "Epitom". Aura's work is described in plain words ("I checked 14 evenings and 6 tables").
6. **Accessibility.**
   - Minimum text size 11px; body text 15–16px.
   - Tap targets at least 40px.
   - Contrast must pass on both themes: use `--ink`, `--ink-2` or `--ink-3`, never a lighter custom grey.
7. **Copy.** Warm, specific, adult, brief. Sentence case. No emoji. No "AI-speak":
   - no "delve", "unlock", "seamless", "elevate"
   - no exclamation marks

   French flourishes are allowed only for rituals and tiers: **Soirée** and **Maison** (membership), *L'Heure Bleue* (dusk).

## Design system — Ink & Ember

**Themes.** `theme: 'day'` is warm paper; `theme: 'night'` is candlelit ink. Set the theme per screen in the `ScreenDef`. Night is for the dusk letter, the voice chamber, intimate moments and date night.

**Colour grammar.**

| Colour | How to use it | Means |
|---|---|---|
| Ember (`.btn-ember`, `.card-aura`, `.tag.ember`) | — | Aura did or said this |
| Oxblood (`.btn-commit`, `var(--accent)` on day) | — | A person committed: lean in, seal, send |
| Sage (`.tag.sage`, `var(--sage)`) | — | Confirmed, verified, safe |
| `#c2281d` (`.btn-danger`) | SOS only | — |

**Type.** Serif (Instrument Serif) carries emotion and names, and *italic* means Aura's voice or a feeling. Geist is for UI. Mono (`.t-num`) is for numbers only.

| Class | Use |
|---|---|
| `.t-display` | 46px |
| `.t-title` | 34px |
| `.t-head` | 25px |
| `.t-quote` | serif italic, 22px |
| `.t-body`, `.t-callout`, `.t-small` | body and smaller text |
| `.t-label` | uppercase, 11.5px |

**Layout.**
- `.pad` gives 22px gutters.
- `.stack` / `.row` with `.gap-*` for spacing.
- `.card` + `.card-pad` for raised surfaces; `.card-flat` for quiet ones.
- Portraits use the **arch** shape (`<Portrait shape="arch">`). It is our signature silhouette.

**Primitives** (`src/design/ui.tsx`):
- Structure: `Screen`, `TopBar`, `Section`, `ListRow`, `Field`, `Eyebrow`
- Controls: `Button`, `IconButton`, `Chip`, `Tag`, `Toggle`, `Segmented`, `ScaleTap`, `Sheet`
- People: `Portrait`, `PairAvatars`, `Halo`, `ArcRail` (Introduced → Hello → Voice Hour → Sealed → Met → Debriefed)
- Audio and Aura: `Waveform`, `Orb`, `AiBadge`
- Compatibility: `BandMark`, `Meter`
- Misc: `Countdown`, `EmptyState`, `WaxSeal`
- Feedback: `useFeedback()` → `banner({title, body, onOpen})` for in-phone push notifications, `toast(text)`

**Generative marks** (`src/design/signature.tsx`):
- `<Signature layers={[{ modes: signatureModes(traits), color }]} agitation={level} />`: the Chladni figure of a person. Use two layers for "where you meet".
- `<Lissajous a={lp1} b={lp2} />`: the numerology handshake.

**Icons.** Use `<Icon name="…" />` from `src/design/icons.tsx` (line set). No emoji.

**Motion.**
- Use `motion/react` (`import { motion, AnimatePresence } from 'motion/react'`).
- "Settle, don't bounce": springs with damping ≥ 26, or `cubic-bezier(0.22,1,0.36,1)`.
- Only ceremonies (Signature settling, seal, introduced, letter) run longer than 0.8s.

## State (`src/state/store.tsx`)

**Reading and writing.** `const { s, update } = useApp()`. Write with `update(s => ({ ...s, … }))`, or use the domain moves:
- `decide`
- `introduce`
- `send`
- `setStage`
- `startPlan`
- `patchPlan`
- `seal`
- `addNotice`
- `goToPhase`

**Derived values:**
- `myChart(s)`: numerology
- `fitWith(s, id)`: band, reasons, efforts and scores
- `completeness(s)`
- `connection(s, id)`, `planWith(s, id)`, `openChairs(s)`
- `proposalsFor(s, id)`
- `leadId(s, params)`
- `isDusk(s)`

**Demo clock.**
- `useNow()` returns a ticking demo `Date`. `s.phase` is one of `afternoon | dusk | date-night | morning-after`.
- Formatting helpers: `fmtTime`, `fmtDay`, `fmtLongDay`, `fmtLeft`.

**Data:**
- `PERSONAS` / `persona(id)` / `ageOf(dob)` / `CAST` in `src/data/personas.ts`
- `VENUES` / `venue(id)` / `venuePhoto(v)` in `src/data/venues.ts`

**Voice** (`src/lib/voice.ts`):
- `useMicLevel(active)` → `{ level, state }`
- `useTranscript()` → `{ supported, text, interim, listening, start, stop }`
- `speak(text, { voice: s.me.voice, muted: s.settings.auraMuted })`
- `chime()`, `haptic()`

**Numbers** (`src/lib/numerology.ts`): `chart(birthName, dob)`, `lifePathSteps(dob)`, `ARCHETYPE`, `resonance(a, b)`, `COUPLE_NUMBER`.

## Adding a screen

**Ids.** Screen ids are fixed in `src/shell/screens.ts`. **Do not add ids.** For sub-states, use local state or a `<Sheet>`.

**Flow folders.** Each flow folder exports `screens: ScreenDef[]` from `index.tsx`. Each `ScreenDef` sets:
- `id` and `title` (the title shown in the Flow Navigator)
- `component`
- `theme` and `chrome` (`'tabs'` shows the tab bar on root screens)
- `presentation` (`'modal'` for sheets-as-screens, `'fade'` for ceremonies)
- `pillars`, a one-to-two-sentence `note`, and `real` (what is genuinely live or computed) for the Director's Notes

**Navigation.**
- `const nav = useNav()`, then `nav.push(id, { id: personaId })`, `nav.pop()`, `nav.replace(...)`, `nav.reset(...)` or `nav.goTab('tonight' | 'table' | 'aura' | 'plans' | 'you')`.

**Reference.** See `src/flows/conversation/Signature.tsx` as the reference screen.
