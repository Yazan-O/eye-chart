Eye Chart - 39 of 48 twin readings right by TestSprite's AI tester, 7 lenses measured, 5 fixed

Can you trust a red or blocked verdict from an AI tester? Eye Chart measures it. I built 24 real UI widgets, each twice: a working twin and a visibly broken twin, so the right answer is known before any test runs. TestSprite's cloud agent tested all 48 twins. It read 39 right, misread 4 and could not test 5. It ignored every planted "this form works" note, and it failed a working Save button because the notice fades after 1.5 seconds. For each miss there is a lens, a small code change, and the site shows the reading taken again with the lens on: 7 lenses measured, 5 fixed their letter, 2 did not. Every verdict and run id is in public/readings/latest.json.

The checks run themselves. On the redesign PR (13), TestSprite's gate failed 29 of 31 on two real regressions, the station's next and previous walk and a lens link pointing at the wrong letter, that our 121 Playwright tests passed. Both were fixed in PR 14. The gate has 31 tests and main requires it, next to a verify check of 121 Playwright and 110 unit tests. In PR 8 a planted bug was blocked by verify, while TestSprite's old tally test missed it. That test is rewritten, and it now fails the planted build and passes main. PR 1 went red three times (18, 20, 20 of 21) before it went green. The CI also re-examines five headline twins on PRs when credits allow, so if TestSprite's agent changes, a later PR shows it.

Live: https://yazan-o.github.io/eye-chart/
Code: https://github.com/Yazan-O/eye-chart
PR (TestSprite check): https://github.com/Yazan-O/eye-chart/pull/13
TestSprite report (PR 13): https://www.testsprite.com/dashboard-v3/o/9db76168-3c40-5a47-9bb7-b3589a267ccc/projects/aca2323a-9450-40b3-ab92-6ad21f4d77ff/execution/4ccc9881-7efc-4e81-a620-a5d650863d79
TestSprite report (replay of the planted bug): https://www.testsprite.com/dashboard-v3/o/9db76168-3c40-5a47-9bb7-b3589a267ccc/projects/aca2323a-9450-40b3-ab92-6ad21f4d77ff/execution/6fc04668-6aaa-4db9-9063-bb846564d335
Demo video: [X]
X post: [X]
TestSprite account: mohamad.yazan@ou.edu
Discord: yazan030803
