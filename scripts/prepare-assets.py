"""Read-only conversion of original MIDI; original/ is never modified."""
import json, struct
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
data = (ROOT / 'original/AncientKingdom/res/cave.mid').read_bytes()
division = int.from_bytes(data[12:14], 'big')
pos = 14
notes, tempos = [], [(0, 500000)]
while pos < len(data):
    size = int.from_bytes(data[pos+4:pos+8], 'big')
    track = data[pos+8:pos+8+size]
    pos += 8 + size
    i, tick, status = 0, 0, 0
    active, programs = {}, {}
    def vlq():
        global i
        n = 0
        while True:
            b = track[i]; i += 1; n = (n << 7) | (b & 127)
            if b < 128: return n
    while i < len(track):
        tick += vlq()
        if track[i] & 128: status = track[i]; i += 1
        if status == 255:
            kind = track[i]; i += 1; length = vlq(); body = track[i:i+length]; i += length
            if kind == 81: tempos.append((tick, int.from_bytes(body, 'big')))
            continue
        if status in (240, 247): i += vlq(); continue
        kind, channel = status >> 4, status & 15
        a = track[i]; i += 1
        b = 0
        if kind not in (12, 13): b = track[i]; i += 1
        if kind == 12: programs[channel] = a
        elif kind == 9 and b > 0: active[channel, a] = (tick, b, programs.get(channel, 0))
        elif kind == 8 or (kind == 9 and b == 0):
            if (channel, a) in active:
                start, velocity, program = active.pop((channel, a))
                notes.append((start, tick, a, velocity, program))
tempos = sorted(set(tempos))
def seconds(tick):
    previous, tempo, total = 0, 500000, 0
    for t, value in tempos:
        if t > tick: break
        total += (t-previous) * tempo / division / 1000000
        previous, tempo = t, value
    return total + (tick-previous) * tempo / division / 1000000
out = [[round(seconds(a), 4), round(seconds(b)-seconds(a), 4), n, v, p] for a,b,n,v,p in notes]
out.sort()
(ROOT / 'public/assets/cave-notes.json').write_text(json.dumps({'duration': max(n[0]+n[1] for n in out)+1, 'notes': out}), encoding='utf8')
print(f'{len(out)} MIDI notes converted')
# Optional deterministic extraction for the title background, leaving text intact
# in the original title.png used in the credits.
try:
    from PIL import Image
    Image.open(ROOT / 'original/AncientKingdom/res/title.png').crop((0,70,240,252)).save(ROOT / 'public/assets/title-ruins.png')
except ImportError:
    print('Pillow absent: keeping the already prepared title-ruins.png')
