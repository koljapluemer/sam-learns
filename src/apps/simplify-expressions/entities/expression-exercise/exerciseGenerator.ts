import { shuffleArray } from '@/apps/simplify-expressions/dumb/random'
import { isValidExercise } from './exerciseValidation'
import { commonExerciseVariables } from './exerciseVariables'
import type {
  DifficultyBand,
  ExerciseFeature,
  ExerciseTopic,
  ExpressionExercise
} from './exerciseTypes'

type RandomSource = {
  next(): number
}

type ExerciseDraft = Omit<ExpressionExercise, 'difficultyScore' | 'id' | 'seed'>

type TopicGenerator = (difficultyBand: DifficultyBand, randomSource: RandomSource) => ExerciseDraft

const baseVariables = commonExerciseVariables

const topicGenerators: Record<ExerciseTopic, TopicGenerator> = {
  'combine-like-terms': generateCombineLikeTermsExercise,
  'normalize-product-powers': generateNormalizeProductPowersExercise,
  'remove-parentheses-with-sign': generateRemoveParenthesesExercise,
  'distribute-monomial-over-sum': generateDistributeMonomialExercise,
  'expand-monomial-times-parenthesized-product': generateExpandMonomialTimesParenthesizedProductExercise,
  'expand-binomial-times-binomial': generateExpandBinomialTimesBinomialExercise,
  'signed-product-with-follow-up-combine': generateSignedProductExercise,
  'challenge-mixed-expressions': generateChallengeExercise
}

export function generateExercise(
  topic: ExerciseTopic,
  difficultyBand: DifficultyBand,
  randomSource: RandomSource = { next: Math.random }
): ExpressionExercise {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const draft = topicGenerators[topic](difficultyBand, randomSource)
    const difficultyScore = scoreDifficulty(draft)
    const seed = createSeed(topic, difficultyBand, randomSource)
    const exercise: ExpressionExercise = {
      ...draft,
      difficultyScore,
      id: `${topic}:${difficultyBand}:${seed}`,
      seed
    }
    if (!isValidExercise(exercise)) continue

    return exercise
  }

  throw new Error(`Failed to generate a valid ${topic} exercise`)
}

function generateCombineLikeTermsExercise(
  difficultyBand: DifficultyBand,
  randomSource: RandomSource
): ExerciseDraft {
  const variableCount = difficultyBand >= 3 ? 2 : 1
  const factorsPool = pickDistinct(randomSource, baseVariables, variableCount + 1)
  const primaryGroups = factorsPool.slice(0, variableCount).map((variable, index) =>
    buildLikeTermGroup({
      coefficient: randomInt(randomSource, 2, 6 + difficultyBand),
      expandedTerms: 2 + (difficultyBand >= 2 ? 1 : 0),
      factorKey: variable,
      forceNegativePart: difficultyBand >= 2 && index === 0
    })
  )
  const distractorFactor = factorsPool[factorsPool.length - 1] ?? 'x'
  const features: ExerciseFeature[] = ['split-coefficient']

  if (difficultyBand >= 3) {
    const distractor = buildLikeTermGroup({
      coefficient: randomInt(randomSource, 2, 5),
      expandedTerms: 2,
      factorKey: distractorFactor,
      forceNegativePart: difficultyBand >= 4
    })
    primaryGroups.push(distractor)
    features.push('two-groups')
  }

  const terms = primaryGroups.flatMap((group) => group.sourceTerms)
  const sourceTerms = difficultyBand >= 2 ? shuffleArray(terms) : terms

  if (difficultyBand >= 2) {
    features.push('non-adjacent-like-terms')
  }

  if (primaryGroups.some((group) => group.hasNegativePart)) {
    features.push('negative-coefficient')
  }

  return {
    topic: 'combine-like-terms',
    difficultyBand,
    features,
    source: joinTerms(sourceTerms),
    target: joinTerms(primaryGroups.map((group) => renderMonomial(group.coefficient, [group.factorKey]))),
    trace: ['split coefficients into multiple like terms']
  }
}

function generateNormalizeProductPowersExercise(
  difficultyBand: DifficultyBand,
  randomSource: RandomSource
): ExerciseDraft {
  const variables = pickDistinct(randomSource, baseVariables, 3)
  const termCount = difficultyBand >= 3 ? 2 : 1
  const terms = Array.from({ length: termCount }, (_, index) => {
    const factorA = variables[index % variables.length] ?? 'x'
    const factorB = variables[(index + 1) % variables.length] ?? 'y'
    const coefficient = randomInt(randomSource, 2, 4 + difficultyBand)
    const repeatCount = randomInt(randomSource, 2, Math.min(4, 1 + difficultyBand))
    const factors = [factorA, ...Array.from({ length: repeatCount }, () => factorB)]
    const signedCoefficient = difficultyBand >= 4 && index === termCount - 1 ? -coefficient : coefficient

    return {
      source: renderMonomialExpanded(signedCoefficient, factors),
      target: renderMonomial(signedCoefficient, compressFactors(factors)),
      hasNegative: signedCoefficient < 0
    }
  })

  const features: ExerciseFeature[] = ['expanded-factors', 'power-notation']

  if (terms.some((term) => term.hasNegative)) {
    features.push('negative-coefficient')
  }

  return {
    topic: 'normalize-product-powers',
    difficultyBand,
    features,
    source: joinTerms(terms.map((term) => term.source)),
    target: joinTerms(terms.map((term) => term.target)),
    trace: ['convert repeated factors into powers']
  }
}

function generateRemoveParenthesesExercise(
  difficultyBand: DifficultyBand,
  randomSource: RandomSource
): ExerciseDraft {
  const variables = pickDistinct(randomSource, baseVariables, 3)
  const outerTerms = [
    renderMonomial(randomInt(randomSource, 2, 5 + difficultyBand), [variables[0] ?? 'x'])
  ]
  const innerTerms = [
    renderMonomial(randomInt(randomSource, 2, 4 + difficultyBand), [variables[1] ?? 'y']),
    renderMonomial(difficultyBand >= 3 ? -randomInt(randomSource, 1, 3) : randomInt(randomSource, 1, 3), [
      variables[2] ?? 'z'
    ])
  ]
  const sign = '-'
  const features: ExerciseFeature[] = ['outer-minus', 'sign-flip']

  if (difficultyBand >= 4) {
    innerTerms.push(renderMonomial(randomInt(randomSource, 1, 4), [variables[0] ?? 'x']))
    features.push('follow-up-combine')
  }

  const source = `${joinTerms(outerTerms)} ${sign} (${joinTerms(innerTerms)})`
  const innerExpanded = sign === '-' ? innerTerms.map(flipTermSign) : innerTerms
  const targetTerms = [...outerTerms, ...innerExpanded]

  if (difficultyBand >= 3) {
    features.push('negative-coefficient')
  }

  return {
    topic: 'remove-parentheses-with-sign',
    difficultyBand,
    features,
    source,
    target: joinTerms(targetTerms),
    trace: ['remove parentheses and merge signs']
  }
}

function generateDistributeMonomialExercise(
  difficultyBand: DifficultyBand,
  randomSource: RandomSource
): ExerciseDraft {
  const variables = pickDistinct(randomSource, baseVariables, 3)
  const factorCoefficient = randomInt(randomSource, 2, 4 + difficultyBand)
  const factorVariables = difficultyBand >= 3 ? [variables[0] ?? 'x'] : []
  const factor = renderMonomial(factorCoefficient, factorVariables)
  const innerTerms = [
    renderMonomial(randomInt(randomSource, 1, 4 + difficultyBand), [variables[1] ?? 'y']),
    renderMonomial(difficultyBand >= 2 ? randomInt(randomSource, 1, 4) : 1, [
      variables[2] ?? 'z',
      ...(difficultyBand >= 4 ? [variables[1] ?? 'y'] : [])
    ])
  ]

  if (difficultyBand >= 3) {
    const secondInnerTerm = innerTerms[1]
    if (secondInnerTerm) {
      innerTerms[1] = flipTermSign(secondInnerTerm)
    }
  }

  const features: ExerciseFeature[] = [factorVariables.length ? 'implicit-product' : 'split-coefficient']

  if (difficultyBand >= 3) {
    features.push('negative-coefficient')
  }

  return {
    topic: 'distribute-monomial-over-sum',
    difficultyBand,
    features,
    source: `${factor} * (${joinTerms(innerTerms)})`,
    target: joinTerms(
      innerTerms.map((term) =>
        multiplyRenderedTerms(factorCoefficient, factorVariables, parseRenderedTerm(term).coefficient, parseRenderedTerm(term).factors)
      )
    ),
    trace: ['distribute one monomial over a sum']
  }
}

function generateExpandMonomialTimesParenthesizedProductExercise(
  difficultyBand: DifficultyBand,
  randomSource: RandomSource
): ExerciseDraft {
  const variables = pickDistinct(randomSource, baseVariables, 4)
  const outerLeft = renderMonomial(randomInt(randomSource, 2, 4 + difficultyBand), [variables[0] ?? 'a'])
  const outerRightFactors = [variables[1] ?? 'b']
  const innerTerms = [
    renderMonomial(1, [variables[2] ?? 'c']),
    renderMonomial(randomInt(randomSource, 2, 3 + difficultyBand), [variables[3] ?? 'd'])
  ]

  if (difficultyBand >= 4) {
    const secondInnerTerm = innerTerms[1]
    if (secondInnerTerm) {
      innerTerms[1] = flipTermSign(secondInnerTerm)
    }
  }

  const leftTerm = parseRenderedTerm(outerLeft)
  const features: ExerciseFeature[] = ['implicit-product']

  if (difficultyBand >= 4) {
    features.push('negative-coefficient')
  }

  return {
    topic: 'expand-monomial-times-parenthesized-product',
    difficultyBand,
    features,
    source: `${outerLeft} * (${joinTerms(innerTerms)}) * ${renderMonomial(1, outerRightFactors)}`,
    target: joinTerms(
      innerTerms.map((term) => {
        const parsed = parseRenderedTerm(term)
        return multiplyRenderedTerms(
          leftTerm.coefficient,
          [...leftTerm.factors, ...outerRightFactors],
          parsed.coefficient,
          parsed.factors
        )
      })
    ),
    trace: ['expand one parenthesized product with outer factors']
  }
}

function generateExpandBinomialTimesBinomialExercise(
  difficultyBand: DifficultyBand,
  randomSource: RandomSource
): ExerciseDraft {
  const variables = pickDistinct(randomSource, baseVariables, 3)
  const leftTerms = [
    renderMonomial(1, [variables[0] ?? 'x']),
    renderMonomial(randomInt(randomSource, 1, 3 + difficultyBand), [variables[1] ?? 'y'])
  ]
  const rightTerms = [
    renderMonomial(1, [difficultyBand >= 4 ? variables[1] ?? 'y' : variables[2] ?? 'z']),
    renderMonomial(randomInt(randomSource, 2, 4 + difficultyBand), [variables[0] ?? 'x'])
  ]
  const products = leftTerms.flatMap((leftTerm) =>
    rightTerms.map((rightTerm) => {
      const left = parseRenderedTerm(leftTerm)
      const right = parseRenderedTerm(rightTerm)
      return multiplyRenderedTerms(left.coefficient, left.factors, right.coefficient, right.factors)
    })
  )
  const features: ExerciseFeature[] = ['split-coefficient']

  if (difficultyBand >= 4) {
    features.push('variable-overlap', 'follow-up-combine')
  }

  return {
    topic: 'expand-binomial-times-binomial',
    difficultyBand,
    features,
    source: `(${joinTerms(leftTerms)}) * (${joinTerms(rightTerms)})`,
    target: joinTerms(products),
    trace: ['expand a binomial product']
  }
}

function generateSignedProductExercise(
  difficultyBand: DifficultyBand,
  randomSource: RandomSource
): ExerciseDraft {
  const variables = pickDistinct(randomSource, baseVariables, 3)
  const baseFactors = [variables[0] ?? 'a', variables[1] ?? 'b']
  const factorOne = -randomInt(randomSource, 2, 4 + difficultyBand)
  const factorTwo = randomInt(randomSource, 2, 5 + difficultyBand)
  const productSource = `${renderMonomial(factorOne, baseFactors)} * ${renderMonomial(factorTwo, [variables[1] ?? 'b'])}`
  const productTarget = multiplyRenderedTerms(factorOne, baseFactors, factorTwo, [variables[1] ?? 'b'])
  const productTerm = parseRenderedTerm(productTarget)
  const combineCoefficient = randomInt(randomSource, 1, Math.max(1, Math.abs(productTerm.coefficient) - 1))
  const combineTerm = renderMonomial(combineCoefficient, compressFactors(productTerm.factors))
  const sourceSecondTerm = difficultyBand >= 3 ? flipTermSign(combineTerm) : combineTerm
  const sourceTerms = [productSource, sourceSecondTerm]
  const combinedCoefficient =
    productTerm.coefficient + parseRenderedTerm(sourceSecondTerm).coefficient
  const targetTerms = [renderMonomial(combinedCoefficient, compressFactors(productTerm.factors))]

  return {
    topic: 'signed-product-with-follow-up-combine',
    difficultyBand,
    features: ['negative-coefficient', 'follow-up-combine', 'power-notation'],
    source: joinTerms(sourceTerms),
    target: joinTerms(targetTerms),
    trace: ['simplify a signed product and combine matching terms']
  }
}

function generateChallengeExercise(
  difficultyBand: DifficultyBand,
  randomSource: RandomSource
): ExerciseDraft {
  const variables = pickDistinct(randomSource, baseVariables, 4)
  const factor = renderMonomial(randomInt(randomSource, 2, 5), [variables[0] ?? 'a'])
  const inner = [
    renderMonomial(1, [variables[1] ?? 'b']),
    renderMonomial(randomInt(randomSource, 2, 4), [variables[2] ?? 'c'])
  ]
  const tail = renderMonomial(randomInt(randomSource, 2, 5), [variables[0] ?? 'a', variables[3] ?? 'd'])
  const distributed = inner.map((term) => {
    const parsed = parseRenderedTerm(term)
    return multiplyRenderedTerms(parseRenderedTerm(factor).coefficient, parseRenderedTerm(factor).factors, parsed.coefficient, parsed.factors)
  })

  return {
    topic: 'challenge-mixed-expressions',
    difficultyBand: Math.max(5, difficultyBand) as DifficultyBand,
    features: ['challenge', 'implicit-product', 'follow-up-combine'],
    source: `${factor} * (${joinTerms(inner)}) + ${tail}`,
    target: joinTerms([...distributed, tail]),
    trace: ['challenge expression composed from exercise-list style patterns']
  }
}

function buildLikeTermGroup(options: {
  coefficient: number
  expandedTerms: number
  factorKey: string
  forceNegativePart: boolean
}) {
  const parts = splitCoefficient(options.coefficient, options.expandedTerms, options.forceNegativePart)

  return {
    coefficient: parts.reduce((sum, part) => sum + part, 0),
    factorKey: options.factorKey,
    hasNegativePart: parts.some((part) => part < 0),
    sourceTerms: parts.map((part) => renderMonomial(part, [options.factorKey]))
  }
}

function splitCoefficient(total: number, partCount: number, forceNegativePart: boolean): number[] {
  if (partCount <= 1) return [total]

  const first = Math.max(1, Math.floor(total / 2))
  const second = total - first
  const parts = [first, second]

  while (parts.length < partCount) {
    parts.push(1)
    parts[0] = (parts[0] ?? 1) - 1
  }

  if (forceNegativePart) {
    parts[0] = (parts[0] ?? 0) + 2
    parts[1] = (parts[1] ?? 0) - 2
  }

  return parts
}

function scoreDifficulty(draft: ExerciseDraft): number {
  const structuralScore = draft.source.split(/[+-]/).filter(Boolean).length * 2
  const featureScore = draft.features.length * 3
  const arithmeticScore = draft.source.match(/\d+/g)?.length ?? 0

  return structuralScore + featureScore + arithmeticScore + draft.difficultyBand * 4
}
function createSeed(topic: ExerciseTopic, difficultyBand: DifficultyBand, randomSource: RandomSource) {
  return `${topic}-${difficultyBand}-${Math.floor(randomSource.next() * 1_000_000)}`
}

function pickDistinct<T>(randomSource: RandomSource, items: readonly T[], count: number): T[] {
  const pool = [...items]
  const picked: T[] = []

  while (picked.length < count && pool.length > 0) {
    const index = randomInt(randomSource, 0, pool.length - 1)
    const [item] = pool.splice(index, 1)
    if (item !== undefined) {
      picked.push(item)
    }
  }

  return picked
}

function randomInt(randomSource: RandomSource, min: number, max: number) {
  const span = max - min + 1
  return Math.floor(randomSource.next() * span) + min
}

function joinTerms(terms: string[]) {
  return terms.reduce((expression, term, index) => {
    const trimmed = term.trim()
    if (index === 0) return trimmed
    if (trimmed.startsWith('-')) return `${expression} - ${trimmed.slice(1)}`
    return `${expression} + ${trimmed}`
  }, '')
}

function renderMonomial(coefficient: number, factors: string[]) {
  const normalizedFactors = factors.flatMap((factor) => expandCompressedFactor(factor))
  const coefficientPrefix =
    normalizedFactors.length === 0 || Math.abs(coefficient) !== 1 ? `${coefficient}` : coefficient < 0 ? '-' : ''
  const factorPart = compressFactors(normalizedFactors).join('*')

  if (!factorPart) return `${coefficient}`
  if (!coefficientPrefix) return factorPart
  if (coefficientPrefix === '-') return `-${factorPart}`
  return `${coefficientPrefix}*${factorPart}`
}

function renderMonomialExpanded(coefficient: number, factors: string[]) {
  const normalizedFactors = factors.flatMap((factor) => expandCompressedFactor(factor))
  const coefficientPrefix =
    normalizedFactors.length === 0 || Math.abs(coefficient) !== 1 ? `${coefficient}` : coefficient < 0 ? '-' : ''
  const factorPart = normalizedFactors.join('*')

  if (!factorPart) return `${coefficient}`
  if (!coefficientPrefix) return factorPart
  if (coefficientPrefix === '-') return `-${factorPart}`
  return `${coefficientPrefix}*${factorPart}`
}

function expandCompressedFactor(factor: string) {
  const [symbol, power] = factor.split('^')
  const exponent = Number(power ?? '1')

  return Array.from({ length: Number.isFinite(exponent) ? exponent : 1 }, () => symbol ?? factor)
}

function compressFactors(factors: string[]) {
  const counts = new Map<string, number>()

  for (const factor of factors) {
    counts.set(factor, (counts.get(factor) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([factor, count]) => (count > 1 ? `${factor}^${count}` : factor))
}

function flipTermSign(term: string) {
  return term.startsWith('-') ? term.slice(1) : `-${term}`
}

function parseRenderedTerm(term: string) {
  const normalized = term.replace(/\s+/g, '')
  const factorParts = normalized.split('*').filter(Boolean)

  if (!factorParts.length) {
    return { coefficient: 0, factors: [] as string[] }
  }

  const [first, ...rest] = factorParts

  if (/^-?\d+$/.test(first ?? '')) {
    return {
      coefficient: Number(first),
      factors: rest.flatMap((part) => expandCompressedFactor(part))
    }
  }

  if ((first ?? '').startsWith('-')) {
    return {
      coefficient: -1,
      factors: [first?.slice(1) ?? '', ...rest].flatMap((part) => expandCompressedFactor(part))
    }
  }

  return {
    coefficient: 1,
    factors: factorParts.flatMap((part) => expandCompressedFactor(part))
  }
}

function multiplyRenderedTerms(
  leftCoefficient: number,
  leftFactors: string[],
  rightCoefficient: number,
  rightFactors: string[]
) {
  return renderMonomial(leftCoefficient * rightCoefficient, [...leftFactors, ...rightFactors])
}
