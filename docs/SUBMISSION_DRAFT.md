Title: Eye Chart: an eye exam for TestSprite's AI tester
PR with a TestSprite check (red, then green): [X]
Live URL: [X]
Repo: https://github.com/Yazan-O/eye-chart
TestSprite account (name, email): [X], [X]
Demo video: [X]
Write-up: [X]
Team: solo, Discord @[X]

## The idea

I study how machines see. So I gave the AI tester an eye exam.

Eye Chart is a chart of [X] real UI widgets. Each has a twin that works and a twin that is visibly broken. TestSprite's cloud agent tested every twin. The site shows which ones it read right, which it misread, and what TestSprite said in its own words.

For each misread widget there is a lens: a small code change. The site shows the reading taken again with the lens on.

## The result

[X] of [X] twins read correctly. [X] misread. With lenses on, [X] of [X] of those read correctly. Every verdict on the site comes from a real run, and `readings/latest.json` has the run ids.

## How it is checked

Two TestSprite projects.
- Site suite ([X] tests): runs on every PR through the GitHub App. It is a required check, admins included, so a red check holds the merge.
- Calibration: a GitHub Action runs the CLI against each PR's preview and commits fresh readings. It does not gate. It re-examines the agent.

## The PR

[X: PR link] went red at [X] of [X] on [X: the real bug], and green at [X] of [X] after [X: fix commit].

## Not in the suite

[X: one plain limit, from the write-up]
