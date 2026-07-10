import type { Point } from './triangleTypes'

export function canonicalTrianglePoints(side1: number, side2: number, angleDeg: number): [Point, Point, Point] {
  const a: Point = { x: 0, y: 0 }
  const b: Point = { x: side1, y: 0 }
  const angleRad = (angleDeg * Math.PI) / 180
  const c: Point = { x: side2 * Math.cos(angleRad), y: side2 * Math.sin(angleRad) }
  return [a, b, c]
}

function rotatePoint(point: Point, angleDeg: number, center: Point): Point {
  const angleRad = (angleDeg * Math.PI) / 180
  const x0 = point.x - center.x
  const y0 = point.y - center.y
  const xr = x0 * Math.cos(angleRad) - y0 * Math.sin(angleRad)
  const yr = x0 * Math.sin(angleRad) + y0 * Math.cos(angleRad)
  return { x: xr + center.x, y: yr + center.y }
}

function centroid(points: [Point, Point, Point]): Point {
  return {
    x: (points[0].x + points[1].x + points[2].x) / 3,
    y: (points[0].y + points[1].y + points[2].y) / 3
  }
}

export function rotateAroundCentroid(points: [Point, Point, Point], rotationDeg: number): [Point, Point, Point] {
  const center = centroid(points)
  return points.map((point) => rotatePoint(point, rotationDeg, center)) as [Point, Point, Point]
}

export function normalizeAndScaleTriangles(
  points1: [Point, Point, Point],
  points2: [Point, Point, Point],
  margin = 10,
  viewboxSize = 200
): { t1: [Point, Point, Point]; t2: [Point, Point, Point] } {
  const allPoints = [...points1, ...points2]
  const minX = Math.min(...allPoints.map((p) => p.x))
  const maxX = Math.max(...allPoints.map((p) => p.x))
  const minY = Math.min(...allPoints.map((p) => p.y))
  const maxY = Math.max(...allPoints.map((p) => p.y))
  const width = maxX - minX || 1
  const height = maxY - minY || 1
  const scale = Math.min((viewboxSize - 2 * margin) / width, (viewboxSize - 2 * margin) / height)

  function transform(point: Point): Point {
    return {
      x: (point.x - minX) * scale + margin,
      y: (point.y - minY) * scale + margin
    }
  }

  return {
    t1: points1.map(transform) as [Point, Point, Point],
    t2: points2.map(transform) as [Point, Point, Point]
  }
}

function unit(dx: number, dy: number): Point {
  const d = Math.hypot(dx, dy)
  return d ? { x: dx / d, y: dy / d } : { x: 0, y: 0 }
}

export function angleArcPoints(vertex: Point, toward1: Point, toward2: Point, radius: number): { p1: Point; p2: Point } {
  const u1 = unit(toward1.x - vertex.x, toward1.y - vertex.y)
  const u2 = unit(toward2.x - vertex.x, toward2.y - vertex.y)
  return {
    p1: { x: vertex.x + u1.x * radius, y: vertex.y + u1.y * radius },
    p2: { x: vertex.x + u2.x * radius, y: vertex.y + u2.y * radius }
  }
}

export function getSweepFlag(vertex: Point, p1: Point, p2: Point): 0 | 1 {
  const v1x = p1.x - vertex.x
  const v1y = p1.y - vertex.y
  const v2x = p2.x - vertex.x
  const v2y = p2.y - vertex.y
  const cross = v1x * v2y - v1y * v2x
  return cross > 0 ? 1 : 0
}

export function arcPath(p1: Point, p2: Point, radius: number, sweepFlag: 0 | 1): string {
  return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${radius.toFixed(2)} ${radius.toFixed(2)} 0 0 ${sweepFlag} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
}
