// ─────────────────────────────────────────────────────────────────────────────
// EDGE MACHINE — Epicbet content script v2
// Runs on epicbet.com · Intercepts ALL JSON API calls + DOM scrapes balance
// Stores result in chrome.storage.local → picked up by content_edgemachine.js
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = '__epicbet_sync__';

// ── 1. INJECT FETCH/XHR INTERCEPTOR — captures ALL JSON responses ────────────

const interceptor = document.createElement('script');
interceptor.textContent = `(function() {
  const _fetch = window.fetch;
  window.fetch = function(...args) {
    const url = (typeof args[0] === 'string' ? args[0] : args[0]?.url) || '';
    const prom = _fetch.apply(this, args);
    // Skip static assets
    if (/\\.(png|jpg|jpeg|gif|webp|svg|css|js|woff2?|ttf|ico|map)(\\?|$)/i.test(url)) return prom;
    prom.then(r => {
      const ct = r.headers.get('content-type') || '';
      if (ct.includes('json')) {
        r.clone().json().then(data => {
          window.dispatchEvent(new CustomEvent('__epicbet_api__', { detail: { url, data } }));
        }).catch(()=>{});
      }
    }).catch(()=>{});
    return prom;
  };

  const _open = XMLHttpRequest.prototype.open;
  const _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(m, url) {
    this.__url__ = url;
    return _open.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function() {
    this.addEventListener('load', () => {
      try {
        const ct = this.getResponseHeader('content-type') || '';
        if (!ct.includes('json')) return;
        const data = typeof this.response === 'object' && this.response !== null
          ? this.response : JSON.parse(this.responseText);
        window.dispatchEvent(new CustomEvent('__epicbet_api__', { detail: { url: this.__url__, data } }));
      } catch(e) {}
    });
    return _send.apply(this, arguments);
  };
})();`;
(document.head || document.documentElement).appendChild(interceptor);
interceptor.remove();

// ── 2. LISTEN FOR ALL INTERCEPTED API DATA ───────────────────────────────────

window.addEventListener('__epicbet_api__', (e) => {
  const { url, data } = e.detail;
  try {
    // Try balance first
    const bal = tryParseBalance(data);
    if (bal) { mergeAndSave(bal); return; }
    // Try bets — only save if there's actual data
    const bets = tryParseBets(data);
    if (bets && (bets.openBets.length > 0 || bets.settledBets.length > 0)) {
      mergeAndSave(bets);
    }
  } catch(e) {}
});

// ── 3. DOM SCRAPER — finds balance by position, not class names ──────────────

function scrapeDOM() {
  const result = {};

  // Strategy: find euro amounts (€xxx.xx) in the top 250px of the viewport
  // Balance is always visible in header/nav area on betting sites
  const allEls = document.querySelectorAll('*');
  for (const el of allEls) {
    if (el.children.length > 3) continue; // skip containers
    let rect;
    try { rect = el.getBoundingClientRect(); } catch(e) { continue; }
    if (rect.top > 250 || rect.top < 0 || rect.width < 10) continue;

    const txt = (el.innerText || el.textContent || '').trim();
    if (!txt || txt.length > 20) continue;

    // Match: €234.50  or  234.50€  or  €234  or  €1,234.50
    const m = txt.match(/^€\s*([\d,]+(?:\.\d{1,2})?)\s*$/) ||
              txt.match(/^([\d,]+(?:\.\d{1,2})?)\s*€\s*$/);
    if (m) {
      const val = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(val) && val >= 0 && val < 500000) {
        result.balance = val;
        break;
      }
    }
  }

  return result;
}

// ── 4. PARSE API RESPONSES ───────────────────────────────────────────────────

function tryParseBalance(data) {
  if (!data || typeof data !== 'object') return null;

  // Recursively search the response object for a balance field
  function findBalance(obj, depth) {
    if (depth > 5 || !obj || typeof obj !== 'object') return null;
    const keys = ['balance', 'Balance', 'amount', 'Amount', 'wallet', 'available',
                  'availableBalance', 'real_balance', 'cash', 'funds', 'credit'];
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null) {
        const v = parseFloat(obj[k]);
        if (!isNaN(v) && v >= 0 && v < 500000) return v;
      }
    }
    // Search nested objects
    for (const val of Object.values(obj)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const found = findBalance(val, depth + 1);
        if (found !== null) return found;
      }
    }
    return null;
  }

  const bal = findBalance(data, 0);
  if (bal !== null) return { balance: bal };
  return null;
}

function tryParseBets(data) {
  if (!data || typeof data !== 'object') return null;

  // Find an array of bets anywhere in the response
  function findBetArray(obj, depth) {
    if (depth > 4) return null;
    if (Array.isArray(obj) && obj.length > 0) {
      // Check if items look like bets (have odds, stake, or status)
      const first = obj[0];
      if (first && typeof first === 'object') {
        const keys = Object.keys(first).join(' ').toLowerCase();
        if (keys.match(/odd|stake|amount|status|bet|ticket|wager|selection/)) {
          return obj;
        }
      }
    }
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      for (const val of Object.values(obj)) {
        const found = findBetArray(val, depth + 1);
        if (found) return found;
      }
    }
    return null;
  }

  const rawList = findBetArray(data, 0);
  if (!rawList) return null;

  const bets = rawList.map(raw => {
    const status = normalizeStatus(raw.status ?? raw.state ?? raw.result ?? raw.outcome ?? '');
    const selRaw = raw.selections ?? raw.legs ?? raw.events ?? raw.picks ?? raw.items ?? [];
    const selections = (Array.isArray(selRaw) ? selRaw : []).map(sel => ({
      player:   sel.selection ?? sel.pick ?? sel.outcome ?? sel.participant ?? sel.name ?? sel.player ?? '',
      market:   sel.market ?? sel.marketName ?? sel.marketType ?? sel.type ?? sel.betType ?? '',
      match:    sel.event ?? sel.match ?? sel.fixture ?? sel.game ?? sel.eventName ?? '',
      datetime: sel.startTime ?? sel.kickoff ?? sel.date ?? sel.startDate ?? '',
      odds:     parseFloat(sel.odds ?? sel.price ?? sel.coefficient ?? sel.coef ?? 0),
      status:   normalizeStatus(sel.status ?? sel.result ?? 'pending'),
    }));

    const stake = parseFloat(raw.stake ?? raw.amount ?? raw.wagered ?? raw.betAmount ?? raw.totalStake ?? 0);
    const odds  = parseFloat(raw.totalOdds ?? raw.odds ?? raw.price ?? raw.coefficient ?? raw.coef ?? 0);
    const payout= parseFloat(raw.potentialPayout ?? raw.possibleWin ?? raw.maxPayout ?? raw.possibleWinnings ?? raw.winAmount ?? 0);
    const actual= parseFloat(raw.payout ?? raw.winnings ?? raw.profit ?? raw.actualWin ?? 0);

    return {
      id:             String(raw.id ?? raw.ticketId ?? raw.betId ?? raw.couponId ?? raw.ref ?? ''),
      type:           (selections.length > 1 || String(raw.type ?? '').match(/combo|multi|parlay|acca/i)) ? 'combo' : 'single',
      legs:           selections.length || 1,
      status,
      stake,
      totalOdds:      odds,
      potentialPayout: payout,
      actualPayout:   actual,
      isBonus:        !!(raw.isBonus ?? raw.bonusFunds ?? raw.bonus ?? raw.freebet ?? raw.freeBet),
      placedAt:       raw.createdAt ?? raw.placedAt ?? raw.date ?? raw.placedDate ?? '',
      settledAt:      raw.settledAt ?? raw.resultedAt ?? raw.resultDate ?? '',
      selections,
    };
  }).filter(b => b.stake > 0 || b.totalOdds > 0);

  const openBets    = bets.filter(b => b.status === 'pending');
  const settledBets = bets.filter(b => b.status !== 'pending');
  return { openBets, settledBets };
}

function normalizeStatus(s) {
  const str = String(s).toLowerCase();
  if (str.match(/win|won|success/)) return 'won';
  if (str.match(/los|fail/)) return 'lost';
  if (str.match(/void|refund|cancel/)) return 'void';
  if (str.match(/cash/)) return 'cashout';
  return 'pending';
}

// ── 5. MERGE AND SAVE TO CHROME STORAGE ─────────────────────────────────────

function mergeAndSave(newData) {
  chrome.storage.local.get([STORAGE_KEY], (stored) => {
    const existing = stored[STORAGE_KEY] || {};
    const merged = { ...existing, ...newData, lastSync: Date.now(), source: 'epicbet.com' };
    if (newData.openBets) {
      const ids = new Set(newData.openBets.map(b => b.id));
      merged.openBets = [...newData.openBets, ...(existing.openBets||[]).filter(b => !ids.has(b.id))];
    }
    if (newData.settledBets) {
      const ids = new Set(newData.settledBets.map(b => b.id));
      merged.settledBets = [...newData.settledBets, ...(existing.settledBets||[]).filter(b => !ids.has(b.id))];
    }
    chrome.storage.local.set({ [STORAGE_KEY]: merged });
    showSyncToast(newData.balance != null
      ? `✓ Balance: €${newData.balance.toFixed(2)}`
      : `✓ Bets synced`);
  });
}

// ── 6. SYNC TOAST ────────────────────────────────────────────────────────────

function showSyncToast(msg) {
  let t = document.getElementById('__em_toast__');
  if (!t) {
    t = document.createElement('div');
    t.id = '__em_toast__';
    Object.assign(t.style, {
      position:'fixed', bottom:'20px', right:'20px', zIndex:'999999',
      background:'#0c1018', border:'1px solid #00e87b40', borderRadius:'8px',
      padding:'8px 14px', fontFamily:'monospace', fontSize:'12px',
      color:'#00e87b', pointerEvents:'none', transition:'opacity .4s',
      boxShadow:'0 4px 20px rgba(0,0,0,.5)',
    });
    document.body.appendChild(t);
  }
  t.textContent = '◆ EDGE MACHINE  ' + msg;
  t.style.opacity = '1';
  clearTimeout(t.__timer__);
  t.__timer__ = setTimeout(() => { t.style.opacity = '0'; }, 4000);
}

// ── 7. RUN ON LOAD + SPA NAVIGATION ─────────────────────────────────────────

function runScrape() {
  const dom = scrapeDOM();
  if (dom.balance !== undefined) mergeAndSave(dom);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runScrape);
} else {
  runScrape();
}

let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(runScrape, 1500);
  }
}).observe(document.body || document.documentElement, { childList: true, subtree: true });

setInterval(runScrape, 15000);
