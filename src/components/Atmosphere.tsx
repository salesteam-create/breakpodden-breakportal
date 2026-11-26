import { useEffect, useRef } from 'react';

// Shared atmospheric environment behind every screen: scene-tinted light fields,
// architectural lines and slow holographic dust on a canvas. The scene colours
// live in CSS (html[data-scene]) and cross-fade between routes. Particles pause
// when the tab is hidden and are skipped for reduced motion.

export type Scene = 'royal' | 'draft' | 'wheel' | 'aqua' | 'crystal' | 'vault';

export default function Atmosphere({ scene }: { scene: Scene }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    document.documentElement.dataset.scene = scene;
  }, [scene]);

  useEffect(() => {
    const c = canvas.current;
    if (!c || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const touch = !matchMedia('(hover: hover) and (pointer: fine)').matches;
    const count = touch ? 18 : 46;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0;
    // Decorative only: Math.random never touches draw data.
    const dots = Array.from({ length: count }, () => ({
      x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.6,
      vx: (Math.random() - 0.5) * 0.00006, vy: -0.00003 - Math.random() * 0.00007,
      hue: Math.random(), tw: Math.random() * Math.PI * 2,
    }));
    const palette = ['212,175,55', '196,181,253', '103,232,249', '232,121,249', '245,222,179'];
    // Pre-rendered glow sprites: one drawImage per particle instead of a new gradient each frame.
    const sprites = palette.map((col) => {
      const sp = document.createElement('canvas');
      sp.width = sp.height = 32;
      const g2 = sp.getContext('2d')!;
      const gr = g2.createRadialGradient(16, 16, 0, 16, 16, 16);
      gr.addColorStop(0, `rgba(${col},1)`);
      gr.addColorStop(1, `rgba(${col},0)`);
      g2.fillStyle = gr;
      g2.fillRect(0, 0, 32, 32);
      return sp;
    });
    const size = () => {
      w = window.innerWidth; h = window.innerHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    let prev = performance.now();
    const tick = (t: number) => {
      if (document.documentElement.classList.contains('lite')) { ctx.clearRect(0, 0, w, h); raf = 0; return; }
      const dt = Math.min(64, t - prev); prev = t;
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.x += d.vx * dt; d.y += d.vy * dt; d.tw += dt * 0.0015;
        if (d.y < -0.02) { d.y = 1.02; d.x = Math.random(); }
        if (d.x < -0.02) d.x = 1.02; else if (d.x > 1.02) d.x = -0.02;
        ctx.globalAlpha = 0.18 + 0.32 * (0.5 + 0.5 * Math.sin(d.tw));
        const r = d.r * 4;
        ctx.drawImage(sprites[Math.floor(d.hue * sprites.length)], d.x * w - r, d.y * h - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    const start = () => { if (!raf && !document.hidden) { prev = performance.now(); raf = requestAnimationFrame(tick); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const vis = () => (document.hidden ? stop() : start());
    start();
    window.addEventListener('resize', size);
    document.addEventListener('visibilitychange', vis);
    return () => { stop(); window.removeEventListener('resize', size); document.removeEventListener('visibilitychange', vis); };
  }, []);

  return (
    <div className="atmo" aria-hidden="true">
      <div className="atmo-base" />
      <div className="atmo-field f1" />
      <div className="atmo-field f2" />
      <div className="atmo-field f3" />
      <svg className="atmo-lines" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="atmo-line" x1="0" x2="1">
            <stop offset="0" stopColor="var(--holo-a)" stopOpacity="0" />
            <stop offset=".5" stopColor="var(--holo-a)" stopOpacity=".55" />
            <stop offset="1" stopColor="var(--holo-a)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M-50 700 L800 380 L1650 700" fill="none" stroke="url(#atmo-line)" strokeWidth="1" />
        <path d="M-50 820 L800 430 L1650 820" fill="none" stroke="url(#atmo-line)" strokeWidth=".7" />
        <path d="M800 380 V-20" fill="none" stroke="url(#atmo-line)" strokeWidth=".6" />
        <circle cx="800" cy="380" r="260" fill="none" stroke="url(#atmo-line)" strokeWidth=".6" />
        <circle cx="800" cy="380" r="420" fill="none" stroke="url(#atmo-line)" strokeWidth=".4" />
      </svg>
      <canvas ref={canvas} className="atmo-dust" />
      <div className="atmo-vignette" />
    </div>
  );
}
