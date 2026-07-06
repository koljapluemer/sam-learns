import { normalizeExpression } from './mathEngine'

export type ExerciseSyntaxNode =
  | { type: 'number'; value: string }
  | { type: 'symbol'; value: string }
  | { type: 'group'; expression: ExerciseSyntaxNode }
  | { type: 'unary'; operator: '-'; operand: ExerciseSyntaxNode }
  | {
      type: 'binary'
      operator: '+' | '-' | '*' | '/' | '^'
      left: ExerciseSyntaxNode
      right: ExerciseSyntaxNode
    }

type Token =
  | { type: 'number'; value: string }
  | { type: 'symbol'; value: string }
  | { type: 'operator'; value: '+' | '-' | '*' | '/' | '^' }
  | { type: 'leftParen'; value: '(' }
  | { type: 'rightParen'; value: ')' }

export function parseExerciseSyntax(expression: string): ExerciseSyntaxNode {
  const tokens = tokenizeExpression(normalizeExpression(expression))
  const parser = new SyntaxParser(tokens)
  const parsed = parser.parseExpression()

  if (!parser.isAtEnd()) {
    throw new Error('Unexpected tokens remaining')
  }

  return parsed
}

function tokenizeExpression(expression: string): Token[] {
  const tokens: Token[] = []
  let index = 0

  while (index < expression.length) {
    const char = expression[index]
    if (!char) break

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
      tokens.push({ type: 'leftParen', value: '(' })
      index += 1
      continue
    }

    if (char === ')') {
      tokens.push({ type: 'rightParen', value: ')' })
      index += 1
      continue
    }

    if (char === '+' || char === '-' || char === '*' || char === '/' || char === '^') {
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

class SyntaxParser {
  private readonly tokens: Token[]
  private index: number

  constructor(tokens: Token[], index = 0) {
    this.tokens = tokens
    this.index = index
  }

  parseExpression(): ExerciseSyntaxNode {
    return this.parseSum()
  }

  isAtEnd() {
    return this.index >= this.tokens.length
  }

  private parseSum(): ExerciseSyntaxNode {
    let node = this.parseProduct()

    while (this.matchOperator('+') || this.matchOperator('-')) {
      const operator = this.previousOperator()
      const right = this.parseProduct()
      node = {
        type: 'binary',
        operator,
        left: node,
        right
      }
    }

    return node
  }

  private parseProduct(): ExerciseSyntaxNode {
    let node = this.parsePower()

    while (this.matchOperator('*') || this.matchOperator('/')) {
      const operator = this.previousOperator()
      const right = this.parsePower()
      node = {
        type: 'binary',
        operator,
        left: node,
        right
      }
    }

    return node
  }

  private parsePower(): ExerciseSyntaxNode {
    let node = this.parseUnary()

    if (this.matchOperator('^')) {
      node = {
        type: 'binary',
        operator: '^',
        left: node,
        right: this.parsePower()
      }
    }

    return node
  }

  private parseUnary(): ExerciseSyntaxNode {
    if (this.matchOperator('-')) {
      return {
        type: 'unary',
        operator: '-',
        operand: this.parseUnary()
      }
    }

    return this.parsePrimary()
  }

  private parsePrimary(): ExerciseSyntaxNode {
    const token = this.peek()

    if (!token) {
      throw new Error('Unexpected end of expression')
    }

    if (token.type === 'number') {
      this.index += 1
      return { type: 'number', value: token.value }
    }

    if (token.type === 'symbol') {
      this.index += 1
      return { type: 'symbol', value: token.value }
    }

    if (token.type === 'leftParen') {
      this.index += 1
      const expression = this.parseExpression()
      this.expectRightParen()
      return { type: 'group', expression }
    }

    throw new Error(`Unexpected token ${token.value}`)
  }

  private expectRightParen() {
    const token = this.peek()

    if (!token || token.type !== 'rightParen') {
      throw new Error('Missing closing parenthesis')
    }

    this.index += 1
  }

  private matchOperator(operator: Token['value']) {
    const token = this.peek()

    if (token?.type === 'operator' && token.value === operator) {
      this.index += 1
      return true
    }

    return false
  }

  private previousOperator() {
    const token = this.tokens[this.index - 1]
    if (!token || token.type !== 'operator') {
      throw new Error('Missing operator')
    }

    return token.value
  }

  private peek() {
    return this.tokens[this.index]
  }
}
