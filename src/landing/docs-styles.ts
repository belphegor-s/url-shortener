/** Page-specific CSS for the API reference. Appended after the shared stylesheet. */
export const docsStyles = /* css */ `
.docs { display: grid; gap: 2rem; padding-block: 2rem 4rem; grid-template-columns: minmax(0, 1fr); align-items: start; }

/* Two summary cells under the intro heading, dashed like the rest of the grid. */
.docs-cards {
  display: grid; grid-template-columns: minmax(0, 1fr);
  border: 1px dashed var(--border-strong); border-radius: var(--radius); overflow: hidden;
}
.docs-cards > * { padding: 1.25rem; }
.docs-cards > * + * { border-top: 1px dashed var(--border); }

/* Sidebar collapses into a sticky, horizontally scrollable chip rail on small screens. */
.docs-nav {
  position: sticky; top: 3.5rem; z-index: 30; min-width: 0;
  margin-inline: -1rem; padding: 0.625rem 1rem;
  background: color-mix(in srgb, var(--background) 92%, transparent);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}
.docs-nav h4 { display: none; }
.docs-nav ul { display: flex; gap: 0.375rem; list-style: none; margin: 0; padding: 0; overflow-x: auto; scrollbar-width: none; }
.docs-nav ul::-webkit-scrollbar { display: none; }
.docs-nav a {
  display: block; white-space: nowrap;
  padding: 0.3125rem 0.625rem; border-radius: 9999px;
  border: 1px solid var(--border); background: var(--card);
  font-size: 0.8125rem; color: var(--muted-foreground);
}
.docs-nav a.is-active { background: var(--primary); border-color: var(--primary); color: var(--primary-foreground); }

.docs-main { min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 2.5rem; }
.docs-main section { scroll-margin-top: 8.5rem; }
.docs-main h1 { font-size: clamp(1.875rem, 5vw, 2.5rem); letter-spacing: -0.04em; }
.docs-main h2 { font-size: 1.375rem; letter-spacing: -0.03em; }
.docs-main h3 { font-size: 0.9375rem; }
.docs-main p { color: var(--muted-foreground); line-height: 1.7; }
.docs-main h1 + p, .docs-main h2 + p, .docs-main h3 + p { margin-top: 0.625rem; }
.docs-main p + p, .docs-main p + .card, .docs-main p + .table-wrap, .docs-main p + .code-card { margin-top: 1rem; }
.docs-main code:not(pre code) {
  padding: 0.0625rem 0.3125rem; border: 1px solid var(--border); border-radius: 0.3125rem;
  background: var(--muted); font-size: 0.8125rem; color: var(--foreground); overflow-wrap: anywhere;
}
.docs-main ul:not(.reset) { margin: 1rem 0 0; padding-left: 1.125rem; color: var(--muted-foreground); line-height: 1.8; }

/* ------------------------------------------------------------ endpoint --- */

.endpoint { overflow: hidden; }
.endpoint + .endpoint { margin-top: 1rem; }
.endpoint-head {
  display: flex; align-items: center; gap: 0.625rem; flex-wrap: wrap;
  padding: 0.875rem 1rem; border-bottom: 1px solid var(--border); background: var(--card-muted);
}
.method {
  flex: none; padding: 0.125rem 0.5rem; border-radius: 0.375rem;
  border: 1px solid transparent; font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.04em;
  font-family: "JetBrains Mono", ui-monospace, monospace;
}
.method-get { background: color-mix(in srgb, #2563eb 12%, transparent); color: #2563eb; border-color: color-mix(in srgb, #2563eb 28%, transparent); }
.method-post { background: color-mix(in srgb, var(--success) 14%, transparent); color: var(--success); border-color: color-mix(in srgb, var(--success) 30%, transparent); }
.method-delete { background: color-mix(in srgb, var(--destructive) 12%, transparent); color: var(--destructive); border-color: color-mix(in srgb, var(--destructive) 28%, transparent); }
:root[data-theme="dark"] .method-get { color: #60a5fa; border-color: color-mix(in srgb, #60a5fa 30%, transparent); background: color-mix(in srgb, #60a5fa 12%, transparent); }
.endpoint-head .path { font-size: 0.875rem; font-weight: 500; word-break: break-all; }
.endpoint-head .auth { margin-left: auto; font-size: 0.75rem; color: var(--muted-foreground); }
.endpoint-body { padding: 1rem; display: grid; grid-template-columns: minmax(0, 1fr); gap: 1rem; }
.endpoint-body > p { font-size: 0.9375rem; }
.endpoint-body h3 { font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted-foreground); }

/* --------------------------------------------------------------- table --- */

.table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius); -webkit-overflow-scrolling: touch; }
table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; min-width: 30rem; }
thead th {
  text-align: left; padding: 0.625rem 0.875rem; font-weight: 500;
  color: var(--muted-foreground); background: var(--card-muted); border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
tbody td { padding: 0.625rem 0.875rem; border-top: 1px solid var(--border); vertical-align: top; color: var(--muted-foreground); line-height: 1.6; }
tbody tr:first-child td { border-top: 0; }
tbody td:first-child { color: var(--foreground); font-family: "JetBrains Mono", ui-monospace, monospace; white-space: nowrap; }
td .req { color: var(--destructive); font-size: 0.6875rem; margin-left: 0.25rem; }

@media (min-width: 640px) {
  .docs-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .docs-cards > * + * { border-top: 0; border-left: 1px dashed var(--border); }
}

@media (min-width: 768px) {
  /* Keep the chip rail full-bleed against the wider band padding. */
  .docs-nav { margin-inline: -1.5rem; padding-inline: 1.5rem; }
}

@media (min-width: 900px) {
  .docs { grid-template-columns: 13.75rem minmax(0, 1fr); gap: 3rem; padding-block: 3rem 5rem; }
  .docs-nav {
    position: sticky; top: 5rem; z-index: 1;
    margin-inline: 0; padding: 0 1.5rem 0 0;
    border: 0; border-right: 1px dashed var(--border);
    background: none; backdrop-filter: none; -webkit-backdrop-filter: none;
    max-height: calc(100vh - 7rem); overflow-y: auto;
  }
  .docs-nav h4 { display: block; margin-bottom: 0.625rem; font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted-foreground); }
  .docs-nav ul { display: grid; gap: 0.125rem; overflow: visible; }
  .docs-nav a { border: 0; background: none; border-radius: 0.5rem; padding: 0.375rem 0.625rem; white-space: normal; }
  .docs-nav a:hover { background: var(--muted); color: var(--foreground); }
  .docs-nav a.is-active { background: var(--muted); color: var(--foreground); font-weight: 500; }
  .docs-main section { scroll-margin-top: 6rem; }
}
`;
