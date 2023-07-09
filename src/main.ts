import "sanitize.css"
import styles from "./style.module.scss"
import { Vector2 } from "./Vector2"
import { genPolygon } from "./genPolygon"

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

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

; (async () => {
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

  const divisions = 6
  const depth = 3

  // Generate points of the base polygon.
  const { outline: points, triangles } = genPolygon(divisions, depth)
  const pointsForDraw = points.map((p) => {
    return new Vector2(p.x, -p.y).multiply(canvasSize).add(new Vector2(canvasSize / 2, canvasSize / 2))
  })
  // Draw outline of the base polygon.
  await drawClosedPath(ctx, pointsForDraw, 3, "white")
  for (let i = 0; i < pointsForDraw.length; i++) {
    const p = pointsForDraw[i]
    drawCircle(ctx, p, 5, "white")
    await delay(100)
  }
  // Draw mesh triangles.
  for (let i = 0; i < triangles.length; i++) {
    const triangle = triangles[i]
    const p1 = pointsForDraw[triangle[0]]
    const p2 = pointsForDraw[triangle[1]]
    const p3 = pointsForDraw[triangle[2]]
    await drawClosedPath(ctx, [p1, p2, p3], 1, "red", "blue")
    await delay(100)
  }
})()


