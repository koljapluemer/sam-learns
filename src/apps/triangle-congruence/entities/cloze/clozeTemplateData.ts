import type { ClozeTemplateData } from './clozeTypes'

export const clozeTemplates: ClozeTemplateData[] = [
  {
    topicId: 'sss',
    content: 'Zwei Dreiecke sind zueinander kongruent, wenn sie in allen drei Seitenlängen übereinstimmen.',
    possibleGapIndices: [0, 1, 3, 4, 8, 9, 10, 11]
  },
  {
    topicId: 'sws',
    content:
      'Zwei Dreiecke sind zueinander kongruent, wenn sie in den Längen zweier Seiten und der Größe des von diesen Seiten eingeschlossenen Winkels übereinstimmen.',
    possibleGapIndices: [0, 1, 3, 4, 9, 10, 11, 14, 18, 19, 20, 21]
  },
  {
    topicId: 'wsw',
    content:
      'Zwei Dreiecke sind zueinander kongruent, wenn sie in der Länge einer Seite und in den Größen der anliegenden Winkel übereinstimmen.',
    possibleGapIndices: [0, 1, 3, 4, 9, 10, 11, 12, 15, 17, 18, 19]
  },
  {
    topicId: 'ssw',
    content:
      'Zwei Dreiecke sind zueinander kongruent, wenn sie in den Längen zweier Seiten und der Größe des Winkels, der der längeren der beiden Seiten gegenüberliegt, übereinstimmen.',
    possibleGapIndices: [0, 1, 3, 4, 9, 10, 11, 14, 16, 19, 21, 22, 23, 24]
  }
]

export const distractorWords: string[] = [
  'Zwei',
  'Dreiecke',
  'zueinander',
  'kongruent',
  'allen',
  'drei',
  'Seitenlängen',
  'übereinstimmen',
  'Längen',
  'zweier',
  'Seiten',
  'Größe',
  'eingeschlossenen',
  'Winkels',
  'Länge',
  'einer',
  'Seite',
  'und',
  'Größen',
  'anliegenden',
  'Winkel',
  'längeren',
  'beiden',
  'gegenüberliegt'
]
