# Nitro Type reader — run card (Oct 16, 2026)

Two pieces:
- `firmware/keyboard_v1/keyboard_v1.ino`: the fast stream now does **Shift chords** (capitals and `!@#$%^&*()_+~{}|:"<>?`). New command `SHIFTMS <seat> <rise>`, default `30 30`. **Reflash before racing.**
- `tools/nitrotype_reader/nt_reader.js`: paste into a Chrome DevTools Snippet on nitrotype.com. It reads the race text, preloads it into the Mega, and fires `GO` when the countdown ends.

## Why Nitro Type is harder than Monkeytype
In Nitro Type a wrong key doesn't move the cursor. You have to type the right one. So **one solenoid that fails to press stalls the car**, because every key after it is "wrong". The reader watches the cursor (`.dash-letter.is-waiting` / `.is-incorrect`). If a wrong letter sits there for 100 ms, or the Mega finishes before the race does, it STOPs the Mega and re-queues the text from the cursor. It allows up to 30 resyncs per race. A doubled key only costs accuracy.

## 0. Flash + check Shift (5 min, Serial Monitor 115200, Newline)
USB first, then PSU. Never `SAVE`.
```
STATUS                      -> mapped=67/84, LShift must be on ch 4
PULSE 50
LEAD 3000
FAST The Quick Brown Fox, isn't it? "Yes!" OK.
```
Click into TextEdit during the 3 s. **Expect the line exactly.** TextEdit's smart quotes may curl the `"`. That's TextEdit, not the keyboard. The `DONE` line should show `shift=6 noshift=0`.
- Capitals come out lowercase → raise the seat: `SHIFTMS 45 30`.
- The letter *after* a capital is also capitalised → raise the rise: `SHIFTMS 30 45`.
- Both clean → try `SHIFTMS 20 25` for speed (the sim says ~540 vs ~510 WPM on a typical quote).

## 1. Nitro Type race
1. **Close Serial Monitor.**
2. Chrome → nitrotype.com → log in to the **throwaway** account.
3. DevTools (Cmd+Opt+J) → Sources → Snippets → New → name it `nt_reader` → paste the whole file → **Cmd+Enter**. (Re-run it after every page reload.)
4. Panel (top right) → check the setup box: `WPM 740 / FPULSE 50 / SAMEKEY 80 / SHIFTMS 30 30 / LEAD 0`.
5. Click **Race** on Nitro Type, then **Arm** on the panel **while the lobby is filling up**. It connects (the Mega resets, ~3 s), waits for the text, preloads it, and fires on the green light.
6. **Hands off the keyboard and mouse.** The panel's log shows `FINISH … WPM … acc … resyncs`.
7. Tick **auto** to re-arm by itself for the next race (the port stays open).

**Dry run with no Mega:** in the console, run `window.NTR_FAKE = true` first, then the snippet. Everything works except nothing gets typed.

## Things to expect
- **Typical quote speed:** at `WPM 740` a 184-char quote with 12 capitals/symbols schedules at ~510 WPM. Each Shift chord costs ~60 ms. All-lowercase text is unchanged from the 618 setup.
- **The panel warns** if the text has a character the keyboard can't type (anything outside plain ASCII after curly quotes and dashes are straightened). The car will stall there, so STOP and skip that race.
- **Nitro Type may flag it.** At these speeds it can ask for a typing verification, or ban the account. That's why the account is a throwaway. Keep it to a handful of races for the video. Every race you win is a loss for real players, many of whom are kids.
- If a race never starts (`armed` forever), Nitro Type changed its race-state class. Check the console: `document.querySelector('.race-header-controls').className` during the countdown and during the race.

## Verified / UNVERIFIED (Oct 16)
- ✅ Selectors read from the live page + Nitro Type's bundle: `.dash-letter`, `is-waiting`, `is-incorrect`, `is-typed`, `.race-header-controls.is-countdown/.is-racing`, `.racev3.is-race-results`, spaces are `&nbsp;`.
- ✅ Firmware: real avr-gcc compile for the Mega 2560 (23.6 KB flash, 48% RAM). Timing sim on host: every Shift chord decoded correctly with ≥30 ms seat/rise margins, max 5 coils on, **lowercase coil timeline byte-identical to the old firmware**.
- ✅ Reader dry-tested against a fake Nitro Type page (same DOM + same wrong-key rule): clean race 100%; 3% dropped keys → 2 resyncs, finished; 8% → 14 resyncs, finished.
- ❓ Shift on the real Nuphy at speed (step 0). ❓ Results-screen text format (the reader logs the raw text if it can't parse WPM). ❓ How fast `.is-racing` appears after the green light. ❓ Nitro Type's anticheat behaviour.
