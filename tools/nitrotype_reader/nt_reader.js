// nt_reader.js -- Nitro Type race reader -> keyboard_v1 over Web Serial
// Physical AI Agent, Oct 16 2026. Port of mt_reader.js (Monkeytype).
//
// Reads the race text from Nitro Type's DOM and streams it to the Mega with the
// keyboard_v1 fast-TYPE protocol (Q / GO / END / STOP, "K <free>" flow control).
// The solenoids type it on the real Nuphy. NEEDS the Oct 16 firmware (Shift
// chords in the stream): Nitro Type text has capitals and punctuation.
//
// Nitro Type DOM (read from nitrotype.com's own bundle, Oct 16 2026):
//   .dash-copy .dash-letter            one span per character, spaces are &nbsp;
//   .dash-letter.is-waiting            the NEXT character to type (the cursor)
//   .dash-letter.is-incorrect          wrong key pressed; the cursor does NOT move
//                                      until the right key comes
//   .dash-letter.is-typed / is-correct already typed
//   .race-header-controls.is-countdown / .is-racing   race state
//   .racev3.is-race-results            results screen
//
// WHY THIS IS HARDER THAN MONKEYTYPE: one dropped keypress means every key after
// it is "wrong" and the car stops. So this reader watches the cursor. If a wrong
// letter sits there for RESYNC_MS, or the Mega finishes before the race does, it
// STOPs the Mega and re-queues the text from the cursor. A doubled keypress only
// costs accuracy (the next key is the right one again).
//
// HOW TO RUN (Chrome on the Mac; Safari has no Web Serial):
//   1. Close the Arduino Serial Monitor (one program per port).
//   2. nitrotype.com -> log in to the race account -> Race.
//   3. DevTools (Cmd+Opt+J) -> Sources -> Snippets -> New "nt_reader",
//      paste this file once, Cmd+Enter to run it (on every page load).
//   4. Panel (top right): Arm. It connects (Mega resets ~3 s), sends the setup,
//      waits for the race text, preloads it, and fires GO the moment the
//      countdown ends. Hands OFF the keyboard and mouse. STOP aborts.
//   5. "auto" = re-arm by itself for the next race (keeps the port open).
// Dry run without the Mega:  window.NTR_FAKE = true  before running the snippet.

(() => {
  if (window.__ntr) { window.__ntr.close(); }

  const CHUNK = 100;              // chars per Q line (firmware line buffer 200)
  const ACK_TIMEOUT_MS = 1500;
  const RESYNC_MS = 100;          // wrong letter stuck this long -> resync
  const STALL_MS = 600;           // cursor frozen this long while typing -> resync
  const MAX_RESYNCS = 30;
  const LS_KEY = 'ntr_setup';
  const DEFAULT_SETUP = 'WPM 740\nFPULSE 50\nSAMEKEY 80\nSHIFTMS 30 30\nLEAD 0';
  // 1:1 replacements only (anything that changes length would desync the index)
  const SUBS = { ' ': ' ', '‘': "'", '’': "'", '“': '"', '”': '"', '–': '-', '—': '-' };

  const st = {
    port: null, writer: null, reader: null, connected: false, rxBuf: '', readyResolve: null,
    outbox: '', waitingAck: false, ackTimer: null, free: 1024, lineWaiters: [],
    phase: 'idle',               // idle | armed | racing | resyncing | done
    text: '', base: 0,           // base = text index the current Mega stream started at
    megaDone: false, resyncs: 0, wrongSince: 0, lastIdx: -1, lastMoveAt: 0,
    t0: 0, auto: false, raceSeen: null,
  };

  // ---------------- UI ----------------
  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;top:8px;right:8px;z-index:2147483647;width:340px;' +
    'background:#111;color:#ddd;font:12px/1.35 ui-monospace,Menlo,monospace;border:1px solid #555;' +
    'border-radius:8px;padding:8px;box-shadow:0 4px 16px #0008';
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <b style="color:#ff5a1f">keyboard_v1 · Nitro Type</b>
      <span id="n-dot" style="color:#c44">● offline</span></div>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px;align-items:center">
      <button id="n-arm" style="background:#2a5;color:#fff">Arm</button>
      <button id="n-stop" style="background:#c33;color:#fff">STOP</button>
      <button id="n-setup">Send setup</button>
      <button id="n-release">Release</button>
      <label style="color:#aaa"><input id="n-auto" type="checkbox"> auto</label></div>
    <label style="color:#888">setup (sent after every connect)</label>
    <textarea id="n-setupbox" rows="5" style="width:100%;box-sizing:border-box;background:#000;color:#ddd;border:1px solid #444;font:inherit"></textarea>
    <input id="n-cmd" placeholder="raw command, Enter to send" style="width:100%;box-sizing:border-box;margin:4px 0;background:#000;color:#ddd;border:1px solid #444;font:inherit">
    <div id="n-stats" style="color:#9cf">idle</div>
    <pre id="n-log" style="height:150px;overflow:auto;background:#000;margin:4px 0 0;padding:4px;white-space:pre-wrap"></pre>`;
  document.body.appendChild(panel);
  panel.querySelectorAll('button').forEach(b => b.style.cssText += ';font:inherit;padding:3px 8px;border-radius:4px;border:1px solid #555;cursor:pointer');
  const $ = id => panel.querySelector('#' + id);
  let saved = null; try { saved = localStorage.getItem(LS_KEY); } catch (_) {}
  $('n-setupbox').value = saved ?? DEFAULT_SETUP;
  $('n-setupbox').addEventListener('input', () => { try { localStorage.setItem(LS_KEY, $('n-setupbox').value); } catch (_) {} });
  ['n-setupbox', 'n-cmd'].forEach(id => $(id).addEventListener('keydown', e => e.stopPropagation(), true));

  const log = (s, color) => {
    const el = $('n-log'), line = document.createElement('div');
    line.textContent = s; if (color) line.style.color = color;
    el.appendChild(line);
    while (el.childNodes.length > 300) el.removeChild(el.firstChild);
    el.scrollTop = el.scrollHeight;
  };
  const setDot = on => { $('n-dot').textContent = on ? '● connected' : '● offline'; $('n-dot').style.color = on ? '#2c5' : '#c44'; };

  // ---------------- Nitro Type DOM ----------------
  // The race may live in a same-origin iframe (e.g. inside an app pane): look there too.
  function doc() {
    if (document.querySelector('.dash-copy')) return document;
    for (const f of document.querySelectorAll('iframe')) {
      try { const d = f.contentDocument; if (d && d.querySelector('.dash-copy')) return d; } catch (_) {}
    }
    return document;
  }
  const letters = () => [...doc().querySelectorAll('.dash-copy .dash-letter')].filter(l => !l.querySelector('img'));
  const raceText = () => letters().map(l => { const c = l.textContent; return SUBS[c] ?? c; }).join('');
  const racing = () => !!doc().querySelector('.race-header-controls.is-racing');
  const countingDown = () => !!doc().querySelector('.race-header-controls.is-countdown');
  const finished = () => !!doc().querySelector('.racev3.is-race-results');
  function cursor() {               // -> { idx, wrong }
    const ls = letters();
    for (let i = 0; i < ls.length; i++) {
      const c = ls[i].classList;
      if (c.contains('is-incorrect')) return { idx: i, wrong: true };
      if (c.contains('is-waiting')) return { idx: i, wrong: false };
    }
    const typed = ls.filter(l => l.classList.contains('is-typed')).length;
    return { idx: typed, wrong: false };
  }
  function focusRace() {
    const inp = doc().querySelector('.dash-copy-input');
    if (inp) { try { inp.focus({ preventScroll: true }); } catch (_) { inp.focus(); } }
  }

  // ---------------- serial ----------------
  function makeFakePort() {        // dry run: types into the page via NTR_FAKE_TYPE if the test page provides it
    let q = [], ctrl = null, timer = null, running = false;
    const enc = new TextEncoder(), say = s => ctrl && ctrl.enqueue(enc.encode(s + '\r\n'));
    const tick = () => {
      if (!q.length) { if (running) { running = false; clearInterval(timer); say('DONE end (FAKE)'); say('K 1024'); } return; }
      const c = q.shift();
      const drop = Math.random() < (window.NTR_FAKE_DROP || 0);
      if (!drop && window.NTR_FAKE_TYPE) window.NTR_FAKE_TYPE(c);
    };
    return {
      async open() {},
      readable: new ReadableStream({ start(c) { ctrl = c; setTimeout(() => say('keyboard_v1 ready  cells=11 (FAKE)'), 200); } }),
      writable: new WritableStream({ write(chunk) {
        for (const line of new TextDecoder().decode(chunk).split('\n')) {
          if (!line) continue;
          if (line.startsWith('Q ')) { q.push(...line.slice(2)); say('K ' + (1024 - q.length)); }
          else if (line === 'GO') { running = true; say('OK GO (FAKE)'); clearInterval(timer); timer = setInterval(tick, window.NTR_FAKE_MS || 20); }
          else if (line === 'STOP') { q = []; clearInterval(timer); say(running ? 'DONE stopped (FAKE)' : 'OK STOP'); running = false; say('K 1024'); }
          else if (line === 'END') say('OK END');
          else say('OK ' + line + ' (FAKE)');
        }
      } }),
      async close() { clearInterval(timer); },
    };
  }

  async function connect() {
    try {
      if (st.port) await disconnect();
      st.port = window.NTR_FAKE ? makeFakePort() : ((await navigator.serial.getPorts())[0] || await navigator.serial.requestPort());
      await st.port.open({ baudRate: 115200 });
      st.writer = st.port.writable.getWriter();
      st.connected = true; setDot(true);
      log('port open, waiting for the Mega to reset…');
      readLoop();
      const ready = new Promise(res => (st.readyResolve = res));
      await Promise.race([ready, new Promise(res => setTimeout(res, 4000))]);
      st.readyResolve = null;
      await sendSetup();
    } catch (e) { log('connect failed: ' + e.message, '#f66'); setDot(false); }
  }
  async function disconnect() {
    try { st.reader && await st.reader.cancel(); } catch (_) {}
    try { st.writer && st.writer.releaseLock(); } catch (_) {}
    try { st.port && await st.port.close(); } catch (_) {}
    st.port = st.writer = st.reader = null; st.connected = false; setDot(false);
  }
  async function readLoop() {
    const dec = new TextDecoder();
    st.reader = st.port.readable.getReader();
    try {
      for (;;) {
        const { value, done } = await st.reader.read();
        if (done) break;
        st.rxBuf += dec.decode(value, { stream: true });
        let i;
        while ((i = st.rxBuf.indexOf('\n')) >= 0) {
          const line = st.rxBuf.slice(0, i).replace(/\r$/, '');
          st.rxBuf = st.rxBuf.slice(i + 1);
          onLine(line);
        }
      }
    } catch (e) { log('serial read ended: ' + e.message, '#f66'); }
    finally { try { st.reader.releaseLock(); } catch (_) {} st.connected = false; setDot(false); }
  }
  function onLine(line) {
    const k = line.match(/K (\d+)\s*$/);
    if (k) {
      st.free = +k[1];
      if (/^ERR qfull/.test(line)) log(line, '#fa0');
      if (st.waitingAck) { st.waitingAck = false; clearTimeout(st.ackTimer); }
      pump();
      if (!/^K /.test(line)) { log(line); st.lineWaiters.splice(0).forEach(f => f(line)); }
      return;
    }
    if (/keyboard_v1 ready/.test(line) && st.readyResolve) st.readyResolve();
    if (/^DONE/.test(line)) { st.megaDone = true; log(line, '#2c5'); }
    else log(line, /^ERR|^WARN/.test(line) ? '#f66' : undefined);
    st.lineWaiters.splice(0).forEach(f => f(line));
  }
  async function writeLine(s) {
    if (!st.connected) { log('not connected', '#f66'); return; }
    await st.writer.write(new TextEncoder().encode(s + '\n'));
  }
  const nextLine = (ms = 1500, re = null) => new Promise(res => {
    const t = setTimeout(() => res(null), ms);
    const w = line => { if (re && !re.test(line)) { st.lineWaiters.push(w); return; } clearTimeout(t); res(line); };
    st.lineWaiters.push(w);
  });
  async function sendSetup() {
    for (const l of $('n-setupbox').value.split('\n').map(s => s.trim()).filter(Boolean)) {
      if (/^SAVE$/i.test(l)) { log('skipped SAVE', '#fa0'); continue; }
      log('> ' + l, '#888'); await writeLine(l); await nextLine(800);
    }
  }
  function pump() {
    if (!st.connected || st.waitingAck || !st.outbox) return;
    const room = st.free - 8;
    if (room < 10) return;
    const n = Math.min(CHUNK, room, st.outbox.length);
    const chunk = st.outbox.slice(0, n);
    st.outbox = st.outbox.slice(n);
    st.waitingAck = true;
    st.ackTimer = setTimeout(() => { st.waitingAck = false; log('ack timeout', '#fa0'); pump(); }, ACK_TIMEOUT_MS);
    writeLine('Q ' + chunk);
  }
  async function waitAcked(ms = 1500) {   // first chunk acknowledged = there is data to type
    for (let i = 0; i < ms / 10 && st.waitingAck; i++) await new Promise(r => setTimeout(r, 10));
  }

  // ---------------- race control ----------------
  async function queueFrom(idx) {         // STOP the Mega, then queue text[idx..] and END
    await writeLine('STOP'); await nextLine(800);
    st.outbox = st.text.slice(idx); st.base = idx; st.megaDone = false;
    st.free = 1024; st.waitingAck = false;
    pump(); await waitAcked();
    await writeLine('END');
  }

  async function arm() {
    if (st.phase === 'armed' || st.phase === 'racing') { log('already armed', '#fa0'); return; }
    if (!st.connected) {
      log('connecting (the Mega resets, ~3 s)…');
      await connect();
      if (!st.connected) { log('could not open the port. Is Tetris or Serial Monitor using it?', '#f66'); return; }
    }
    st.phase = 'armed'; st.resyncs = 0; st.text = ''; st.raceSeen = null;
    log('armed: waiting for the race text…', '#e2b714');
  }

  async function prepare() {              // called once the text is on screen
    st.text = raceText();
    const bad = [...new Set(st.text.replace(/[\x20-\x7e]/g, ''))];
    if (bad.length) log('⚠ characters the keyboard cannot type: ' + bad.map(c => JSON.stringify(c)).join(' ') + ' (the car will stall there)', '#f66');
    log(`text: ${st.text.length} chars, ${(st.text.match(/[A-Z~!@#$%^&*()_+{}|:"<>?]/g) || []).length} need Shift`);
    await queueFrom(0);
    st.raceSeen = letters()[0] || null;
  }

  async function go() {
    st.phase = 'racing'; st.t0 = performance.now(); st.lastMoveAt = st.t0; st.lastIdx = -1; st.wrongSince = 0;
    focusRace();
    await writeLine('GO');
    log('GO', '#2c5');
  }

  async function resync(why) {
    if (st.resyncs >= MAX_RESYNCS) { log(`too many resyncs, stopping (${why})`, '#f66'); return stop('resync limit'); }
    st.resyncs++; st.phase = 'resyncing';
    const idx = cursor().idx;
    log(`resync #${st.resyncs} at char ${idx} "${st.text[idx] ?? ''}" (${why})`, '#fa0');
    await queueFrom(idx);
    if (st.phase !== 'resyncing') return;            // stopped meanwhile
    focusRace();
    st.phase = 'racing'; st.lastMoveAt = performance.now(); st.wrongSince = 0;
    await writeLine('GO');
  }

  async function stop(why) {
    const was = st.phase;
    st.phase = 'idle'; st.outbox = '';
    if (was !== 'idle') log('STOP (' + why + ')', '#fa0');
    if (st.connected) { await writeLine('STOP'); await nextLine(800); }
    if (!st.auto && was !== 'idle' && st.connected && !window.NTR_FAKE) await release();
  }
  async function release() { if (st.connected) { await disconnect(); log('port released', '#888'); } }

  function readResults() {
    const r = doc().querySelector('.race-results') || doc().querySelector('.racev3');
    const txt = (r ? r.innerText : '').replace(/\s+/g, ' ');
    const wpm = txt.match(/(\d{2,4})\s*WPM/i), acc = txt.match(/(\d{1,3}(?:\.\d+)?)\s*%\s*Acc/i) || txt.match(/Acc\w*\s*(\d{1,3}(?:\.\d+)?)\s*%/i);
    const place = txt.match(/\b(1st|2nd|3rd|4th|5th)\b/i);
    return { wpm: wpm && wpm[1], acc: acc && acc[1], place: place && place[1], snippet: txt.slice(0, 160) };
  }

  // ---------------- watchdog loop (4 ms) ----------------
  let busy = false;
  const tick = setInterval(async () => {
    if (busy) return; busy = true;
    try {
      const now = performance.now();
      if (st.phase === 'armed') {
        const ls = letters();
        if (ls.length && st.text === '' && !finished()) { await prepare(); }
        if (st.text && racing() && !finished()) await go();
      } else if (st.phase === 'racing') {
        if (finished()) {
          const r = readResults(), secs = ((now - st.t0) / 1000).toFixed(2);
          log(`FINISH in ${secs}s · ${r.wpm ?? '?'} WPM · ${r.acc ?? '?'}% acc · ${r.place ?? ''} · resyncs ${st.resyncs}`, '#ff5a1f');
          if (!r.wpm) log('results text: ' + r.snippet, '#888');
          await stop('race finished');
          if (st.auto) { st.phase = 'idle'; setTimeout(() => arm(), 300); }
        } else {
          const c = cursor();
          if (c.idx !== st.lastIdx) { st.lastIdx = c.idx; st.lastMoveAt = now; }
          if (c.wrong) { if (!st.wrongSince) st.wrongSince = now; } else st.wrongSince = 0;
          if (st.wrongSince && now - st.wrongSince > RESYNC_MS) await resync('wrong key stuck');
          else if (st.megaDone && c.idx < st.text.length && now - st.lastMoveAt > 120) await resync('Mega finished early');
          else if (now - st.lastMoveAt > STALL_MS) await resync('cursor stalled');
        }
      }
      const c = st.text ? cursor() : { idx: 0 };
      $('n-stats').textContent = `${st.phase} · ${c.idx}/${st.text.length} chars · resyncs ${st.resyncs} · Mega free ${st.free}` +
        (countingDown() ? ' · countdown' : '') + (racing() ? ' · racing' : '');
    } catch (e) { log('error: ' + e.message, '#f66'); }
    busy = false;
  }, 4);

  // ---------------- wire buttons ----------------
  $('n-arm').onclick = arm;
  $('n-stop').onclick = () => stop('button');
  $('n-setup').onclick = sendSetup;
  $('n-release').onclick = release;
  $('n-auto').onchange = e => { st.auto = e.target.checked; log('auto re-arm ' + (st.auto ? 'ON' : 'off')); };
  $('n-cmd').addEventListener('keydown', async e => {
    if (e.key === 'Enter') { const v = e.target.value.trim(); if (v) { log('> ' + v, '#888'); await writeLine(v); } e.target.value = ''; }
  });

  window.__ntr = { panel, st, cursor, raceText, close() { clearInterval(tick); panel.remove(); disconnect(); } };
  log(window.NTR_FAKE ? 'FAKE serial mode (no Mega)' : ('Web Serial ' + ('serial' in navigator ? 'available' : 'NOT available, use Chrome')));
})();
