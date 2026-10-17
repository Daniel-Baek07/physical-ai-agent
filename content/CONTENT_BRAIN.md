# Content Brain — head of marketing memory

Every marketing session reads this file first and updates it last. Chat history is not memory; this file is.
Facts here get corrected as "was X, now Y", never silently overwritten (same rule as CLAUDE.md).

## 1. Who we are

- **Daniel Baek**, TAMU engineering freshman. Builds a keyboard that types by itself: 84 solenoids above a Nuphy Air75, driven by his own PCBs (Arduino Mega → 74HC595 → ULN2803A).
- Story energy: early Mark Rober / Stuff Made Here. **Educational + hype.** Show why it's hard, make the viewer feel smart, deliver a payoff.
- The hardware is the moat. Real sound, real failures, real numbers. Nobody else has this footage.

## 2. Platforms (Daniel's choice, Oct 12)

| platform | role | audience | format |
|---|---|---|---|
| **Instagram Reels** | reach, the main growth channel | general / maker / AI-curious | 9:16, 15–60s, captions burned in, hook ≤0.5s |
| **LinkedIn** | career: recruiters, YC founders, hardware/robotics companies | engineers, hiring managers | native video or image + 120–250 word post, first line = hook, lessons > hype, no hashtag spam (≤3) |
| **X** | builders / AI crowd | indie hackers, AI people | clip + 1–3 line post, or a 4–6 tweet thread for build deep-dives |

Not in scope: TikTok, YouTube Shorts (can be added later; same 9:16 render works).
**Daniel approves and uploads every post himself. Nothing auto-posts.**

## 3. Voice rules

- Short sentences. Specific numbers (618 WPM, 84 solenoids, 168 wires, 4 hours per cell). Specificity = credibility.
- Honest. Failures are content (the melted chip got more love than the wins would have).
- Talk to the viewer like they're smart. Say "solenoid", explain it in one clause.
- No "hey guys", no "Part 6 / Day 53" in the first 3 seconds, no setup before the claim.
- Never claim things that didn't happen. Never say Monkeytype results are on the leaderboard (they are banned there; demo only, never submitted).
- Personal, not corporate. Lowercase-casual is fine on X; LinkedIn gets clean sentences but still sounds like a 18-year-old who builds things, not a press release.
- **Draft voice is a best guess until Daniel edits a few posts. Log every edit he makes in §8 and adapt.**

## 4. What has worked (evidence, newest first)

| date | post | platform | result | why it worked |
|---|---|---|---|---|
| Oct 5–6 | "618 WPM" raw Monkeytype run + text hook | (platform UNVERIFIED — ask) | **204k views, climbing** (Oct 6) | result-first, absurd number, real sound, zero explanation needed |
| Jul 30 | "Big Reset" short (perfboard → PCB, plate rebuild) | ? | ? (ask) | — |

Top comments on the 618 video (the content engine for the next videos):
- "let Claude control it and write its own software" (698 likes) → answered by the Tetris video.
- "sites might block you for perfect cadence" (1.7k likes) → true; answer in a reply/pin, not a build.
- "why not a macro / python script / what's the use" → answer: a macro replays; this is an AI writing new code and pressing real keys. Possible "why not software?" video.
- "too slow" → future speed video (blocked on plate support → shorter pulse → >618).

## 5. Rules that came from data (from Video_Hook_Bank.md + Social_Media_Strategy.md)

1. **Result first.** Open on the most impressive working thing. Hook complete by 0:05, ideally 0:02.
2. Hook as on-screen text AND spoken.
3. **Real sound on every key press.** Duck music to zero on payoff moments.
4. One promise per video, paid inside the same video. Never write a closer you can't cash (the Jul 30 "6 days until the PCB" closer went 53 days).
5. End on a question, not a goodbye.
6. Keep text out of the bottom 22% and right 13% (Reels UI).
7. Stagger platforms by 1–2 days. Reels first (reach), LinkedIn next day (career), X same day as Reels or the day after.
8. Best posting windows (starting guess, replace with Daniel's real analytics): Reels Tue/Thu/Sat 6–9pm CT; LinkedIn Tue–Thu 8–10am CT; X weekday 9am or 6pm CT.

## 6. Assets on hand (raw material)

- `video/tetris_vs/clips/` — Tetris versus footage (partial typing take, gameplay TBD). Edit owed.
- `media/` — cascade animations (`cell_x11_*`), plate renders, plate b-roll.
- `Video_541_Build_Script.md` — "how I built it" script (numbers need 541 → 618).
- `Video_SelfWrite_Script.md` — shelved selfwrite idea.
- `Video_Hook_Bank.md` — hook patterns.
- `cell1photo.jpg`, KiCad renders in `pcb/solenoid_driver/*.png`.
- The project log `CLAUDE.md` session records = endless true stories (melted chip at 1am, 4h perfboard cell, 20mm deck-height error, wiring with zero labels → automap).

## 7. Backlog (ideas ranked; the head of marketing re-ranks each session)

| # | idea | pillar | needs | status |
|---|---|---|---|---|
| 1 | **Me vs Claude: Tetris** — Claude writes the game, the robot types it, then plays me through the solenoids | answer-the-comment | edit from `video/tetris_vs/clips/` + gameplay rounds | footage partial |
| 2 | **How I built it (618)** — 90s build story | explainer | pickups listed in `Video_541_Build_Script.md` | scripted |
| 3 | **Showed it to the Dean of Engineering** (Oct 12, Fab Lab) | milestone / credibility | any footage or photo from the demo | ASK Daniel how it went |
| 4 | "Why not just use software?" — the sarcastic list | contrarian | face cam + rig | idea |
| 5 | The 1am pop: solenoids fired on their own and melted a chip | struggle | re-enact or VO over black + replaced socket | idea |
| 6 | Speed sequel: beat 618 | milestone | plate support + shorter pulse | blocked |
| 7 | LinkedIn: "what designing my first PCB taught me" (perfboard 4h/cell → KiCad → 120×66 board, ordered for ~$20) | career | KiCad renders on hand | ready to write |
| 8 | LinkedIn: "I tried to solder 11 circuits by hand. Here's the math that made me design a PCB instead." | career | cell1photo.jpg | ready to write |

## 8. Daniel's edits to drafts (voice training data)

(empty — log each change: what the draft said → what Daniel changed it to)

## 9. Post log

| date posted | slug | platform | link | views/likes at 48h | notes |
|---|---|---|---|---|---|

## 10. Processed inbox items

(one line per file: `filename → slug / verdict`)
