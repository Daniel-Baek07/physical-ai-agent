#!/usr/bin/env python3
"""Look at every clip in a project so Claude can plan the edit.

usage: ingest.py <project_dir> [--every SECONDS]
Reads <project>/proxies/* (falls back to clips/*), writes <project>/_ingest/:
  <clip>.sheet.png  - contact sheet, one thumbnail every N seconds, timestamped
  ingest.md         - durations, resolution, loud moments, quiet/speech spans
"""
import json, os, re, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont

VIDEO = re.compile(r"\.(mp4|mov|m4v|mkv|webm)$", re.I)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def probe(p):
    out = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", p],
                         capture_output=True, text=True).stdout
    j = json.loads(out)
    v = next((s for s in j["streams"] if s["codec_type"] == "video"), {})
    a = any(s["codec_type"] == "audio" for s in j["streams"])
    rot = 0
    for sd in v.get("side_data_list", []) or []:
        rot = int(sd.get("rotation", 0) or 0)
    w, h = v.get("width", 0), v.get("height", 0)
    if abs(rot) == 90:
        w, h = h, w
    fr = v.get("avg_frame_rate", "0/1").split("/")
    fps = float(fr[0]) / float(fr[1]) if float(fr[1] or 1) else 0
    return float(j["format"].get("duration", 0)), w, h, fps, a


def loud_moments(p, dur):
    """Return (time, dB) of the loudest short windows - claps, solenoid slams, shouts."""
    out = subprocess.run(["ffmpeg", "-i", p, "-af", "astats=metadata=1:reset=3,ametadata=print:key=lavfi.astats.Overall.Peak_level",
                          "-vn", "-f", "null", "-"], capture_output=True, text=True).stderr
    pts, cur = [], None
    for line in out.splitlines():
        m = re.search(r"pts_time:([\d.]+)", line)
        if m: cur = float(m.group(1))
        m = re.search(r"Peak_level=(-?[\d.inf]+)", line)
        if m and cur is not None:
            try: pts.append((cur, float(m.group(1))))
            except ValueError: pass
    pts.sort(key=lambda x: -x[1])
    picked = []
    for t, db in pts:
        if all(abs(t - u) > 1.0 for u, _ in picked):
            picked.append((t, db))
        if len(picked) >= 6: break
    return sorted(picked)


def quiet_spans(p):
    out = subprocess.run(["ffmpeg", "-i", p, "-af", "silencedetect=n=-38dB:d=0.6", "-vn", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    s = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    e = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    return list(zip(s, e + [None] * (len(s) - len(e))))


def sheet(p, dur, every, dst):
    n = max(1, min(48, int(dur / every) + 1))
    step = dur / n
    thumbs = []
    with tempfile.TemporaryDirectory() as td:
        for i in range(n):
            t = min(dur - 0.05, i * step + step / 2)
            f = os.path.join(td, f"{i}.jpg")
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{t:.2f}", "-i", p, "-frames:v", "1",
                            "-vf", "scale=320:-2", f], check=False)
            if os.path.exists(f):
                thumbs.append((t, Image.open(f).convert("RGB")))
    if not thumbs: return
    tw, th = thumbs[0][1].size
    cols = 6 if tw < th else 4
    rows = (len(thumbs) + cols - 1) // cols
    im = Image.new("RGB", (cols * tw, rows * (th + 30)), "black")
    d = ImageDraw.Draw(im)
    font = ImageFont.truetype(FONT, 22)
    for i, (t, img) in enumerate(thumbs):
        x, y = (i % cols) * tw, (i // cols) * (th + 30)
        im.paste(img.resize((tw, th)), (x, y + 30))
        d.text((x + 6, y + 3), f"{t:6.1f}s", fill=(255, 140, 60), font=font)
    im.save(dst)


def main():
    proj = sys.argv[1]
    every = float(sys.argv[sys.argv.index("--every") + 1]) if "--every" in sys.argv else 0
    src_dir = os.path.join(proj, "proxies") if os.path.isdir(os.path.join(proj, "proxies")) else os.path.join(proj, "clips")
    outd = os.path.join(proj, "_ingest"); os.makedirs(outd, exist_ok=True)
    lines = [f"# Ingest: {os.path.basename(os.path.abspath(proj))}\n", f"source folder: `{os.path.relpath(src_dir, proj)}/`\n"]
    for name in sorted(os.listdir(src_dir)):
        p = os.path.join(src_dir, name)
        if not VIDEO.search(name): continue
        dur, w, h, fps, has_a = probe(p)
        ev = every or max(1.0, dur / 24)
        sheet(p, dur, ev, os.path.join(outd, name + ".sheet.png"))
        lines.append(f"\n## {name}\n- {dur:.1f}s · {w}x{h} · {fps:.0f}fps · {'portrait' if h > w else 'landscape'} · audio: {'yes' if has_a else 'no'}")
        if has_a:
            lm = loud_moments(p, dur)
            if lm: lines.append("- loudest moments: " + ", ".join(f"{t:.1f}s ({db:.0f}dB)" for t, db in lm))
            qs = quiet_spans(p)
            if qs: lines.append("- quiet spans: " + ", ".join(f"{a:.1f}-{b:.1f}s" if b else f"{a:.1f}s-end" for a, b in qs[:12]))
        lines.append(f"- contact sheet: `_ingest/{name}.sheet.png` (one frame every {ev:.1f}s)")
    open(os.path.join(outd, "ingest.md"), "w").write("\n".join(lines) + "\n")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
