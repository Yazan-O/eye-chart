# Video plan: Eye Chart

The film itself is built and waits for the owner's approval. Its spec, storyboard and report are in `_runs/2026-10-26_film/` outside this repo (82 seconds, no music, voice and effects only). This file is the plan it follows, with the real numbers filled in.

- Length: 82 seconds. 1920x1080, 30 fps, MP4.
- Who watches: hackathon judges. The video is not scored, but judges watch it.
- Footage: real captures of the live site only, plus a small faceless robot guide drawn in code.
- Sound: no music. Voice and small real sound effects. One silence before the payoff.
- Every number on screen is read from `public/readings/latest.json`. None is typed in.

The one thing the viewer must know at the end: we tested the AI tester on widgets where the truth is known, and the site shows what it saw, what it missed and how a lens fixed it.

## Opening

Opening A, because the readings include a working twin that the agent failed.

- Shot 1 (0 to 4 s): the working Toast twin, full screen, a hand clicking Save. "Saved" shows, then fades. On screen: "This button works."
- Shot 2 (4 to 9 s): TestSprite's reading of that twin: failed. On screen, its own words: the Save button may not be invoking the toast state update.
- Voice: "This button works. You can see it work. The AI tester said it failed. So I gave it an eye exam."

(Opening B, "it read everything", is dropped: the agent did not read everything.)

## Shot list

| # | Time | Real capture | Words on screen | Sound |
|---|---|---|---|---|
| 1-2 | 0 to 9 s | Opening A | see above | room tone, one click |
| 3 | 9 to 16 s | The chart at the live URL, scroll from row 1 to row 7 | "24 widgets. 7 rows. Easy rows on top." | scroll tick per row |
| 4 | 16 to 26 s | One letter, working and broken twin side by side, a hand using each | "Every letter is built twice. One works. One is broken." | click on each twin |
| 5 | 26 to 36 s | TestSprite's reading of both twins, its reason, then the run id | "TestSprite's own words." | quiet |
| 6 | 36 to 50 s | The score and the misses | "39 of 48 read right. 4 misread. 5 blocked." | one soft tone per number |
| 7 | 50 to 52 s | Silence. The misread Toast held on screen | none | silence |
| 8 | 52 to 66 s | The lens: one added line on the left, the twin on the right, then the reading with the lens on | "One line of code. Same agent. Same widget. Passed." | click, then confirm tone |
| 9 | 66 to 76 s | The lens machine: seven lenses, five fixed their letter | "7 lenses. 5 fixed their letter." | one tone per lens |
| 10 | 76 to 82 s | The chart, final state, URL | "Eye Chart. yazan-o.github.io/eye-chart" | room tone out |

Optional beat if time allows: [pull request 1](https://github.com/Yazan-O/eye-chart/pull/1), the TestSprite check red three times, then green. The film lane dropped it to stay within four beats per 30 seconds.

## Voice-over

About 150 words. Caption every line.

1. "This button works. You can see it work. The AI tester said it failed. So I gave it an eye exam."
2. "I study how machines see. An eye exam is the oldest test there is: letters, row by row."
3. "So I built one for TestSprite's AI tester. Every letter is a real widget. And every letter is built twice."
4. "One twin works. One is broken, in a way you see in two seconds. So I know the right answer before the test runs."
5. "TestSprite's agent tests both. This is what it said, in its own words."
6. "It read thirty-nine of forty-eight right. It misread four. It could not test five."
7. (Silence.)
8. "For the Save button I wrote a lens. One line of code. It does not change what the button does. It gives the agent something it can read. Same agent. Same button. Now it passes."
9. "Seven lenses. Five fixed their letter."
10. "Eye Chart. Open it and read the chart yourself."

## Truth table

| Value | Source |
|---|---|
| 39 read right, 4 misread, 5 blocked, 48 twins, 24 widgets | `public/readings/latest.json`, results with variant `works` or `broken`, recounted 2026-10-26 |
| Toast working twin: failed, run `22f8d972-2606-42a8-afd1-9298b547a639` | same file |
| Toast with lens: passed, run `8c5d9bb5-c918-4452-8079-53afb24ab826` | same file |
| Lens is one added line | the Toast lens in `src/letters/registry.ts` |
| 7 lenses measured, 5 fixed their letter | same readings file, variants `lens` and `lens-broken` |
| Pull request 1: red 18/21, 20/21, 20/21, then green 21/21 | the check status on commits c92c58d, acbd202, af671fb and 0c48b66 |

## Build and checks

- Voice and effects are made in the film lane. Master to about -14 LUFS with a true peak at or below -1 dBTP.
- Before ship: a frame every three seconds with no cropped or unreadable text, every number matches the readings file, no music file in the mix.
- The draft X post is in `docs/WRITEUP.md`. The owner posts it.
