# Scoring per exercise type

All exercise types feed into the same `submitAnswer` (`progressScheduler.ts`), which derives one
FSRS rating: `Good` if answered correctly on the first try, `Again` otherwise (wrong first pick,
extra clicks, or gave up). That rating updates the country's SR card, the per-exercise-instance
SR card, and the `learningEvents` log read by the stats modal.

- **find-in-neighborhood / find-on-world-map**: free click on the map. `numberOfClicksNeeded`
  counts every click; `1` = Good, `>1` = Again.
- **identify-country / distractor-choice**: forced binary choice (correct country + one
  distractor). Picking the distractor first is a wrong click that disables that option, forcing
  the correct pick next — `numberOfClicksNeeded` ends up `>1`, so it scores Again. Correct on the
  first click scores Good.
- **group-sequence**: same forced binary choice as distractor-choice, run once per country in the
  group. Each country submits its own answer independently (intermediate steps call
  `submitAnswer` directly, the last step emits `submitted`), so scoring is per-country, not
  per-group.
- **"I have no idea" give-up** (find-in-neighborhood, find-on-world-map only): reveals the
  country but does not submit by itself — same as before, the user still has to click the
  revealed country to proceed. That click's `submitted` payload carries `gaveUp: true`, which
  forces an Again rating regardless of click count.
