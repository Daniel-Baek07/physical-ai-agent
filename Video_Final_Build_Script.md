# Final video: "How I built a keyboard that types by itself" (Oct 16, 2026)

**Format:** vertical 9:16, **~1:30**, voiceover + a few face-cam lines. Every VO line is also a burned-in caption.
**Replaces** `Video_541_Build_Script.md` (same bones, now with 618 + Tetris + Nitro Type, rebuilt around stakes and re-hooks).
**Post it last**, after the Nitro Type video, as the project's closer. The number at 0:00 is whatever is most impressive by then (618 Monkeytype, or the Nitro result if it's bigger).

## Hook framework (what makes this one hold)
- **Q1, opened at 0:00:** "How does a keyboard type 618 WPM with nobody touching it?" Answered piece by piece. The whole video is the answer.
- **Q2, opened at 0:03 and held to 0:50:** "What was the 1 a.m. pop that almost ended it?" This is the open loop that carries the middle.
- **"Not what you think" at 0:06:** it's not a macro.
- **Re-hook every ~10 s.** Each section ends on a new problem ("but…", "then the real problem…"), so there's always a reason to keep watching.
- **Stakes, stated plainly, not implied:** a hand-soldered board taking 4 hours ×11, a melted chip at 1 a.m., 168 unlabelled wires, and Nitro Type's one-missed-key-stops-the-car rule.
- **End on a question.** Never a goodbye.

## Script (VO = 248 words ≈ 1:36 at 155 wpm; cut the 1:17 line if you need it under 1:30)

| Time | Voiceover | Shot | Have it? |
|---|---|---|---|
| 0:00 | **"This keyboard types 618 words per minute. Nobody's touching it."** | 2 s of the 618 run with real sound → result screen | ✅ 618 clip |
| 0:03 | **"It took four months, and one 1 a.m. pop that almost ended the whole thing."** (Q2 opens) | Black frame, one muffled pop SFX, then hard cut back to the keyboard | SFX only |
| 0:06 | "And no, it's not a macro. Nothing's pressing keys in software. Every key has its own robot." | Pull back to show the full rig over the keyboard | 🎥 wide |
| 0:12 | "A solenoid. Twelve volts in, the plunger slams down." | **240 fps slow-mo**, one solenoid firing | 🎥 shoot |
| 0:16 | "Eighty-four of them, one per key, each tilted four degrees to match the keyboard." | Plate CAD render → real plate | ✅ `media/new_plate_*` |
| 0:22 | **Re-hook:** "Then the real problem. An Arduino has fifty-four pins. I needed eighty-four." | Mega close-up, counter "54 / 84" in red | 🎥 / text |
| 0:28 | "So eleven shift registers turn three wires into eighty-eight outputs, and eleven driver chips switch the power." | `cell_x11_cascade.mp4` animation | ✅ |
| 0:35 | **Stakes:** "I hand-soldered the first one. It took four hours. I needed eleven." | Perfboard cell + timelapse; text "4 h × 11 = 44 h" | ✅ `cell1photo.jpg` / soldering clip |
| 0:40 | "So I learned to design my own circuit boards instead." | KiCad screen → boards arriving → soldered board | ✅ renders / 🎥 board |
| 0:45 | **Re-hook:** "A hundred sixty-eight wires. I didn't label a single one." | Wiring under the table, the paper-towel shim (one honest laugh) | 🎥 |
| 0:49 | "So I wrote a program that fires each solenoid and listens for which key shows up." | automap screen recording | 🎥 screen rec |
| 0:53 | **Q2 payoff:** "One a.m. The solenoids started firing by themselves. Then: pop." | Dark shot, full silence before the pop | — |
| 0:58 | "A driver chip melted. New chip, plus a fix that rewrites every chip two hundred times a second." | Push in on socket B.U12 + a fresh ULN2803A held up | 🎥 shoot |
| 1:04 | "Two thirty-seven a.m.: its first sentence." | "the quick brown fox…" typing | ? reshoot = 1 min |
| 1:08 | "A script reads Monkeytype off the screen. Each key fires before the last one lifts. The goal was 320. It hit 618. Zero mistakes." | mt_reader panel → 340 result → 618 result | ✅ |
| 1:17 | **Victory lap (only what's true + posted):** "Then you told me to let Claude control it, so Claude wrote a game and played me. Then it raced real people." | 2 s Tetris gameplay → 2 s Nitro Type finish | ✅ Tetris clips / 🎥 Nitro |
| 1:24 | **End question (face cam):** "Four months, eighty-four robots, one keyboard. That's the project. So what should I build next?" | Face cam, rig in the background | 🎥 |

## Alt hooks for 0:00 (A/B the first line, keep 0:03 as is)
1. **"This keyboard types 618 words per minute. Nobody's touching it."** (default, Result First)
2. **"84 robots, one keyboard, 618 words per minute."** (Shocking Stat, fastest to land)
3. **"Everyone said just use a macro. Here's why I built 84 robots instead."** (Contrarian; answers the comment war; better for LinkedIn/X)

## Pickups to shoot (one session, ~30–40 min)
1. **240 fps slow-mo:** a single solenoid firing, then a word streaming (`FAST hello world`).
2. Wide shot of the full rig (for 0:06).
3. Mega close-up (0:22).
4. A soldered board in hand, front and back (0:40).
5. Under-table wiring + the shim (0:45).
6. Screen recordings: KiCad board, automap run, mt_reader panel.
7. Socket B.U12 push-in + a spare ULN2803A in hand (the melted one is gone).
8. Clean "the quick brown fox" take (TextEdit, `TYPE …`).
9. Face cam: the end line. Optionally the 0:00 line too.

## Edit notes
- Cut on solenoid clicks. Keep real keyboard audio under the VO at about −18 dB.
- **The pop is the only full-silence moment.** Tease it at 0:03, pay it off at 0:53.
- Show the 618 result twice: tease at 0:00, payoff at 1:14.
- No "Part X" / "Day N" in the opening. Series numbering goes in the caption.
- The 1:17 victory lap only mentions videos that actually posted. If Tetris never posted, cut that half-line.

## Fact check before posting (every number in the VO)
618 WPM @ 100% (Oct 5) ✅ · 84 solenoids ✅ · 4° tilt ✅ · Mega has 54 digital pins ✅ · 11 × 74HC595 + 11 × ULN2803A, 88 channels ✅ · first cell 4 h ✅ · 168 leads ✅ · pop + melted B.U12 ✅ · refresh every 5 ms = 200×/s ✅ · first sentence 2:37 a.m. ✅ · goal 320 ✅ · "four months" = mid-June test fit → Oct 5 run ✅ · Tetris + Nitro = only if posted.

## Captions (draft)
- **Reels:** How I built a keyboard that types by itself: 84 solenoids, 3 circuit boards I designed, 1 melted chip. 618 WPM, zero mistakes. What should I build next? #engineering #robotics #buildinpublic
- **LinkedIn (lead with the lesson):** "I hand-soldered one circuit for my self-typing keyboard. It took 4 hours, and I needed 11. That math is why I learned PCB design…" → 3 short paragraphs: PCB, the 1 a.m. failure + the 5 ms fix, the result. Link the GitHub design docs.
- **X thread:** 1/ the 618 clip + "how it works 🧵" · 2/ solenoids · 3/ shift registers + drivers · 4/ the 4-hour cell → PCB · 5/ the pop · 6/ 618 + "what next?"
