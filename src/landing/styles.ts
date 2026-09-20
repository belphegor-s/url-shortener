/** Inline stylesheet for the server-rendered public site (landing + API reference).
 *  Dependency-free by design: no build step, no runtime CSS, first paint is the page.
 *
 *  Token names mirror shadcn/ui so the vocabulary is familiar: a neutral zinc scale,
 *  a monochrome primary, one radius, and a light/dark pair driven by `data-theme`
 *  on <html> (set before first paint by /landing.js). */
export const styles = /* css */ `
:root {
  --background: #ffffff;
  --foreground: #09090b;
  --card: #ffffff;
  --card-muted: #fafafa;
  --primary: #18181b;
  --primary-foreground: #fafafa;
  --secondary: #f4f4f5;
  --secondary-foreground: #18181b;
  --muted: #f4f4f5;
  --muted-foreground: #71717a;
  --subtle-foreground: #a1a1aa;
  --destructive: #dc2626;
  --destructive-surface: #fef2f2;
  --success: #16a34a;
  --border: #e4e4e7;
  --border-strong: #d4d4d8;
  --ring: #18181b;
  --grid: rgba(9, 9, 11, 0.05);
  --shadow-sm: 0 1px 2px 0 rgba(9, 9, 11, 0.06);
  --shadow-md: 0 4px 14px -4px rgba(9, 9, 11, 0.1), 0 2px 4px -2px rgba(9, 9, 11, 0.05);
  --shadow-lg: 0 24px 50px -16px rgba(9, 9, 11, 0.16);
  --radius: 0.625rem;
  color-scheme: light;
}

:root[data-theme="dark"] {
  --background: #09090b;
  --foreground: #fafafa;
  --card: #0f0f11;
  --card-muted: #131316;
  --primary: #fafafa;
  --primary-foreground: #18181b;
  --secondary: #1c1c1f;
  --secondary-foreground: #fafafa;
  --muted: #18181b;
  --muted-foreground: #a1a1aa;
  --subtle-foreground: #71717a;
  --destructive: #f87171;
  --destructive-surface: rgba(248, 113, 113, 0.1);
  --success: #4ade80;
  --border: #26262a;
  --border-strong: #3a3a40;
  --ring: #d4d4d8;
  --grid: rgba(250, 250, 250, 0.045);
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 14px -4px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 24px 50px -16px rgba(0, 0, 0, 0.6);
  color-scheme: dark;
}

/* ---------------------------------------------------------------- base --- */

*, *::before, *::after { box-sizing: border-box; }
* { border-color: var(--border); }

html {
  -webkit-text-size-adjust: 100%;
  scroll-behavior: smooth;
  scroll-padding-top: 6rem;
}

body {
  margin: 0;
  background: var(--background);
  color: var(--foreground);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  font-size: 1rem;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  overflow-x: hidden;
}

h1, h2, h3, h4 { margin: 0; font-weight: 600; letter-spacing: -0.02em; line-height: 1.2; }
p { margin: 0; }
a { color: inherit; text-decoration: none; }
img, svg { display: block; max-width: 100%; }
code, pre, kbd { font-family: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace; }
input, button, select, textarea { font: inherit; color: inherit; }
button:not(:disabled), [role="button"], summary { cursor: pointer; }
hr { border: 0; border-top: 1px solid var(--border); margin: 0; }

::selection { background: color-mix(in srgb, var(--foreground) 16%, transparent); }

:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  border-radius: calc(var(--radius) - 2px);
}

* { scrollbar-width: thin; scrollbar-color: var(--border-strong) transparent; }
*::-webkit-scrollbar { width: 10px; height: 10px; }
*::-webkit-scrollbar-thumb { background: var(--border-strong); border: 3px solid transparent; border-radius: 9999px; background-clip: content-box; }

.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}

/* ------------------------------------------------------------- layout --- */

.container { width: 100%; max-width: 1120px; margin-inline: auto; padding-inline: 1rem; }
.section { padding-block: 4rem; }

/* Faint graph-paper grid, faded out toward the bottom of the viewport. */
.grid-bg {
  position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background-image:
    linear-gradient(to right, var(--grid) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid) 1px, transparent 1px);
  background-size: 3.5rem 3.5rem;
  mask-image: radial-gradient(ellipse 100% 60% at 50% 0%, #000 10%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 100% 60% at 50% 0%, #000 10%, transparent 75%);
}

/* ------------------------------------------------------------ buttons --- */

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  height: 2.5rem; padding-inline: 1rem;
  border: 1px solid transparent; border-radius: var(--radius);
  background: var(--secondary); color: var(--secondary-foreground);
  font-size: 0.875rem; font-weight: 500; white-space: nowrap;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
}
.btn:disabled { opacity: 0.5; pointer-events: none; }
.btn svg { width: 1rem; height: 1rem; flex: none; }

.btn-primary { background: var(--primary); color: var(--primary-foreground); box-shadow: var(--shadow-sm); }
.btn-primary:hover { background: color-mix(in srgb, var(--primary) 88%, var(--background)); }

.btn-secondary:hover { background: color-mix(in srgb, var(--secondary) 70%, var(--border)); }

.btn-outline { background: var(--background); border-color: var(--border); color: var(--foreground); box-shadow: var(--shadow-sm); }
.btn-outline:hover { background: var(--muted); border-color: var(--border-strong); }

.btn-ghost { background: transparent; color: var(--muted-foreground); }
.btn-ghost:hover { background: var(--muted); color: var(--foreground); }

.btn-sm { height: 2.25rem; padding-inline: 0.75rem; font-size: 0.8125rem; }
.btn-lg { height: 2.75rem; padding-inline: 1.375rem; font-size: 0.9375rem; }
.btn-icon { width: 2.25rem; height: 2.25rem; padding: 0; }

/* --------------------------------------------------------------- bits --- */

.badge {
  display: inline-flex; align-items: center; gap: 0.4375rem;
  height: 1.625rem; padding-inline: 0.6875rem;
  border: 1px solid var(--border); border-radius: 9999px;
  background: var(--card); color: var(--muted-foreground);
  font-size: 0.75rem; font-weight: 500;
}
.badge svg { width: 0.75rem; height: 0.75rem; }
.badge .pulse {
  width: 0.375rem; height: 0.375rem; border-radius: 9999px; flex: none;
  background: var(--success); box-shadow: 0 0 0 0.1875rem color-mix(in srgb, var(--success) 22%, transparent);
}

.card {
  border: 1px solid var(--border); border-radius: calc(var(--radius) + 0.25rem);
  background: var(--card);
}

.eyebrow {
  font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--muted-foreground);
}

.lead { color: var(--muted-foreground); font-size: 1.0625rem; line-height: 1.65; }

.avatar {
  width: 1.75rem; height: 1.75rem; border-radius: 9999px;
  border: 1px solid var(--border); object-fit: cover;
}

.mark {
  display: grid; place-items: center; flex: none;
  border-radius: 0.5rem; color: #ffffff;
  background: linear-gradient(135deg, #7c5cff, #34d3ee);
  box-shadow: var(--shadow-sm);
}

/* ------------------------------------------------------------- header --- */

.site-header {
  position: sticky; top: 0; z-index: 50;
  background: color-mix(in srgb, var(--background) 82%, transparent);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s ease;
}
.site-header.is-scrolled { border-bottom-color: var(--border); }
.header-inner { display: flex; align-items: center; gap: 1rem; height: 3.5rem; }

.brand { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; letter-spacing: -0.02em; }
.brand .name { font-size: 0.9375rem; }

.nav-desktop { display: none; align-items: center; gap: 0.25rem; margin-left: 0.5rem; }
.nav-desktop a {
  padding: 0.375rem 0.625rem; border-radius: 0.5rem;
  font-size: 0.875rem; color: var(--muted-foreground);
  transition: color 0.15s ease, background-color 0.15s ease;
}
.nav-desktop a:hover { color: var(--foreground); background: var(--muted); }

.header-actions { display: flex; align-items: center; gap: 0.375rem; margin-left: auto; }
.nav-auth { display: none; align-items: center; gap: 0.5rem; }

.menu-btn {
  display: inline-grid; place-items: center;
  width: 2.25rem; height: 2.25rem; padding: 0;
  border: 1px solid var(--border); border-radius: var(--radius);
  background: var(--background); color: var(--foreground);
}
.menu-btn svg { width: 1.0625rem; height: 1.0625rem; }

.mobile-menu {
  display: none; padding: 0.5rem 1rem 1rem;
  border-top: 1px solid var(--border); background: var(--background);
}
.mobile-menu.is-open { display: block; }
.mobile-menu nav { display: grid; gap: 0.125rem; padding-block: 0.5rem; }
.mobile-menu nav a {
  padding: 0.625rem 0.5rem; border-radius: 0.5rem;
  font-size: 0.9375rem; color: var(--muted-foreground);
}
.mobile-menu nav a:hover { background: var(--muted); color: var(--foreground); }
.mobile-menu .actions { display: grid; gap: 0.5rem; padding-top: 0.75rem; border-top: 1px solid var(--border); }
.mobile-menu .actions .btn { width: 100%; height: 2.625rem; }

/* --------------------------------------------------------------- hero --- */

.hero { padding-block: 3.5rem 2.5rem; }
.hero h1 {
  margin-top: 1.25rem;
  font-size: clamp(2.25rem, 8vw, 4rem);
  line-height: 1.04; letter-spacing: -0.045em; font-weight: 600;
  max-width: 15ch;
}
.hero h1 .dim { color: var(--muted-foreground); }
.hero .lead { margin-top: 1.25rem; max-width: 52ch; }

/* ------------------------------------------------------- shorten form --- */

.shorten { margin-top: 2.25rem; max-width: 40rem; }
.shorten-row { display: grid; gap: 0.5rem; }
.field {
  display: flex; align-items: center; gap: 0.625rem;
  height: 2.75rem; padding-inline: 0.75rem;
  border: 1px solid var(--border); border-radius: var(--radius);
  background: var(--card); box-shadow: var(--shadow-sm);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.field:focus-within { border-color: var(--border-strong); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 14%, transparent); }
.field > svg { width: 1rem; height: 1rem; color: var(--subtle-foreground); flex: none; }
.field input {
  flex: 1; min-width: 0; height: 100%;
  border: 0; outline: 0; background: transparent;
  /* 16px keeps iOS Safari from auto-zooming the field on focus. */
  font-size: 1rem;
}
.field input::placeholder { color: var(--subtle-foreground); }
.shorten .btn-primary { height: 2.75rem; }
.shorten-hint {
  display: flex; align-items: center; gap: 0.4375rem; flex-wrap: wrap;
  margin-top: 0.75rem; font-size: 0.8125rem; color: var(--muted-foreground);
}
.shorten-hint svg { width: 0.875rem; height: 0.875rem; flex: none; }

.result {
  display: none; align-items: center; gap: 0.625rem;
  margin-top: 0.75rem; padding: 0.625rem 0.625rem 0.625rem 0.875rem;
  border: 1px solid var(--border); border-radius: var(--radius);
  background: var(--card-muted);
}
.result.is-visible { display: flex; }
.result a {
  flex: 1; min-width: 0; font-size: 0.875rem; font-weight: 500;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.result a:hover { text-decoration: underline; }

.alert {
  margin-top: 1rem; max-width: 40rem; padding: 0.75rem 0.875rem;
  border: 1px solid color-mix(in srgb, var(--destructive) 35%, var(--border));
  border-radius: var(--radius); background: var(--destructive-surface);
  font-size: 0.875rem; color: var(--destructive);
}
.alert[hidden] { display: none; }

/* ----------------------------------------------------------- sections --- */

.section-head { max-width: 40rem; margin-bottom: 2.5rem; }
.section-head h2 { margin-top: 0.75rem; font-size: clamp(1.625rem, 4vw, 2.25rem); letter-spacing: -0.035em; }
.section-head p { margin-top: 0.875rem; color: var(--muted-foreground); font-size: 1rem; line-height: 1.65; }

.grid-2 { display: grid; gap: 1rem; grid-template-columns: minmax(0, 1fr); }
.grid-3 { display: grid; gap: 1rem; grid-template-columns: minmax(0, 1fr); }
.grid-4 { display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }

.feature { padding: 1.375rem; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
.feature:hover { border-color: var(--border-strong); box-shadow: var(--shadow-md); }
.feature .icon {
  display: grid; place-items: center; width: 2.25rem; height: 2.25rem;
  border: 1px solid var(--border); border-radius: 0.5rem;
  background: var(--muted); color: var(--foreground); margin-bottom: 0.875rem;
}
.feature .icon svg { width: 1.0625rem; height: 1.0625rem; }
.feature h3 { font-size: 0.9375rem; }
.feature p { margin-top: 0.4375rem; color: var(--muted-foreground); font-size: 0.875rem; line-height: 1.6; }
.feature code {
  padding: 0.0625rem 0.3125rem; border-radius: 0.3125rem;
  background: var(--muted); font-size: 0.8125rem; color: var(--foreground);
}

.step { padding: 1.375rem; }
.step .n {
  display: grid; place-items: center; width: 1.75rem; height: 1.75rem;
  border: 1px solid var(--border); border-radius: 9999px;
  background: var(--background); font-size: 0.8125rem; font-weight: 600;
  font-variant-numeric: tabular-nums; margin-bottom: 0.875rem;
}
.step h3 { font-size: 0.9375rem; }
.step p { margin-top: 0.4375rem; color: var(--muted-foreground); font-size: 0.875rem; line-height: 1.6; }

.stat { padding: 1.25rem 1.375rem; }
.stat .v { font-size: clamp(1.5rem, 4vw, 1.875rem); font-weight: 600; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
.stat .l { margin-top: 0.25rem; color: var(--muted-foreground); font-size: 0.8125rem; line-height: 1.5; }

.checks { list-style: none; padding: 0; margin: 1.5rem 0 0; display: grid; gap: 0.75rem; }
.checks li { display: flex; gap: 0.625rem; align-items: flex-start; font-size: 0.9375rem; }
.checks .tick {
  display: grid; place-items: center; flex: none;
  width: 1.125rem; height: 1.125rem; margin-top: 0.1875rem; border-radius: 9999px;
  background: color-mix(in srgb, var(--success) 15%, transparent); color: var(--success);
}
.checks .tick svg { width: 0.6875rem; height: 0.6875rem; }

.split { display: grid; gap: 2rem; align-items: center; grid-template-columns: minmax(0, 1fr); }

/* ---------------------------------------------------------- code card --- */

.code-card { overflow: hidden; box-shadow: var(--shadow-md); }
.code-head {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0.5rem 0.5rem 0.875rem;
  border-bottom: 1px solid var(--border); background: var(--card-muted);
}
.code-head .name { font-size: 0.75rem; color: var(--muted-foreground); }
.code-head .btn { margin-left: auto; }
pre.code {
  margin: 0; padding: 1.125rem; overflow-x: auto;
  font-size: 0.8125rem; line-height: 1.7; color: var(--muted-foreground);
  -webkit-overflow-scrolling: touch;
}
pre.code .cm { color: var(--subtle-foreground); }
pre.code .fn { color: var(--foreground); font-weight: 500; }
pre.code .st { color: var(--success); }
pre.code .ky { color: var(--foreground); }

/* ---------------------------------------------------------------- cta --- */

.cta { position: relative; overflow: hidden; padding: 3rem 1.5rem; text-align: center; background: var(--card-muted); }
.cta h2 { margin-inline: auto; max-width: 18ch; font-size: clamp(1.625rem, 4.5vw, 2.25rem); letter-spacing: -0.035em; }
.cta p { margin: 0.875rem auto 0; max-width: 46ch; color: var(--muted-foreground); }
.cta .row { display: flex; flex-wrap: wrap; gap: 0.625rem; justify-content: center; margin-top: 1.75rem; }

/* ------------------------------------------------------------- footer --- */

.site-footer { border-top: 1px solid var(--border); margin-top: 2rem; }
.footer-top { display: grid; gap: 2rem; padding-block: 3rem 2rem; }
.footer-top .blurb { margin-top: 0.875rem; max-width: 30ch; color: var(--muted-foreground); font-size: 0.875rem; }
.footer-cols { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2rem 1rem; }
.footer-col h4 { margin-bottom: 0.75rem; font-size: 0.8125rem; font-weight: 600; }
.footer-col a { display: block; padding-block: 0.3125rem; color: var(--muted-foreground); font-size: 0.875rem; }
.footer-col a:hover { color: var(--foreground); }
.footer-bottom {
  display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; justify-content: space-between;
  padding-block: 1.25rem; border-top: 1px solid var(--border);
  color: var(--muted-foreground); font-size: 0.8125rem;
}

/* ------------------------------------------------------- theme toggle --- */

:root[data-theme="dark"] .on-light { display: none; }
:root[data-theme="light"] .on-dark { display: none; }

/* -------------------------------------------------------- breakpoints --- */

@media (min-width: 640px) {
  .container { padding-inline: 1.5rem; }
  .shorten-row { grid-template-columns: 1fr auto; }
  .grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .grid-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .footer-cols { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .cta { padding: 4rem 2.5rem; }
}

@media (min-width: 768px) {
  .section { padding-block: 5rem; }
  .hero { padding-block: 5rem 3rem; }
  .grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .split { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 3rem; }
  .footer-top { grid-template-columns: 1.1fr 2fr; }
}

@media (min-width: 900px) {
  .nav-desktop { display: flex; }
  .nav-auth { display: flex; }
  .menu-btn { display: none; }
  .mobile-menu { display: none !important; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
`;
