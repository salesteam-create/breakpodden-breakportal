# Break Studio redesign: implementation report

Branch `claude/laughing-gates-v4qyl5`. Not deployed: GitHub Pages builds from `main`, which still serves the previous design. The original design stays frozen on the `design-v1` branch and at `/v1/` on the live site.

## A. What changed

The whole app moves to a dark graphite and champagne-gold identity. Barlow Condensed is used for display type, Inter for the interface and IBM Plex Mono for hashes and seeds.

- **Navigation and shell:** a persistent left sidebar replaces the top navigation. It is grouped into Workspace, Breaks, Giveaways and Library, and can collapse to icons. On tablet and phone it becomes a drawer. A slim top bar shows a breadcrumb, the theme switch, Reset demo and the avatar.
- **Host screens ("control room"):** these stay calm and structured. Draw moments carry the drama: dice, shuffle rounds, the card reveal, the wheel winner and the duck race finish.
- **Stream ("arena") and other audience-facing surfaces:** the stream view, preview card, trading cards, pond and product art always render dark, whatever theme the host has chosen.

## B. Screen coverage

| Route | Screen and states redesigned |
|---|---|
| `#/` | Dashboard ("command centre"): KPI strip, featured break card, break list, tool tiles, stream preview, recent proofs, empty state |
| `#/break/394` | Team draw ("staging area"): break header, step rail, every action-bar state (import, checklist, count mismatch warning, seal, dice or fixed count, rolling, round counter, reveal, results), shuffle board, trading-card reveal, list view, fairness panel, voided panel, audit log, void form |
| `#/break/403` | Team board (open and filled tiles, sales, fillers), filler draw (seal options, roll, qualifiers with cut line, pick round, done), reveal cards |
| `#/wheel` | Wheel ("golden wheel"): seal, prize field, spinning, winner announcement, winners, entries, log |
| `#/duck` | Duck race ("grand prix"): length control, seal, countdown, live race, final standings, winner ribbon, podium, duck list |
| `#/checklists` | Box library and team editor: paste mode, split by player, duplicates warning, empty states |
| `#/proofs`, `#/proof/:id` | Trust centre: list, sealed (in progress) state, verified or failed banner, checks, voided notice, result table, shuffle rounds, published values, tamper test, JSON download |
| `#/stream` | Arena: idle, team or filler draw, wheel, duck race, green-screen toggle |

## C. Design system

- **Tokens** (`src/styles.css` section 1): the brief's palette, type scale, spacing, radii, elevation, layout and motion tokens. There is a light variant for the existing theme switch.
- **Arena islands:** the `.arena`, `.pond`, `.stream-root` and `.rcard` areas always use the dark broadcast palette.
- **Components:**
  - buttons: primary, secondary, outline, ghost and danger, plus `sm` and `lg` sizes;
  - segmented control, inputs and select;
  - chips: gold, good, void and fail;
  - cards, tables, empty states, hash blocks, round counter, trading card, winner announcement and trust banner.
- **Icons:** a new `Icon.tsx` holds a 36-icon outline set inline, so no dependency was added.
- **Page header:** a new `PageHeader.tsx`.
- **Motion:** precision, coordinated and reveal easings. Cinematic motion is used only for dice, card reveal, winner, podium and race finish. With `prefers-reduced-motion`, decorative motion stops (water, sheen, confetti, dust, pulses).

## D. Files

- **Modified:** `index.html`, `src/App.tsx`, `src/styles.css`, `src/components/{DrawControls,Panels,ShuffleBoard,Wheel}.tsx`, `src/pages/*.tsx`, `src/assets/box-*.webp`.
- **New:** `src/components/Icon.tsx`, `src/components/PageHeader.tsx`.
- **Untouched:** `src/lib/*` (fairness engine, draw hook, store, data, router), `tests/`, `vite.config.ts`, `package.json` and the deploy workflow. `git diff -- src/lib tests vite.config.ts package.json .github` is empty.

The product photos were given transparent backgrounds so they sit on dark surfaces. Filenames are unchanged.

## E. How functionality was protected

- No file under `src/lib` changed: seeds, commitments, dice, Fisher-Yates rounds, wheel spins, race order, storage keys, stream sync and the draw lifecycle timers all stay as they were.
- Animation never decides anything:
  - dice faces come from the engine's values;
  - team rows move to each real round's order;
  - the wheel lands on the drawn segment;
  - ducks follow the sealed finishing order.
- The CSS timings were kept within the hook's own timers: dice animate in 1.65 s against 2.0 s for the roll, and rows move in 0.45 s against 0.95 s per round.
- The reveal grid now staggers so all cards settle in about 1.1 s, whatever the count. Before, it took 180 ms per card.
- Wording that claimed verification without running it was corrected:
  - dashboard "Verified" became "Verifiable" and "Verified proofs" became "Published proofs";
  - the duck race "Race verified" became "Seed revealed";
  - the team draw "Break is live" became "Results locked".
- The stream status badge is computed from the published draw state, for example Sealed, Rolling, Shuffling, Spinning or Results locked. It never shows a made-up "live" state.

## F. Regression results

These are black-box tests run with Playwright against the production build. The same script passed on the original build first.

| Test | Result | Notes |
|---|---|---|
| RT-02 Navigation | Pass | All routes load, no page errors |
| RT-06/30 Checklist and persistence | Pass | Edits saved to `bp-checklists` |
| RT-08/11 Dice and rounds | Pass | Logged dice total equals the number of rounds executed and shown |
| RT-09 Fixed shuffle count | Pass | Exactly 3 rounds |
| RT-10/12 Assignments | Pass | Every card's `#n team: buyer` equals the saved record, in order |
| RT-12b List view | Pass | |
| RT-13/14 Team board and filler draw | Pass | 10 winners; board shows filler owners |
| RT-14b Winners choose | Pass | 10 picks saved to the record |
| RT-15/16 Wheel and winner removal | Pass | 2 spins; stream showed the same winner; proof verifies |
| RT-17/18 Duck race | Pass | Shown winner equals sealed order; proof verifies |
| RT-19 Commitment | Pass | Shown after seal; seed hidden until reveal |
| RT-20 Public proof | Pass | Verifies; tamper test fails as designed |
| RT-21 Stream sync | Pass | Commitment and winner appear in the pop-out |
| RT-23 Repeated clicks | Pass | See limitation 1 |
| RT-24 CSV export | Pass | Same filename and columns |
| RT-26 Browser history | Pass | |
| RT-27 Reduced motion | Pass | Full suite re-run with reduced motion: all pass |
| RT-29 Interrupted draw | Pass | Leaving mid-shuffle stops timers; no extra draw created |
| RT-34 Large datasets | Pass | 50-duck race |
| RT-36 Keyboard | Pass | Visible gold focus ring on sidebar links and controls |
| RT-37 Resize mid-shuffle | Pass | Rounds complete unchanged |
| RT-39 Void and re-draw | Pass | Reason shown; new draw references the voided one |
| RT-25 Sound | N/A | The app has no sound |
| RT-31/33 Permissions and integrations | N/A | No auth or real integration exists; Shopify is simulated |

Unit tests: `npm test` passes 6 of 6.

## G. Responsive and accessibility checks

- **Overflow:** I checked for horizontal overflow on all 7 routes at 1920, 1440, 1366, 1024, 768, 430, 390 and 320 px wide. None found after the fixes.
- **Contrast (WCAG):** I computed contrast ratios for the token pairs.
  - Dark theme: body text 16.3, secondary 6.9, muted 4.9 or more, gold on surface 9.0, primary button text 10.1, control borders 3.07.
  - Light theme: all text pairs are 4.6 or more.
- **Labels:** I added aria labels to unlabelled inputs, `aria-pressed` to toggles, polite live regions for round counters, winners and card results, and `role="alert"` for warnings.
- **Not done:** no screen-reader walkthrough or Lighthouse audit.

## H. Performance

These numbers come from headless Chromium with software rendering, so they are only indicative.

| Measurement | Result |
|---|---|
| Team draw with 18 entries, roll to "Reveal results" | 8 to 9 s for 5 to 6 rounds |
| Frame rate during shuffle | About 60 fps |
| Frame rate, 50-duck race | About 33 fps (original build: about 23 fps on the same machine) |

The 100-entry under-30-seconds target was not measured, because no 100-entry break exists in the sample data. The duration is set by the unchanged hook: 2 s for the dice plus 0.95 s per round, with at most 12 rounds.

## I. Build

`npm run build` succeeds and produces a single-file `dist/index.html` of 495 KB (177 KB gzipped). Hash routing and relative asset paths are unchanged.

## J. Limitations and items for review

1. **Double-click on a step:** in the original version, double-clicking "Seal the draw" also pressed "Roll the dice", because the next button appears in the same place. I verified this on the `design-v1` build. A presentation-only guard now ignores clicks on a newly shown primary action for about 250 ms. It does not change any draw logic, but it does change the behaviour from before.
2. **Team crests and team colours:** neither exists in the data, so cards use a neutral shield with the team's initials and no team colours. Real crests need licensed assets.
3. **Light theme:** kept, because it is an existing feature. Dark is the default, and the stream view, cards and race are always dark.
4. **Dashboard stream preview:** it still loops through sample scenes built from the sample buyers, as it did before. It is a format preview, not a live feed.
5. **Existing placeholders:** "Write to Shopify" (simulated: adds a log entry only, now stated in its tooltip) and the disabled "Draft a checklist with AI (later phase)" button were kept as they were.
6. **Stream board row limit:** the stream board still shows at most 18 rows (existing `MAX_ROWS`). A 79-entry filler draw shows its first 18 rows on stream.
7. **Duplicate team names:** team rows are keyed by name (existing). The checklist editor already warns about duplicates.
8. **Deterministic tests:** seeded fixtures were not added, because that would mean touching `src/lib`. Correctness was checked with invariants instead: proof recomputation, record-to-screen comparison and an empty diff on the logic files.
