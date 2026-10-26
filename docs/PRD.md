# Eye Chart: product requirements

Eye Chart is a public web app at https://yazan-o.github.io/eye-chart/ that shows how well TestSprite's AI tester reads 24 real web widgets. No sign-in. All routes are hash routes.

## 1. Chart page (`#/`)
- Shows the heading "Eye Chart" (`heading`) beside a small robot wearing glasses, a tagline (`tagline`) and a 3D chart (`chart-canvas`) inside `scene`.
- A tally (`tally`) shows four counts: read correctly (`tally-read`), misread (`tally-misread`), blocked (`tally-blocked`), not read yet (`tally-unread`). The four counts always add up to 24.
- `reading-summary` states "Read correctly: N of 24 letters" and the measurement date. N equals the number in `tally-read`.
- `plaque` names the recorded run and its commit.
- The chart key (`chart-key`) lists 7 rows (`chart-row-1` to `chart-row-7`) with Snellen labels 20/200 down to 20/25. Each of the 24 letters is a link `letter-link-<id>` whose text shows the letter name and its state (Read correctly, Misread, Blocked, Not read yet). Row 1 holds one letter (Counter); row 7 holds the hidden-text letters.
- Clicking a letter link opens that letter's station at `#/letter/<id>`.
- `motion-toggle` pauses and resumes motion; its label changes to say motion is paused, and pressing it again restores "Pause motion".
- `about-open` opens an About panel explaining the project in plain words; it can be closed again.

## 2. See it like TestSprite (`agent-toggle`)
- Pressing "See it like TestSprite" switches the page into the sensor view: a status line starting "Sensor view." reports how many parts of the page the agent can find and how many canvases it cannot see into.
- Pressing the toggle again or Escape returns to the normal view and the status line goes away.

## 3. Lens machine (`lens-machine`)
- Lists the lenses with a dial each (`lens-dial-<id>`), all "Off" at load.
- Turning a dial on switches that letter's chart state to the reading taken with the lens; turning it off restores the original state. The letter's link `letter-link-<id>` carries `data-lens="on"` or `data-lens="off"` (letters without a lens carry no `data-lens`).

## 4. Letter station (`#/letter/<id>`)
- Shows the letter's name, row and state, the trap in one sentence, and the working and broken versions side by side with an "Open alone" link each.
- Shows the truth for each version, TestSprite's verdict and its stated reason.
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
