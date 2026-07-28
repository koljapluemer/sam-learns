# sentence net: clean up attaching existing words or sentences

- in the add-examples and add-word screens it is possible to attach new words/sentences, but also to refer to existing words/screens. the second part is currently integrated kind of half-assed.

do the following:
1) the target language field of sentences/words should be unique. two sentences that are string-equal in regards to the target language are simply *the same sentence* (same for words)
2) thus, in the UI, the text input does not have to do anything super special, in the end: if target languages matches an existing word, update instead of add, otherwise not. To fix edge cases: 

1. When a given vocab or sentence target-lang-matches w/ something in the db, mark it's form field card in a different color
2. If for some reason we have a collision of existing translation or note and new translation/note, check first if they are literally same (nothing to do), otherwise simply merge them on string level with a semicolon: "$old_content; $new_content". This will e.g. be relevant when LLM paste happens, as they always contain new vocab
3. At save of form, latest write wins. If for some reason we have an already existing target string on form save and the data doesn't match, new form data overwrites.
4. If the user manually types in a target string in a word/sentence field, do the smart dropdown thing we're already doing. If we have a match on field blur; or if the user clicks on a dropdown suggestion and translation/note is empty, simply fill the fields according to the existing note. Otherwise, do the semicolon merge described above.