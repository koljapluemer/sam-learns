import type { ExerciseTopic } from './exerciseTypes'
import { parseExerciseSyntax, type ExerciseSyntaxNode } from './exerciseSyntax'

export function isSolvedForTopic(topic: ExerciseTopic, expression: string): boolean {
  const syntaxTree = parseExerciseSyntax(expression)

  if (topic === 'combine-like-terms') {
    return !hasLikeTermOpportunities(syntaxTree)
  }

  if (topic === 'normalize-product-powers') {
    return !hasRepeatedFactors(syntaxTree)
  }

  if (topic === 'remove-parentheses-with-sign') {
    return !hasGroupedSum(syntaxTree)
  }

  if (
    topic === 'distribute-monomial-over-sum' ||
    topic === 'expand-monomial-times-parenthesized-product' ||
    topic === 'expand-binomial-times-binomial'
  ) {
    return !hasExpandableProduct(syntaxTree)
  }

  if (topic === 'signed-product-with-follow-up-combine') {
    return !hasExpandableProduct(syntaxTree) && !hasRepeatedFactors(syntaxTree) && !hasLikeTermOpportunities(syntaxTree)
  }

  return (
    !hasGroupedSum(syntaxTree) &&
    !hasExpandableProduct(syntaxTree) &&
    !hasRepeatedFactors(syntaxTree) &&
    !hasLikeTermOpportunities(syntaxTree)
  )
}

export function hasMeaningfulParenthesesRemovalOpportunity(expression: string): boolean {
  const syntaxTree = parseExerciseSyntax(expression)

  return hasOuterMinusGroupedSum(syntaxTree) || hasGroupedSum(syntaxTree)
}

export function hasLikeTermOpportunities(expressionOrNode: string | ExerciseSyntaxNode): boolean {
  const syntaxTree =
    typeof expressionOrNode === 'string' ? parseExerciseSyntax(expressionOrNode) : expressionOrNode
  const signatures = flattenAdditiveTerms(syntaxTree)
    .map((term) => monomialSignature(term))
    .filter((signature): signature is string => signature !== null)
  const seen = new Set<string>()

  for (const signature of signatures) {
    if (seen.has(signature)) {
      return true
    }

    seen.add(signature)
  }

  return false
}

function hasGroupedSum(node: ExerciseSyntaxNode): boolean {
  if (node.type === 'group' && containsAdditiveNode(node.expression)) {
    return true
  }

  if (node.type === 'binary') {
    return hasGroupedSum(node.left) || hasGroupedSum(node.right)
  }

  if (node.type === 'unary') {
    return hasGroupedSum(node.operand)
  }

  return false
}

function hasOuterMinusGroupedSum(node: ExerciseSyntaxNode): boolean {
  if (
    node.type === 'binary' &&
    node.operator === '-' &&
    node.right.type === 'group' &&
    containsAdditiveNode(node.right.expression)
  ) {
    return true
  }

  if (node.type === 'binary') {
    return hasOuterMinusGroupedSum(node.left) || hasOuterMinusGroupedSum(node.right)
  }

  if (node.type === 'unary') {
    return hasOuterMinusGroupedSum(node.operand)
  }

  return false
}

function hasExpandableProduct(node: ExerciseSyntaxNode): boolean {
  if (
    node.type === 'binary' &&
    node.operator === '*' &&
    (containsAdditiveNode(unwrapGroup(node.left)) || containsAdditiveNode(unwrapGroup(node.right)))
  ) {
    return true
  }

  if (node.type === 'binary') {
    return hasExpandableProduct(node.left) || hasExpandableProduct(node.right)
  }

  if (node.type === 'unary') {
    return hasExpandableProduct(node.operand)
  }

  if (node.type === 'group') {
    return hasExpandableProduct(node.expression)
  }

  return false
}

function hasRepeatedFactors(node: ExerciseSyntaxNode): boolean {
  for (const term of flattenAdditiveTerms(node)) {
    const factors = flattenMultiplicativeFactors(term)
      .map((factor) => factorBaseKey(factor))
      .filter((factor): factor is string => factor !== null)
    const seen = new Set<string>()

    for (const factor of factors) {
      if (seen.has(factor)) {
        return true
      }

      seen.add(factor)
    }
  }

  if (node.type === 'binary') {
    return hasRepeatedFactors(node.left) || hasRepeatedFactors(node.right)
  }

  if (node.type === 'unary') {
    return hasRepeatedFactors(node.operand)
  }

  if (node.type === 'group') {
    return hasRepeatedFactors(node.expression)
  }

  return false
}

function containsAdditiveNode(node: ExerciseSyntaxNode): boolean {
  if (node.type === 'binary' && (node.operator === '+' || node.operator === '-')) {
    return true
  }

  if (node.type === 'group') {
    return containsAdditiveNode(node.expression)
  }

  if (node.type === 'unary') {
    return containsAdditiveNode(node.operand)
  }

  if (node.type === 'binary') {
    return containsAdditiveNode(node.left) || containsAdditiveNode(node.right)
  }

  return false
}

function flattenAdditiveTerms(node: ExerciseSyntaxNode): ExerciseSyntaxNode[] {
  if (node.type === 'binary' && (node.operator === '+' || node.operator === '-')) {
    return [...flattenAdditiveTerms(node.left), ...flattenAdditiveTerms(node.right)]
  }

  return [node]
}

function monomialSignature(node: ExerciseSyntaxNode): string | null {
  const factorMap = factorSignatureMap(node)
  if (!factorMap) return null

  return [...factorMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([factor, power]) => (power === 1 ? factor : `${factor}^${power}`))
    .join('*')
}

function factorSignatureMap(node: ExerciseSyntaxNode): Map<string, number> | null {
  if (node.type === 'group') {
    return factorSignatureMap(node.expression)
  }

  if (node.type === 'unary') {
    return factorSignatureMap(node.operand)
  }

  if (node.type === 'number') {
    return new Map()
  }

  if (node.type === 'symbol') {
    return new Map([[node.value, 1]])
  }

  if (node.type === 'binary' && node.operator === '^') {
    if (node.left.type !== 'symbol' || node.right.type !== 'number') {
      return null
    }

    const exponent = Number(node.right.value)
    if (!Number.isInteger(exponent) || exponent < 0) {
      return null
    }

    return new Map([[node.left.value, exponent]])
  }

  if (node.type === 'binary' && node.operator === '*') {
    const left = factorSignatureMap(node.left)
    const right = factorSignatureMap(node.right)
    if (!left || !right) return null

    return mergeFactorMaps(left, right)
  }

  return null
}

function mergeFactorMaps(left: Map<string, number>, right: Map<string, number>) {
  const merged = new Map(left)

  for (const [factor, power] of right.entries()) {
    merged.set(factor, (merged.get(factor) ?? 0) + power)
  }

  return merged
}

function flattenMultiplicativeFactors(node: ExerciseSyntaxNode): ExerciseSyntaxNode[] {
  if (node.type === 'binary' && node.operator === '*') {
    return [...flattenMultiplicativeFactors(node.left), ...flattenMultiplicativeFactors(node.right)]
  }

  return [node]
}

function factorBaseKey(node: ExerciseSyntaxNode): string | null {
  if (node.type === 'group') {
    return factorBaseKey(node.expression)
  }

  if (node.type === 'unary') {
    return factorBaseKey(node.operand)
  }

  if (node.type === 'symbol') {
    return node.value
  }

  if (node.type === 'binary' && node.operator === '^' && node.left.type === 'symbol') {
    return node.left.value
  }

  return null
}

function unwrapGroup(node: ExerciseSyntaxNode): ExerciseSyntaxNode {
  return node.type === 'group' ? node.expression : node
}
