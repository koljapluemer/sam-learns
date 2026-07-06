You see here a language learning flashcard app.

Let's use the tech stack to convert this into a highschool-level math expression simplification tutor.

We need some additional libraries, probably:

- KaTeX for rendering
- MathField for pleasant input
- some library to generate expressions, calculate whether two expressions are equal, etc?

The app should exclusively be focussed on simplifying expressions


Install recommended i18n lib, and let's translate the app to english and german (default).
Add linter rules to eslint to disallow plain-text in the app, everything must be i18n snippets.

For now, let's implement extremely simply, generate random exercises with no special logic, don't persist learning items, don't store anything.

MVP grading convention:

- use expanded polynomial form as the target
- expand parentheses
- evaluate numeric constants
- combine like terms
- simplify repeated products into powers where generated exercises expect that
- do not require factoring
- pass answers only when they are equivalent to the original, simpler than the original by AST complexity, and close to the generated target complexity
- reject copied or merely reordered originals even when they are equivalent

Example exercises that should be in generation scope

3x + 5x - 7x
2xy - 5xy^2
3a - (2b - c)
5 * (5 + 3a * b)
(a + b) * (c + 2b)
