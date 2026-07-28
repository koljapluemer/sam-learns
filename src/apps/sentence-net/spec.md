This app should be a new app following the usual structure.
Take over the page structure from e.g. `comprehensible-input`: Main, Stats, Settings, Info.

No app-specific settings for now.
Stats: standard time-active, trials = "tasks done" (each queue screen described below is a task)

We don't need any public/ data.

## Main Purpose

The point of this app is to acquire target language vocab in context.
For this, the user goes through a queue adding and interacting with example sentences.

## Queue Screens

The queue should follow a pattern where each of the following screens is a cleanly seperated vue component, implemented w/in the layered architecture described in @agents.md.
Te app loads one screen according to conditions, let's user interact w/ it, and loads a new screen, again according to conditions.

### New Example Sentence

This is the standard screen that should come up if nothing is due, or nothing is added yet.

Prompts the user to add a new sentence in their target language, with two inputs:

- target language sentence
- translation/meaning of sentence

`Save` button (persist to dexie, make sure to not hit vue object clone issues!)

### Add Sentence Vocab

A screen to define which vocab words a sentence contains.
Show the sentence, and its translation.

Next to those two strings have icon edit buttons, toggling inline editing, in case the user wants to adapt parts of the sentence.

Have a smart multi-line form (automatic new line whenever last line is starting to have content).
Each line: target language word, translation. Option to delete form lines.

Above the form, also offer two buttons: One to copy a prompt for an LLM chatboard to clipboard, one to paste an LLM answer and auto-fill the form.
For the copy: Put to clipboard a prompt w/ the sentence, it's translation, and a prompt to extract vocab with translation from it, and return only this data structure w/ format. 
For the paste: Parse from user clipboard and smartly fill in the form (simple but not too sophisticated merge logic)

Buttons: `Done` (once this was done once, this screen will not come up again for *this sentence*), `Finish Later`: save complete vocab lines, and allow this screen to come up for this sentence again in the future , `Delete Sentence` (ask for confirmation, deletes the sentences and simply goes to next, w/o saving any vocab etc.), 

### Practice Vocab

A standard SR-flashcard screen for practicing vocab added (see `20-words`, `boringwords`, take over logic and UI w/o the glassmorphism flavor).
Front of card is target language word and up to 3 randomly chosen sentences (target language) where this word occurs, back of card then is also the translation of the word.

Add icon buttons to delete the word and to jump to edit the word (simply load the queue view for "Add to Word") and to jump to sentence (simply jump to "Add Sentence Vocab")

### Practice Sentence

Same as above, front is target lang sentence, back is translation and a table of the words in it w/ their translations and icon buttons to jump to the words.
Again add icon buttons to delete sentence and to jump to edit (go to Add Sentence Vocab)

### Add Examples to Word

Added vocab words that have less than 3 example sentences attached are eligible to this. 
Should be very similar to Add Sentence Vocab, only this time we attach example sentences to vocab (include the chatgpt copy paste flow etc.)

Also have a button at bottom "I don't want add more examples", which saves eligible examples but as opposed to "Finish later" ensures that the vocab will *not* come up in this screen again. This can e.g. be used for uninteresting words.

## Selection Logic

Essentially, selection should work like this: See which of the 5 screens are eligible, then pick one form the eligible at random.
Screens are also not eligible if the only way they could come up is based on the sentence or word that was just edited (e.g. do not show `practice-sentence` as the next screen after we just did `add-sentence-vocab` for this sentence, or show the same word twice in a row in `practice-vocab`)

Eligible:
- `new-example-sentence`: less than 20 words due or unseen according to fsrs, less than 10 sentences due or unseen according to fsrs, less than 10 words still eligible for `add-examples-to-words`, less than 5 sentences eligible for `add-sentence-vocab` 
- `add-sentence-vocab`: sentence exists where we still could do this
- `add-examples-to-word`: word exists where we still could to this
- `practice-sentence`: sentence exists that is due or unseen
- `practice-vocab`: vocab word exists that is due or unseen

## Other Pages

Similar to `20-words`, we need a bottom mini nav, w/ some pages around queue (queue link should be the first button).
Second button to add sentences (simply jumps to queue to New Example Sentence), in case the user wants to add a sentence.
Third button is a list of the sentences (again analogous to 20-words) where we seem them tabulated and can edit (jump to relevant queue screen) and delete via icon buttons
Then analogous two buttons for vocab.