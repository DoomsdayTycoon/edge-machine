import { useState, useEffect, useRef } from "react";

// ──────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────
const BOOKS = [
  { key: "pinnacle",    name: "Pinnacle",      abbr: "PIN",  note: "sharpest" },
  { key: "epicbet",     name: "Epicbet",       abbr: "EPIC", note: "" },
  { key: "bet365",      name: "Bet365",        abbr: "B365", note: "" },
  { key: "unibet",      name: "Unibet",        abbr: "UNI",  note: "" },
  { key: "williamhill", name: "William Hill",  abbr: "WH",   note: "" },
  { key: "betway",      name: "Betway",        abbr: "BTW",  note: "" },
  { key: "bwin",        name: "bwin",          abbr: "BWIN", note: "" },
];
const SURFACE_C = { Hard: "#3b8bff", Clay: "#ff7043", Grass: "#00c853", Carpet: "#ab47bc" };
const CIRCUIT_COLOR = { ATP:"#3b8bff", WTA:"#c77dff", CH:"#ff7043", ITF:"#26c6da" };
const BP = { aces:0,df:0,first_pct:63,first_won:68,second_won:46,bp_saved:55,bp_faced:3,service_games:6,return_pts_won:40,
  tiebreak_wr:0.50, third_set_wr:0.50, bp_convert:40, style:"allcourt" };

// Style clash edge matrix: [attacker style][defender style] = edge for attacker
const STYLE_CLASH_MTX = {
  "serve-dom":   {"serve-dom":0,   "baseline":0.01, "counter":0.05,  "allcourt":0.02, "aggressive":-0.03},
  "baseline":    {"serve-dom":-0.01,"baseline":0,   "counter":0.03,  "allcourt":0.01, "aggressive":0.01},
  "counter":     {"serve-dom":-0.05,"baseline":-0.03,"counter":0,    "allcourt":-0.01,"aggressive":0.07},
  "allcourt":    {"serve-dom":-0.02,"baseline":-0.01,"counter":0.01, "allcourt":0,    "aggressive":0.02},
  "aggressive":  {"serve-dom":0.03, "baseline":-0.01,"counter":-0.07,"allcourt":-0.02,"aggressive":0},
};
function calcStyleClash(s1, s2, surface) {
  const base = STYLE_CLASH_MTX[s1]?.[s2] ?? 0;
  const surfBonus = surface==="Clay" ? (s1==="serve-dom"?-0.03:s1==="counter"?0.025:0)
    : surface==="Grass" ? (s1==="serve-dom"?0.03:s1==="counter"?-0.025:0) : 0;
  return base + surfBonus;
}

// ──────────────────────────────────────────────────
// MATCH DATA — sourced from tennisstats.com + ATP/WTA official, March 12 2026
// Indian Wells QF day — all 8 quarter-finals
// ──────────────────────────────────────────────────
const MOCK_MATCHES = [
  // ════ INDIAN WELLS ATP MASTERS 1000 — QF ════
  {
    // Stadium 2, NB 1PM PST / 22:00 CET
    id:1, circuit:"ATP", level:"Masters 1000", tournament:"Indian Wells Masters", surface:"Hard", round:"QF",
    status:"PRE", game:"-", point:"-", startTime:"Today 22:00", updated:Date.now()-60000,
    p1:{...BP,name:"A. Fils",rank:30,flag:"🇫🇷",age:21,hand:"R",
      aces:5,df:2,first_pct:64,first_won:68,second_won:49,bp_saved:60,bp_faced:5,service_games:8,return_pts_won:40,
      tiebreak_wr:0.52,third_set_wr:0.55,bp_convert:45,style:"aggressive",
      fatigue:0.20,momentum:0.65,h2h:"0-2",recent_form:[1,1,1,0,1],
      surface_wr:0.67,travel_hrs:9,last_match_days:1,altitude_delta:70,sleep_zone_diff:9},
    p2:{...BP,name:"A. Zverev",rank:4,flag:"🇩🇪",age:28,hand:"R",
      aces:6,df:2,first_pct:66,first_won:72,second_won:52,bp_saved:68,bp_faced:4,service_games:9,return_pts_won:42,
      tiebreak_wr:0.58,third_set_wr:0.62,bp_convert:44,style:"aggressive",
      fatigue:0.18,momentum:0.55,h2h:"2-0",recent_form:[1,1,1,1,0],
      surface_wr:0.73,travel_hrs:9,last_match_days:1,altitude_delta:70,sleep_zone_diff:9},
    odds:{pinnacle:{p1:2.58,p2:1.54},epicbet:{p1:2.50,p2:1.58},bet365:{p1:2.45,p2:1.60},unibet:{p1:2.40,p2:1.62},
          williamhill:{p1:2.52,p2:1.56},betway:{p1:2.47,p2:1.59},bwin:{p1:2.50,p2:1.57}},
    markets:[
      {key:"set_hcp",name:"Set Handicap",lines:[
        {p1_label:"Fils +1.5 sets",p2_label:"Zverev -1.5 sets",
         odds:{pinnacle:{p1:1.75,p2:2.12},epicbet:{p1:1.78,p2:2.08},bet365:{p1:1.80,p2:2.05},unibet:{p1:1.77,p2:2.10}}},
      ]},
    ],
  },
  {
    // Stadium 1, NB 5PM PST / Tomorrow 02:00 CET
    id:2, circuit:"ATP", level:"Masters 1000", tournament:"Indian Wells Masters", surface:"Hard", round:"QF",
    status:"PRE", game:"-", point:"-", startTime:"Tomorrow 02:00", updated:Date.now()-90000,
    p1:{...BP,name:"L. Tien",rank:27,flag:"🇺🇸",age:21,hand:"R",
      aces:5,df:2,first_pct:66,first_won:71,second_won:50,bp_saved:58,bp_faced:5,service_games:8,return_pts_won:41,
      tiebreak_wr:0.54,third_set_wr:0.52,bp_convert:42,style:"aggressive",
      fatigue:0.22,momentum:0.70,h2h:"0-1",recent_form:[1,1,1,0,1],
      surface_wr:0.70,travel_hrs:0,last_match_days:1,altitude_delta:70,sleep_zone_diff:0},
    p2:{...BP,name:"J. Sinner",rank:2,flag:"🇮🇹",age:23,hand:"R",
      aces:6,df:1,first_pct:72,first_won:77,second_won:53,bp_saved:78,bp_faced:4,service_games:9,return_pts_won:44,
      tiebreak_wr:0.66,third_set_wr:0.72,bp_convert:54,style:"aggressive",
      fatigue:0.20,momentum:0.55,h2h:"1-0",recent_form:[1,1,1,1,0],
      surface_wr:0.81,travel_hrs:11,last_match_days:1,altitude_delta:70,sleep_zone_diff:9},
    odds:{pinnacle:{p1:7.00,p2:1.10},epicbet:{p1:6.50,p2:1.12},bet365:{p1:6.20,p2:1.13},unibet:{p1:6.00,p2:1.14},
          williamhill:{p1:6.80,p2:1.11},betway:{p1:6.40,p2:1.12},bwin:{p1:6.60,p2:1.11}},
    markets:[
      {key:"set_hcp",name:"Set Handicap",lines:[
        {p1_label:"Tien +1.5 sets",p2_label:"Sinner -1.5 sets",
         odds:{pinnacle:{p1:2.20,p2:1.72},epicbet:{p1:2.15,p2:1.75},bet365:{p1:2.18,p2:1.73},unibet:{p1:2.10,p2:1.78}}},
      ]},
    ],
  },
  {
    // Stadium 2, NB 7PM PST / Tomorrow 04:00 CET
    id:3, circuit:"ATP", level:"Masters 1000", tournament:"Indian Wells Masters", surface:"Hard", round:"QF",
    status:"PRE", game:"-", point:"-", startTime:"Tomorrow 04:00", updated:Date.now()-120000,
    p1:{...BP,name:"J. Draper",rank:14,flag:"🇬🇧",age:24,hand:"L",
      aces:6,df:2,first_pct:65,first_won:70,second_won:52,bp_saved:66,bp_faced:5,service_games:8,return_pts_won:43,
      tiebreak_wr:0.58,third_set_wr:0.64,bp_convert:46,style:"aggressive",
      fatigue:0.22,momentum:0.72,h2h:"1-3",recent_form:[1,1,1,0,1],
      surface_wr:0.71,travel_hrs:9,last_match_days:1,altitude_delta:70,sleep_zone_diff:8},
    p2:{...BP,name:"D. Medvedev",rank:11,flag:"🇷🇺",age:29,hand:"R",
      aces:5,df:2,first_pct:68,first_won:73,second_won:50,bp_saved:74,bp_faced:3,service_games:9,return_pts_won:42,
      tiebreak_wr:0.72,third_set_wr:0.58,bp_convert:42,style:"counter",
      fatigue:0.14,momentum:0.50,h2h:"3-1",recent_form:[1,1,1,0,1],
      surface_wr:0.74,travel_hrs:11,last_match_days:1,altitude_delta:70,sleep_zone_diff:9},
    odds:{pinnacle:{p1:2.45,p2:1.55},epicbet:{p1:2.38,p2:1.58},bet365:{p1:2.35,p2:1.60},unibet:{p1:2.30,p2:1.62},
          williamhill:{p1:2.40,p2:1.57},betway:{p1:2.37,p2:1.59},bwin:{p1:2.42,p2:1.58}},
  },
  {
    // Stadium 1, closing match ~9PM PST / Tomorrow 06:00 CET
    id:4, circuit:"ATP", level:"Masters 1000", tournament:"Indian Wells Masters", surface:"Hard", round:"QF",
    status:"PRE", game:"-", point:"-", startTime:"Tomorrow 06:00", updated:Date.now()-150000,
    p1:{...BP,name:"C. Alcaraz",rank:1,flag:"🇪🇸",age:22,hand:"R",
      aces:5,df:2,first_pct:70,first_won:75,second_won:55,bp_saved:72,bp_faced:4,service_games:9,return_pts_won:46,
      tiebreak_wr:0.64,third_set_wr:0.70,bp_convert:53,style:"allcourt",
      fatigue:0.18,momentum:0.68,h2h:"5-3",recent_form:[1,1,1,1,1],
      surface_wr:0.82,travel_hrs:9,last_match_days:1,altitude_delta:70,sleep_zone_diff:9},
    p2:{...BP,name:"C. Norrie",rank:27,flag:"🇬🇧",age:29,hand:"L",
      aces:2,df:2,first_pct:62,first_won:66,second_won:49,bp_saved:68,bp_faced:3,service_games:8,return_pts_won:44,
      tiebreak_wr:0.52,third_set_wr:0.55,bp_convert:43,style:"counter",
      fatigue:0.12,momentum:0.52,h2h:"3-5",recent_form:[1,1,1,0,1],
      surface_wr:0.63,travel_hrs:9,last_match_days:1,altitude_delta:70,sleep_zone_diff:8},
    odds:{pinnacle:{p1:1.09,p2:9.00},epicbet:{p1:1.10,p2:8.50},bet365:{p1:1.11,p2:8.00},unibet:{p1:1.12,p2:7.50},
          williamhill:{p1:1.09,p2:9.50},betway:{p1:1.10,p2:8.20},bwin:{p1:1.10,p2:8.80}},
  },
  // ════ INDIAN WELLS WTA 1000 — QF ════
  {
    // Stadium 1, NB 11AM PST / Today 20:00 CET
    id:5, circuit:"WTA", level:"WTA 1000", tournament:"Indian Wells Masters (WTA)", surface:"Hard", round:"QF",
    status:"PRE", game:"-", point:"-", startTime:"Today 20:00", updated:Date.now()-30000,
    p1:{...BP,name:"A. Sabalenka",rank:1,flag:"🇧🇾",age:28,hand:"R",
      aces:4,df:1,first_pct:68,first_won:73,second_won:57,bp_saved:76,bp_faced:3,service_games:9,return_pts_won:48,
      tiebreak_wr:0.64,third_set_wr:0.70,bp_convert:52,style:"aggressive",
      fatigue:0.12,momentum:0.72,h2h:"1-0",recent_form:[1,1,1,1,0],
      surface_wr:0.80,travel_hrs:11,last_match_days:1,altitude_delta:70,sleep_zone_diff:9},
    p2:{...BP,name:"V. Mboko",rank:10,flag:"🇨🇦",age:21,hand:"R",
      aces:3,df:2,first_pct:62,first_won:66,second_won:50,bp_saved:60,bp_faced:5,service_games:7,return_pts_won:43,
      tiebreak_wr:0.52,third_set_wr:0.54,bp_convert:44,style:"allcourt",
      fatigue:0.20,momentum:0.62,h2h:"0-1",recent_form:[1,1,0,1,1],
      surface_wr:0.65,travel_hrs:5,last_match_days:1,altitude_delta:70,sleep_zone_diff:3},
    odds:{pinnacle:{p1:1.30,p2:3.40},epicbet:{p1:1.32,p2:3.25},bet365:{p1:1.34,p2:3.20},unibet:{p1:1.36,p2:3.10},
          williamhill:{p1:1.31,p2:3.35},betway:{p1:1.33,p2:3.25},bwin:{p1:1.32,p2:3.30}},
    markets:[
      {key:"set_hcp",name:"Set Handicap",lines:[
        {p1_label:"Sabalenka -1.5 sets",p2_label:"Mboko +1.5 sets",
         odds:{pinnacle:{p1:2.00,p2:1.82},epicbet:{p1:2.05,p2:1.78},bet365:{p1:2.08,p2:1.75},unibet:{p1:1.98,p2:1.84}}},
      ]},
    ],
  },
  {
    // Stadium 2, NB 2:30PM PST / Today 23:30 CET
    id:6, circuit:"WTA", level:"WTA 1000", tournament:"Indian Wells Masters (WTA)", surface:"Hard", round:"QF",
    status:"PRE", game:"-", point:"-", startTime:"Today 23:30", updated:Date.now()-180000,
    p1:{...BP,name:"L. Noskova",rank:14,flag:"🇨🇿",age:22,hand:"R",
      aces:5,df:2,first_pct:67,first_won:71,second_won:52,bp_saved:64,bp_faced:4,service_games:8,return_pts_won:44,
      tiebreak_wr:0.58,third_set_wr:0.60,bp_convert:48,style:"aggressive",
      fatigue:0.16,momentum:0.55,h2h:"0-0",recent_form:[1,1,1,0,1],
      surface_wr:0.68,travel_hrs:11,last_match_days:1,altitude_delta:70,sleep_zone_diff:9},
    p2:{...BP,name:"T. Gibson",rank:112,flag:"🇦🇺",age:22,hand:"R",
      aces:3,df:3,first_pct:60,first_won:63,second_won:46,bp_saved:52,bp_faced:5,service_games:7,return_pts_won:40,
      tiebreak_wr:0.44,third_set_wr:0.48,bp_convert:36,style:"allcourt",
      fatigue:0.24,momentum:0.68,h2h:"0-0",recent_form:[1,1,1,0,1],
      surface_wr:0.52,travel_hrs:19,last_match_days:1,altitude_delta:70,sleep_zone_diff:19},
    odds:{pinnacle:{p1:1.28,p2:3.60},epicbet:{p1:1.30,p2:3.50},bet365:{p1:1.32,p2:3.40},unibet:{p1:1.33,p2:3.30},
          williamhill:{p1:1.29,p2:3.55},betway:{p1:1.31,p2:3.45},bwin:{p1:1.30,p2:3.50}},
  },
  {
    // Stadium 2, NB 5PM PST / Tomorrow 02:00 CET
    id:7, circuit:"WTA", level:"WTA 1000", tournament:"Indian Wells Masters (WTA)", surface:"Hard", round:"QF",
    status:"PRE", game:"-", point:"-", startTime:"Tomorrow 02:00", updated:Date.now()-210000,
    p1:{...BP,name:"E. Svitolina",rank:9,flag:"🇺🇦",age:30,hand:"R",
      aces:2,df:2,first_pct:63,first_won:67,second_won:52,bp_saved:66,bp_faced:4,service_games:7,return_pts_won:45,
      tiebreak_wr:0.56,third_set_wr:0.62,bp_convert:45,style:"counter",
      fatigue:0.18,momentum:0.45,h2h:"1-5",recent_form:[1,1,0,1,1],
      surface_wr:0.68,travel_hrs:11,last_match_days:1,altitude_delta:70,sleep_zone_diff:10},
    p2:{...BP,name:"I. Swiatek",rank:2,flag:"🇵🇱",age:25,hand:"R",
      aces:2,df:2,first_pct:68,first_won:73,second_won:56,bp_saved:76,bp_faced:3,service_games:8,return_pts_won:49,
      tiebreak_wr:0.60,third_set_wr:0.67,bp_convert:56,style:"counter",
      fatigue:0.14,momentum:0.58,h2h:"5-1",recent_form:[1,1,1,1,0],
      surface_wr:0.79,travel_hrs:11,last_match_days:1,altitude_delta:70,sleep_zone_diff:9},
    odds:{pinnacle:{p1:3.40,p2:1.28},epicbet:{p1:3.25,p2:1.30},bet365:{p1:3.20,p2:1.32},unibet:{p1:3.10,p2:1.35},
          williamhill:{p1:3.35,p2:1.29},betway:{p1:3.25,p2:1.31},bwin:{p1:3.30,p2:1.30}},
  },
  {
    // Stadium 1, NB 7PM PST / Tomorrow 04:00 CET
    id:8, circuit:"WTA", level:"WTA 1000", tournament:"Indian Wells Masters (WTA)", surface:"Hard", round:"QF",
    status:"PRE", game:"-", point:"-", startTime:"Tomorrow 04:00", updated:Date.now()-240000,
    p1:{...BP,name:"J. Pegula",rank:5,flag:"🇺🇸",age:31,hand:"R",
      aces:2,df:2,first_pct:65,first_won:69,second_won:53,bp_saved:66,bp_faced:4,service_games:8,return_pts_won:44,
      tiebreak_wr:0.56,third_set_wr:0.58,bp_convert:48,style:"aggressive",
      fatigue:0.14,momentum:0.42,h2h:"3-4",recent_form:[1,1,0,1,1],
      surface_wr:0.73,travel_hrs:0,last_match_days:1,altitude_delta:70,sleep_zone_diff:0},
    p2:{...BP,name:"E. Rybakina",rank:3,flag:"🇰🇿",age:26,hand:"R",
      aces:5,df:2,first_pct:70,first_won:74,second_won:54,bp_saved:72,bp_faced:3,service_games:9,return_pts_won:42,
      tiebreak_wr:0.64,third_set_wr:0.67,bp_convert:50,style:"serve-dom",
      fatigue:0.10,momentum:0.58,h2h:"4-3",recent_form:[1,0,1,1,1],
      surface_wr:0.76,travel_hrs:14,last_match_days:3,altitude_delta:70,sleep_zone_diff:13},
    odds:{pinnacle:{p1:2.38,p2:1.60},epicbet:{p1:2.30,p2:1.63},bet365:{p1:2.25,p2:1.65},unibet:{p1:2.22,p2:1.68},
          williamhill:{p1:2.35,p2:1.61},betway:{p1:2.28,p2:1.64},bwin:{p1:2.32,p2:1.62}},
    markets:[
      {key:"set_hcp",name:"Set Handicap",lines:[
        {p1_label:"Pegula +1.5 sets",p2_label:"Rybakina -1.5 sets",
         odds:{pinnacle:{p1:1.72,p2:2.18},epicbet:{p1:1.75,p2:2.12},bet365:{p1:1.78,p2:2.08},unibet:{p1:1.70,p2:2.22}}},
      ]},
    ],
  },
];

// ──────────────────────────────────────────────────
// CALCULATION ENGINE
// ──────────────────────────────────────────────────
function getBestOdds(match) {
  let bestP1={odds:0,book:""}, bestP2={odds:0,book:""};
  Object.entries(match.odds).forEach(([key,v]) => {
    if (v.p1 > bestP1.odds) bestP1={odds:v.p1,book:key};
    if (v.p2 > bestP2.odds) bestP2={odds:v.p2,book:key};
  });
  return {bestP1,bestP2};
}

function getEpicbetOdds(match) {
  const ep = match.odds.epicbet;
  if (!ep) return null;
  return {bestP1:{odds:ep.p1,book:"epicbet"}, bestP2:{odds:ep.p2,book:"epicbet"}};
}

function noVigProb(match) {
  const ref = match.odds.pinnacle || Object.values(match.odds)[0];
  const sum = 1/ref.p1 + 1/ref.p2;
  return {p1:(1/ref.p1)/sum, p2:(1/ref.p2)/sum};
}

function calcArb(match) {
  const {bestP1,bestP2} = getBestOdds(match);
  const impliedSum = 1/bestP1.odds + 1/bestP2.odds;
  const arbPct = (1 - impliedSum) * 100;
  const stakeP1 = (1/bestP1.odds) / impliedSum;
  const stakeP2 = (1/bestP2.odds) / impliedSum;
  return {arbPct, isArb:arbPct>0.05, bestP1, bestP2, impliedSum, stakeP1, stakeP2};
}

function bookMargin(p1odds, p2odds) {
  return (1/p1odds + 1/p2odds - 1) * 100;
}

function calcEdge(player, opponent, match, weights) {
  const w = weights;
  let score = 0;
  const factors = [];
  const add = (name,val,desc) => { score+=val; if(Math.abs(val)>0.003) factors.push({name,val,desc}); };
  add("Circadian Disruption", player.sleep_zone_diff * -0.018 * w.circadian, `${player.sleep_zone_diff}h timezone shift`);
  add("Travel Load", (player.travel_hrs/24) * -0.03 * w.travel, `${player.travel_hrs}h travel`);
  add("Altitude Δ", (player.altitude_delta/1000) * -0.015 * w.altitude, `${player.altitude_delta}m change`);
  add("Fatigue Index", player.fatigue * -0.12 * w.fatigue, `Load: ${(player.fatigue*100).toFixed(0)}%`);
  add("Recovery Window", player.last_match_days>=2 ? 0.02*w.recovery : player.last_match_days===0 ? -0.025*w.recovery : 0, `${player.last_match_days}d rest`);
  add("Surface Edge", (player.surface_wr-opponent.surface_wr)*0.15*w.surface, `${(player.surface_wr*100).toFixed(0)}% vs ${(opponent.surface_wr*100).toFixed(0)}%`);
  add("Momentum", player.momentum*0.05*w.momentum, `Score: ${player.momentum.toFixed(2)}`);
  const fs = player.recent_form.reduce((a,v,i)=>a+v*(i+1),0)/15;
  const of = opponent.recent_form.reduce((a,v,i)=>a+v*(i+1),0)/15;
  add("Form Trend", (fs-of)*0.08*w.form, `${player.recent_form.filter(x=>x).length}/5 W`);
  if (match.status==="LIVE"&&player.second_won>0)
    add("2nd Serve Edge", ((player.second_won-opponent.second_won)/100)*0.06*w.secondServe, `${player.second_won}% vs ${opponent.second_won}%`);
  if (match.status==="LIVE"&&player.bp_faced>0)
    add("Pressure Handling", ((player.bp_saved-(opponent.bp_saved||50))/100)*0.04*w.pressure, `BP saved: ${player.bp_saved}%`);
  add("Age Decay", player.age>28 ? (player.age-28)*-0.005*w.ageSurface : 0, `Age ${player.age}`);
  score += Math.log((opponent.rank||1)/(player.rank||1))*0.02*w.rank;
  // ── v5.0 ADVANCED FACTORS ──────────────────────────
  const tbDelta = (player.tiebreak_wr||0.5) - (opponent.tiebreak_wr||0.5);
  add("Tiebreak Edge", tbDelta * 0.09 * (w.tiebreak??1), `TB WR: ${((player.tiebreak_wr||0.5)*100).toFixed(0)}% vs ${((opponent.tiebreak_wr||0.5)*100).toFixed(0)}%`);
  const dsDelta = (player.third_set_wr||0.5) - (opponent.third_set_wr||0.5);
  add("Deciding Set", dsDelta * 0.07 * (w.decidingSet??1), `3rd WR: ${((player.third_set_wr||0.5)*100).toFixed(0)}% vs ${((opponent.third_set_wr||0.5)*100).toFixed(0)}%`);
  add("BP Conversion", ((player.bp_convert||40)-(opponent.bp_convert||40))/100 * 0.05 * (w.bpConvert??1), `BP conv: ${player.bp_convert||40}% vs ${opponent.bp_convert||40}%`);
  const styleEdge = calcStyleClash(player.style||"allcourt", opponent.style||"allcourt", match.surface);
  add("Style Clash", styleEdge * 0.8 * (w.styleClash??1), `${player.style||"allcourt"} vs ${opponent.style||"allcourt"}`);
  if (player.first_pct>0&&player.first_won>0&&opponent.return_pts_won>0)
    add("Serve+Return", (player.first_pct*player.first_won/10000 - opponent.return_pts_won/100) * 0.04 * (w.serveReturn??1), `Srv: ${player.first_pct}%×${player.first_won}% ret: ${opponent.return_pts_won}%`);
  return {score,factors};
}

function kellyFraction(edge, odds, fraction=0.25) {
  const b=odds-1, p=1/odds+edge, q=1-p;
  return Math.max(0, ((b*p-q)/b)*fraction);
}

function timeAgo(ts) {
  const s=Math.floor((Date.now()-ts)/1000);
  if(s<60) return `${s}s ago`;
  if(s<3600) return `${Math.floor(s/60)}m ago`;
  return `${Math.floor(s/3600)}h ago`;
}

function bookAbbr(key) { return BOOKS.find(b=>b.key===key)?.abbr || key.slice(0,4).toUpperCase(); }

// Evaluate all market lines for a match — returns array of bet candidates
function calcMarketBets(match) {
  if (!match.markets) return [];
  const bets = [];
  match.markets.forEach(mkt => {
    mkt.lines.forEach(line => {
      // No-vig probability from Pinnacle (or first book)
      const ref = line.odds.pinnacle || Object.values(line.odds)[0];
      const sum = 1/ref.p1 + 1/ref.p2;
      const trueP1 = (1/ref.p1) / sum;
      const trueP2 = (1/ref.p2) / sum;
      // Best odds across books
      let bestP1={odds:0,book:""}, bestP2={odds:0,book:""};
      Object.entries(line.odds).forEach(([k,v]) => {
        if (v.p1>bestP1.odds) bestP1={odds:v.p1,book:k};
        if (v.p2>bestP2.odds) bestP2={odds:v.p2,book:k};
      });
      const ev1 = (trueP1 * bestP1.odds - 1) * 100;
      const ev2 = (trueP2 * bestP2.odds - 1) * 100;
      // Push both sides if positive EV
      if (ev1 > 0) bets.push({market:mkt.name,line:line.p1_label,odds:bestP1.odds,book:bestP1.book,ev:ev1,prob:trueP1,side:"p1"});
      if (ev2 > 0) bets.push({market:mkt.name,line:line.p2_label,odds:bestP2.odds,book:bestP2.book,ev:ev2,prob:trueP2,side:"p2"});
    });
  });
  return bets;
}

// ──────────────────────────────────────────────────
// THE ODDS API INTEGRATION
// ──────────────────────────────────────────────────
async function fetchOddsAPI(apiKey, sport="tennis_atp") {
  const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${apiKey}&regions=eu,uk&markets=h2h&oddsFormat=decimal`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}: ${(await res.json())?.message||"unknown"}`);
  return res.json();
}

function convertAPIMatch(event, idx) {
  const bookOdds = {};
  (event.bookmakers||[]).forEach(bm => {
    const h2h = bm.markets?.find(m=>m.key==="h2h");
    if (!h2h) return;
    const home = h2h.outcomes?.find(o=>o.name===event.home_team);
    const away = h2h.outcomes?.find(o=>o.name===event.away_team);
    if (home&&away) bookOdds[bm.key]={p1:home.price,p2:away.price};
  });
  if (!Object.keys(bookOdds).length) return null;
  const isPre = new Date(event.commence_time) > new Date();
  return {
    id:`api_${idx}`, tournament:"Live (The Odds API)", surface:"Hard", round:"–",
    status:isPre?"PRE":"LIVE", game:"-", point:"-",
    startTime:new Date(event.commence_time).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),
    updated:Date.now(), fromAPI:true,
    p1:{...BP,name:event.home_team,rank:999,flag:"",age:25,hand:"R",
        fatigue:0.1,momentum:0,h2h:"–",recent_form:[0,0,0,0,0],
        surface_wr:0.5,travel_hrs:4,last_match_days:2,altitude_delta:0,sleep_zone_diff:0},
    p2:{...BP,name:event.away_team,rank:999,flag:"",age:25,hand:"R",
        fatigue:0.1,momentum:0,h2h:"–",recent_form:[0,0,0,0,0],
        surface_wr:0.5,travel_hrs:4,last_match_days:2,altitude_delta:0,sleep_zone_diff:0},
    odds:bookOdds,
  };
}

// ──────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────
export default function App() {
  // ── Auth ──
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('__em_auth__') === '1');
  const [loginForm, setLoginForm] = useState({u:'', p:''});
  const [loginError, setLoginError] = useState('');

  const handleLogin = () => {
    if (loginForm.u === 'Admin' && loginForm.p === 'Mega2026') {
      localStorage.setItem('__em_auth__', '1');
      setIsLoggedIn(true);
    } else { setLoginError('Invalid credentials'); }
  };
  const handleLogout = () => {
    localStorage.removeItem('__em_auth__');
    setIsLoggedIn(false);
  };

  const [bankroll, setBankroll] = useState(0);
  const [startingBankroll, setStartingBankroll] = useState(0);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [betHistory, setBetHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("feed");
  const [kellyFrac, setKellyFrac] = useState(0.25);
  const [simRunning, setSimRunning] = useState(false);
  const [simResults, setSimResults] = useState(null);
  const [feedFilter, setFeedFilter] = useState("pre");
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiSport, setApiSport] = useState("tennis_atp");
  const [apiData, setApiData] = useState(null);
  const [apiStatus, setApiStatus] = useState("idle"); // idle|loading|ok|error
  const [apiError, setApiError] = useState("");
  const [editingBankroll, setEditingBankroll] = useState(false);
  const [bankrollInput, setBankrollInput] = useState("");
  const [showBetForm, setShowBetForm] = useState(false);
  const [betForm, setBetForm] = useState({match:"",pick:"",odds:"",stake:"",book:"epicbet"});
  const [epicbetData, setEpicbetData] = useState(null);
  const [epicbetStaging, setEpicbetStaging] = useState(null); // pending import waiting for approval
  const [epicbetTab, setEpicbetTab] = useState("overview"); // overview|open|history

  const [settings, setSettings] = useState({
    minOdds:1.20, maxOdds:10.0, minEV:0, maxKellyPct:15,
    minStake:5, maxStake:500, currency:"€",
  });
  const [weights, setWeights] = useState({
    circadian:1, travel:1, altitude:1, fatigue:1, recovery:1,
    surface:1, momentum:1, form:1, secondServe:1, pressure:1, ageSurface:1, rank:0.3,
    tiebreak:1, decidingSet:1, bpConvert:1, styleClash:1, serveReturn:1,
  });
  const [circuitFilter, setCircuitFilter] = useState("all");
  const [optimizing, setOptimizing] = useState(false);
  const [optimizerResult, setOptimizerResult] = useState(null);
  const [epicbetMode, setEpicbetMode] = useState(false);
  const [sortBy, setSortBy] = useState("ev");        // ev | time | circuit | surface
  const [feedView, setFeedView] = useState("cards"); // cards | odds

  const [isMobile, setIsMobile] = useState(typeof window!=="undefined"&&window.innerWidth<640);
  useEffect(()=>{
    const fn=()=>setIsMobile(window.innerWidth<640);
    window.addEventListener("resize",fn);
    return ()=>window.removeEventListener("resize",fn);
  },[]);

  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(()=>setLastRefresh(Date.now()), 30000);
    return () => clearInterval(iv);
  }, [autoRefresh]);

  // ── Epicbet: watch for staged data (written by extension, waits for user approval) ──
  useEffect(() => {
    const STAGING_KEY = '__epicbet_staging__';
    const checkStaging = () => {
      try {
        const raw = localStorage.getItem(STAGING_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setEpicbetStaging(parsed);
        }
      } catch(e) {}
    };
    checkStaging();
    const handler = (e) => { if (!e.key || e.key === '__epicbet_staging__') checkStaging(); };
    window.addEventListener('storage', handler);
    const iv = setInterval(checkStaging, 3000);
    return () => { window.removeEventListener('storage', handler); clearInterval(iv); };
  }, []);

  const approveEpicbetImport = () => {
    if (!epicbetStaging) return;
    setEpicbetData(epicbetStaging);
    setEpicbetStaging(null);
    localStorage.removeItem('__epicbet_staging__');
  };
  const dismissEpicbetImport = () => {
    setEpicbetStaging(null);
    localStorage.removeItem('__epicbet_staging__');
  };

  // ── Persistence: load on login ──
  useEffect(() => {
    if (!isLoggedIn) return;
    try {
      const bets = localStorage.getItem('__em_bets__');
      if (bets) setBetHistory(JSON.parse(bets));
      const br = localStorage.getItem('__em_bankroll__');
      if (br) { setBankroll(+br); setStartingBankroll(+(localStorage.getItem('__em_starting_bankroll__') || br)); }
      const s = localStorage.getItem('__em_settings__');
      if (s) setSettings(JSON.parse(s));
      const w = localStorage.getItem('__em_weights__');
      if (w) setWeights(JSON.parse(w));
      const kf = localStorage.getItem('__em_kelly__');
      if (kf) setKellyFrac(+kf);
    } catch(e) {}
  }, [isLoggedIn]);

  // ── Persistence: save on change ──
  useEffect(() => { if (isLoggedIn) localStorage.setItem('__em_bets__', JSON.stringify(betHistory)); }, [betHistory, isLoggedIn]);
  useEffect(() => { if (isLoggedIn) { localStorage.setItem('__em_bankroll__', bankroll); localStorage.setItem('__em_starting_bankroll__', startingBankroll); } }, [bankroll, startingBankroll, isLoggedIn]);
  useEffect(() => { if (isLoggedIn) localStorage.setItem('__em_settings__', JSON.stringify(settings)); }, [settings, isLoggedIn]);
  useEffect(() => { if (isLoggedIn) localStorage.setItem('__em_weights__', JSON.stringify(weights)); }, [weights, isLoggedIn]);
  useEffect(() => { if (isLoggedIn) localStorage.setItem('__em_kelly__', kellyFrac); }, [kellyFrac, isLoggedIn]);

  async function connectAPI() {
    if (!apiKey.trim()) return;
    setApiStatus("loading"); setApiError("");
    try {
      const data = await fetchOddsAPI(apiKey.trim(), apiSport);
      const converted = data.map(convertAPIMatch).filter(Boolean);
      setApiData(converted);
      setApiStatus("ok");
    } catch(e) {
      setApiStatus("error"); setApiError(e.message);
    }
  }

  // All matches = API data (if connected) + mock data
  const allMatches = apiStatus==="ok"&&apiData ? [...apiData, ...MOCK_MATCHES] : MOCK_MATCHES;

  // Compute edges for every match
  const matchEdges = allMatches
    .filter(m => !epicbetMode || !!m.odds.epicbet)   // hide no-epicbet matches in epicbet mode
    .map(m => {
    const nvp = noVigProb(m);
    const p1E = calcEdge(m.p1, m.p2, m, weights);
    const p2E = calcEdge(m.p2, m.p1, m, weights);
    const {bestP1,bestP2} = epicbetMode ? getEpicbetOdds(m) : getBestOdds(m);
    // Edge = model adjustment on top of no-vig baseline
    const p1True = Math.min(0.95, Math.max(0.05, nvp.p1 + (p1E.score-p2E.score)*0.5));
    const p2True = 1-p1True;
    const p1Val = ((p1True * bestP1.odds) - 1) * 100;
    const p2Val = ((p2True * bestP2.odds) - 1) * 100;
    const p1Ok = bestP1.odds >= settings.minOdds && bestP1.odds <= settings.maxOdds;
    const p2Ok = bestP2.odds >= settings.minOdds && bestP2.odds <= settings.maxOdds;
    const p1K = kellyFraction(p1True - 1/bestP1.odds, bestP1.odds, kellyFrac);
    const p2K = kellyFraction(p2True - 1/bestP2.odds, bestP2.odds, kellyFrac);
    // Lower-risk strategy: among positive EV bets, prefer the higher-probability side
    const candidates = [];
    if (p1Val>settings.minEV && p1Ok) candidates.push({side:"p1",ev:p1Val,prob:p1True,k:p1K,odds:bestP1.odds,book:bestP1.book});
    if (p2Val>settings.minEV && p2Ok) candidates.push({side:"p2",ev:p2Val,prob:p2True,k:p2K,odds:bestP2.odds,book:bestP2.book});
    // Sort by probability (lower risk) — highest prob positive-EV bet wins
    candidates.sort((a,b) => b.prob - a.prob);
    const topH2H = candidates[0] || null;
    let best = topH2H?.side || null;

    // Also evaluate market bets (handicap lines)
    const marketBets = calcMarketBets(m).filter(b =>
      b.ev>settings.minEV && b.odds>=settings.minOdds && b.odds<=settings.maxOdds
    ).sort((a,b) => b.prob - a.prob); // prefer higher probability market bets too

    const arb = calcArb(m);
    // Best rec = highest-prob positive-EV bet across H2H + markets
    const allCandidates = [
      ...(topH2H ? [{...topH2H,isMarket:false,label:topH2H.side==="p1"?m.p1.name:m.p2.name}] : []),
      ...marketBets.map(b=>({...b,isMarket:true,label:b.line})),
    ].sort((a,b) => b.prob - a.prob);
    const topRec = allCandidates[0] || null;

    return { match:m, p1Edge:p1E, p2Edge:p2E, p1True, p2True, p1Val, p2Val,
      p1K, p2K, p1Ok, p2Ok, best, bestP1, bestP2, arb, marketBets,
      bestPlayer: best==="p1"?m.p1:best==="p2"?m.p2:null,
      bestEV: topRec?.ev ?? Math.max(p1Val,p2Val),
      bestK: topH2H?.k || 0,
      bestOdds: topRec?.odds || (best==="p1"?bestP1.odds:bestP2.odds),
      bestBook: topRec?.book || (best==="p1"?bestP1.book:bestP2.book),
      topRec,
    };
  });

  const filtered = matchEdges.filter(e => {
    if (circuitFilter!=="all" && e.match.circuit!==circuitFilter) return false;
    if (feedFilter==="live") return e.match.status==="LIVE";
    if (feedFilter==="pre")  return e.match.status==="PRE";
    if (feedFilter==="value") return e.best!==null;
    return true;
  }).sort((a,b) => {
    if (sortBy==="ev") return b.bestEV - a.bestEV;
    if (sortBy==="time") {
      // LIVE first, then by startTime string alphabetically
      if (a.match.status==="LIVE" && b.match.status!=="LIVE") return -1;
      if (b.match.status==="LIVE" && a.match.status!=="LIVE") return 1;
      return a.match.startTime.localeCompare(b.match.startTime);
    }
    if (sortBy==="circuit") {
      const order=["ATP","WTA","CH","ITF"];
      return order.indexOf(a.match.circuit)-order.indexOf(b.match.circuit);
    }
    if (sortBy==="surface") {
      const order=["Hard","Clay","Grass","Carpet"];
      return order.indexOf(a.match.surface)-order.indexOf(b.match.surface);
    }
    return b.bestEV - a.bestEV;
  });

  const arbList = matchEdges.filter(e=>e.arb.isArb).sort((a,b)=>b.arb.arbPct-a.arb.arbPct);

  const sel = selectedMatch!==null ? matchEdges.find(e=>e.match.id===selectedMatch) : null;

  function calcStake(edge) {
    if (!edge?.best) return 0;
    return Math.max(settings.minStake, Math.min(settings.maxStake,
      Math.round(bankroll * Math.min(edge.bestK, settings.maxKellyPct/100))));
  }

  function placeBet(edge) {
    if (!edge?.best) return;
    const m = edge.match;
    const odds = edge.best==="p1" ? edge.bestP1.odds : edge.bestP2.odds;
    const book = edge.best==="p1" ? edge.bestP1.book : edge.bestP2.book;
    const stake = calcStake(edge);
    if (stake<=0 || stake>bankroll) return;
    const trueP = edge.best==="p1" ? edge.p1True : edge.p2True;
    const win = Math.random() < trueP;
    const profit = win ? stake*(odds-1) : -stake;
    const nb = Math.round((bankroll+profit)*100)/100;
    setBankroll(nb);
    setBetHistory(p=>[...p,{
      id:Date.now(), type:"sim", settled:true,
      match:`${m.p1.name} vs ${m.p2.name}`, tournament:m.tournament,
      pick: edge.best==="p1"?m.p1.name:m.p2.name, odds, stake, book:bookAbbr(book),
      profit:Math.round(profit*100)/100, bankroll:nb,
      value:edge.bestEV.toFixed(1)+"%", win, ts:Date.now(),
    }]);
  }

  function logManualBet() {
    const odds=parseFloat(betForm.odds), stake=parseFloat(betForm.stake);
    if(!betForm.match||!betForm.pick||isNaN(odds)||isNaN(stake)||odds<=1||stake<=0) return;
    setBetHistory(p=>[...p,{
      id:Date.now(), type:"manual", settled:false, win:null,
      match:betForm.match, tournament:"", pick:betForm.pick,
      odds, stake, book:bookAbbr(betForm.book),
      profit:null, bankroll:null, value:"–", ts:Date.now(),
    }]);
    setBetForm({match:"",pick:"",odds:"",stake:"",book:"epicbet"});
    setShowBetForm(false);
  }

  function settleBet(idx, win) {
    const bet=betHistory[idx];
    const profit=win?Math.round(bet.stake*(bet.odds-1)*100)/100:-bet.stake;
    const nb=Math.round((bankroll+profit)*100)/100;
    setBankroll(nb);
    setBetHistory(p=>{
      const updated=[...p];
      updated[idx]={...updated[idx],win,profit,bankroll:nb,settled:true};
      return updated;
    });
  }

  function calcTotalEV(w) {
    return allMatches.reduce((sum, m) => {
      const nvp = noVigProb(m);
      const p1E = calcEdge(m.p1, m.p2, m, w);
      const p2E = calcEdge(m.p2, m.p1, m, w);
      const {bestP1,bestP2} = getBestOdds(m);
      const p1True = Math.min(0.95, Math.max(0.05, nvp.p1 + (p1E.score-p2E.score)*0.5));
      const p2True = 1-p1True;
      return sum + Math.max(0, p1True*bestP1.odds-1) + Math.max(0, p2True*bestP2.odds-1);
    }, 0);
  }

  function runOptimizer() {
    setOptimizing(true);
    setOptimizerResult(null);
    setTimeout(() => {
      const wKeys = Object.keys(weights);
      let bestW = {...weights}, bestScore = calcTotalEV(weights);
      const baseline = bestScore;
      for (let i = 0; i < 4000; i++) {
        const trial = {...bestW};
        const k = wKeys[Math.floor(Math.random() * wKeys.length)];
        trial[k] = Math.max(0, Math.min(3, trial[k] + (Math.random()-0.5)*0.6));
        const s = calcTotalEV(trial);
        if (s > bestScore) { bestScore = s; bestW = {...trial}; }
      }
      setWeights(bestW);
      setOptimizerResult({before:Math.round(baseline*1000)/1000, after:Math.round(bestScore*1000)/1000, weights:bestW});
      setOptimizing(false);
    }, 100);
  }

  function runSim() {
    setSimRunning(true);
    setTimeout(()=>{
      const R=1000, results=[];
      for (let r=0;r<R;r++) {
        let b=bankroll;
        for (let i=0;i<200;i++) {
          const edge=0.03+Math.random()*0.04;
          const odds=settings.minOdds+Math.random()*(settings.maxOdds-settings.minOdds)*0.4;
          const k=kellyFraction(edge,odds,kellyFrac);
          const stake=Math.max(settings.minStake,Math.min(settings.maxStake,Math.round(b*Math.min(k,settings.maxKellyPct/100))));
          if(stake<=0||stake>b) continue;
          b+=Math.random()<(1/odds+edge)?stake*(odds-1):-stake;
          if(b<=0){b=0;break;}
        }
        results.push(Math.round(b));
      }
      results.sort((a,b)=>a-b);
      const avg=Math.round(results.reduce((a,b)=>a+b,0)/R);
      setSimResults({avg,median:results[R/2|0],p5:results[R*.05|0],p95:results[R*.95|0],
        bust:results.filter(r=>r<=0).length, doubled:results.filter(r=>r>=bankroll*2).length,
        runs:R, distribution:results});
      setSimRunning(false);
    }, 80);
  }

  // ── Color palette (comfortable dark mode — easier on eyes) ──
  const c = {
    bg:"#0d1117",   card:"#161b24",  hover:"#1c2334",  brd:"#243040",  brdL:"#2e3d55",
    g:"#00e87b",    r:"#ff5272",     y:"#f5c842",       b:"#5b9cff",    o:"#ff7a50",
    txt:"#d0d8e8",  dim:"#6b7a9a",   dimm:"#2e3d55",    w:"#eef2f8",
    arb:"#ffd700",
  };

  // ── Micro components ──
  const Badge = ({value,big}) => {
    const col = value>8?c.g:value>4?`#7adb5f`:value>0?c.y:c.r;
    return <span style={{padding:big?"4px 12px":"2px 8px",borderRadius:"6px",fontSize:big?"15px":"10px",
      fontWeight:700,background:`${col}15`,color:col,border:`1px solid ${col}30`}}>
      {value>0?"+":""}{value.toFixed(1)}% EV</span>;
  };

  const SurfacePip = ({surface}) => (
    <span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",
      background:SURFACE_C[surface]||c.dim,marginRight:5,verticalAlign:"middle"}} />
  );

  const BookTag = ({bookKey,highlight}) => {
    const col = highlight?c.arb:c.dim;
    return <span style={{padding:"1px 6px",borderRadius:3,fontSize:9,fontWeight:700,
      background:`${col}18`,color:col,border:`1px solid ${col}30`}}>
      {bookAbbr(bookKey)}</span>;
  };

  const OB = ({odds,ok,highlight}) => (
    <span style={{padding:"2px 8px",borderRadius:"5px",fontSize:12,fontWeight:700,fontFamily:"inherit",
      background:highlight?`${c.arb}20`:ok?`${c.b}15`:`${c.r}10`,
      color:highlight?c.arb:ok?c.b:c.dim,
      border:`1px solid ${highlight?c.arb+"40":ok?c.b+"30":c.dimm}`,
      textDecoration:ok?"none":"line-through",opacity:ok?1:0.5}}>
      {odds.toFixed(2)}</span>
  );

  const Pill = ({active,onClick,children,count}) => (
    <button onClick={onClick} style={{padding:"6px 14px",borderRadius:"20px",fontSize:10,fontWeight:600,
      letterSpacing:"1.5px",textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit",
      display:"flex",alignItems:"center",gap:6,
      border:`1px solid ${active?c.g+"50":c.brd}`,
      background:active?`${c.g}12`:"transparent",color:active?c.g:c.dim,transition:"all .15s"}}>
      {children}
      {count!==undefined&&<span style={{background:active?c.g:c.dimm,color:active?"#000":c.dim,
        borderRadius:8,padding:"1px 6px",fontSize:9,fontWeight:800}}>{count}</span>}
    </button>
  );

  const Btn = ({variant,onClick,disabled,children,style:sx}) => (
    <button onClick={onClick} disabled={disabled} style={{padding:"10px 20px",borderRadius:8,
      border:"none",fontFamily:"inherit",fontWeight:700,fontSize:11,letterSpacing:"1px",
      cursor:disabled?"default":"pointer",transition:"all .15s",opacity:disabled?0.5:1,
      background:variant==="g"?`linear-gradient(135deg,${c.g},#00b85f)`:variant==="r"?`${c.r}20`:variant==="arb"?`${c.arb}22`:c.brd,
      color:variant==="g"?"#000":variant==="r"?c.r:variant==="arb"?c.arb:c.txt,
      boxShadow:variant==="g"?`0 0 16px ${c.g}25`:"none",...sx}}>
      {children}
    </button>
  );

  const StatRow = ({label,v1,v2,highlight}) => (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
      padding:"4px 0",borderBottom:`1px solid ${c.bg}`}}>
      <span style={{fontSize:9,color:c.dim,letterSpacing:"1px"}}>{label}</span>
      <div style={{display:"flex",gap:12}}>
        <span style={{fontSize:11,fontWeight:600,color:highlight==="p1"?c.g:c.txt,minWidth:60,textAlign:"right"}}>{v1}</span>
        <span style={{fontSize:11,fontWeight:600,color:highlight==="p2"?c.g:c.txt,minWidth:60,textAlign:"right"}}>{v2}</span>
      </div>
    </div>
  );

  const TABS = [
    {id:"feed",    l:"📊 Matches",    hint:"Feed & odds comparison"},
    {id:"scanner", l:"⚡ Analyze",    hint:"Deep dive on a match"},
    {id:"arb",     l:"🎰 Arb",        hint:"Guaranteed profit opps"},
    {id:"research",l:"🔬 Research",   hint:"EV leaderboard & mispricing"},
    {id:"model",   l:"🧬 Model",      hint:"Factors, optimizer & simulation"},
    {id:"bets",    l:"📋 Bets",       hint:"Track your bet history"},
  ];

  // ── Login screen ──
  if (!isLoggedIn) return (
    <div style={{fontFamily:"'JetBrains Mono','SF Mono','Fira Code',monospace",background:c.bg,color:c.txt,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div style={{background:c.card,border:`1px solid ${c.brd}`,borderRadius:14,padding:"40px 48px",width:"100%",maxWidth:380,boxShadow:"0 8px 40px rgba(0,0,0,0.6)"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:22,fontWeight:800,letterSpacing:"4px",color:c.g,marginBottom:4}}>◆ EDGE MACHINE</div>
          <div style={{fontSize:8,color:c.dimm,letterSpacing:"2px"}}>v5.5 · SECURE ACCESS</div>
        </div>
        {[{k:"u",l:"USERNAME",ph:"Username",type:"text"},{k:"p",l:"PASSWORD",ph:"Password",type:"password"}].map(({k,l,ph,type})=>(
          <div key={k} style={{marginBottom:14}}>
            <div style={{fontSize:8,color:c.dim,letterSpacing:"1.5px",marginBottom:6}}>{l}</div>
            <input type={type} value={loginForm[k]} autoComplete={k==="p"?"current-password":"username"}
              onChange={e=>setLoginForm(p=>({...p,[k]:e.target.value}))}
              onKeyDown={e=>{ if(e.key==="Enter") handleLogin(); }}
              placeholder={ph}
              style={{width:"100%",padding:"10px 14px",borderRadius:7,background:c.bg,border:`1px solid ${c.brdL}`,
                color:c.w,fontFamily:"inherit",fontSize:12,outline:"none"}}/>
          </div>
        ))}
        {loginError&&<div style={{fontSize:10,color:c.r,marginBottom:12,textAlign:"center"}}>{loginError}</div>}
        <Btn variant="g" onClick={handleLogin} style={{width:"100%",padding:"12px",fontSize:11,letterSpacing:"2px",marginTop:4}}>SIGN IN</Btn>
      </div>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}`}</style>
    </div>
  );

  return (
    <div style={{fontFamily:"'JetBrains Mono','SF Mono','Fira Code',monospace",background:c.bg,color:c.txt,minHeight:"100vh"}}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>

      {/* ═══ HEADER ═══ */}
      <div style={{background:`linear-gradient(180deg,${c.card},${c.bg})`,borderBottom:`1px solid ${c.brd}`,padding:"14px 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,maxWidth:1440,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div>
              <div style={{fontSize:isMobile?13:15,fontWeight:800,letterSpacing:"3px",color:c.g,whiteSpace:"nowrap"}}>◆ EDGE MACHINE</div>
              <div style={{fontSize:8,color:c.dim,letterSpacing:"1.5px",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:8}}>
                <span>v5.4 · {allMatches.length} MATCHES</span>
                {epicbetData&&<span style={{color:"#00e87b",fontSize:7,letterSpacing:"1px",padding:"1px 6px",border:"1px solid #00e87b40",borderRadius:4}}>
                  🔗 EPIC {epicbetData.balance!=null?`€${epicbetData.balance.toFixed(2)}`:""}
                </span>}
                {epicbetStaging&&!epicbetData&&<span style={{color:c.y,fontSize:7,letterSpacing:"1px",padding:"1px 6px",border:"1px solid #f0c03040",borderRadius:4,cursor:"pointer"}} onClick={()=>setActiveTab("bets")}>
                  🔗 EPIC SYNC READY ↑
                </span>}
              </div>
            </div>
            <div style={{width:1,height:28,background:c.brd,margin:"0 4px"}}/>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:autoRefresh?c.g:c.dim,boxShadow:autoRefresh?`0 0 8px ${c.g}60`:"none"}}/>
              <span style={{fontSize:9,color:c.dim,letterSpacing:"1px"}}>{autoRefresh?"LIVE":"PAUSED"}</span>
            </div>
            {apiStatus==="ok"&&<div style={{display:"flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:12,background:`${c.b}15`,border:`1px solid ${c.b}30`}}>
              <span style={{fontSize:8,color:c.b,fontWeight:700}}>API CONNECTED</span>
            </div>}
            {arbList.length>0&&<div style={{display:"flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:12,
              background:`${c.arb}15`,border:`1px solid ${c.arb}30`,cursor:"pointer"}}
              onClick={()=>setActiveTab("arb")}>
              <span style={{fontSize:8,color:c.arb,fontWeight:700}}>◆ {arbList.length} ARB{arbList.length>1?"S":""} FOUND</span>
            </div>}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"nowrap"}}>
            {/* Editable bankroll */}
            <div style={{background:c.card,border:`1px solid ${editingBankroll?c.g+"60":c.brd}`,borderRadius:8,padding:"6px 14px",display:"flex",alignItems:"center",gap:8,cursor:"pointer",flexShrink:0}}
              onClick={()=>{if(!editingBankroll){setBankrollInput(bankroll.toString());setEditingBankroll(true);}}}>
              {!isMobile&&<span style={{fontSize:8,color:c.dim,letterSpacing:"1px"}}>BANKROLL</span>}
              {editingBankroll
                ? <input autoFocus value={bankrollInput} onChange={e=>setBankrollInput(e.target.value.replace(/[^0-9.]/g,""))}
                    onBlur={()=>{const v=parseFloat(bankrollInput);if(!isNaN(v)&&v>0){setBankroll(Math.round(v*100)/100);setStartingBankroll(Math.round(v*100)/100);setBetHistory([]);}setEditingBankroll(false);}}
                    onKeyDown={e=>{if(e.key==="Enter"){const v=parseFloat(bankrollInput);if(!isNaN(v)&&v>0){setBankroll(Math.round(v*100)/100);setStartingBankroll(Math.round(v*100)/100);setBetHistory([]);}setEditingBankroll(false);}else if(e.key==="Escape")setEditingBankroll(false);}}
                    onClick={e=>e.stopPropagation()}
                    style={{fontSize:isMobile?14:18,fontWeight:800,color:c.g,background:"transparent",border:"none",outline:"none",fontFamily:"inherit",width:90,textAlign:"right"}}/>
                : bankroll===0
                  ? <span style={{fontSize:isMobile?12:14,fontWeight:800,color:c.y}}>SET ↗</span>
                  : <span style={{fontSize:isMobile?14:18,fontWeight:800,color:bankroll>=startingBankroll?c.g:c.r}}>{settings.currency}{bankroll.toLocaleString()}</span>
              }
              {!editingBankroll&&<span style={{fontSize:9,color:c.dim}}>✏</span>}
            </div>
            {!isMobile&&[
              {l:"ROI",v:startingBankroll>0?`${((bankroll/startingBankroll-1)*100).toFixed(1)}%`:"–",col:bankroll>=startingBankroll?c.g:c.r},
              {l:"BETS",v:betHistory.length,col:c.b},
              {l:"VALUE",v:matchEdges.filter(e=>e.best).length,col:c.y},
            ].map((x,i)=>(
              <div key={i} style={{background:c.card,border:`1px solid ${c.brd}`,borderRadius:8,padding:"6px 12px",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                <span style={{fontSize:8,color:c.dim,letterSpacing:"1px"}}>{x.l}</span>
                <span style={{fontSize:13,fontWeight:800,color:x.col}}>{x.v}</span>
              </div>
            ))}
            <button onClick={()=>setShowSettings(!showSettings)} style={{background:showSettings?`${c.g}15`:c.card,border:`1px solid ${showSettings?c.g+"40":c.brd}`,borderRadius:8,padding:"8px 12px",cursor:"pointer",color:showSettings?c.g:c.dim,fontSize:14,fontFamily:"inherit",flexShrink:0}}>⚙</button>
            <div style={{display:"flex",alignItems:"center",gap:5,background:c.card,border:`1px solid ${c.brd}`,borderRadius:8,padding:"6px 10px",flexShrink:0}}>
              {!isMobile&&<span style={{fontSize:8,color:c.g,letterSpacing:"1px",fontWeight:700}}>ADMIN</span>}
              <button onClick={handleLogout} style={{background:"transparent",border:`1px solid ${c.r}40`,borderRadius:5,padding:"2px 8px",cursor:"pointer",color:c.r,fontSize:8,fontFamily:"inherit",letterSpacing:"1px",fontWeight:700}}>LOGOUT</button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SETTINGS PANEL ═══ */}
      {showSettings&&(
        <div style={{background:c.card,borderBottom:`1px solid ${c.brd}`,padding:"16px 20px"}}>
          <div style={{maxWidth:1440,margin:"0 auto"}}>
            {/* API Config */}
            <div style={{marginBottom:20,padding:"14px 16px",background:c.bg,borderRadius:10,border:`1px solid ${c.brdL}`}}>
              <div style={{fontSize:9,letterSpacing:"3px",color:c.b,marginBottom:12}}>📡 LIVE DATA — THE ODDS API</div>
              <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:8}}>
                <input value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="Enter your API key from the-odds-api.com"
                  style={{flex:1,minWidth:280,padding:"8px 12px",borderRadius:6,background:`${c.brd}`,border:`1px solid ${c.brdL}`,
                    color:c.w,fontFamily:"inherit",fontSize:11,outline:"none"}}/>
                <select value={apiSport} onChange={e=>setApiSport(e.target.value)}
                  style={{padding:"8px 10px",borderRadius:6,background:c.brd,border:`1px solid ${c.brdL}`,color:c.txt,fontFamily:"inherit",fontSize:11}}>
                  <option value="tennis_atp">ATP Tennis</option>
                  <option value="tennis_wta">WTA Tennis</option>
                </select>
                <Btn variant="g" onClick={connectAPI} disabled={apiStatus==="loading"||!apiKey.trim()} style={{padding:"8px 16px",fontSize:10}}>
                  {apiStatus==="loading"?"CONNECTING...":"CONNECT & FETCH"}
                </Btn>
              </div>
              {apiStatus==="ok"&&<div style={{fontSize:10,color:c.g}}>✓ Fetched {apiData?.length||0} live ATP matches · Real odds from 20+ bookmakers</div>}
              {apiStatus==="error"&&<div style={{fontSize:10,color:c.r}}>✕ {apiError} · Check your API key at the-odds-api.com</div>}
              <div style={{fontSize:9,color:c.dim,marginTop:6}}>Free tier: 500 req/mo · Remaining requests shown in API dashboard · <span style={{color:c.b}}>the-odds-api.com</span></div>
            </div>
            <div style={{fontSize:9,letterSpacing:"3px",color:c.dim,marginBottom:14}}>BETTING LIMITS & FILTERS</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))",gap:12}}>
              {[
                {key:"minOdds",label:"MIN ODDS",min:1.01,max:5,step:0.05},
                {key:"maxOdds",label:"MAX ODDS",min:2,max:20,step:0.5},
                {key:"minEV",label:"MIN EV %",min:0,max:20,step:0.5},
                {key:"maxKellyPct",label:"MAX KELLY %",min:1,max:50,step:1},
                {key:"minStake",label:"MIN STAKE",min:1,max:100,step:1},
                {key:"maxStake",label:"MAX STAKE",min:10,max:5000,step:10},
              ].map(({key,label,min,max,step})=>(
                <div key={key} style={{background:c.bg,borderRadius:8,padding:"10px 14px",border:`1px solid ${c.brd}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontSize:9,color:c.dim,letterSpacing:"1.5px"}}>{label}</span>
                    <span style={{fontSize:14,fontWeight:800,color:key==="minOdds"?c.y:c.g}}>
                      {key.includes("Stake")?settings.currency:""}{settings[key].toFixed(key.includes("Odds")?2:0)}{key.includes("EV")||key.includes("Kelly")?"%":""}
                    </span>
                  </div>
                  <input type="range" min={min} max={max} step={step} value={settings[key]}
                    onChange={e=>setSettings(p=>({...p,[key]:+e.target.value}))}
                    style={{width:"100%",accentColor:key==="minOdds"?c.y:c.g}}/>
                </div>
              ))}
              <div style={{background:c.bg,borderRadius:8,padding:"10px 14px",border:`1px solid ${c.brd}`,display:"flex",flexDirection:"column",justifyContent:"center",gap:8}}>
                <div style={{fontSize:9,color:c.dim,letterSpacing:"1.5px"}}>AUTO-REFRESH</div>
                <button onClick={()=>setAutoRefresh(!autoRefresh)} style={{background:autoRefresh?`${c.g}20`:`${c.r}20`,border:`1px solid ${autoRefresh?c.g+"40":c.r+"40"}`,borderRadius:6,padding:6,cursor:"pointer",color:autoRefresh?c.g:c.r,fontSize:11,fontWeight:700,fontFamily:"inherit"}}>
                  {autoRefresh?"● ENABLED (30s)":"○ DISABLED"}</button>
                <div style={{fontSize:9,color:c.dim,letterSpacing:"1px"}}>CURRENCY</div>
                <select value={settings.currency} onChange={e=>setSettings(p=>({...p,currency:e.target.value}))}
                  style={{background:c.brd,border:`1px solid ${c.brdL}`,borderRadius:6,padding:"4px 8px",color:c.txt,fontFamily:"inherit",fontSize:11}}>
                  {["€","$","£","kr","CHF"].map(x=><option key={x}>{x}</option>)}
                </select>
              </div>
            </div>
            <div style={{marginTop:10,padding:"8px 12px",background:`${c.y}08`,border:`1px solid ${c.y}20`,borderRadius:6}}>
              <span style={{fontSize:10,color:c.y}}>⚠ Min odds filter {settings.minOdds.toFixed(2)} · Best available odds shown across {BOOKS.length} bookmakers · Pinnacle used as sharp market reference</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ NAV TABS ═══ */}
      <div style={{borderBottom:`1px solid ${c.brd}`,background:c.card,position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",maxWidth:1440,margin:"0 auto",overflowX:"auto",alignItems:"stretch"}}>
          {TABS.map(t=>{
            const active = activeTab===t.id;
            const accent = t.id==="arb"?c.arb:c.g;
            return (
              <button key={t.id} onClick={()=>setActiveTab(t.id)} title={t.hint}
                style={{padding:"14px 22px",cursor:"pointer",fontSize:11,fontWeight:active?700:500,
                  letterSpacing:"0.5px",color:active?accent:c.dim,
                  background:active?`${accent}0d`:"transparent",border:"none",fontFamily:"inherit",
                  borderBottom:`2px solid ${active?accent:"transparent"}`,
                  transition:"all .15s",whiteSpace:"nowrap",position:"relative",flexShrink:0}}>
                {t.l}
                {t.id==="arb"&&arbList.length>0&&(
                  <span style={{position:"absolute",top:10,right:10,minWidth:16,height:16,borderRadius:8,
                    background:c.arb,color:"#000",fontSize:8,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>
                    {arbList.length}
                  </span>
                )}
              </button>
            );
          })}
          <div style={{flex:1}}/>
          {/* Epicbet Mode Toggle — always visible in nav */}
          <button onClick={()=>setEpicbetMode(!epicbetMode)} title="Show only Epicbet odds"
            style={{padding:"0 18px",cursor:"pointer",fontSize:10,fontWeight:700,border:"none",fontFamily:"inherit",
              background:epicbetMode?`${c.g}15`:"transparent",
              color:epicbetMode?c.g:c.dim,borderBottom:`2px solid ${epicbetMode?c.g:"transparent"}`,
              transition:"all .15s",whiteSpace:"nowrap",letterSpacing:"0.5px",flexShrink:0}}>
            {epicbetMode?"✓ EPIC MODE":"EPIC"}
          </button>
        </div>
      </div>

      {/* ═══ EPICBET IMPORT BANNER ═══ */}
      {epicbetStaging&&(()=>{
        const s = epicbetStaging;
        const openCount = (s.openBets||[]).length;
        const settledCount = (s.settledBets||[]).length;
        const syncAge = s.lastSync ? Math.round((Date.now()-s.lastSync)/60000) : null;
        return (
          <div style={{background:`linear-gradient(90deg,#0a1a0f,${c.card})`,borderBottom:`2px solid ${c.g}50`,padding:"10px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",maxWidth:1440,margin:"0 auto",gap:12,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:9,color:c.g,fontWeight:800,letterSpacing:"2px"}}>🔗 EPICBET SYNC READY</span>
                {syncAge!=null&&<span style={{fontSize:8,color:c.dimm}}>{syncAge}m ago</span>}
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {s.balance!=null&&<span style={{fontSize:10,fontWeight:700,color:c.g,padding:"2px 8px",background:`${c.g}15`,borderRadius:4}}>
                    €{s.balance.toFixed(2)} balance
                  </span>}
                  {openCount>0&&<span style={{fontSize:10,fontWeight:700,color:c.y,padding:"2px 8px",background:`${c.y}15`,borderRadius:4}}>
                    {openCount} open bet{openCount>1?"s":""}
                  </span>}
                  {settledCount>0&&<span style={{fontSize:10,color:c.dim,padding:"2px 8px",background:`${c.brd}`,borderRadius:4}}>
                    {settledCount} settled
                  </span>}
                  {openCount===0&&settledCount===0&&<span style={{fontSize:9,color:c.dimm}}>bet slips detected</span>}
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <Btn variant="g" onClick={approveEpicbetImport} style={{padding:"6px 18px",fontSize:10,letterSpacing:"1px"}}>IMPORT</Btn>
                <button onClick={dismissEpicbetImport} style={{padding:"6px 14px",borderRadius:6,fontSize:10,cursor:"pointer",
                  border:`1px solid ${c.brd}`,background:"transparent",color:c.dim,fontFamily:"inherit"}}>Dismiss</button>
              </div>
            </div>
          </div>
        );
      })()}

      <div style={{padding:20,maxWidth:1440,margin:"0 auto"}}>

        {/* ════ FEED ════ */}
        {activeTab==="feed"&&(<>
          {/* Top picks banner */}
          {matchEdges.filter(e=>e.best&&e.bestEV>0).length>0&&(
            <div style={{background:`linear-gradient(135deg,#0a1a12,${c.card})`,border:`1px solid ${c.g}25`,borderRadius:10,padding:"12px 16px",marginBottom:16}}>
              <div style={{fontSize:9,letterSpacing:"3px",color:c.g,marginBottom:8}}>◆ TOP VALUE BETS RIGHT NOW</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {matchEdges.filter(e=>e.best&&e.bestEV>0).sort((a,b)=>b.bestEV-a.bestEV).slice(0,4).map((e,i)=>(
                  <div key={i} onClick={()=>{setSelectedMatch(e.match.id);setActiveTab("scanner");}}
                    style={{flex:"1 1 180px",background:`${c.g}08`,border:`1px solid ${c.g}20`,borderRadius:8,padding:"10px 12px",cursor:"pointer",minWidth:180}}>
                    <div style={{fontSize:10,fontWeight:700,color:c.w}}>{e.bestPlayer?.name}</div>
                    <div style={{fontSize:9,color:c.dim,marginBottom:6}}>{e.match.tournament}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <OB odds={e.bestOdds} ok={true}/>
                      <Badge value={e.bestEV}/>
                    </div>
                    <div style={{fontSize:8,color:c.dim,marginTop:4}}>
                      <BookTag bookKey={e.bestBook}/> · K {(e.bestK*100).toFixed(1)}% · {settings.currency}{calcStake(e)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:8,color:c.dimm,letterSpacing:"1px",marginRight:2}}>CIRCUIT</span>
              {["all","ATP","WTA","CH","ITF"].map(cf=>(
                <button key={cf} onClick={()=>setCircuitFilter(cf)} style={{padding:"3px 10px",borderRadius:12,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .15s",
                  border:`1px solid ${circuitFilter===cf?(CIRCUIT_COLOR[cf]||c.g)+"55":c.brd}`,
                  background:circuitFilter===cf?`${CIRCUIT_COLOR[cf]||c.g}18`:"transparent",
                  color:circuitFilter===cf?(CIRCUIT_COLOR[cf]||c.g):c.dim}}>
                  {cf==="all"?"ALL":cf}
                  <span style={{marginLeft:4,fontSize:8,opacity:0.7}}>{cf==="all"?allMatches.length:allMatches.filter(m=>m.circuit===cf).length}</span>
                </button>
              ))}
            </div>
          </div>
          {apiStatus!=="ok"&&(
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:8,background:`${c.b}08`,border:`1px solid ${c.b}20`,marginBottom:12}}>
              <span style={{fontSize:9,color:c.b}}>📡</span>
              <span style={{fontSize:9,color:c.dim}}>Showing <span style={{color:c.w,fontWeight:600}}>scheduled upcoming matches</span> — no live scores without API. Connect The Odds API in ⚙ settings for real-time data.</span>
            </div>
          )}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <Pill active={feedFilter==="pre"} onClick={()=>setFeedFilter("pre")} count={matchEdges.filter(e=>e.match.status==="PRE"&&(circuitFilter==="all"||e.match.circuit===circuitFilter)).length}>Upcoming</Pill>
              <Pill active={feedFilter==="value"} onClick={()=>setFeedFilter("value")} count={matchEdges.filter(e=>e.best&&(circuitFilter==="all"||e.match.circuit===circuitFilter)).length}>Value</Pill>
              <Pill active={feedFilter==="all"} onClick={()=>setFeedFilter("all")} count={allMatches.length}>All</Pill>
              {apiStatus==="ok"&&<Pill active={feedFilter==="live"} onClick={()=>setFeedFilter("live")} count={matchEdges.filter(e=>e.match.status==="LIVE"&&(circuitFilter==="all"||e.match.circuit===circuitFilter)).length}>🔴 Live</Pill>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              {/* Sort controls */}
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <span style={{fontSize:9,color:c.dim,letterSpacing:"1px"}}>SORT:</span>
                {[{v:"ev",l:"EV"},{v:"time",l:"Time"},{v:"circuit",l:"Circuit"},{v:"surface",l:"Surface"}].map(s=>(
                  <button key={s.v} onClick={()=>setSortBy(s.v)}
                    style={{padding:"4px 10px",borderRadius:10,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"inherit",
                      border:`1px solid ${sortBy===s.v?c.b+"60":c.brd}`,
                      background:sortBy===s.v?`${c.b}14`:"transparent",
                      color:sortBy===s.v?c.b:c.dim,transition:"all .15s"}}>
                    {s.l}
                  </button>
                ))}
              </div>
              {/* View toggle: cards vs odds table */}
              <div style={{display:"flex",background:c.card,borderRadius:8,border:`1px solid ${c.brd}`,overflow:"hidden"}}>
                {[{v:"cards",l:"Cards"},{v:"odds",l:"Odds Table"}].map(v=>(
                  <button key={v.v} onClick={()=>setFeedView(v.v)}
                    style={{padding:"5px 12px",fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"inherit",border:"none",
                      background:feedView===v.v?`${c.b}20`:"transparent",
                      color:feedView===v.v?c.b:c.dim,transition:"all .15s"}}>
                    {v.l}
                  </button>
                ))}
              </div>
              <button onClick={()=>setLastRefresh(Date.now())} style={{background:c.card,border:`1px solid ${c.brd}`,borderRadius:6,padding:"5px 12px",cursor:"pointer",color:c.g,fontSize:10,fontFamily:"inherit",fontWeight:600,letterSpacing:"1px"}}>↻</button>
            </div>
          </div>

          {/* ── Odds Table View ── */}
          {feedView==="odds"&&(
            <div style={{marginBottom:8}}>
              {filtered.map(m=>{
                const {bestP1,bestP2}=getBestOdds(m.match);
                const edge=m;
                const sc=SURFACE_C[m.match.surface]||c.dim;
                return (
                  <div key={m.match.id} style={{background:c.card,border:`1px solid ${c.brd}`,borderRadius:10,marginBottom:8,overflow:"hidden"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:`1px solid ${c.brd}`,cursor:"pointer",background:`${sc}08`}}
                      onClick={()=>{setSelectedMatch(m.match.id);setActiveTab("scanner");}}>
                      <SurfacePip surface={m.match.surface}/>
                      <span style={{padding:"1px 6px",borderRadius:3,fontSize:8,background:m.match.status==="LIVE"?`${c.g}18`:`${c.b}12`,color:m.match.status==="LIVE"?c.g:c.b}}>
                        {m.match.status==="LIVE"?"● LIVE":`◎ ${m.match.startTime}`}</span>
                      <span style={{fontSize:11,fontWeight:600,color:c.w}}>{m.match.p1.flag} {m.match.p1.name} vs {m.match.p2.flag} {m.match.p2.name}</span>
                      <span style={{fontSize:10,color:c.dim,marginLeft:4}}>{m.match.tournament} · {m.match.round}</span>
                      {edge?.best&&<Badge value={edge.bestEV}/>}
                    </div>
                    <div style={{overflowX:"auto"}}>
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:460}}>
                        <thead><tr style={{background:c.bg}}>
                          <th style={{padding:"6px 16px",textAlign:"left",fontSize:8,color:c.dim,fontWeight:600,width:90}}>PLAYER</th>
                          {BOOKS.filter(b=>m.match.odds[b.key]).map(b=>(
                            <th key={b.key} style={{padding:"6px 12px",textAlign:"center",fontSize:8,
                              color:epicbetMode&&b.key==="epicbet"?c.g:b.key==="pinnacle"?c.b:c.dim,fontWeight:600}}>
                              {b.abbr}{epicbetMode&&b.key==="epicbet"&&<span style={{color:c.g}}> ✓</span>}
                            </th>
                          ))}
                          <th style={{padding:"6px 12px",textAlign:"center",fontSize:8,color:c.g,fontWeight:600}}>BEST</th>
                        </tr></thead>
                        <tbody>
                          {[{p:m.match.p1,side:"p1",best:bestP1},{p:m.match.p2,side:"p2",best:bestP2}].map(({p,side,best},ri)=>(
                            <tr key={ri} style={{borderTop:`1px solid ${c.brd}`}}>
                              <td style={{padding:"8px 16px",fontSize:10,fontWeight:600,color:c.txt,whiteSpace:"nowrap"}}>{p.flag} {p.name.split(" ").pop()}</td>
                              {BOOKS.filter(b=>m.match.odds[b.key]).map(b=>{
                                const odds=m.match.odds[b.key]?.[side];
                                const isBest=odds&&odds===best.odds;
                                const isEpic=b.key==="epicbet";
                                return (
                                  <td key={b.key} style={{padding:"8px 12px",textAlign:"center",
                                    opacity:epicbetMode&&!isEpic?0.35:1,
                                    background:isBest?`${c.g}10`:b.key==="pinnacle"?`${c.b}05`:"transparent"}}>
                                    <span style={{fontWeight:700,fontSize:13,color:isBest?c.g:b.key==="pinnacle"?c.b:c.txt}}>
                                      {odds?odds.toFixed(2):"–"}</span>
                                    {isBest&&<div style={{fontSize:7,color:c.g}}>▲BEST</div>}
                                  </td>
                                );
                              })}
                              <td style={{padding:"8px 12px",textAlign:"center",background:`${c.g}08`}}>
                                <span style={{fontWeight:800,fontSize:14,color:c.g}}>{best.odds.toFixed(2)}</span>
                                <div style={{fontSize:8,color:c.g}}>{bookAbbr(best.book)}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Cards View ── */}
          <div style={{display:feedView==="cards"?"flex":"none",flexDirection:"column",gap:8}}>
            {filtered.map(edge=>{
              const m=edge.match, has=edge.best!==null, isArb=edge.arb.isArb;
              const sc=SURFACE_C[m.surface]||c.dim;
              return (
                <div key={m.id} onClick={()=>{setSelectedMatch(m.id);setActiveTab("scanner");}}
                  style={{background:c.card,
                    border:`1px solid ${isArb?c.arb+"40":has?c.g+"22":c.brd}`,
                    borderRadius:10,padding:"14px 18px",cursor:"pointer",transition:"all .15s",
                    borderLeft:`3px solid ${isArb?c.arb:has?c.g:c.brd}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                    <div style={{flex:1,minWidth:220}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                        <span style={{padding:"2px 7px",borderRadius:4,fontSize:9,fontWeight:700,letterSpacing:"1px",
                          background:m.status==="LIVE"?`${c.g}18`:`${c.b}15`,color:m.status==="LIVE"?c.g:c.b}}>
                          {m.status==="LIVE"?"● LIVE":`◎ ${m.startTime}`}</span>
                        <SurfacePip surface={m.surface}/>
                        <span style={{fontSize:10,color:c.dim}}>{m.tournament} · {m.round}</span>
                        {m.circuit&&<span style={{padding:"1px 6px",borderRadius:4,fontSize:8,fontWeight:700,
                          background:`${CIRCUIT_COLOR[m.circuit]||c.dim}18`,color:CIRCUIT_COLOR[m.circuit]||c.dim}}>
                          {m.circuit} · {m.level}</span>}
                        {isArb&&<span style={{padding:"1px 7px",borderRadius:4,fontSize:9,fontWeight:800,background:`${c.arb}20`,color:c.arb,border:`1px solid ${c.arb}30`}}>ARB +{edge.arb.arbPct.toFixed(2)}%</span>}
                        {m.fromAPI&&<span style={{padding:"1px 5px",borderRadius:3,fontSize:8,background:`${c.b}15`,color:c.b}}>LIVE API</span>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:16}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:600,color:c.w}}>{m.p1.flag} {m.p1.name} {m.p1.rank<900&&<span style={{color:c.dim,fontSize:10}}>#{m.p1.rank}</span>}</div>
                          <div style={{fontSize:13,fontWeight:600,color:c.w,marginTop:2}}>{m.p2.flag} {m.p2.name} {m.p2.rank<900&&<span style={{color:c.dim,fontSize:10}}>#{m.p2.rank}</span>}</div>
                        </div>
                        {m.status==="LIVE"&&<div style={{textAlign:"center"}}>
                          <div style={{fontSize:14,fontWeight:800,color:c.w}}>{m.game}</div>
                          <div style={{fontSize:11,color:c.y}}>{m.point}</div>
                        </div>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:12}}>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:8,color:c.dim,letterSpacing:"1px",marginBottom:3}}>BEST P1</div>
                        <OB odds={edge.bestP1.odds} ok={edge.p1Ok} highlight={isArb&&edge.arb.bestP1.book===edge.bestP1.book}/>
                        <div style={{fontSize:8,color:c.dimm,marginTop:2}}><BookTag bookKey={edge.bestP1.book}/></div>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:8,color:c.dim,letterSpacing:"1px",marginBottom:3}}>BEST P2</div>
                        <OB odds={edge.bestP2.odds} ok={edge.p2Ok} highlight={isArb&&edge.arb.bestP2.book===edge.bestP2.book}/>
                        <div style={{fontSize:8,color:c.dimm,marginTop:2}}><BookTag bookKey={edge.bestP2.book}/></div>
                      </div>
                    </div>
                    <div style={{textAlign:"right",minWidth:140}}>
                      {has?(<>
                        <Badge value={edge.bestEV}/>
                        <div style={{fontSize:10,color:c.g,marginTop:6}}>{edge.bestPlayer.name} · K {(edge.bestK*100).toFixed(1)}%</div>
                        <div style={{fontSize:10,color:c.dim,marginTop:2}}>Stake: {settings.currency}{calcStake(edge)}</div>
                      </>):<span style={{fontSize:10,color:c.dim}}>No value</span>}
                    </div>
                    {has&&<Btn variant="g" onClick={e=>{e.stopPropagation();placeBet(edge);}} style={{padding:"8px 14px",fontSize:10}}>BET</Btn>}
                  </div>
                  <div style={{fontSize:9,color:c.dimm,marginTop:6}}>Updated {timeAgo(m.updated)} · Margin: {bookMargin(edge.bestP1.odds,edge.bestP2.odds).toFixed(1)}%</div>
                </div>
              );
            })}
            {filtered.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:c.dim}}><div style={{fontSize:28,marginBottom:8}}>◇</div><div style={{fontSize:12}}>No matches match current filters.</div></div>}
          </div>
        </>)}

        {/* ════ SCANNER ════ */}
        {activeTab==="scanner"&&(<>
          <div style={{display:"flex",gap:0,borderRadius:12,border:`1px solid ${c.brd}`,overflow:"hidden",minHeight:"75vh",flexDirection:isMobile?"column":"row"}}>

            {/* ── Left sidebar: grouped by circuit ── */}
            <div style={{width:isMobile?"100%":240,borderRight:isMobile?"none":`1px solid ${c.brd}`,borderBottom:isMobile?`1px solid ${c.brd}`:"none",background:c.card,flexShrink:0,overflowY:"auto",maxHeight:isMobile?260:"75vh"}}>
              <div style={{padding:"10px 12px",borderBottom:`1px solid ${c.brd}`,background:c.bg}}>
                <div style={{fontSize:8,color:c.dim,letterSpacing:"2px",marginBottom:4}}>SELECT MATCH</div>
                <div style={{fontSize:9,color:c.dimm}}>{allMatches.length} matches · {allMatches.filter(m=>m.status==="LIVE").length} live</div>
              </div>
              {["ATP","WTA","CH","ITF"].map(circuit=>{
                const cms = allMatches.filter(m=>m.circuit===circuit);
                if(!cms.length) return null;
                const cc = CIRCUIT_COLOR[circuit]||c.dim;
                return (
                  <div key={circuit}>
                    <div style={{padding:"7px 14px",background:`${cc}0c`,borderBottom:`1px solid ${c.brd}`,display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:8,fontWeight:800,letterSpacing:"2px",color:cc}}>{circuit}</span>
                      <span style={{fontSize:8,color:c.dimm}}>{cms.length}</span>
                    </div>
                    {cms.map(m=>{
                      const isSelected=selectedMatch===m.id;
                      const edge=matchEdges.find(e=>e.match.id===m.id);
                      const hasVal=edge?.best!=null;
                      return (
                        <button key={m.id} onClick={()=>setSelectedMatch(m.id)}
                          style={{width:"100%",textAlign:"left",padding:"10px 14px",cursor:"pointer",fontFamily:"inherit",border:"none",
                            borderBottom:`1px solid ${c.brd}`,borderLeft:`3px solid ${isSelected?cc:"transparent"}`,
                            background:isSelected?`${cc}12`:m.status==="LIVE"?`${c.g}05`:"transparent",
                            color:isSelected?cc:c.txt,transition:"all .12s"}}>
                          <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                            <span style={{fontSize:9,fontWeight:700,
                              color:m.status==="LIVE"?c.g:c.dim}}>
                              {m.status==="LIVE"?"●":""} {m.status==="LIVE"?"LIVE":m.startTime}
                            </span>
                            <SurfacePip surface={m.surface}/>
                            {hasVal&&<span style={{fontSize:7,fontWeight:700,color:c.g}}>EV</span>}
                          </div>
                          <div style={{fontSize:10,fontWeight:600,color:isSelected?cc:c.w,lineHeight:1.3}}>{m.p1.name}</div>
                          <div style={{fontSize:10,color:isSelected?`${cc}cc`:c.dim,lineHeight:1.3}}>{m.p2.name}</div>
                          <div style={{fontSize:8,color:c.dimm,marginTop:2}}>{m.tournament}</div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* ── Right analysis panel ── */}
            <div style={{flex:1,padding:isMobile?14:20,overflowY:"auto"}}>


          {sel?(()=>{
            const m=sel.match;
            const nvp=noVigProb(m);
            return (<>
              {/* Match header */}
              <div style={{background:`linear-gradient(135deg,${c.card},#0a1218)`,border:`1px solid ${c.brd}`,borderRadius:10,padding:18,marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <SurfacePip surface={m.surface}/>
                  <span style={{fontSize:9,color:c.dim,letterSpacing:"2px"}}>{m.tournament.toUpperCase()} — {m.round} — <span style={{color:SURFACE_C[m.surface]||c.dim}}>{m.surface.toUpperCase()}</span></span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                  <div style={{display:"flex",gap:20,alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:17,fontWeight:700,color:c.w}}>{m.p1.flag} {m.p1.name}</div>
                      <div style={{fontSize:10,color:c.dim}}>{m.p1.rank<900?`ATP #${m.p1.rank} ·`:""} Age {m.p1.age} · {m.p1.hand}-handed</div>
                      <div style={{fontSize:9,color:c.dimm,marginTop:2}}>Form: {m.p1.recent_form.map(x=>x?"W":"L").join("-")} · Surface WR: {(m.p1.surface_wr*100).toFixed(0)}%</div>
                    </div>
                    <span style={{color:c.dimm,fontSize:14}}>vs</span>
                    <div>
                      <div style={{fontSize:17,fontWeight:700,color:c.w}}>{m.p2.flag} {m.p2.name}</div>
                      <div style={{fontSize:10,color:c.dim}}>{m.p2.rank<900?`ATP #${m.p2.rank} ·`:""} Age {m.p2.age} · {m.p2.hand}-handed</div>
                      <div style={{fontSize:9,color:c.dimm,marginTop:2}}>Form: {m.p2.recent_form.map(x=>x?"W":"L").join("-")} · Surface WR: {(m.p2.surface_wr*100).toFixed(0)}%</div>
                    </div>
                  </div>
                  {m.status==="LIVE"&&<div style={{textAlign:"right"}}>
                    <span style={{padding:"2px 8px",borderRadius:4,fontSize:9,fontWeight:700,background:`${c.g}18`,color:c.g}}>● LIVE</span>
                    <div style={{fontSize:20,fontWeight:800,color:c.w,marginTop:4}}>{m.game}</div>
                    <div style={{fontSize:12,color:c.y}}>{m.point}</div>
                  </div>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:8,marginTop:14}}>
                  {[
                    {l:"H2H",v1:m.p1.h2h,v2:m.p2.h2h},
                    {l:"NO-VIG PROB",v1:`${(nvp.p1*100).toFixed(1)}%`,v2:`${(nvp.p2*100).toFixed(1)}%`},
                    {l:"TRUE PROB",v1:`${(sel.p1True*100).toFixed(1)}%`,v2:`${(sel.p2True*100).toFixed(1)}%`},
                    {l:"MARKET MARGIN",v1:`${bookMargin(m.odds.pinnacle?.p1||0,m.odds.pinnacle?.p2||0).toFixed(2)}%`,v2:"Pinnacle"},
                  ].map((row,i)=>(
                    <div key={i} style={{background:c.bg,borderRadius:6,padding:"8px 10px",textAlign:"center"}}>
                      <div style={{fontSize:8,color:c.dim,marginBottom:4}}>{row.l}</div>
                      <div style={{fontSize:11,fontWeight:700,color:c.txt}}>{row.v1} <span style={{color:c.dimm}}>·</span> {row.v2}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* EV cards */}
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:14}}>
                {[
                  {p:m.p1,val:sel.p1Val,trueP:sel.p1True,k:sel.p1K,ok:sel.p1Ok,bo:sel.bestP1,side:"p1"},
                  {p:m.p2,val:sel.p2Val,trueP:sel.p2True,k:sel.p2K,ok:sel.p2Ok,bo:sel.bestP2,side:"p2"},
                ].map(({p,val,trueP,k,ok,bo,side},i)=>(
                  <div key={i} style={{background:c.card,border:`1px solid ${val>0&&ok?c.g+"30":c.brd}`,borderRadius:10,padding:16}}>
                    <div style={{fontSize:9,color:c.dim,letterSpacing:"2px",marginBottom:10}}>{p.name.toUpperCase()}</div>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                      <div>
                        <div style={{fontSize:9,color:c.dim}}>SHARP (Pinnacle)</div>
                        <div style={{fontSize:20,fontWeight:800,color:c.dim}}>{(m.odds.pinnacle?.[side]||bo.odds).toFixed(2)}</div>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:9,color:c.dim}}>BEST ODDS</div>
                        <div style={{fontSize:20,fontWeight:800,color:c.b}}>{bo.odds.toFixed(2)}</div>
                        <BookTag bookKey={bo.book} highlight={true}/>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:9,color:c.dim}}>EV</div>
                        <Badge value={val} big/>
                      </div>
                    </div>
                    <div style={{background:c.bg,borderRadius:6,padding:"8px 10px",marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:9,color:c.dim}}>No-vig implied</span>
                        <span style={{fontSize:10,fontWeight:700,color:c.txt}}>{(noVigProb(m)[side]*100).toFixed(1)}%</span>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between"}}>
                        <span style={{fontSize:9,color:c.dim}}>True (after edge)</span>
                        <span style={{fontSize:10,fontWeight:700,color:val>0?c.g:c.r}}>{(trueP*100).toFixed(1)}%</span>
                      </div>
                    </div>
                    {!ok&&<div style={{padding:"6px 10px",background:`${c.r}08`,borderRadius:6,border:`1px solid ${c.r}20`,fontSize:10,color:c.r}}>✕ Below min odds ({settings.minOdds.toFixed(2)})</div>}
                    {val>0&&ok&&<div style={{padding:"8px 10px",background:`${c.g}08`,borderRadius:6,border:`1px solid ${c.g}20`,display:"flex",justifyContent:"space-between",fontSize:10}}>
                      <span style={{color:c.dim}}>Kelly: {(k*100).toFixed(1)}%</span>
                      <span style={{color:c.g,fontWeight:700}}>Stake: {settings.currency}{Math.max(settings.minStake,Math.min(settings.maxStake,Math.round(bankroll*Math.min(k,settings.maxKellyPct/100))))}</span>
                    </div>}
                  </div>
                ))}
              </div>

              {/* Bookmaker odds table */}
              <div style={{background:c.card,border:`1px solid ${c.brd}`,borderRadius:10,padding:16,marginBottom:14}}>
                <div style={{fontSize:9,letterSpacing:"3px",color:c.dim,marginBottom:12}}>BOOKMAKER ODDS COMPARISON</div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead>
                      <tr>
                        <th style={{padding:"6px 8px",textAlign:"left",fontSize:9,color:c.dim,fontWeight:600,letterSpacing:"1px"}}>BOOKMAKER</th>
                        <th style={{padding:"6px 8px",textAlign:"center",fontSize:9,color:c.dim,fontWeight:600,letterSpacing:"1px"}}>{m.p1.name}</th>
                        <th style={{padding:"6px 8px",textAlign:"center",fontSize:9,color:c.dim,fontWeight:600,letterSpacing:"1px"}}>{m.p2.name}</th>
                        <th style={{padding:"6px 8px",textAlign:"right",fontSize:9,color:c.dim,fontWeight:600,letterSpacing:"1px"}}>MARGIN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(m.odds).map(([key,v])=>{
                        const isBestP1=v.p1===sel.bestP1.odds;
                        const isBestP2=v.p2===sel.bestP2.odds;
                        const mg=bookMargin(v.p1,v.p2);
                        return (
                          <tr key={key} style={{borderBottom:`1px solid ${c.bg}`,background:key==="pinnacle"?`${c.b}05`:"transparent"}}>
                            <td style={{padding:"7px 8px"}}>
                              <span style={{fontSize:10,fontWeight:600,color:key==="pinnacle"?c.b:c.txt}}>{BOOKS.find(b=>b.key===key)?.name||key}</span>
                              {key==="pinnacle"&&<span style={{fontSize:8,color:c.b,marginLeft:6}}>SHARP</span>}
                            </td>
                            <td style={{padding:"7px 8px",textAlign:"center"}}>
                              <span style={{fontWeight:700,color:isBestP1?c.g:c.txt,fontSize:13}}>
                                {v.p1.toFixed(2)}
                              </span>
                              {isBestP1&&<span style={{fontSize:8,color:c.g,marginLeft:4}}>▲BEST</span>}
                            </td>
                            <td style={{padding:"7px 8px",textAlign:"center"}}>
                              <span style={{fontWeight:700,color:isBestP2?c.g:c.txt,fontSize:13}}>
                                {v.p2.toFixed(2)}
                              </span>
                              {isBestP2&&<span style={{fontSize:8,color:c.g,marginLeft:4}}>▲BEST</span>}
                            </td>
                            <td style={{padding:"7px 8px",textAlign:"right"}}>
                              <span style={{fontSize:10,color:mg<3?c.g:mg<5?c.y:c.r}}>{mg.toFixed(2)}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Handicap markets panel */}
              {sel.match.markets&&sel.match.markets.length>0&&(
                <div style={{background:c.card,border:`1px solid ${c.brd}`,borderRadius:10,padding:16,marginBottom:14}}>
                  <div style={{fontSize:9,letterSpacing:"3px",color:c.b,marginBottom:14}}>📐 HANDICAP & SPREAD MARKETS</div>
                  {sel.match.markets.map((mkt,mi)=>(
                    <div key={mi} style={{marginBottom:mi<sel.match.markets.length-1?16:0}}>
                      <div style={{fontSize:9,color:c.dim,letterSpacing:"2px",marginBottom:8}}>{mkt.name.toUpperCase()}</div>
                      <div style={{overflowX:"auto"}}>
                        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                          <thead>
                            <tr>
                              <th style={{padding:"5px 8px",textAlign:"left",fontSize:8,color:c.dim,fontWeight:600}}>LINE</th>
                              {BOOKS.filter(b=>mkt.lines[0]?.odds[b.key]).map(b=>(
                                <th key={b.key} style={{padding:"5px 10px",textAlign:"center",fontSize:8,color:b.key==="pinnacle"?c.b:c.dim,fontWeight:600}}>{b.abbr}</th>
                              ))}
                              <th style={{padding:"5px 10px",textAlign:"center",fontSize:8,color:c.g,fontWeight:600}}>BEST</th>
                              <th style={{padding:"5px 10px",textAlign:"right",fontSize:8,color:c.y,fontWeight:600}}>EV</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mkt.lines.map((line,li)=>{
                              const ref=line.odds.pinnacle||Object.values(line.odds)[0];
                              const sum=1/ref.p1+1/ref.p2;
                              const tp1=(1/ref.p1)/sum, tp2=(1/ref.p2)/sum;
                              let bst1={odds:0,book:""}, bst2={odds:0,book:""};
                              Object.entries(line.odds).forEach(([k,v])=>{
                                if(v.p1>bst1.odds) bst1={odds:v.p1,book:k};
                                if(v.p2>bst2.odds) bst2={odds:v.p2,book:k};
                              });
                              const ev1=(tp1*bst1.odds-1)*100, ev2=(tp2*bst2.odds-1)*100;
                              return [
                                <tr key={`${li}a`} style={{borderBottom:`1px solid ${c.bg}`,background:`${c.b}04`}}>
                                  <td style={{padding:"6px 8px",fontSize:10,color:c.txt,fontWeight:600}}>{line.p1_label}</td>
                                  {BOOKS.filter(b=>mkt.lines[0]?.odds[b.key]).map(b=>{
                                    const o=line.odds[b.key]?.p1;
                                    return <td key={b.key} style={{padding:"6px 10px",textAlign:"center",background:o&&o===bst1.odds?`${c.g}12`:"transparent"}}>
                                      <span style={{fontWeight:700,color:o&&o===bst1.odds?c.g:b.key==="pinnacle"?c.b:c.txt}}>{o?o.toFixed(2):"–"}</span>
                                    </td>;
                                  })}
                                  <td style={{padding:"6px 10px",textAlign:"center"}}>
                                    <span style={{fontWeight:800,color:c.g,fontSize:13}}>{bst1.odds.toFixed(2)}</span>
                                    <div style={{fontSize:7,color:c.g}}>{bookAbbr(bst1.book)}</div>
                                  </td>
                                  <td style={{padding:"6px 10px",textAlign:"right"}}>
                                    <span style={{fontWeight:700,fontSize:11,color:ev1>3?c.g:ev1>0?c.y:c.r}}>{ev1>0?"+":""}{ev1.toFixed(1)}%</span>
                                  </td>
                                </tr>,
                                <tr key={`${li}b`} style={{borderBottom:`1px solid ${c.brd}`}}>
                                  <td style={{padding:"6px 8px",fontSize:10,color:c.dim}}>{line.p2_label}</td>
                                  {BOOKS.filter(b=>mkt.lines[0]?.odds[b.key]).map(b=>{
                                    const o=line.odds[b.key]?.p2;
                                    return <td key={b.key} style={{padding:"6px 10px",textAlign:"center",background:o&&o===bst2.odds?`${c.g}12`:"transparent"}}>
                                      <span style={{fontWeight:700,color:o&&o===bst2.odds?c.g:b.key==="pinnacle"?c.b:c.txt}}>{o?o.toFixed(2):"–"}</span>
                                    </td>;
                                  })}
                                  <td style={{padding:"6px 10px",textAlign:"center"}}>
                                    <span style={{fontWeight:800,color:ev2>0?c.g:c.dim,fontSize:13}}>{bst2.odds.toFixed(2)}</span>
                                    <div style={{fontSize:7,color:c.g}}>{bookAbbr(bst2.book)}</div>
                                  </td>
                                  <td style={{padding:"6px 10px",textAlign:"right"}}>
                                    <span style={{fontWeight:700,fontSize:11,color:ev2>3?c.g:ev2>0?c.y:c.r}}>{ev2>0?"+":""}{ev2.toFixed(1)}%</span>
                                  </td>
                                </tr>,
                              ];
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rec bet — lower-risk: highest probability positive EV across all markets */}
              {sel.topRec&&(
                <div style={{background:`linear-gradient(135deg,#0a1a12,${c.card})`,border:`1px solid ${c.g}30`,borderRadius:10,padding:16,marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                        <span style={{fontSize:9,letterSpacing:"3px",color:c.g}}>◆ RECOMMENDED BET</span>
                        {sel.topRec.isMarket&&<span style={{padding:"1px 7px",borderRadius:3,fontSize:8,background:`${c.b}18`,color:c.b,fontWeight:700}}>HANDICAP</span>}
                        <span style={{padding:"1px 7px",borderRadius:3,fontSize:8,background:`${c.g}12`,color:c.g,fontWeight:700}}>{(sel.topRec.prob*100).toFixed(0)}% PROB · LOWER RISK</span>
                      </div>
                      <div style={{fontSize:16,fontWeight:800,color:c.w}}>
                        {sel.topRec.label} @ {sel.topRec.odds.toFixed(2)} <span style={{fontSize:11,color:c.dim}}>via <BookTag bookKey={sel.topRec.book} highlight={true}/></span>
                      </div>
                      <div style={{fontSize:11,color:c.dim,marginTop:2}}>
                        EV: +{sel.topRec.ev.toFixed(1)}% · Win prob: {(sel.topRec.prob*100).toFixed(1)}%{!sel.topRec.isMarket?` · Kelly: ${(sel.bestK*100).toFixed(1)}% · Stake: ${settings.currency}${calcStake(sel)}`:""}
                      </div>
                    </div>
                    {!sel.topRec.isMarket&&<Btn variant="g" onClick={()=>placeBet(sel)}>PLACE BET — {settings.currency}{calcStake(sel)}</Btn>}
                  </div>
                </div>
              )}

              {/* Edge factors */}
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
                {[{l:m.p1.name,e:sel.p1Edge},{l:m.p2.name,e:sel.p2Edge}].map(({l,e},idx)=>(
                  <div key={idx} style={{background:c.card,border:`1px solid ${c.brd}`,borderRadius:10,padding:16}}>
                    <div style={{fontSize:9,letterSpacing:"2px",color:c.dim,marginBottom:12}}>EDGE FACTORS — {l.toUpperCase()}</div>
                    {e.factors.filter(f=>Math.abs(f.val)>0.003).map((f,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:`1px solid ${c.bg}`}}>
                        <div style={{minWidth:120}}>
                          <div style={{fontSize:10,fontWeight:600,color:c.txt}}>{f.name}</div>
                          <div style={{fontSize:8,color:c.dimm}}>{f.desc}</div>
                        </div>
                        <div style={{flex:1,height:3,background:c.brd,borderRadius:2,overflow:"hidden"}}>
                          <div style={{width:`${Math.min(100,Math.abs(f.val)*600)}%`,height:"100%",background:f.val>0?c.g:c.r,borderRadius:2}}/>
                        </div>
                        <span style={{fontSize:10,fontWeight:700,color:f.val>0?c.g:c.r,minWidth:55,textAlign:"right"}}>
                          {f.val>0?"+":""}{(f.val*100).toFixed(2)}%</span>
                      </div>
                    ))}
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:10,paddingTop:8,borderTop:`1px solid ${c.brd}`}}>
                      <span style={{fontSize:10,fontWeight:700}}>TOTAL EDGE</span>
                      <span style={{fontSize:13,fontWeight:800,color:e.score>0?c.g:c.r}}>{e.score>0?"+":""}{(e.score*100).toFixed(2)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>);
          })() : <div style={{textAlign:"center",padding:"80px 20px",color:c.dim}}><div style={{fontSize:32,marginBottom:10}}>⚡</div><div style={{fontSize:13,marginBottom:6}}>Select a match from the list</div><div style={{fontSize:10,color:c.dimm}}>Click any match in the sidebar to begin analysis</div></div>}
            </div>{/* end right panel */}
          </div>{/* end scanner container */}
        </>)}

        {/* ════ ARB SCANNER ════ */}
        {activeTab==="arb"&&(<>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:9,letterSpacing:"3px",color:c.arb,marginBottom:6}}>◆ ARBITRAGE SCANNER — GUARANTEED PROFIT OPPORTUNITIES</div>
            <p style={{fontSize:11,color:c.dim,lineHeight:1.7}}>
              Arb bets guarantee profit regardless of outcome by backing all outcomes across different bookmakers.
              An arb exists when the sum of best-available implied probabilities drops below 100%.
            </p>
          </div>

          {arbList.length===0?(
            <div style={{textAlign:"center",padding:"60px 20px",color:c.dim,background:c.card,borderRadius:10,border:`1px solid ${c.brd}`}}>
              <div style={{fontSize:28,marginBottom:8}}>🎰</div>
              <div style={{fontSize:12,marginBottom:6}}>No arbitrage opportunities in current data.</div>
              <div style={{fontSize:10,color:c.dimm}}>Connect The Odds API for real-time arb detection across 20+ bookmakers.</div>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {arbList.map((edge,i)=>{
                const m=edge.match;
                const arb=edge.arb;
                const total=1000; // example 1000 unit bet
                const s1=Math.round(total*arb.stakeP1*100)/100;
                const s2=Math.round(total*arb.stakeP2*100)/100;
                const profit=Math.round((total/arb.impliedSum-total)*100)/100;
                return (
                  <div key={i} style={{background:c.card,border:`2px solid ${c.arb}40`,borderRadius:12,padding:20,
                    boxShadow:`0 0 20px ${c.arb}10`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:16}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                          <span style={{fontSize:9,padding:"2px 8px",borderRadius:4,background:`${c.arb}20`,color:c.arb,fontWeight:800,border:`1px solid ${c.arb}40`}}>ARB #{i+1}</span>
                          <span style={{padding:"2px 7px",borderRadius:4,fontSize:9,background:m.status==="LIVE"?`${c.g}18`:`${c.b}15`,color:m.status==="LIVE"?c.g:c.b}}>{m.status==="LIVE"?"● LIVE":`◎ ${m.startTime}`}</span>
                          <SurfacePip surface={m.surface}/>
                          <span style={{fontSize:10,color:c.dim}}>{m.tournament} · {m.round}</span>
                        </div>
                        <div style={{fontSize:16,fontWeight:700,color:c.w}}>{m.p1.flag} {m.p1.name} vs {m.p2.flag} {m.p2.name}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:9,color:c.dim,letterSpacing:"1px"}}>GUARANTEED PROFIT</div>
                        <div style={{fontSize:28,fontWeight:800,color:c.arb}}>+{arb.arbPct.toFixed(2)}%</div>
                        <div style={{fontSize:11,color:c.dim}}>on any stake</div>
                      </div>
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:14}}>
                      {[
                        {p:m.p1,bo:arb.bestP1,stake:s1,name:"P1",pct:(arb.stakeP1*100).toFixed(1)},
                        {p:m.p2,bo:arb.bestP2,stake:s2,name:"P2",pct:(arb.stakeP2*100).toFixed(1)},
                      ].map(({p,bo,stake,name,pct},j)=>(
                        <div key={j} style={{background:c.bg,borderRadius:8,padding:14,border:`1px solid ${c.arb}25`}}>
                          <div style={{fontSize:12,fontWeight:700,color:c.w,marginBottom:8}}>{p.flag} {p.name}</div>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                            <div>
                              <div style={{fontSize:9,color:c.dim}}>BET AT</div>
                              <div style={{fontSize:22,fontWeight:800,color:c.arb}}>{bo.odds.toFixed(2)}</div>
                            </div>
                            <BookTag bookKey={bo.book} highlight={true}/>
                          </div>
                          <div style={{background:`${c.arb}10`,borderRadius:6,padding:"8px 10px"}}>
                            <div style={{fontSize:9,color:c.dim}}>ON {settings.currency}1,000 TOTAL STAKE</div>
                            <div style={{fontSize:14,fontWeight:700,color:c.arb,marginTop:2}}>{settings.currency}{stake} ({pct}%)</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)",gap:10}}>
                      {[
                        {l:"IMPLIED SUM",v:`${(arb.impliedSum*100).toFixed(2)}%`,col:c.g,note:"<100% = arb"},
                        {l:"PROFIT ON €1,000",v:`${settings.currency}${profit.toFixed(2)}`,col:c.arb,note:"guaranteed"},
                        {l:"ANNUAL YIELD",v:`${(arb.arbPct*100).toFixed(0)}x`,col:c.b,note:"if 1 arb/day"},
                      ].map((s,k)=>(
                        <div key={k} style={{textAlign:"center",padding:12,background:c.bg,borderRadius:8,border:`1px solid ${c.brd}`}}>
                          <div style={{fontSize:8,color:c.dim,letterSpacing:"1px"}}>{s.l}</div>
                          <div style={{fontSize:16,fontWeight:800,color:s.col,marginTop:4}}>{s.v}</div>
                          <div style={{fontSize:8,color:c.dimm,marginTop:2}}>{s.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{marginTop:20,background:c.card,border:`1px solid ${c.brd}`,borderRadius:10,padding:16}}>
            <div style={{fontSize:9,letterSpacing:"3px",color:c.y,marginBottom:10}}>HOW ARBITRAGE WORKS</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}>
              {[
                {n:"1. Find discrepancy",d:"Best odds for both outcomes across all bookmakers sum to less than 100% implied probability."},
                {n:"2. Calculate stakes",d:"Split your total stake proportionally: stake_P1 = total × (1/bestP1) / impliedSum"},
                {n:"3. Place both bets",d:"Bet on P1 at Book A AND P2 at Book B simultaneously. One must win."},
                {n:"4. Collect profit",d:"Guaranteed return regardless of outcome. Typical arbs: 0.1-2%. Speed matters."},
              ].map((step,i)=>(
                <div key={i} style={{padding:12,background:c.bg,borderRadius:8,border:`1px solid ${c.brd}`}}>
                  <div style={{fontSize:10,fontWeight:700,color:c.arb,marginBottom:6}}>{step.n}</div>
                  <div style={{fontSize:10,color:c.dim,lineHeight:1.6}}>{step.d}</div>
                </div>
              ))}
            </div>
          </div>
        </>)}

        {/* Live Odds — now embedded in Matches feed as "Odds Table" view */}
        {activeTab==="__odds_removed__"&&(<>
          <div style={{marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
            <div>
              <div style={{fontSize:9,letterSpacing:"3px",color:c.b,marginBottom:6}}>ODDS COMPARISON TABLE — ALL BOOKMAKERS</div>
              <p style={{fontSize:11,color:c.dim}}>Green = best available odds. Click a match to open Edge Scanner.</p>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {BOOKS.map(b=>(
                <span key={b.key} style={{padding:"3px 10px",borderRadius:12,fontSize:9,fontWeight:700,
                  background:`${c.b}12`,color:c.b,border:`1px solid ${c.b}25`}}>
                  {b.abbr} <span style={{color:c.dim,fontWeight:400}}>{b.name}</span>
                </span>
              ))}
            </div>
          </div>

          {allMatches.map(m=>{
            const {bestP1,bestP2}=getBestOdds(m);
            const edge=matchEdges.find(e=>e.match.id===m.id);
            const sc=SURFACE_C[m.surface]||c.dim;
            return (
              <div key={m.id} style={{background:c.card,border:`1px solid ${c.brd}`,borderRadius:10,marginBottom:10,overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:`1px solid ${c.brd}`,cursor:"pointer",background:`${sc}06`}}
                  onClick={()=>{setSelectedMatch(m.id);setActiveTab("scanner");}}>
                  <SurfacePip surface={m.surface}/>
                  <span style={{padding:"1px 6px",borderRadius:3,fontSize:8,background:m.status==="LIVE"?`${c.g}18`:`${c.b}12`,color:m.status==="LIVE"?c.g:c.b}}>
                    {m.status==="LIVE"?"● LIVE":`◎ ${m.startTime}`}</span>
                  <span style={{fontSize:11,fontWeight:600,color:c.w}}>{m.p1.flag} {m.p1.name} vs {m.p2.flag} {m.p2.name}</span>
                  <span style={{fontSize:10,color:c.dim,marginLeft:4}}>{m.tournament} · {m.round}</span>
                  {edge?.best&&<Badge value={edge.bestEV}/>}
                  {edge?.arb.isArb&&<span style={{padding:"1px 7px",borderRadius:4,fontSize:8,fontWeight:800,background:`${c.arb}20`,color:c.arb}}>ARB +{edge.arb.arbPct.toFixed(2)}%</span>}
                </div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:500}}>
                    <thead>
                      <tr style={{background:c.bg}}>
                        <th style={{padding:"6px 16px",textAlign:"left",fontSize:8,color:c.dim,fontWeight:600,width:80}}>PLAYER</th>
                        {BOOKS.filter(b=>m.odds[b.key]).map(b=>(
                          <th key={b.key} style={{padding:"6px 12px",textAlign:"center",fontSize:8,color:b.key==="pinnacle"?c.b:c.dim,fontWeight:600}}>
                            {b.abbr}
                          </th>
                        ))}
                        <th style={{padding:"6px 12px",textAlign:"center",fontSize:8,color:c.g,fontWeight:600}}>BEST</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[{p:m.p1,side:"p1",best:bestP1},{p:m.p2,side:"p2",best:bestP2}].map(({p,side,best},ri)=>(
                        <tr key={ri} style={{borderTop:`1px solid ${c.brd}`}}>
                          <td style={{padding:"8px 16px",fontSize:10,fontWeight:600,color:c.txt,whiteSpace:"nowrap"}}>
                            {p.flag} {p.name.split(" ").pop()}
                          </td>
                          {BOOKS.filter(b=>m.odds[b.key]).map(b=>{
                            const odds=m.odds[b.key]?.[side];
                            const isBest=odds&&odds===best.odds;
                            return (
                              <td key={b.key} style={{padding:"8px 12px",textAlign:"center",
                                background:isBest?`${c.g}10`:b.key==="pinnacle"?`${c.b}05`:"transparent"}}>
                                <span style={{fontWeight:700,fontSize:13,color:isBest?c.g:b.key==="pinnacle"?c.b:c.txt}}>
                                  {odds?odds.toFixed(2):"–"}
                                </span>
                                {isBest&&<div style={{fontSize:7,color:c.g,marginTop:1}}>▲BEST</div>}
                              </td>
                            );
                          })}
                          <td style={{padding:"8px 12px",textAlign:"center",background:`${c.g}08`}}>
                            <span style={{fontWeight:800,fontSize:14,color:c.g}}>{best.odds.toFixed(2)}</span>
                            <div style={{fontSize:8,color:c.g}}>{bookAbbr(best.book)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </>)}

        {/* ════ MODEL (Factors + Optimizer + Monte Carlo) ════ */}
        {activeTab==="model"&&(
          <div>
            {/* Optimizer */}
            <div style={{background:c.card,border:`1px solid ${c.g}30`,borderRadius:10,padding:16,marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,marginBottom:8}}>
                <div>
                  <div style={{fontSize:9,letterSpacing:"3px",color:c.g,marginBottom:4}}>🤖 WEIGHT OPTIMIZER</div>
                  <p style={{fontSize:10,color:c.dim}}>Gradient search (4,000 iterations) — finds weight combination that maximises total EV across all {allMatches.length} matches.</p>
                </div>
                <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                  {optimizerResult&&<div style={{fontSize:10,color:c.g}}>✓ EV: {optimizerResult.before.toFixed(2)} → <span style={{fontWeight:800}}>{optimizerResult.after.toFixed(2)}</span> (+{((optimizerResult.after-optimizerResult.before)/optimizerResult.before*100).toFixed(1)}%)</div>}
                  <Btn variant="g" onClick={runOptimizer} disabled={optimizing} style={{padding:"8px 18px",fontSize:10}}>{optimizing?"OPTIMIZING...":"⚡ RUN OPTIMIZER"}</Btn>
                  <Btn onClick={()=>{setWeights({circadian:1,travel:1,altitude:1,fatigue:1,recovery:1,surface:1,momentum:1,form:1,secondServe:1,pressure:1,ageSurface:1,rank:0.3,tiebreak:1,decidingSet:1,bpConvert:1,styleClash:1,serveReturn:1});setOptimizerResult(null);}} style={{padding:"8px 14px",fontSize:10}}>RESET</Btn>
                </div>
              </div>
            </div>
            <div style={{background:c.card,border:`1px solid ${c.brd}`,borderRadius:10,padding:20}}>
              <div style={{fontSize:9,letterSpacing:"3px",color:c.dim,marginBottom:6}}>UNORTHODOX EDGE FACTOR WEIGHTS</div>
              <p style={{fontSize:11,color:c.dim,marginBottom:16,lineHeight:1.6}}>Variables bookmakers underprice. 1.0x = standard. Increase where the market is blind. Applied on top of Pinnacle no-vig baseline probabilities.</p>
              <div style={{fontSize:9,letterSpacing:"2px",color:c.b,marginBottom:10}}>── CORE FACTORS (12)</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14,marginBottom:20}}>
                {[
                  {key:"circadian",l:"🌙 Circadian Disruption",d:"Timezone shift degrades reaction time & focus. Almost never modeled by bookies."},
                  {key:"travel",l:"✈️ Travel Fatigue",d:"Long-haul flights compound with jet lag for hidden performance loss."},
                  {key:"altitude",l:"⛰️ Altitude Delta",d:"Elevation changes affect ball flight, breathing, serve speed."},
                  {key:"fatigue",l:"🔋 Accumulated Fatigue",d:"Deep runs create invisible carryover fatigue into next event."},
                  {key:"recovery",l:"💤 Recovery Window",d:"Back-to-back days favor younger players. 2+ rest = veteran edge."},
                  {key:"surface",l:"🎾 Surface Win Rate",d:"Market over-indexes recent form vs surface-specific skill."},
                  {key:"momentum",l:"📈 In-Match Momentum",d:"Live psychological shifts the odds react to slowly."},
                  {key:"form",l:"🔥 Form Trend (Weighted)",d:"Weighted last-5 results. Detects rising/declining players."},
                  {key:"secondServe",l:"🎯 2nd Serve Dominance",d:"Most undervalued stat in tennis. Predicts clutch play."},
                  {key:"pressure",l:"🧠 BP Resilience",d:"Break point mental toughness. Systematically underweighted."},
                  {key:"ageSurface",l:"⏳ Age-Surface Decay",d:"Players 28+ lose a step on fast surfaces. Not priced until obvious."},
                  {key:"rank",l:"📊 Rank Δ (Baseline)",d:"Market already prices this. Keep low to avoid double-counting."},
                ].map(({key,l,d})=>(
                  <div key={key} style={{padding:"12px 14px",background:c.bg,borderRadius:8,border:`1px solid ${c.brd}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:11,fontWeight:700,color:c.txt}}>{l}</span>
                      <span style={{fontSize:14,fontWeight:800,color:weights[key]>1?c.g:weights[key]<1?c.r:c.y}}>{weights[key].toFixed(1)}x</span>
                    </div>
                    <p style={{fontSize:9,color:c.dim,lineHeight:1.5,marginBottom:8}}>{d}</p>
                    <input type="range" min="0" max="3" step="0.1" value={weights[key]}
                      onChange={e=>setWeights(p=>({...p,[key]:+e.target.value}))}
                      style={{width:"100%",accentColor:c.g}}/>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
                      <span style={{fontSize:8,color:c.dimm}}>0 (off)</span>
                      <span style={{fontSize:8,color:c.dimm}}>3x (max)</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:9,letterSpacing:"2px",color:c.g,marginBottom:10}}>── ADVANCED ML FACTORS v5.0 (5 new)</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
                {[
                  {key:"tiebreak",l:"🎲 Tiebreak Dominance",d:"Players with high tiebreak WR are systematically underpriced in close matches. Bookies lag at updating TB stats."},
                  {key:"decidingSet",l:"💪 Deciding Set Endurance",d:"3rd/5th set win rate reveals mental & physical stamina. Key variable in long matches — rarely priced correctly."},
                  {key:"bpConvert",l:"🎯 Break Point Conversion",d:"Converting breaks under pressure is a skill, not luck. High converters vs low converters create consistent edge."},
                  {key:"styleClash",l:"⚔️ Style Clash Matrix",d:"Serve-dom crushes counter-punchers on grass. Counter-punchers beat serve-dom on clay. Market doesn't adjust enough."},
                  {key:"serveReturn",l:"🔁 Serve+Return Efficiency",d:"Combined serve efficiency vs opponent return skill. The single biggest predictor of set wins not captured in raw rank."},
                ].map(({key,l,d})=>(
                  <div key={key} style={{padding:"12px 14px",background:`${c.g}05`,borderRadius:8,border:`1px solid ${c.g}22`}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:11,fontWeight:700,color:c.txt}}>{l}</span>
                      <span style={{fontSize:14,fontWeight:800,color:weights[key]>1?c.g:weights[key]<1?c.r:c.y}}>{(weights[key]??1).toFixed(1)}x</span>
                    </div>
                    <p style={{fontSize:9,color:c.dim,lineHeight:1.5,marginBottom:8}}>{d}</p>
                    <input type="range" min="0" max="3" step="0.1" value={weights[key]??1}
                      onChange={e=>setWeights(p=>({...p,[key]:+e.target.value}))}
                      style={{width:"100%",accentColor:c.g}}/>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
                      <span style={{fontSize:8,color:c.dimm}}>0 (off)</span>
                      <span style={{fontSize:8,color:c.dimm}}>3x (max)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════ MONTE CARLO (part of MODEL tab) ════ */}
        {activeTab==="model"&&(
          <div style={{background:c.card,border:`1px solid ${c.brd}`,borderRadius:10,padding:20,marginTop:14}}>
            <div style={{fontSize:9,letterSpacing:"3px",color:c.b,marginBottom:6}}>📈 MONTE CARLO BANKROLL SIMULATOR</div>
            <p style={{fontSize:11,color:c.dim,marginBottom:16,lineHeight:1.6}}>1,000 parallel paths · 200 bets each · Current settings applied · Edge range: 3-7%</p>
            <div style={{display:"flex",gap:20,alignItems:"center",marginBottom:20,flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:9,color:c.dim,letterSpacing:"1px",marginBottom:4}}>KELLY FRACTION</div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <input type="range" min="0.05" max="1" step="0.05" value={kellyFrac} onChange={e=>setKellyFrac(+e.target.value)} style={{width:200,accentColor:c.y}}/>
                  <span style={{fontSize:14,fontWeight:700,color:c.y}}>{(kellyFrac*100).toFixed(0)}%</span>
                  <span style={{fontSize:10,color:c.dim}}>{kellyFrac<=0.25?"✓ safe":kellyFrac<=0.5?"⚠ moderate":"⚠ risky"}</span>
                </div>
              </div>
              <Btn variant="g" onClick={runSim} disabled={simRunning}>{simRunning?"RUNNING...":"RUN 1,000 SIMULATIONS"}</Btn>
            </div>
            {simResults&&(<>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)",gap:12,marginBottom:16}}>
                {[
                  {l:"MEDIAN",v:`${settings.currency}${simResults.median.toLocaleString()}`,col:simResults.median>=bankroll?c.g:c.r},
                  {l:"AVERAGE",v:`${settings.currency}${simResults.avg.toLocaleString()}`,col:simResults.avg>=bankroll?c.g:c.r},
                  {l:"5th–95th %ile",v:`${settings.currency}${simResults.p5.toLocaleString()} – ${settings.currency}${simResults.p95.toLocaleString()}`,col:c.b},
                  {l:"BUST RATE",v:`${(simResults.bust/simResults.runs*100).toFixed(1)}%`,col:c.r},
                  {l:"2× BANKROLL",v:`${(simResults.doubled/simResults.runs*100).toFixed(1)}%`,col:c.g},
                  {l:"SIMULATIONS",v:simResults.runs.toLocaleString(),col:c.b},
                ].map((s,i)=>(
                  <div key={i} style={{textAlign:"center",padding:14,background:c.bg,borderRadius:8,border:`1px solid ${c.brd}`}}>
                    <div style={{fontSize:9,color:c.dim,letterSpacing:"1px"}}>{s.l}</div>
                    <div style={{fontSize:s.l.includes("–")?13:22,fontWeight:800,color:s.col,marginTop:6}}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontSize:9,color:c.dim,letterSpacing:"1px",marginBottom:6}}>DISTRIBUTION (green = profit, red = loss)</div>
                <div style={{display:"flex",height:100,alignItems:"flex-end",gap:1}}>
                  {(()=>{
                    const bk=Array(60).fill(0), mx=Math.max(...simResults.distribution), rng=mx||1;
                    simResults.distribution.forEach(v=>{bk[Math.min(59,(v/rng*59)|0)]++;});
                    const mxB=Math.max(...bk);
                    return bk.map((n,i)=><div key={i} style={{flex:1,height:`${mxB>0?n/mxB*100:0}%`,background:(i/59)*rng>=bankroll?c.g:c.r,opacity:.65,borderRadius:"1px 1px 0 0",minWidth:1}}/>);
                  })()}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                  <span style={{fontSize:9,color:c.dim}}>{settings.currency}0</span>
                  <span style={{fontSize:9,color:c.dim}}>← {settings.currency}{bankroll} →</span>
                  <span style={{fontSize:9,color:c.dim}}>{settings.currency}{Math.max(...simResults.distribution).toLocaleString()}</span>
                </div>
              </div>
            </>)}
          </div>
        )}

        {/* ════ BETS ════ */}
        {activeTab==="bets"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>

          {/* ── PERFORMANCE panel ── */}
          {(()=>{
            const allBH = betHistory.filter(b=>b.settled!==false);
            const epSettled = epicbetData?.settledBets||[];
            const hasPerfData = allBH.length>0 || epSettled.length>0;
            if (!hasPerfData && !epicbetData) return null;

            // Combine manual bets into bankroll curve
            const manualCurve = [startingBankroll||bankroll||0, ...betHistory.filter(b=>b.bankroll!=null).map(b=>b.bankroll)];
            const manualProfit = manualCurve.length>1 ? manualCurve[manualCurve.length-1]-manualCurve[0] : 0;
            const wins = allBH.filter(b=>b.win).length;
            const losses = allBH.filter(b=>!b.win).length;
            const pending = betHistory.filter(b=>b.settled===false).length;
            const streak = (() => {
              const settled = [...betHistory].reverse().filter(b=>b.settled!==false);
              if (!settled.length) return [];
              const last10 = settled.slice(0,10).map(b=>b.win?'W':'L');
              return last10;
            })();
            const currentStreak = (() => {
              const settled = [...betHistory].reverse().filter(b=>b.settled!==false);
              if (!settled.length) return '';
              let cnt=0, type=settled[0].win?'W':'L';
              for (const b of settled) { if ((b.win?'W':'L')===type) cnt++; else break; }
              return `${type}${cnt}`;
            })();
            const avgOddsManual = allBH.length>0 ? allBH.reduce((s,b)=>s+(b.odds||0),0)/allBH.length : 0;
            const roiManual = (startingBankroll||0)>0 ? ((bankroll/(startingBankroll||1)-1)*100) : null;

            const mc = manualCurve;
            const mcMin = Math.min(...mc), mcMax = Math.max(...mc);
            const mcRange = mcMax-mcMin||1;

            return (
              <div style={{background:c.card,border:`1px solid ${c.brd}`,borderRadius:10,padding:20}}>
                <div style={{fontSize:9,letterSpacing:"3px",color:c.dim,marginBottom:14}}>📈 PERFORMANCE</div>

                {/* Bankroll curve (manual bets) */}
                {mc.length>1&&(
                  <div style={{marginBottom:16,padding:"12px 14px",background:c.bg,borderRadius:8,border:`1px solid ${c.brd}`}}>
                    <div style={{fontSize:8,color:c.dim,letterSpacing:"1.5px",marginBottom:8}}>BANKROLL CURVE</div>
                    <div style={{position:"relative",height:100}}>
                      <svg width="100%" height="100" style={{overflow:"visible"}}>
                        {[0,0.25,0.5,0.75,1].map(t=>(
                          <line key={t} x1="0" y1={`${(1-t)*100}%`} x2="100%" y2={`${(1-t)*100}%`}
                            stroke={c.brd} strokeWidth="1" strokeDasharray="3,5"/>
                        ))}
                        <defs>
                          <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={manualProfit>=0?"#00e87b":"#ff3b5c"} stopOpacity="0.3"/>
                            <stop offset="100%" stopColor={manualProfit>=0?"#00e87b":"#ff3b5c"} stopOpacity="0"/>
                          </linearGradient>
                        </defs>
                        <polygon fill="url(#perfGrad)" points={[
                          ...mc.map((v,i)=>`${(i/(mc.length-1)*100)}%,${((1-(v-mcMin)/mcRange)*90+2).toFixed(1)}`),
                          `100%,96`,`0%,96`].join(' ')}/>
                        <polyline fill="none" stroke={manualProfit>=0?c.g:c.r} strokeWidth="2" strokeLinejoin="round"
                          points={mc.map((v,i)=>`${(i/(mc.length-1)*100)}%,${((1-(v-mcMin)/mcRange)*90+2).toFixed(1)}`).join(' ')}/>
                        {mc.map((v,i)=>(
                          <circle key={i} cx={`${(i/(mc.length-1)*100)}%`}
                            cy={((1-(v-mcMin)/mcRange)*90+2).toFixed(1)}
                            r={i===0||i===mc.length-1?3:2} fill={manualProfit>=0?c.g:c.r} opacity={i===0||i===mc.length-1?1:0.5}/>
                        ))}
                      </svg>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:7,color:c.dimm,marginTop:2}}>
                        <span>€{mcMin.toFixed(0)}</span>
                        <span style={{color:c.dim}}>— {mc.length-1} bets —</span>
                        <span>€{mcMax.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats grid */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:8,marginBottom:14}}>
                  {[
                    {l:"WIN",v:wins,col:c.g},
                    {l:"LOSS",v:losses,col:c.r},
                    {l:"PENDING",v:pending,col:c.y},
                    {l:"ROI",v:roiManual!=null?`${roiManual>=0?"+":""}${roiManual.toFixed(1)}%`:"–",col:roiManual!=null&&roiManual>=0?c.g:c.r},
                    {l:"AVG ODDS",v:avgOddsManual>0?avgOddsManual.toFixed(2):"–",col:c.b},
                    {l:"STREAK",v:currentStreak||"–",col:currentStreak.startsWith('W')?c.g:currentStreak.startsWith('L')?c.r:c.dim},
                  ].map(({l,v,col},i)=>(
                    <div key={i} style={{background:c.bg,borderRadius:7,padding:"8px 12px",border:`1px solid ${c.brd}`}}>
                      <div style={{fontSize:7,color:c.dimm,letterSpacing:"1.5px",marginBottom:3}}>{l}</div>
                      <div style={{fontSize:14,fontWeight:800,color:col}}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Recent form strip */}
                {streak.length>0&&(
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:8,color:c.dimm,letterSpacing:"1px"}}>FORM</span>
                    <div style={{display:"flex",gap:3}}>
                      {streak.map((r,i)=>(
                        <div key={i} style={{width:16,height:16,borderRadius:3,background:r==='W'?`${c.g}30`:r==='L'?`${c.r}30`:`${c.y}20`,
                          border:`1px solid ${r==='W'?c.g:r==='L'?c.r:c.y}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <span style={{fontSize:8,fontWeight:700,color:r==='W'?c.g:r==='L'?c.r:c.y}}>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Epicbet Sync Panel ── */}
          {(()=>{
            const ep = epicbetData;
            if (!ep) return (
              <div style={{background:c.card,border:`1px dashed ${c.brd}`,borderRadius:10,padding:20,textAlign:"center"}}>
                <div style={{fontSize:22,marginBottom:8}}>🔗</div>
                <div style={{fontSize:11,color:c.w,fontWeight:700,marginBottom:6}}>Connect Epicbet</div>
                <div style={{fontSize:10,color:c.dim,lineHeight:1.6,maxWidth:400,margin:"0 auto"}}>
                  Install the <span style={{color:c.g}}>Edge Machine Chrome Extension</span>, visit epicbet.com while logged in, then click <span style={{color:c.g,fontWeight:700}}>IMPORT</span> in the banner that appears at the top of this page.
                </div>
                <div style={{marginTop:14,fontSize:9,color:c.dimm}}>Extension folder: <span style={{color:c.y}}>epicbet-extension/</span> · Load via chrome://extensions → Developer mode → Load unpacked</div>
              </div>
            );

            const open = ep.openBets || [];
            const settled = ep.settledBets || [];
            const wins = settled.filter(b=>b.status==='won');
            const losses = settled.filter(b=>b.status==='lost');
            const totalStaked = settled.reduce((s,b)=>s+(b.stake||0),0);
            const totalPayout = settled.filter(b=>b.status==='won').reduce((s,b)=>s+(b.actualPayout||b.potentialPayout||0),0);
            const totalProfit = totalPayout - totalStaked;
            const roi = totalStaked>0 ? (totalProfit/totalStaked*100) : 0;
            const winRate = settled.length>0 ? wins.length/settled.length*100 : 0;
            const avgOdds = settled.length>0 ? settled.reduce((s,b)=>s+(b.totalOdds||0),0)/settled.length : 0;
            const syncAgo = ep.lastSync ? Math.round((Date.now()-ep.lastSync)/60000) : null;

            // Build bankroll curve for chart
            let runningBal = ep.balance != null ? ep.balance - totalProfit : 1000;
            const curve = [runningBal, ...settled.slice().reverse().map(b => {
              runningBal += (b.status==='won' ? (b.actualPayout||b.potentialPayout||0) - (b.stake||0) : b.stake||0);
              return runningBal;
            })].reverse();
            const curveMin = Math.min(...curve), curveMax = Math.max(...curve);
            const curveRange = curveMax - curveMin || 1;

            return (
              <div style={{background:c.card,border:`1px solid #00e87b30`,borderRadius:10,padding:20}}>
                {/* Header */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:8,letterSpacing:"3px",color:c.g}}>🔗 EPICBET ACCOUNT</span>
                    {syncAgo!=null&&<span style={{fontSize:8,color:c.dimm}}>synced {syncAgo}m ago</span>}
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    {["overview","open","history"].map(t=>(
                      <button key={t} onClick={()=>setEpicbetTab(t)}
                        style={{padding:"4px 12px",borderRadius:5,fontSize:9,fontWeight:700,cursor:"pointer",border:"none",
                          fontFamily:"inherit",letterSpacing:"1px",
                          background:epicbetTab===t?c.g:c.bg,color:epicbetTab===t?c.bg:c.dim}}>
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* OVERVIEW tab */}
                {epicbetTab==="overview"&&(<>
                  {/* Balance + stats row */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:16}}>
                    {[
                      {l:"BALANCE",v:ep.balance!=null?`€${ep.balance.toFixed(2)}`:"–",col:c.g,big:true},
                      {l:"WIN RATE",v:settled.length?`${winRate.toFixed(0)}%`:"–",col:winRate>=50?c.g:c.r},
                      {l:"ROI",v:settled.length?`${roi>=0?"+":""}${roi.toFixed(1)}%`:"–",col:roi>=0?c.g:c.r},
                      {l:"TOTAL P/L",v:settled.length?`${totalProfit>=0?"+":""}€${totalProfit.toFixed(2)}`:"–",col:totalProfit>=0?c.g:c.r},
                      {l:"AVG ODDS",v:settled.length?avgOdds.toFixed(2):"–",col:c.b},
                      {l:"BETS",v:`${wins.length}W ${losses.length}L ${open.length} open`,col:c.y},
                    ].map(({l,v,col,big},i)=>(
                      <div key={i} style={{background:c.bg,borderRadius:8,padding:"10px 14px",border:`1px solid ${c.brd}`}}>
                        <div style={{fontSize:7,color:c.dim,letterSpacing:"1.5px",marginBottom:4}}>{l}</div>
                        <div style={{fontSize:big?18:14,fontWeight:800,color:col}}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Return chart */}
                  {curve.length>1&&(
                    <div style={{marginBottom:16,padding:"12px 14px",background:c.bg,borderRadius:8,border:`1px solid ${c.brd}`}}>
                      <div style={{fontSize:8,color:c.dim,letterSpacing:"1.5px",marginBottom:8}}>BANKROLL CURVE</div>
                      <div style={{position:"relative",height:80}}>
                        <svg width="100%" height="80" style={{overflow:"visible"}}>
                          {/* Grid lines */}
                          {[0,0.5,1].map(t=>(
                            <line key={t} x1="0" y1={`${(1-t)*100}%`} x2="100%" y2={`${(1-t)*100}%`}
                              stroke={c.brd} strokeWidth="1" strokeDasharray="4,4"/>
                          ))}
                          {/* Fill */}
                          <defs>
                            <linearGradient id="epGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={totalProfit>=0?"#00e87b":"#ff3b5c"} stopOpacity="0.3"/>
                              <stop offset="100%" stopColor={totalProfit>=0?"#00e87b":"#ff3b5c"} stopOpacity="0"/>
                            </linearGradient>
                          </defs>
                          <polygon
                            fill="url(#epGrad)"
                            points={[
                              ...curve.map((v,i)=>`${(i/(curve.length-1)*100)}%,${((1-(v-curveMin)/curveRange)*76+2).toFixed(1)}`),
                              `100%,80`,`0%,80`
                            ].join(' ')}
                          />
                          {/* Line */}
                          <polyline
                            fill="none"
                            stroke={totalProfit>=0?c.g:c.r}
                            strokeWidth="2"
                            strokeLinejoin="round"
                            points={curve.map((v,i)=>`${(i/(curve.length-1)*100)}%,${((1-(v-curveMin)/curveRange)*76+2).toFixed(1)}`).join(' ')}
                          />
                          {/* Dots at endpoints */}
                          {[0,curve.length-1].map(i=>(
                            <circle key={i} cx={`${(i/(curve.length-1)*100)}%`}
                              cy={((1-(curve[i]-curveMin)/curveRange)*76+2).toFixed(1)}
                              r="3" fill={totalProfit>=0?c.g:c.r}/>
                          ))}
                        </svg>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:c.dimm,marginTop:4}}>
                          <span>€{curveMin.toFixed(0)}</span>
                          <span>€{curveMax.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>)}

                {/* OPEN BETS tab */}
                {epicbetTab==="open"&&(
                  open.length===0
                    ? <div style={{textAlign:"center",padding:"30px 0",color:c.dim,fontSize:11}}>No open bets</div>
                    : <div style={{display:"flex",flexDirection:"column",gap:12}}>
                        {open.map((b,i)=>(
                          <div key={i} style={{background:c.bg,borderRadius:8,border:`1px solid ${c.y}30`,overflow:"hidden"}}>
                            {/* Card header */}
                            <div style={{padding:"10px 14px",borderBottom:`1px solid ${c.brd}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,background:`${c.y}06`}}>
                              <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                                <span style={{fontSize:10,color:c.y,fontWeight:800,letterSpacing:"1px"}}>
                                  {(b.type||'single').toUpperCase()}{b.legs>1?` ×${b.legs}`:""}
                                </span>
                                {b.id&&<span style={{fontSize:8,color:c.dimm,padding:"1px 6px",background:c.card,borderRadius:3}}>#{b.id}</span>}
                                <span style={{fontSize:8,color:c.y,padding:"1px 6px",background:`${c.y}20`,borderRadius:3,fontWeight:700}}>PENDING</span>
                                {b.isBonus&&<span style={{fontSize:8,color:c.b,padding:"1px 6px",background:`${c.b}15`,borderRadius:3}}>BONUS</span>}
                              </div>
                              <div style={{display:"flex",gap:14,alignItems:"baseline"}}>
                                <div style={{textAlign:"right"}}>
                                  <div style={{fontSize:8,color:c.dimm,marginBottom:1}}>STAKE</div>
                                  <div style={{fontSize:12,fontWeight:700,color:c.txt}}>€{(b.stake||0).toFixed(2)}</div>
                                </div>
                                <div style={{width:1,height:28,background:c.brd}}/>
                                <div style={{textAlign:"right"}}>
                                  <div style={{fontSize:8,color:c.dimm,marginBottom:1}}>ODDS</div>
                                  <div style={{fontSize:12,fontWeight:700,color:c.b}}>{(b.totalOdds||0).toFixed(2)}</div>
                                </div>
                                <div style={{width:1,height:28,background:c.brd}}/>
                                <div style={{textAlign:"right"}}>
                                  <div style={{fontSize:8,color:c.dimm,marginBottom:1}}>PAYOUT</div>
                                  <div style={{fontSize:14,fontWeight:800,color:c.g}}>€{(b.potentialPayout||0).toFixed(2)}</div>
                                </div>
                              </div>
                            </div>
                            {/* Selections */}
                            <div style={{padding:"0 14px"}}>
                              {(()=>{
                                // Compute per-leg model probabilities for combo EV
                                const legProbs = (b.selections||[]).map(s => {
                                  const spl = (s.player||'').toLowerCase();
                                  const linked = spl.length>2 ? allMatches.find(m=>{
                                    const n1=m.p1.name.toLowerCase(), n2=m.p2.name.toLowerCase();
                                    const last1=(n1.split(' ')[1]||n1), last2=(n2.split(' ')[1]||n2);
                                    return n1.includes(spl)||n2.includes(spl)||spl.includes(last1)||spl.includes(last2);
                                  }) : null;
                                  const nvp = linked ? noVigProb(linked) : null;
                                  const p1n = linked ? linked.p1.name.toLowerCase() : '';
                                  const isp1 = p1n && (spl.includes(p1n.split(' ')[1]||p1n) || p1n.includes(spl));
                                  return { linked, nvp, prob: nvp ? (isp1 ? nvp.p1 : nvp.p2) : null };
                                });
                                const allProbs = legProbs.map(x=>x.prob).filter(p=>p!=null);
                                const comboProb = allProbs.length === (b.selections||[]).length && allProbs.length>1
                                  ? allProbs.reduce((a,b)=>a*b, 1) : null;
                                const comboEV = comboProb && b.totalOdds
                                  ? ((comboProb * b.totalOdds) - 1) * 100 : null;

                                return (<>
                                  {(b.selections||[]).map((s,j)=>{
                                    const { linked, prob: betterProb } = legProbs[j] || {};
                                    const ev = betterProb&&s.odds ? ((betterProb*s.odds)-1)*100 : null;
                                    return (
                                      <div key={j} style={{padding:"10px 0",borderBottom:j<(b.selections||[]).length-1?`1px solid ${c.brd}`:"none"}}>
                                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                                          <div style={{display:"flex",gap:8,alignItems:"flex-start",flex:1,minWidth:0}}>
                                            {b.legs>1&&<span style={{fontSize:8,color:c.dimm,minWidth:14,paddingTop:2}}>#{j+1}</span>}
                                            <div style={{flex:1,minWidth:0}}>
                                              <div style={{fontSize:12,color:c.w,fontWeight:700,marginBottom:2}}>{s.player||"–"}</div>
                                              {s.market&&<div style={{fontSize:9,color:c.dim,marginBottom:1}}>{s.market}</div>}
                                              {s.match&&<div style={{fontSize:9,color:c.dimm,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.match}</div>}
                                              {s.datetime&&<div style={{fontSize:8,color:c.dimm,marginTop:1}}>{s.datetime}</div>}
                                              {(linked||betterProb!=null||ev!=null)&&(
                                                <div style={{display:"flex",gap:5,marginTop:5,flexWrap:"wrap"}}>
                                                  {linked&&<span style={{fontSize:7,color:c.b,padding:"1px 7px",background:`${c.b}15`,border:`1px solid ${c.b}25`,borderRadius:3}}>
                                                    {linked.circuit} · {linked.surface}
                                                  </span>}
                                                  {betterProb!=null&&<span style={{fontSize:7,color:c.dim,padding:"1px 7px",background:c.card,border:`1px solid ${c.brd}`,borderRadius:3}}>
                                                    {(betterProb*100).toFixed(0)}% model
                                                  </span>}
                                                  {ev!=null&&<span style={{fontSize:7,fontWeight:700,padding:"1px 7px",borderRadius:3,
                                                    background:ev>=0?`${c.g}20`:`${c.r}20`,border:`1px solid ${ev>=0?c.g:c.r}40`,
                                                    color:ev>=0?c.g:c.r}}>
                                                    {ev>=0?"+":""}{ ev.toFixed(1)}% EV
                                                  </span>}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          <div style={{fontSize:14,fontWeight:800,color:c.b,flexShrink:0,paddingTop:2}}>{s.odds?.toFixed(2)||"–"}</div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {/* Combo summary row */}
                                  {comboProb!=null&&(
                                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderTop:`1px solid ${c.brd}`,marginTop:2}}>
                                      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                                        <span style={{fontSize:8,color:c.dimm,letterSpacing:"1px"}}>COMBO PROB</span>
                                        <span style={{fontSize:11,fontWeight:700,color:c.y}}>{(comboProb*100).toFixed(1)}%</span>
                                        {comboEV!=null&&<span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:3,
                                          background:comboEV>=0?`${c.g}20`:`${c.r}20`,border:`1px solid ${comboEV>=0?c.g:c.r}40`,
                                          color:comboEV>=0?c.g:c.r}}>
                                          COMBO EV {comboEV>=0?"+":""}{ comboEV.toFixed(1)}%
                                        </span>}
                                      </div>
                                      <span style={{fontSize:8,color:c.dimm}}>{allProbs.length}/{(b.selections||[]).length} legs modelled</span>
                                    </div>
                                  )}
                                  {/* Empty state */}
                                  {(!b.selections||b.selections.length===0)&&(
                                    <div style={{padding:"12px 0",fontSize:9,color:c.dimm,textAlign:"center"}}>
                                      Reload Epicbet tab to capture full bet details
                                    </div>
                                  )}
                                </>);
                              })()}
                            </div>
                          </div>
                        ))}
                      </div>
                )}

                {/* HISTORY tab */}
                {epicbetTab==="history"&&(
                  settled.length===0
                    ? <div style={{textAlign:"center",padding:"30px 0",color:c.dim,fontSize:11}}>No settled bets — visit epicbet.com to sync history</div>
                    : <div style={{overflowX:"auto"}}>
                        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                          <thead><tr>
                            {["ID","Type","Odds","Stake","P/L","Status"].map(h=>(
                              <th key={h} style={{padding:"6px 8px",textAlign:"left",color:c.dim,fontSize:8,letterSpacing:"1px",borderBottom:`1px solid ${c.brd}`}}>{h}</th>
                            ))}
                          </tr></thead>
                          <tbody>{settled.slice(0,50).map((b,i)=>{
                            const pl = b.status==='won' ? (b.actualPayout||b.potentialPayout||0)-(b.stake||0) : -(b.stake||0);
                            return (
                              <tr key={i} style={{borderBottom:`1px solid ${c.bg}`}}>
                                <td style={{padding:"6px 8px",color:c.dimm}}>{b.id||"–"}</td>
                                <td style={{padding:"6px 8px",color:c.txt}}>{b.type} {b.legs>1?`×${b.legs}`:""}</td>
                                <td style={{padding:"6px 8px",color:c.b}}>{(b.totalOdds||0).toFixed(2)}</td>
                                <td style={{padding:"6px 8px",color:c.txt}}>€{(b.stake||0).toFixed(2)}</td>
                                <td style={{padding:"6px 8px",fontWeight:700,color:pl>=0?c.g:c.r}}>{pl>=0?"+":""}€{pl.toFixed(2)}</td>
                                <td style={{padding:"6px 8px"}}>
                                  <span style={{fontSize:8,fontWeight:700,padding:"2px 8px",borderRadius:3,
                                    background:b.status==='won'?`${c.g}20`:b.status==='lost'?`${c.r}20`:`${c.y}20`,
                                    color:b.status==='won'?c.g:b.status==='lost'?c.r:c.y}}>
                                    {b.status.toUpperCase()}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}</tbody>
                        </table>
                      </div>
                )}
              </div>
            );
          })()}

          {/* ── Manual Bet Log ── */}
          <div style={{background:c.card,border:`1px solid ${c.brd}`,borderRadius:10,padding:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
              <div style={{fontSize:9,letterSpacing:"3px",color:c.dim}}>BET LOG</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <Btn variant="g" onClick={()=>setShowBetForm(!showBetForm)} style={{padding:"6px 14px",fontSize:10}}>{showBetForm?"CANCEL":"+ LOG REAL BET"}</Btn>
                {betHistory.length>0&&<Btn variant="r" onClick={()=>{setBetHistory([]);setBankroll(startingBankroll);}} style={{padding:"6px 14px",fontSize:10}}>RESET</Btn>}
              </div>
            </div>
            {/* Manual bet form */}
            {showBetForm&&(
              <div style={{background:c.bg,border:`1px solid ${c.g}30`,borderRadius:10,padding:16,marginBottom:16}}>
                <div style={{fontSize:9,letterSpacing:"3px",color:c.g,marginBottom:12}}>LOG BET FROM ACCOUNT</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginBottom:12}}>
                  {[
                    {k:"match",l:"Match",ph:"e.g. Tiafoe vs Zverev"},
                    {k:"pick",l:"Your Pick",ph:"e.g. Tiafoe +1.5 sets"},
                    {k:"odds",l:"Odds",ph:"e.g. 1.83"},
                    {k:"stake",l:"Stake ("+settings.currency+")",ph:"e.g. 50"},
                  ].map(({k,l,ph})=>(
                    <div key={k}>
                      <div style={{fontSize:8,color:c.dim,letterSpacing:"1px",marginBottom:4}}>{l.toUpperCase()}</div>
                      <input value={betForm[k]} onChange={e=>setBetForm(p=>({...p,[k]:e.target.value}))}
                        placeholder={ph}
                        style={{width:"100%",padding:"8px 10px",borderRadius:6,background:c.card,border:`1px solid ${c.brdL}`,
                          color:c.w,fontFamily:"inherit",fontSize:11,outline:"none"}}/>
                    </div>
                  ))}
                  <div>
                    <div style={{fontSize:8,color:c.dim,letterSpacing:"1px",marginBottom:4}}>BOOKMAKER</div>
                    <select value={betForm.book} onChange={e=>setBetForm(p=>({...p,book:e.target.value}))}
                      style={{width:"100%",padding:"8px 10px",borderRadius:6,background:c.card,border:`1px solid ${c.brdL}`,color:c.w,fontFamily:"inherit",fontSize:11}}>
                      {BOOKS.map(b=><option key={b.key} value={b.key}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <Btn variant="g" onClick={logManualBet} style={{padding:"8px 18px",fontSize:10}}>LOG BET (PENDING)</Btn>
                  <span style={{fontSize:9,color:c.dim}}>Result will be settable once the match is over</span>
                </div>
              </div>
            )}
            {betHistory.length===0?(
              <div style={{textAlign:"center",padding:"50px 20px",color:c.dim}}><div style={{fontSize:28,marginBottom:8}}>◇</div><div style={{fontSize:12}}>No bets yet. Place bets from the Feed or Scanner tab.</div></div>
            ):(<>
              {/* P&L sparkline */}
              <div style={{marginBottom:14,padding:"10px 14px",background:c.bg,borderRadius:8,border:`1px solid ${c.brd}`}}>
                <div style={{fontSize:8,color:c.dim,letterSpacing:"1px",marginBottom:6}}>BANKROLL HISTORY</div>
                <div style={{display:"flex",height:50,alignItems:"flex-end",gap:2}}>
                  {(()=>{const vals=[startingBankroll||bankroll||0,...betHistory.filter(b=>b.bankroll!=null).map(b=>b.bankroll)];
                    const mn=Math.min(...vals),mx=Math.max(...vals),rng=mx-mn||1;
                    return vals.map((v,i)=><div key={i} style={{flex:1,height:`${Math.max(2,(v-mn)/rng*100)}%`,background:v>=(startingBankroll||0)?c.g:c.r,borderRadius:"1px 1px 0 0",opacity:.8}}/>);
                  })()}
                </div>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead><tr>{["#","Match","Pick","Book","Odds","EV","Stake","P/L","Bankroll"].map(h=>(
                    <th key={h} style={{padding:8,textAlign:"left",color:c.dim,fontWeight:600,letterSpacing:"1px",fontSize:8,borderBottom:`1px solid ${c.brd}`}}>{h}</th>
                  ))}</tr></thead>
                  <tbody>{betHistory.map((b,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid ${c.bg}`,background:b.settled===false?`${c.y}06`:"transparent"}}>
                      <td style={{padding:"7px 8px",color:c.dimm}}>{i+1}</td>
                      <td style={{padding:"7px 8px",color:c.txt,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {b.match}{b.type==="manual"&&<span style={{fontSize:7,color:c.y,marginLeft:5,fontWeight:700}}>MANUAL</span>}
                      </td>
                      <td style={{padding:"7px 8px",color:c.w,fontWeight:600}}>{b.pick}</td>
                      <td style={{padding:"7px 8px"}}><BookTag bookKey={b.book?.toLowerCase()||""}/></td>
                      <td style={{padding:"7px 8px",color:c.b}}>{b.odds.toFixed(2)}</td>
                      <td style={{padding:"7px 8px",color:c.y}}>{b.value}</td>
                      <td style={{padding:"7px 8px",color:c.txt}}>{settings.currency}{b.stake}</td>
                      <td style={{padding:"7px 8px",fontWeight:700}}>
                        {b.settled===false
                          ? <div style={{display:"flex",gap:4}}>
                              <button onClick={()=>settleBet(i,true)} style={{padding:"2px 9px",borderRadius:4,fontSize:9,fontWeight:700,cursor:"pointer",border:"none",background:`${c.g}25`,color:c.g,fontFamily:"inherit"}}>WIN</button>
                              <button onClick={()=>settleBet(i,false)} style={{padding:"2px 9px",borderRadius:4,fontSize:9,fontWeight:700,cursor:"pointer",border:"none",background:`${c.r}25`,color:c.r,fontFamily:"inherit"}}>LOSS</button>
                            </div>
                          : <span style={{color:b.win?c.g:c.r}}>{b.profit>0?"+":""}{settings.currency}{b.profit}</span>
                        }
                      </td>
                      <td style={{padding:"7px 8px",fontWeight:700}}>
                        {b.settled===false
                          ? <span style={{fontSize:9,color:c.dim}}>pending</span>
                          : <span style={{color:b.bankroll>=(startingBankroll||0)?c.g:c.r}}>{settings.currency}{b.bankroll}</span>
                        }
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              {(()=>{
                const sb=betHistory.filter(b=>b.settled!==false);
                const wins=sb.filter(b=>b.win).length;
                const pending=betHistory.filter(b=>b.settled===false).length;
                return (
                  <div style={{marginTop:14,display:"flex",gap:12,flexWrap:"wrap"}}>
                    {[
                      {l:"WIN RATE",v:sb.length?`${(wins/sb.length*100).toFixed(0)}% (${wins}/${sb.length})`:"–",col:c.y},
                      {l:"TOTAL P/L",v:startingBankroll>0?`${bankroll>=startingBankroll?"+":""}${settings.currency}${(bankroll-startingBankroll).toFixed(0)}`:"–",col:bankroll>=startingBankroll?c.g:c.r},
                      {l:"AVG STAKE",v:`${settings.currency}${Math.round(betHistory.reduce((a,b)=>a+b.stake,0)/betHistory.length)}`,col:c.b},
                      {l:"PENDING",v:pending,col:pending>0?c.y:c.dimm},
                    ].map(({l,v,col},i)=>(
                      <div key={i} style={{background:c.bg,borderRadius:6,padding:"8px 14px",border:`1px solid ${c.brd}`}}>
                        <span style={{fontSize:9,color:c.dim}}>{l}: </span>
                        <span style={{fontSize:13,fontWeight:700,color:col}}>{v}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>)}
          </div>
          </div>
        )}
        {/* ════ RESEARCH ════ */}
        {activeTab==="research"&&(()=>{
          // All positive EV bets across all H2H markets
          const allBets = matchEdges.flatMap(e => {
            const bets = [];
            const m = e.match;
            if (e.p1Val>0&&e.p1Ok) bets.push({match:`${m.p1.name} vs ${m.p2.name}`,pick:m.p1.name,circuit:m.circuit,level:m.level,surface:m.surface,odds:e.bestP1.odds,book:e.bestP1.book,ev:e.p1Val,prob:e.p1True,kelly:(e.p1K*100).toFixed(1),status:m.status,id:m.id});
            if (e.p2Val>0&&e.p2Ok) bets.push({match:`${m.p1.name} vs ${m.p2.name}`,pick:m.p2.name,circuit:m.circuit,level:m.level,surface:m.surface,odds:e.bestP2.odds,book:e.bestP2.book,ev:e.p2Val,prob:e.p2True,kelly:(e.p2K*100).toFixed(1),status:m.status,id:m.id});
            return bets;
          }).sort((a,b)=>b.ev-a.ev);
          // Mispricing vs Pinnacle no-vig (or first book if no Pinnacle)
          const mispricings = [];
          allMatches.forEach(m => {
            const nvp = noVigProb(m);
            Object.entries(m.odds).forEach(([book,odds]) => {
              if (book==="pinnacle") return;
              const ev1 = (nvp.p1*odds.p1-1)*100;
              const ev2 = (nvp.p2*odds.p2-1)*100;
              if (ev1>1) mispricings.push({match:`${m.p1.name} vs ${m.p2.name}`,pick:m.p1.name,book,ev:ev1,odds:odds.p1,prob:nvp.p1,circuit:m.circuit,id:m.id});
              if (ev2>1) mispricings.push({match:`${m.p1.name} vs ${m.p2.name}`,pick:m.p2.name,book,ev:ev2,odds:odds.p2,prob:nvp.p2,circuit:m.circuit,id:m.id});
            });
          });
          mispricings.sort((a,b)=>b.ev-a.ev);
          // Per-circuit stats
          const circuitStats = ["ATP","WTA","CH","ITF"].map(circ=>{
            const ms = allMatches.filter(m=>m.circuit===circ);
            const es = matchEdges.filter(e=>e.match.circuit===circ);
            const avgMargin = ms.length ? ms.reduce((sum,m)=>{const{bestP1,bestP2}=getBestOdds(m);return sum+bookMargin(bestP1.odds,bestP2.odds);},0)/ms.length : 0;
            return {circ,matches:ms.length,valueBets:es.filter(e=>e.best).length,avgMargin,mispCount:mispricings.filter(x=>x.circuit===circ).length};
          });
          // Bookmaker performance
          const bookStats = BOOKS.map(b=>{
            let best=0,totalM=0,mCnt=0;
            allMatches.forEach(m=>{const{bestP1,bestP2}=getBestOdds(m);if(bestP1.book===b.key)best++;if(bestP2.book===b.key)best++;if(m.odds[b.key]){totalM+=bookMargin(m.odds[b.key].p1,m.odds[b.key].p2);mCnt++;}});
            return {key:b.key,name:b.abbr,best,avgMargin:mCnt?totalM/mCnt:0,alerts:mispricings.filter(x=>x.book===b.key).length};
          }).filter(b=>b.avgMargin>0).sort((a,b)=>b.best-a.best);
          return (
            <div>
              {/* Summary stats */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:20}}>
                {[{l:"EV OPPORTUNITIES",v:allBets.length,col:c.g},{l:"MISPRICING ALERTS",v:mispricings.length,col:c.y},{l:"TOP EV",v:allBets.length?`+${allBets[0].ev.toFixed(1)}%`:"–",col:c.g},{l:"MATCHES SCANNED",v:allMatches.length,col:c.b}].map((s,i)=>(
                  <div key={i} style={{textAlign:"center",padding:14,background:c.card,border:`1px solid ${c.brd}`,borderRadius:8}}>
                    <div style={{fontSize:8,color:c.dim,letterSpacing:"1px"}}>{s.l}</div>
                    <div style={{fontSize:22,fontWeight:800,color:s.col,marginTop:6}}>{s.v}</div>
                  </div>
                ))}
              </div>
              {/* EV Leaderboard */}
              <div style={{background:c.card,border:`1px solid ${c.g}30`,borderRadius:10,marginBottom:14,overflow:"hidden"}}>
                <div style={{padding:"12px 16px",borderBottom:`1px solid ${c.brd}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:9,letterSpacing:"3px",color:c.g}}>◆ EV LEADERBOARD — ALL POSITIVE EV BETS</div>
                  <span style={{fontSize:9,color:c.dim}}>Click row → Edge Scanner</span>
                </div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:600}}>
                    <thead><tr style={{background:c.bg}}>
                      {["#","Match","Pick","Circuit","Surface","Odds","Book","EV%","Prob","K%"].map(h=>(
                        <th key={h} style={{padding:"6px 12px",textAlign:"left",fontSize:8,color:c.dim,fontWeight:600,letterSpacing:"1px"}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {allBets.slice(0,20).map((b,i)=>(
                        <tr key={i} onClick={()=>{setSelectedMatch(b.id);setActiveTab("scanner");}}
                          style={{borderTop:`1px solid ${c.brd}`,cursor:"pointer",background:i<3?`${c.g}05`:"transparent"}}>
                          <td style={{padding:"6px 12px",color:i<3?c.g:c.dimm,fontWeight:700}}>{i+1}</td>
                          <td style={{padding:"6px 12px",color:c.dim,fontSize:10,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.match}</td>
                          <td style={{padding:"6px 12px",color:c.w,fontWeight:600,whiteSpace:"nowrap"}}>{b.pick}</td>
                          <td style={{padding:"6px 12px"}}><span style={{padding:"2px 6px",borderRadius:4,fontSize:8,fontWeight:700,background:`${CIRCUIT_COLOR[b.circuit]||c.dim}20`,color:CIRCUIT_COLOR[b.circuit]||c.dim}}>{b.circuit}</span></td>
                          <td style={{padding:"6px 12px",color:SURFACE_C[b.surface]||c.dim,fontSize:10}}>{b.surface}</td>
                          <td style={{padding:"6px 12px"}}><OB odds={b.odds} ok={true}/></td>
                          <td style={{padding:"6px 12px"}}><BookTag bookKey={b.book} highlight={true}/></td>
                          <td style={{padding:"6px 12px"}}><Badge value={b.ev}/></td>
                          <td style={{padding:"6px 12px",color:c.b}}>{(b.prob*100).toFixed(0)}%</td>
                          <td style={{padding:"6px 12px",color:c.y}}>{b.kelly}%</td>
                        </tr>
                      ))}
                      {allBets.length===0&&<tr><td colSpan={10} style={{padding:"30px",textAlign:"center",color:c.dim}}>No positive EV bets found — try adjusting settings or weights</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Mispricing Detector */}
              <div style={{background:c.card,border:`1px solid ${c.y}30`,borderRadius:10,marginBottom:14,overflow:"hidden"}}>
                <div style={{padding:"12px 16px",borderBottom:`1px solid ${c.brd}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:9,letterSpacing:"3px",color:c.y}}>⚡ MISPRICING DETECTOR — SOFT BOOK vs SHARP NO-VIG</div>
                  <span style={{fontSize:9,color:c.dim}}>Where books haven't adjusted vs Pinnacle/reference</span>
                </div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:500}}>
                    <thead><tr style={{background:c.bg}}>
                      {["#","Match","Pick","Circuit","Soft Book","Book Odds","Sharp Prob","EV Edge"].map(h=>(
                        <th key={h} style={{padding:"6px 12px",textAlign:"left",fontSize:8,color:c.dim,fontWeight:600}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {mispricings.slice(0,15).map((mp,i)=>(
                        <tr key={i} onClick={()=>{setSelectedMatch(mp.id);setActiveTab("scanner");}}
                          style={{borderTop:`1px solid ${c.brd}`,cursor:"pointer",background:mp.ev>10?`${c.r}06`:mp.ev>5?`${c.y}04`:"transparent"}}>
                          <td style={{padding:"6px 12px",color:mp.ev>10?c.r:mp.ev>5?c.y:c.dimm,fontWeight:700}}>{i+1}</td>
                          <td style={{padding:"6px 12px",color:c.dim,fontSize:10,maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{mp.match}</td>
                          <td style={{padding:"6px 12px",color:c.w,fontWeight:600,whiteSpace:"nowrap"}}>{mp.pick}</td>
                          <td style={{padding:"6px 12px"}}><span style={{padding:"2px 6px",borderRadius:4,fontSize:8,fontWeight:700,background:`${CIRCUIT_COLOR[mp.circuit]||c.dim}20`,color:CIRCUIT_COLOR[mp.circuit]||c.dim}}>{mp.circuit}</span></td>
                          <td style={{padding:"6px 12px"}}><BookTag bookKey={mp.book} highlight={mp.ev>5}/></td>
                          <td style={{padding:"6px 12px"}}><OB odds={mp.odds} ok={true}/></td>
                          <td style={{padding:"6px 12px",color:c.b}}>{(mp.prob*100).toFixed(1)}%</td>
                          <td style={{padding:"6px 12px",fontWeight:700,color:mp.ev>10?c.r:mp.ev>5?c.y:c.g}}>+{mp.ev.toFixed(1)}%</td>
                        </tr>
                      ))}
                      {mispricings.length===0&&<tr><td colSpan={8} style={{padding:"30px",textAlign:"center",color:c.dim}}>No mispricing found — all soft book odds within normal range of Pinnacle baseline</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Circuit Analysis + Bookmaker Rankings */}
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14,marginBottom:14}}>
                <div style={{background:c.card,border:`1px solid ${c.brd}`,borderRadius:10,overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",borderBottom:`1px solid ${c.brd}`}}>
                    <div style={{fontSize:9,letterSpacing:"3px",color:c.b}}>CIRCUIT ANALYSIS</div>
                  </div>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead><tr style={{background:c.bg}}>
                      {["Circuit","Matches","Value","Avg Margin","Mispricing"].map(h=>(
                        <th key={h} style={{padding:"6px 12px",textAlign:"left",fontSize:8,color:c.dim}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {circuitStats.filter(r=>r.matches>0).map((r,i)=>(
                        <tr key={i} style={{borderTop:`1px solid ${c.brd}`}}>
                          <td style={{padding:"8px 12px"}}><span style={{padding:"2px 8px",borderRadius:4,fontSize:9,fontWeight:700,background:`${CIRCUIT_COLOR[r.circ]}20`,color:CIRCUIT_COLOR[r.circ]}}>{r.circ}</span></td>
                          <td style={{padding:"8px 12px",color:c.txt}}>{r.matches}</td>
                          <td style={{padding:"8px 12px",fontWeight:700,color:r.valueBets>0?c.g:c.dimm}}>{r.valueBets}</td>
                          <td style={{padding:"8px 12px",color:r.avgMargin>6?c.r:r.avgMargin>3?c.y:c.g}}>{r.avgMargin.toFixed(1)}%</td>
                          <td style={{padding:"8px 12px",color:r.mispCount>0?c.y:c.dimm}}>{r.mispCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{background:c.card,border:`1px solid ${c.brd}`,borderRadius:10,overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",borderBottom:`1px solid ${c.brd}`}}>
                    <div style={{fontSize:9,letterSpacing:"3px",color:c.b}}>BOOKMAKER RANKINGS</div>
                  </div>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead><tr style={{background:c.bg}}>
                      {["Book","Best Price×","Avg Margin","Alerts"].map(h=>(
                        <th key={h} style={{padding:"6px 12px",textAlign:"left",fontSize:8,color:c.dim}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {bookStats.map((b,i)=>(
                        <tr key={i} style={{borderTop:`1px solid ${c.brd}`}}>
                          <td style={{padding:"8px 12px"}}><BookTag bookKey={b.key} highlight={i===0}/></td>
                          <td style={{padding:"8px 12px",fontWeight:700,color:b.best>3?c.g:c.dimm}}>{b.best}×</td>
                          <td style={{padding:"8px 12px",color:b.avgMargin>6?c.r:b.avgMargin>3?c.y:c.g}}>{b.avgMargin.toFixed(2)}%</td>
                          <td style={{padding:"8px 12px",color:b.alerts>0?c.y:c.dimm}}>{b.alerts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Style Clash Matrix */}
              <div style={{background:c.card,border:`1px solid ${c.brd}`,borderRadius:10,padding:16}}>
                <div style={{fontSize:9,letterSpacing:"3px",color:c.dim,marginBottom:8}}>⚔️ STYLE CLASH MATRIX — EDGE MODIFIER (HARD COURTS)</div>
                <p style={{fontSize:10,color:c.dim,marginBottom:12}}>Row = attacker style · Column = opponent style. Values show edge bonus (%). Clay: serve-dom −3, counter +2.5. Grass: serve-dom +3, counter −2.5.</p>
                <div style={{overflowX:"auto"}}>
                  <table style={{borderCollapse:"collapse",fontSize:10}}>
                    <thead>
                      <tr>
                        <th style={{padding:"4px 12px",fontSize:8,color:c.dim,textAlign:"left"}}>ATK ▷ vs ▼ DEF</th>
                        {Object.keys(STYLE_CLASH_MTX).map(s=>(
                          <th key={s} style={{padding:"4px 12px",fontSize:8,color:c.dim,textAlign:"center",whiteSpace:"nowrap"}}>{s}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(STYLE_CLASH_MTX).map(([rowStyle,cols])=>(
                        <tr key={rowStyle}>
                          <td style={{padding:"5px 12px",fontSize:9,color:c.txt,fontWeight:600,whiteSpace:"nowrap",borderTop:`1px solid ${c.brd}`}}>{rowStyle}</td>
                          {Object.entries(cols).map(([colStyle,val])=>{
                            const col = val>0.03?c.g:val>0?`#00e87b80`:val<-0.03?c.r:val<0?`${c.r}80`:c.dimm;
                            return <td key={colStyle} style={{padding:"5px 12px",textAlign:"center",fontWeight:700,color:col,background:`${col}14`,borderTop:`1px solid ${c.brd}`}}>{val>0?"+":""}{(val*100).toFixed(0)}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        input[type=range]{-webkit-appearance:none;height:3px;border-radius:2px;background:#151d2b;outline:none}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#00e87b;cursor:pointer;border:2px solid #06080d}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#06080d}::-webkit-scrollbar-thumb{background:#1c2840;border-radius:3px}
        *{box-sizing:border-box;margin:0;padding:0}
        select{cursor:pointer}
        a{color:#3b8bff}
      `}</style>
    </div>
  );
}
