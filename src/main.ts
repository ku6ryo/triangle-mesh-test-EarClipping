import "sanitize.css"
import styles from "./style.module.scss"
import { Vector2 } from "./Vector2"

function drawCircle(ctx: CanvasRenderingContext2D , center: Vector2, radius: number, color: string = "red") {
  ctx.beginPath()
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

async function drawClosedPath(ctx: CanvasRenderingContext2D, points: Vector2[], width: number = 1, color: string = "red", fillColor?: string) {
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.closePath()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  if (fillColor) {
    ctx.fillStyle = fillColor
    ctx.fill()
  }
  ctx.stroke()
}

function randomAngleDiff(divisions: number) {
  return (Math.random() - 0.5) * Math.PI * 2 / divisions * 0.5
}

/**
 * Generate points on hexagon and draw them. According to the depth paramete, it will recursively generate more points.
 * The child hexagon are outside of the parent hexagon.
 */
function drawRecursive(
  ctx: CanvasRenderingContext2D,
  center: Vector2,
  radius: number,
  divisions: number,
  startAngle: number,
  depth: number
): Vector2[] {
  if (divisions % 2 !== 0) {
    throw new Error("Divisions must be even")
  }
  if (depth === 0) {
    return []
  }
  const dAngle = Math.PI * 2 / divisions
  const points: Vector2[] = []
  for (let i = 0; i < divisions / 2; i++) {
    const angle = i * dAngle * 2 + startAngle
    const aPlus = angle + dAngle / 2
    const aMinus = angle - dAngle / 2
    const vAngle = new Vector2(Math.cos(angle), Math.sin(angle)).multiply(radius)
    const vN = new Vector2(Math.cos(aMinus) + randomAngleDiff(divisions), Math.sin(aMinus) + randomAngleDiff(divisions)).multiply(radius).add(center)
    points.push(vN)
    drawCircle(ctx, vN, 4, "#ffb900")
    const childPoints = drawRecursive(ctx, center.add(vAngle.multiply(2)), radius / 2, divisions, angle - Math.PI + dAngle, depth - 1)
    points.push(...childPoints)
    const vP = new Vector2(Math.cos(aPlus) + randomAngleDiff(divisions), Math.sin(aPlus) + randomAngleDiff(divisions)).multiply(radius).add(center)
    points.push(vP)
    drawCircle(ctx, vP, 4, "#ffb900")
  }
  return points
}

/**
 * Calculate the angle between two vectors.
 */
function calcDiffAngle(v1: Vector2, v2: Vector2) {
  const sin = v1.normalize().cross(v2.normalize())
  const cos = v1.normalize().dot(v2.normalize())
  if (sin >= 0) {
    return Math.acos(cos)
  } else {
    return 2 * Math.PI - Math.acos(cos)
  }
}

function isSameSide(a: Vector2, b: Vector2, p1: Vector2, p2: Vector2) {
  const v1 = b.sub(a)
  const v2 = p1.sub(a)
  const v3 = p2.sub(a)
  const c1 = v1.cross(v2)
  const c2 = v1.cross(v3)
  return c1 * c2 >= 0
}

function isPointInTriangle(a: Vector2, b: Vector2, c: Vector2, p: Vector2) {
  return isSameSide(a, b, c, p) && isSameSide(b, c, a, p) && isSameSide(c, a, b, p)
}

// Main logic starts here.
const appContainer = document.querySelector<HTMLButtonElement>("#app")
if (!appContainer) throw new Error("No app container found")
appContainer.classList.add(styles.app)

const canvasSize = 600
const canvas = document.createElement("canvas")
canvas.className = styles.canvas
canvas.width = canvasSize
canvas.height = canvasSize
appContainer.appendChild(canvas)

const ctx = canvas.getContext("2d")
if (!ctx) throw new Error("Failed to get canvas context")

const center = new Vector2(canvasSize / 2, canvasSize / 2)
const radius = 80
const divisions = 6
const depth = 2

;(async () => {
  // Generate points of the base polygon.
  const points = drawRecursive(ctx, center, radius, divisions, 0, depth)
  // Draw outline of the base polygon.
  await drawClosedPath(ctx, points, 4, "white")
  // Generate triangles from the points of the base polygon.
  const pointIndices = points.map((_, i) => i)
  const triangles: number[][] = []
  while (pointIndices.length > 2) {
    // Find a triangle that the corner angle is closest to 60 degrees.
    const { index: i, triangle } = pointIndices.reduce((prev, _, i) => {
      const iP = pointIndices[i - 1] ?? pointIndices[pointIndices.length - 1]
      const iC = pointIndices[i]
      const iN = pointIndices[i + 1] ?? pointIndices[0]
      const pP = points[iP]
      const pC = points[iC]
      const pN = points[iN]
      const vCP = pP.sub(pC)
      const vCN = pN.sub(pC)
      const angle = calcDiffAngle(vCN, vCP)
      const diff = Math.abs(angle - Math.PI / 3)
      if (angle < Math.PI && diff < prev.diff) {
        const inTriangle = pointIndices.some((index) => {
          if (index === iP || index === iC || index === iN) return false
          return isPointInTriangle(pP, pC, pN, points[index])
        })
        if (inTriangle) return prev
        return { diff, index: i, triangle: [iP, iC, iN] }
      } else {
        return prev
      }
    }, { diff: Infinity, index: null as number | null, triangle: null as null | number[] })
    if (i === null || !triangle) throw new Error("Failed to find the best index")
    pointIndices.splice(i, 1)
    triangles.push(triangle)
  }
  function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
  for (let i = 0; i < triangles.length; i++) {
    const triangle = triangles[i]
    const p1 = points[triangle[0]]
    const p2 = points[triangle[1]]
    const p3 = points[triangle[2]]
    await drawClosedPath(ctx, [p1, p2, p3], 1, "red", "blue")
    await delay(100)  
  }
})()


