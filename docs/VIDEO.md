# Video plan: Eye Chart

Draft for step 4 of the film workflow (storyline). The owner approves the idea, the storyline and the storyboard before anything is built. Nothing here is built yet.

- Length: 60 to 90 seconds. 1920x1080, 30 fps, MP4.
- Who watches: hackathon judges. Video is not scored, but judges watch it.
- Footage: real screen captures of the live site only. No generated footage, no mock-ups, no characters.
- Sound: no music. Voice-over, plus the small real sounds of clicks and page changes. One silence before the payoff.
- Every number on screen is read from `public/readings/latest.json` at build time. No number is typed into the film.

The one thing the viewer must know at the end: we tested the AI tester on widgets where the truth is known, and the site shows what it saw and what it missed.

## Two openings

The first 3 seconds are chosen after the readings exist. Both openings share everything from shot 3 on.

### Opening A: the agent misreads a working widget

Use when the readings include a working twin that the agent failed.

- Shot 1 (0 to 4 s): the working twin of [X: letter], full screen. A hand-driven capture of the widget doing its job. On screen: "This button works."
- Shot 2 (4 to 9 s): the reading panel for that twin. On screen, in TestSprite's words: "[X: verbatim reason]". Verdict: [X].
- Voice: "This widget works. You can see it work. The AI tester said it failed. So I gave it an eye exam."

### Opening B: it reads everything

Use when the readings show the agent read every twin correctly.

- Shot 1 (0 to 4 s): the chart, row by row, filling in green as the readings load. On screen: "[X] ways to blind an AI tester."
- Shot 2 (4 to 9 s): the full chart held still. On screen: "It read [X] of [X]."
- Voice: "I tried [X] ways to blind an AI tester. It read [X] of them. So I looked for the edge."

## Shot list (shared body)

| # | Time | Real capture | Words on screen | Sound |
|---|---|---|---|---|
| 1-2 | 0 to 9 s | Opening A or B | see above | room tone, one click |
| 3 | 9 to 16 s | The chart at the live URL, scroll from row 1 down to the last row | "An eye chart for AI testers. Easy rows on top." | scroll tick per row |
| 4 | 16 to 26 s | One letter: works twin and broken twin side by side, a hand using each | "Every letter is built twice. One works. One is broken." | click on each twin |
| 5 | 26 to 36 s | The agent's reading for both twins, with TestSprite's reason, then the run id | "TestSprite's cloud agent tests both. Its reason, word for word." | quiet |
| 6 | 36 to 50 s | The score: [X] of [X] read correctly. The misses in a short list | "[X] of [X] read correctly. [X] misread." | one soft tone per number |
| 7 | 50 to 52 s | Silence. The misread letter held on screen | none | silence |
| 8 | 52 to 66 s | The lens: the diff on the left, the twin on the right. Then the reading with the lens on | "A lens: [X] lines of code. Same agent. Same widget." | click, then confirm tone |
| 9 | 66 to 76 s | The PR page on GitHub: the TestSprite check red, then green, and the merge held then released | "The exam reruns on every PR. A red check holds the merge." | check tone |
| 10 | 76 to 84 s | The chart, final state, URL | "Eye Chart. [X: URL]" | room tone out |

Last frame is the chart, matching the first frame of Opening B.

## Voice-over

Read in a calm, plain voice. About 150 words. Caption every line.

1. (Opening, see above.)
2. "I study how machines see. An eye exam is the oldest test there is: letters, row by row, smaller each time."
3. "So I built one for TestSprite's AI tester. Every letter is a real UI widget. And every letter is built twice."
4. "One twin works. One is broken, in a way you can see in two seconds. So I know the right answer before the test runs."
5. "TestSprite's agent tests both. This is what it said, in its own words."
6. "It read [X] of [X] correctly. It missed [X]."
7. (Silence.)
8. "For a miss, I write a lens. [X] lines of code. It does not change what the widget does. It gives the agent something it can read. Same agent. Same widget. Now it reads it."
9. "And the exam runs on every pull request. A red check holds the merge. Fix it, and it goes through."
10. "Eye Chart. Open it and read the chart yourself."

## Build notes

- Engine: a plain screen recording of the live site at 1920x1080, cut in an editor or by script. No code film is needed, since the footage is the product.
- Record the capture on the deployed URL, not localhost, so the film shows what judges will open.
- Voice: Chirp 3 HD through `tools/voice.py` in the film playbook. It writes `voice.json` for captions.
- Master to -14 LUFS integrated, true peak at or below -1 dBTP, with `tools/master.py`.
- Checks before ship: a frame every second with no cropped or unreadable text, every number matches `latest.json`, a transcription of the final audio matches the script word for word, no music file in the mix.
- Types large enough to read on a phone. At most 4 beats per 30 seconds. One new thing on screen at a time.
- Draft post for X goes in `post_draft.md`. The owner posts it.

## Truth table

| Value | Exact wording | Source |
|---|---|---|
| Twins read correctly | "[X] of [X] read correctly" | `public/readings/latest.json`, results, count of correct readings |
| Misreads | "[X] misread" | same file, count of wrong readings |
| Blocked runs | "[X] blocked" if shown | same file, verdict `blocked` |
| TestSprite reason | verbatim | same file, `reason` |
| Lens size | "[X] lines" | the diff in `src/letters/registry.ts` |
| Result with lens | "[X] of [X]" | the lens reading in `latest.json` |
| PR check | red then green | the PR page, [X: PR link] |
