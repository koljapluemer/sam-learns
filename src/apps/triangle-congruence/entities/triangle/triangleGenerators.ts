import {
  angleArcPoints,
  canonicalTrianglePoints,
  getSweepFlag,
  normalizeAndScaleTriangles,
  rotateAroundCentroid
} from './triangleGeometry'
import type { HighlightedAngleArc, HighlightedSide, IdentifyTheoremExercise, Point, TriangleFigureData, TriangleTheorem } from './triangleTypes'

const ANGLE_ARC_RADIUS = 28

function uniform(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function buildAngleArc(vertex: Point, toward1: Point, toward2: Point): HighlightedAngleArc {
  const { p1, p2 } = angleArcPoints(vertex, toward1, toward2, ANGLE_ARC_RADIUS)
  return { center: vertex, p1, p2, radius: ANGLE_ARC_RADIUS, sweepFlag: getSweepFlag(vertex, p1, p2) }
}

function buildFigure(points: [Point, Point, Point], sides: HighlightedSide[], angles: HighlightedAngleArc[]): TriangleFigureData {
  return { points, highlightedSides: sides, highlightedAngles: angles }
}

function generateTwoFigures(
  canonicalPoints: [Point, Point, Point],
  buildHighlights: (points: [Point, Point, Point]) => { sides: HighlightedSide[]; angles: HighlightedAngleArc[] }
): { figure1: TriangleFigureData; figure2: TriangleFigureData } {
  const rotation = uniform(30, 330)
  const rotatedPoints = rotateAroundCentroid(canonicalPoints, rotation)
  const { t1, t2 } = normalizeAndScaleTriangles(canonicalPoints, rotatedPoints)

  const highlights1 = buildHighlights(t1)
  const highlights2 = buildHighlights(t2)

  return {
    figure1: buildFigure(t1, highlights1.sides, highlights1.angles),
    figure2: buildFigure(t2, highlights2.sides, highlights2.angles)
  }
}

export function generateSssTriangle(): IdentifyTheoremExercise {
  const side = uniform(50, 100)
  const angle = 60
  const points = canonicalTrianglePoints(side, side, angle)

  const { figure1, figure2 } = generateTwoFigures(points, (p) => ({
    sides: [
      { from: p[0], to: p[1] },
      { from: p[1], to: p[2] },
      { from: p[2], to: p[0] }
    ],
    angles: []
  }))

  return { theorem: 'sss', figure1, figure2 }
}

export function generateSwsTriangle(): IdentifyTheoremExercise {
  const side1 = uniform(50, 100)
  const side2 = uniform(50, 100)
  const angle = uniform(30, 150)
  const points = canonicalTrianglePoints(side1, side2, angle)

  const { figure1, figure2 } = generateTwoFigures(points, (p) => ({
    sides: [
      { from: p[0], to: p[1] },
      { from: p[0], to: p[2] }
    ],
    angles: [buildAngleArc(p[0], p[1], p[2])]
  }))

  return { theorem: 'sws', figure1, figure2 }
}

export function generateWswTriangle(): IdentifyTheoremExercise {
  const side = uniform(50, 100)
  let angle1 = uniform(30, 60)
  let angle2 = uniform(30, 60)
  while (angle1 + angle2 >= 150) {
    angle1 = uniform(30, 60)
    angle2 = uniform(30, 60)
  }
  const angle3 = 180 - angle1 - angle2

  const angle1Rad = (angle1 * Math.PI) / 180
  const angle3Rad = (angle3 * Math.PI) / 180
  const side1 = (side * Math.sin(angle1Rad)) / Math.sin(angle3Rad)

  const points = canonicalTrianglePoints(side, side1, angle1)

  const { figure1, figure2 } = generateTwoFigures(points, (p) => ({
    sides: [{ from: p[0], to: p[1] }],
    angles: [buildAngleArc(p[0], p[1], p[2]), buildAngleArc(p[1], p[0], p[2])]
  }))

  return { theorem: 'wsw', figure1, figure2 }
}

export function generateSswTriangle(): IdentifyTheoremExercise {
  let side1 = uniform(50, 100)
  let side2 = uniform(50, 100)

  if (side1 > side2) {
    if (side1 < side2 * 1.3) {
      side1 = side2 * 1.3
    }
  } else {
    if (side2 < side1 * 1.3) {
      side2 = side1 * 1.3
    }
  }

  const angle = uniform(30, 150)
  const points = canonicalTrianglePoints(side1, side2, angle)
  const longerIsSide1 = side1 >= side2

  const { figure1, figure2 } = generateTwoFigures(points, (p) =>
    longerIsSide1
      ? {
          sides: [
            { from: p[0], to: p[1] },
            { from: p[0], to: p[2] }
          ],
          angles: [buildAngleArc(p[1], p[0], p[2])]
        }
      : {
          sides: [
            { from: p[0], to: p[1] },
            { from: p[1], to: p[2] }
          ],
          angles: [buildAngleArc(p[0], p[1], p[2])]
        }
  )

  return { theorem: 'ssw', figure1, figure2 }
}

export function generateIdentifyTheoremExercise(theorem: TriangleTheorem): IdentifyTheoremExercise {
  switch (theorem) {
    case 'sss':
      return generateSssTriangle()
    case 'sws':
      return generateSwsTriangle()
    case 'wsw':
      return generateWswTriangle()
    case 'ssw':
      return generateSswTriangle()
  }
}
