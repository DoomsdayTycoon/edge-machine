// ─────────────────────────────────────────────────────────────────────────────
// EDGE MACHINE — Epicbet content script
// Runs on epicbet.com · Intercepts API calls + DOM scrapes bet data + balance
// Stores result in chrome.storage.local → picked up by content_edgemachine.js
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = '__epicbet_sync__';

// ── 1. INJECT FETCH/XHR INTERCEPTOR INTO PAGE CONTEXT ───────────────────────
// Content scripts run in an isolated world; to intercept window.fetch we must
// inject a <script> tag directly into the page.

const interceptor = document.createElement('script');
interceptor.textContent = `(function() {
  const _fetch = window.fetch;
  window.fetch = function(...args) {
    const url = (typeof args[0] === 'string' ? args[0] : args[0]?.url) || '';
    const prom = _fetch.apply(this, args);
    const interesting = ['/bets', '/account', '/history', '/balance', '/tickets', '/wagers'];
    if (interesting.some(p => url.includes(p))) {
      prom.then(r => r.clone().json().then(data => {
        window.dispatchEvent(new CustomEvent('__epicbet_api__', { detail: { url, data } }));
      }).catch(() => {})).catch(() => {});
    }
    return prom;
  };

  const _open = XMLHttpRequest.prototype.open;
  const _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url) {
    this.__url__ = url;
    return _open.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function() {
    const interesting = ['/bets', '/account', '/history', '/balance', '/tickets', '/wagers'];
    if (interesting.some(p => (this.__url__||'').includes(p))) {
      this.addEventListener('load', () => {
        try {
          const data = JSON.parse(this.responseText);
          window.dispatchEvent(new CustomEvent('__epicbet_api__', { detail: { url: this.__url__, data } }));
        } catch(e) {}
      });
    }
    return _send.apply(this, arguments);
  };
})();`;
(document.head || document.documentElement).appendChild(interceptor);
interceptor.remove();

// ── 2. LISTEN FOR INTERCEPTED API DATA ──────────────────────────────────────

window.addEventListener('__epicbet_api__', (e) => {
  const { url, data } = e.detail;
  try {
    let parsed = null;
    if (url.includes('balance') || url.includes('account')) {
      parsed = tryParseBalance(data);
    }
    if (url.includes('bets') || url.includes('tickets') || url.includes('wagers') || url.includes('history')) {
      parsed = tryParseBets(data);
    }
    if (parsed) mergeAndSave(parsed);
  } catch(e) {}
});

// ── 3. DOM SCRAPER (fallback + supplements API data) ────────────────────────

function scrapeDOM() {
  const result = {};

  // --- Balance ---
  // Look for elements containing a € symbol followed by a number
  const allText = document.querySelectorAll('*');
  for (const el of allText) {
    if (el.children.length > 3) continue; // skip containers
    const txt = el.innerText?.trim() || '';
    const m = txt.match(/^[€$£]?\s*([\d,]+\.?\d*)\s*[€$£]?$/);
    if (m && parseFloat(m[1].replace(',','')) > 0 && parseFloat(m[1].replace(',','')) < 100000) {
      // Check if parent/sibling contains "balance" text
      const parent = el.closest('[class*="balance"], [class*="wallet"], [class*="amount"], [class*="funds"]');
      if (parent) {
        result.balance = parseFloat(m[1].replace(',',''));
        break;
      }
    }
  }

  // --- Open bets from DOM ---
  const openBets = [];

  // Try to find bet ticket cards — look for elements containing "ID:" or bet slip patterns
  const betContainers = [
    ...document.querySelectorAll('[class*="ticket"], [class*="bet-item"], [class*="betslip-item"], [class*="coupon"]'),
    ...document.querySelectorAll('[class*="Ticket"], [class*="BetItem"], [class*="Betslip"]'),
  ];

  // Also try finding by text pattern "ID: \d+"
  const idMatches = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (/^ID:\s*\d+/.test(node.textContent?.trim())) {
      idMatches.push(node.parentElement);
    }
  }

  const candidates = [...new Set([...betContainers, ...idMatches.map(el => el?.closest('[class]')).filter(Boolean)])];

  for (const card of candidates) {
    try {
      const text = card.innerText || '';
      if (!text) continue;

      // Extract ID
      const idMatch = text.match(/ID:\s*(\d+)/);
      const id = idMatch ? idMatch[1] : null;

      // Extract status
      let status = 'pending';
      if (/won|win|success/i.test(text)) status = 'won';
      else if (/lost|lose|lose/i.test(text)) status = 'lost';
      else if (/void|refund/i.test(text)) status = 'void';
      else if (/cashout/i.test(text)) status = 'cashout';

      // Extract type (combo or single)
      const comboMatch = text.match(/combo\s*(\d+)?/i);
      const type = comboMatch ? 'combo' : 'single';
      const legs = comboMatch && comboMatch[1] ? parseInt(comboMatch[1]) : 1;

      // Extract stake and payout
      const numbers = [...text.matchAll(/([\d,]+\.?\d{0,2})/g)].map(m => parseFloat(m[1].replace(',','')));
      const odds = numbers.find(n => n >= 1.01 && n <= 100);
      const stake = numbers.find(n => n >= 0.5 && n <= 10000 && n !== odds);
      const payout = numbers.find(n => n > (stake||0) && n !== odds && n !== stake);

      // Extract selections (look for "Money Line" or odds patterns)
      const selections = parseSelectionsFromText(text);

      if (id || (stake && odds)) {
        openBets.push({ id, type, legs, status, stake, totalOdds: odds, potentialPayout: payout, selections, scraped: Date.now() });
      }
    } catch(e) {}
  }

  if (openBets.length > 0) result.bets = openBets;
  return result;
}

function parseSelectionsFromText(text) {
  const selections = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Look for market types
    if (/Money Line|Handicap|Over\/Under|Total Games|Set Winner/i.test(line)) {
      const market = line.trim();
      // Player/pick is usually the line before
      const player = i > 0 ? lines[i-1] : '';
      // Match is usually the line after
      const match = lines[i+1] || '';
      // Date is the line after that
      const datetime = lines[i+2] || '';

      // Look for odds on nearby lines
      const oddsLine = lines.slice(Math.max(0,i-2), i+4).find(l => /^\d\.\d{2}$/.test(l.trim()));
      const odds = oddsLine ? parseFloat(oddsLine) : null;

      if (player) {
        selections.push({ player, market, match, datetime, odds, status: 'pending' });
      }
    }
    i++;
  }
  return selections;
}

// ── 4. PARSE API RESPONSES ───────────────────────────────────────────────────

function tryParseBalance(data) {
  // Common API response shapes for balance
  const balance =
    data?.balance ??
    data?.wallet?.balance ??
    data?.account?.balance ??
    data?.data?.balance ??
    data?.result?.balance ??
    null;

  if (balance !== null && !isNaN(parseFloat(balance))) {
    return { balance: parseFloat(balance) };
  }
  return null;
}

function tryParseBets(data) {
  // Try multiple common shapes
  const rawList =
    data?.bets ??
    data?.tickets ??
    data?.wagers ??
    data?.items ??
    data?.data?.bets ??
    data?.data?.tickets ??
    data?.data?.items ??
    (Array.isArray(data) ? data : null);

  if (!rawList || !Array.isArray(rawList)) return null;

  const bets = rawList.map(raw => {
    const status = normalizeStatus(raw.status ?? raw.state ?? raw.result ?? '');
    const type = (raw.type ?? raw.betType ?? (raw.selections?.length > 1 ? 'combo' : 'single'))?.toLowerCase();
    const selections = (raw.selections ?? raw.legs ?? raw.events ?? []).map(sel => ({
      player: sel.selection ?? sel.pick ?? sel.outcome ?? sel.player ?? '',
      market: sel.market ?? sel.marketName ?? sel.type ?? '',
      match: sel.event ?? sel.match ?? sel.game ?? '',
      datetime: sel.startTime ?? sel.kickoff ?? sel.date ?? '',
      odds: parseFloat(sel.odds ?? sel.price ?? 0),
      status: normalizeStatus(sel.status ?? sel.result ?? 'pending'),
    }));

    return {
      id: String(raw.id ?? raw.ticketId ?? raw.betId ?? ''),
      type: type?.includes('combo') || type?.includes('multi') || (selections.length > 1) ? 'combo' : 'single',
      legs: selections.length || 1,
      status,
      stake: parseFloat(raw.stake ?? raw.amount ?? raw.wagered ?? 0),
      totalOdds: parseFloat(raw.totalOdds ?? raw.odds ?? raw.price ?? 0),
      potentialPayout: parseFloat(raw.potentialPayout ?? raw.possibleWin ?? raw.payout ?? 0),
      actualPayout: parseFloat(raw.payout ?? raw.winnings ?? raw.profit ?? 0),
      isBonus: !!(raw.isBonus ?? raw.bonusFunds ?? raw.bonus),
      placedAt: raw.createdAt ?? raw.placedAt ?? raw.date ?? '',
      settledAt: raw.settledAt ?? raw.resultedAt ?? '',
      selections,
    };
  });

  const openBets = bets.filter(b => b.status === 'pending');
  const settledBets = bets.filter(b => b.status !== 'pending');

  return { openBets, settledBets };
}

function normalizeStatus(s) {
  const str = String(s).toLowerCase();
  if (str.includes('win') || str.includes('won') || str.includes('success')) return 'won';
  if (str.includes('los') || str.includes('fail')) return 'lost';
  if (str.includes('void') || str.includes('refund') || str.includes('cancel')) return 'void';
  if (str.includes('cash')) return 'cashout';
  return 'pending';
}

// ── 5. MERGE AND SAVE TO CHROME STORAGE ─────────────────────────────────────

function mergeAndSave(newData) {
  chrome.storage.local.get([STORAGE_KEY], (stored) => {
    const existing = stored[STORAGE_KEY] || {};
    const merged = {
      ...existing,
      ...newData,
      lastSync: Date.now(),
      source: 'epicbet.com',
    };
    // Merge bets arrays without duplicates
    if (newData.openBets) {
      const ids = new Set((newData.openBets).map(b => b.id));
      const prev = (existing.openBets || []).filter(b => !ids.has(b.id));
      merged.openBets = [...newData.openBets, ...prev];
    }
    if (newData.settledBets) {
      const ids = new Set((newData.settledBets).map(b => b.id));
      const prev = (existing.settledBets || []).filter(b => !ids.has(b.id));
      merged.settledBets = [...newData.settledBets, ...prev];
    }
    chrome.storage.local.set({ [STORAGE_KEY]: merged });
    showSyncToast('✓ Edge Machine synced');
  });
}

// ── 6. SYNC TOAST INDICATOR ──────────────────────────────────────────────────

function showSyncToast(msg) {
  let toast = document.getElementById('__em_toast__');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = '__em_toast__';
    Object.assign(toast.style, {
      position: 'fixed', bottom: '20px', right: '20px', zIndex: '999999',
      background: '#0c1018', border: '1px solid #00e87b40', borderRadius: '8px',
      padding: '8px 14px', fontFamily: 'monospace', fontSize: '12px',
      color: '#00e87b', pointerEvents: 'none', transition: 'opacity .4s',
      boxShadow: '0 4px 20px rgba(0,0,0,.5)',
    });
    document.body.appendChild(toast);
  }
  toast.textContent = '◆ EDGE MACHINE  ' + msg;
  toast.style.opacity = '1';
  clearTimeout(toast.__timer__);
  toast.__timer__ = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

// ── 7. RUN DOM SCRAPER ON NAVIGATION / LOAD ─────────────────────────────────

function runScrape() {
  const dom = scrapeDOM();
  if (dom.balance !== undefined || (dom.bets && dom.bets.length > 0)) {
    mergeAndSave(dom);
  }
}

// Run on initial load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runScrape);
} else {
  runScrape();
}

// Watch for SPA navigation (Epicbet is a React/Vue SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(runScrape, 1500); // wait for new page to render
  }
}).observe(document.body || document.documentElement, { childList: true, subtree: true });

// Re-scrape every 30s while on the page
setInterval(runScrape, 30000);
