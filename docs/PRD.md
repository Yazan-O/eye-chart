# Eye Chart: product requirements

Eye Chart is a public web app at https://yazan-o.github.io/eye-chart/ that shows how well TestSprite's AI tester reads 24 real web widgets. No sign-in. All routes are hash routes.

## 1. Chart page (`#/`)
- One screen with no page scroll on desktop. The top bar holds the logo: a small robot wearing glasses beside the heading "Eye Chart" (`heading`), which is also the link home. The 3D chart (`chart-canvas`) sits on the right inside `scene`.
- Above the chart, a tally (`tally`) shows four counts: read correctly (`tally-read`), misread (`tally-misread`), blocked (`tally-blocked`), not read yet (`tally-unread`). The four counts always add up to 24.
- Under the chart, `reading-summary` states "Read correctly: N of 24 letters" and the measurement date. N equals the number in `tally-read`.
- `plaque` names the recorded run and its commit.
- `twin-summary` states "Twin readings correct: N of M": the working and broken twin readings TestSprite got right, out of all twin readings in the readings file.
- `chart-hint` under the chart says "Hover a letter. Click one to see what TestSprite did with it." and, while a letter is hovered on the chart or the answer sheet, names that letter and its state.
- The left column tells the story in four steps, one at a time: "What this is" (`step-1`, with the tagline `tagline` and `what-testsprite`, which says in one line what TestSprite is), "A letter" (`step-2`: one letter's working and broken twins live in small frames, `story-twin-works` and `story-twin-broken`, each with TestSprite's verdict), "A lens" (`step-3`: the letter's lens, its reading before and after, `story-lens-toggle` to turn that lens on, and a link to the code change) and "Results" (`step-4`: `story-score` reads "N of 24 read correctly" with N equal to `tally-read`, and the misread and blocked letters as links `miss-link-<id>`). The active step carries `data-state="active"`. `step-prev`, `step-next`, the dots `step-dot-1` to `step-dot-4`, the Left and Right arrow keys, the mouse wheel on desktop and a sideways swipe on a phone move between steps; `step-count` reads "N of 4".
- Under the story, the answer sheet: the chart key (`chart-key`) lists 7 rows (`chart-row-1` to `chart-row-7`) with Snellen labels 20/200 down to 20/25. Each of the 24 letters is a link `letter-link-<id>` drawn as a letter tile; its accessible name and text give the letter name and its state (Read correctly, Misread, Blocked, Not read yet). Row 1 holds one letter (Counter); row 7 holds the hidden-text letters. The whole sheet is visible at every step.
- Clicking a letter link, or a letter on the chart, opens that letter's station at `#/letter/<id>`.
- Once per visit, after the chart lands, a demo plays the four steps by itself (`demo-toggle` reads "Stop the demo" with `aria-pressed="true"`): it picks a misread letter with a recorded lens fix, shows its two twins, then shows the chart with that lens on without pressing its dial (the dial stays "Off" and unpressed), then the results, and ends there. Any key, click, wheel or touch stops it, and "Replay the demo" starts it again. With reduced motion, or motion paused, it does not play.
- `motion-toggle` pauses and resumes motion; its label changes to say motion is paused, and pressing it again restores "Pause motion".
- `github-link` in the top bar opens the source on GitHub.
- `about-open` opens an About panel explaining the project in plain words; it can be closed again. Inside it, `about-totals` gives the readings file's totals ("The readings file holds N readings: M twin readings, K of them correct, and L lens readings.") and `about-letters` gives the letter counts by state; they match `tally-*` and `twin-summary` with no lens on.

## 2. See it like TestSprite (`agent-toggle`)
- Pressing "See it like TestSprite" switches the page into the sensor view: a status line starting "Sensor view." reports how many parts of the page the agent can find and how many canvases it cannot see into.
- Pressing the toggle again or Escape returns to the normal view and the status line goes away.

## 3. Lens machine (`lens-machine`)
- Lists the lenses with a dial each (`lens-dial-<id>`) in a bar at the bottom of the chart, all "Off" at load. The demo in section 1 shows one lens's fix on the chart without pressing its dial; that dial stays "Off" and unpressed.
- Turning a dial on switches that letter's chart state to the reading taken with the lens; turning it off restores the original state. The letter's link `letter-link-<id>` carries `data-lens="on"` or `data-lens="off"` (letters without a lens carry no `data-lens`).

## 4. Letter station (`#/letter/<id>`)
- Shows the letter's name, row and state, the trap in one sentence, and the working and broken versions side by side with an "Open alone" link each.
- Shows the truth for each version, TestSprite's verdict and its stated reason. When TestSprite left a screenshot, `reading-<twin>-screenshot` opens it larger (`reading-<twin>-screenshot-zoom`); Escape or Close shuts it.
- A switch (`pane-switch`) has buttons `pane-works`, `pane-broken` and, for letters with a lens, `pane-lens`, each with `aria-pressed`. "Lens" puts the lens twin (`station-lens-twin`) in place of the twin it fixes, the big letter (`station-glyph`) fuses its ghost and shows a tick when the recorded lens reading is correct, and `station-state` reads "Fixed with lens." with `data-lens="on"`. At 375 px one twin shows at a time.
- Letters with a lens show the lens name, summary and an exploded view (`lens-exploded`): the twin as TestSprite read it (`lens-before`), the lens's real code change (`lens-diff`), and the lens twin's reading (`reading-lens`), joined as "twin + lens = lens twin". `lens-explode` assembles and separates the parts.
- Previous and next links move between letters.

## 5. Twin pages (`#/l/<id>/works`, `#/l/<id>/broken`)
- Each renders one widget alone, with no chart around it.
- Example: `#/l/counter/works` shows a counter; clicking its button three times shows "Count: 3". `#/l/counter/broken` shows the wrong count after three clicks.

## 6. General
- Unknown routes show a not-found page with a link back to the chart.
- The page works at phone width (375 px) with no horizontal scrolling.
- With reduced motion requested, the chart does not animate.
