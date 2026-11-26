# Holographic Royalty redesign: implementation report

**Branch:** `claude/laughing-gates-v4qyl5`.
**Checkpoints:** the original design is on the `design-v1` branch (also served at `/v1/` on the live site). The previous "Break Studio" redesign is on the `design-v2-studio` branch.
**Status:** not deployed. GitHub Pages builds from `main`, which still serves the previous design.

## What changed, by phase

| Phase | Implemented |
|---|---|
| 01 Visual foundation | Palette: obsidian, royal violet, gold and champagne, with violet, pink and cyan holographic accents. Type: Sora for display, Barlow Condensed for athletic numerals and broadcast names, Inter for the interface, IBM Plex Mono for technical values. Holographic and metal gradients, glass surfaces with foil edges, animated gradient text. Light theme kept, redesigned as pearl, platinum, lavender and champagne. Audience-facing "islands" (hero, monitor, cards, pond, stream) stay dark in both themes. |
| 02 Navigation and continuity | Floating glass rail with an animated holographic edge. The active highlight glides between items. The rail collapses to icons with tooltips, and on tablet and phone becomes a floating bottom dock. Floating top bar. Route changes run through the View Transitions API: the shell stays still, content dissolves, and break artwork is a shared element. A shared atmosphere (scene-tinted light fields, architectural lines, slow holographic dust) cross-fades per room: royal (dashboard), indigo draft chamber (breaks), gold and violet (wheel), aquatic (duck race), crystal (proofs), vault (checklists). |
| 03 Royal Arena dashboard | Launch-style hero: gradient headline, floating product art with pointer tilt, rotating halo rings, light sweep, staggered metadata, magnetic primary action, and a switcher between the two existing breaks. Animated stat counters. Asymmetric bento with signature art for each tool: crystal dice, metallic wheel, 3D duck, filler tickets, card vault, crystal shield. Broadcast-monitor stream preview. Break "tickets". Trust vault with real proof records and a designed empty state. Entrance choreography completes in about 1 s. |
| 04 Interaction system | `src/motion/fx.ts` is one delegated pointer system: `data-tilt` (3D tilt with moving specular light), `data-magnetic` (major actions drift toward the pointer) and `data-spot` (cursor light). Disabled on touch and for reduced motion. Metallic buttons with a light sweep, tactile press and focus glow. Animated progress sheen, count-up numbers, segmented controls, row and log entrances. Unified motion tokens (80 / 180 / 300 / 420 / 620 / 1200 ms) and one easing language. |
| 05 Cinematic draw | Draft-chamber break header with floating art. Workflow rail. Crystal dice with gold pips on a spotlit stage, a light pulse when they settle, an oversized total and a holographic ring. Focus mode dims the side panels during roll and shuffle. Shuffle rows glide with light trails under a "ROUND 03 / 07" counter and segmented meter. Holographic trading-card reveal: metal frame, colour-dodge foil that follows the pointer, glare, light sweep, buyer-name entrance, and a grouped stagger so any count settles in about 1.1 s. Filler cut-off drawn as an illuminated holographic line. |
| 06 Live entertainment | Wheel: spotlit stage, rotating holographic outer ring that speeds up while spinning, chasing studs, and on the confirmed winner the other segments dim. Winner announcement with spotlight, light sweep, cinematic name entrance and holographic sparks. Duck race: full-width grand-prix stage, aquatic caustics, cyan start line, glowing finish line, champagne winner ribbon, 3D podium entrance. |
| 07 Broadcast | Holographic animated frame and athletic typography. Status badge derived from the real draw state. Branded light-sweep transition between scenes. Pre-draw product showcase using the real break art (matched by break number), shown both before and after sealing. Live draw scene with dice and round counter. Final results as holographic cards (up to 18, 6 per row, readable at 720p). Winner sparks. |
| 08 Cohesion and performance | Motion audit and performance pass: per-frame backdrop blurs removed (the moving background forced re-blurring every frame), particle glow pre-rendered as sprites. Adaptive "lite" mode samples the frame rate after load and stops ambient loops on slow devices, keeping every draw animation. Force it with `?fx=lite`, or force full effects with `?fx=full`. |

## Functional preservation

- **Logic files:** `src/lib/*`, `tests/`, `vite.config.ts`, `package.json` and the deploy workflow are unchanged. `git diff 7415500 -- src/lib tests vite.config.ts package.json .github` is empty.
- **No new dependencies:** everything is CSS, SVG, canvas and the browser's View Transitions API.
- **Animations only follow the engine:**
  - dice land on the engine's faces;
  - rows move to each real round's order;
  - cards show the saved pairs;
  - the wheel lands on the drawn segment;
  - ducks follow the sealed order.
- **Timings:** CSS timings stay inside the existing hook timers. Dice take 1.65 s against 2.0 s for the roll, and rows move in 0.45 s against 0.95 s per round. The wheel spin is unchanged at 6.2 s.
- **Stream view:** it only reads the published state. Showcase art is looked up from the break number in the published title, and result cards are built from the published `left` and `order` lists.
- **Routing:** `src/motion/useRoute.ts` uses the same hash parsing and scroll behaviour as `lib/router.ts`. It only wraps the page swap in a view transition. A quick second navigation skips the running transition silently.

## Test results (Playwright against the production build)

| Check | Result |
|---|---|
| Unit tests (`npm test`) | 6 of 6 pass |
| Functional regression (25 checks: navigation, dice and rounds, fixed count, exact buyer-team pairs, list view, CSV, proof verify and tamper, void and re-draw, filler draw and winners choose, wheel and winner removal, duck winner and duration, commitment and seed timing, stream sync, persistence, back navigation, no page errors) | 25 of 25 pass |
| Same suite with reduced motion | 25 of 25 pass |
| Double-click on a step does not trigger the next step | Pass |
| Resize during shuffle, leaving mid-draw, keyboard focus ring, 50-duck race | Pass |
| Horizontal overflow at 1920, 1440, 1366, 1024, 768, 430, 390 and 320 px, all routes | None. At 320 px the hero ring extends past the edge but is clipped by its container. |
| Production build | Pass: single file, 565 KB (200 KB gzipped) |

## Performance (headless Chromium, software rendering, no GPU)

| Screen | Original | Redesign, before tuning | Redesign, tuned |
|---|---|---|---|
| Dashboard | 60 fps | 8.5 fps | 41 fps (lite mode triggers automatically) |
| Break workspace | 60 fps | 5.5 fps | 60 fps |
| Wheel | n/a | n/a | 60 fps |
| Shuffle | n/a | n/a | About 60 fps |
| 50-duck race | About 23 fps | n/a | About 27 fps |

These are worst-case numbers: the test machine has no GPU, so they are not representative of real devices. On a real GPU the full effects are expected to run smoothly, but I could not verify that here.

## Limitations

1. **Not checked on real hardware:** visual quality and smoothness on a real GPU browser, and how the View Transitions behave in Safari and Firefox. They fall back to an instant swap there.
2. **Crests and colours:** no licensed team crests or team colours exist, so cards use a neutral shield with the team's initials.
3. **Placeholders:** "Write to Shopify" is still simulated, the "AI checklist" button is still a disabled placeholder, and the stream shows at most 18 rows or cards (existing limit).
4. **Behaviour change:** the double-click arming guard (about 250 ms) is the only change in how controls respond.
5. **Not done:** no sound system exists, so none was added. No screen-reader walkthrough was done.
