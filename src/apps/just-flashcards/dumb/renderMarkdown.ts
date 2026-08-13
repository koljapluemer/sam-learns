import { marked } from 'marked'

const ALLOWED_TAGS = new Set([
  'A', 'BLOCKQUOTE', 'BR', 'CODE', 'DEL', 'EM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'HR', 'LI', 'OL', 'P', 'PRE', 'STRONG', 'UL'
])

export function renderMarkdown(source: string): string {
  const document = new DOMParser().parseFromString(marked.parse(source, { async: false }), 'text/html')

  for (const element of [...document.body.querySelectorAll('*')]) {
    if (!ALLOWED_TAGS.has(element.tagName)) {
      element.replaceWith(...element.childNodes)
      continue
    }

    for (const attribute of [...element.attributes]) {
      if (element.tagName !== 'A' || attribute.name !== 'href') element.removeAttribute(attribute.name)
    }

    if (element instanceof HTMLAnchorElement) {
      const url = element.getAttribute('href') ?? ''
      if (!/^(https?:|mailto:)/i.test(url)) element.removeAttribute('href')
      element.target = '_blank'
      element.rel = 'noreferrer noopener'
    }
  }

  return document.body.innerHTML
}
