"""SugarLoom Ph — alpha testing questionnaire, revised to the system as built."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from style import *          # noqa
from content import *        # noqa
from reportlab.platypus import (BaseDocTemplate, Frame, PageTemplate, Paragraph,
                                Table, TableStyle, Spacer, PageBreak, KeepTogether)
from reportlab.lib import colors
from reportlab.lib.units import mm

OUT = r"D:\Android\TEST8-main\PRACTICENIMOJOSACAP\docs\SugarLoomPh_Alpha_Testing_Questionnaire.pdf"

W, H = PAGE
CONTENT_W = W - 2 * MARGIN
TOP = 23 * mm
BOT = 12 * mm

TOTAL = {"n": 0}


def BAND(last_col):
    """Styles row 0 as the pale section band spanning the whole table."""
    return [
        ("SPAN", (0, 0), (last_col, 0)),
        ("BACKGROUND", (0, 0), (-1, 0), BAR),
        ("TOPPADDING", (0, 0), (-1, 0), 4),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
        ("LEFTPADDING", (0, 0), (-1, 0), 6),
    ]


def banner_and_footer(canv, doc):
    i = canv.getPageNumber()
    bh = 20 * mm
    canv.saveState()
    canv.setFillColor(NAVY)
    canv.rect(0, H - bh, W, bh, stroke=0, fill=1)

    canv.setFillColor(colors.white)
    canv.setFont("Body-B", 14)
    canv.drawString(MARGIN, H - 11 * mm, "SUGARLOOM PH  |  ALPHA TESTING QUESTIONNAIRE")
    canv.setFont("Body", 7.6)
    canv.setFillColor(colors.HexColor("#C9D4EA"))
    canv.drawString(MARGIN, H - 16 * mm,
                    "Web-Based Ordering, Sales, Inventory and Queue Management System  \u2022  "
                    "Evaluated against ISO/IEC 25010:2023")

    canv.setFont("Body", 7.6)
    canv.setFillColor(colors.HexColor("#C9D4EA"))
    canv.drawRightString(W - MARGIN, H - 11 * mm, "IT Professional Evaluation")
    canv.drawRightString(W - MARGIN, H - 16 * mm, "Confidential \u2014 for alpha testing use only")

    canv.setFillColor(GREY)
    canv.setFont("Body", 6.8)
    canv.drawString(MARGIN, 8 * mm,
        "SugarLoom Ph  \u2022  Ebbat, J.  \u2022  Florentino, J.  \u2022  Ronquillo, N.  \u2022  Villanueva, G.  "
        "\u2022  STI College Ortigas-Cainta")
    canv.setFillColor(NAVY_L)
    total = f" / {TOTAL['n']}" if TOTAL["n"] else ""
    canv.drawRightString(W - MARGIN, 8 * mm, f"Page {i}{total}")
    canv.setStrokeColor(RULE)
    canv.setLineWidth(0.4)
    canv.line(MARGIN, 11 * mm, W - MARGIN, 11 * mm)
    canv.restoreState()


def kv(rows, w1, w2, shade_first=True):
    data = [[P(a, "cellb"), P(b)] for a, b in rows]
    t = Table(data, colWidths=[w1, w2], hAlign="LEFT")
    cmds = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.4, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3.2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.2),
    ]
    if shade_first:
        cmds.append(("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F2F5FA")))
    t.setStyle(TableStyle(cmds))
    return t


def note_box(label, body, fill="#FFF6E5", edge="#E0B964", lw=30 * mm):
    t = Table([[P(f"<b>{label}</b>", "cellsm"), P(body, "cellsm")]],
              colWidths=[lw, CONTENT_W - lw], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(fill)),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor(edge)),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t


# ══ PAGE 1 ════════════════════════════════════════════════════════════
def cover():
    f = []
    f.append(Paragraph("SugarLoom Ph: A Web-Based Ordering, Sales, Inventory and Queue "
                       "Management System for a Home-Based Bakery", S["title"]))
    f.append(sp(2))
    f.append(Paragraph("Alpha Testing Questionnaire for Information Technology Professionals  \u2014  "
                       "revised to the system as built, October 2026", S["sub"]))
    f.append(sp(7))

    f.append(section_bar("PURPOSE AND INSTRUCTIONS", CONTENT_W))
    f.append(sp(3))
    f.append(kv([
        ("Purpose",
         "This questionnaire gathers the structured judgement of Information Technology professionals on the "
         "functionality, performance and quality of SugarLoom Ph before it is released for beta testing with the "
         "bakery's own staff and customers. Your findings determine whether the system is fit to proceed."),
        ("Who should answer",
         "Information Technology professionals with at least five years of professional experience in software "
         "development, quality assurance, systems analysis, or a closely related field."),
        ("How to answer",
         "<b>Part I</b> records your profile. <b>Part II</b> is a hands-on functionality test: perform each "
         "procedure in order, compare what happens with the expected result, then tick one of the three outcome "
         "boxes and note anything unexpected in Remarks. <b>Part III</b> rates the system against the nine quality "
         "characteristics of ISO/IEC 25010:2023; complete Part II first so each rating rests on what you actually "
         "observed. <b>Part IV</b> is for open comments. Please do not leave an item blank \u2014 if a procedure "
         "cannot be carried out, write the reason in Remarks."),
        ("Honesty",
         "Please report exactly what you observe. A system that passes testing only because defects went unrecorded "
         "fails later, in front of the people it was built for."),
    ], 36 * mm, CONTENT_W - 36 * mm))

    f.append(sp(5))
    f.append(note_box("NOTE ON SCOPE", SCOPE, lw=34 * mm))

    f.append(sp(6))
    f.append(section_bar("RATING SCALE AND INTERPRETATION  \u2022  used in Part III", CONTENT_W))
    f.append(sp(3))

    sc = [head_row(["Rating", "Mean range", "Verbal interpretation", "What it means for this system"])]
    meaning = [
        "The characteristic is fully satisfied. No change is needed before beta testing.",
        "The characteristic is satisfied with minor observations that should be addressed but do not block release.",
        "The characteristic is only partly satisfied. Revision is required before beta testing.",
        "The characteristic is not satisfied. The affected area must be reworked and retested.",
    ]
    for (r, rng, verb), m in zip(SCALE, meaning):
        sc.append([P(f"<b>{r}</b>", "cell"), P(rng), P(verb, "cellb"), P(m)])
    f.append(table(sc, [18 * mm, 32 * mm, 58 * mm, CONTENT_W - 108 * mm], align_centre=(0,)))

    f.append(PageBreak())

    # ── coverage map + access ──
    f.append(section_bar("WHAT IS EVALUATED  \u2022  ISO/IEC 25010:2023 coverage", CONTENT_W))
    f.append(sp(3))
    cv = [head_row(["Quality characteristic", "Sub-characteristics evaluated", "Item numbers"])]
    for a, b, c in COVERAGE:
        cv.append([P(a, "cellb"), P(b), P(c, "cellgrey")])
    f.append(table(cv, [48 * mm, CONTENT_W - 48 * mm - 32 * mm, 32 * mm]))

    f.append(sp(6))
    f.append(section_bar("TEST ACCESS, ACCOUNTS AND TEST DATA", CONTENT_W))
    f.append(sp(3))
    f.append(kv(ACCESS, 46 * mm, CONTENT_W - 46 * mm))

    f.append(sp(5))
    f.append(note_box("CAUTION",
        "Use only the test accounts and test data listed above. Never enter the details of a real customer and "
        "never send real money to the GCash account shown at checkout \u2014 the receipts used in testing are "
        "screenshots only. Return your completed questionnaire and your tester sheet to the research team at the "
        "end of the session.", fill="#FDECEC", edge="#D98A8A", lw=26 * mm))

    f.append(PageBreak())
    return f


# ══ PART I ════════════════════════════════════════════════════════════
def part1():
    f = [section_bar("PART I.  RESPONDENT'S PROFILE", CONTENT_W), sp(3)]
    f.append(Paragraph("Please complete the details below. Your name is optional; the research team identifies "
                       "responses by tester ID.", S["bodysm"]))
    f.append(sp(3))
    rows = []
    for label, val in PROFILE:
        rows.append([P(label, "cellb"), P(val if val else "&nbsp;")])
    t = Table(rows, colWidths=[72 * mm, CONTENT_W - 72 * mm], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.4, RULE),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F2F5FA")),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5.5),
    ]))
    f.append(t)
    f.append(sp(8))

    f.append(section_bar("HOW TO RECORD A PART II RESULT", CONTENT_W))
    f.append(sp(3))
    g = [head_row(["Outcome", "Tick this when"])]
    for a, b in [
        ("Works as Expected",
         "The system behaves exactly as the Expected Result describes, with no error and no workaround."),
        ("Works with Errors",
         "The task can be completed, but something is wrong along the way \u2014 a wrong figure, a confusing or "
         "missing message, a wrong label, a visual fault, or a step that needs a workaround. Describe it in "
         "Remarks."),
        ("Does Not Work",
         "The task cannot be completed, the system shows an error or blank page, or the result contradicts the "
         "Expected Result. Describe what happened in Remarks."),
    ]:
        g.append([P(a, "cellb"), P(b)])
    f.append(table(g, [40 * mm, CONTENT_W - 40 * mm]))
    f.append(PageBreak())
    return f


# ══ PART II ═══════════════════════════════════════════════════════════
P2_W = [17 * mm, 90 * mm, 75 * mm, 15.5 * mm, 15.5 * mm, 15.5 * mm, CONTENT_W - 228.5 * mm]


def part2():
    f = [section_bar("PART II.  FUNCTIONALITY TEST PROCEDURES", CONTENT_W), sp(3)]
    f.append(Paragraph("Perform each procedure in the order given, using the accounts and test data on page 2 and "
                       "on your tester sheet. Tick one outcome for every item. The reference under each number "
                       "points to the Part III item the result supports.", S["bodysm"]))
    f.append(sp(4))

    for gi, (title, items) in enumerate(PART2):
        if gi:
            f.append(sp(7))
        rows = [band_row(title, "", 7),
                head_row(["# / Ref.", "Test Procedure", "Expected Result",
                          "Works as Expected", "Works with Errors", "Does Not Work", "Remarks"])]
        for ref, steps, exp in items:
            rows.append([P(ref, "cellb"), P(steps), P(exp),
                         P(TICK, "tick"), P(TICK, "tick"), P(TICK, "tick"), P("")])
        f.append(table(rows, P2_W, zebra_from=2, align_centre=(3, 4, 5),
                       repeat=2, head_at=1, extra=BAND(6)))
    f.append(PageBreak())
    return f


# ══ PART III ══════════════════════════════════════════════════════════
P3_W = [14 * mm, 55 * mm, 84 * mm, 67 * mm, 20 * mm, CONTENT_W - 240 * mm]


def part3():
    f = [section_bar("PART III.  SOFTWARE QUALITY EVALUATION  \u2022  ISO/IEC 25010:2023", CONTENT_W), sp(3)]
    f.append(Paragraph("Rate each statement using the scale on page 1 \u2014 <b>4</b> Strongly Agree, <b>3</b> "
                       "Agree, <b>2</b> Disagree, <b>1</b> Strongly Disagree \u2014 by encircling one number in "
                       "the Rating column. Base every rating on what you observed while carrying out the procedure "
                       "beside it. A rating of 2 or 1 should be explained in Remarks.", S["bodysm"]))
    f.append(sp(4))

    for gi, (title, definition, items) in enumerate(PART3):
        if gi:
            f.append(sp(7))
        rows = [band_row(title, definition, 6),
                head_row(["Item", "Quality Statement", "Test Procedure", "Expected Result",
                          "Rating<br/>(encircle)", "Remarks"])]
        for iid, stmt, proc, exp in items:
            rows.append([P(iid, "cellb"), P(stmt), P(proc), P(exp),
                         P("4 &nbsp; 3<br/>2 &nbsp; 1", "tick"), P("")])
        f.append(table(rows, P3_W, zebra_from=2, align_centre=(4,),
                       repeat=2, head_at=1, extra=BAND(5)))
    f.append(PageBreak())
    return f


# ══ PART IV ═══════════════════════════════════════════════════════════
def part4():
    f = [section_bar("PART IV.  OVERALL FEEDBACK AND RECOMMENDATIONS", CONTENT_W), sp(3)]
    f.append(Paragraph("Please answer in your own words. Specific, reproducible observations are the most useful "
                       "to the proponents.", S["bodysm"]))
    f.append(sp(4))

    rows = []
    for q in FEEDBACK:
        rows.append([P(q, "cellb")])
        rows.append([P("<br/><br/><br/><br/><br/>")])
    t = Table(rows, colWidths=[CONTENT_W], hAlign="LEFT")
    cmds = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.4, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]
    for i in range(0, len(rows), 2):
        cmds.append(("BACKGROUND", (0, i), (-1, i), BAR))
    t.setStyle(TableStyle(cmds))
    f.append(t)

    f.append(sp(6))
    f.append(section_bar("OVERALL RECOMMENDATION", CONTENT_W))
    f.append(sp(3))
    rec = [head_row(["", "Recommendation", "Meaning"])]
    for a, b in [
        ("Accepted for beta testing",
         "The system is fit to be released to the bakery's staff and customers as it stands."),
        ("Accepted with minor revisions",
         "Release may proceed once the observations recorded above are addressed."),
        ("Requires major revisions",
         "The defects recorded above must be corrected and the affected items retested before release."),
        ("Not accepted",
         "The system is not fit for beta testing in its current state."),
    ]:
        rec.append([P(TICK, "tick"), P(a, "cellb"), P(b)])
    f.append(table(rec, [14 * mm, 62 * mm, CONTENT_W - 76 * mm], align_centre=(0,)))

    f.append(sp(8))
    sig = Table([
        [P("&nbsp;<br/>&nbsp;"), P("&nbsp;<br/>&nbsp;"), P("&nbsp;<br/>&nbsp;")],
        [P("Signature over printed name", "cellgrey"), P("Position / Designation", "cellgrey"),
         P("Date", "cellgrey")],
    ], colWidths=[CONTENT_W * 0.42, CONTENT_W * 0.33, CONTENT_W * 0.25], hAlign="LEFT")
    sig.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("LINEBELOW", (0, 0), (-1, 0), 0.6, colors.black),
        ("ALIGN", (0, 1), (-1, 1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 1), (-1, 1), 2),
    ]))
    f.append(sig)

    f.append(sp(8))
    f.append(Paragraph("Thank you for your time and expertise. Your evaluation directly shapes what the proponents "
                       "correct before SugarLoom Ph is placed in the hands of the bakery and its customers.",
                       S["italic"]))
    f.append(PageBreak())
    return f


# ══ RESEARCHER GUIDE ══════════════════════════════════════════════════
def guide():
    f = [section_bar("FOR THE RESEARCH TEAM  \u2022  scoring and interpretation", CONTENT_W), sp(3)]
    f.append(Paragraph("This page is not completed by the tester. Detach or omit it when the questionnaire is "
                       "distributed.", S["bodysm"]))
    f.append(sp(4))

    f.append(kv([
        ("Part II \u2014 functionality",
         "Count the outcomes for each item across all three testers. An item is <b>passed</b> only when every "
         "tester ticked Works as Expected. Any Works with Errors or Does Not Work is a defect to be logged with "
         "the tester ID, the item number and the Remarks text, then fixed and retested. Report the result as "
         "<i>items passed / total items</i> per section, not as a percentage of testers."),
        ("Part III \u2014 quality ratings",
         "Compute the mean rating per item, then the mean per quality characteristic, then the overall mean. "
         "Interpret each mean with the scale on page 1 (3.26\u20134.00 Excellent, 2.51\u20133.25 Very Good, "
         "1.76\u20132.50 Fair, 1.00\u20131.75 Poor). Report the per-characteristic means in a table alongside the "
         "overall weighted mean; with three evaluators, report the means but do not claim statistical significance."),
        ("Part IV \u2014 open feedback",
         "Group the written comments by theme, count how many testers raised each, and carry the recurring themes "
         "into the recommendations chapter. A theme raised by two of three testers deserves a named response in "
         "the write-up."),
        ("Traceability",
         "Every Part III item names the Part II procedures that support it, and every Part II item carries the "
         "Part III reference it feeds. Keep both numbering schemes unchanged when quoting results, so a reader can "
         "follow any claim back to the procedure that produced it."),
        ("Recording the session",
         "Collect the tester sheets with the questionnaires. Note the date, browser and device for each tester, "
         "and keep the exported CSV files and screenshots gathered during the session as evidence in the appendix."),
    ], 42 * mm, CONTENT_W - 42 * mm))

    f.append(sp(6))
    f.append(note_box("ALREADY KNOWN",
        "Before the session, confirm that <b>supabase-schema.sql</b>, <b>supabase-audit-log.sql</b> and "
        "<b>supabase-deleted-orders.sql</b> have been run on the project, and that the audit retention purge is "
        "scheduled. Tell every tester that email is not delivered (see the note on scope) so the same known "
        "limitation is not logged three times as a defect.", lw=30 * mm))
    return f


def story():
    return cover() + part1() + part2() + part3() + part4() + guide()


def build():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)

    def doc_for(path):
        d = BaseDocTemplate(path, pagesize=PAGE,
                            leftMargin=MARGIN, rightMargin=MARGIN,
                            topMargin=TOP, bottomMargin=BOT,
                            title="SugarLoom Ph \u2014 Alpha Testing Questionnaire",
                            author="Ebbat, Florentino, Ronquillo, Villanueva")
        d.addPageTemplates([PageTemplate(id="p",
                                         frames=[Frame(MARGIN, BOT, CONTENT_W, H - TOP - BOT, id="f")],
                                         onPage=banner_and_footer)])
        return d

    # first pass: learn the page count so the footer can say "Page n / m"
    tmp = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_count.pdf")
    d = doc_for(tmp)
    d.build(story())
    TOTAL["n"] = d.page
    os.remove(tmp)

    doc_for(OUT).build(story())
    print("written:", OUT, "pages:", TOTAL["n"])


if __name__ == "__main__":
    build()
