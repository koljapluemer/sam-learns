export type Point = { x: number; y: number }

export type TriangleTheorem = 'sss' | 'sws' | 'wsw' | 'ssw'

export type HighlightedSide = { from: Point; to: Point }

export type HighlightedAngleArc = { center: Point; p1: Point; p2: Point; radius: number; sweepFlag: 0 | 1 }

export type TriangleFigureData = {
  points: [Point, Point, Point]
  highlightedSides: HighlightedSide[]
  highlightedAngles: HighlightedAngleArc[]
}

export type IdentifyTheoremExercise = {
  theorem: TriangleTheorem
  figure1: TriangleFigureData
  figure2: TriangleFigureData
}
