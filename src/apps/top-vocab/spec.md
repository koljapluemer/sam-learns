This should become a new app, following @add-a-new-app.md.

The point should be to practice the top vocab of a language.
Data is in public/data/top-vocab (you'll find a language.json overview, then one folder per lang code, containing one file keyed by vocab, and one by sentence).

We will, UI-wise, follow a very simple spaced repetition flashcard flow, as implemented already multiple times in other apps.
Learner needs to set a language (follow pattern from comprehensible-input), and then we just have one main view.

We have two main learning objects: Vocab and Sentences.

- for vocab, we track learning progress as an fsrs Card interface, plus a custom value "level" which is an int from 1 to 4, default 1, and the str value "initialSentence"
- for sentence, we also track as fsrs Card, plus the custom bool lastAnswerCorrect (default false)

At first open, pick a random sentence from the sentence pool of the lang.
Note: Only sentences that have >= 50% as many containing words attached as they actually have words (as counted by simple whitespace split) are eligible (I'm aware that there is sometimes stuff going on like the sentences containing both a two-word vocab and the parts of that as separate parts, muddying the count, but this is just a rough heuristic, so it doesn't matter).

Create a learning progress object for the sentence using the fsrs create function, and set default values.
Create learning progress objects for each of the vocab contained in the sentence, and set default values. Set initialSentence to the picked sentence. Only use vocab that has at least 4 example sentences, simply ignore others

In the following, we will be using a simple one-card-at-a-time SR queue. As an overriding rule: under NO CIRCUMSTANCES, ever, show the same sentence or same vocab back-to-back. This overrules all other rules.

We now have a bunch of valid learning data we could show flashcard for. First, let's specify under what circumstances a card is considered due:

- vocab cards which are level 1,2 or 3 are always considered due
- vocab cards which are level 4 are only considered due when fsrs says they are due
- sentence cards with lastAnswerCorrect=false are considered due when fsrs says so
- sentence cards with lastAnswerCorrect=true are considered due if BOTH fsrs says so, AND all containing vocab cards are seen (=learning object created) and level 4 and not currently due according to fsrs

Based on these rules, randomly pick a due learning content item. Display as follows:

- vocab level 1: front: prompt "What does this mean?", target lang word in large font, the initialSentence (target and translation), and then in same formatting, two randomly chosen example sentences with translations that contain this word. back: the translation
- vocab level 2: same as above but with 3 randomly chosen example sentences & translations, *excluding* the initialSentence. 
- vocab level 3: as above, but without the sentence translations
- vocab level 4: as above, but no example sentences on the front. instead, show 3 randomly chosen ones with translations on the back

- sentence lastAnswerCorrect=false: prompt "What does this mean", sentence in target lang (bigger font but not too big given that this is a whole sentence), then a list of all containing vocab and their translations, well formatted. back: the translation
- sentence lastAnswerCorrect=true: same, but show the contained words only on the back, not the front

Use always the same reveal-and-score flow, with the usual 4 FSRS scoring buttons. Some specials:
- when vocab is scored Easy or Correct, ++ the level. when scored Wrong, -- the level. (within the level limits, ofc)
- set lastAnswerCorrect for sentences to true for Correct/Easy and false for Hard/Wrong
- when lastAnswerCorrect *was* true, and the sentences is scored wrong, set the due date of all contained vocab to right now (do not simulate scoring, simply hack the due date). This is to ensure the vocab is soon refreshed, w/o fucking unduly with the fsrs logic

If, and only if, we run out of due learning content to show, pick a new random sentence that was not seen before (=no learning object).
Prefer sentences that have as much overlap in their contained vocab as possible with the already learned vocab (you may implement this heuristically instead of provably correct if it's easier).


Implement what is described here. Do not add cutesy micro copy not needed, progress bar, or anything else I didn't ask for.
Include the standard stats, as implemented by similar apps
