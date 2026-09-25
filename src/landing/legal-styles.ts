/** Page-specific CSS for the privacy policy and terms. Appended after the docs stylesheet,
 *  whose sidebar layout and scroll-spy these pages share. */
export const legalStyles = /* css */ `
.legal-main { gap: 0; }

/* ---------------------------------------------------------------- hero --- */

.legal-hero { padding-bottom: 2.5rem; }
.legal-hero h1 { margin-top: 1.5rem; }
.legal-hero .lead { margin-top: 0.875rem; max-width: 62ch; }
.legal-hero .lead strong { color: var(--foreground); font-weight: 500; }

/* Segmented switch between the two documents. */
.legal-tabs {
  display: inline-flex; gap: 0.125rem; padding: 0.1875rem;
  border: 1px solid var(--border); border-radius: 9999px; background: var(--card-muted);
}
.legal-tabs a {
  position: relative; display: block; padding: 0.25rem 0.875rem; border-radius: 9999px;
  font-size: 0.8125rem; font-weight: 500; color: var(--muted-foreground);
  transition: color 0.15s ease;
}
.legal-tabs a:hover, .legal-tabs a[aria-current="page"] { color: var(--foreground); }
.legal-tabs a > span:not(.legal-tab-pill) { position: relative; z-index: 1; }

/* The active pill is its own element so the view transition can slide it between
   tabs. Labels are named too, which keeps them painted above the moving pill. */
.legal-tab-pill {
  position: absolute; inset: 0; z-index: 0;
  border: 1px solid var(--border); border-radius: 9999px;
  background: var(--card); box-shadow: var(--shadow-sm);
  view-transition-name: legal-pill;
}
.legal-tab-privacy { view-transition-name: legal-tab-privacy; }
.legal-tab-terms { view-transition-name: legal-tab-terms; }

.legal-meta {
  display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.75rem;
  margin-top: 1.25rem !important; font-size: 0.8125rem; color: var(--subtle-foreground) !important;
}
.legal-meta time { color: var(--muted-foreground); }
.legal-dot { width: 3px; height: 3px; border-radius: 9999px; background: currentColor; }

/* Summary cells, dashed like the docs cards. */
.legal-glance {
  display: grid; grid-template-columns: minmax(0, 1fr); margin-top: 2rem;
  border: 1px dashed var(--border-strong); border-radius: var(--radius); overflow: hidden;
}
.legal-glance > div { padding: 1.25rem; transition: background-color 0.15s ease; }
.legal-glance > div:hover { background: var(--card-muted); }
.legal-glance > div + div { border-top: 1px dashed var(--border); }
.legal-glance .icon {
  display: grid; place-items: center; width: 2rem; height: 2rem; margin-bottom: 0.875rem;
  border: 1px solid var(--border); border-radius: 0.5rem; background: var(--card); color: var(--foreground);
  box-shadow: var(--shadow-sm);
}
.legal-glance h3 { font-size: 0.875rem; }
.legal-glance p { margin-top: 0.375rem !important; font-size: 0.8125rem; line-height: 1.6; }

/* ------------------------------------------------------------ sections --- */

.legal-section { padding-block: 2.25rem; border-top: 1px dashed var(--border); }
.legal-section h2 { display: flex; align-items: baseline; gap: 0.75rem; }
.legal-section p { max-width: 68ch; }
.legal-section a:not(.btn), .legal-end a:not(.btn) {
  color: var(--foreground); text-decoration: underline;
  text-decoration-color: var(--border-strong); text-underline-offset: 3px;
  transition: text-decoration-color 0.15s ease;
}
.legal-section a:not(.btn):hover { text-decoration-color: currentColor; }
.legal-section strong { color: var(--foreground); font-weight: 500; }
.legal-section p + .legal-list, .legal-section .legal-list + p,
.legal-section .table-wrap + p, .legal-section .table-wrap + .legal-note { margin-top: 1rem; }

.legal-num {
  flex: none; font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 0.75rem; font-weight: 400; letter-spacing: 0; color: var(--subtle-foreground);
}
.docs-nav .legal-num { display: none; }

.legal-list { display: grid; gap: 0.5rem; margin: 1rem 0 0; padding: 0; list-style: none; }
.legal-list li { position: relative; padding-left: 1.25rem; color: var(--muted-foreground); line-height: 1.7; max-width: 68ch; }
.legal-list li::before {
  content: ""; position: absolute; left: 0.125rem; top: 0.8125em;
  width: 0.5rem; height: 1px; background: var(--subtle-foreground);
}

.legal-table table { min-width: 34rem; }
.legal-table tbody td:first-child { font-family: inherit; font-weight: 500; }
.legal-table tbody tr { transition: background-color 0.15s ease; }
.legal-table tbody tr:hover { background: var(--card-muted); }

.legal-note {
  display: flex; gap: 0.75rem; align-items: flex-start; margin-top: 1rem;
  padding: 0.875rem 1rem; border: 1px dashed var(--border-strong); border-radius: var(--radius);
  background: var(--card-muted);
}
.legal-note-icon { flex: none; margin-top: 0.1875rem; color: var(--muted-foreground); }
.legal-note p { font-size: 0.875rem; }

/* ----------------------------------------------------------------- end --- */

.legal-end {
  display: grid; gap: 1.25rem; align-items: center; margin-top: 0.5rem;
  padding: 1.5rem; border: 1px solid var(--border); border-radius: calc(var(--radius) + 0.25rem);
  background:
    radial-gradient(120% 140% at 100% 0%, color-mix(in srgb, var(--foreground) 4%, transparent), transparent 60%),
    var(--card);
}
.legal-end h2 { font-size: 1.0625rem; }
.legal-end p { margin-top: 0.375rem !important; font-size: 0.875rem; }
.legal-end-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }

/* ---------------------------------------------------- page transition --- */

/* Cross-document view transition between /privacy and /terms. Only these two pages
   opt in, so every other navigation stays instant. Unsupported browsers just navigate. */
@view-transition { navigation: auto; }

.legal { view-transition-name: legal-page; }

::view-transition-group(legal-pill) { animation-duration: 0.4s; animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1); }
::view-transition-old(legal-pill) { display: none; }
::view-transition-new(legal-pill) { animation: none; width: 100%; height: 100%; }

::view-transition-group(legal-tab-privacy),
::view-transition-group(legal-tab-terms) { animation-duration: 0.25s; }

::view-transition-group(legal-page) { animation-duration: 0.3s; }
::view-transition-old(legal-page) { animation: 0.14s ease-in both legal-out; }
::view-transition-new(legal-page) { animation: 0.32s cubic-bezier(0.22, 1, 0.36, 1) 0.06s both legal-in; }

/* Header, rails and footer are identical on both pages: keep them still. */
::view-transition-old(root), ::view-transition-new(root) { animation: none; }
::view-transition-old(root) { display: none; }

@keyframes legal-out { to { opacity: 0; } }
@keyframes legal-in { from { opacity: 0; transform: translateY(6px); } }

@media (prefers-reduced-motion: reduce) {
  @view-transition { navigation: none; }
}

@media (min-width: 640px) {
  .legal-end { grid-template-columns: minmax(0, 1fr) auto; padding: 1.5rem 1.75rem; }
}

@media (min-width: 768px) {
  .legal-glance { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .legal-glance > div + div { border-top: 0; border-left: 1px dashed var(--border); }
}

@media (min-width: 900px) {
  .docs-nav .legal-num { display: inline; margin-right: 0.625rem; }
  .legal-hero { padding-top: 0.25rem; }
}

@media print {
  .site-header, .site-footer, .docs-nav, .legal-tabs, .legal-end-actions { display: none !important; }
  .docs { display: block; padding: 0; }
  .container { border: 0; }
}
`;
