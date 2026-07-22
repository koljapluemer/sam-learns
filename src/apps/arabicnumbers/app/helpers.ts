// Pure helpers, ported unchanged from linguanodon's arabicnumbers app/helpers.js.

export function calculateColor(level: number): string {
  // make the bar go from 0=yellow to 10=green to 100=light-blue smoothly
  if (level < 0) level = 0
  if (level > 100) level = 100

  const levels: Record<number, { h: number; s: number; l: number }> = {
    0: { h: 37, s: 89, l: 53 },
    10: { h: 106, s: 89, l: 53 },
    100: { h: 205, s: 89, l: 53 }
  }

  if (levels[level]) {
    const { h, s, l } = levels[level]
    return `hsl(${h}, ${s}%, ${l}%)`
  }

  const lowerLevel = Math.floor(level / 10) * 10
  const upperLevel = Math.ceil(level / 10) * 10

  const lowerColor = levels[lowerLevel] ?? levels[0]
  const upperColor = levels[upperLevel] ?? levels[100]

  const fraction = (level - lowerLevel) / (upperLevel - lowerLevel)

  const h = lowerColor.h + (upperColor.h - lowerColor.h) * fraction
  const s = lowerColor.s + (upperColor.s - lowerColor.s) * fraction
  const l = lowerColor.l + (upperColor.l - lowerColor.l) * fraction

  return `hsl(${h}, ${s}%, ${l}%)`
}

const ARABIC_NUMERALS: Record<string, string> = {
  '0': '٠',
  '1': '١',
  '2': '٢',
  '3': '٣',
  '4': '٤',
  '5': '٥',
  '6': '٦',
  '7': '٧',
  '8': '٨',
  '9': '٩'
}

export function convertNumberToArabicScript(numberValue: number): string {
  let arabicNumber = ''
  for (const digit of numberValue.toString()) {
    arabicNumber += ARABIC_NUMERALS[digit] ?? digit
  }
  return arabicNumber
}
