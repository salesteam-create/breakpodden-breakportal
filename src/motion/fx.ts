// Central motion system for pointer-driven effects. One delegated listener set
// drives every element that opts in with a data attribute, so screens never
// carry their own pointer code:
//
//   data-tilt        perspective tilt + moving specular light (--rx, --ry, --mx, --my)
//   data-tilt="soft" smaller angles, for dense or text-heavy surfaces
//   data-magnetic    major actions drift a few pixels toward the pointer (--tx, --ty)
//   data-spot        cursor-following light only, no tilt (--mx, --my)
//
// Pure presentation: it only writes CSS custom properties. It is disabled for
// touch pointers and for prefers-reduced-motion.

const fine = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let installed = false;

export function installFx() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  let tiltEl: HTMLElement | null = null;
  let magEl: HTMLElement | null = null;
  let spotEl: HTMLElement | null = null;
  let frame = 0;
  let last: PointerEvent | null = null;

  const reset = (el: HTMLElement | null, props: string[]) => {
    if (!el) return;
    props.forEach((p) => el.style.removeProperty(p));
    el.classList.remove('is-tilting');
  };

  const apply = () => {
    frame = 0;
    const e = last;
    if (!e) return;
    if (tiltEl) {
      const r = tiltEl.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const max = tiltEl.dataset.tilt === 'soft' ? 4 : 9;
      tiltEl.style.setProperty('--rx', `${((0.5 - y) * max).toFixed(2)}deg`);
      tiltEl.style.setProperty('--ry', `${((x - 0.5) * max).toFixed(2)}deg`);
      tiltEl.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      tiltEl.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      tiltEl.style.setProperty('--hyp', Math.min(1, Math.hypot(x - 0.5, y - 0.5) * 1.6).toFixed(3));
      tiltEl.classList.add('is-tilting');
    }
    if (spotEl) {
      const r = spotEl.getBoundingClientRect();
      spotEl.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      spotEl.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    }
    if (magEl) {
      const r = magEl.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      magEl.style.setProperty('--tx', `${(dx * 0.18).toFixed(1)}px`);
      magEl.style.setProperty('--ty', `${(dy * 0.28).toFixed(1)}px`);
    }
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse' || !fine() || calm()) return;
      const t = e.target as Element | null;
      const nextTilt = (t?.closest('[data-tilt]') as HTMLElement | null) ?? null;
      const nextMag = (t?.closest('[data-magnetic]') as HTMLElement | null) ?? null;
      const nextSpot = (t?.closest('[data-spot]') as HTMLElement | null) ?? null;
      if (nextTilt !== tiltEl) { reset(tiltEl, ['--rx', '--ry', '--mx', '--my', '--hyp']); tiltEl = nextTilt; }
      if (nextMag !== magEl) { reset(magEl, ['--tx', '--ty']); magEl = nextMag; }
      if (nextSpot !== spotEl) spotEl = nextSpot;
      last = e;
      if (!frame) frame = requestAnimationFrame(apply);
    },
    { passive: true },
  );
  const leaveAll = () => {
    reset(tiltEl, ['--rx', '--ry', '--mx', '--my', '--hyp']);
    reset(magEl, ['--tx', '--ty']);
    tiltEl = magEl = spotEl = null;
  };
  document.addEventListener('pointerleave', leaveAll);
  window.addEventListener('blur', leaveAll);

  // Mark touch devices so CSS can swap hover effects for tap feedback.
  document.documentElement.classList.toggle('touch', !fine());
}

/**
 * Adaptive complexity: sample the frame rate shortly after load. On devices that
 * cannot keep up, add html.lite, which stops ambient loops (foil, rings, dust)
 * but keeps every draw animation and every result on screen.
 */
export function watchPerformance() {
  if (typeof window === 'undefined' || document.documentElement.classList.contains('lite')) return;
  // ?fx=full or ?fx=lite overrides the measurement (useful for demos and QA).
  const forced = new URLSearchParams(location.search).get('fx');
  if (forced === 'lite') { document.documentElement.classList.add('lite'); return; }
  if (forced === 'full') return;
  let frames = 0;
  let start = 0;
  const sample = (t: number) => {
    if (!start) start = t;
    frames++;
    if (t - start < 1500) requestAnimationFrame(sample);
    else if ((frames * 1000) / (t - start) < 40) document.documentElement.classList.add('lite');
  };
  window.setTimeout(() => !document.hidden && requestAnimationFrame(sample), 1200);
}
