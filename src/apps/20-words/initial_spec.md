Create a new subapp.
Conform to known pattern/stack and agents.md files already abundant in this repo.

App is called "20 Words", and should support the learner in adding 20 vocabulary words a day, practicing them in a special UI.

We will have the following routes/main compontents, following the main url pattern

- Home: briefly explains the app, link to get started
- Main: the actual main interaction
- Settings: a plain-text field called "Language" (will be used in the adding form) 
- Stats: A per day stacked bar chart (use libraries!!) of vocab added, vocab memorized, and vocab flashcard practiced

Main should be made from 3 screens, actually.
Feel free to use the router, but don't actually integrate links in the main view.
Instead, have a bottom bar, with 3 round icon-only button.

First, standard view:

## Add

A form for the user to add new vocab, following standard current daisy patterns. Fields:

Word
Meaning
Examples (a smart multi-form, where each row is two inputs, sentence and translation, and there always being automatically added a form row when the above one is beginning to be filled, and rows can also be deleted)
Notes (also smart multi-form, but just one input field per row)

One button, Save.
Persist to dexie.
Load empty form again

At the top, have a progress bar, filling up per calendar day (day starts at 4am local time), showing how far along the user is adding 20 words today.
When 20 words were added today, don't show the form again, instead show: "All done! Move on to memorize" w/ a link to the next Main view

## Memorize

All new words have to run through this flow once successfully b4 being integrated in standard Practice flow.

The UI is row based.
At the beginning, have one row, and load up to 3 random words that have not run through this flow.
Btw:
Practice is standard flashcard stuff UI-wise, pretty much like the boringwords/ app.
Construct flashcards by putting the word in fairly large text on the front, and meaning on the back (also large-ish), as well as examples and notes, only shown after Reveal.

Now, in this view, only actually render the front of the first card as a card, only show the other cards in this row as empty cards stacked behind the first card (like a real card stack), moved a few pixels to the right and shifted randomly up or down a few pixels.

So, only the first card of a given row can be interacted with. 
Add an icon-only reveal button on the card, on touch devices, don't show it and simply listen to tap on the card.
On reveal, show front and back and two icon buttons, signifying "wrong" and "correct".

When a card is scored as wrong, always move it to the back of the stack of the bottom-most row.
When a card is scored correct, always move it to the back of the row above.
When a card is in the fourth row as counted from the bottom and scored correctly, it is "memorized" and disappears from this view.

If the bottom row has less than 3 cards and we still have non-memorized cards, add a new random non-memorized card to the back.

Note that at this stage we do not need fsrs for scoring, since scoring is based on the rows only.
Only when the card leaves row 4, we can create a basic fsrs object attached to the card.

Show a progress bar on top, comparing the number of non-memorized cards when the view was loaded vs. the number now, showing the progress in "clearing cards of the board".

If no more unmemorized cards, show "All Done! Move to Practice" or, if no more unmemorized cards but the learner did not yet add 20 cards today, show link to the initial view.

## Practice

The last view: Standard fsrs flow, exactly like boringwords, w/o the background pictures.
Show only due cards.
Show progress bar comparing due cards when view was loaded vs. now. 
When no more due, show either "All done, good job" or link to the first 2 views if tasks are open there.
