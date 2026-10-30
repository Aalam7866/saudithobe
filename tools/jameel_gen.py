"""Makes the website's JAMEEL measurement sheet from the exe's JameelSheet.cs / JameelStyles.cs:
   img/jameel_sheet.svg (the blank sheet below the header, as the exe's OnlineSpec picture) and
   src/jspec.js (every box / tick / style list with its place, the style drawings' names).
   Positions are copied 1:1 from JameelSheet.cs (template px 1500 x 1060, the screen shows from y = 104)."""
import json, os, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
W, H, TOP = 1500.0, 1060.0, 104.0
TS = 1.15
LSx, LSy, LDown = 1075 / 975, 888 / 800, 48
CuffDx, CuffDy = -130, -30
PocketDx, PocketDy = -94, -208
def LX(x): return 15 + (x - 15) * LSx
def Lft(x, y, w, h): return (15 + (x - 15) * LSx, 110 + (y - 198 + LDown) * LSy, w * LSx, h * LSy)
DrawPanel = (15, 110, 931, 888); OptPanel = (955, 110, 530, 888)
NotesTitle = (1140, 782, 160, 24); NotesBox = (958, 808, 524, 187); KNotes = 'q_notes'
NeckHeads = [('قلاب', (LX(528) + 3, 170, 46, 40), 'q_c0'), ('رقبة سادة', (LX(528) + 3, 214, 46, 44), 'q_c1')]
SizeHeads = [('رقبة سادة', (1402, 686, 80, 44), ['q_z_rq', 'q_z_pl']), ('قلاب', (1428, 734, 54, 44), ['q_z_cl0', 'q_z_cl1', 'q_z_cl2']),
             ('عرض رقبة تحت', (1054, 710, 130, 22), ['q_z_cf'])]
LeftBoxes = [('q_lb0', Lft(262, 293, 60, 48)), ('q_lb1', Lft(196, 321, 60, 48)), ('q_ls2', Lft(130, 349, 60, 48)), ('q_lb2', Lft(64, 376, 60, 48)),
             ('q_lb3', Lft(256, 435, 60, 48)), ('q_ls5', Lft(190, 460, 60, 48)), ('q_ls6', Lft(124, 484, 60, 48)), ('q_ls7', Lft(58, 508, 60, 48)),
             ('q_lb4', Lft(248, 560, 66, 60)), ('q_lb5', Lft(241, 636, 66, 60)), ('q_lb6', Lft(234, 712, 66, 60)), ('q_lb7', Lft(227, 788, 66, 60))]
B = []
B += [('q_c0', Lft(372, 204, 156, 36), False), ('q_c1', Lft(372, 244, 156, 40), False)]
B += [('q_b0', Lft(370, 360, 66, 50), False), ('q_b1', Lft(370, 414, 66, 50), False), ('q_b2', Lft(464, 360, 66, 50), False), ('q_b9', Lft(464, 414, 66, 50), False),
      ('q_b3', Lft(370, 500, 160, 54), False), ('q_b4', Lft(370, 558, 160, 54), False), ('q_b5', Lft(370, 616, 160, 54), False),
      ('q_b6', Lft(370, 674, 78, 56), False), ('q_b7', Lft(452, 674, 78, 56), False), ('q_b8', Lft(370, 734, 160, 54), False), ('q_b10', Lft(370, 792, 160, 54), False)]
B += [('q_s0', Lft(578, 293, 60, 48), False), ('q_s1', Lft(644, 321, 60, 48), False), ('q_s2', Lft(710, 349, 60, 48), False), ('q_s3', Lft(776, 376, 60, 48), False),
      ('q_s5', Lft(584, 435, 60, 48), False), ('q_s6', Lft(650, 460, 60, 48), False), ('q_s7', Lft(716, 484, 60, 48), False), ('q_s8', Lft(782, 508, 60, 48), False)]
B += [('q_cf_l', Lft(712 + CuffDx, 250 + CuffDy, 64, 50), False), ('q_cf_r', Lft(780 + CuffDx, 250 + CuffDy, 64, 50), False)]
B += [(k, r, False) for k, r in LeftBoxes]
B += [('q_r1', Lft(726 + PocketDx, 836 + PocketDy, 66, 56), False)]
B += [('q_z_rq', (1318, 686, 80, 44), False), ('q_z_pl', (1234, 686, 80, 44), False), ('q_z_cf', (1054, 734, 88, 44), False),
      ('q_z_pk', (142, 746, 60, 50), False), ('q_z_pk2', (22, 746, 116, 50), False), ('q_lt0', (32, 206, 160, 52), False),
      ('q_z_cl0', (1334, 734, 90, 44), False), ('q_z_cl1', (1240, 734, 90, 44), False), ('q_z_cl2', (1146, 734, 90, 44), False), (KNotes, NotesBox, True)]
DrawTicks = [('q_x_mob', 'جيب جوال', (113, 802, 89, 26)), ('q_x_mob2', 'دبل', (22, 802, 87, 26)), ('q_x_hid', 'جيب مخفي', (113, 832, 89, 26)), ('q_x_vis', 'جيب باين', (22, 832, 87, 26))]
KCollar = 'q_d_col'; KButtons = 'q_d_btn'
StylePlaces = [('q_d_jab', (1310, 148, 172, 130)), ('q_d_kabak', (1134, 148, 172, 130)), (KCollar, (958, 148, 172, 130)), ('q_d_jaib', (22, 580, 210, 160))]
PieceBar = (958, 116, 524, 28)
Fillings = ['جبزور', 'الماني', 'سنجل', 'دبل', '2.5 وصلة', '3 وصلة']
Extras = [('q_d_jab_fill', 'q_d_jab', 'حشوة', Fillings), ('q_d_cf_fill', 'q_d_kabak', 'حشوة', Fillings), ('q_d_col_fill', KCollar, 'حشوة', Fillings),
          ('q_d_col_snap', KCollar, 'كبس', ['1 بلاستك', '2 بلاستك', '1 حديد', '2 حديد', '1 عراوي', '2 عراوي'])]
Categories = [('q_d_jab', ['3_'], 'الجبزور'), ('q_d_kabak', ['4_'], 'الكبك'), (KCollar, ['1_', '2_'], 'القلاب / الرقبة'), ('q_d_jaib', ['5_'], 'الجيب')]

def names(file):
    f = file.lower()
    if f.startswith('collar_'):
        name = ('قلاب رسمي 2' if 'formal_2' in f else 'قلاب رسمي' if 'formal' in f else 'قلاب فرنسي' if 'french' in f else 'رقبة صيني مربع' if 'chinese_square' in f
                else 'رقبة صيني مدور' if 'chinese_round' in f else 'رقبة عادي' if 'regular' in f else 'رقبة مدور' if 'round' in f else file)
        sub = ('مخفي كبس واحد' if f.endswith('_hidden_snap1') else 'مخفي كبس ٢' if f.endswith('_hidden_snap2') else 'كبس ٢' if f.endswith('_snap2')
               else 'زرار باين ١' if f.endswith('_button1') else 'زرار باين' if f.endswith('_button') else '')
        return name, sub
    if f.startswith('placket_'):
        shape = 'مربع' if 'square' in f else 'مثلث'
        sub = ('مخفي حشوة' if 'hidden_padding' in f else 'سحاب مخفي' if 'hidden_zipper' in f else 'سحاب' if 'zipper' in f else 'مخفي' if 'hidden' in f else 'باين')
        return f'جبزور {shape} {sub}', ''
    if f.startswith('cuff_'):
        if 'plain_open' in f: return 'سادة مفتوح', ''
        if 'plain' in f: return 'سادة', ''
        shape = ('كبك مشطوف' if 'chamfered' in f else 'كبك مربع' if 'square' in f else 'كبك مدور' if 'round' in f else 'كبك دبل' if 'double' in f else 'كبك فرنسي' if 'french' in f else 'كبك رسمي')
        kind = 'فرنسي' if '_french' in f and shape != 'كبك فرنسي' else 'رسمي' if '_formal' in f and shape != 'كبك رسمي' else ''
        pleat = 'كسرتين' if f.endswith('pleat2') else 'كسرة واحدة' if f.endswith('pleat1') else 'بدون كسرة'
        return shape, ' - '.join(x for x in [kind, pleat] if x)
    if f.startswith('pocket_'):
        shape = 'جيب مربع' if 'square' in f else 'جيب مشطوف' if 'chamfered' in f else 'جيب دائري' if 'round' in f else 'جيب مخفي' if 'hidden' in f else file
        sub = 'مشبك' if f.endswith('_clip') else 'قلم كامل' if f.endswith('_pen') else ''
        return shape, sub
    return file, ''

SRC = pathlib.Path('/mnt/user-data/uploads/AL THOB/thobe_design/thobe_design')
dirs = sorted(os.listdir(SRC))
def lst(prefixes):
    out = []
    for p in prefixes:
        d = next((x for x in dirs if x.startswith(p)), None)
        if not d: continue
        for f in sorted((x for x in os.listdir(SRC / d) if x.endswith('.png')), key=lambda s: s.encode()):
            n, s = names(f[:-4]); out.append([f[:-4], n, s])
    return out
lists = {k: {'k': k, 't': t, 'o': lst(p)} for k, p, t in Categories}

r2 = lambda v: round(v, 2)
fields = [{'k': k, 'x': r2(r[0]), 'y': r2(r[1] - TOP), 'w': r2(r[2]), 'h': r2(r[3]), 't': 'multi' if m else 'box'} for k, r, m in B]
fields += [{'k': k, 'x': r[0], 'y': r[1] - TOP, 'w': r[2], 'h': r[3], 't': 'tick', 'l': t} for k, t, r in DrawTicks]
per_piece = ['q_d_jab', 'q_d_kabak', KCollar, KButtons] + [e[0] for e in Extras]
pocket = StylePlaces[3]
area_bottom = min(h[1][1] for h in SizeHeads) - 8
spec = {'w': W, 'h': H - TOP, 'notes': KNotes, 'fields': fields,
        'models': {'area': [OptPanel[0] + 3, PieceBar[1] - TOP, OptPanel[2] - 6, area_bottom - PieceBar[1]],
                   'cells': [lists['q_d_jab'], lists['q_d_kabak'], lists[KCollar]],
                   'pocket': {'list': lists['q_d_jaib'], 'r': [pocket[1][0], pocket[1][1] - TOP, pocket[1][2], pocket[1][3]]},
                   'btn': {'k': KButtons, 'cell': 'q_d_jab', 't': 'زرار', 'o': ['3', '4', '5']},
                   'extras': [{'k': k, 'cell': c, 't': t, 'o': o} for k, c, t, o in Extras],
                   'fab': 'q_d_fab', 'qty': 'q_d_qty', 'more': 'q_d_more', 'note': 'q_d_mnote', 'max': 20}}
(ROOT / 'src' / 'jspec.js').write_text('/* generated by tools/jameel_gen.py from the exe\'s JameelSheet.cs – do not edit by hand */\nconst JSPEC=' + json.dumps(spec, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')

# ---------------- the blank sheet (DrawStatic forPrint + DrawValues of an empty sheet, hideEmpty) as SVG
pt = lambda p: p * 96 / 72
o = []
def ln(x1, y1, x2, y2, w=1.6, extra=''): o.append(f'<line x1="{r2(x1)}" y1="{r2(y1)}" x2="{r2(x2)}" y2="{r2(y2)}" stroke-width="{w}"{extra}/>')
def rect(r, w=1.6, fill='none'): o.append(f'<rect x="{r2(r[0])}" y="{r2(r[1])}" width="{r2(r[2])}" height="{r2(r[3])}" fill="{fill}" stroke-width="{w}"/>')
def poly(pts, w, closed=False, cls=''): o.append(f'<{"polygon" if closed else "polyline"} points="{" ".join(f"{r2(x)},{r2(y)}" for x, y in pts)}" fill="none" stroke-width="{w}"{cls}/>')
def text(s, x, y, size, anchor='middle', underline=False):
    o.append(f'<text stroke="none" x="{r2(x)}" y="{r2(y)}" font-size="{r2(pt(size))}" text-anchor="{anchor}" dominant-baseline="central"{" text-decoration=\"underline\"" if underline else ""}>{s}</text>')

ln(15, 106, 1485, 106)
rect(DrawPanel); rect(OptPanel)
# the thobe and sketches (drawn for the earlier panel, scaled into the new one)
o.append(f'<g transform="translate(15 110) scale({LSx:.6f} {LSy:.6f}) translate(-15 {-198 + LDown})" stroke-linejoin="round" stroke-linecap="round">')
mx = 900
def both(w, x1, y1, x2, y2): ln(x1, y1, x2, y2, w); ln(mx - x1, y1, mx - x2, y2, w)
P, F = 2.6, 1.8
o.append('<path d="M404,310 A46,24 0 0 1 496,310" fill="none" stroke-width="2.6"/>')
o.append('<path d="M418,312 A32,16 0 0 1 482,312" fill="none" stroke-width="1.8"/>')
poly([(404, 310), (450, 352), (496, 310)], P); poly([(418, 310), (450, 338), (482, 310)], F)
both(P, 404, 310, 330, 342); both(P, 330, 342, 82, 446); both(P, 82, 446, 98, 490); both(P, 98, 490, 318, 408); both(F, 104, 437, 120, 481)
poly([(116.8, 472.2), (191.8, 444.2), (195.3, 453.6)], F)
both(P, 318, 408, 324, 452); both(F, 300, 452, 334, 452); both(P, 334, 452, 292, 900)
ln(292, 900, 608, 900, P); ln(295, 866, 605, 866, F); both(F, 348, 342, 348, 866)
poly([(440, 352), (460, 352), (460, 472), (450, 488), (440, 472)], P, closed=True)
for y in (372, 398, 424, 450): o.append(f'<circle cx="450" cy="{y}" r="4" fill="#1e1e1e" stroke="none"/>')
# cuff sketch (moved)
o.append(f'<g transform="translate({CuffDx} {CuffDy})">')
poly([(716, 240), (714, 214), (848, 244)], 2.2)
for x1, y1, x2, y2 in [(738, 220, 742, 244), (806, 234, 810, 246), (848, 244, 884, 246)]: ln(x1, y1, x2, y2, 2, ' marker-end="url(#ar)"')
ln(842, 238, 836, 252, 2.2)
o.append('</g>')
o.append(f'<g transform="translate({PocketDx} {PocketDy})">')
poly([(716, 884), (704, 884), (704, 772), (746, 772)], 2.4)
o.append('<path d="M746,772 C734,790 728,820 728,852" fill="none" stroke-width="2.4"/>')
o.append('</g></g>')
for k, r, m in B:
    if m: rect(r)
    else: rect(r, fill='#dedede')
text('ملاحظات', NotesTitle[0] + NotesTitle[2] / 2, NotesTitle[1] + NotesTitle[3] / 2, 12 * TS, underline=True)
# (direction rtl: 'end' = the text's left end at x – GDI's Far alignment in a right-to-left rect)
for t, r, keys in SizeHeads: text(t, r[0], r[1] + r[3] / 2, 11.5 * TS, anchor='end')
for t, r, key in NeckHeads:
    words = t.split(' ')
    if len(words) == 1: text(t, r[0] + r[2] / 2, r[1] + r[3] / 2, 10 * TS)
    else:
        for i, wd in enumerate(words): text(wd, r[0] + r[2] / 2, r[1] + r[3] / 2 + (i - (len(words) - 1) / 2) * pt(10 * TS) * 1.1, 10 * TS)
# footer
ln(15, 1004, 1485, 1004)
text('مشرف المشغل :', 1485, 1025, 11 * TS, anchor='start'); text('مسؤول المعرض :', 945, 1025, 11 * TS, anchor='start')
text('عدد الثياب', 610, 1025, 11 * TS, anchor='start'); text('التسليم :', 360, 1025, 11 * TS, anchor='start')
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {TOP:.0f} {W:.0f} {H - TOP:.0f}" width="{W:.0f}" height="{H - TOP:.0f}">
<defs><marker id="ar" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#1e1e1e"/></marker></defs>
<rect x="0" y="{TOP:.0f}" width="{W:.0f}" height="{H - TOP:.0f}" fill="#fff"/>
<g stroke="#1e1e1e" fill="#000" font-family="Arial, Helvetica, sans-serif" font-weight="bold" direction="rtl">
{chr(10).join(o)}
</g></svg>'''
(ROOT / 'img' / 'jameel_sheet.svg').write_text(svg, encoding='utf-8')
print('fields', len(fields), 'lists', {k: len(v['o']) for k, v in lists.items()}, 'svg', len(svg))
