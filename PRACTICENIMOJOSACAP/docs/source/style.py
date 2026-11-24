"""Shared look for the SugarLoom alpha-testing documents.

Mirrors the Scale of Coffee House layout: landscape pages, a navy
banner, pale section bars, and tables with a navy header row.
"""
import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, Table, TableStyle, Spacer

FONTS = r"C:\Windows\Fonts"
pdfmetrics.registerFont(TTFont("Body",     os.path.join(FONTS, "arial.ttf")))
pdfmetrics.registerFont(TTFont("Body-B",   os.path.join(FONTS, "arialbd.ttf")))
pdfmetrics.registerFont(TTFont("Body-I",   os.path.join(FONTS, "ariali.ttf")))
pdfmetrics.registerFontFamily("Body", normal="Body", bold="Body-B", italic="Body-I")

NAVY   = colors.HexColor("#1F3864")
NAVY_L = colors.HexColor("#2E4E8F")
BAR    = colors.HexColor("#DCE4F2")
RULE   = colors.HexColor("#B8C4DC")
GREY   = colors.HexColor("#5A5A5A")
ZEBRA  = colors.HexColor("#F5F7FB")
PESO   = "\u20b1"

PAGE = landscape(A4)
MARGIN = 12 * mm

def ps(name, **kw):
    kw.setdefault("fontName", "Body")
    kw.setdefault("fontSize", 7.2)
    kw.setdefault("leading", 8.9)
    kw.setdefault("textColor", colors.black)
    return ParagraphStyle(name, **kw)

S = {
    "title":    ps("title",    fontName="Body-B", fontSize=20, leading=23, textColor=NAVY),
    "sub":      ps("sub",      fontSize=9,   leading=12, textColor=NAVY_L),
    "label":    ps("label",    fontName="Body-B", fontSize=8.5, leading=11, textColor=NAVY_L),
    "h2":       ps("h2",       fontName="Body-B", fontSize=11.5, leading=14, textColor=NAVY,
                               spaceBefore=8, spaceAfter=4),
    "h3":       ps("h3",       fontName="Body-B", fontSize=9.5, leading=12, textColor=NAVY,
                               spaceBefore=6, spaceAfter=3, keepWithNext=1),
    "body":     ps("body",     fontSize=8.2, leading=11),
    "bodysm":   ps("bodysm",   fontSize=7.3, leading=9.4, textColor=GREY),
    "defn":     ps("defn",     fontName="Body-I", fontSize=7.3, leading=9.4, textColor=GREY,
                               spaceAfter=3, keepWithNext=1),
    "italic":   ps("italic",   fontName="Body-I", fontSize=7.8, leading=10, textColor=GREY),
    "cell":     ps("cell"),
    "cellb":    ps("cellb",    fontName="Body-B"),
    "cellsm":   ps("cellsm",   fontSize=7.0, leading=8.8),
    "cellgrey": ps("cellgrey", textColor=GREY),
    "th":       ps("th",       fontName="Body-B", fontSize=7.6, leading=9.4,
                               textColor=colors.white),
    "tick":     ps("tick",     fontSize=9, leading=11, alignment=1),
}

TICK = "\u2610"

def P(text, style="cell"):
    return Paragraph(text, S[style])

def head_row(labels):
    return [Paragraph(l, S["th"]) for l in labels]

def table(data, widths, zebra_from=1, align_centre=(), repeat=1, head_at=0, extra=()):
    t = Table(data, colWidths=widths, repeatRows=repeat, hAlign="LEFT")
    cmds = [
        ("BACKGROUND",   (0, head_at), (-1, head_at), NAVY),
        ("TEXTCOLOR",    (0, head_at), (-1, head_at), colors.white),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
        ("GRID",         (0, 0), (-1, -1), 0.4, RULE),
        ("LEFTPADDING",  (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING",   (0, 0), (-1, -1), 2.4),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 2.4),
    ]
    for i in range(zebra_from, len(data)):
        if (i - zebra_from) % 2 == 1:
            cmds.append(("BACKGROUND", (0, i), (-1, i), ZEBRA))
    for c in align_centre:
        cmds.append(("ALIGN", (c, zebra_from), (c, -1), "CENTER"))
    cmds += list(extra)
    t.setStyle(TableStyle(cmds))
    return t


def band_row(title, definition, ncols):
    """Section title folded into the table so it repeats and never orphans."""
    txt = f"<b>{title}</b>"
    if definition:
        txt += f"<br/><font color='#5A5A5A'>{definition}</font>"
    cells = [Paragraph(txt, ps("band", fontName="Body", fontSize=8.2, leading=10.4,
                               textColor=NAVY))] + [""] * (ncols - 1)
    return cells

def section_bar(text, width):
    """The pale blue band used for 'A. TEST SESSION DETAILS'."""
    t = Table([[Paragraph(text, ps("bar", fontName="Body-B", fontSize=9,
                                   leading=11, textColor=NAVY))]],
              colWidths=[width], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, -1), BAR),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("TOPPADDING",   (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
    ]))
    return t

def sp(h=5):
    return Spacer(1, h)
