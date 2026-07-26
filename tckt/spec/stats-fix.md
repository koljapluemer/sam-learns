Let's fix stats.

We do *have* stats, but they are fairly broken and inconsistent.

### Basics

- Every subapp has a stats page, triggerable via the nav bar
- On it, there should be app stats, and the global stats
- Every app in some way meaningfully tracks a) time actively spent b) trials (these must be defined by every app)
- BRIEFLY document how to do stats for future added apps in @add-a-new-app.md

### Fixes

#### General

- The global stats layout is currently some weird and fucky side-by-side layout w/ random half centered elements. Make a normal col layout, first the app stats, then the global stats
- in the per-app section, we generally want some numeric stats (not plots, just single stat) that make sense, e.g. words practiced, time spent, and what else makes sense. 
- The global stats should be two stacked bar charts: time spent per app and day, trials per app and day. not a table, nothing else. In the legend of the bar chart, use the human readable name of the app from registry, and also say what is counted as "trial"
- make sure to find neat architectual solution for global and per-app stats and apply that consistently

#### Per-App

- stick to @agents.md
- try achieving cross-app standards, avoid bespoke special shit unless called for

##### Comprehensibleinput

- time: we already track this; active video watch times
- trials: times the user has clicked "submit & next video"

In the per-app stats, we want time per language as stats (I think this is implemented), and a stacked bar chart per day, with time spent per language

##### Arabicnumbers

- time: active time spent in the main screen (maybe worth writing a shared/ tracker here, lot's of app have this kind of active time, where we kind of want to see if the user is in tab, focussed and ocassionally using the mouse/keyboard)
- trials: obviously, just the exercises done

- remove the "missions" sections, nobody looks at it
- move the "Statistics" grid on main to the Stats page

##### Saetze

- trials: exercises
- time: standard

No special per-app statistics, just descriptor w/ trials and time spent

##### egyptiansentences

put the *highscore* table ALSO! on the stats page

- trials: games played
- time: time in active games

##### boringwords

- time:standard
- trials: cards flipped

##### viettonepractice

- time: audio listened to
- trials: exercises answered

We have some fancy & nice charts on the stats page, currently they are completely blank. Fix that.

##### hebrewscript

same as viettonepractice, only that the stats here on the page are randomly not broken?!?!

##### prepositions3d

- time: standard
- trials: times the cup was placed correctly

##### infinitesentences

- time: standard
- trials: sentences done, same as already tracked 

existing stats are nice, get rid of streak tho (including the code tracking it.)

##### tprboard

Already decent internal stats, shows also how to track time and trials (=tasks completed)

##### learn-flags

- time: standard
- trials: exercises done

##### currency-conversion-practice

- show the point cloud thingie *also* on stats page, with the option (only on stats page) to see all trials instead of just recent ones
- time: standard
- trials: number of estimation exercises done


##### simplify-expressions

- time: standard
- trials: exercises done (given up sounds as done)

##### triangle-congruence

- time: standard
- trials: exercises done

##### entity-relation-intuition

same as above

##### world-map

already nice local stats, at standard global stuff

##### typingpractice

- add local stat: WPM/accuracy per day

- time: standard
- trials: one trial = one time the user started typing, and then stopped (for more than 30s, or left tab or route)

##### 20-words

local stats seem broken?

- locally: show stacked bar chart per day: words added, words memorized, word practiced
- trials: only words that on a given day have been added+memorized (ignoring practice)
- time: standard