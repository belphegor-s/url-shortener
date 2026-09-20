/** Inline stylesheet for the server-rendered landing page. Kept dependency-free so
 *  the marketing surface has zero JS/CSS build step and paints instantly. */
export const styles = /* css */ `
:root {
  --bg: #060608;
  --bg-soft: #0b0b10;
  --surface: rgba(255, 255, 255, 0.028);
  --surface-2: rgba(255, 255, 255, 0.055);
  --surface-solid: #101015;
  --border: rgba(255, 255, 255, 0.09);
  --border-strong: rgba(255, 255, 255, 0.17);
  --fg: #f5f5f7;
  --muted: #a4a4b0;
  --faint: #6d6d7a;
  --accent: #7c5cff;
  --accent-2: #34d3ee;
  --accent-3: #f471b5;
  --grid: rgba(255, 255, 255, 0.045);
  --grid-strong: rgba(255, 255, 255, 0.08);
  --shadow: 0 24px 70px -20px rgba(0, 0, 0, 0.75);
  --ring: rgba(124, 92, 255, 0.45);
  color-scheme: dark;
}

:root[data-theme='light'] {
  --bg: #fbfbfe;
  --bg-soft: #f4f4f9;
  --surface: #ffffff;
  --surface-2: #f5f5fa;
  --surface-solid: #ffffff;
  --border: rgba(10, 10, 18, 0.09);
  --border-strong: rgba(10, 10, 18, 0.16);
  --fg: #0e0e14;
  --muted: #565664;
  --faint: #8a8a99;
  --accent: #6a45ff;
  --accent-2: #0e93b3;
  --accent-3: #d946a3;
  --grid: rgba(10, 10, 18, 0.045);
  --grid-strong: rgba(10, 10, 18, 0.075);
  --shadow: 0 24px 60px -24px rgba(20, 20, 45, 0.28);
  --ring: rgba(106, 69, 255, 0.4);
  color-scheme: light;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  overflow-x: hidden;
}
a { color: inherit; text-decoration: none; }
img { max-width: 100%; display: block; }
::selection { background: color-mix(in srgb, var(--accent) 40%, transparent); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 8px; }

/* ---------- Ambient background ---------- */
.backdrop { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }
.backdrop::before {
  content: '';
  position: absolute; inset: -2px;
  background-image:
    linear-gradient(to right, var(--grid) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse 110% 70% at 50% -10%, #000 35%, transparent 78%);
  -webkit-mask-image: radial-gradient(ellipse 110% 70% at 50% -10%, #000 35%, transparent 78%);
}
.glow { position: absolute; border-radius: 999px; filter: blur(90px); opacity: 0.55; }
.glow-a { width: 620px; height: 620px; top: -260px; left: -120px; background: radial-gradient(circle, color-mix(in srgb, var(--accent) 55%, transparent), transparent 68%); }
.glow-b { width: 520px; height: 520px; top: -180px; right: -140px; background: radial-gradient(circle, color-mix(in srgb, var(--accent-2) 42%, transparent), transparent 68%); }
.glow-c { width: 700px; height: 700px; top: 620px; left: 50%; transform: translateX(-50%); background: radial-gradient(circle, color-mix(in srgb, var(--accent-3) 26%, transparent), transparent 70%); opacity: 0.32; }

/* ---------- Layout ---------- */
.wrap { width: 100%; max-width: 1140px; margin: 0 auto; padding: 0 22px; }
header.nav { position: sticky; top: 0; z-index: 40; backdrop-filter: blur(14px); background: color-mix(in srgb, var(--bg) 72%, transparent); border-bottom: 1px solid transparent; transition: border-color 0.25s, background 0.25s; }
header.nav.scrolled { border-bottom-color: var(--border); }
.nav-inner { display: flex; align-items: center; justify-content: space-between; height: 64px; gap: 16px; }
.brand { display: flex; align-items: center; gap: 10px; font-weight: 700; letter-spacing: -0.02em; }
.logo { width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; color: #fff; background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent-2) 80%, var(--accent))); box-shadow: 0 8px 24px -8px var(--accent); }
.brand .word { font-size: 17px; }
.brand .tag { font-size: 11px; color: var(--faint); font-weight: 500; margin-left: -2px; }
nav.links { display: none; align-items: center; gap: 4px; }
nav.links a { padding: 8px 12px; border-radius: 9px; font-size: 14px; color: var(--muted); transition: color 0.15s, background 0.15s; }
nav.links a:hover { color: var(--fg); background: var(--surface-2); }
.nav-actions { display: flex; align-items: center; gap: 8px; }

/* ---------- Buttons ---------- */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 42px; padding: 0 18px; border-radius: 11px; font-size: 14px; font-weight: 600; border: 1px solid var(--border); background: var(--surface-2); color: var(--fg); cursor: pointer; transition: transform 0.12s, background 0.18s, border-color 0.18s, opacity 0.18s; white-space: nowrap; }
.btn:hover { border-color: var(--border-strong); }
.btn:active { transform: translateY(1px); }
.btn-primary { background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent-2) 62%, var(--accent))); border-color: transparent; color: #fff; box-shadow: 0 14px 34px -14px var(--accent); }
.btn-primary:hover { filter: brightness(1.07); }
.btn-ghost { background: transparent; border-color: transparent; color: var(--muted); }
.btn-ghost:hover { background: var(--surface-2); color: var(--fg); }
.btn-icon { width: 42px; padding: 0; }
.btn svg { width: 18px; height: 18px; }
.btn-sm { height: 36px; padding: 0 14px; font-size: 13px; border-radius: 10px; }

/* ---------- Hero ---------- */
.hero { padding: 84px 0 30px; position: relative; }
.eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px 6px 8px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); font-size: 12.5px; color: var(--muted); margin-bottom: 26px; }
.eyebrow .dot { width: 18px; height: 18px; border-radius: 999px; display: grid; place-items: center; background: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--accent); }
.eyebrow .dot svg { width: 11px; height: 11px; }
h1.title { margin: 0; font-size: clamp(40px, 8vw, 78px); line-height: 0.98; letter-spacing: -0.04em; font-weight: 800; max-width: 16ch; }
h1.title .grad { background: linear-gradient(100deg, var(--accent) 10%, var(--accent-2) 55%, var(--accent-3) 95%); -webkit-background-clip: text; background-clip: text; color: transparent; }
.lede { margin: 22px 0 0; max-width: 56ch; font-size: clamp(16px, 2.1vw, 19px); line-height: 1.6; color: var(--muted); }

/* ---------- Shortener card ---------- */
.shorten { margin-top: 36px; max-width: 720px; border-radius: 20px; border: 1px solid var(--border); background: var(--surface); backdrop-filter: blur(12px); box-shadow: var(--shadow); padding: 14px; }
.shorten-row { display: flex; gap: 10px; flex-wrap: wrap; }
.shorten-input { flex: 1 1 280px; min-width: 0; display: flex; align-items: center; gap: 10px; height: 52px; padding: 0 14px; border-radius: 13px; border: 1px solid var(--border); background: var(--bg-soft); transition: border-color 0.18s, box-shadow 0.18s; }
.shorten-input:focus-within { border-color: color-mix(in srgb, var(--accent) 60%, var(--border)); box-shadow: 0 0 0 4px var(--ring); }
.shorten-input svg { width: 18px; height: 18px; color: var(--faint); flex: none; }
.shorten-input input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--fg); font-size: 15.5px; font-family: inherit; }
.shorten-input input::placeholder { color: var(--faint); }
.shorten .btn { height: 52px; border-radius: 13px; padding: 0 24px; flex: 0 0 auto; }
.shorten-hint { margin: 10px 4px 2px; font-size: 12.5px; color: var(--faint); display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.shorten-hint svg { width: 14px; height: 14px; }
.result { margin-top: 12px; display: none; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 13px; border: 1px solid color-mix(in srgb, var(--accent) 40%, var(--border)); background: color-mix(in srgb, var(--accent) 10%, transparent); }
.result.show { display: flex; }
.result a { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 15px; color: var(--fg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.result .copy { margin-left: auto; }
.auth-error { margin: 16px 0 0; max-width: 720px; padding: 11px 14px; border-radius: 12px; border: 1px solid color-mix(in srgb, var(--accent-3) 40%, var(--border)); background: color-mix(in srgb, var(--accent-3) 12%, transparent); color: var(--fg); font-size: 13.5px; }

/* ---------- Sections ---------- */
section { padding: 76px 0; }
.sec-head { max-width: 640px; margin-bottom: 44px; }
.sec-head h2 { margin: 0; font-size: clamp(27px, 4vw, 40px); letter-spacing: -0.03em; font-weight: 750; }
.sec-head p { margin: 14px 0 0; color: var(--muted); font-size: 16.5px; line-height: 1.6; }
.kicker { font-size: 12.5px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); margin-bottom: 12px; }

.cards { display: grid; grid-template-columns: 1fr; gap: 16px; }
.card { position: relative; padding: 24px; border-radius: 18px; border: 1px solid var(--border); background: var(--surface); overflow: hidden; transition: border-color 0.2s, transform 0.2s; }
.card:hover { border-color: var(--border-strong); transform: translateY(-2px); }
.card::after { content: ''; position: absolute; inset: 0; background: radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 55%); opacity: 0; transition: opacity 0.25s; }
.card:hover::after { opacity: 1; }
.card .ico { position: relative; z-index: 1; width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; border: 1px solid var(--border); background: var(--surface-2); color: var(--accent); margin-bottom: 16px; }
.card .ico svg { width: 20px; height: 20px; }
.card h3 { position: relative; z-index: 1; margin: 0 0 8px; font-size: 16.5px; letter-spacing: -0.01em; }
.card p { position: relative; z-index: 1; margin: 0; color: var(--muted); font-size: 14.5px; line-height: 1.6; }

.steps { display: grid; grid-template-columns: 1fr; gap: 20px; counter-reset: step; }
.step { position: relative; padding: 26px 24px 24px; border-radius: 18px; border: 1px solid var(--border); background: var(--surface); }
.step .n { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; font-weight: 700; font-size: 15px; color: #fff; background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent-2) 70%, var(--accent))); margin-bottom: 16px; }
.step h3 { margin: 0 0 8px; font-size: 16.5px; }
.step p { margin: 0; color: var(--muted); font-size: 14.5px; line-height: 1.6; }

.stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 8px; }
.stat { padding: 22px; border-radius: 18px; border: 1px solid var(--border); background: var(--surface); }
.stat .v { font-size: clamp(26px, 5vw, 38px); font-weight: 800; letter-spacing: -0.03em; }
.stat .v .u { background: linear-gradient(100deg, var(--accent), var(--accent-2)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.stat .l { margin-top: 6px; color: var(--muted); font-size: 13.5px; }

/* ---------- Code block ---------- */
.code-wrap { border-radius: 18px; border: 1px solid var(--border); background: var(--surface-solid); overflow: hidden; box-shadow: var(--shadow); }
.code-top { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--border); background: var(--surface); }
.code-top .b { width: 11px; height: 11px; border-radius: 999px; background: var(--border-strong); }
.code-top .name { margin-left: 8px; font-size: 12.5px; color: var(--faint); font-family: 'JetBrains Mono', monospace; }
.code-top .copy { margin-left: auto; }
pre.code { margin: 0; padding: 20px; overflow-x: auto; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 13.5px; line-height: 1.75; color: var(--muted); }
pre.code .k { color: var(--accent-2); }
pre.code .s { color: var(--accent-3); }
pre.code .c { color: var(--faint); }
pre.code .f { color: var(--fg); }

/* ---------- Split feature ---------- */
.split { display: grid; grid-template-columns: 1fr; gap: 36px; align-items: center; }
.split .prose h2 { margin: 0 0 14px; font-size: clamp(26px, 4vw, 38px); letter-spacing: -0.03em; }
.split .prose p { margin: 0 0 18px; color: var(--muted); font-size: 16px; line-height: 1.65; }
.checks { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
.checks li { display: flex; gap: 11px; align-items: flex-start; color: var(--fg); font-size: 14.5px; }
.checks .tick { flex: none; width: 21px; height: 21px; border-radius: 999px; display: grid; place-items: center; background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--accent); margin-top: 1px; }
.checks .tick svg { width: 12px; height: 12px; }

/* ---------- CTA band ---------- */
.cta { position: relative; border-radius: 26px; border: 1px solid var(--border); background: linear-gradient(150deg, color-mix(in srgb, var(--accent) 18%, var(--surface)), var(--surface) 55%); padding: 54px 28px; text-align: center; overflow: hidden; }
.cta::before { content: ''; position: absolute; inset: 0; background-image: linear-gradient(to right, var(--grid-strong) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-strong) 1px, transparent 1px); background-size: 44px 44px; mask-image: radial-gradient(ellipse 70% 90% at 50% 50%, #000, transparent 75%); -webkit-mask-image: radial-gradient(ellipse 70% 90% at 50% 50%, #000, transparent 75%); opacity: 0.7; }
.cta > * { position: relative; z-index: 1; }
.cta h2 { margin: 0 auto 14px; max-width: 20ch; font-size: clamp(28px, 5vw, 44px); letter-spacing: -0.035em; }
.cta p { margin: 0 auto 28px; max-width: 48ch; color: var(--muted); font-size: 16.5px; line-height: 1.6; }
.cta .row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

/* ---------- Footer ---------- */
footer { border-top: 1px solid var(--border); padding: 44px 0 60px; margin-top: 40px; }
.foot { display: flex; flex-direction: column; gap: 22px; }
.foot .brand .tag { display: block; }
.foot p { margin: 0; color: var(--faint); font-size: 13px; }
.foot-links { display: flex; gap: 20px; flex-wrap: wrap; }
.foot-links a { color: var(--muted); font-size: 13.5px; }
.foot-links a:hover { color: var(--fg); }

/* ---------- Avatar ---------- */
.avatar { width: 30px; height: 30px; border-radius: 999px; border: 1px solid var(--border); object-fit: cover; }

@media (min-width: 720px) {
  .cards { grid-template-columns: repeat(2, 1fr); }
  .steps { grid-template-columns: repeat(3, 1fr); }
  .stats { grid-template-columns: repeat(4, 1fr); }
  .split { grid-template-columns: repeat(2, 1fr); gap: 56px; }
  .cta { padding: 70px 40px; }
}
@media (min-width: 980px) {
  nav.links { display: flex; }
  .hero { padding: 110px 0 40px; }
}
:root[data-theme='dark'] .hide-light { display: none; }
:root[data-theme='light'] .hide-dark { display: none; }
@media (max-width: 560px) {
  .hide-sm { display: none !important; }
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  * { transition: none !important; animation: none !important; }
}
`;
