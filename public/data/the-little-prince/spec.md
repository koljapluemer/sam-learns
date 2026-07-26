- this should be a lang learning app where the learner repeatedly listens to segments of The Little Prince translated audiobooks, and practices vocab, and listens again
- let's implement a minimal version for testing

- check @add-a-new-app.md
- take the page pattern from `comprehensible-input`: Play, Stats, Settings, Info
- stats: time is the standard tracker, trials is number of segments the learner watched

- on info page, where we are first redirected, learner needs to choose target language, based on public/data/the-little-prince/index.json (for now just viet, but that's gonna change later, so build proper select)
- this data file also contains the youtube id for the relevant video
    - see comprehensible-input for patterns how to display a yt player
- public/data/the-little-prince/vocab/ then has files (per video id) listing segment timestamps, and the vocab relevant for this segment

For now, let's go w/ the following main flow:

1) play the first segment (PLAY)
2) after-end time, automatically show a very minimalist screen (SELECT) for the user to allow what to do next
    - replay segment (back to 1)
    - practice vocab and rewatch
        - this will pick a set of 8 vocab relevant for this segment, prefer due vocab according to fsrs, fill up w/ random unseen stuff. steal UI and logic patterns from the `boringwordapps`
        - all vocab that is scored hard or wrong is readded to end of queue, indepentently of what fsrs says 
        - prevent vocab coming up twice in a row in all circumstances
        - once done with the vocab, automatically switch to autoplaying the segment again, after end, go back to SELECT
    - play next segment
    - practice next segment & play (similar idea) 