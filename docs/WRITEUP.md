---
title: I gave the AI tester an eye exam
published: false
description: A chart of real UI widgets, each built as a working twin and a broken twin, run through TestSprite's cloud agent to measure what it can and cannot see.
tags: testing, ai, hackathon, webdev
---

<!-- Drafting notes, delete before posting.
Every [X] is a number or name that does not exist yet. It comes from public/readings/latest.json or the portal, never from memory.
Opening A is for the case where the agent misreads a working widget. Opening B is for the case where it reads everything. Keep one.
The numbers section has an A and a B version too. -->

<!-- Opening A -->
There is a button on a page. A person clicks it and a panel opens. The agent clicks it, looks, and reports: [X: verdict] because [X: TestSprite's reason, verbatim].

The button works. Anyone with eyes can see that.

<!-- Opening B -->
We built [X] ways to blind an AI tester. We expected it to miss some. It read [X] of [X].

<!-- Both -->
I study how machines see. So I gave the AI tester an eye exam.

## The chart

An eye chart has rows of letters. Row one is large and easy. Each row down is smaller and harder. You read until you cannot.

Eye Chart works the same way, with UI widgets as the letters. Row 1 is plain buttons and links. Higher rows add motion, controls that only appear on hover, shadow DOM, canvas, WebGL and real-time play.

Every letter is built twice:
- the **works** twin does what it says;
- the **broken** twin looks fine and is broken in a way a person sees in two seconds.

So the truth is known before any test runs. TestSprite's cloud agent tests each twin. A reading is correct when a working widget passes and a broken one fails. The site shows every reading with TestSprite's own reason, word for word, and the run id.

Live: [X: URL]. Code: https://github.com/Yazan-O/eye-chart

## What the chart measured

<!-- Version A: misreads exist -->
The agent read [X] of [X] twins correctly. It misread [X].

| Row | What the row adds | Read correctly |
|---|---|---|
| [X] | [X] | [X] of [X] |

[X: the pattern, in one plain sentence. Example shape: "It was reliable until the page drew its own pixels, then it lost the widget."]

[X] runs came back blocked, not failed. I count them on their own line, because "could not tell" is not the same as "got it wrong".

<!-- Version B: reads everything -->
Across [X] widgets in [X] rows, the agent read [X] of [X] correctly, including [X: the hardest row]. That is a result too: [X: what it says about where to spend test effort].

## One lens, before and after

A lens is a small code change that gives the agent something it can read. It does not change what the widget does.

The letter: [X: name]. The trap: [X: what is hard to see].

**Before.** The agent said [X: verdict] and gave this reason: "[X: verbatim]". Run `[X: run id]`.

**The lens.** [X: number] lines. [X: one plain sentence on what it adds, for example a label, a text mirror or a state attribute].

```diff
[X: the real diff from src/letters/registry.ts]
```

**After.** Same agent, same twin, lens on. Verdict: [X]. Reason: "[X: verbatim]". Run `[X: run id]`.

The reading was taken again after the change. The site shows both runs side by side.

## How it is wired into shipping

Two TestSprite projects, two jobs.

**The site suite** tests the chart site. The TestSprite GitHub App runs it on every PR against the preview deploy. It is a required check, so a red one holds the merge. [X: suite size, last run].

**The calibration** tests the twins. A GitHub Action runs `testsprite ci run` on every PR and commits the readings to `public/readings/`. It never holds the merge. Its job is different: it re-examines the agent. If TestSprite ships a new agent tomorrow, the next PR shows whether it reads better or worse, and the diff is in the commit.

The PR that proves it: [X: PR link]. It went red at [X] of [X] on [X: real bug] and green at [X] of [X] after [X: fix].

## One limit

A reading is one run of one agent on one date. [X] runs per twin, because the calibration had a credit budget of [X]. Agents vary from run to run, so the chart is a measurement, not a ranking. The run ids are there so you can repeat any reading yourself.

## What came before

- "Are Autonomous Web Agents Good Testers?" by Chevrot and colleagues, [arXiv 2504.01495](https://arxiv.org/abs/2504.01495), asks whether web agents can run test cases and report correct verdicts on real applications.
- The [testers.ai leaderboard](https://testers.ai/leaderboard.html) ranks models on finding bugs seeded into a few AI-made pages.
- ST-WebAgentBench by Levy and colleagues, [arXiv 2410.06703](https://arxiv.org/abs/2410.06703), measures web agents on enterprise tasks, scoring safety and trust as well as completion.

Those measure how good an agent is. This measures what it can see, one widget type at a time, with the answer known in advance, and then fixes the page so the agent can see it. It also runs inside the shipping loop, so the measurement is redone on every PR.

## Try it

Open the chart, pick a letter, use the working twin and the broken twin yourself, and compare with the reading. Sixty seconds.

---

## Posts for X

**Single post** (under 280 characters):

```
I study how machines see. So I gave TestSprite's AI tester an eye exam: [X] real UI widgets, each with a working twin and a broken twin. It read [X] of [X] right. The chart, the run ids and the fixes: [X: URL]
```

**Thread of three**

```
1/ I study how machines see. So I gave the AI tester an eye exam. [X] UI widgets, each built twice: one works, one is visibly broken. TestSprite's cloud agent tested all of them. [X: URL]
```

```
2/ It read [X] of [X] correctly. The misses: [X]. Every verdict on the site shows TestSprite's own reason, word for word, with the run id.
```

```
3/ For each miss I wrote a lens, a few lines of code, and ran the exam again with it on. [X: before] to [X: after]. The exam reruns on every PR, so it stays honest. Code: github.com/Yazan-O/eye-chart
```
