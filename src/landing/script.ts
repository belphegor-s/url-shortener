/** Landing page script. Served separately (not inline) so the strict CSP stays
 *  `script-src 'self'` with no nonce/unsafe-inline. Runs early to set the theme
 *  before first paint, then wires up interactions on DOMContentLoaded. */
export const script = String.raw`
(function () {
  var KEY = 'shrt-theme';
  var root = document.documentElement;
  function apply(t) { root.setAttribute('data-theme', t); }
  try {
    var stored = localStorage.getItem(KEY);
    if (stored === 'light' || stored === 'dark') apply(stored);
    else apply(window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  } catch (e) {
    apply(window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.getElementById('theme-toggle');
    if (toggle) toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
    });

    var nav = document.getElementById('nav');
    if (nav) {
      var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    // Copy buttons (static data-copy + the dynamic result button).
    document.addEventListener('click', function (ev) {
      var btn = ev.target.closest ? ev.target.closest('[data-copy]') : null;
      if (!btn) return;
      var value = btn.getAttribute('data-copy');
      if (!value) return;
      var done = function () {
        var prev = btn.innerHTML;
        btn.innerHTML = 'Copied';
        setTimeout(function () { btn.innerHTML = prev; }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value).then(done, function(){});
      else {
        var ta = document.createElement('textarea');
        ta.value = value; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });

    var form = document.getElementById('shorten');
    if (!form) return;
    var authed = document.body.getAttribute('data-authed') === 'true';
    var csrf = document.body.getAttribute('data-csrf') || '';
    var input = document.getElementById('url');
    var btn = form.querySelector('button[type="submit"]');
    var result = document.getElementById('result');
    var resultLink = document.getElementById('result-link');
    var copyBtn = document.getElementById('copy-btn');
    var formError = document.getElementById('form-error');

    function showError(msg) {
      if (!formError) return;
      formError.textContent = msg;
      formError.hidden = false;
    }
    function hideError() { if (formError) formError.hidden = true; }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var url = (input.value || '').trim();
      if (!url) { input.focus(); return; }
      hideError();

      if (!authed) {
        var next = '/links?new=' + encodeURIComponent(url);
        window.location.href = '/auth/github?next=' + encodeURIComponent(next);
        return;
      }

      var label = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = 'Shortening…';
      fetch('/api/links', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json', 'x-csrf-token': csrf },
        body: JSON.stringify({ url: url })
      })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || 'Could not shorten that URL'); return d; }); })
        .then(function (d) {
          resultLink.href = d.short_url;
          resultLink.textContent = d.short_url;
          if (copyBtn) copyBtn.setAttribute('data-copy', d.short_url);
          result.classList.add('show');
          input.value = '';
        })
        .catch(function (err) { showError(err.message || 'Something went wrong'); })
        .then(function () { btn.disabled = false; btn.innerHTML = label; });
    });
  });
})();
`;
