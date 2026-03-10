import { useState, useEffect, useCallback, useRef } from "react";

// ──────────────────────────────────────────────────
// MATCH DATA (In production, replace with API feed)
// ──────────────────────────────────────────────────
const MOCK_MATCHES = [
  {
    id: 1, tournament: "Hersonissos 2 Challenger", surface: "Hard", round: "R32", status: "LIVE", set: 1, game: "3-6", point: "15-30", startTime: "14:30", updated: Date.now() - 45000,
    p1: { name: "P. Makk", rank: 716, country: "HU", flag: "🇭🇺", age: 24, hand: "R", aces: 0, df: 0, first_pct: 61, first_won: 50, second_won: 38, bp_saved: 25, bp_faced: 4, service_games: 5, return_pts_won: 32, fatigue: 0.12, momentum: -0.6, h2h: "0-0", recent_form: [0,1,0,1,0], surface_wr: 0.41, travel_hrs: 18, last_match_days: 3, altitude_delta: 200, sleep_zone_diff: 2, pre_match_odds: 3.40 },
    p2: { name: "P. Henning", rank: 324, country: "ZA", flag: "🇿🇦", age: 26, hand: "R", aces: 0, df: 1, first_pct: 64, first_won: 81, second_won: 56, bp_saved: 0, bp_faced: 1, service_games: 5, return_pts_won: 58, fatigue: 0.08, momentum: 0.7, h2h: "0-0", recent_form: [1,1,0,1,1], surface_wr: 0.54, travel_hrs: 6, last_match_days: 2, altitude_delta: 50, sleep_zone_diff: 0, pre_match_odds: 1.32 },
  },
  {
    id: 2, tournament: "Indian Wells Masters", surface: "Hard", round: "R16", status: "PRE", set: 0, game: "-", point: "-", startTime: "20:00", updated: Date.now() - 120000,
    p1: { name: "C. Alcaraz", rank: 2, country: "ES", flag: "🇪🇸", age: 22, hand: "R", aces: 0, df: 0, first_pct: 0, first_won: 0, second_won: 0, bp_saved: 0, bp_faced: 0, service_games: 0, return_pts_won: 0, fatigue: 0.22, momentum: 0.3, h2h: "3-2", recent_form: [1,1,1,0,1], surface_wr: 0.78, travel_hrs: 9, last_match_days: 1, altitude_delta: 400, sleep_zone_diff: 9, pre_match_odds: 1.55 },
    p2: { name: "H. Rune", rank: 8, country: "DK", flag: "🇩🇰", age: 22, hand: "R", aces: 0, df: 0, first_pct: 0, first_won: 0, second_won: 0, bp_saved: 0, bp_faced: 0, service_games: 0, return_pts_won: 0, fatigue: 0.05, momentum: 0.5, h2h: "2-3", recent_form: [1,0,1,1,1], surface_wr: 0.65, travel_hrs: 3, last_match_days: 3, altitude_delta: 0, sleep_zone_diff: 0, pre_match_odds: 2.50 },
  },
  {
    id: 3, tournament: "Dubai Open", surface: "Hard", round: "QF", status: "LIVE", set: 2, game: "6-4, 3-3", point: "40-40", startTime: "16:00", updated: Date.now() - 10000,
    p1: { name: "A. Sinner", rank: 1, country: "IT", flag: "🇮🇹", age: 23, hand: "R", aces: 8, df: 2, first_pct: 72, first_won: 78, second_won: 52, bp_saved: 80, bp_faced: 5, service_games: 10, return_pts_won: 45, fatigue: 0.31, momentum: 0.4, h2h: "5-3", recent_form: [1,1,1,1,0], surface_wr: 0.82, travel_hrs: 5, last_match_days: 1, altitude_delta: 0, sleep_zone_diff: 2, pre_match_odds: 1.28 },
    p2: { name: "D. Medvedev", rank: 5, country: "RU", flag: "🇷🇺", age: 29, hand: "R", aces: 3, df: 4, first_pct: 65, first_won: 70, second_won: 48, bp_saved: 60, bp_faced: 5, service_games: 9, return_pts_won: 40, fatigue: 0.35, momentum: -0.2, h2h: "3-5", recent_form: [1,0,1,0,1], surface_wr: 0.71, travel_hrs: 8, last_match_days: 0, altitude_delta: 100, sleep_zone_diff: 3, pre_match_odds: 3.80 },
  },
  {
    id: 4, tournament: "Hersonissos 2 Challenger", surface: "Hard", round: "R32", status: "PRE", set: 0, game: "-", point: "-", startTime: "11:00", updated: Date.now() - 300000,
    p1: { name: "L. Djere", rank: 112, country: "RS", flag: "🇷🇸", age: 29, hand: "R", aces: 0, df: 0, first_pct: 0, first_won: 0, second_won: 0, bp_saved: 0, bp_faced: 0, service_games: 0, return_pts_won: 0, fatigue: 0.18, momentum: 0.0, h2h: "1-0", recent_form: [0,0,1,1,0], surface_wr: 0.48, travel_hrs: 4, last_match_days: 5, altitude_delta: 0, sleep_zone_diff: 1, pre_match_odds: 1.72 },
    p2: { name: "G. Barrere", rank: 198, country: "FR", flag: "🇫🇷", age: 32, hand: "R", aces: 0, df: 0, first_pct: 0, first_won: 0, second_won: 0, bp_saved: 0, bp_faced: 0, service_games: 0, return_pts_won: 0, fatigue: 0.06, momentum: 0.1, h2h: "0-1", recent_form: [1,0,0,0,1], surface_wr: 0.39, travel_hrs: 3, last_match_days: 7, altitude_delta: 0, sleep_zone_diff: 0, pre_match_odds: 2.20 },
  },
  {
    id: 5, tournament: "Indian Wells Masters", surface: "Hard", round: "R32", status: "LIVE", set: 1, game: "4-5", point: "30-40", startTime: "18:30", updated: Date.now() - 5000,
    p1: { name: "T. Fritz", rank: 4, country: "US", flag: "🇺🇸", age: 27, hand: "R", aces: 5, df: 1, first_pct: 68, first_won: 72, second_won: 45, bp_saved: 67, bp_faced: 3, service_games: 5, return_pts_won: 38, fatigue: 0.10, momentum: -0.3, h2h: "2-1", recent_form: [1,1,0,1,1], surface_wr: 0.72, travel_hrs: 1, last_match_days: 2, altitude_delta: 0, sleep_zone_diff: 0, pre_match_odds: 1.45 },
    p2: { name: "S. Tsitsipas", rank: 11, country: "GR", flag: "🇬🇷", age: 26, hand: "R", aces: 3, df: 3, first_pct: 60, first_won: 65, second_won: 50, bp_saved: 50, bp_faced: 4, service_games: 5, return_pts_won: 42, fatigue: 0.15, momentum: 0.4, h2h: "1-2", recent_form: [0,1,1,0,1], surface_wr: 0.62, travel_hrs: 12, last_match_days: 1, altitude_delta: 300, sleep_zone_diff: 10, pre_match_odds: 2.85 },
  },
];

// ──────────────────────────────────────────────────
// EDGE CALCULATION ENGINE
// ──────────────────────────────────────────────────
function calcEdge(player, opponent, match, weights) {
  const w = weights;
  let score = 0;
  let factors = [];
  const add = (name, val, desc) => { score += val; if (Math.abs(val) > 0.003) factors.push({ name, val, desc }); };

  add("Circadian Disruption", player.sleep_zone_diff * -0.018 * w.circadian, `${player.sleep_zone_diff}h timezone shift`);
  add("Travel Load", (player.travel_hrs / 24) * -0.03 * w.travel, `${player.travel_hrs}h travel`);
  add("Altitude Δ", (player.altitude_delta / 1000) * -0.015 * w.altitude, `${player.altitude_delta}m change`);
  add("Fatigue Index", player.fatigue * -0.12 * w.fatigue, `Load: ${(player.fatigue * 100).toFixed(0)}%`);
  add("Recovery Window", player.last_match_days >= 2 ? 0.02 * w.recovery : player.last_match_days === 0 ? -0.025 * w.recovery : 0, `${player.last_match_days}d rest`);
  add("Surface Edge", (player.surface_wr - opponent.surface_wr) * 0.15 * w.surface, `${(player.surface_wr * 100).toFixed(0)}% vs ${(opponent.surface_wr * 100).toFixed(0)}%`);
  add("Momentum", player.momentum * 0.05 * w.momentum, `Score: ${player.momentum.toFixed(2)}`);

  const formScore = player.recent_form.reduce((a, v, i) => a + v * (i + 1), 0) / 15;
  const oppForm = opponent.recent_form.reduce((a, v, i) => a + v * (i + 1), 0) / 15;
  add("Form Trend", (formScore - oppForm) * 0.08 * w.form, `${player.recent_form.filter(x => x).length}/5 W`);

  if (match.status === "LIVE" && player.second_won > 0)
    add("2nd Serve Edge", ((player.second_won - opponent.second_won) / 100) * 0.06 * w.secondServe, `${player.second_won}% vs ${opponent.second_won}%`);
  if (match.status === "LIVE" && player.bp_faced > 0)
    add("Pressure Handling", ((player.bp_saved - (opponent.bp_saved || 50)) / 100) * 0.04 * w.pressure, `BP saved: ${player.bp_saved}%`);
  add("Age Decay", player.age > 28 ? (player.age - 28) * -0.005 * w.ageSurface : 0, `Age ${player.age}`);

  score += Math.log((opponent.rank || 1) / (player.rank || 1)) * 0.02 * w.rank;
  return { score, factors };
}

function impliedProb(odds) { return 1 / odds; }
function trueOdds(prob) { return prob > 0 ? 1 / prob : 999; }
function kellyFraction(edge, odds, fraction = 0.25) {
  const b = odds - 1;
  const p = impliedProb(odds) + edge;
  const q = 1 - p;
  return Math.max(0, ((b * p - q) / b) * fraction);
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ──────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────
export default function TennisEdgeSystem() {
  const [bankroll, setBankroll] = useState(1000);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [betHistory, setBetHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("feed");
  const [kellyFrac, setKellyFrac] = useState(0.25);
  const [simRunning, setSimRunning] = useState(false);
  const [simResults, setSimResults] = useState(null);
  const [feedFilter, setFeedFilter] = useState("all");
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const [settings, setSettings] = useState({
    minOdds: 1.60, maxOdds: 10.0, minEV: 0, maxKellyPct: 15,
    minStake: 5, maxStake: 500, currency: "€",
  });

  const [weights, setWeights] = useState({
    circadian: 1, travel: 1, altitude: 1, fatigue: 1, recovery: 1,
    surface: 1, momentum: 1, form: 1, secondServe: 1, pressure: 1,
    ageSurface: 1, rank: 0.3
  });

  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(() => setLastRefresh(Date.now()), 30000);
    return () => clearInterval(iv);
  }, [autoRefresh]);

  // Compute edges for every match
  const matchEdges = MOCK_MATCHES.map(m => {
    const p1E = calcEdge(m.p1, m.p2, m, weights);
    const p2E = calcEdge(m.p2, m.p1, m, weights);
    const p1Imp = impliedProb(m.p1.pre_match_odds);
    const p1True = Math.min(0.95, Math.max(0.05, p1Imp + p1E.score - p2E.score));
    const p2True = 1 - p1True;
    const p1Val = ((p1True * m.p1.pre_match_odds) - 1) * 100;
    const p2Val = ((p2True * m.p2.pre_match_odds) - 1) * 100;
    const p1K = kellyFraction(p1E.score - p2E.score, m.p1.pre_match_odds, kellyFrac);
    const p2K = kellyFraction(p2E.score - p1E.score, m.p2.pre_match_odds, kellyFrac);
    const p1Ok = m.p1.pre_match_odds >= settings.minOdds && m.p1.pre_match_odds <= settings.maxOdds;
    const p2Ok = m.p2.pre_match_odds >= settings.minOdds && m.p2.pre_match_odds <= settings.maxOdds;
    let best = null;
    if (p1Val > p2Val && p1Val > settings.minEV && p1Ok) best = "p1";
    else if (p2Val >= p1Val && p2Val > settings.minEV && p2Ok) best = "p2";
    return { match: m, p1Edge: p1E, p2Edge: p2E, p1True, p2True, p1Val, p2Val, p1K, p2K, p1Ok, p2Ok, best,
      bestPlayer: best === "p1" ? m.p1 : best === "p2" ? m.p2 : null,
      bestEV: best === "p1" ? p1Val : best === "p2" ? p2Val : Math.max(p1Val, p2Val),
      bestK: best === "p1" ? p1K : best === "p2" ? p2K : 0 };
  });

  const filtered = matchEdges.filter(e => {
    if (feedFilter === "live") return e.match.status === "LIVE";
    if (feedFilter === "pre") return e.match.status === "PRE";
    if (feedFilter === "value") return e.best !== null;
    return true;
  }).sort((a, b) => b.bestEV - a.bestEV);

  const sel = selectedMatch !== null ? matchEdges.find(e => e.match.id === selectedMatch) : null;

  function calcStake(edge) {
    if (!edge || !edge.best) return 0;
    return Math.max(settings.minStake, Math.min(settings.maxStake, Math.round(bankroll * Math.min(edge.bestK, settings.maxKellyPct / 100))));
  }

  function placeBet(edge) {
    if (!edge?.best) return;
    const m = edge.match;
    const odds = edge.best === "p1" ? m.p1.pre_match_odds : m.p2.pre_match_odds;
    const stake = calcStake(edge);
    if (stake <= 0 || stake > bankroll) return;
    const trueP = edge.best === "p1" ? edge.p1True : edge.p2True;
    const win = Math.random() < trueP;
    const profit = win ? stake * (odds - 1) : -stake;
    const nb = Math.round((bankroll + profit) * 100) / 100;
    setBankroll(nb);
    setBetHistory(p => [...p, { match: `${m.p1.name} vs ${m.p2.name}`, tournament: m.tournament,
      pick: edge.best === "p1" ? m.p1.name : m.p2.name, odds, stake,
      profit: Math.round(profit * 100) / 100, bankroll: nb, value: edge.bestEV.toFixed(1) + "%", win, ts: Date.now() }]);
  }

  function runSim() {
    setSimRunning(true);
    setTimeout(() => {
      const R = 1000, results = [];
      for (let r = 0; r < R; r++) {
        let b = bankroll;
        for (let i = 0; i < 200; i++) {
          const edge = 0.03 + Math.random() * 0.04;
          const odds = settings.minOdds + Math.random() * (settings.maxOdds - settings.minOdds) * 0.4;
          const k = kellyFraction(edge, odds, kellyFrac);
          const stake = Math.max(settings.minStake, Math.min(settings.maxStake, Math.round(b * Math.min(k, settings.maxKellyPct / 100))));
          if (stake <= 0 || stake > b) continue;
          b += Math.random() < (impliedProb(odds) + edge) ? stake * (odds - 1) : -stake;
          if (b <= 0) { b = 0; break; }
        }
        results.push(Math.round(b));
      }
      results.sort((a, b) => a - b);
      const avg = Math.round(results.reduce((a, b) => a + b, 0) / R);
      setSimResults({ avg, median: results[R / 2 | 0], p5: results[R * .05 | 0], p95: results[R * .95 | 0],
        bust: results.filter(r => r <= 0).length, doubled: results.filter(r => r >= bankroll * 2).length, runs: R, distribution: results });
      setSimRunning(false);
    }, 80);
  }

  // ── Colors ──
  const c = { bg: "#06080d", card: "#0c1018", hover: "#101824", brd: "#151d2b", brdL: "#1c2840",
    g: "#00e87b", r: "#ff3b5c", y: "#f0c030", b: "#3b8bff", txt: "#c8d0dc", dim: "#4a5670", dimm: "#2a3348", w: "#eef1f6" };

  const Badge = ({ value, big }) => {
    const col = value > 5 ? c.g : value > 0 ? c.y : c.r;
    return <span style={{ padding: big ? "4px 12px" : "2px 8px", borderRadius: "6px", fontSize: big ? "15px" : "10px",
      fontWeight: 700, background: `${col}15`, color: col, border: `1px solid ${col}30` }}>
      {value > 0 ? "+" : ""}{value.toFixed(1)}% EV</span>;
  };

  const OB = ({ odds, ok }) => <span style={{ padding: "2px 8px", borderRadius: "5px", fontSize: "12px", fontWeight: 700,
    fontFamily: "inherit", background: ok ? `${c.b}15` : `${c.r}10`, color: ok ? c.b : c.dim,
    border: `1px solid ${ok ? c.b + "30" : c.dimm}`, textDecoration: ok ? "none" : "line-through", opacity: ok ? 1 : 0.5 }}>
    {odds.toFixed(2)}</span>;

  const Pill = ({ active, onClick, children, count }) => <button onClick={onClick} style={{
    padding: "6px 14px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, letterSpacing: "1.5px",
    textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "6px",
    border: `1px solid ${active ? c.g + "50" : c.brd}`, background: active ? `${c.g}12` : "transparent", color: active ? c.g : c.dim, transition: "all .15s" }}>
    {children}
    {count !== undefined && <span style={{ background: active ? c.g : c.dimm, color: active ? "#000" : c.dim,
      borderRadius: "8px", padding: "1px 6px", fontSize: "9px", fontWeight: 800 }}>{count}</span>}
  </button>;

  const Btn = ({ variant, onClick, disabled, children, style: sx }) => <button onClick={onClick} disabled={disabled} style={{
    padding: "10px 20px", borderRadius: "8px", border: "none", fontFamily: "inherit", fontWeight: 700, fontSize: "11px",
    letterSpacing: "1px", cursor: disabled ? "default" : "pointer", transition: "all .15s", opacity: disabled ? 0.5 : 1,
    background: variant === "g" ? `linear-gradient(135deg,${c.g},#00b85f)` : variant === "r" ? `${c.r}20` : c.brd,
    color: variant === "g" ? "#000" : variant === "r" ? c.r : c.txt,
    boxShadow: variant === "g" ? `0 0 16px ${c.g}25` : "none", ...sx }}>
    {children}</button>;

  return (
    <div style={{ fontFamily: "'JetBrains Mono','SF Mono','Fira Code',monospace", background: c.bg, color: c.txt, minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ═══ HEADER ═══ */}
      <div style={{ background: `linear-gradient(180deg,${c.card},${c.bg})`, borderBottom: `1px solid ${c.brd}`, padding: "14px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", maxWidth: 1440, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "4px", color: c.g }}>◆ EDGE MACHINE</div>
              <div style={{ fontSize: 9, color: c.dim, letterSpacing: "2px" }}>TENNIS COMPOUNDING v3.0</div>
            </div>
            <div style={{ width: 1, height: 28, background: c.brd, margin: "0 4px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: autoRefresh ? c.g : c.dim, boxShadow: autoRefresh ? `0 0 8px ${c.g}60` : "none" }} />
              <span style={{ fontSize: 9, color: c.dim, letterSpacing: "1px" }}>{autoRefresh ? "LIVE" : "PAUSED"}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {[
              { l: "BANKROLL", v: `${settings.currency}${bankroll.toLocaleString()}`, col: bankroll >= 1000 ? c.g : c.r, fs: 18 },
              { l: "ROI", v: `${((bankroll / 1000 - 1) * 100).toFixed(1)}%`, col: bankroll >= 1000 ? c.g : c.r, fs: 14 },
              { l: "BETS", v: betHistory.length, col: c.b, fs: 14 },
            ].map((x, i) => (
              <div key={i} style={{ background: c.card, border: `1px solid ${c.brd}`, borderRadius: 8, padding: "6px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 9, color: c.dim, letterSpacing: "1px" }}>{x.l}</span>
                <span style={{ fontSize: x.fs, fontWeight: 800, color: x.col }}>{x.v}</span>
              </div>
            ))}
            <button onClick={() => setShowSettings(!showSettings)} style={{ background: showSettings ? `${c.g}15` : c.card, border: `1px solid ${showSettings ? c.g + "40" : c.brd}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: showSettings ? c.g : c.dim, fontSize: 14, fontFamily: "inherit" }}>⚙</button>
          </div>
        </div>
      </div>

      {/* ═══ SETTINGS PANEL ═══ */}
      {showSettings && (
        <div style={{ background: c.card, borderBottom: `1px solid ${c.brd}`, padding: "16px 20px" }}>
          <div style={{ maxWidth: 1440, margin: "0 auto" }}>
            <div style={{ fontSize: 9, letterSpacing: "3px", color: c.dim, marginBottom: 14 }}>BETTING LIMITS & FILTERS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 12 }}>
              {[
                { key: "minOdds", label: "MIN ODDS", min: 1.01, max: 5, step: 0.05 },
                { key: "maxOdds", label: "MAX ODDS", min: 2, max: 20, step: 0.5 },
                { key: "minEV", label: "MIN EV %", min: 0, max: 20, step: 0.5 },
                { key: "maxKellyPct", label: "MAX KELLY %", min: 1, max: 50, step: 1 },
                { key: "minStake", label: "MIN STAKE", min: 1, max: 100, step: 1 },
                { key: "maxStake", label: "MAX STAKE", min: 10, max: 5000, step: 10 },
              ].map(({ key, label, min, max, step }) => (
                <div key={key} style={{ background: c.bg, borderRadius: 8, padding: "10px 14px", border: `1px solid ${c.brd}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 9, color: c.dim, letterSpacing: "1.5px" }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: key === "minOdds" ? c.y : c.g }}>
                      {key.includes("Stake") ? settings.currency : ""}{settings[key].toFixed(key.includes("Odds") ? 2 : 0)}{key.includes("EV") || key.includes("Kelly") ? "%" : ""}
                    </span>
                  </div>
                  <input type="range" min={min} max={max} step={step} value={settings[key]}
                    onChange={e => setSettings(p => ({ ...p, [key]: +e.target.value }))}
                    style={{ width: "100%", accentColor: key === "minOdds" ? c.y : c.g }} />
                </div>
              ))}
              <div style={{ background: c.bg, borderRadius: 8, padding: "10px 14px", border: `1px solid ${c.brd}`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: 9, color: c.dim, letterSpacing: "1.5px", marginBottom: 8 }}>AUTO-REFRESH</div>
                <button onClick={() => setAutoRefresh(!autoRefresh)} style={{ background: autoRefresh ? `${c.g}20` : `${c.r}20`, border: `1px solid ${autoRefresh ? c.g + "40" : c.r + "40"}`, borderRadius: 6, padding: 6, cursor: "pointer", color: autoRefresh ? c.g : c.r, fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>
                  {autoRefresh ? "● ENABLED (30s)" : "○ DISABLED"}</button>
              </div>
            </div>
            <div style={{ marginTop: 10, padding: "8px 12px", background: `${c.y}08`, border: `1px solid ${c.y}20`, borderRadius: 6 }}>
              <span style={{ fontSize: 10, color: c.y }}>⚠ Min odds filter active at {settings.minOdds.toFixed(2)} — bets below this are greyed out and excluded from recommendations.</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ NAV TABS ═══ */}
      <div style={{ borderBottom: `1px solid ${c.brd}`, background: c.bg, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", maxWidth: 1440, margin: "0 auto", overflowX: "auto" }}>
          {[{ id: "feed", l: "📡 Match Feed" }, { id: "scanner", l: "⚡ Edge Scanner" }, { id: "factors", l: "🧬 Factors" }, { id: "simulator", l: "📊 Monte Carlo" }, { id: "history", l: "📋 Bet Log" }, { id: "deploy", l: "🚀 Deploy" }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: "12px 18px", cursor: "pointer", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: activeTab === t.id ? c.g : c.dim, background: "transparent", border: "none", fontFamily: "inherit", borderBottom: `2px solid ${activeTab === t.id ? c.g : "transparent"}`, transition: "all .15s", whiteSpace: "nowrap" }}>{t.l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 20, maxWidth: 1440, margin: "0 auto" }}>

        {/* ════ FEED ════ */}
        {activeTab === "feed" && (<>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Pill active={feedFilter === "all"} onClick={() => setFeedFilter("all")} count={matchEdges.length}>All</Pill>
              <Pill active={feedFilter === "live"} onClick={() => setFeedFilter("live")} count={matchEdges.filter(e => e.match.status === "LIVE").length}>Live</Pill>
              <Pill active={feedFilter === "pre"} onClick={() => setFeedFilter("pre")} count={matchEdges.filter(e => e.match.status === "PRE").length}>Upcoming</Pill>
              <Pill active={feedFilter === "value"} onClick={() => setFeedFilter("value")} count={matchEdges.filter(e => e.best).length}>Value Only</Pill>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 9, color: c.dim }}>Min odds: {settings.minOdds.toFixed(2)}</span>
              <button onClick={() => setLastRefresh(Date.now())} style={{ background: c.card, border: `1px solid ${c.brd}`, borderRadius: 6, padding: "6px 12px", cursor: "pointer", color: c.g, fontSize: 10, fontFamily: "inherit", fontWeight: 600, letterSpacing: "1px" }}>↻ REFRESH</button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(edge => {
              const m = edge.match, has = edge.best !== null;
              return (
                <div key={m.id} onClick={() => { setSelectedMatch(m.id); setActiveTab("scanner"); }}
                  style={{ background: c.card, border: `1px solid ${has ? c.g + "25" : c.brd}`, borderRadius: 10, padding: "14px 18px", cursor: "pointer", transition: "all .15s", borderLeft: `3px solid ${has ? c.g : c.brd}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 9, fontWeight: 700, letterSpacing: "1px", background: m.status === "LIVE" ? `${c.g}18` : `${c.b}15`, color: m.status === "LIVE" ? c.g : c.b }}>
                          {m.status === "LIVE" ? "● LIVE" : `◎ ${m.startTime}`}</span>
                        <span style={{ fontSize: 10, color: c.dim }}>{m.tournament} · {m.round}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: c.w }}>{m.p1.flag} {m.p1.name} <span style={{ color: c.dim, fontSize: 10 }}>#{m.p1.rank}</span></div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: c.w, marginTop: 2 }}>{m.p2.flag} {m.p2.name} <span style={{ color: c.dim, fontSize: 10 }}>#{m.p2.rank}</span></div>
                        </div>
                        {m.status === "LIVE" && <div style={{ textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 800, color: c.w }}>{m.game}</div><div style={{ fontSize: 11, color: c.y }}>{m.point}</div></div>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{ textAlign: "center" }}><div style={{ fontSize: 8, color: c.dim, letterSpacing: "1px", marginBottom: 3 }}>P1</div><OB odds={m.p1.pre_match_odds} ok={edge.p1Ok} /></div>
                      <div style={{ textAlign: "center" }}><div style={{ fontSize: 8, color: c.dim, letterSpacing: "1px", marginBottom: 3 }}>P2</div><OB odds={m.p2.pre_match_odds} ok={edge.p2Ok} /></div>
                    </div>
                    <div style={{ textAlign: "right", minWidth: 130 }}>
                      {has ? (<>
                        <Badge value={edge.bestEV} />
                        <div style={{ fontSize: 10, color: c.g, marginTop: 6 }}>{edge.bestPlayer.name} · K {(edge.bestK * 100).toFixed(1)}%</div>
                        <div style={{ fontSize: 10, color: c.dim, marginTop: 2 }}>Stake: {settings.currency}{calcStake(edge)}</div>
                      </>) : <span style={{ fontSize: 10, color: c.dim }}>No value</span>}
                    </div>
                    {has && <Btn variant="g" onClick={e => { e.stopPropagation(); placeBet(edge); }} style={{ padding: "8px 14px", fontSize: 10 }}>BET</Btn>}
                  </div>
                  <div style={{ fontSize: 9, color: c.dimm, marginTop: 6 }}>Updated {timeAgo(m.updated)}</div>
                </div>
              );
            })}
            {filtered.length === 0 && <div style={{ textAlign: "center", padding: "60px 20px", color: c.dim }}><div style={{ fontSize: 28, marginBottom: 8 }}>◇</div><div style={{ fontSize: 12 }}>No matches match current filters.</div></div>}
          </div>
        </>)}

        {/* ════ SCANNER ════ */}
        {activeTab === "scanner" && (<>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {MOCK_MATCHES.map(m => (
              <button key={m.id} onClick={() => setSelectedMatch(m.id)} style={{ padding: "8px 14px", borderRadius: 8, fontFamily: "inherit", fontSize: 11, cursor: "pointer", border: `1px solid ${selectedMatch === m.id ? c.g + "60" : c.brd}`, background: selectedMatch === m.id ? `${c.g}10` : c.card, color: selectedMatch === m.id ? c.g : c.dim, transition: "all .15s" }}>
                {m.status === "LIVE" ? "●" : "◎"} {m.p1.name} vs {m.p2.name}
              </button>
            ))}
          </div>

          {sel ? (() => {
            const m = sel.match;
            return (<>
              {/* Header */}
              <div style={{ background: `linear-gradient(135deg,${c.card},#0a1218)`, border: `1px solid ${c.brd}`, borderRadius: 10, padding: 18, marginBottom: 14 }}>
                <div style={{ fontSize: 9, color: c.dim, letterSpacing: "2px", marginBottom: 8 }}>{m.tournament.toUpperCase()} — {m.round} — {m.surface.toUpperCase()}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                    <div><div style={{ fontSize: 17, fontWeight: 700, color: c.w }}>{m.p1.flag} {m.p1.name}</div><div style={{ fontSize: 10, color: c.dim }}>ATP {m.p1.rank} · Age {m.p1.age}</div></div>
                    <span style={{ color: c.dimm }}>vs</span>
                    <div><div style={{ fontSize: 17, fontWeight: 700, color: c.w }}>{m.p2.flag} {m.p2.name}</div><div style={{ fontSize: 10, color: c.dim }}>ATP {m.p2.rank} · Age {m.p2.age}</div></div>
                  </div>
                  {m.status === "LIVE" && <div style={{ textAlign: "right" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: `${c.g}18`, color: c.g, animation: "pulse 2s infinite" }}>● LIVE</span>
                    <div style={{ fontSize: 20, fontWeight: 800, color: c.w, marginTop: 4 }}>{m.game}</div>
                    <div style={{ fontSize: 12, color: c.y }}>{m.point}</div>
                  </div>}
                </div>
              </div>

              {/* Value cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                {[{ p: m.p1, val: sel.p1Val, to: trueOdds(sel.p1True), k: sel.p1K, ok: sel.p1Ok },
                  { p: m.p2, val: sel.p2Val, to: trueOdds(sel.p2True), k: sel.p2K, ok: sel.p2Ok }].map(({ p, val, to, k, ok }, i) => (
                  <div key={i} style={{ background: c.card, border: `1px solid ${val > 0 && ok ? c.g + "30" : c.brd}`, borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 9, color: c.dim, letterSpacing: "2px", marginBottom: 10 }}>{p.name.toUpperCase()}</div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div><div style={{ fontSize: 10, color: c.dim }}>MARKET</div><div style={{ fontSize: 22, fontWeight: 800, color: c.dim }}>{p.pre_match_odds.toFixed(2)}</div></div>
                      <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: c.dim }}>TRUE</div><div style={{ fontSize: 22, fontWeight: 800, color: val > 0 ? c.g : c.r }}>{to.toFixed(2)}</div></div>
                      <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: c.dim }}>EV</div><Badge value={val} big /></div>
                    </div>
                    {!ok && <div style={{ marginTop: 10, padding: "6px 10px", background: `${c.r}08`, borderRadius: 6, border: `1px solid ${c.r}20`, fontSize: 10, color: c.r }}>✕ Below min odds ({settings.minOdds.toFixed(2)})</div>}
                    {val > 0 && ok && <div style={{ marginTop: 10, padding: "8px 10px", background: `${c.g}08`, borderRadius: 6, border: `1px solid ${c.g}20`, display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                      <span style={{ color: c.dim }}>Kelly: {(k * 100).toFixed(1)}%</span>
                      <span style={{ color: c.g, fontWeight: 700 }}>Stake: {settings.currency}{Math.max(settings.minStake, Math.min(settings.maxStake, Math.round(bankroll * Math.min(k, settings.maxKellyPct / 100))))}</span>
                    </div>}
                  </div>
                ))}
              </div>

              {/* Rec bet */}
              {sel.best && sel[sel.best === "p1" ? "p1Ok" : "p2Ok"] && (
                <div style={{ background: `linear-gradient(135deg,#0a1a12,${c.card})`, border: `1px solid ${c.g}30`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: "3px", color: c.g }}>◆ RECOMMENDED BET</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: c.w, marginTop: 4 }}>
                        {sel.bestPlayer.name} @ {(sel.best === "p1" ? m.p1.pre_match_odds : m.p2.pre_match_odds).toFixed(2)}
                      </div>
                      <div style={{ fontSize: 11, color: c.dim, marginTop: 2 }}>EV: +{sel.bestEV.toFixed(1)}% · Kelly: {(sel.bestK * 100).toFixed(1)}% · Stake: {settings.currency}{calcStake(sel)}</div>
                    </div>
                    <Btn variant="g" onClick={() => placeBet(sel)}>PLACE BET — {settings.currency}{calcStake(sel)}</Btn>
                  </div>
                </div>
              )}

              {/* Factors */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[{ l: m.p1.name, e: sel.p1Edge }, { l: m.p2.name, e: sel.p2Edge }].map(({ l, e }, idx) => (
                  <div key={idx} style={{ background: c.card, border: `1px solid ${c.brd}`, borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 9, letterSpacing: "2px", color: c.dim, marginBottom: 12 }}>EDGE FACTORS — {l.toUpperCase()}</div>
                    {e.factors.filter(f => Math.abs(f.val) > 0.003).map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `1px solid ${c.bg}` }}>
                        <div style={{ minWidth: 110 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: c.txt }}>{f.name}</div>
                          <div style={{ fontSize: 8, color: c.dimm }}>{f.desc}</div>
                        </div>
                        <div style={{ flex: 1, height: 3, background: c.brd, borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(100, Math.abs(f.val) * 600)}%`, height: "100%", background: f.val > 0 ? c.g : c.r, borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: f.val > 0 ? c.g : c.r, minWidth: 50, textAlign: "right" }}>
                          {f.val > 0 ? "+" : ""}{(f.val * 100).toFixed(2)}%</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: `1px solid ${c.brd}` }}>
                      <span style={{ fontSize: 10, fontWeight: 700 }}>TOTAL EDGE</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: e.score > 0 ? c.g : c.r }}>{e.score > 0 ? "+" : ""}{(e.score * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>);
          })() : <div style={{ textAlign: "center", padding: "60px 20px", color: c.dim }}><div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div><div style={{ fontSize: 12 }}>Select a match to analyze.</div></div>}
        </>)}

        {/* ════ FACTORS ════ */}
        {activeTab === "factors" && (
          <div style={{ background: c.card, border: `1px solid ${c.brd}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 9, letterSpacing: "3px", color: c.dim, marginBottom: 6 }}>UNORTHODOX FACTOR WEIGHTS</div>
            <p style={{ fontSize: 11, color: c.dim, marginBottom: 20, lineHeight: 1.6 }}>Variables bookmakers underprice. 1.0x = standard. Increase where the market is blind.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { key: "circadian", l: "🌙 Circadian Disruption", d: "Timezone shift degrades reaction time & focus. Almost never modeled by bookies." },
                { key: "travel", l: "✈️ Travel Fatigue", d: "Long-haul flights compound with jet lag for hidden performance loss." },
                { key: "altitude", l: "⛰️ Altitude Delta", d: "Elevation changes affect ball flight, breathing, serve speed." },
                { key: "fatigue", l: "🔋 Accumulated Fatigue", d: "Deep runs create invisible carryover fatigue into next event." },
                { key: "recovery", l: "💤 Recovery Window", d: "Back-to-back days favor younger players. 2+ rest = veteran edge." },
                { key: "surface", l: "🎾 Surface Win Rate", d: "Market over-indexes recent form vs surface-specific skill." },
                { key: "momentum", l: "📈 Momentum", d: "Live psychological shifts the odds react to slowly." },
                { key: "form", l: "🔥 Form Trend", d: "Weighted last-5 results. Detects rising/declining players." },
                { key: "secondServe", l: "🎯 2nd Serve Dominance", d: "Most undervalued stat in tennis. Predicts clutch play." },
                { key: "pressure", l: "🧠 BP Resilience", d: "Break point mental toughness. Systematically underweighted." },
                { key: "ageSurface", l: "⏳ Age-Surface Decay", d: "Players 28+ lose a step on fast surfaces. Not priced until obvious." },
                { key: "rank", l: "📊 Rank Δ (Baseline)", d: "Market already prices this. Keep low to avoid double-counting." },
              ].map(({ key, l, d }) => (
                <div key={key} style={{ padding: "12px 14px", background: c.bg, borderRadius: 8, border: `1px solid ${c.brd}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c.txt }}>{l}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: weights[key] > 1 ? c.g : weights[key] < 1 ? c.r : c.y }}>{weights[key].toFixed(1)}x</span>
                  </div>
                  <p style={{ fontSize: 9, color: c.dim, lineHeight: 1.5, marginBottom: 8 }}>{d}</p>
                  <input type="range" min="0" max="3" step="0.1" value={weights[key]}
                    onChange={e => setWeights(p => ({ ...p, [key]: +e.target.value }))}
                    style={{ width: "100%", accentColor: c.g }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ SIMULATOR ════ */}
        {activeTab === "simulator" && (
          <div style={{ background: c.card, border: `1px solid ${c.brd}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 9, letterSpacing: "3px", color: c.dim, marginBottom: 6 }}>MONTE CARLO BANKROLL SIMULATOR</div>
            <p style={{ fontSize: 11, color: c.dim, marginBottom: 16, lineHeight: 1.6 }}>1,000 parallel paths · 200 bets each · Your current settings applied.</p>
            <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 9, color: c.dim, letterSpacing: "1px", marginBottom: 4 }}>KELLY FRACTION</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="range" min="0.05" max="1" step="0.05" value={kellyFrac} onChange={e => setKellyFrac(+e.target.value)} style={{ width: 200, accentColor: c.y }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: c.y }}>{(kellyFrac * 100).toFixed(0)}%</span>
                </div>
              </div>
              <Btn variant="g" onClick={runSim} disabled={simRunning}>{simRunning ? "RUNNING..." : "RUN 1,000 SIMULATIONS"}</Btn>
            </div>
            {simResults && (<>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
                {[
                  { l: "MEDIAN", v: `${settings.currency}${simResults.median.toLocaleString()}`, col: simResults.median >= bankroll ? c.g : c.r },
                  { l: "AVERAGE", v: `${settings.currency}${simResults.avg.toLocaleString()}`, col: simResults.avg >= bankroll ? c.g : c.r },
                  { l: "5th–95th %ile", v: `${settings.currency}${simResults.p5.toLocaleString()} – ${settings.currency}${simResults.p95.toLocaleString()}`, col: c.b },
                  { l: "BUST RATE", v: `${(simResults.bust / simResults.runs * 100).toFixed(1)}%`, col: c.r },
                  { l: "2× BANKROLL", v: `${(simResults.doubled / simResults.runs * 100).toFixed(1)}%`, col: c.g },
                  { l: "SIMS", v: simResults.runs.toLocaleString(), col: c.b },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: "center", padding: 14, background: c.bg, borderRadius: 8, border: `1px solid ${c.brd}` }}>
                    <div style={{ fontSize: 9, color: c.dim, letterSpacing: "1px" }}>{s.l}</div>
                    <div style={{ fontSize: s.l.includes("–") ? 14 : 22, fontWeight: 800, color: s.col, marginTop: 6 }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 9, color: c.dim, letterSpacing: "1px", marginBottom: 6 }}>DISTRIBUTION</div>
                <div style={{ display: "flex", height: 100, alignItems: "flex-end", gap: 1 }}>
                  {(() => {
                    const bk = Array(60).fill(0), mx = Math.max(...simResults.distribution), rng = mx || 1;
                    simResults.distribution.forEach(v => { bk[Math.min(59, (v / rng * 59) | 0)]++; });
                    const mxB = Math.max(...bk);
                    return bk.map((n, i) => <div key={i} style={{ flex: 1, height: `${mxB > 0 ? n / mxB * 100 : 0}%`, background: (i / 59) * rng >= bankroll ? c.g : c.r, opacity: .6, borderRadius: "1px 1px 0 0", minWidth: 1 }} />);
                  })()}
                </div>
              </div>
            </>)}
          </div>
        )}

        {/* ════ HISTORY ════ */}
        {activeTab === "history" && (
          <div style={{ background: c.card, border: `1px solid ${c.brd}`, borderRadius: 10, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 9, letterSpacing: "3px", color: c.dim }}>BET LOG</div>
              {betHistory.length > 0 && <Btn variant="r" onClick={() => { setBetHistory([]); setBankroll(1000); }} style={{ padding: "6px 14px", fontSize: 10 }}>RESET</Btn>}
            </div>
            {betHistory.length === 0 ? <div style={{ textAlign: "center", padding: "50px 20px", color: c.dim }}><div style={{ fontSize: 28, marginBottom: 8 }}>◇</div><div style={{ fontSize: 12 }}>No bets yet.</div></div> : (<>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead><tr>{["#", "Match", "Pick", "Odds", "EV", "Stake", "P/L", "Bankroll"].map(h => <th key={h} style={{ padding: 8, textAlign: "left", color: c.dim, fontWeight: 600, letterSpacing: "1px", fontSize: 8, borderBottom: `1px solid ${c.brd}` }}>{h}</th>)}</tr></thead>
                  <tbody>{betHistory.map((b, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${c.bg}` }}>
                      <td style={{ padding: "7px 8px", color: c.dimm }}>{i + 1}</td>
                      <td style={{ padding: "7px 8px", color: c.txt, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.match}</td>
                      <td style={{ padding: "7px 8px", color: c.txt, fontWeight: 600 }}>{b.pick}</td>
                      <td style={{ padding: "7px 8px", color: c.b }}>{b.odds.toFixed(2)}</td>
                      <td style={{ padding: "7px 8px", color: c.y }}>{b.value}</td>
                      <td style={{ padding: "7px 8px", color: c.txt }}>{settings.currency}{b.stake}</td>
                      <td style={{ padding: "7px 8px", color: b.win ? c.g : c.r, fontWeight: 700 }}>{b.profit > 0 ? "+" : ""}{settings.currency}{b.profit}</td>
                      <td style={{ padding: "7px 8px", color: b.bankroll >= 1000 ? c.g : c.r, fontWeight: 700 }}>{settings.currency}{b.bankroll}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div style={{ marginTop: 14, display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[{ l: "WIN RATE", v: `${(betHistory.filter(b => b.win).length / betHistory.length * 100).toFixed(0)}%`, col: c.y },
                  { l: "TOTAL P/L", v: `${bankroll >= 1000 ? "+" : ""}${settings.currency}${(bankroll - 1000).toFixed(0)}`, col: bankroll >= 1000 ? c.g : c.r },
                  { l: "AVG STAKE", v: `${settings.currency}${Math.round(betHistory.reduce((a, b) => a + b.stake, 0) / betHistory.length)}`, col: c.b },
                ].map(({ l, v, col }, i) => <div key={i}><span style={{ fontSize: 9, color: c.dim }}>{l}: </span><span style={{ fontSize: 12, fontWeight: 700, color: col }}>{v}</span></div>)}
              </div>
            </>)}
          </div>
        )}

        {/* ════ DEPLOY ════ */}
        {activeTab === "deploy" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: c.card, border: `1px solid ${c.brd}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 9, letterSpacing: "3px", color: c.g, marginBottom: 10 }}>🚀 HOST & ACCESS FROM ANY DEVICE</div>
              <p style={{ fontSize: 12, color: c.txt, lineHeight: 1.7, marginBottom: 16 }}>Deploy this as a web app to use on your phone, tablet, or any browser. All options below give you a URL you can bookmark or add to your home screen.</p>
              {[
                { name: "Vercel (Recommended)", diff: "Easy", cost: "Free", time: "~5 min", steps: [
                  "Sign up at vercel.com with GitHub",
                  "Run: npx create-vite@latest edge-machine --template react",
                  "Replace src/App.jsx with this component (rename export to App)",
                  "git init → git add . → git commit → push to GitHub",
                  "Import repo in Vercel → auto-deploys to edge-machine.vercel.app",
                  "On mobile: open URL → Share → Add to Home Screen → app icon on your phone",
                ]},
                { name: "Netlify", diff: "Easy", cost: "Free", time: "~5 min", steps: [
                  "Same Vite setup, push to GitHub",
                  "netlify.com → New site from Git → connect repo",
                  "Build: npm run build · Publish: dist",
                  "Live at edge-machine.netlify.app",
                ]},
                { name: "Railway (with Backend)", diff: "Medium", cost: "Free tier", time: "~15 min", steps: [
                  "Best for live API data — Node.js backend + React frontend",
                  "Express server fetches from tennis data APIs on a cron",
                  "Serves frontend + API from same server",
                  "railway.app auto-deploys from Git",
                ]},
                { name: "VPS (Full Control)", diff: "Advanced", cost: "~$5/mo", time: "~30 min", steps: [
                  "DigitalOcean / Hetzner — spin up Ubuntu droplet",
                  "Install Node, clone repo, run with PM2 process manager",
                  "Nginx reverse proxy + free SSL via Let's Encrypt",
                  "Full control for cron jobs, database, scraping",
                ]},
              ].map((opt, i) => (
                <div key={i} style={{ background: c.bg, border: `1px solid ${c.brd}`, borderRadius: 8, padding: 16, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: c.w }}>{opt.name}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[{ v: opt.diff, col: c.b }, { v: opt.cost, col: c.g }, { v: opt.time, col: c.y }].map((b, j) => (
                        <span key={j} style={{ padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 600, background: `${b.col}15`, color: b.col }}>{b.v}</span>
                      ))}
                    </div>
                  </div>
                  <ol style={{ margin: 0, paddingLeft: 18 }}>
                    {opt.steps.map((s, j) => <li key={j} style={{ fontSize: 11, color: c.dim, lineHeight: 1.7, marginBottom: 2 }}>{s}</li>)}
                  </ol>
                </div>
              ))}
            </div>

            <div style={{ background: c.card, border: `1px solid ${c.brd}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 9, letterSpacing: "3px", color: c.y, marginBottom: 10 }}>📡 LIVE DATA SOURCES</div>
              <p style={{ fontSize: 12, color: c.txt, lineHeight: 1.7, marginBottom: 12 }}>Replace mock data with real feeds from these APIs:</p>
              {[
                { n: "SportRadar Tennis API", d: "Official ATP/WTA data. Live scores, stats, odds. Premium.", u: "sportradar.com" },
                { n: "API-Tennis (RapidAPI)", d: "Live scores, H2H, rankings. Free tier. Good for Challengers.", u: "rapidapi.com" },
                { n: "The Odds API", d: "Pre-match and live odds from 15+ bookmakers. Free 500 req/mo.", u: "the-odds-api.com" },
                { n: "Flashscore Scraper", d: "Unofficial but deep. Real-time scores. Use Puppeteer/Playwright.", u: "flashscore.com" },
              ].map((api, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 3 ? `1px solid ${c.brd}` : "none" }}>
                  <div><div style={{ fontSize: 12, fontWeight: 600, color: c.w }}>{api.n}</div><div style={{ fontSize: 10, color: c.dim }}>{api.d}</div></div>
                  <span style={{ fontSize: 10, color: c.b }}>{api.u}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        input[type=range]{-webkit-appearance:none;height:3px;border-radius:2px;background:#151d2b;outline:none}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#00e87b;cursor:pointer;border:2px solid #06080d}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#06080d}::-webkit-scrollbar-thumb{background:#151d2b;border-radius:3px}
        *{box-sizing:border-box;margin:0;padding:0}
      `}</style>
    </div>
  );
}
