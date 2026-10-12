#!/bin/bash
# Demo switcher (Dean demo, Oct 12): one Terminal, one key per mode.
# Double-click in Finder, or run ./demo.command
#   T = Tetris (HUMAN vs CLAUDE)      M = Monkeytype       Q = quit
# The serial port is shared: Tetris takes it while the game window is open;
# the Monkeytype panel takes it on "Arm & Go" and lets go when the test ends.
cd "$(dirname "$0")"
source agent/.venv/bin/activate 2>/dev/null || echo "!! venv not found (agent/.venv)"
GAME="${TETRIS_GAME:-runs/20261007-225806/claude_game.py}"

while true; do
  clear
  port=$(ls /dev/cu.usbmodem* 2>/dev/null | head -1)
  echo
  echo "   ==========  KEYBOARD THAT PLAYS ITSELF  =========="
  echo
  echo "      [T]  Tetris  - HUMAN vs CLAUDE"
  echo "      [M]  Monkeytype speed test"
  echo "      [Q]  quit"
  echo
  if [ -n "$port" ]; then echo "   Mega: $port"; else echo "   !! Mega NOT plugged in (USB)"; fi
  echo "   PSU on only while it's typing."
  echo
  read -rsn1 -p "   choose > " k; echo
  case "$k" in
    t|T)
      echo "   Tetris: if Monkeytype just ran, it already released the port."
      echo "   Game window opens (maybe BEHIND this one: Cmd-Tab -> Python)."
      echo "   Click the game window, click to start. Close the window to come back here."
      echo
      ( cd tools/tetris_vs && python3 play.py --game "$GAME" )
      echo; read -rsn1 -p "   game closed. any key for the menu " _ ;;
    m|M)
      open -a "Google Chrome" "https://monkeytype.com" 2>/dev/null || open "https://monkeytype.com"
      echo
      echo "   In Chrome:"
      echo "    1. Panel already there? skip to 3."
      echo "    2. Cmd+Opt+J -> Sources -> Snippets -> mt_reader -> Cmd+Enter"
      echo "    3. Fresh test on screen (Esc), then  Arm & Go"
      echo "       (connects by itself, ~3 s; releases the port when the test ends)"
      echo
      read -rsn1 -p "   any key for the menu " _ ;;
    q|Q) echo; exit 0 ;;
  esac
done
