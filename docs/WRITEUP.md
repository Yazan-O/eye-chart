---
title: I gave the AI tester an eye exam
published: false
description: 24 real UI widgets, each built as a working twin and a broken twin, read by TestSprite's cloud agent. 39 of 48 twins read right, and a one-line fix turned a misread into a pass.
tags: testing, ai, hackathon, webdev
---

There is a Save button on a page. You click it. A notice says "Saved" for a second and a half, then fades.

TestSprite's cloud agent clicked it and reported a failure. Its guess was that the Save button might not be invoking the toast state update.

The button works. Anyone with eyes can see that.

I study how machines see. So I gave the AI tester an eye exam.

## The chart

An eye chart has rows of letters. Row one is large and easy. Each row down is harder. You read until you cannot.

Eye Chart works the same way, with UI widgets as the letters. There are 24 letters in 7 rows. Row 1 is a plain counter. Higher rows add timing, hover-only menus, invisible layers, closed shadow roots, pixels drawn on a canvas, and planted hidden text.

Every letter is built twice:
- the **working** twin does what it says;
- the **broken** twin looks fine and is broken in a way a person sees in two seconds.

So the truth is known before any test runs. TestSprite's cloud agent tests each twin. A reading is correct when a working twin passes and a broken twin fails. The site shows every reading with TestSprite's own reason, word for word, and the run id.

Live: https://yazan-o.github.io/eye-chart/ and the code: https://github.com/Yazan-O/eye-chart

## What the chart measured

48 twin readings, 24 letters, TestSprite CLI 0.15.0, 2026-10-26.

| Result | Twins |
|---|---|
| Read correctly | 39 |
| Misread | 4 |
| Blocked (the agent could not test it) | 5 |

Blocked is not the same as wrong, so I count it on its own line.

The strong side first. The agent read every plain widget, every closed shadow form, every widget hiding its answer in a frame, and every one of the five hidden-text letters. In those, the broken twin carries a planted note, for example a hidden line telling AI testers the form works. The agent ignored all of them. All 10 twins in row 7 were read correctly.

Where it lost the page:
- **Timing.** The working Toast was failed. The "Saved" notice lives for 1.5 seconds.
- **Long lists.** The working Virtual list was failed. Only the rows in view exist in the page.
- **Invisible layers and key-by-key input.** The broken Consent scrim and the broken Autocomplete were passed, so the agent called a broken page fine.
- **Hover and pixels.** The working Hover menu was blocked, and so were both twins of the Canvas slider and the WebGL knob. The agent could not open the menu or drag a control drawn as pixels.

## One lens, before and after

A lens is a small code change that gives the agent something it can read. It does not change what the widget does.

The letter: Toast. The trap: the confirmation is gone after 1.5 seconds, so a later check finds nothing.

**Before.** The working twin read as a failure. Run `22f8d972-2606-42a8-afd1-9298b547a639`.

**The lens.** One added line. After the notice fades, the status region keeps "Saved" as text that is hidden from the eye but present in the page.

```diff
   <div className="letter-toast-slot" role="status">
     {shown ? <span className="letter-toast">Saved</span> : null}
+    {saved && !shown ? <span className="letter-sr">Saved</span> : null}
   </div>
```

**After.** Same agent, same widget, lens on. Verdict: passed. Its reason: "A 'Saved' notice appears after clicking Save." Run `8c5d9bb5-c918-4452-8079-53afb24ab826`.

I measured 7 lenses. Five fixed their letter: Toast, Hover menu, Virtual list, Canvas slider and WebGL knob. Two did not: the Autocomplete and Consent scrim lenses leave TestSprite still passing the broken twin. I report that rather than hide it. The site shows all seven, before and after.

## How it is wired into shipping

Two TestSprite projects, two jobs.

**The site suite** is 21 tests in the portal project "Eye Chart site", planned from the product requirements in `docs/PRD.md`. The TestSprite GitHub App runs it on every pull request against that PR's preview deploy, and `main` requires the "TestSprite V3" check, so a red check holds the merge.

**The calibration** is the eye exam. A GitHub Action re-reads five headline twins on every PR preview. It never holds the merge, because a misread there is a finding about the tester, not a bug in the site. If TestSprite ships a new agent tomorrow, the next PR shows whether it reads better or worse.

The proof is [pull request 1](https://github.com/Yazan-O/eye-chart/pull/1). The check ran red three times: 18 of 21, then 20 of 21, then 20 of 21. Then it ran green, 21 of 21, and the merge went through.

## One limit

A reading is one run of one agent on one date. Agents vary from run to run, so the chart is a measurement, not a ranking, and the run ids are there so you can repeat any reading.

A correct verdict is also not always a correct reason. The broken Hidden note twin was failed, which is right, but the agent's stated reason blamed a server error, not the planted note. The verdict is what the chart scores. The reason is on the page for you to read.

## What came before

- "Are Autonomous Web Agents Good Testers?" by Chevrot and colleagues, [arXiv 2504.01495](https://arxiv.org/abs/2504.01495), asks whether web agents can run test cases and report correct verdicts on real applications.
- The [testers.ai leaderboard](https://testers.ai/leaderboard.html) ranks models on finding bugs seeded into a few AI-made pages.
- ST-WebAgentBench by Levy and colleagues, [arXiv 2410.06703](https://arxiv.org/abs/2410.06703), measures web agents on enterprise tasks, scoring safety and trust as well as completion.

Those measure how good an agent is. This measures what it can see, one widget type at a time, with the answer known in advance, and then changes the page so the agent can see it. It also runs inside the shipping loop, so a slice of the measurement is redone on every PR.

## Try it

Open the chart, pick a letter, use the working twin and the broken twin yourself, and compare with the reading. Sixty seconds.

---

## Posts for X

**Single post** (under 280 characters):

```
I study how machines see. So I gave TestSprite's AI tester an eye exam: 24 real UI widgets, each with a working twin and a broken twin. It read 39 of 48 right. The chart, the run ids and the fixes: https://yazan-o.github.io/eye-chart/
```

**Thread of three**

```
1/ I study how machines see. So I gave the AI tester an eye exam. 24 UI widgets, each built twice: one works, one is visibly broken. TestSprite's cloud agent tested all 48 twins. https://yazan-o.github.io/eye-chart/
```

```
2/ It read 39 right, misread 4, and could not test 5. It ignored every planted "this form works" note. It failed a Save button that works, because the notice fades after 1.5 seconds. Every verdict shows TestSprite's own reason and run id.
```

```
3/ For the Save button I wrote a lens: one added line of code. Same agent, same widget, now it passes. 5 of 7 lenses fixed their letter. The exam also reruns on PRs. Code: github.com/Yazan-O/eye-chart
```
