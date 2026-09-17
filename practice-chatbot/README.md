# Adaptive practice chatbot

An MCQ drill that writes its own questions from a body of master content, adapts
difficulty to the candidate as they go, and ends with a strengths and gaps report.

Live version: https://claude.ai/artifact/3hsaP4YTkLwc572XL32FmR

## What it does

- 21 questions per round, one at a time, no going back once answered.
- Five difficulty levels: Recall, Compare, Apply, Analyse, Judge.
- Questions are written at the moment the candidate reaches them, from one
  section of the master content. Nothing outside that text is used.
- The round ends with per-topic scores, accuracy by difficulty level, and a
  short study plan.
- Unlimited retakes. Each round draws fresh questions, so a repeat is a new test
  rather than a memory check.

## The adaptive rule

Start at L2.

| Event | Effect |
| --- | --- |
| Three correct in a row | Promote one level, and open a three-question probation window |
| A miss inside the probation window | Revert one level |
| Two misses in a row outside probation | Ease one level |
| L1 / L5 | Floor and ceiling |

The brief specified promotion on three correct and reversion on a miss in the
following three. The two-misses rule outside probation is an addition: without
it a candidate who reaches a level they cannot hold has no way back down.

## Repository layout

```
content/ev-engineering-handbook.md   master content (the source of truth)
src/template.html                    the app, with two injection points
src/seed.py                          fallback question bank, written by hand from the handbook
src/build.py                         chunks the content and writes dist/
dist/ev-drill.html                   self-contained build, this is what gets published
```

Build with `python3 src/build.py`. No dependencies beyond Python 3.

## Swapping in different master content

1. Replace `content/ev-engineering-handbook.md`. The chunker splits on numbered
   `## ` headings, so the new file needs the same shape. Sections listed in
   `SKIP_SECTIONS` are excluded from question generation.
2. Rewrite `src/seed.py` for the new subject. The bank only runs when live
   generation is unavailable, but a stale bank will ask questions about the
   wrong subject, so it cannot be left as is.
3. Update the title, the handbook name on the start screen, and the Section 12
   reference in `buildPlan`, all in `src/template.html`.
4. Run the build and republish.

Each section is prompted on its own. `build.py` fails the build if any section
exceeds the 64 KiB per-call prompt cap, which is the real limit on how large a
single section may grow.

## Generation and fallback

Questions come from the artifact `sample` capability, which runs on the viewer's
own Claude account and asks their consent on the first call. When that is
unavailable, declined, rate limited, or returns malformed output, the round
continues from the built-in bank and tells the candidate so. The round never
stalls on a failed call.

Scores are kept in the viewer's browser only. Nothing is sent anywhere or read
back.
