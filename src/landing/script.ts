/** Public-site script. Served as its own asset (not inline) so the strict CSP stays
 *  `script-src 'self'` with no nonce and no unsafe-inline. The theme is applied
 *  synchronously, before first paint; everything else waits for DOMContentLoaded. */
export const script = String.raw`
(function () {
  var KEY = 'shrt-theme';
  var root = document.documentElement;

  function prefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function apply(theme) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#09090b' : '#ffffff');
  }

  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  apply(stored === 'light' || stored === 'dark' ? stored : prefersDark() ? 'dark' : 'light');

  document.addEventListener('DOMContentLoaded', function () {
    // ---- Theme toggle -----------------------------------------------------
    var toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(KEY, next); } catch (e) {}
        var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!document.startViewTransition || reduced) return apply(next);
        // Ripple out from the button; the rings trail the edge by ~150px, so run past the far corner.
        var r = toggle.getBoundingClientRect();
        var x = r.left + r.width / 2, y = r.top + r.height / 2;
        var end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 150;
        root.style.setProperty('--ripple-x', x + 'px');
        root.style.setProperty('--ripple-y', y + 'px');
        root.style.setProperty('--ripple-end', end + 'px');
        root.classList.add('theme-ripple');
        document.startViewTransition(function () { apply(next); }).finished.finally(function () {
          root.classList.remove('theme-ripple');
        });
      });
    }

    // ---- Header hairline on scroll ---------------------------------------
    var header = document.getElementById('site-header');
    if (header) {
      var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 4); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    // ---- Mobile menu ------------------------------------------------------
    var menuBtn = document.getElementById('menu-toggle');
    var menu = document.getElementById('mobile-menu');
    if (menuBtn && menu) {
      var openIcon = menuBtn.querySelector('.menu-open');
      var closeIcon = menuBtn.querySelector('.menu-close');
      var setMenu = function (open) {
        menu.classList.toggle('is-open', open);
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        if (openIcon) openIcon.hidden = open;
        if (closeIcon) closeIcon.hidden = !open;
      };
      menuBtn.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
      menu.addEventListener('click', function (ev) { if (ev.target.closest('a')) setMenu(false); });
      document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') setMenu(false); });
      window.addEventListener('resize', function () { if (window.innerWidth >= 900) setMenu(false); });
    }

    // ---- Copy buttons (static data-copy plus the dynamic result button) ----
    document.addEventListener('click', function (ev) {
      var btn = ev.target.closest ? ev.target.closest('[data-copy]') : null;
      if (!btn) return;
      var value = btn.getAttribute('data-copy');
      if (!value) return;

      var label = btn.querySelector('span');
      var done = function () {
        if (!label) return;
        var prev = label.textContent;
        label.textContent = 'Copied';
        setTimeout(function () { label.textContent = prev; }, 1400);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done, function () {});
        return;
      }
      var ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      document.body.removeChild(ta);
    });

    // ---- Docs: highlight the section currently in view ---------------------
    var docsLinks = [].slice.call(document.querySelectorAll('[data-docs-link]'));
    if (docsLinks.length && 'IntersectionObserver' in window) {
      var byId = {};
      docsLinks.forEach(function (a) { byId[a.getAttribute('data-docs-link')] = a; });
      var setActive = function (id) {
        docsLinks.forEach(function (a) { a.classList.toggle('is-active', a === byId[id]); });
      };
      var observer = new IntersectionObserver(
        function (entries) {
          var visible = entries.filter(function (e) { return e.isIntersecting; });
          if (visible.length) setActive(visible[0].target.id);
        },
        { rootMargin: '-25% 0px -65% 0px', threshold: 0 }
      );
      Object.keys(byId).forEach(function (id) {
        var el = document.getElementById(id);
        if (el) observer.observe(el);
      });
      setActive(docsLinks[0].getAttribute('data-docs-link'));
    }

    // ---- Inline shortener --------------------------------------------------
    var form = document.getElementById('shorten');
    if (!form) return;

    var authed = document.body.getAttribute('data-authed') === 'true';
    var csrf = document.body.getAttribute('data-csrf') || '';
    var input = document.getElementById('url');
    var submit = form.querySelector('button[type="submit"]');
    var result = document.getElementById('result');
    var resultLink = document.getElementById('result-link');
    var copyBtn = document.getElementById('copy-btn');
    var formError = document.getElementById('form-error');

    function showError(message) {
      if (!formError) return;
      formError.textContent = message;
      formError.hidden = false;
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var url = (input.value || '').trim();
      if (!url) { input.focus(); return; }
      if (formError) formError.hidden = true;

      // Signed out: bounce through GitHub and come back with the URL prefilled.
      if (!authed) {
        var next = '/?new=' + encodeURIComponent(url);
        window.location.href = '/auth/github?next=' + encodeURIComponent(next);
        return;
      }

      var label = submit.innerHTML;
      submit.disabled = true;
      submit.textContent = 'Shortening';

      fetch('/api/links', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json', 'x-csrf-token': csrf },
        body: JSON.stringify({ url: url })
      })
        .then(function (r) {
          return r.json().then(function (d) {
            if (!r.ok) throw new Error(d.error || 'Could not shorten that URL');
            return d;
          });
        })
        .then(function (d) {
          resultLink.href = d.short_url;
          resultLink.textContent = d.short_url;
          if (copyBtn) copyBtn.setAttribute('data-copy', d.short_url);
          result.classList.add('is-visible');
          input.value = '';
        })
        .catch(function (err) { showError(err.message || 'Something went wrong'); })
        .then(function () { submit.disabled = false; submit.innerHTML = label; });
    });

    // Prefill and submit a URL carried back from the sign-in round trip.
    var pending = new URLSearchParams(window.location.search).get('new');
    if (pending && authed) {
      input.value = pending;
      history.replaceState(null, '', window.location.pathname);
      form.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  });
})();
`;
