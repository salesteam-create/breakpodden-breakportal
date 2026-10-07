# Break Portal (prototype)

Interactive prototype of the Breakpodden Break Portal: a provably fair randomizer for live card breaks.

Live demo: https://salesteam-create.github.io/breakpodden-breakportal/ (deployed from `main` by `.github/workflows/pages.yml`).

## Run

```bash
npm install
npm run dev        # local dev server
npm run build      # single self-contained file in dist/index.html
npm test           # fairness engine tests
```

`dist/index.html` can be opened directly in a browser or shared as one file.

## Demo flow

1. **Break #394 (random team):** import buyers from Shopify (simulated), load the box checklist, seal, roll the dice, watch the shuffle rounds, reveal.
2. **Break #403 (pick your team):** team board with real splits and prices, then a filler draw for the unsold teams.
3. **Wheel of fortune** and **Duck race** giveaways.
4. **Pop out stream view** on any page opens a 1920x1080 window for OBS or Streamlabs capture (green screen toggle on hover).
5. **Fairness proofs:** every draw can be recomputed from its revealed seed, including a tamper test.

## How fairness works

- A 256-bit seed comes from the browser's cryptographic RNG (`crypto.getRandomValues`).
- Before the roll, the portal publishes `SHA-256(seed | SHA-256(inputs))`, which locks the seed and both lists.
- Dice, every shuffle round (Fisher-Yates), wheel spins and race order come from `SHA-256(seed:label:counter)` with unbiased rejection sampling.
- After the draw the seed is revealed so anyone can recompute every step (`src/lib/fair.ts`).

## Data

Break titles, team checklists and prices come from breakpodden.com. Buyer names are invented. The Shopify connection is simulated; draws are stored in the browser's localStorage.
