// Client-side image processing for tool tracing
// Provides multiple detection modes: auto, magic wand, manual vector points

// A4 dimensions in mm
const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297

/**
 * Load an image file and scale it to a reasonable working size
 * Returns { img, canvas, ctx, drawW, drawH, scaleRatio }
 */
export async function loadAndPrepareImage(file, maxDim = 1000) {
  const img = await new Promise((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = URL.createObjectURL(file)
  })

  let drawW = img.width
  let drawH = img.height
  const scaleRatio = Math.min(1, maxDim / Math.max(drawW, drawH))
  drawW = Math.round(drawW * scaleRatio)
  drawH = Math.round(drawH * scaleRatio)

  const canvas = document.createElement('canvas')
  canvas.width = drawW
  canvas.height = drawH
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, drawW, drawH)

  return { img, canvas, ctx, drawW, drawH, scaleRatio, imageUrl: img.src }
}

/**
 * Calculate pixels-per-mm from 4 paper corner points
 * corners: [{x,y}, {x,y}, {x,y}, {x,y}] in order (any order, we figure it out)
 */
export function calibrateFromCorners(corners) {
  if (corners.length !== 4) return null

  // Find the bounding dimensions of the quadrilateral
  // Calculate distances between all pairs and use the two longest as diagonals
  // or the 4 edges
  const dists = []
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      const dx = corners[j].x - corners[i].x
      const dy = corners[j].y - corners[i].y
      dists.push({ i, j, d: Math.sqrt(dx * dx + dy * dy) })
    }
  }
  dists.sort((a, b) => b.d - a.d)

  // The two longest distances are diagonals, the 4 shorter are edges
  // Take the 4 edge distances
  const edges = dists.slice(2) // 4 shortest = edges

  // Sort edges by length: 2 short sides and 2 long sides
  edges.sort((a, b) => a.d - b.d)
  const shortSide = (edges[0].d + edges[1].d) / 2
  const longSide = (edges[2].d + edges[3].d) / 2

  // A4: short side = 210mm, long side = 297mm
  const pxPerMmShort = shortSide / A4_WIDTH_MM
  const pxPerMmLong = longSide / A4_HEIGHT_MM
  const pixelsPerMm = (pxPerMmShort + pxPerMmLong) / 2

  // Paper center for reference
  const cx = corners.reduce((s, p) => s + p.x, 0) / 4
  const cy = corners.reduce((s, p) => s + p.y, 0) / 4

  return {
    pixelsPerMm,
    paperCenter: { x: cx, y: cy },
    paperCorners: corners,
    shortSidePx: shortSide,
    longSidePx: longSide,
  }
}

/**
 * Auto-detect A4 paper corners using edge detection
 * Returns 4 corner points or null
 */
export function autoDetectPaperCorners(ctx, w, h) {
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data

  // Create brightness mask - paper is bright
  const bright = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2]
    bright[i] = (r > 160 && g > 160 && b > 160) ? 1 : 0
  }

  // Find bounding box of bright region
  let minX = w, maxX = 0, minY = h, maxY = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (bright[y * w + x]) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX - minX < 50 || maxY - minY < 50) return null

  // Return corners of the bright region bounding box
  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ]
}

// ========== MAGIC WAND ==========

/**
 * Magic wand tool - flood fill from a click point
 * Selects connected pixels similar to the clicked color
 * tolerance: 0-255 (higher = more lenient)
 */
export function magicWandSelect(ctx, w, h, startX, startY, tolerance = 40, existingMask = null) {
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data
  const mask = existingMask ? new Uint8Array(existingMask) : new Uint8Array(w * h)

  const idx = (startY * w + startX) * 4
  const seedR = data[idx], seedG = data[idx + 1], seedB = data[idx + 2]

  const visited = new Uint8Array(w * h)
  const stack = [[startX, startY]]

  while (stack.length > 0) {
    const [x, y] = stack.pop()
    if (x < 0 || x >= w || y < 0 || y >= h) continue
    const i = y * w + x
    if (visited[i]) continue
    visited[i] = 1

    const pi = i * 4
    const dr = Math.abs(data[pi] - seedR)
    const dg = Math.abs(data[pi + 1] - seedG)
    const db = Math.abs(data[pi + 2] - seedB)

    if (dr <= tolerance && dg <= tolerance && db <= tolerance) {
      mask[i] = 1
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
    }
  }

  return mask
}

/**
 * Invert selection within paper bounds
 * Useful after selecting the paper background to get the tool
 */
export function invertMaskInBounds(mask, w, h, bounds) {
  const result = new Uint8Array(w * h)
  const { minX, minY, maxX, maxY } = bounds
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const i = y * w + x
      result[i] = mask[i] ? 0 : 1
    }
  }
  return result
}

// ========== MASK OPERATIONS ==========

/**
 * Add to an existing mask using magic wand at a point
 */
export function addToMask(ctx, w, h, mask, x, y, tolerance = 40) {
  const newRegion = magicWandSelect(ctx, w, h, x, y, tolerance)
  const result = new Uint8Array(mask)
  for (let i = 0; i < w * h; i++) {
    if (newRegion[i]) result[i] = 1
  }
  return result
}

/**
 * Subtract from an existing mask at a point (eraser)
 */
export function subtractFromMask(mask, w, h, cx, cy, radius) {
  const result = new Uint8Array(mask)
  for (let y = Math.max(0, cy - radius); y <= Math.min(h - 1, cy + radius); y++) {
    for (let x = Math.max(0, cx - radius); x <= Math.min(w - 1, cx + radius); x++) {
      const dx = x - cx, dy = y - cy
      if (dx * dx + dy * dy <= radius * radius) {
        result[y * w + x] = 0
      }
    }
  }
  return result
}

/**
 * Morphological operations to clean up a mask
 */
export function cleanMask(mask, w, h, dilateRadius = 2, erodeRadius = 2) {
  // Dilate
  let result = new Uint8Array(w * h)
  for (let y = dilateRadius; y < h - dilateRadius; y++) {
    for (let x = dilateRadius; x < w - dilateRadius; x++) {
      if (mask[y * w + x]) {
        for (let dy = -dilateRadius; dy <= dilateRadius; dy++) {
          for (let dx = -dilateRadius; dx <= dilateRadius; dx++) {
            result[(y + dy) * w + (x + dx)] = 1
          }
        }
      }
    }
  }

  // Erode
  const eroded = new Uint8Array(w * h)
  for (let y = erodeRadius; y < h - erodeRadius; y++) {
    for (let x = erodeRadius; x < w - erodeRadius; x++) {
      let allSet = true
      for (let dy = -erodeRadius; dy <= erodeRadius && allSet; dy++) {
        for (let dx = -erodeRadius; dx <= erodeRadius && allSet; dx++) {
          if (!result[(y + dy) * w + (x + dx)]) allSet = false
        }
      }
      eroded[y * w + x] = allSet ? 1 : 0
    }
  }
  return eroded
}

// ========== CONTOUR FROM MASK ==========

/**
 * Extract the outer contour from a binary mask
 * Uses border pixel extraction + ordering for robustness
 * Returns array of {x, y} points
 */
export function maskToContour(mask, w, h) {
  // Find all border pixels (mask=1 with at least one neighbor mask=0)
  const borderPixels = []
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (!mask[y * w + x]) continue
      // Check 4-neighbors
      if (!mask[(y - 1) * w + x] || !mask[(y + 1) * w + x] ||
          !mask[y * w + (x - 1)] || !mask[y * w + (x + 1)]) {
        borderPixels.push({ x, y })
      }
    }
  }

  if (borderPixels.length < 3) return borderPixels

  // Order border pixels by walking along the border
  // Start from the topmost-leftmost border pixel
  const ordered = []
  const used = new Set()

  // Find start: topmost, then leftmost
  let start = borderPixels[0]
  for (const p of borderPixels) {
    if (p.y < start.y || (p.y === start.y && p.x < start.x)) start = p
  }

  // Build a lookup for fast neighbor search
  const borderSet = new Set(borderPixels.map(p => `${p.x},${p.y}`))

  let current = start
  const maxIter = borderPixels.length + 10

  for (let iter = 0; iter < maxIter; iter++) {
    const key = `${current.x},${current.y}`
    if (used.has(key)) break
    ordered.push(current)
    used.add(key)

    // Find nearest unused border neighbor (8-connected)
    let best = null
    let bestDist = Infinity
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (dx === 0 && dy === 0) continue
        const nk = `${current.x + dx},${current.y + dy}`
        if (borderSet.has(nk) && !used.has(nk)) {
          const d = Math.abs(dx) + Math.abs(dy)
          if (d < bestDist) { bestDist = d; best = { x: current.x + dx, y: current.y + dy } }
        }
      }
    }

    if (!best) break
    current = best
  }

  return ordered
}

/**
 * Simplify contour using Douglas-Peucker algorithm
 */
export function simplifyContour(points, tolerance = 2) {
  if (points.length <= 2) return points

  let maxDist = 0, maxIdx = 0
  const first = points[0], last = points[points.length - 1]

  for (let i = 1; i < points.length - 1; i++) {
    const dist = ptLineDist(points[i], first, last)
    if (dist > maxDist) { maxDist = dist; maxIdx = i }
  }

  if (maxDist > tolerance) {
    const left = simplifyContour(points.slice(0, maxIdx + 1), tolerance)
    const right = simplifyContour(points.slice(maxIdx), tolerance)
    return [...left.slice(0, -1), ...right]
  }
  return [first, last]
}

function ptLineDist(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2)
  return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len
}

// ========== POLYGON FROM VECTOR POINTS ==========

/**
 * Create a filled mask from manual vector points (polygon)
 */
export function polygonToMask(points, w, h) {
  const mask = new Uint8Array(w * h)
  if (points.length < 3) return mask

  // Scanline fill algorithm
  for (let y = 0; y < h; y++) {
    const intersections = []
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      const p1 = points[i], p2 = points[j]
      if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
        const xIntersect = p1.x + (y - p1.y) / (p2.y - p1.y) * (p2.x - p1.x)
        intersections.push(xIntersect)
      }
    }
    intersections.sort((a, b) => a - b)
    for (let k = 0; k < intersections.length - 1; k += 2) {
      const xStart = Math.max(0, Math.ceil(intersections[k]))
      const xEnd = Math.min(w - 1, Math.floor(intersections[k + 1]))
      for (let x = xStart; x <= xEnd; x++) {
        mask[y * w + x] = 1
      }
    }
  }
  return mask
}

// ========== CONVERSION ==========

/**
 * Convert contour from pixel coords to mm using calibration
 */
export function contourToMm(contour, pixelsPerMm, originX = 0, originY = 0) {
  return contour.map(p => ({
    x: (p.x - originX) / pixelsPerMm,
    y: (p.y - originY) / pixelsPerMm,
  }))
}

/**
 * Get bounding box of points
 */
export function getBounds(points) {
  if (!points.length) return { x: 0, y: 0, w: 0, h: 0 }
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

/**
 * Snap dimensions to 42mm grid
 */
export function snapToGrid(widthMm, heightMm, gridUnit = 42) {
  return {
    w: Math.max(1, Math.ceil(widthMm / gridUnit)),
    h: Math.max(1, Math.ceil(heightMm / gridUnit)),
  }
}

/**
 * Center contour within grid allocation
 */
export function centerInGrid(contourMm, gridW, gridH, gridUnit = 42) {
  const bounds = getBounds(contourMm)
  const totalW = gridW * gridUnit
  const totalH = gridH * gridUnit
  const ox = (totalW - bounds.w) / 2 - bounds.x
  const oy = (totalH - bounds.h) / 2 - bounds.y
  return contourMm.map(p => ({ x: p.x + ox, y: p.y + oy }))
}

// ========== MASK RENDERING ==========

/**
 * Render a mask as a colored overlay on a canvas
 */
export function renderMaskOverlay(ctx, mask, w, h, r = 139, g = 110, b = 78, alpha = 90) {
  const overlay = ctx.createImageData(w, h)
  for (let i = 0; i < w * h; i++) {
    if (mask[i]) {
      overlay.data[i * 4] = r
      overlay.data[i * 4 + 1] = g
      overlay.data[i * 4 + 2] = b
      overlay.data[i * 4 + 3] = alpha
    }
  }
  // Use a temp canvas to composite
  const tmpCanvas = document.createElement('canvas')
  tmpCanvas.width = w
  tmpCanvas.height = h
  const tmpCtx = tmpCanvas.getContext('2d')
  tmpCtx.putImageData(overlay, 0, 0)
  ctx.drawImage(tmpCanvas, 0, 0)
}

/**
 * Draw polygon outline on canvas
 */
export function renderContourOutline(ctx, points, color = '#FFFFFF', lineWidth = 2, close = true) {
  if (points.length < 2) return
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  if (close) ctx.closePath()
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.stroke()
}

/**
 * Draw control points (for vector mode)
 */
export function renderControlPoints(ctx, points, radius = 5, color = '#8B6E4E', fillColor = '#FFFFFF') {
  for (const p of points) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
    ctx.fillStyle = fillColor
    ctx.fill()
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()
  }
}

/**
 * Draw paper corner markers
 */
export function renderPaperCorners(ctx, corners, radius = 8) {
  // Draw lines between corners
  if (corners.length >= 2) {
    ctx.beginPath()
    ctx.moveTo(corners[0].x, corners[0].y)
    for (let i = 1; i < corners.length; i++) {
      ctx.lineTo(corners[i].x, corners[i].y)
    }
    if (corners.length === 4) ctx.closePath()
    ctx.strokeStyle = 'rgba(139, 110, 78, 0.7)'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 4])
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Draw corner dots
  corners.forEach((c, i) => {
    ctx.beginPath()
    ctx.arc(c.x, c.y, radius, 0, Math.PI * 2)
    ctx.fillStyle = '#8B6E4E'
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.stroke()

    // Label
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(i + 1), c.x, c.y)
  })
}
