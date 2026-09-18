const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  LevelFormat, convertInchesToTwip, ExternalHyperlink
} = require("docx");
const fs = require("fs");

const W = 9026;                       // A4 content width in DXA
const ACCENT = "C2410C";
const INK = "1F2937";
const GREY = "6B7280";
const RULE = { color: "D1D5DB", space: 1, style: BorderStyle.SINGLE, size: 6 };

const P = (text, opts = {}) => new Paragraph({
  spacing: { after: opts.after ?? 140, line: 276 },
  alignment: opts.align,
  border: opts.border,
  indent: opts.indent,
  children: [new TextRun({
    text, size: opts.size ?? 21, color: opts.color ?? INK,
    bold: opts.bold, italics: opts.italics, font: opts.font
  })]
});

// A paragraph mixing bold lead-in with normal text.
const PR = (runs, opts = {}) => new Paragraph({
  spacing: { after: opts.after ?? 140, line: 276 },
  indent: opts.indent,
  children: runs.map(r => typeof r === "string"
    ? new TextRun({ text: r, size: 21, color: INK })
    : new TextRun({ text: r.t, size: 21, color: r.color ?? INK, bold: r.b, italics: r.i, font: r.font }))
});

const H1 = text => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 360, after: 160 },
  children: [new TextRun({ text, size: 28, bold: true, color: INK })]
});
const H2 = text => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 240, after: 120 },
  children: [new TextRun({ text, size: 23, bold: true, color: ACCENT })]
});

const BULLET = (text, opts = {}) => new Paragraph({
  numbering: { reference: "bul", level: 0 },
  spacing: { after: 90, line: 276 },
  children: [new TextRun({ text, size: 21, color: INK, bold: opts.bold })]
});
const BULLET_R = runs => new Paragraph({
  numbering: { reference: "bul", level: 0 },
  spacing: { after: 90, line: 276 },
  children: runs.map(r => typeof r === "string"
    ? new TextRun({ text: r, size: 21, color: INK })
    : new TextRun({ text: r.t, size: 21, color: r.color ?? INK, bold: r.b, italics: r.i, font: r.font }))
});
const NUM = runs => new Paragraph({
  numbering: { reference: "num", level: 0 },
  spacing: { after: 90, line: 276 },
  children: runs.map(r => typeof r === "string"
    ? new TextRun({ text: r, size: 21, color: INK })
    : new TextRun({ text: r.t, size: 21, color: r.color ?? INK, bold: r.b, italics: r.i, font: r.font }))
});

const cell = (children, w, opts = {}) => new TableCell({
  width: { size: w, type: WidthType.DXA },
  shading: opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill, color: "auto" } : undefined,
  margins: { top: 80, bottom: 80, left: 110, right: 110 },
  children
});
const th = (text, w) => cell([new Paragraph({
  spacing: { after: 0 },
  children: [new TextRun({ text, size: 18, bold: true, color: "FFFFFF" })]
})], w, { fill: "374151" });
const td = (text, w, opts = {}) => cell([new Paragraph({
  spacing: { after: 0, line: 260 },
  children: [new TextRun({ text, size: 19, color: INK, bold: opts.bold, font: opts.font })]
})], w, { fill: opts.fill });

const table = (widths, header, rows) => new Table({
  columnWidths: widths,
  width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
  rows: [
    new TableRow({ tableHeader: true, children: header.map((t, i) => th(t, widths[i])) }),
    ...rows.map((r, ri) => new TableRow({
      children: r.map((t, i) => td(t, widths[i], {
        fill: ri % 2 ? "F3F4F6" : undefined,
        bold: i === 0 && widths.length > 2,
        font: r.mono && i === 0 ? "Consolas" : undefined
      }))
    }))
  ]
});
const SPACER = () => new Paragraph({ spacing: { after: 180 }, children: [] });

const doc = new Document({
  creator: "Anant Raj",
  title: "Adaptive Practice Chatbot: How It Works and Why",
  description: "Design note for the adaptive MCQ practice chatbot built on the EV Engineering Handbook.",
  styles: { default: { document: { run: { font: "Calibri", size: 21, color: INK } } } },
  numbering: {
    config: [
      { reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: convertInchesToTwip(0.3), hanging: convertInchesToTwip(0.18) } } } }] },
      { reference: "num", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: convertInchesToTwip(0.32), hanging: convertInchesToTwip(0.2) } } } }] }
    ]
  },
  sections: [{
    properties: { page: { margin: { top: 1300, bottom: 1300, left: 1440, right: 1440 } } },
    children: [

      /* ---------------- cover block ---------------- */
      P("PRODUCT DESIGN NOTE", { size: 17, color: ACCENT, bold: true, after: 90 }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: "Adaptive Practice Chatbot", size: 44, bold: true, color: INK })]
      }),
      P("An MCQ drill that writes its own questions from a body of master content and adjusts difficulty to the candidate as they answer.",
        { size: 23, color: GREY, after: 160 }),
      new Paragraph({
        spacing: { after: 260 },
        border: { bottom: RULE },
        children: [new TextRun({ text: "Prepared 18 September 2026  |  Working prototype, built on the EV Engineering Handbook", size: 18, color: GREY })]
      }),

      /* ---------------- 1 ---------------- */
      H1("1. The problem this solves"),
      P("Learners on a technical programme have no cheap way to find out what they do not know. Reading a handbook front to back produces a feeling of understanding that collapses the first time someone asks a question in a design review. A fixed question bank does not fix this either. Once a learner has been through it twice, they are recalling the bank rather than the subject, and the score stops telling anyone anything."),
      P("There is a second problem on our side. Writing good questions is slow. A 21-question set at mixed difficulty, properly grounded in source material, is most of a day's work for a subject expert. Multiply that by every programme and every refresh cycle and it does not get done."),
      PR([
        { t: "What the chatbot does about it. ", b: true },
        "It takes the master content we already own, generates questions from it at the moment the learner reaches them, and moves the difficulty up or down based on how the learner is actually doing. Every round is a new set. The cost of the twenty-second question set is the same as the cost of the first."
      ], { after: 180 }),

      /* ---------------- 2 ---------------- */
      H1("2. What the learner experiences"),
      P("A round is 21 multiple-choice questions, four options each, delivered one at a time. The learner answers, sees immediately whether they were right along with a one-line explanation that cites the handbook subsection, and moves on. They cannot go back. The round ends with a report on where they are strong and where they are not, and they can start another round straight away."),
      P("Three things are visible on screen throughout the round, because the learner should understand the machine they are being measured by:", { after: 110 }),
      BULLET_R([{ t: "Position. ", b: true }, "Question 7 of 21."]),
      BULLET_R([{ t: "Current level. ", b: true }, "A five-rung ladder with the active rung lit, labelled with the level name."]),
      BULLET_R([{ t: "Streak. ", b: true }, "Three dots that fill as correct answers accumulate, so the learner can see a promotion coming."]),
      P("Hiding the adaptive logic would make the test feel arbitrary. Showing it turns the difficulty ladder into something the learner is trying to climb, which is the behaviour we want.", { after: 180 }),

      /* ---------------- 3 ---------------- */
      H1("3. The difficulty ladder"),
      P("Five levels, defined by the kind of thinking each demands rather than by how obscure the fact is. This distinction matters. A hard question is not a more trivial piece of trivia, it is a question that asks the learner to do more with what they know.", { after: 140 }),
      table([720, 1500, 6806],
        ["Level", "Name", "What the question asks the learner to do"],
        [
          ["L1", "Recall", "Return a single stated fact, definition, full form or figure."],
          ["L2", "Compare", "Distinguish two concepts, or identify what separates one option from its neighbours."],
          ["L3", "Apply", "Apply a stated rule, ratio or rule of thumb to a short concrete scenario."],
          ["L4", "Analyse", "Work a two or three step calculation, or diagnose a root cause from described symptoms."],
          ["L5", "Judge", "Make a design-review trade-off across subsystems, or a compliance call under stated constraints."]
        ]),
      SPACER(),
      P("On the EV handbook, L4 draws heavily on the worked calculations in Section 12 and the failure-mode table in Section 11. L5 pulls from the trade-off passages, for example choosing a cell chemistry for an Indian three-wheeler fleet where the source argues a specific answer. L5 is the level where question quality is hardest to guarantee, because more than one option can usually be defended.", { after: 180 }),

      /* ---------------- 4 ---------------- */
      H1("4. How the difficulty adapts"),
      P("The learner starts at L2 rather than L1. Opening at the easiest level wastes questions on anyone competent, and 21 questions is not a generous budget. L2 is low enough not to intimidate and high enough to be informative.", { after: 140 }),
      table([2600, 6426],
        ["Event", "Effect"],
        [
          ["Three correct in a row", "Promote one level, and open a three-question probation window"],
          ["A miss inside the probation window", "Revert one level"],
          ["Two misses in a row outside probation", "Ease one level"],
          ["Any single miss", "Streak resets to zero"],
          ["L1 and L5", "Floor and ceiling"]
        ]),
      SPACER(),
      H2("Why the probation window exists"),
      P("The brief called for promotion on three correct answers, and reversion if a mistake appears in the next three. The probation window is that rule implemented literally. It answers a real question about what a promotion means: a learner who scrapes past three questions has shown promise, not mastery, so the level above is granted provisionally and taken back at the first sign it was premature."),
      H2("Why I added a second way down"),
      P("The brief as written has only one path downward, and it closes three questions after a promotion. A learner who reaches L4 and then misses four in a row would sit at L4 for the rest of the round, burning questions at a level they cannot hold and learning nothing from any of them. The two-misses rule gives the ladder a floor-seeking behaviour it otherwise lacks."),
      PR([{ t: "This is an addition to the specification and should be reviewed. ", b: true },
          "Reverting the app to the literal brief is a four-line change if you would rather test the original rule first."], { after: 150 }),
      H2("A worked trace"),
      P("Reading a round where the learner answers correct, correct, correct, correct, correct, correct, miss:", { after: 110 }),
      table([1400, 1100, 6526],
        ["Answer", "Level", "What happened"],
        [
          ["Correct", "L2", "Streak 1"],
          ["Correct", "L2", "Streak 2"],
          ["Correct", "L3", "Three in a row. Promoted, probation open for three questions"],
          ["Correct", "L3", "Streak 1, one probation question used"],
          ["Correct", "L3", "Streak 2"],
          ["Correct", "L4", "Three in a row. Promoted again, fresh probation"],
          ["Miss", "L3", "Missed inside probation. Reverted"]
        ]),
      SPACER(),
      P("The engine was tested against this and six other sequences, including the floor at L1, the ceiling at L5, and alternating right and wrong answers, which correctly produces no level change at all.", { after: 180 }),

      /* ---------------- 5 ---------------- */
      H1("5. Why questions are written live"),
      P("The obvious build is a stored bank of questions tagged by topic and difficulty. I did not build that as the primary mechanism, for three reasons."),
      NUM([{ t: "Retakes have to stay honest. ", b: true }, "The brief asks for unlimited retakes. A bank large enough to survive repeated attempts is a bank nobody will finish writing. Generated questions make the tenth attempt as diagnostic as the first."]),
      NUM([{ t: "The difficulty ladder needs depth at every rung. ", b: true }, "An adaptive test needs a supply of questions at whatever level the learner lands on, in whatever topic comes next. A bank needs full coverage of every level and topic combination before the adaptive logic works at all. Generation supplies the cell on demand."]),
      NUM([{ t: "Content changes. ", b: true }, "When the handbook is revised, a stored bank has to be audited question by question. Generated questions follow the source automatically."]),
      P("The cost is that question quality is not pre-verified. That is a real trade-off and Section 9 treats it as an open risk rather than a solved problem.", { after: 180 }),

      /* ---------------- 6 ---------------- */
      H1("6. How the content keeps the questions honest"),
      P("Ungrounded generation would produce questions about electric vehicles in general. That is not the same thing as questions about our programme, and a learner who is marked wrong on material we never taught will stop trusting the tool immediately."),
      P("So the handbook is split into 12 sections, one per numbered chapter. When the learner reaches a question, exactly one section is sent along with the difficulty instruction, and the instruction states that the question and its correct answer must be verifiable from that text alone, with no outside knowledge and no invented numbers. The explanation has to cite the subsection, which is both useful to the learner and a check on us: an explanation that cannot name where it came from is a signal the question drifted.", { after: 140 }),
      table([2400, 6626],
        ["Choice", "Reason"],
        [
          ["One section per question, not the whole handbook", "Keeps every prompt well inside the size limit, and forces topical focus rather than vague cross-chapter questions"],
          ["Topics rotate through a shuffled order", "All 12 sections appear in the first 12 questions, so no round can accidentally skip the battery chapter"],
          ["Recent question stems are passed back in", "Prevents the same question being asked twice inside one round"],
          ["Answer options are shuffled after generation", "Removes position bias, since generated answers cluster at option A"],
          ["Glossary and front matter are excluded", "Section 13 is a list of abbreviations. Questions from it are trivia, not engineering"]
        ]),
      SPACER(),

      /* ---------------- 7 ---------------- */
      H1("7. The end-of-round report"),
      P("The score alone is close to useless. A learner who gets 14 of 21 needs to know which 7 and why. The report has four parts:", { after: 110 }),
      BULLET_R([{ t: "Headline numbers. ", b: true }, "Score, peak level reached, the highest level where the learner stayed above 60 percent, and time per question."]),
      BULLET_R([{ t: "Topic breakdown. ", b: true }, "Every section that appeared, sorted weakest first, with the specific concepts missed named rather than just a percentage."]),
      BULLET_R([{ t: "Performance by difficulty. ", b: true }, "Questions asked and answered correctly at each level, which shows where the learner's ceiling actually sits."]),
      BULLET_R([{ t: "A study plan. ", b: true }, "Five items at most, naming two topics to re-read and one to leave for later. Telling someone to revise nine topics is the same as telling them nothing."]),
      P("Peak level and held level are reported separately on purpose. Touching L4 once is not the same as working comfortably at L4, and a report that conflates the two flatters the learner.", { after: 140 }),
      PR([{ t: "One deliberate limitation. ", b: true },
          "Twenty-one questions across twelve topics means most topics get one or two questions. A verdict drawn from a single question is noise, so the strong and weak labels are suppressed below two questions and the report says so. Per-topic results are directional, not diagnostic."], { after: 180 }),

      /* ---------------- 8 ---------------- */
      H1("8. What happens when generation fails"),
      P("Question generation runs on the viewer's own Claude account and asks their permission on the first question. It can fail: permission declined, rate limits, a malformed response, no access at all."),
      P("A drill that stops mid-round is worse than a slightly weaker question, so the app carries 31 hand-written questions drawn from the handbook and verified against it. When live generation is unavailable, the round continues from that bank and tells the learner it has done so. The learner always finishes the round.", { after: 180 }),

      /* ---------------- 9 ---------------- */
      H1("9. Assumptions to pressure-test before this goes to learners"),
      NUM([{ t: "Question quality at scale is unverified. ", b: true }, "The 31 bank questions were checked by hand against the handbook. Generated questions are grounded by construction but nothing validates them before a learner sees them. Run several rounds and read every question, paying particular attention to L5, where a single defensible answer is hardest to guarantee."]),
      NUM([{ t: "The second demotion rule is mine, not the brief's. ", b: true }, "Decide whether you want it before this is tested on real candidates."]),
      NUM([{ t: "Twenty-one questions may be the wrong number for twelve topics. ", b: true }, "If you want per-topic verdicts you can act on, either narrow the content to five or six topics or raise the question count. Twenty-one across twelve gives breadth at the cost of confidence."]),
      NUM([{ t: "Starting at L2 assumes a prepared learner. ", b: true }, "For a cold cohort with no prior exposure, L1 may be the better opening rung. This is a one-line change and worth an A/B."]),
      NUM([{ t: "Generation runs on the learner's account. ", b: true }, "Fine for internal testing. If this ships to a paying cohort, confirm who bears that cost and whether every learner will have access."]),
      NUM([{ t: "Scores are stored in the learner's browser only. ", b: true }, "Nothing reaches us. That is the right default for a practice tool and the wrong one if you want cohort-level analytics, which would need a deliberate decision about data collection."]),

      /* ---------------- 10 ---------------- */
      H1("10. Pointing it at different content"),
      P("The EV handbook is an input, not a dependency. Reusing the engine for another programme takes four steps:", { after: 110 }),
      NUM(["Replace the source file. The splitter keys on numbered chapter headings, so the new content needs that structure."]),
      NUM(["Rewrite the fallback bank for the new subject. A stale bank will ask electric vehicle questions to a hydrogen cohort, so this step cannot be skipped."]),
      NUM(["Update the title, the content name on the start screen, and one reference to Section 12 in the study-plan text."]),
      NUM(["Run the build and republish. The build fails deliberately if any single section grows past the prompt size limit, which is the real constraint on how large a chapter can get."]),
      P("The difficulty ladder, the adaptive rule, the report and the fallback logic all carry over untouched.", { after: 180 }),

      /* ---------------- 11 ---------------- */
      H1("11. Where it lives"),
      table([2000, 7026],
        ["Item", "Location"],
        [
          ["Working app", "claude.ai/artifact/3hsaP4YTkLwc572XL32FmR"],
          ["Source code", "github.com/anantraj421-lab/experimentations, under practice-chatbot"],
          ["Master content", "practice-chatbot/content/ev-engineering-handbook.md"],
          ["Adaptive engine", "practice-chatbot/src/template.html, function applyResult"],
          ["Fallback bank", "practice-chatbot/src/seed.py"],
          ["Build", "python3 src/build.py, no dependencies beyond Python 3"]
        ]),
      SPACER(),
      new Paragraph({
        spacing: { before: 200 },
        border: { top: RULE },
        children: [new TextRun({
          text: "Prototype status. This is a working build, not a shipped product. It has been tested end to end, including a full 21-question round, the adaptive engine against seven answer sequences, and the layout at phone width. It has not been tested with a real learner.",
          size: 18, color: GREY, italics: true
        })]
      })
    ]
  }]
});

Packer.toBuffer(doc).then(b => {
  fs.writeFileSync("/home/user/experimentations/practice-chatbot/docs/Adaptive-Practice-Chatbot-Design-Note.docx", b);
  console.log("written", b.length, "bytes");
});
