/* The cozy home */
(() => {
'use strict';
const C = window.DREAMHOUSE_CONFIG || {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
const KEY = 'dataDayDreamhouse.v1';
const who = () => ((C.herTitle ? C.herTitle + ' ' : '') + (C.herName || 'friend'));
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const svg = (tag, attrs = {}, parent, html) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };

/* ---------- state ---------- */
const DEF = { cubes: 12, dust: 0, cards: {}, watch: [], built: 0, lamp: { x: 250, y: 330 }, nextPack: 0, packs: 0, read: 0, view: "nyc", rat: false, night: false, music: true };
let S;
try { S = { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { S = { ...DEF }; }
let mood = null;          // not persisted: she's asked every visit
let lastFeed = 0;
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const hard = () => mood === 'happy';

/* ---------- tiny helpers ---------- */
function squash(el) {
  if (!el) return;
  el.classList.remove('jelly');
  void el.getBoundingClientRect();
  el.classList.add('jelly');
  el.addEventListener('animationend', () => el.classList.remove('jelly'), { once: true });
}
document.addEventListener('pointerdown', e => { const b = e.target.closest('button, .jellyable'); if (b && !b.classList.contains('bubble')) squash(b); });

function floatEmoji(txt, x, y) {
  const d = document.createElement('div'); d.className = 'float'; d.textContent = txt;
  d.style.left = (x - 12 + rnd(-14, 14)) + 'px'; d.style.top = (y - 20) + 'px';
  document.body.appendChild(d); setTimeout(() => d.remove(), 1300);
}
const burst = (e, list) => { const x = e.clientX || innerWidth / 2, y = e.clientY || innerHeight / 2; list.forEach((t, i) => setTimeout(() => floatEmoji(t, x, y), i * 90)); };
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3600); }
const say = msg => { $('#hint').textContent = msg; };
function tex(el, s, display) { if (window.katex) { try { window.katex.render(s, el, { throwOnError: false, displayMode: !!display }); return; } catch (e) {} } el.textContent = s; }

function stats(pulse) {
  $('#cubes b').textContent = S.cubes; $('#dust b').textContent = S.dust;
  if (pulse) { squash($('#cubes')); squash($('#dust')); }
  const total = Object.keys(S.cards).length;
  $('#dotCards').classList.toggle('show', S.packs > 0);
  $('#dotMail').classList.toggle('show', letters.length > S.read);
  if ($('#cardCount')) $('#cardCount').textContent = total + ' / ' + CARDS.length;
}
function gain(cubes = 0, dust = 0) { S.cubes += cubes; S.dust += dust; save(); stats(true); renderBuild(); }

/* ---------- audio (all synthesised: no files, no copyright) ---------- */
const AU = (() => {
  let ctx, master, mus, lp, timer, step = 0, nextT = 0, on = false, bpm = 76, rat = false, garden = false;
  const CH = [[174.61, 220, 261.63, 329.63], [164.81, 196, 246.94, 293.66], [146.83, 174.61, 220, 261.63], [130.81, 164.81, 196, 246.94]];
  const BASS = [87.31, 82.41, 73.42, 65.41];
  const PENT = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];
  function init() {
    if (ctx) return true;
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return false;
    ctx = new A(); master = ctx.createGain(); master.gain.value = .9; master.connect(ctx.destination);
    lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1700;
    mus = ctx.createGain(); mus.gain.value = 0; mus.connect(lp); lp.connect(master);
    return true;
  }
  function osc(f, t, d, type, v, dest, det = 0) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f; o.detune.value = det;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + d + .05);
  }
  function noise(t, d, v, freq, dest) {
    const n = Math.max(1, ctx.sampleRate * d | 0), b = ctx.createBuffer(1, n, ctx.sampleRate), x = b.getChannelData(0);
    for (let i = 0; i < n; i++) x[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = b;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t);
  }
  function kick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + .18);
    g.gain.setValueAtTime(.45, t); g.gain.exponentialRampToValueAtTime(.001, t + .28);
    o.connect(g); g.connect(mus); o.start(t); o.stop(t + .3);
  }
  function chirp(t) {
    const o = ctx.createOscillator(), g = ctx.createGain(), f = rnd(2400, 3600);
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.35, t + .08); o.frequency.exponentialRampToValueAtTime(f * .9, t + .16);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.05, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .18);
    o.connect(g); g.connect(mus); o.start(t); o.stop(t + .2);
  }
  function sched(s, t) {
    const bar = Math.floor(s / 8) % 4, st = s % 8, ch = CH[bar];
    const det = rat ? rnd(-130, 20) - 120 : 0;
    const sw = st % 2 ? .035 : 0; t += sw;
    if (garden) {
      osc(ch[st % 4] * 2, t, 1.1, 'triangle', .09, mus, det);
      if (st === 0) osc(BASS[bar] * 2, t, 2, 'sine', .08, mus, det);
      if (Math.random() < .12) chirp(t + rnd(0, .3));
      return;
    }
    if (st === 0) ch.forEach((f, i) => osc(f, t + i * .012, 2.4, 'triangle', .05, mus, det));
    if (st === 0 || st === 4) osc(BASS[bar], t, .9, 'sine', .2, mus, det);
    if (st === 0 || st === 5) kick(t);
    if (st === 2 || st === 6) noise(t, .12, .12, 1800, mus);
    noise(t, .03, .025, 7000, mus);
    if (Math.random() < .3) osc(pick(PENT), t, 1.2, 'sine', .07, mus, det);
    if (Math.random() < .5) noise(t, .02, .012, 3000, mus);
  }
  function tick() { while (nextT < ctx.currentTime + .25) { sched(step, nextT); nextT += 60 / bpm / 2 * (rat ? 1.15 : 1); step++; } }
  return {
    start() { if (!init()) return; ctx.resume(); clearInterval(timer); on = true; nextT = ctx.currentTime + .1; mus.gain.cancelScheduledValues(ctx.currentTime); mus.gain.linearRampToValueAtTime(.9, ctx.currentTime + 1.5); timer = setInterval(tick, 60); },
    stop() { if (!ctx || !on) return; on = false; mus.gain.cancelScheduledValues(ctx.currentTime); mus.gain.linearRampToValueAtTime(0, ctx.currentTime + .8); setTimeout(() => { if (!on) clearInterval(timer); }, 900); },
    isOn: () => on,
    mode(o) { if ('bpm' in o) bpm = o.bpm; if ('rat' in o) rat = o.rat; if ('garden' in o) garden = o.garden; if (lp) lp.frequency.value = rat ? 1100 : 1700; },
    sfx(kind, p = 1) {
      if (!init()) return; ctx.resume(); const t = ctx.currentTime;
      if (kind === 'pop') {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.setValueAtTime(420 * p, t); o.frequency.exponentialRampToValueAtTime(900 * p, t + .06);
        g.gain.setValueAtTime(.25, t); g.gain.exponentialRampToValueAtTime(.001, t + .12);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + .14); noise(t, .04, .12, 2500, master);
      } else if (kind === 'boop') osc(180, t, .25, 'sine', .2, master);
      else if (kind === 'chime') [659, 784, 988, 1319].forEach((f, i) => osc(f * p, t + i * .09, .8, 'sine', .13, master));
      else if (kind === 'ding') osc(880 * p, t, .5, 'triangle', .16, master);
      else if (kind === 'squeak') { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(1500, t + .08); g.gain.setValueAtTime(.05, t); g.gain.exponentialRampToValueAtTime(.001, t + .12); o.connect(g); g.connect(master); o.start(t); o.stop(t + .13); }
    }
  };
})();
const sfx = (k, p) => AU.sfx(k, p);
function musicOn(v) { S.music = v; $('#btnMusic').classList.toggle('on', v); v ? AU.start() : AU.stop(); save(); }
function audioMode() { AU.mode({ garden: S.view === 'garden', rat: S.rat, bpm: mood === 'happy' ? 92 : mood === 'tired' ? 62 : mood === 'sad' ? 70 : 76 }); }

/* ---------- cards data ---------- */
const CARDS = [
  { id: 'bayes', name: 'Bayesian Brown Cat', type: 'Logic / Fluff', emoji: '🐈', rar: 'common', flavor: 'Updates her priors every time you pet her.' },
  { id: 'grad', name: 'Gradient Descent Capybara', type: 'Math / Chill', emoji: '🦫', rar: 'rare', flavor: 'Reaches the global minimum of stress, one slow step at a time.' },
  { id: 'gold', name: 'Gold-bird the Watcher', type: 'Mystery / Birb', emoji: '🐦', rar: 'rare', flavor: 'Watches from a distance. Means well. Probably.' },
  { id: 'eigen', name: 'Eigen-Hedgehog', type: 'Algebra / Spiky', emoji: '🦔', rar: 'common', flavor: 'Only ever scales. Never turns on you.' },
  { id: 'panda', name: 'Panda Tea-Master', type: 'Tea / Zen', emoji: '🐼', rar: 'rare', flavor: 'Serves every cup at exactly the right temperature.' },
  { id: 'rat', name: 'The Wet Rat of Destiny', type: 'Gremlin / Soggy', emoji: '🐀', rar: 'ultra', flavor: 'Dripping. Towel-wrapped. Unstoppable.' },
  { id: 'fibo', name: 'Fibonacci Snail', type: 'Nature / Spiral', emoji: '🐌', rar: 'common', flavor: 'Each shell turn is the sum of the last two. Never rushes.' },
  { id: 'rac', name: 'Regression Raccoon', type: 'Data / Sneaky', emoji: '🦝', rar: 'common', flavor: 'Steals outliers. Returns a very good fit.' },
  { id: 'tutu', name: 'Tutu Tortoise', type: 'Dance / Slow', emoji: '🐢', rar: 'common', flavor: 'Pirouettes take a while. Worth it.' },
  { id: 'ravi', name: 'Ravioli Ghost', type: 'Snack / Spooky', emoji: '👻', rar: 'rare', flavor: 'Haunts only the kitchen. Always leaves a pop.' },
  { id: 'lamp', name: 'Sunset Lamp Sprite', type: 'Light / Cozy', emoji: '🪔', rar: 'common', flavor: 'Turns any corner into 6:45pm.' },
  { id: 'weasel', name: 'Weasel Postmaster', type: 'Mail / Zoomies', emoji: '🦡', rar: 'ultra', flavor: 'Has never lost a letter. Has often lost a sock.' },
  { id: 'swan', name: 'Prima Ballerina Swan', type: 'Ballet / Graceful', emoji: '🦢', rar: 'rare', flavor: 'Every entrance is a standing ovation.' },
  { id: 'bunny', name: 'Confession Bridge Bunny', type: 'Romance / Fluff', emoji: '🐇', rar: 'common', flavor: 'Always nearby when someone is about to say something brave.' },
  { id: 'fox', name: 'Festival Fireworks Fox', type: 'Romance / Summer', emoji: '🦊', rar: 'rare', flavor: 'Holds your hand through the crowd. Wins every goldfish game.' },
  { id: 'dove', name: 'Love Letter Dove', type: 'Romance / Mail', emoji: '🕊️', rar: 'common', flavor: 'Delivers feelings. Never reads them first.' },
  { id: 'dango', name: 'Sakura Dango Spirit', type: 'Snack / Spring', emoji: '🍡', rar: 'common', flavor: 'Three flavors, zero worries.' },
  { id: 'knight', name: 'Nightlight Knight', type: 'Guardian / Brave', emoji: '🛡️', rar: 'rare', flavor: 'Checks under the bed so you never have to.' },
  { id: 'crown', name: 'Her Royal Highness', type: 'Royalty / Cozy', emoji: '👑', rar: 'ultra', flavor: 'Does not need to be told twice. Is told anyway.' }
];
let letters = (C.letters || []).slice();

/* ---------- the room ---------- */
const R = $('#room');
const P = (u, v, z = 0) => [400 + 28 * (u - v), 230 + 14 * (u + v) - z];
const pts = a => a.map(p => p.map(n => +n.toFixed(1)).join(',')).join(' ');
function tone(hex) {
  const n = parseInt(hex.slice(1), 16);
  const f = k => `rgb(${Math.min(255, (n >> 16 & 255) * k) | 0},${Math.min(255, (n >> 8 & 255) * k) | 0},${Math.min(255, (n & 255) * k) | 0})`;
  return [f(1.05), f(.92), f(.8)];
}
function box(g, u, v, w, d, h, hex, z0 = 0) {
  const c = tone(hex);
  svg('polygon', { points: pts([P(u, v + d, z0), P(u + w, v + d, z0), P(u + w, v + d, z0 + h), P(u, v + d, z0 + h)]), fill: c[1] }, g);
  svg('polygon', { points: pts([P(u + w, v, z0), P(u + w, v + d, z0), P(u + w, v + d, z0 + h), P(u + w, v, z0 + h)]), fill: c[2] }, g);
  svg('polygon', { points: pts([P(u, v, z0 + h), P(u + w, v, z0 + h), P(u + w, v + d, z0 + h), P(u, v + d, z0 + h)]), fill: c[0] }, g);
}
function btn(el, label, fn) {
  el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0'); el.setAttribute('aria-label', label); el.classList.add('svgbtn');
  el.addEventListener('click', fn);
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const b = el.getBoundingClientRect(); fn({ clientX: b.x + b.width / 2, clientY: b.y }); } });
  const t = svg('title', {}, el); t.textContent = label;
}
const toSvg = e => { const p = R.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(R.getScreenCTM().inverse()); };

function buildRoom() {
  const L = P(0, 10), B = P(0, 0), Rr = P(10, 0), F = P(10, 10);
  const down = p => [p[0], p[1] + 16];
  const wallH = 190;
  let s = `<defs>
    <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a432e"/><stop offset=".55" stop-color="#8b5a3a"/><stop offset="1" stop-color="#c58f5c"/></linearGradient>
    <linearGradient id="shadeG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd18a"/><stop offset="1" stop-color="#ff8f7a"/></linearGradient>
    <linearGradient id="skyN" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#241e5c"/><stop offset="1" stop-color="#8a4fa0"/></linearGradient>
    <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd8ff"/><stop offset="1" stop-color="#e2f5ff"/></linearGradient>
    <radialGradient id="lampGrad" gradientUnits="userSpaceOnUse" cx="250" cy="250" r="320">
      <stop id="ls0" offset="0" stop-color="#ffc27a" stop-opacity=".3"/><stop id="ls1" offset=".4" stop-color="#ffb070" stop-opacity=".08"/><stop id="ls2" offset="1" stop-color="#12163a" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="winClip"><rect width="112" height="80"/></clipPath>
  </defs>`;
  // slab + floor
  s += `<polygon points="${pts([L, F, down(F), down(L)])}" fill="#e6c2d1"/><polygon points="${pts([F, Rr, down(Rr), down(F)])}" fill="#d5a9bc"/>`;
  s += `<polygon points="${pts([B, Rr, F, L])}" fill="#f7e8de"/>`;
  for (let i = 1; i < 10; i++) s += `<polyline points="${pts([P(0, i), P(10, i)])}" stroke="rgba(190,140,120,.22)" fill="none"/>`;
  // walls
  s += `<polygon points="${pts([L, B, P(0, 0, wallH), P(0, 10, wallH)])}" fill="#ffd6e5"/>`;
  s += `<polygon points="${pts([B, Rr, P(10, 0, wallH), P(0, 0, wallH)])}" fill="#ffe9f1"/>`;
  s += `<polyline points="${pts([P(0, 10, wallH), P(0, 0, wallH), P(10, 0, wallH)])}" stroke="#fff" stroke-width="4" fill="none" stroke-linejoin="round"/>`;
  s += `<polyline points="${pts([P(0, 10, 8), P(0, 0, 8), P(10, 0, 8)])}" stroke="#fff" stroke-width="6" fill="none" opacity=".9"/>`;
  R.innerHTML = s;
  const mk = (id, parent = R) => { const g = svg('g', { id }, parent); return g; };

  // window (left wall, u=0, v 7→3). local box 112x80
  const w0 = P(0, 7, 160);
  const win = svg('g', { transform: `matrix(1,-0.5,0,1,${w0[0].toFixed(1)},${w0[1].toFixed(1)})` }, R);
  const winView = svg('g', { id: 'winView', 'clip-path': 'url(#winClip)' }, win);
  svg('g', { id: 'winFrame', fill: 'none', stroke: '#fff', 'stroke-width': 4 }, win, `<rect x="-1" y="-1" width="114" height="82" rx="2"/><line x1="56" y1="0" x2="56" y2="80" stroke-width="3"/><line x1="0" y1="40" x2="112" y2="40" stroke-width="3"/>`);

  // right wall: lego shelf, poster, switch
  const sh = P(1.6, 0, 150);
  svg('g', { transform: `matrix(1,.5,0,1,${sh[0]},${sh[1]})` }, R,
    `<rect x="0" y="34" width="78" height="5" rx="2" fill="#fff"/>` +
    [['#ff7fae', 4, 14, 18, 20], ['#7fc8ff', 24, 8, 16, 26], ['#ffe27f', 42, 18, 14, 16], ['#9be7a8', 58, 10, 16, 24]].map(([c, x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${c}"/><circle cx="${x + w / 3}" cy="${y}" r="2.6" fill="${c}"/><circle cx="${x + 2 * w / 3}" cy="${y}" r="2.6" fill="${c}"/>`).join(''));
  const po = P(5.4, 0, 160);
  svg('g', { transform: `matrix(1,.5,0,1,${po[0]},${po[1]})` }, R,
    `<rect width="82" height="58" rx="3" fill="#fff" stroke="#ffb5d0" stroke-width="4"/><text x="41" y="25" text-anchor="middle" font-family="Fraunces,serif" font-weight="700" font-size="13" fill="#7a4a63">e^(iπ) + 1 = 0</text><text x="41" y="44" text-anchor="middle" font-family="Caveat,cursive" font-size="14" fill="#c36b93">still beautiful</text>`);
  const sw = P(4.2, 0, 92);
  const swg = svg('g', { transform: `matrix(1,.5,0,1,${sw[0]},${sw[1]})`, id: 'wallSwitch' }, R,
    `<rect width="22" height="32" rx="5" fill="#fff" stroke="#ffb5d0" stroke-width="2.5"/><rect id="swLever" x="6" y="6" width="10" height="9" rx="3" fill="#ff7fae"/>`);
  btn(swg, 'Switch the window view', () => { S.view = S.view === 'nyc' ? 'garden' : 'nyc'; save(); drawWindow(); audioMode(); sfx('pop', 1.3); say(S.view === 'nyc' ? 'our dream city at night: cars, city lights, lofi beats.' : 'The garden: wind in the trees and a guitar nearby.'); });

  mk('gItems'); mk('gChars'); mk('lamp');
  svg('rect', { id: 'shade', width: 800, height: 560, fill: 'url(#lampGrad)', 'pointer-events': 'none' }, R);
  drawWindow(); drawItems(); drawChars(); drawLamp();
}

function drawWindow() {
  const g = $('#winView');
  if (S.view === 'nyc') {
    let s = `<rect width="112" height="80" fill="url(#skyN)"/><circle cx="92" cy="14" r="7" fill="#fff6d8"/>`;
    [[4, 36, 16], [22, 24, 14], [38, 42, 18], [58, 30, 13], [73, 38, 16], [91, 28, 14]].forEach(([x, y, w], i) => {
      s += `<rect x="${x}" y="${y}" width="${w}" height="${80 - y}" fill="${i % 2 ? '#2f2a64' : '#3a3470'}"/>`;
      for (let r = 0; r < (74 - y) / 7; r++) for (let c = 0; c < Math.floor(w / 5); c++) if ((i * 7 + r * 3 + c * 5) % 4) s += `<rect x="${x + 2 + c * 5}" y="${y + 3 + r * 7}" width="2.6" height="3.4" fill="#ffd87a"/>`;
    });
    s += `<rect y="73" width="112" height="7" fill="#1d1b3a"/>
      <g class="car"><rect y="67" width="14" height="5" rx="2" fill="#ff7fae"/><rect x="3" y="64" width="8" height="4" rx="2" fill="#ffd0e1"/><circle cx="3" cy="73" r="2" fill="#111"/><circle cx="11" cy="73" r="2" fill="#111"/><rect x="13" y="68" width="2" height="2" fill="#fff7a8"/></g>
      <g class="car car2"><rect y="67" width="14" height="5" rx="2" fill="#7fc8ff"/><rect x="3" y="64" width="8" height="4" rx="2" fill="#d6efff"/><circle cx="3" cy="73" r="2" fill="#111"/><circle cx="11" cy="73" r="2" fill="#111"/><rect x="13" y="68" width="2" height="2" fill="#fff7a8"/></g>`;
    g.innerHTML = s;
  } else {
    g.innerHTML = `<rect width="112" height="80" fill="url(#skyG)"/><circle cx="20" cy="16" r="9" fill="#fff3b0"/>
      <ellipse cx="30" cy="84" rx="62" ry="26" fill="#a9e2a3"/><ellipse cx="92" cy="86" rx="52" ry="24" fill="#86cf8b"/>
      <g class="sway"><rect x="76" y="34" width="5" height="34" fill="#9a6b4a"/><circle cx="78" cy="30" r="15" fill="#ffb7d0"/><circle cx="68" cy="38" r="10" fill="#ffc9dc"/><circle cx="89" cy="37" r="10" fill="#ff9fc2"/></g>
      ${[[12, 66], [24, 70], [40, 64], [52, 72]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#ff9ec2"/><circle cx="${x}" cy="${y}" r="1" fill="#fff3b0"/>`).join('')}
      <path class="bird" d="M0 20 q3 -4 6 0 q3 -4 6 0" stroke="#5a3a4c" stroke-width="1.4" fill="none"/>
      <path class="bird bird2" d="M0 34 q2 -3 4 0 q2 -3 4 0" stroke="#5a3a4c" stroke-width="1.2" fill="none"/>`;
  }
  const lv = $('#swLever'); if (lv) lv.setAttribute('y', S.view === 'nyc' ? 6 : 17);
}

const TEA = [['Foundation', 5], ['Walls', 6], ['Door', 3], ['Roof', 8], ['Panda sign', 8], ['Lantern', 4]];
function drawItems(newPiece = -1) {
  const g = $('#gItems'); g.innerHTML = '';
  // rug
  svg('polygon', { points: pts([P(3.2, 3.6), P(7.4, 3.6), P(7.4, 8), P(3.2, 8)]), fill: '#ffc0d8' }, g);
  svg('polygon', { points: pts([P(3.6, 4), P(7, 4), P(7, 7.6), P(3.6, 7.6)]), fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-dasharray': '6 5' }, g);
  // panda tea house
  const pieces = [
    gg => box(gg, 1.4, .5, 3.2, 2.6, 8, '#ffffff'),
    gg => box(gg, 1.7, .8, 2.6, 2, 34, '#fff1f6', 8),
    gg => { svg('polygon', { points: pts([P(4.3, 1.3, 8), P(4.3, 2.1, 8), P(4.3, 2.1, 30), P(4.3, 1.3, 30)]), fill: '#e5679a' }, gg); svg('polygon', { points: pts([P(2.3, 2.8, 20), P(3.5, 2.8, 20), P(3.5, 2.8, 31), P(2.3, 2.8, 31)]), fill: '#cfeaff' }, gg); },
    gg => { box(gg, 1.1, .2, 3.6, 3, 10, '#ff8fb8', 42); box(gg, 1.9, .9, 2.2, 1.6, 8, '#ff9ec2', 52); },
    gg => { box(gg, 2.7, 1.25, 1, 1, 10, '#ffffff', 60); box(gg, 2.55, 1.1, .35, .35, 5, '#2b2230', 68); box(gg, 3.45, 1.1, .35, .35, 5, '#2b2230', 68); box(gg, 2.85, 2.1, .3, .15, 3, '#2b2230', 62); box(gg, 3.35, 2.1, .3, .15, 3, '#2b2230', 62); },
    gg => { box(gg, 4.7, .5, .5, .5, 16, '#ff6b6b', 8); svg('circle', { cx: P(5, .8, 18)[0], cy: P(5, .8, 18)[1], r: 14, fill: 'rgba(255,170,90,.35)' }, gg); }
  ];
  for (let i = 0; i < S.built; i++) { const pg = svg('g', { class: i === newPiece ? 'drop' : '' }, g); pieces[i](pg); }
  // bed or trash can
  if (!S.rat) {
    box(g, 5.6, .3, 4.2, 3, 10, '#e9d3dd');
    box(g, 5.7, .4, 4, 2.8, 8, '#ffd1e3', 10);
    box(g, 8.6, .6, 1.1, 2.2, 5, '#ffffff', 18);
    box(g, 9.55, .3, .25, 3, 28, '#d8b9c8');
    if (mood === 'tired') box(g, 5.9, .5, 2.7, 2.6, 4, '#c9b6ff', 18);
  } else {
    box(g, 7.5, 1, 1.9, 1.9, 34, '#9aa4b2');
    box(g, 7.65, 1.15, 1.6, 1.6, 4, '#ffc4d8', 32);
    box(g, 7.2, 2.4, .9, .9, 4, '#7d8796', 0);
  }
  // table + bowl
  box(g, .5, 4.2, 2, 2, 34, '#fff4ea');
  const tb = P(1.5, 5.2, 34);
  const bowl = svg('g', { transform: `translate(${tb[0]},${tb[1]})`, id: 'bowl' }, g,
    `<g class="bowlin"><ellipse cx="0" cy="2" rx="22" ry="10" fill="#fff" stroke="#ffb5d0" stroke-width="2"/><ellipse cx="0" cy="-1" rx="17" ry="7" fill="#e5586f"/>
    ${[[-8, -3], [0, -5], [8, -3], [-3, 0], [5, 0]].map(([x, y]) => `<rect x="${x - 4}" y="${y - 3}" width="8" height="6" rx="2" fill="#ffe9b8" stroke="#e8c27a" stroke-width=".8" transform="rotate(${x * 3} ${x} ${y})"/>`).join('')}</g>`);
  btn(bowl, 'Ravioli bowl: refill and feed the pets', e => feed(e));
  // toilet
  const tg = svg('g', {}, g);
  box(tg, 8, 6.2, 1.2, 1.4, 22, '#ffffff'); box(tg, 8.2, 6.4, .8, .9, 4, '#dff3ff', 22); box(tg, 8, 7.4, 1.2, .5, 34, '#ffffff', 0);
  btn(tg, 'The bathroom corner (something odd about the toilet…)', e => ratToggle(e));
  tg.querySelector('title').textContent = 'The bathroom corner';
}

function avatarArt(rat) {
  if (!rat) return `
    <ellipse cx="0" cy="2" rx="24" ry="7" fill="rgba(90,40,70,.18)"/>
    <rect x="-9" y="-20" width="7" height="20" rx="3.5" fill="#f6d3c0"/><rect x="2" y="-20" width="7" height="20" rx="3.5" fill="#f6d3c0"/>
    <ellipse cx="-6" cy="1" rx="9" ry="4.5" fill="#ffb6cf"/><ellipse cx="6" cy="1" rx="9" ry="4.5" fill="#ffb6cf"/>
    <ellipse cx="0" cy="-30" rx="30" ry="11" fill="#ffc7dd" stroke="#ff9fc2" stroke-width="2"/>
    <path d="M-30 -30 q-4 6 -2 9 M30 -30 q4 6 2 9" stroke="#ff9fc2" stroke-width="2" fill="none"/>
    <rect x="-18" y="-64" width="36" height="38" rx="15" fill="#eaa3c3"/>
    <path d="M-9 -34 h18 v10 h-18z" fill="#dc8fb2"/>
    <ellipse cx="-22" cy="-46" rx="7" ry="14" fill="#eaa3c3" transform="rotate(10 -22 -46)"/><ellipse cx="22" cy="-46" rx="7" ry="14" fill="#eaa3c3" transform="rotate(-10 22 -46)"/>
    <path d="M-24 -84 C-30 -116 30 -116 24 -84 C28 -62 22 -56 17 -62 L-17 -62 C-22 -56 -28 -62 -24 -84Z" fill="url(#hair)"/>
    <circle cx="0" cy="-82" r="23" fill="#fbdcc9"/>
    <path d="M-23 -86 C-16 -108 16 -108 23 -86 C12 -94 -10 -94 -23 -86Z" fill="url(#hair)"/>
    <path d="M-10 -100 q6 -6 12 -3" stroke="#d9a56b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M-13 -103 L-16 -120 L-7 -112 L0 -124 L7 -112 L16 -120 L13 -103Z" fill="#ffd966" stroke="#f2b84b" stroke-width="1.5" stroke-linejoin="round"/><circle cx="0" cy="-110" r="2.2" fill="#ff7fae"/><circle cx="-8" cy="-107" r="1.5" fill="#7fc8ff"/><circle cx="8" cy="-107" r="1.5" fill="#9be7a8"/>
    <ellipse cx="-8" cy="-79" rx="4" ry="5" fill="#2f8f63"/><ellipse cx="8" cy="-79" rx="4" ry="5" fill="#2f8f63"/>
    <circle cx="-7" cy="-81" r="1.5" fill="#fff"/><circle cx="9" cy="-81" r="1.5" fill="#fff"/>
    <circle cx="-14" cy="-72" r="4" fill="#ff9fb8" opacity=".55"/><circle cx="14" cy="-72" r="4" fill="#ff9fb8" opacity=".55"/>
    <path d="M-4 -70 q4 4 8 0" stroke="#a5566f" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  return `
    <ellipse cx="0" cy="3" rx="30" ry="8" fill="#7fc8ff" opacity=".55"/>
    <path d="M18 -8 q30 -4 28 -26 q-2 -10 -10 -6" stroke="#e6a3b4" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="0" cy="-22" rx="22" ry="22" fill="#9aa0ad"/>
    <rect x="-20" y="-34" width="40" height="22" rx="4" fill="#fff" stroke="#ffb5d0" stroke-width="2"/>
    <path d="M-20 -26 h40 M-20 -19 h40" stroke="#ffd0e1" stroke-width="3"/>
    <ellipse cx="-16" cy="-4" rx="6" ry="4" fill="#e6a3b4"/><ellipse cx="14" cy="-4" rx="6" ry="4" fill="#e6a3b4"/>
    <circle cx="-14" cy="-60" r="11" fill="#9aa0ad"/><circle cx="-14" cy="-60" r="6" fill="#f2b8c6"/>
    <circle cx="14" cy="-60" r="11" fill="#9aa0ad"/><circle cx="14" cy="-60" r="6" fill="#f2b8c6"/>
    <ellipse cx="0" cy="-48" rx="19" ry="17" fill="#aab0bc"/>
    <path d="M-8 -42 q8 14 22 6 q-4 -10 -22 -6z" fill="#b9bfca"/>
    <circle cx="14" cy="-38" r="3.4" fill="#f08aa6"/>
    <circle cx="-7" cy="-52" r="2.6" fill="#222"/><circle cx="5" cy="-52" r="2.6" fill="#222"/>
    <path d="M12 -40 l16 -4 M12 -36 l16 2 M-8 -40 l-14 -3" stroke="#6b7180" stroke-width="1" fill="none"/>
    <path d="M-6 -33 q4 3 8 0" stroke="#6b7180" stroke-width="1.5" fill="none"/>
    <circle class="drip" cx="-22" cy="-36" r="2.5" fill="#7fc8ff"/><circle class="drip drip2" cx="20" cy="-40" r="2.2" fill="#7fc8ff"/><circle class="drip drip3" cx="2" cy="-64" r="2.4" fill="#7fc8ff"/>`;
}
function drawChars() {
  const g = $('#gChars'); g.innerHTML = '';
  const a = P(S.rat ? 8.45 : 5.2, S.rat ? 2.1 : 5.4, S.rat ? 38 : 0);
  const av = svg('g', { transform: `translate(${a[0]},${a[1]})`, id: 'avatar' }, g);
  svg('g', { class: 'bob' }, av).appendChild(svg('g', { id: 'avArt' }, null, avatarArt(S.rat)));
  btn(av, S.rat ? 'The wet rat (click for a squeak)' : 'Your chibi avatar (click her)', e => {
    squash($('#avArt')); burst(e, S.rat ? ['💦', '🐀'] : ['💖', '✨']);
    if (S.rat) { sfx('squeak'); say(pick(['Squeak. The trash can has never felt so soft.', 'A tiny towel, a tiny grudge, a tiny nap.', 'Gremlin mode: nobody has to talk to you.'])); }
    else { sfx('ding', 1.2); say(pick(['You are doing better than you think.', 'Tutu AND hoodie? Iconic.', 'Gugaaaa, I need more flowersss raaaaawrrr', 'I am proud of myself and guga is proud of me too. Always:)', 'Im letting u know business days ahead something is coming.. yknow what.', 'I WANT MOREE FLOWERRS MOREEEE WHERE IS GUGAAA', 'heh yknow I really am cute', 'I am the slayest girlie of em all thats right hm', 'Rest is productive. Ask any capybara.', 'Soft hands, soft heart, strong mind.'])); }
  });
  const cat = svg('g', { transform: `translate(${P(2.9, 6.8)[0]},${P(2.9, 6.8)[1]})`, id: 'cat' }, g,
    `<g class="pet"><ellipse cx="0" cy="0" rx="15" ry="5" fill="rgba(90,40,70,.15)"/><ellipse cx="0" cy="-9" rx="12" ry="9" fill="#a9714b"/><circle cx="9" cy="-17" r="8" fill="#b97f56"/><polygon points="3,-23 6,-31 10,-24" fill="#b97f56"/><polygon points="12,-24 16,-31 17,-22" fill="#b97f56"/><circle cx="12" cy="-18" r="1.3" fill="#222"/><circle cx="7" cy="-18" r="1.3" fill="#222"/><path d="M-11 -10 q-10 -6 -6 -16" stroke="#a9714b" stroke-width="4" fill="none" stroke-linecap="round"/></g>`);
  const cap = svg('g', { transform: `translate(${P(4.7, 7.5)[0]},${P(4.7, 7.5)[1]})`, id: 'capy' }, g,
    `<g class="pet"><ellipse cx="0" cy="0" rx="17" ry="5" fill="rgba(90,40,70,.15)"/><rect x="-16" y="-17" width="30" height="16" rx="8" fill="#b88a5a"/><rect x="6" y="-22" width="16" height="14" rx="6" fill="#c79a68"/><rect x="17" y="-17" width="6" height="6" rx="3" fill="#6b4630"/><circle cx="12" cy="-17" r="1.4" fill="#222"/><circle cx="8" cy="-23" r="2.5" fill="#b88a5a"/></g>`);
  [cat, cap].forEach(p => p.addEventListener('click', e => { squash(p.firstChild); sfx('squeak', 1.4); burst(e, ['💗']); }));
}
function placeLamp() {
  const l = $('#lamp'); l.setAttribute('transform', `translate(${S.lamp.x},${S.lamp.y})`);
  const g = $('#lampGrad'); g.setAttribute('cx', S.lamp.x); g.setAttribute('cy', S.lamp.y - 80);
  const set = (id, c, o) => { const e = $(id); e.setAttribute('stop-color', c); e.setAttribute('stop-opacity', o); };
  if (S.night) { set('#ls0', '#ffc27a', .22); set('#ls1', '#ff9d55', .05); set('#ls2', '#0c0f33', .62); }
  else { set('#ls0', '#ffc27a', .34); set('#ls1', '#ffb070', .1); set('#ls2', '#ffb0c8', 0); }
  const m = R.getScreenCTM();
  if (m && R.getBoundingClientRect().width) { const p = R.createSVGPoint(); p.x = S.lamp.x; p.y = S.lamp.y - 80; const q = p.matrixTransform(m); document.body.style.setProperty('--lx', q.x + 'px'); document.body.style.setProperty('--ly', q.y + 'px'); }
}
function drawLamp() {
  const l = $('#lamp'); l.innerHTML = '';
  const art = svg('g', { id: 'lampArt' }, l,
    `<circle cx="0" cy="-74" r="46" fill="rgba(255,190,110,.2)"/><ellipse cx="0" cy="0" rx="13" ry="5" fill="#cfc7d1"/><rect x="-2" y="-78" width="4" height="78" fill="#b9b0bd"/>
     <polygon points="-22,-72 22,-72 13,-104 -13,-104" fill="url(#shadeG)"/><ellipse cx="0" cy="-72" rx="22" ry="4" fill="#ffe6b8"/>`);
  l.setAttribute('role', 'button'); l.setAttribute('tabindex', '0'); l.setAttribute('aria-label', 'Sunset lamp: drag me around to change the light');
  let off = null;
  l.addEventListener('pointerdown', e => { const p = toSvg(e); off = { x: S.lamp.x - p.x, y: S.lamp.y - p.y }; l.setPointerCapture(e.pointerId); squash(art); sfx('pop', .8); e.preventDefault(); });
  l.addEventListener('pointermove', e => { if (!off) return; const p = toSvg(e); S.lamp = { x: clamp(p.x + off.x, 150, 650), y: clamp(p.y + off.y, 230, 520) }; placeLamp(); });
  l.addEventListener('pointerup', () => { if (off) { off = null; save(); say('The whole house follows the lamp light.'); } });
  l.addEventListener('keydown', e => { const d = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] }[e.key]; if (d) { e.preventDefault(); S.lamp = { x: clamp(S.lamp.x + d[0], 150, 650), y: clamp(S.lamp.y + d[1], 230, 520) }; placeLamp(); save(); } });
  placeLamp();
}

function feed(e) {
  squash($('#bowl .bowlin')); squash($('#cat .pet')); squash($('#capy .pet')); sfx('pop', 1 + Math.random() * .3);
  burst(e, ['🍝', '💗', '🍝']);
  const now = Date.now();
  if (now - lastFeed > 8000) { lastFeed = now; gain(1); say('Refilled! Both pets are thrilled. +1 🧊'); } else say('Refilled! The pets are thrilled.');
}
function ratToggle(e) {
  S.rat = !S.rat; save(); audioMode(); drawItems(); drawChars(); sfx(S.rat ? 'squeak' : 'chime');
  burst(e, S.rat ? ['💦', '🐀', '💦'] : ['✨', '💖']);
  say(S.rat ? 'Gremlin mode on 🐀 The trash can is a surprisingly good bed.' : 'Back to your usual radiant self ✨');
  toast(S.rat ? 'Wet Rat Mode: on' : 'Wet Rat Mode: off');
}

function renderBuild() {
  const b = $('#buildbar'); b.innerHTML = '';
  $('#buildCount').textContent = S.built + ' / ' + TEA.length;
  TEA.forEach(([name, cost], i) => {
    const c = document.createElement('button'); c.className = 'chip ' + (i < S.built ? 'done' : i === S.built ? 'next' : 'later');
    c.textContent = i < S.built ? '✓ ' + name : i === S.built ? `Place ${name} · ${cost} 🧊` : name;
    c.disabled = i !== S.built;
    c.addEventListener('click', () => {
      if (S.cubes < cost) { sfx('boop'); toast(`${cost - S.cubes} more Data Cubes needed. Try the Math Garden 🌱`); return; }
      S.cubes -= cost; S.built++; save(); stats(true); drawItems(i); renderBuild(); sfx('chime', 1.2);
      say(S.built === TEA.length ? 'The Panda Tea House is finished. Tea is served, Your Highness. 🍵' : `${name} placed.`);
    });
    b.appendChild(c);
  });
}

/* ---------- tabs & view ---------- */
let zoomed = matchMedia('(max-width:640px)').matches;
function applyZoom() {
  R.setAttribute('viewBox', zoomed ? '230 200 380 320' : '0 0 800 560');
  $('#btnZoom').textContent = zoomed ? '🔎 Show whole room' : '🐾 Close-up';
  requestAnimationFrame(placeLamp);
}
let breathT;
function show(tab) {
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + tab));
  $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  document.body.dataset.tab = tab;
  if (tab === 'home') requestAnimationFrame(placeLamp);
  if (tab === 'math') renderMath();
  if (tab === 'cards') renderCards();
  if (tab === 'mail') renderMail();
  if (tab === 'couch') renderCouch();
  clearInterval(breathT);
  if (tab === 'chill') {
    const b = $('#breath span'); const run = () => { b.textContent = b.textContent === 'Breathe in' ? 'Breathe out' : 'Breathe in'; };
    $('#breath').style.animation = 'none'; void $('#breath').offsetWidth; $('#breath').style.animation = '';
    b.textContent = 'Breathe in'; breathT = setInterval(run, 4000);
  }
}
function applyNight() {
  document.body.classList.toggle('night', S.night);
  $('#btnNight').classList.toggle('on', S.night);
  $('#btnNight').textContent = S.night ? '☀' : '☾';
  requestAnimationFrame(placeLamp);
}

/* ---------- math: Fibonacci flowerbed ---------- */
const FIB = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377];
const fib = { seq: [], next: 0 };
function newFib() {
  const count = hard() ? 9 : 7, start = hard() ? 2 + Math.floor(Math.random() * 4) : Math.floor(Math.random() * 3);
  fib.seq = FIB.slice(start, start + count); fib.next = 0;
  const bed = $('#fibBed'); bed.innerHTML = '';
  shuffle(fib.seq.map((n, i) => ({ n, i }))).forEach(it => {
    const b = document.createElement('button'); b.className = 'flower';
    b.innerHTML = `${pick(['🌸', '🌷', '🌼', '🌺'])}<b>${it.n}</b>`; b.dataset.n = it.n; b.setAttribute('aria-label', 'Flower ' + it.n);
    b.addEventListener('click', e => harvest(b, e)); bed.appendChild(b);
  });
  $('#fibMsg').textContent = 'Start with the smallest.';
}
function harvest(b, e) {
  if (b.classList.contains('got')) return;
  if (+b.dataset.n === fib.seq[fib.next]) {
    b.classList.add('got'); sfx('ding', 1 + fib.next * .12); fib.next++; burst(e, ['✨']);
    if (fib.next === fib.seq.length) {
      const r = 4 + fib.seq.length + (hard() ? 3 : 0); gain(r); sfx('chime'); burst(e, ['🌼', '🌸', '✨', '💖']);
      $('#fibMsg').textContent = `Full bloom! +${r} 🧊`; setTimeout(newFib, 2400);
    } else $('#fibMsg').textContent = `${fib.next} / ${fib.seq.length} harvested`;
  } else { b.classList.remove('wob'); void b.offsetWidth; b.classList.add('wob'); sfx('boop'); $('#fibMsg').textContent = 'Not yet. Which flower is smaller?'; }
}

/* ---------- math: regression constellations ---------- */
const reg = { pts: [], a: { x: 30, y: 130 }, b: { x: 370, y: 130 }, solved: false, goal: .9, best: 1 };
function fit(m, c) {
  const my = reg.pts.reduce((s, p) => s + p.y, 0) / reg.pts.length; let sr = 0, st = 0;
  reg.pts.forEach(p => { const e = p.y - (m * p.x + c); sr += e * e; st += (p.y - my) ** 2; });
  return Math.max(0, 1 - sr / st);
}
function olsR2() {
  const n = reg.pts.length, mx = reg.pts.reduce((s, p) => s + p.x, 0) / n, my = reg.pts.reduce((s, p) => s + p.y, 0) / n; let sxy = 0, sxx = 0;
  reg.pts.forEach(p => { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; });
  const m = sxy / sxx; return fit(m, my - m * mx);
}
function handleR2() { const { a, b } = reg; if (Math.abs(b.x - a.x) < 8) return 0; const m = (b.y - a.y) / (b.x - a.x); return fit(m, a.y - m * a.x); }
const regPt = e => { const s = $('#reg'), p = s.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(s.getScreenCTM().inverse()); };
function newSky() {
  reg.solved = false; reg.goal = hard() ? .95 : .9; $('#r2Goal').textContent = reg.goal.toFixed(2); $('#regMsg').textContent = '';
  let tries = 0;
  do {
    const m = (Math.random() < .5 ? -1 : 1) * rnd(.35, .6), c = 130 - m * 200;
    reg.pts = Array.from({ length: 9 }, () => { const x = rnd(30, 370); return { x, y: clamp(c + m * x + rnd(-10, 10), 14, 246) }; });
    reg.best = olsR2(); tries++;
  } while (reg.best < reg.goal + .02 && tries < 60);
  reg.a = { x: 30, y: 130 }; reg.b = { x: 370, y: 130 };
  drawReg();
}
function drawReg() {
  const s = $('#reg'); s.innerHTML = '';
  for (let i = 0; i < 40; i++) svg('circle', { cx: rnd(0, 400).toFixed(0), cy: rnd(0, 260).toFixed(0), r: rnd(.5, 1.3).toFixed(1), fill: '#fff', opacity: rnd(.15, .5).toFixed(2), class: 'tw', style: `animation-delay:${rnd(0, 3).toFixed(1)}s` }, s);
  reg.res = reg.pts.map(() => svg('line', { stroke: '#ff9ec2', 'stroke-width': 1.2, 'stroke-dasharray': '3 3', opacity: .75 }, s));
  reg.line = svg('line', { stroke: '#ffd0e1', 'stroke-width': 3, 'stroke-linecap': 'round' }, s);
  reg.cap = svg('g', {}, s);
  reg.pts.forEach(p => { svg('circle', { cx: p.x, cy: p.y, r: 9, fill: '#fff3b0', opacity: .16 }, s); svg('circle', { cx: p.x, cy: p.y, r: 3.4, fill: '#fff3b0' }, s); });
  ['a', 'b'].forEach(k => {
    const h = svg('circle', { r: 11, fill: '#ff7fae', stroke: '#fff', 'stroke-width': 3, class: 'handle', tabindex: 0, role: 'slider', 'aria-label': 'Line handle ' + k }, s); reg['h' + k] = h;
    let d = false;
    h.addEventListener('pointerdown', e => { d = true; h.setPointerCapture(e.pointerId); e.preventDefault(); });
    h.addEventListener('pointermove', e => { if (!d || reg.solved) return; const p = regPt(e); reg[k] = { x: clamp(p.x, 0, 400), y: clamp(p.y, 0, 260) }; updateReg(); });
    h.addEventListener('pointerup', () => { d = false; });
    h.addEventListener('keydown', e => { const v = { ArrowLeft: [-6, 0], ArrowRight: [6, 0], ArrowUp: [0, -6], ArrowDown: [0, 6] }[e.key]; if (v && !reg.solved) { e.preventDefault(); reg[k] = { x: clamp(reg[k].x + v[0], 0, 400), y: clamp(reg[k].y + v[1], 0, 260) }; updateReg(); } });
  });
  updateReg();
}
function updateReg() {
  const { a, b } = reg, dx = b.x - a.x, ok = Math.abs(dx) >= 8, m = ok ? (b.y - a.y) / dx : 0, c = a.y - m * a.x;
  const set = (el, o) => { for (const k in o) el.setAttribute(k, o[k]); };
  set(reg.line, ok ? { x1: 0, y1: c, x2: 400, y2: m * 400 + c } : { x1: a.x, y1: a.y, x2: b.x, y2: b.y });
  reg.pts.forEach((p, i) => set(reg.res[i], { x1: p.x, y1: p.y, x2: p.x, y2: ok ? m * p.x + c : p.y }));
  set(reg.ha, { cx: a.x, cy: a.y }); set(reg.hb, { cx: b.x, cy: b.y });
  const v = handleR2(); $('#r2Val').textContent = v.toFixed(3);
  $('#r2Val').style.color = v >= reg.goal ? '#2f9e6b' : '';
}
const CAPY = [[10, 36], [14, 24], [30, 19], [48, 17], [62, 19], [70, 13], [80, 11], [88, 15], [91, 24], [84, 30], [76, 32], [70, 40], [68, 50], [64, 50], [62, 42], [32, 42], [30, 50], [26, 50], [24, 42], [12, 42]];
function revealCapy() {
  const g = reg.cap, S2 = 2.6, ox = 70, oy = 50;
  const pt = ([x, y]) => [ox + x * S2, oy + y * S2];
  const d = CAPY.map((p, i) => (i ? 'L' : 'M') + pt(p).join(' ')).join(' ') + 'Z';
  const path = svg('path', { d, pathLength: 1, fill: 'rgba(255,214,150,.08)', stroke: '#ffe29a', 'stroke-width': 2, 'stroke-linejoin': 'round', style: 'stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 2.6s ease' }, g);
  CAPY.forEach(p => { const [x, y] = pt(p); svg('circle', { cx: x, cy: y, r: 3, fill: '#fff6d0', class: 'tw' }, g); });
  const [ex, ey] = pt([80, 20]); svg('circle', { cx: ex, cy: ey, r: 2, fill: '#ffe29a' }, g);
  requestAnimationFrame(() => requestAnimationFrame(() => { path.style.strokeDashoffset = 0; }));
}
function lockReg() {
  if (reg.solved) return;
  const v = handleR2();
  if (v >= reg.goal) {
    reg.solved = true; revealCapy(); gain(12, 2); sfx('chime');
    $('#regMsg').textContent = `A capybara appears! Best possible fit: ${reg.best.toFixed(3)}. +12 🧊 +2 ✨`;
  } else { sfx('boop'); $('#regMsg').textContent = v < .5 ? 'Tilt the line to follow the stars.' : 'Closer! Nudge the handles a little.'; }
}
function renderMath() { const locked = mood === 'tired'; $('#mathLocked').hidden = !locked; $('#mathGames').hidden = locked; }
function floaters() {
  ['e^{i\\pi}+1=0', '\\sum_{k=1}^{n}k=\\tfrac{n(n+1)}{2}', '\\hat\\beta=(X^TX)^{-1}X^Ty', '\\int_0^1 x\\,dx=\\tfrac12', '\\varphi=\\tfrac{1+\\sqrt5}{2}', 'P(A\\mid B)=\\tfrac{P(B\\mid A)P(A)}{P(B)}'].forEach((s, i) => {
    const e = document.createElement('span'); e.className = 'fl'; e.style.top = (8 + i * 15) + '%'; e.style.animationDelay = (-i * 6.3) + 's'; e.style.animationDuration = (34 + i * 5) + 's';
    $('#floaters').appendChild(e); tex(e, s);
  });
  tex($('#fibTex'), 'F_n = F_{n-1} + F_{n-2}');
  tex($('#r2Tex'), 'R^2 = 1 - \\dfrac{SS_{\\text{res}}}{SS_{\\text{tot}}}', true);
}

/* ---------- cards ---------- */
const faceHTML = (c, own) => `<div class="tcard ${c.rar} ${own && own.holo ? 'holo' : ''}"><div class="tc-top"><b>${c.name}</b><i>${c.rar}</i></div><div class="tc-art">${c.emoji}</div><div class="tc-type">${c.type}</div><p>${c.flavor}</p></div>`;
const PACK_MS = () => (C.packIntervalMinutes || 360) * 60000;
const PACK_MAX = 3, PACK_COST = 30;
function packInfo() {
  const left = Math.max(0, S.nextPack - Date.now()), h = Math.floor(left / 3600000), m = Math.floor(left / 60000) % 60;
  const eta = S.packs >= PACK_MAX ? 'the mailbag is full' : h ? `next delivery in ${h}h ${m}m` : `next delivery in ${m}m`;
  $('#packInfo').textContent = `${S.packs} / ${PACK_MAX} packs waiting · the Weasel Postman visits slowly: ${eta}`;
  $('#btnOpen').disabled = S.packs < 1;
  $('#btnBuy').textContent = `Buy a pack · ${PACK_COST} 🧊`;
}
function renderCards() {
  const b = $('#binder'); b.innerHTML = '';
  CARDS.forEach(c => {
    const own = S.cards[c.id], d = document.createElement('div'); d.className = 'slot';
    if (own) {
      d.innerHTML = `${own.n > 1 ? `<span class="cnt">×${own.n}</span>` : ''}${faceHTML(c, own)}<button class="up" data-id="${c.id}">${own.holo ? 'Holographic ✨' : 'Make holo · 10 ✨'}</button>`;
      d.querySelector('.up').disabled = own.holo || S.dust < 10;
    } else d.innerHTML = '<div class="unknown">?</div>';
    b.appendChild(d);
  });
  packInfo(); stats();
}
function drawCard() {
  const r = Math.random(), rar = r < .68 ? 'common' : r < .93 ? 'rare' : 'ultra', pool = CARDS.filter(c => c.rar === rar);
  return pick(pool.length ? pool : CARDS);
}
let packHTML = '', packRevealed = true, pendingDust = 0;
function openPack() {
  if (S.packs < 1) return;
  S.packs--; let dust = 0; const html = [];
  for (let i = 0; i < 3; i++) {
    const c = drawCard(), own = S.cards[c.id]; let note;
    if (own) { own.n++; const d = { common: 2, rare: 4, ultra: 8 }[c.rar]; dust += d; note = `<span class="dupe">Duplicate → +${d} ✨</span>`; }
    else { S.cards[c.id] = { n: 1, holo: false }; note = '<span class="dupe">New!</span>'; }
    html.push(`<div class="flip"><div class="in" style="animation-delay:${i * .45}s"><div class="back">🐾</div><div class="front">${faceHTML(c, S.cards[c.id])}</div></div>${note}</div>`);
  }
  S.dust += dust; save(); stats(true);
  packHTML = html.join(''); pendingDust = dust; packRevealed = false;
  $('#packCards').innerHTML = '<button id="seal" class="seal" aria-label="Tap to unwrap the pack"><span class="env">💌</span><b>Tap to unwrap</b></button>';
  $('#packNote').textContent = ''; $('#packClose').hidden = true; $('#packOverlay').hidden = false;
  $('#seal').addEventListener('click', revealPack);
}
function revealPack() {
  if (packRevealed) return; packRevealed = true; sfx('chime');
  $('#packCards').innerHTML = packHTML;
  $$('#packCards .flip').forEach((_, i) => setTimeout(() => sfx('ding', 1 + i * .25), 700 + i * 450));
  $('#packNote').textContent = pendingDust ? `+${pendingDust} ✨ stardust from duplicates` : 'All new. Lovely.';
  setTimeout(() => { $('#packClose').hidden = false; }, 2200);
}
function postman() { const d = document.createElement('div'); d.className = 'postman'; d.textContent = '🦡✉️'; document.body.appendChild(d); setTimeout(() => d.remove(), 4700); }
function deliveryTick(quiet) {
  const now = Date.now();
  if (now >= S.nextPack) {
    const n = Math.floor((now - S.nextPack) / PACK_MS()) + 1, room = PACK_MAX - S.packs;
    if (room > 0) { S.packs += Math.min(n, room); if (!quiet) { postman(); sfx('chime'); } toast('The Weasel Postman left a booster pack 📬'); }
    S.nextPack += n * PACK_MS();   // keeps the rhythm even if the page was closed
    save(); stats();
  }
  if ($('#tab-cards').classList.contains('active')) packInfo();
}

/* ---------- mailbox ---------- */
function drawMail() {
  $('#mailScene').innerHTML = `<ellipse cx="150" cy="200" rx="140" ry="20" fill="#a9e2a3"/><rect x="140" y="110" width="20" height="90" fill="#c9a07a"/>
    <rect x="80" y="62" width="140" height="62" rx="26" fill="#ff9ec2"/><rect x="80" y="90" width="140" height="34" fill="#ff9ec2"/><path d="M200 62 q20 8 20 31 v31 h-20z" fill="#ff86b3"/><rect x="92" y="86" width="40" height="8" rx="4" fill="#fff" opacity=".7"/>
    <g class="flag"><rect x="222" y="60" width="6" height="44" fill="#e6679a"/><rect x="228" y="60" width="26" height="16" rx="3" fill="#ffe27f"/></g>
    <text x="150" y="40" text-anchor="middle" font-family="Caveat,cursive" font-size="24" fill="#c36b93">from ${(C.fromName || 'someone who cares').replace(/[<>&]/g, '')}</text>`;
}
function showLetter(i) {
  const l = letters[i]; if (!l) return; const b = $('#letterBody'); b.innerHTML = '';
  const w = document.createElement('div'); w.className = 'letter';
  const h = document.createElement('h3'); h.textContent = l.title || 'A letter';
  const s = document.createElement('small'); s.textContent = l.date || '';
  const t = document.createElement('div'); t.textContent = l.body || '';
  w.append(h, s, t); b.appendChild(w); $('#letterModal').hidden = false;
  S.read = Math.max(S.read, letters.length); save(); sfx('chime', .8); renderMail(); stats();
}
function renderMail() {
  const unread = letters.length > S.read;
  $('#mailScene').classList.toggle('up', unread);
  $('#mailHint').textContent = unread ? 'The flag is up. There is something inside.' : letters.length ? 'Nothing new. Your old letters are below.' : 'No letters yet.';
  const box = $('#letters'); box.innerHTML = '';
  letters.map((l, i) => [l, i]).reverse().forEach(([l, i]) => {
    const b = document.createElement('button'); b.className = 'letterItem'; b.textContent = '💌 ' + (l.title || 'A letter');
    const s = document.createElement('small'); s.textContent = l.date || ''; b.appendChild(s); b.addEventListener('click', () => showLetter(i)); box.appendChild(b);
  });
}
function parseCSV(t) {
  const rows = []; let r = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { r.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; r.push(f); rows.push(r); r = []; f = ''; }
    else f += c;
  }
  if (f || r.length) { r.push(f); rows.push(r); }
  return rows;
}
const SHEET_CACHE = 'dataDayDreamhouse.sheet';
function mergeLetters(extra) {
  const all = (C.letters || []).slice(), key = l => (l.date || '') + '|' + (l.title || ''), seen = new Set(all.map(key));
  (extra || []).forEach(l => { if (!seen.has(key(l))) { seen.add(key(l)); all.push(l); } });
  return all;
}
async function loadSheet() {
  try { letters = mergeLetters(JSON.parse(localStorage.getItem(SHEET_CACHE) || '[]')); } catch (e) {}
  if (!C.sheetCsvUrl) return;
  try {
    const t = await (await fetch(C.sheetCsvUrl, { cache: 'no-store' })).text();
    const rows = parseCSV(t).slice(1).filter(r => r[2] && r[2].trim()).map(r => ({ date: r[0], title: r[1], body: r[2] }));
    if (rows.length) { try { localStorage.setItem(SHEET_CACHE, JSON.stringify(rows)); } catch (e) {} letters = mergeLetters(rows); stats(); renderMail(); }
  } catch (e) { /* offline or blocked: keep what we have */ }
}

/* ---------- chill room ---------- */
function drawSpring() {
  let stars = ''; for (let i = 0; i < 28; i++) stars += `<circle cx="${rnd(0, 400).toFixed(0)}" cy="${rnd(0, 120).toFixed(0)}" r="${rnd(.6, 1.6).toFixed(1)}" fill="#fff" class="tw" style="animation-delay:${rnd(0, 3).toFixed(1)}s"/>`;
  $('#spring').innerHTML = `<defs><linearGradient id="skyS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1f4a"/><stop offset="1" stop-color="#6a4a86"/></linearGradient></defs>
    <rect width="400" height="260" fill="url(#skyS)"/>${stars}<circle cx="330" cy="46" r="16" fill="#fff6d8"/>
    <ellipse cx="200" cy="218" rx="195" ry="46" fill="#6b5a73"/><ellipse cx="200" cy="208" rx="168" ry="36" fill="#6fc7d4"/>
    <g class="breathe"><rect x="128" y="150" width="124" height="62" rx="31" fill="#b88a5a"/><rect x="226" y="126" width="58" height="46" rx="19" fill="#c79a68"/><rect x="270" y="142" width="16" height="16" rx="7" fill="#6b4630"/><circle cx="238" cy="126" r="7" fill="#b88a5a"/><circle cx="262" cy="124" r="6" fill="#b88a5a"/>
      <path d="M244 144 q6 5 12 0" stroke="#3b2418" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="251" cy="117" r="11" fill="#ffcf5a"/><path d="M251 106 q3 -6 8 -4" stroke="#5fa86a" stroke-width="2.5" fill="none"/></g>
    <path d="M24 196 Q110 182 200 196 T376 196 V236 H24Z" fill="#6fc7d4" opacity=".78"/>
    <ellipse cx="200" cy="206" rx="70" ry="8" fill="none" stroke="#fff" opacity=".35"/><ellipse cx="200" cy="212" rx="110" ry="12" fill="none" stroke="#fff" opacity=".2"/>
    <circle cx="48" cy="204" r="16" fill="#7a6a82"/><circle cx="352" cy="206" r="18" fill="#7a6a82"/><circle cx="330" cy="214" r="12" fill="#8a7a92"/>
    <path class="steam" d="M150 150 q-10 -16 0 -30 q10 -14 0 -28" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path class="steam" d="M200 140 q-10 -16 0 -30 q10 -14 0 -28" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path class="steam" d="M110 160 q-10 -14 0 -26 q10 -12 0 -24" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/>`;
}

/* ---------- Mochi-bot + bubble wrap ---------- */
function drawKitty() {
  $('#kBtn').innerHTML = `<svg viewBox="0 0 64 64" aria-hidden="true"><polygon points="12,22 14,6 28,16" fill="#ffd0e1"/><polygon points="52,22 50,6 36,16" fill="#ffd0e1"/><circle cx="32" cy="36" r="22" fill="#fff" stroke="#ffb5d0" stroke-width="3"/><circle cx="23" cy="34" r="3" fill="#5a3a4c"/><circle cx="41" cy="34" r="3" fill="#5a3a4c"/><path d="M28 42 q4 4 8 0" stroke="#e5679a" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="17" cy="42" r="3.5" fill="#ffb5d0" opacity=".7"/><circle cx="47" cy="42" r="3.5" fill="#ffb5d0" opacity=".7"/><line x1="32" y1="14" x2="32" y2="7" stroke="#ffb5d0" stroke-width="2.5"/><circle cx="32" cy="5" r="3" fill="#ff7fae"/></svg>`;
  fillWrap();
}
function fillWrap() {
  const g = $('#wrapGrid'); g.innerHTML = '';
  for (let i = 0; i < 30; i++) {
    const b = document.createElement('button'); b.className = 'bubble'; b.setAttribute('aria-label', 'Bubble');
    b.addEventListener('click', () => {
      if (b.classList.contains('popped')) return; b.classList.add('popped'); sfx('pop', rnd(.8, 1.7));
      if ($$('.bubble:not(.popped)').length === 0) { toast('All popped. Fresh sheet 🫧'); setTimeout(fillWrap, 800); }
    });
    g.appendChild(b);
  }
}
function kittySay(msg, ms = 12000) { const b = $('#kBubble'); b.textContent = msg; b.hidden = false; clearTimeout(kittySay.t); kittySay.t = setTimeout(() => { b.hidden = true; }, ms); }

/* ---------- mood ---------- */
function applyMood(m) {
  mood = m; $('#modal').hidden = true; document.body.dataset.mood = m;
  S.night = m === 'tired'; applyNight(); save();
  $('#btnMusic').classList.toggle('on', S.music);
  audioMode(); if (S.music) AU.start();
  drawItems(); newFib(); newSky(); renderMath();
  const name = who();
  if (m === 'tired') { show('chill'); toast('The weasels brought a blanket 🧸 Puzzles are napping.'); }
  else if (m === 'sad') { show('home'); say(`I'm glad you're here, ${name}. No tasks today.`); kittySay('Rough day? Want to pop some bubble wrap? 🫧'); }
  else if (m === 'happy') { show('home'); say('Puzzles are a little spicier today 🌶️ and the music picked up.'); }
  else { show('home'); say(`Welcome home, ${name}. Everything here is clickable.`); }
}

/* ---------- royal decrees, monster check, couch, backup ---------- */
const DECREES = (C.decrees && C.decrees.length) ? C.decrees : [
  'By royal decree: today you are officially allowed to do nothing at all.',
  'The weasels shall fetch your tea, your snacks and your blanket. Do not lift a paw.',
  'Every anime in this kingdom shall have a happy ending. Confessions are always accepted.',
  'No monsters, ghosts or jump-scares are permitted within these walls. Guards are posted.',
  'Any outfit you choose today is hereby declared iconic. Tutu optional.',
  'Ravioli shall be served on demand, and the pets shall applaud.',
  'You are excused from being productive until further notice.',
  'Let it be known: you are loved, you are enough, and you are very, very cute.',
  'The kingdom commands one long, loud pirouette. Spin first, worry later.',
  'Wet-rat mode is a protected royal right and may be used at any time.',
  'Whoever made you smile today shall receive a medal. If it was you, a double medal.',
  'Quiet hours are in effect. The only permitted sounds are lofi and capybara splashes.'
];
function showDecree(e) {
  const b = $('#letterBody'); b.innerHTML = '';
  const w = document.createElement('div'); w.className = 'letter';
  const h = document.createElement('h3'); h.textContent = '📜 Royal Decree';
  const s2 = document.createElement('small'); s2.textContent = 'Issued fresh for ' + who();
  const t = document.createElement('div'); t.textContent = pick(DECREES);
  w.append(h, s2, t); b.appendChild(w); $('#letterModal').hidden = false; sfx('chime', 1.1); if (e) burst(e, ['👑', '💖']);
}
function monsterCheck() {
  ['🔦 Checking under the bed…', '🔦 Checking the closet…', '🔦 Checking behind the curtains…', `All clear, ${who()}. Only cats, ravioli crumbs and a sleepy capybara. 🧸`]
    .forEach((m, i) => setTimeout(() => { toast(m); sfx(i === 3 ? 'chime' : 'ding', .8 + i * .1); }, i * 1700));
}
const WATCH_STATUS = ['Want to watch', 'Watching', 'Finished'];
function addWatch(title) {
  title = (title || '').trim().slice(0, 80); if (!title) return;
  if (S.watch.some(w => w.t.toLowerCase() === title.toLowerCase())) { toast('Already on the list 💕'); return; }
  S.watch.push({ t: title, s: 0, h: 0 }); save(); sfx('pop'); renderCouch();
}
function renderCouch() {
  const box = $('#watchList'); box.innerHTML = '';
  S.watch.forEach((w, i) => {
    const row = document.createElement('div'); row.className = 'watchRow';
    const t = document.createElement('b'); t.textContent = w.t;
    const sel = document.createElement('select'); sel.setAttribute('aria-label', 'Status for ' + w.t);
    WATCH_STATUS.forEach((name, k) => { const o = document.createElement('option'); o.value = k; o.textContent = name; if (k === w.s) o.selected = true; sel.appendChild(o); });
    sel.addEventListener('change', () => { w.s = +sel.value; if (w.s === 2 && !w.paid) { w.paid = true; gain(3); toast('Finished one! +3 🧊 cozy credits 📺'); sfx('chime'); } save(); renderCouch(); });
    const hearts = document.createElement('span'); hearts.className = 'hearts';
    for (let k = 1; k <= 5; k++) {
      const h = document.createElement('button'); h.className = 'heartBtn' + (k <= (w.h || 0) ? ' on' : ''); h.textContent = '♥'; h.setAttribute('aria-label', k + ' hearts');
      h.addEventListener('click', () => { w.h = w.h === k ? 0 : k; save(); sfx('pop', 1 + k * .1); renderCouch(); }); hearts.appendChild(h);
    }
    const del = document.createElement('button'); del.className = 'icon small'; del.textContent = '✕'; del.setAttribute('aria-label', 'Remove ' + w.t);
    del.addEventListener('click', () => { S.watch.splice(i, 1); save(); renderCouch(); });
    row.append(t, sel, hearts, del); box.appendChild(row);
  });
  if (!S.watch.length) { const p = document.createElement('p'); p.className = 'sub center'; p.textContent = 'Your list is empty. Add something you want to cuddle up and watch.'; box.appendChild(p); }
  const sg = $('#watchSuggest'); sg.innerHTML = '';
  (C.watchSuggestions || []).filter(x => !S.watch.some(w => w.t.toLowerCase() === x.title.toLowerCase())).forEach(x => {
    const b = document.createElement('button'); b.className = 'chip next'; b.textContent = '+ ' + x.title; if (x.note) b.title = x.note;
    b.addEventListener('click', () => addWatch(x.title)); sg.appendChild(b);
  });
  $('#watchSuggestBox').hidden = !sg.children.length;
  $('#watchSuggestBox .sub').textContent = 'Picks from ' + (C.fromName || 'a friend') + ':';
}
function exportSave() {
  const code = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
  const done = () => toast('Backup code copied. Keep it somewhere safe 💾');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, () => prompt('Copy your backup code:', code));
  else prompt('Copy your backup code:', code);
}
function importSave() {
  const code = prompt('Paste your backup code:'); if (!code) return;
  try { const o = JSON.parse(decodeURIComponent(escape(atob(code.trim())))); if (!o || typeof o !== 'object' || !('cubes' in o)) throw 0; S = { ...DEF, ...o }; save(); location.reload(); }
  catch (e) { toast('That code did not work. Check you copied all of it.'); }
}
function petals() {
  const p = $('#petals');
  for (let i = 0; i < 9; i++) { const e = document.createElement('i'); e.className = 'petal'; e.style.left = rnd(0, 100) + '%'; e.style.animationDuration = rnd(14, 26) + 's'; e.style.animationDelay = -rnd(0, 26) + 's'; e.style.setProperty('--sz', rnd(8, 14) + 'px'); p.appendChild(e); }
}

/* ---------- wire up ---------- */
function init() {
  buildRoom(); applyZoom(); applyNight(); drawMail(); drawSpring(); drawKitty(); floaters();
  if (!S.nextPack) { S.packs = Math.max(S.packs, 1); S.nextPack = Date.now() + PACK_MS(); save(); }
  loadSheet(); newFib(); newSky(); renderBuild(); renderMail(); stats();
  $('#btnMusic').classList.toggle('on', S.music);

  $('#tabs').addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (b) { show(b.dataset.tab); sfx('pop', 1.1); } });
  $('#btnMusic').addEventListener('click', () => { musicOn(!S.music); });
  $('#btnNight').addEventListener('click', () => { S.night = !S.night; applyNight(); save(); sfx('pop', .9); });
  $('#btnMood').addEventListener('click', () => { $('#modal').hidden = false; });
  $('#btnWake').addEventListener('click', () => { $('#modal').hidden = false; });
  $('#btnZoom').addEventListener('click', () => { zoomed = !zoomed; applyZoom(); });
  $$('.moods button').forEach(b => b.addEventListener('click', () => { sfx('pop'); applyMood(b.dataset.mood); }));
  $('#fibNew').addEventListener('click', newFib);
  $('#regNew').addEventListener('click', newSky);
  $('#regLock').addEventListener('click', lockReg);
  $('#btnOpen').addEventListener('click', openPack);
  $('#btnBuy').addEventListener('click', () => {
    if (S.cubes < PACK_COST) { sfx('boop'); toast(`${PACK_COST - S.cubes} more Data Cubes needed. Try the Math Garden 🌱`); return; }
    S.cubes -= PACK_COST; S.packs++; save(); stats(); openPack();
  });
  $('#packClose').addEventListener('click', () => { $('#packOverlay').hidden = true; renderCards(); });
  $('#binder').addEventListener('click', e => {
    const b = e.target.closest('.up'); if (!b) return; const o = S.cards[b.dataset.id];
    if (o && !o.holo && S.dust >= 10) { S.dust -= 10; o.holo = true; save(); sfx('chime', 1.3); renderCards(); toast('Holographic! ✨'); }
  });
  const openMail = () => { if (letters.length) showLetter(letters.length - 1); };
  $('#mailScene').addEventListener('click', openMail);
  $('#mailScene').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMail(); } });
  $('#letterClose').addEventListener('click', () => { $('#letterModal').hidden = true; });
  $('#kBtn').addEventListener('click', () => { const w = $('#bubbleWrap'); w.hidden = !w.hidden; $('#kBubble').hidden = true; sfx('squeak', 1.5); });
  $('#wrapClose').addEventListener('click', () => { $('#bubbleWrap').hidden = true; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (packRevealed) $('#packOverlay').hidden = true; $('#letterModal').hidden = true; $('#bubbleWrap').hidden = true; } });
  $('#btnDecree').addEventListener('click', showDecree);
  $('#monsterCheck').addEventListener('click', monsterCheck);
  $('#watchForm').addEventListener('submit', e => { e.preventDefault(); addWatch($('#watchInput').value); $('#watchInput').value = ''; });
  $('#btnBackup').addEventListener('click', exportSave);
  $('#btnRestore').addEventListener('click', importSave);
  petals();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
  addEventListener('resize', placeLamp);
  deliveryTick(true);
  setInterval(deliveryTick, 1000);

  $('#modal').hidden = false;   // "How is the weather inside today?"
  say(`Welcome home, ${who()}.`);
}
init();
})();
