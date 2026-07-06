# Exercise Scheduling And Generation

## Purpose

The tutor does not serve exercises from a fixed list anymore. Instead, it builds a new exercise on demand from a constrained topic generator and chooses that topic through a small adaptive scheduler.

The goal is narrow on purpose:

- stay within high-school expression simplification
- test one main skill per exercise
- keep difficulty measurable
- keep enough variation for repeated practice
- track progress per skill area instead of per hardcoded template

## Core Idea

There are two separate decisions whenever the tutor needs a new exercise:

1. Which topic should the learner practice next?
2. Within that topic, what exercise should be generated?

The scheduler answers the first question from stored progress data.
The generator answers the second question by building a fresh expression for the chosen topic and difficulty band.

## Topic Model

The system uses atomic topics rather than broad mixed algebra tasks. Each topic is meant to represent one recognizable simplification skill.

Current core topics:

- combine like terms
- remove parentheses with sign
- distribute a monomial over a sum

Unlocked later:

- normalize product powers
- expand a monomial times a parenthesized product
- expand binomial times binomial
- simplify a signed product with follow-up combining

Challenge topic:

- mixed expressions

The challenge topic is reserved for later-stage practice and is only made available after stable success in the prerequisite topics.

## How Exercises Are Generated

Each topic has its own generator. Generators do not try to create arbitrary algebra. They operate inside a small, topic-specific sandbox.

The conceptual pattern is:

1. Pick a topic.
2. Pick a difficulty band.
3. Build a valid target form for that topic.
4. Make the source expression less simplified in a controlled way.
5. Attach metadata describing difficulty and used features.
6. Reject the result if it is invalid or off-topic.

This keeps the generator narrow and predictable. It also avoids the usual failure mode of random symbolic generation, where expressions become messy, multi-skill, or pedagogically unclear.

## Topic-Specific Generation Style

Each topic uses its own small set of transformations.

### Combine Like Terms

The generator creates one or more monomial groups and splits each total coefficient into several visible terms. Higher difficulty adds:

- more groups
- negative pieces
- separated like terms
- reordered terms

The learner still solves one main task: identify and combine like terms.

### Normalize Product Powers

The source uses repeated factors such as a variable appearing multiple times in a product. The target rewrites those factors into compact power notation.

Difficulty mainly grows through:

- more repeated factors
- more additive terms
- signed coefficients

### Remove Parentheses With Sign

The source wraps terms inside parentheses and places either a plus or minus sign in front. Higher difficulty adds:

- an outer minus
- negative terms inside the parentheses
- a follow-up combine step after the sign change

The intended skill stays focused on sign handling through parentheses.

### Distribute Monomial Over Sum

The source uses a single factor outside parentheses. The target distributes that factor over each inner term.

Difficulty grows through:

- variable factors instead of only numeric factors
- negative inner terms
- slightly denser products

### Expand Monomial Times Parenthesized Product

This is a more structured version of distribution. The source includes outer factors around a sum, so the learner must expand one layer while preserving the surrounding factors.

### Expand Binomial Times Binomial

The source is a product of two sums. The target is the expanded form. Higher difficulty introduces overlap between variables so that like terms may appear after expansion.

### Signed Product With Follow-Up Combine

The source contains a product with sign handling and an additional term that may combine afterward. This topic bridges product simplification and matching-term recognition.

### Challenge Mixed Expressions

Challenge items intentionally combine patterns that resemble the harder examples in `exercise-list.md`. These are not used as the main progression path. They are reserved for late practice once the learner has shown stable control of the atomic topics.

## Difficulty Model

Difficulty is assigned by the generator, not guessed only from the final expression text.

Every generated exercise carries:

- a difficulty band from 1 to 5
- a numeric difficulty score
- a list of generation features that explain what made the item harder

The generator-derived features are the main explanation of difficulty. Expression complexity from the math engine is still used as a validation signal, but it is not the authoritative difficulty model.

### Difficulty Bands

- Band 1: one obvious step, little to no sign friction
- Band 2: one main step plus a mild nuisance
- Band 3: two-step feel or a clear sign trap
- Band 4: several moving parts, negatives, or overlap that requires more attention
- Band 5: challenge-level mixed expressions

### Feature Examples

Features describe what made a generated exercise harder, for example:

- split coefficients
- non-adjacent like terms
- outer minus
- sign flip
- negative coefficient
- variable overlap
- follow-up combine
- power notation
- challenge

These features exist so the system can explain and compare difficulty in terms of actual algebraic demands rather than only visual size.

## Validation Rules

Before an exercise is served, it must pass basic checks:

- the source expression must parse
- the target expression must parse
- source and target must be mathematically equivalent
- source and target must not collapse into the same ineffective exercise

This keeps broken or trivial items out of the tutor flow.

## What Gets Stored

Every time the learner checks an answer or reveals the solution, the app stores an attempt record and updates topic progress.

Attempt records include:

- topic
- difficulty band
- difficulty score
- generation features
- source and target expressions
- learner answer
- result reason
- correctness
- latency

Topic progress stores:

- current skill estimate
- recent accuracy
- current streak
- last seen time
- next due time

Dexie is the persistence layer for this data in the app.

## How Scheduling Works

The scheduler chooses a topic first and a difficulty band second.

### Topic Selection

Topic choice is weighted by topic progress. The scheduler prefers:

- overdue topics
- weaker topics
- unstable topics with lower recent accuracy
- unseen topics when they become unlocked

This means practice naturally shifts toward areas where the learner is weaker or due for review.

### Difficulty Selection

Once the topic is chosen, the scheduler picks a difficulty band around the current skill estimate.

The default distribution is:

- 70% near the current estimated level
- 20% one band lower for reinforcement
- 10% one band higher for probing

Challenge items are fixed to band 5.

## Unlock Progression

The system does not expose all topics immediately.

The learner starts with:

- combine like terms
- remove parentheses with sign
- distribute monomial over sum

More advanced topics unlock only after the prerequisite topics show stable performance. In practice that means the learner needs both:

- a strong enough skill estimate
- a strong enough recent accuracy

This keeps the early experience focused and avoids mixing in exercises that depend on undeveloped sub-skills.

## How Progress Updates After An Attempt

After each attempt, the topic progress is updated using:

- correctness
- result reason
- exercise difficulty
- response latency as a mild modifier

Correct answers move the skill estimate up.
Incorrect answers move it down.
Reveal actions count as a distinct kind of failure and reduce confidence more than a simple parsing issue, but they are not treated identically to every wrong answer.

The update also changes:

- streak
- recent accuracy
- due time for the next review

This is intentionally lightweight. The app does not use a full psychometric model. It uses a practical, explainable per-topic skill estimate.

## Tutor Flow

The tutor page follows this lifecycle:

1. Ask the scheduler for the next exercise.
2. Display the source expression with topic and difficulty context.
3. Let the learner submit an answer or reveal the solution.
4. Grade and store the attempt immediately.
5. Ask the scheduler for the next exercise when moving on.

This means exercise selection is continuously informed by the learner’s recent history rather than by random rotation.

## Design Boundaries

The system intentionally does not try to be a general computer algebra generator.

It avoids:

- arbitrary symbolic rewriting
- broad multi-topic algebra soup as normal practice
- unrestricted random expression trees

Those approaches would make difficulty harder to control and skill tracking harder to trust.

The current design is deliberately constrained so that generation, scheduling, and progress tracking remain interpretable.
