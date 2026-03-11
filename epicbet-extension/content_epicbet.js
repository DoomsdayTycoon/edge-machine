// EDGE MACHINE — Epicbet content script (ISOLATED world)
// interceptor.js (MAIN world) handles fetch/XHR interception
// This script: receives API events, scrapes DOM balance+bets, saves to chrome.storage

const STORAGE_KEY = '__epicbet_sync__';

// ── 1. RECEIVE API DATA FROM MAIN WORLD INTERCEPTOR ──────────────────────────

window.addEventListener('__epicbet_api__', (e) => {
  const { data } = e.detail;
  try {
    const bal = tryParseBalance(data);
    if (bal) { mergeAndSave(bal); }

    const bets = tryParseBets(data);
    if (bets && (bets.openBets.length > 0 || bets.settledBets.length > 0)) {
      mergeAndSave(bets);
    }
  } catch (err) {}
});

// ── 2. DOM SCRAPER — balance (max of all visible €-values) + bets from slip ──

function scrapeDOM() {
  const result = {};
  if (!document.body) return result;

  // ── Balance: collect ALL euro amounts in top 300px, take the maximum ──
  const amounts = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  let node;
  while ((node = walker.nextNode())) {
    const el = node.parentElement;
    if (!el) continue;
    try {
      const rect = el.getBoundingClientRect();
      if (rect.top > 300 || rect.top < 0 || rect.width < 5) continue;
    } catch (e) { continue; }
    const s = window.getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') continue;

    const txt = node.textContent.trim();
    if (!txt || txt.length > 25) continue;

    // € on left or right
    let m = txt.match(/^€\s*([\d,]+(?:[.,]\d{1,2})?)\s*$/) ||
             txt.match(/^([\d,]+(?:[.,]\d{1,2})?)\s*€\s*$/);
    if (m) {
      const val = parseFloat((m[1] || m[2]).replace(/,/g, '.'));
      if (!isNaN(val) && val >= 0 && val < 500000) amounts.push(val);
      continue;
    }

    // Bare number — check if parent text contains € or "balance"/"wallet"
    m = txt.match(/^([\d]+[.,]\d{2})$/);
    if (m) {
      const val = parseFloat(m[1].replace(',', '.'));
      if (!isNaN(val) && val >= 0 && val < 500000) {
        const ctx = (el.closest('header,nav,[role="banner"],[role="navigation"]')
                    || el.parentElement?.parentElement
                    || el.parentElement || el);
        const ctxTxt = (ctx.innerText || ctx.textContent || '').toLowerCase();
        if (ctxTxt.includes('€') || ctxTxt.includes('balance') || ctxTxt.includes('wallet')) {
          amounts.push(val);
        }
      }
    }
  }

  // Use the maximum value found (covers main + bonus = header total)
  if (amounts.length > 0) {
    result.balance = Math.max(...amounts);
  }

  // ── Bets: scrape visible bet slip cards from DOM ──
  const domBets = scrapeBetSlipDOM();
  if (domBets.length > 0) {
    result.openBets = domBets.filter(b => b.status === 'pending');
    result.settledBets = domBets.filter(b => b.status !== 'pending');
  }

  return result;
}

// ── 3. SCRAPE BET SLIP CARDS FROM DOM ────────────────────────────────────────

function scrapeBetSlipDOM() {
  const bets = [];
  if (!document.body) return bets;

  // Find all text nodes containing "ID: <digits>" — unique bet identifier
  const idWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  let node;
  while ((node = idWalker.nextNode())) {
    const txt = node.textContent.trim();
    const idMatch = txt.match(/^ID:\s*(\d+)$/i);
    if (!idMatch) continue;
    const betId = idMatch[1];
    // Avoid duplicates
    if (bets.find(b => b.id === betId)) continue;

    // Walk up to find the bet card container
    let container = node.parentElement;
    for (let i = 0; i < 10 && container; i++) {
      const t = (container.innerText || '').toLowerCase();
      if ((t.includes('odds') || t.includes('stake') || t.includes('payout')) &&
          (t.includes('pending') || t.includes('settled') || t.includes('won') || t.includes('lost'))) {
        break;
      }
      container = container.parentElement;
    }
    if (!container) continue;

    const inner = container.innerText || '';
    const lines = inner.split('\n').map(l => l.trim()).filter(Boolean);

    // Status
    const statusMatch = inner.match(/\b(Pending|Open|Settled|Won|Lost|Void|Cashout)\b/i);
    const status = normalizeStatus(statusMatch?.[1] || 'pending');

    // Financials
    const oddsMatch = inner.match(/(?:Odds|Total\s*Odds)[^\d]*([\d.]+)/i);
    const stakeMatch = inner.match(/Stake[^\d]*([\d.]+)/i);
    const payoutMatch = inner.match(/Payout[^\d€]*([\d.]+)/i);
    const totalOdds = oddsMatch ? parseFloat(oddsMatch[1]) : 0;
    const stake = stakeMatch ? parseFloat(stakeMatch[1]) : 0;
    const payout = payoutMatch ? parseFloat(payoutMatch[1]) : 0;
    const isBonus = /bonus/i.test(inner);

    // Extract selections: lines where next line is an odds number (1.01–99.99)
    const selections = [];
    for (let i = 0; i < lines.length - 1; i++) {
      const nextOdds = parseFloat(lines[i + 1]);
      if (!isNaN(nextOdds) && nextOdds >= 1.01 && nextOdds <= 99.99 &&
          lines[i].length > 2 && !/^\d/.test(lines[i]) &&
          !/(odds|stake|payout|pending|settled|won|lost|combo|single|today|id:|money|line|match|mar|jan|feb|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(lines[i])) {
        selections.push({
          player:   lines[i],
          market:   lines[i + 2] || '',
          match:    lines[i + 3] || '',
          datetime: '',
          odds:     nextOdds,
          status:   'pending',
        });
        i++;
      }
    }

    if (stake > 0 || totalOdds > 0) {
      bets.push({
        id: betId,
        type: selections.length > 1 ? 'combo' : 'single',
        legs: selections.length || 1,
        status,
        stake,
        totalOdds,
        potentialPayout: payout,
        actualPayout: 0,
        isBonus,
        placedAt: '',
        settledAt: '',
        selections,
      });
    }
  }

  return bets;
}

// ── 4. PARSE BALANCE FROM API RESPONSE ───────────────────────────────────────

function tryParseBalance(data) {
  if (!data || typeof data !== 'object') return null;
  const BALANCE_KEYS = ['balance', 'amount', 'wallet', 'available', 'availablebalance',
    'real_balance', 'cash', 'funds', 'credit', 'cashbalance', 'realbalance',
    'bonusbalance', 'bonus', 'bonusfunds', 'promotionalbalance', 'freebetbalance'];

  let total = 0;
  let found = false;

  function search(obj, depth) {
    if (depth > 6 || !obj || typeof obj !== 'object') return;
    for (const k of Object.keys(obj)) {
      if (BALANCE_KEYS.includes(k.toLowerCase())) {
        const v = parseFloat(obj[k]);
        if (!isNaN(v) && v >= 0 && v < 500000) { total += v; found = true; }
      }
    }
    for (const val of Object.values(obj)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) search(val, depth + 1);
    }
  }

  search(data, 0);
  return found ? { balance: total } : null;
}

// ── 5. PARSE BETS FROM API RESPONSE ──────────────────────────────────────────

function tryParseBets(data) {
  if (!data || typeof data !== 'object') return null;

  function findArray(obj, depth) {
    if (depth > 5) return null;
    if (Array.isArray(obj) && obj.length > 0) {
      const first = obj[0];
      if (first && typeof first === 'object' && Object.keys(first).length >= 2) {
        const combined = Object.keys(first).join(' ').toLowerCase();
        if (/odd|stake|amount|status|bet|ticket|wager|selection|coupon|pick|event|leg/.test(combined)) {
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
    const selRaw = raw.selections ?? raw.legs ?? raw.events ?? raw.picks ?? raw.items ?? raw.bets ?? [];
    const selections = (Array.isArray(selRaw) ? selRaw : []).map(sel => ({
      player:   sel.selection ?? sel.pick ?? sel.outcome ?? sel.participant ?? sel.name ?? sel.player ?? sel.team ?? '',
      market:   sel.market ?? sel.marketName ?? sel.marketType ?? sel.type ?? sel.betType ?? '',
      match:    sel.event ?? sel.match ?? sel.fixture ?? sel.game ?? sel.eventName ?? sel.matchName ?? '',
      datetime: sel.startTime ?? sel.kickoff ?? sel.date ?? sel.startDate ?? sel.eventDate ?? '',
      odds:     parseFloat(sel.odds ?? sel.price ?? sel.coefficient ?? sel.coef ?? sel.odd ?? 0),
      status:   normalizeStatus(sel.status ?? sel.result ?? 'pending'),
    }));

    return {
      id:              String(raw.id ?? raw.ticketId ?? raw.betId ?? raw.couponId ?? raw.ref ?? raw.code ?? ''),
      type:            selections.length > 1 ? 'combo' : 'single',
      legs:            selections.length || 1,
      status,
      stake:           parseFloat(raw.stake ?? raw.amount ?? raw.wagered ?? raw.betAmount ?? raw.totalStake ?? raw.stakeAmount ?? 0),
      totalOdds:       parseFloat(raw.totalOdds ?? raw.odds ?? raw.price ?? raw.coefficient ?? raw.coef ?? raw.odd ?? raw.combinedOdds ?? 0),
      potentialPayout: parseFloat(raw.potentialPayout ?? raw.possibleWin ?? raw.maxPayout ?? raw.winAmount ?? raw.possibleWinnings ?? raw.toReturn ?? 0),
      actualPayout:    parseFloat(raw.payout ?? raw.winnings ?? raw.profit ?? raw.actualWin ?? raw.returnAmount ?? 0),
      isBonus:         !!(raw.isBonus ?? raw.bonusFunds ?? raw.bonus ?? raw.freebet ?? raw.freeBet ?? raw.isBonusBet),
      placedAt:        raw.createdAt ?? raw.placedAt ?? raw.date ?? raw.placedDate ?? raw.betDate ?? '',
      settledAt:       raw.settledAt ?? raw.resultedAt ?? raw.resultDate ?? raw.settleDate ?? '',
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

// ── 6. MERGE AND SAVE ────────────────────────────────────────────────────────

function mergeAndSave(newData) {
  chrome.storage.local.get([STORAGE_KEY], (stored) => {
    const existing = stored[STORAGE_KEY] || {};
    const merged = { ...existing, ...newData, lastSync: Date.now() };

    if (newData.openBets) {
      const ids = new Set(newData.openBets.map(b => b.id));
      merged.openBets = [...newData.openBets, ...(existing.openBets || []).filter(b => !ids.has(b.id))];
    }
    if (newData.settledBets) {
      const ids = new Set(newData.settledBets.map(b => b.id));
      merged.settledBets = [...newData.settledBets, ...(existing.settledBets || []).filter(b => !ids.has(b.id))];
    }

    chrome.storage.local.set({ [STORAGE_KEY]: merged });

    const parts = [];
    if (newData.balance != null) parts.push(`€${newData.balance.toFixed(2)}`);
    const nb = (newData.openBets?.length || 0) + (newData.settledBets?.length || 0);
    if (nb > 0) parts.push(`${nb} bet${nb > 1 ? 's' : ''}`);
    if (parts.length) showToast('✓ ' + parts.join(' · '));
  });
}

// ── 7. TOAST ─────────────────────────────────────────────────────────────────

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

// ── 8. RUN + SPA POLLING ─────────────────────────────────────────────────────

function runScrape() {
  const dom = scrapeDOM();
  if (dom.balance !== undefined || (dom.openBets && dom.openBets.length > 0) ||
      (dom.settledBets && dom.settledBets.length > 0)) {
    mergeAndSave(dom);
  }
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
}).observe(document.documentElement, { childList: true, subtree: true });

setInterval(runScrape, 10000);
