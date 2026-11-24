"""SugarLoom Ph — researcher-prepared tester assignment sheets (T01–T03)."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from style import *          # noqa
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Table, TableStyle, Spacer, PageBreak
from reportlab.lib import colors
from reportlab.lib.units import mm

OUT = r"D:\Android\TEST8-main\PRACTICENIMOJOSACAP\docs\SugarLoomPh_Alpha_Tester_Sheets.pdf"
TESTERS = ["T01", "T02", "T03"]
TEST_DATE = "Insert date of testing"

W, H = PAGE
CONTENT_W = W - 2 * MARGIN

_page = {"n": 0}

def banner_and_footer(canv, doc):
    _page["n"] += 1
    i = _page["n"]
    tid = TESTERS[min(i - 1, len(TESTERS) - 1)]

    # ── navy banner ──
    bh = 20 * mm
    canv.saveState()
    canv.setFillColor(NAVY)
    canv.rect(0, H - bh, W, bh, stroke=0, fill=1)

    canv.setFillColor(colors.white)
    canv.setFont("Body-B", 14)
    canv.drawString(MARGIN, H - 11 * mm, "SUGARLOOM PH  |  ALPHA TESTING")
    canv.setFont("Body", 7.6)
    canv.setFillColor(colors.HexColor("#C9D4EA"))
    canv.drawString(MARGIN, H - 16 * mm,
                    "Researcher-prepared individual tester assignment sheet  \u2022  Not a scored questionnaire")

    # tester badge
    bw, bhh = 26 * mm, 10 * mm
    bx, by = W - MARGIN - bw, H - 15 * mm
    canv.setFillColor(colors.HexColor("#33518C"))
    canv.roundRect(bx, by, bw, bhh, 2 * mm, stroke=0, fill=1)
    canv.setFillColor(colors.white)
    canv.setFont("Body-B", 15)
    canv.drawCentredString(bx + bw / 2, by + 3 * mm, tid)

    # ── footer ──
    canv.setFillColor(GREY)
    canv.setFont("Body", 6.8)
    canv.drawString(MARGIN, 8 * mm,
        "For completion by the research team before distribution. Collect and secure credential sheets after the session.")
    canv.setFillColor(NAVY_L)
    canv.drawRightString(W - MARGIN, 8 * mm, f"Tester sheet {tid}  |  {i} / {len(TESTERS)}")
    canv.setStrokeColor(RULE)
    canv.setLineWidth(0.4)
    canv.line(MARGIN, 11 * mm, W - MARGIN, 11 * mm)
    canv.restoreState()


def kv_table(rows, w1, w2, w3=None, w4=None):
    if w3 is None:
        data = [[P(a, "cellb"), P(b)] for a, b in rows]
        widths = [w1, w2]
    else:
        data = [[P(a, "cellb"), P(b), P(c, "cellb"), P(d)] for a, b, c, d in rows]
        widths = [w1, w2, w3, w4]
    t = Table(data, colWidths=widths, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.4, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F2F5FA")),
    ] + ([("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#F2F5FA"))] if w3 else [])))
    return t


def sheet(tid):
    f = []
    f.append(section_bar("A.  TEST SESSION DETAILS", CONTENT_W))
    f.append(sp(3))
    f.append(kv_table([
        ("Tester ID", tid, "Date of testing", TEST_DATE),
        ("System URL / environment",
         "sugarloom.vercel.app/pages/homepage.html  (Customer website)<br/>"
         "sugarloom.vercel.app/admin/admin.html  (Staff portal)",
         "Device / browser", ""),
    ], 42 * mm, 105 * mm, 32 * mm, 75 * mm))

    f.append(sp(5))
    f.append(section_bar("B.  TEST ACCOUNTS  \u2022  Use only the accounts assigned to you", CONTENT_W))
    f.append(sp(3))
    acc = [head_row(["User role", "Username or customer email", "Assigned password / access instructions"])]
    for role, user, pw in [
        ("Super Administrator", "superadmin@sugarloom.ph", "super123"),
        ("Administrator",       "admin@sugarloom.ph",      "admin123"),
        ("Baker",               "baker@sugarloom.ph",      "baker123"),
        ("Packer",              "packer@sugarloom.ph",     "packer123"),
        ("Customer \u2014 fresh",    f"sugarloom.fresh.{tid.lower()}@&lt;your inbox&gt;",
                                "Register this account yourself at the start of the session; it must have no previous orders"),
        ("Customer \u2014 returning", f"sugarloom.return.{tid.lower()}@&lt;your inbox&gt;",
                                "Prepared by the research team with at least one Fulfilled order"),
    ]:
        acc.append([P(role, "cellb"), P(user), P(pw)])
    f.append(table(acc, [45 * mm, 85 * mm, 124 * mm]))

    f.append(sp(5))
    f.append(section_bar("C.  REQUIRED TEST DATA AND RESEARCHER SETUP", CONTENT_W))
    f.append(sp(3))
    td = [head_row(["Test requirement", "Assigned value / file", "Used by"])]
    for req, val, used in [
        ("New test staff account to create",
         f"sugarloom.baker.{tid.lower()}@sugarloom.ph  \u2014  role <b>Baker</b>", "A1, A2"),
        ("Order A \u2014 four pieces, the minimum",
         f"Fudge Brownies \u00d72 ({PESO}160) + Matcha Cookies \u00d71 ({PESO}70) + Vanilla Cupcake \u00d71 ({PESO}75) = <b>{PESO}305</b>",
         "B4, B7, B9, B10"),
        ("Order B \u2014 above " + PESO + "800, at most " + PESO + "2,000",
         f"Fudge Brownies \u00d76 ({PESO}480) + Matcha Cookies \u00d73 ({PESO}210) + Vanilla Cupcake \u00d72 ({PESO}150) = <b>{PESO}840</b>",
         "B8"),
        ("Order C \u2014 above " + PESO + "2,000",
         f"Fudge Brownies \u00d715 ({PESO}1,200) + Matcha Cookies \u00d710 ({PESO}700) + Vanilla Cupcake \u00d72 ({PESO}150) = <b>{PESO}2,050</b>. "
         "If a daily limit blocks a quantity, swap in other products to keep the subtotal above " + PESO + "2,000.",
         "B7, SA-1"),
        ("Box order \u2014 exempt from the four-piece minimum",
         f"Fudge Brownies Box \u00d71 ({PESO}250) on its own", "B4"),
        ("Delivery addresses",
         "<b>Near:</b> a street address in Ermita, Manila &nbsp;&bull;&nbsp; <b>Distant:</b> a street address in "
         "Alabang, Muntinlupa &nbsp;&bull;&nbsp; <b>Out of range:</b> any address more than 25 km from "
         "Pinagbuhatan, Pasig", "B6"),
        ("GCash receipt images (three)",
         f"<b>Valid:</b> your own screenshot sent to <b>GCASHMOJO</b> for <b>{PESO}305</b>, dated today "
         f"&nbsp;&bull;&nbsp; <b>Mismatched:</b> a second screenshot for a different amount (for example {PESO}100) "
         "&nbsp;&bull;&nbsp; <b>Not a receipt:</b> any ordinary photo. Test uploads move no real money.",
         "B9, C3, C4"),
        ("Recipe-linked ingredient to watch", "<b>All-purpose Flour</b> (used by Fudge Brownies)", "D5, D6"),
        ("Ingredient for the low-stock test",
         "<b>Cream Cheese</b> \u2014 set its reorder point to 50% and adjust stock down to that level", "D7, D8"),
        ("Product for the daily-limit test", "<b>Matcha Cookies</b> \u2014 set the daily limit to 10", "D3"),
        ("Cancellation samples", "One order cancelled before baking and one after baking starts", "B12, C9, D5"),
        ("Audit retention value to set", "90 days (change it, then put it back to 1 year)", "A8"),
    ]:
        td.append([P(req, "cellb"), P(val), P(used, "cellgrey")])
    f.append(table(td, [62 * mm, 141 * mm, 51 * mm]))

    f.append(sp(4))
    note = Table([[P("<b>BEFORE THE SESSION</b>", "cellsm"),
                   P("Run <b>supabase-schema.sql</b>, <b>supabase-audit-log.sql</b> and "
                     "<b>supabase-deleted-orders.sql</b> in the Supabase SQL editor. Seed the staff accounts, the "
                     "returning customer with one Fulfilled order, a clean empty cart, and the stock levels above. "
                     "Prepare the GCash receipt images. Never use real customer details and never send real payments.",
                     "cellsm")]],
                 colWidths=[30 * mm, CONTENT_W - 30 * mm], hAlign="LEFT")
    note.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFF6E5")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E0B964")),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
    ]))
    f.append(note)
    return f


def build():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    doc = BaseDocTemplate(OUT, pagesize=PAGE,
                          leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=23 * mm, bottomMargin=12 * mm,
                          title="SugarLoom Ph — Alpha Testing Tester Sheets",
                          author="Ebbat, Florentino, Ronquillo, Villanueva")
    frame = Frame(MARGIN, 12 * mm, CONTENT_W, H - 23 * mm - 12 * mm, id="f")
    doc.addPageTemplates([PageTemplate(id="p", frames=[frame], onPage=banner_and_footer)])

    story = []
    for i, tid in enumerate(TESTERS):
        story += sheet(tid)
        if i < len(TESTERS) - 1:
            story.append(PageBreak())
    doc.build(story)
    print("written:", OUT)


if __name__ == "__main__":
    build()
