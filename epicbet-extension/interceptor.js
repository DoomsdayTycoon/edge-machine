// EDGE MACHINE — Epicbet fetch/XHR interceptor
// Runs in MAIN world (world: "MAIN" in manifest) — no CSP restrictions
// Intercepts ALL JSON API responses and forwards them via CustomEvent
// content_epicbet.js (ISOLATED world) listens and saves to chrome.storage
(function () {
  const _fetch = window.fetch;
  window.fetch = function (...args) {
    const url = (typeof args[0] === 'string' ? args[0] : args[0]?.url) || '';
    const prom = _fetch.apply(this, args);
    if (/\.(png|jpg|jpeg|gif|webp|svg|css|js|woff2?|ttf|ico|map)(\?|$)/i.test(url)) return prom;
    prom.then(r => {
      const ct = r.headers.get('content-type') || '';
      if (ct.includes('json')) {
        r.clone().json().then(data => {
          window.dispatchEvent(new CustomEvent('__epicbet_api__', { detail: { url, data } }));
        }).catch(() => {});
      }
    }).catch(() => {});
    return prom;
  };

  const _open = XMLHttpRequest.prototype.open;
  const _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, url) {
    this.__url__ = url;
    return _open.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    this.addEventListener('load', () => {
      try {
        const ct = this.getResponseHeader('content-type') || '';
        if (!ct.includes('json')) return;
        const data = typeof this.response === 'object' && this.response !== null
          ? this.response
          : JSON.parse(this.responseText);
        window.dispatchEvent(new CustomEvent('__epicbet_api__', { detail: { url: this.__url__, data } }));
      } catch (e) {}
    });
    return _send.apply(this, arguments);
  };
})();
