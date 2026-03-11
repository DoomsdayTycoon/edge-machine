// EDGE MACHINE — Epicbet content script (ISOLATED world)
// interceptor.js (MAIN world) handles fetch/XHR interception
// This script: receives API events, scrapes DOM balance, saves to chrome.storage

const STORAGE_KEY = '__epicbet_sync__';

// ── 1. RECEIVE API DATA FROM MAIN WORLD INTERCEPTOR ──────────────────────────

window.addEventListener('__epicbet_api__', (e) => {
  const { data } = e.detail;
  try {
    const bal = tryParseBalance(data);
    if (bal) { mergeAndSave(bal); return; }

    const bets = tryParseBets(data);
    if (bets && (bets.openBets.length > 0 || bets.settledBets.length > 0)) {
      mergeAndSave(bets);
    }
  } catch (err) {}
});

// ── 2. DOM SCRAPER — TreeWalker on text nodes, no class-name dependency ───────

function scrapeDOM() {
  const result = {};
  if (!document.body) return result;

  // Walk every TEXT NODE in the top 300px of the viewport
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const el = node.parentElement;
        if (!el) return NodeFilter.FILTER_REJECT;
        const s = window.getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') {
          return NodeFilter.FILTER_REJECT;
        }
        try {
          const rect = el.getBoundingClientRect();
          if (rect.top > 300 || rect.top < 0 || rect.width < 5) return NodeFilter.FILTER_REJECT;
        } catch (e) { return NodeFilter.FILTER_REJECT; }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let node;
  while ((node = walker.nextNode())) {
    const txt = node.textContent.trim();
    if (!txt || txt.length > 25) continue;

    // €234.50 | 234.50€ | € 234.50 | 234,50€ | €1,234.50
    const m = txt.match(/^€\s*([\d\s,]+(?:[.,]\d{1,2})?)\s*$/) ||
              txt.match(/^([\d\s,]+(?:[.,]\d{1,2})?)\s*€\s*$/);
    if (m) {
      const raw = (m[1] || m[2]).replace(/\s/g, '').replace(',', '.');
      const val = parseFloat(raw);
      if (!isNaN(val) && val >= 0 && val < 500000) {
        result.balance = val;
        break;
      }
    }
  }
  return result;
}

// ── 3. PARSE BALANCE FROM ANY API RESPONSE ───────────────────────────────────

function tryParseBalance(data) {
  if (!data || typeof data !== 'object') return null;

  function search(obj, depth) {
    if (depth > 6 || !obj || typeof obj !== 'object') return null;
    for (const k of Object.keys(obj)) {
      const kl = k.toLowerCase();
      if (['balance', 'amount', 'wallet', 'available', 'availablebalance',
           'real_balance', 'cash', 'funds', 'credit', 'cashbalance',
           'realbalance', 'bonusbalance'].includes(kl)) {
        const v = parseFloat(obj[k]);
        if (!isNaN(v) && v >= 0 && v < 500000) return v;
      }
    }
    for (const val of Object.values(obj)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const found = search(val, depth + 1);
        if (found !== null) return found;
      }
    }
    return null;
  }

  const bal = search(data, 0);
  return bal !== null ? { balance: bal } : null;
}

// ── 4. PARSE BETS FROM ANY API RESPONSE ──────────────────────────────────────

function tryParseBets(data) {
  if (!data || typeof data !== 'object') return null;

  function findArray(obj, depth) {
    if (depth > 5) return null;
    if (Array.isArray(obj) && obj.length > 0) {
      const first = obj[0];
      if (first && typeof first === 'object') {
        const combined = Object.keys(first).join(' ').toLowerCase();
        if (/odd|stake|amount|status|bet|ticket|wager|selection|coupon/.test(combined)) {
          return obj;
        }
      }
    }
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      for (const val of Object.values(obj)) {
        const found = findArray(val, depth + 1);
        if (found) return found;
      }
    }
    return null;
  }

  const rawList = findArray(data, 0);
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

    return {
      id:              String(raw.id ?? raw.ticketId ?? raw.betId ?? raw.couponId ?? raw.ref ?? ''),
      type:            selections.length > 1 ? 'combo' : 'single',
      legs:            selections.length || 1,
      status,
      stake:           parseFloat(raw.stake ?? raw.amount ?? raw.wagered ?? raw.betAmount ?? raw.totalStake ?? 0),
      totalOdds:       parseFloat(raw.totalOdds ?? raw.odds ?? raw.price ?? raw.coefficient ?? raw.coef ?? 0),
      potentialPayout: parseFloat(raw.potentialPayout ?? raw.possibleWin ?? raw.maxPayout ?? raw.winAmount ?? 0),
      actualPayout:    parseFloat(raw.payout ?? raw.winnings ?? raw.profit ?? raw.actualWin ?? 0),
      isBonus:         !!(raw.isBonus ?? raw.bonusFunds ?? raw.bonus ?? raw.freebet ?? raw.freeBet),
      placedAt:        raw.createdAt ?? raw.placedAt ?? raw.date ?? raw.placedDate ?? '',
      settledAt:       raw.settledAt ?? raw.resultedAt ?? raw.resultDate ?? '',
      selections,
    };
  }).filter(b => b.stake > 0 || b.totalOdds > 0);

  return {
    openBets:    bets.filter(b => b.status === 'pending'),
    settledBets: bets.filter(b => b.status !== 'pending'),
  };
}

function normalizeStatus(s) {
  const str = String(s).toLowerCase();
  if (/win|won|success/.test(str)) return 'won';
  if (/los|fail/.test(str)) return 'lost';
  if (/void|refund|cancel/.test(str)) return 'void';
  if (/cash/.test(str)) return 'cashout';
  return 'pending';
}

// ── 5. MERGE AND SAVE ────────────────────────────────────────────────────────

function mergeAndSave(newData) {
  chrome.storage.local.get([STORAGE_KEY], (stored) => {
    const existing = stored[STORAGE_KEY] || {};
    const merged = { ...existing, ...newData, lastSync: Date.now() };

    if (newData.openBets) {
      const ids = new Set(newData.openBets.map(b => b.id));
      merged.openBets = [
        ...newData.openBets,
        ...(existing.openBets || []).filter(b => !ids.has(b.id)),
      ];
    }
    if (newData.settledBets) {
      const ids = new Set(newData.settledBets.map(b => b.id));
      merged.settledBets = [
        ...newData.settledBets,
        ...(existing.settledBets || []).filter(b => !ids.has(b.id)),
      ];
    }

    chrome.storage.local.set({ [STORAGE_KEY]: merged });
    const label = newData.balance != null
      ? `✓ Balance: €${newData.balance.toFixed(2)}`
      : `✓ ${(newData.openBets?.length || 0) + (newData.settledBets?.length || 0)} bets synced`;
    showToast(label);
  });
}

// ── 6. TOAST ─────────────────────────────────────────────────────────────────

function showToast(msg) {
  let t = document.getElementById('__em_toast__');
  if (!t) {
    t = document.createElement('div');
    t.id = '__em_toast__';
    Object.assign(t.style, {
      position: 'fixed', bottom: '20px', right: '20px', zIndex: '2147483647',
      background: '#0c1018', border: '1px solid #00e87b50', borderRadius: '8px',
      padding: '8px 16px', fontFamily: 'monospace', fontSize: '12px',
      color: '#00e87b', pointerEvents: 'none', transition: 'opacity 0.4s',
      boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
    });
    document.body.appendChild(t);
  }
  t.textContent = '◆ EDGE MACHINE  ' + msg;
  t.style.opacity = '1';
  clearTimeout(t.__timer__);
  t.__timer__ = setTimeout(() => { t.style.opacity = '0'; }, 5000);
}

// ── 7. RUN + SPA POLLING ─────────────────────────────────────────────────────

function runScrape() {
  const dom = scrapeDOM();
  if (dom.balance !== undefined) mergeAndSave(dom);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runScrape);
} else {
  runScrape();
}

// Re-scrape on SPA navigation
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(runScrape, 1500);
  }
}).observe(document.documentElement, { childList: true, subtree: true });

// Poll every 10s as fallback
setInterval(runScrape, 10000);
