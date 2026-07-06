import { describe, expect, it } from 'vitest'
import {
  expressionComplexity,
  isEquivalent,
  normalizeExpression,
  parseExpression,
  toLatex
} from './mathEngine'
import { toDisplayLatex } from './exerciseDisplay'

describe('normalizeExpression', () => {
  it.each([
    ['3ab', '3*a*b'],
    ['25+15⋅a⋅b', '25+15*a*b'],
    ['2(a+b)', '2*(a+b)'],
    ['(a+b)(c+2b)', '(a+b)*(c+2*b)'],
    ['a2', 'a*2'],
    ['1.5ab', '1.5*a*b'],
    ['−3ab', '-3*a*b'],
    ['a b', 'a*b'],
    ['2x y', '2*x*y'],
    ['2(a+b)c', '2*(a+b)*c']
  ])('normalizes %s as %s', (input, expected) => {
    expect(normalizeExpression(input)).toBe(expected)
  })
})

describe('parseExpression', () => {
  it.each([
    ['3ab', ['Multiply', 3, 'a', 'b']],
    ['25+15ab', ['Add', ['Multiply', 15, 'a', 'b'], 25]],
    ['2(a+b)c', ['Multiply', 2, 'c', ['Add', 'a', 'b']]],
    ['(a+b)(c+2b)', ['Multiply', ['Add', 'a', 'b'], ['Add', ['Multiply', 2, 'b'], 'c']]],
    ['1.5ab', ['Multiply', 1.5, 'a', 'b']],
    ['2a^2b', ['Multiply', 2, 'b', ['Power', 'a', 2]]]
  ])('parses %s into the expected expression tree', (input, expected) => {
    expect(parseExpression(input).json).toEqual(expected)
  })

  it.each(['2+', '((a+b)', '2..3a', 'a//b'])('rejects %s', (input) => {
    expect(() => parseExpression(input)).toThrow()
  })
})

describe('isEquivalent', () => {
  it.each([
    ['25+15⋅a⋅b', '25+15ab'],
    ['5*(5+3*a*b)', '25+15ab'],
    ['3*(2*x-4*y)', '6x-12y'],
    ['(a+b)(c+2b)', 'a*c + 2*a*b + b*c + 2*b^2'],
    ['3ab', '3 a b']
  ])('treats %s and %s as equal', (left, right) => {
    expect(isEquivalent(left, right)).toBe(true)
  })
})

describe('expressionComplexity', () => {
  it('scores distributed form as simpler than the original product form', () => {
    expect(expressionComplexity('6x-12y')).toBeLessThan(expressionComplexity('3*(2*x-4*y)'))
  })

  it('treats compact and explicit products as equal', () => {
    expect(expressionComplexity('25+15ab')).toBeLessThan(expressionComplexity('5*(5+3*a*b)'))
  })
})

describe('toLatex', () => {
  it('canonicalizes equivalent expressions to the same semantic latex', () => {
    expect(toLatex('4*z + (5*n + a)')).toBe(toLatex('4*z + 5*n + a'))
  })
})

describe('toDisplayLatex', () => {
  it('keeps source and solution visually distinct when the only difference is redundant parentheses', () => {
    expect(toDisplayLatex('4*z + (5*n + a)')).not.toBe(toDisplayLatex('4*z + 5*n + a'))
  })
})
