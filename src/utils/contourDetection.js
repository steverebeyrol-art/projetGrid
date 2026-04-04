// Client-side contour detection for tool tracing
// Uses Canvas API to detect tool outlines on A4 paper

// A4 dimensions in mm
const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297

/**
 * Load an image file into an HTMLImageElement
 */
export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Detect the A4 paper in the image and return scale (pixels per mm)
 * Uses white rectangle detection heuristic
 */
export function detectA4Scale(imageData, width, height) {
  // Find the bounding box of the white region (the paper)
  const data = imageData.data
  let minX = width, maxX = 0, minY = height, maxY = 0
  let whiteCount = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const r = data[i], g = data[i + 1], b = data[i + 2]
      // Detect bright/white pixels (the paper)
      if (r > 180 && g > 180 && b > 180) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
        whiteCount++
      }
    }
  }

  const paperW = maxX - minX
  const paperH = maxY - minY

  if (paperW < 50 || paperH < 50) {
    // Fallback: assume the whole image is the paper area
    return {
      pixelsPerMm: Math.min(width / A4_WIDTH_MM, height / A4_HEIGHT_MM),
      paperBounds: { x: 0, y: 0, w: width, h: height },
    }
  }

  // Determine orientation (portrait vs landscape)
  const isPortrait = paperH > paperW
  const refW = isPortrait ? A4_WIDTH_MM : A4_HEIGHT_MM
  const refH = isPortrait ? A4_HEIGHT_MM : A4_WIDTH_MM

  const pxPerMm = Math.max(paperW / refW, paperH / refH)

  return {
    pixelsPerMm: pxPerMm,
    paperBounds: { x: minX, y: minY, w: paperW, h: paperH },
  }
}

/**
 * Extract the tool silhouette from the image
 * Returns a binary mask (1 = tool, 0 = background)
 * Works by detecting the paper region first, then finding non-white objects on it
 */
export function extractToolMask(imageData, width, height, threshold = 120) {
  const data = imageData.data
  const mask = new Uint8Array(width * height)

  // Step 0: Detect paper region (bright pixels)
  const paperMask = new Uint8Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2]
    if (r > 170 && g > 170 && b > 170) paperMask[i] = 1
  }

  // Find paper bounding box
  let pMinX = width, pMaxX = 0, pMinY = height, pMaxY = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (paperMask[y * width + x]) {
        if (x < pMinX) pMinX = x
        if (x > pMaxX) pMaxX = x
        if (y < pMinY) pMinY = y
        if (y > pMaxY) pMaxY = y
      }
    }
  }

  // Shrink paper bounds slightly to avoid edges
  const margin = Math.round(Math.min(pMaxX - pMinX, pMaxY - pMinY) * 0.03)
  pMinX += margin; pMinY += margin; pMaxX -= margin; pMaxY -= margin

  // Step 1: Within paper region, detect non-white pixels (the tool)
  // A pixel is "tool" if it differs significantly from white paper
  for (let y = pMinY; y < pMaxY; y++) {
    for (let x = pMinX; x < pMaxX; x++) {
      const i = y * width + x
      const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2]
      // Distance from white
      const distFromWhite = Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2)
      // Also check saturation (colored objects like yellow handles)
      const max = Math.max(r, g, b), min = Math.min(r, g, b)
      const saturation = max > 0 ? (max - min) / max : 0

      // Tool = far from white OR highly saturated (colored)
      if (distFromWhite > threshold || saturation > 0.35) {
        mask[i] = 1
      }
    }
  }

  // Step 2: Simple morphological closing (dilate then erode) to clean up
  const closed = morphClose(mask, width, height, 2)

  // Step 3: Remove small noise regions
  return removeSmallRegions(closed, width, height, 200)
}

/**
 * Morphological closing (dilate then erode)
 */
function morphClose(mask, w, h, radius) {
  // Dilate
  let result = new Uint8Array(w * h)
  for (let y = radius; y < h - radius; y++) {
    for (let x = radius; x < w - radius; x++) {
      let found = false
      for (let dy = -radius; dy <= radius && !found; dy++) {
        for (let dx = -radius; dx <= radius && !found; dx++) {
          if (mask[(y + dy) * w + (x + dx)]) found = true
        }
      }
      result[y * w + x] = found ? 1 : 0
    }
  }

  // Erode
  const eroded = new Uint8Array(w * h)
  for (let y = radius; y < h - radius; y++) {
    for (let x = radius; x < w - radius; x++) {
      let allSet = true
      for (let dy = -radius; dy <= radius && allSet; dy++) {
        for (let dx = -radius; dx <= radius && allSet; dx++) {
          if (!result[(y + dy) * w + (x + dx)]) allSet = false
        }
      }
      eroded[y * w + x] = allSet ? 1 : 0
    }
  }

  return eroded
}

/**
 * Remove connected regions smaller than minSize pixels
 */
function removeSmallRegions(mask, w, h, minSize) {
  const labels = new Int32Array(w * h)
  let label = 0
  const sizes = []

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x] && !labels[y * w + x]) {
        label++
        const size = floodFillLabel(mask, labels, w, h, x, y, label)
        sizes[label] = size
      }
    }
  }

  // Keep only regions >= minSize
  const result = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) {
    if (labels[i] && sizes[labels[i]] >= minSize) {
      result[i] = 1
    }
  }
  return result
}

function floodFillLabel(mask, labels, w, h, startX, startY, label) {
  const stack = [[startX, startY]]
  let size = 0
  while (stack.length > 0) {
    const [x, y] = stack.pop()
    if (x < 0 || x >= w || y < 0 || y >= h) continue
    const idx = y * w + x
    if (!mask[idx] || labels[idx]) continue
    labels[idx] = label
    size++
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }
  return size
}

/**
 * Trace the contour of the binary mask using marching squares
 * Returns array of {x, y} points in pixel coordinates
 */
export function traceContour(mask, w, h) {
  // Find starting point (first set pixel on edge)
  let startX = -1, startY = -1
  for (let y = 0; y < h && startX === -1; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x]) {
        startX = x
        startY = y
        break
      }
    }
  }

  if (startX === -1) return []

  // Moore neighborhood tracing
  const contour = []
  const dirs = [
    [0, -1], [1, -1], [1, 0], [1, 1],
    [0, 1], [-1, 1], [-1, 0], [-1, -1]
  ]

  let x = startX, y = startY
  let dir = 7 // start direction
  const maxSteps = w * h
  let steps = 0

  do {
    contour.push({ x, y })
    // Find next boundary pixel
    let found = false
    const startDir = (dir + 5) % 8 // backtrack

    for (let i = 0; i < 8; i++) {
      const d = (startDir + i) % 8
      const nx = x + dirs[d][0]
      const ny = y + dirs[d][1]

      if (nx >= 0 && nx < w && ny >= 0 && ny < h && mask[ny * w + nx]) {
        x = nx
        y = ny
        dir = d
        found = true
        break
      }
    }

    if (!found) break
    steps++
  } while ((x !== startX || y !== startY) && steps < maxSteps)

  return contour
}

/**
 * Simplify a contour using the Douglas-Peucker algorithm
 */
export function simplifyContour(points, tolerance = 2) {
  if (points.length <= 2) return points

  // Find the point farthest from the line between first and last
  let maxDist = 0
  let maxIdx = 0
  const first = points[0]
  const last = points[points.length - 1]

  for (let i = 1; i < points.length - 1; i++) {
    const dist = pointToLineDistance(points[i], first, last)
    if (dist > maxDist) {
      maxDist = dist
      maxIdx = i
    }
  }

  if (maxDist > tolerance) {
    const left = simplifyContour(points.slice(0, maxIdx + 1), tolerance)
    const right = simplifyContour(points.slice(maxIdx), tolerance)
    return [...left.slice(0, -1), ...right]
  }

  return [first, last]
}

function pointToLineDistance(p, a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2)
  return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len
}

/**
 * Convert contour from pixel coords to mm coords using A4 scale
 */
export function contourToMm(contour, pixelsPerMm, paperBounds) {
  return contour.map(p => ({
    x: (p.x - paperBounds.x) / pixelsPerMm,
    y: (p.y - paperBounds.y) / pixelsPerMm,
  }))
}

/**
 * Get the bounding box of a contour in mm
 */
export function getContourBounds(contourMm) {
  if (contourMm.length === 0) return { x: 0, y: 0, w: 0, h: 0 }
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const p of contourMm) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

/**
 * Snap contour bounding box to 42mm grid units
 * Returns grid dimensions (in units) needed
 */
export function snapToGrid(bounds, gridUnit = 42) {
  const gridW = Math.ceil(bounds.w / gridUnit)
  const gridH = Math.ceil(bounds.h / gridUnit)
  return { w: Math.max(1, gridW), h: Math.max(1, gridH) }
}

/**
 * Center the contour within its grid allocation
 */
export function centerContourInGrid(contourMm, gridW, gridH, gridUnit = 42) {
  const bounds = getContourBounds(contourMm)
  const totalW = gridW * gridUnit
  const totalH = gridH * gridUnit
  const offsetX = (totalW - bounds.w) / 2 - bounds.x
  const offsetY = (totalH - bounds.h) / 2 - bounds.y

  return contourMm.map(p => ({
    x: p.x + offsetX,
    y: p.y + offsetY,
  }))
}

/**
 * Process an image file through the full pipeline
 * Returns { contourMm, gridSize, contourPx, mask, scale }
 */
export async function processToolImage(file, options = {}) {
  const { threshold = 120, simplifyTolerance = 2, gridUnit = 42 } = options

  const img = await loadImage(file)

  // Scale down large images for performance
  const maxDim = 800
  let drawW = img.width
  let drawH = img.height
  if (drawW > maxDim || drawH > maxDim) {
    const scale = maxDim / Math.max(drawW, drawH)
    drawW = Math.round(drawW * scale)
    drawH = Math.round(drawH * scale)
  }

  // Draw to canvas
  const canvas = document.createElement('canvas')
  canvas.width = drawW
  canvas.height = drawH
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, drawW, drawH)

  const imageData = ctx.getImageData(0, 0, drawW, drawH)

  // Detect A4 paper for scale
  const { pixelsPerMm, paperBounds } = detectA4Scale(imageData, drawW, drawH)

  // Extract tool mask
  const mask = extractToolMask(imageData, drawW, drawH, threshold)

  // Trace contour
  const contourPx = traceContour(mask, drawW, drawH)

  // Simplify
  const simplifiedPx = simplifyContour(contourPx, simplifyTolerance)

  // Convert to mm
  const contourMm = contourToMm(simplifiedPx, pixelsPerMm, paperBounds)

  // Calculate grid size
  const bounds = getContourBounds(contourMm)
  const gridSize = snapToGrid(bounds, gridUnit)

  // Center in grid
  const centered = centerContourInGrid(contourMm, gridSize.w, gridSize.h, gridUnit)

  // Clean up
  URL.revokeObjectURL(img.src)

  return {
    contourMm: centered,
    contourPx: simplifiedPx,
    rawContourPx: contourPx,
    gridSize,
    bounds,
    mask,
    maskWidth: drawW,
    maskHeight: drawH,
    pixelsPerMm,
    paperBounds,
    imageUrl: URL.createObjectURL(file),
  }
}

/**
 * Draw mask overlay on a canvas
 */
export function drawMaskOverlay(ctx, mask, w, h, color = 'rgba(139, 110, 78, 0.4)') {
  const imgData = ctx.createImageData(w, h)
  // Parse color
  const r = 139, g = 110, b = 78, a = 102 // rgba(139,110,78,0.4)
  for (let i = 0; i < w * h; i++) {
    if (mask[i]) {
      imgData.data[i * 4] = r
      imgData.data[i * 4 + 1] = g
      imgData.data[i * 4 + 2] = b
      imgData.data[i * 4 + 3] = a
    }
  }
  ctx.putImageData(imgData, 0, 0)
}

/**
 * Draw contour outline on a canvas
 */
export function drawContour(ctx, points, scale = 1, offsetX = 0, offsetY = 0, strokeColor = '#8B6E4E', lineWidth = 2) {
  if (points.length < 3) return
  ctx.beginPath()
  ctx.moveTo(points[0].x * scale + offsetX, points[0].y * scale + offsetY)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x * scale + offsetX, points[i].y * scale + offsetY)
  }
  ctx.closePath()
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = lineWidth
  ctx.stroke()
}
