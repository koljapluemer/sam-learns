import {
  ComputeEngine,
  isFunction,
  isNumber,
  isSymbol,
  type BoxedExpression
} from '@cortex-js/compute-engine'

const computeEngine = new ComputeEngine()

export function parseExpression(expression: string): BoxedExpression {
  const normalizedExpression = normalizeExpression(expression)

  if (normalizedExpression.length === 0) {
    throw new Error('Expression is empty')
  }

  const parsedExpression = computeEngine.parse(normalizedExpression)

  if (!parsedExpression.isValid || parsedExpression.errors.length > 0 || parsedExpression.is('Nothing')) {
    throw new Error('Expression is invalid')
  }

  return parsedExpression
}

export function toLatex(expression: string): string {
  return parseExpression(expression).latex
}

export function normalizeExpression(expression: string): string {
  const normalizedSymbols = expression
    .replace(/−/g, '-')
    .replace(/[·⋅×]/g, '*')
    .trim()

  return insertImplicitMultiplication(tokenizeExpression(normalizedSymbols))
}

type Token =
  | { type: 'number'; value: string }
  | { type: 'symbol'; value: string }
  | { type: 'operator'; value: '+' | '-' | '*' | '/' | '^' }
  | { type: 'leftParen'; value: '(' }
  | { type: 'rightParen'; value: ')' }

type TokenOperator = Token extends { type: 'operator'; value: infer Value } ? Value : never

function tokenizeExpression(expression: string): Token[] {
  const tokens: Token[] = []
  let index = 0

  while (index < expression.length) {
    const char = expression[index]
    if (!char) break

    if (/\s/.test(char)) {
      index += 1
      continue
    }

    if (isNumberStart(expression, index)) {
      const end = findNumberEnd(expression, index)
      tokens.push({ type: 'number', value: expression.slice(index, end) })
      index = end
      continue
    }

    if (/[a-zA-Z]/.test(char)) {
      tokens.push({ type: 'symbol', value: char })
      index += 1
      continue
    }

    if (char === '(') {
      tokens.push({ type: 'leftParen', value: char })
      index += 1
      continue
    }

    if (char === ')') {
      tokens.push({ type: 'rightParen', value: char })
      index += 1
      continue
    }

    if (isOperator(char)) {
      tokens.push({ type: 'operator', value: char })
      index += 1
      continue
    }

    throw new Error(`Unsupported token: ${char}`)
  }

  return tokens
}

function isNumberStart(expression: string, index: number): boolean {
  const char = expression[index]
  const nextChar = expression[index + 1]

  if (!char) return false
  if (/[0-9]/.test(char)) return true

  return char === '.' && Boolean(nextChar && /[0-9]/.test(nextChar))
}

function findNumberEnd(expression: string, start: number): number {
  let index = start
  let hasDecimalPoint = false

  if (expression[index] === '.') {
    hasDecimalPoint = true
    index += 1
  }

  while (index < expression.length) {
    const char = expression[index]
    if (!char) break

    if (char === '.') {
      if (hasDecimalPoint) break
      hasDecimalPoint = true
      index += 1
      continue
    }

    if (!/[0-9]/.test(char)) break

    index += 1
  }

  return index
}

function isOperator(char: string): char is TokenOperator {
  return char === '+' || char === '-' || char === '*' || char === '/' || char === '^'
}

function insertImplicitMultiplication(tokens: Token[]): string {
  const normalized: string[] = []

  tokens.forEach((token, index) => {
    const previousToken = tokens[index - 1]

    if (previousToken && needsImplicitMultiplication(previousToken, token)) {
      normalized.push('*')
    }

    normalized.push(token.value)
  })

  return normalized.join('')
}

function needsImplicitMultiplication(left: Token, right: Token): boolean {
  return canEndFactor(left) && canStartFactor(right)
}

function canEndFactor(token: Token): boolean {
  return token.type === 'number' || token.type === 'symbol' || token.type === 'rightParen'
}

function canStartFactor(token: Token): boolean {
  return token.type === 'number' || token.type === 'symbol' || token.type === 'leftParen'
}

export function isEquivalent(left: string, right: string): boolean {
  try {
    return parseExpression(left).isEqual(parseExpression(right)) === true
  } catch {
    return false
  }
}

export function expressionComplexity(expression: string): number {
  return scoreNode(parseExpression(expression))
}

function scoreNode(node: BoxedExpression): number {
  let score = baseScore(node)

  if (isFunction(node)) {
    for (const child of node.ops) {
      score += scoreNode(child)
    }
  }

  return score
}

function baseScore(node: BoxedExpression): number {
  const operator = node.operator

  if (operator === 'Add' || operator === 'Multiply') return 3
  if (operator === 'Negate') return 4
  if (operator === 'Divide') return 5
  if (operator === 'Power' || operator === 'Square') return 4

  if (isSymbol(node) || isNumber(node)) return 1

  return 2
}
