import { parseExerciseSyntax, type ExerciseSyntaxNode } from './exerciseSyntax'

export function toDisplayLatex(expression: string): string {
  return renderNode(parseExerciseSyntax(expression))
}

function renderNode(node: ExerciseSyntaxNode, parentPrecedence = 0): string {
  if (node.type === 'number' || node.type === 'symbol') {
    return node.value
  }

  if (node.type === 'group') {
    return `\\left(${renderNode(node.expression)}\\right)`
  }

  if (node.type === 'unary') {
    const renderedOperand = renderNode(node.operand, 4)
    return `-${renderedOperand}`
  }

  if (node.operator === '^') {
    const base = renderBase(node.left)
    const exponent = renderNode(node.right)
    return `${base}^{${exponent}}`
  }

  if (node.operator === '*') {
    return wrapIfNeeded(`${renderNode(node.left, 2)} \\cdot ${renderNode(node.right, 2)}`, 2, parentPrecedence)
  }

  if (node.operator === '/') {
    return wrapIfNeeded(`\\frac{${renderNode(node.left)}}{${renderNode(node.right)}}`, 2, parentPrecedence)
  }

  if (node.operator === '+') {
    return wrapIfNeeded(`${renderNode(node.left, 1)} + ${renderNode(node.right, 1)}`, 1, parentPrecedence)
  }

  return wrapIfNeeded(`${renderNode(node.left, 1)} - ${renderNode(node.right, 1)}`, 1, parentPrecedence)
}

function renderBase(node: ExerciseSyntaxNode) {
  if (node.type === 'number' || node.type === 'symbol') {
    return node.value
  }

  if (node.type === 'group') {
    return `\\left(${renderNode(node.expression)}\\right)`
  }

  return `\\left(${renderNode(node)}\\right)`
}

function wrapIfNeeded(rendered: string, precedence: number, parentPrecedence: number) {
  if (precedence < parentPrecedence) {
    return `\\left(${rendered}\\right)`
  }

  return rendered
}
