import * as THREE from 'three'
import {
  GRID_X, GRID_Y, GRID_Z, BASE_HEIGHT, LIP_HEIGHT,
  MAGNET_DIAMETER, MAGNET_DEPTH, SCREW_DIAMETER, SCREW_DEPTH,
  WALL_THICKNESS_DEFAULT
} from './units'

// Create gridfinity base profile (simplified)
export function createBaseGeometry(unitsX, unitsY) {
  const w = unitsX * GRID_X
  const d = unitsY * GRID_Y
  const h = BASE_HEIGHT
  const chamfer = 0.8

  const shape = new THREE.Shape()
  shape.moveTo(chamfer, 0)
  shape.lineTo(w - chamfer, 0)
  shape.lineTo(w, chamfer)
  shape.lineTo(w, d - chamfer)
  shape.lineTo(w - chamfer, d)
  shape.lineTo(chamfer, d)
  shape.lineTo(0, d - chamfer)
  shape.lineTo(0, chamfer)
  shape.closePath()

  const extrudeSettings = { depth: h, bevelEnabled: false }
  return new THREE.ExtrudeGeometry(shape, extrudeSettings)
}

// Create box walls
export function createBoxGeometry(unitsX, unitsY, unitsZ, wallThickness, lipStyle, hasMagnets, hasScrews) {
  const w = unitsX * GRID_X
  const d = unitsY * GRID_Y
  const totalZ = unitsZ * GRID_Z
  const lipH = lipStyle === 'none' ? 0 : LIP_HEIGHT
  const h = totalZ
  const wt = wallThickness

  const geometries = []

  // Base plate
  const base = createBaseGeometry(unitsX, unitsY)
  geometries.push(base)

  // Walls (hollow box)
  if (h > BASE_HEIGHT) {
    const wallHeight = h - BASE_HEIGHT + lipH
    const outerShape = new THREE.Shape()
    outerShape.moveTo(0, 0)
    outerShape.lineTo(w, 0)
    outerShape.lineTo(w, d)
    outerShape.lineTo(0, d)
    outerShape.closePath()

    const innerHole = new THREE.Path()
    innerHole.moveTo(wt, wt)
    innerHole.lineTo(w - wt, wt)
    innerHole.lineTo(w - wt, d - wt)
    innerHole.lineTo(wt, d - wt)
    innerHole.closePath()
    outerShape.holes.push(innerHole)

    const wallGeo = new THREE.ExtrudeGeometry(outerShape, {
      depth: wallHeight,
      bevelEnabled: false
    })
    wallGeo.translate(0, 0, BASE_HEIGHT)
    geometries.push(wallGeo)
  }

  // Stacking lip
  if (lipStyle !== 'none' && lipH > 0) {
    const lipInset = 0.5
    const lipShape = new THREE.Shape()
    lipShape.moveTo(lipInset, lipInset)
    lipShape.lineTo(w - lipInset, lipInset)
    lipShape.lineTo(w - lipInset, d - lipInset)
    lipShape.lineTo(lipInset, d - lipInset)
    lipShape.closePath()

    const lipInner = new THREE.Path()
    const li = lipInset + wt
    lipInner.moveTo(li, li)
    lipInner.lineTo(w - li, li)
    lipInner.lineTo(w - li, d - li)
    lipInner.lineTo(li, d - li)
    lipInner.closePath()
    lipShape.holes.push(lipInner)

    const lipGeo = new THREE.ExtrudeGeometry(lipShape, {
      depth: lipH,
      bevelEnabled: false
    })
    lipGeo.translate(0, 0, h)
    geometries.push(lipGeo)
  }

  // Magnet holes
  if (hasMagnets) {
    for (let x = 0; x < unitsX; x++) {
      for (let y = 0; y < unitsY; y++) {
        const cx = x * GRID_X + GRID_X / 2
        const cy = y * GRID_Y + GRID_Y / 2
        // 4 magnets per cell at corners
        const offsets = [
          [cx - 13, cy - 13],
          [cx + 13, cy - 13],
          [cx - 13, cy + 13],
          [cx + 13, cy + 13]
        ]
        for (const [mx, my] of offsets) {
          const magnetGeo = new THREE.CylinderGeometry(
            MAGNET_DIAMETER / 2, MAGNET_DIAMETER / 2, MAGNET_DEPTH, 16
          )
          magnetGeo.rotateX(Math.PI / 2)
          magnetGeo.translate(mx, my, MAGNET_DEPTH / 2)
          geometries.push(magnetGeo)
        }
      }
    }
  }

  // Screw holes
  if (hasScrews) {
    for (let x = 0; x < unitsX; x++) {
      for (let y = 0; y < unitsY; y++) {
        const cx = x * GRID_X + GRID_X / 2
        const cy = y * GRID_Y + GRID_Y / 2
        const screwGeo = new THREE.CylinderGeometry(
          SCREW_DIAMETER / 2, SCREW_DIAMETER / 2, SCREW_DEPTH, 12
        )
        screwGeo.rotateX(Math.PI / 2)
        screwGeo.translate(cx, cy, SCREW_DEPTH / 2)
        geometries.push(screwGeo)
      }
    }
  }

  return geometries
}

// Create interior wall geometry
export function createWallGeometry(position, length, unitsZ, wallThickness, orientation, unitsX, unitsY) {
  const h = unitsZ * GRID_Z - BASE_HEIGHT + LIP_HEIGHT
  const wt = wallThickness
  const maxX = unitsX * GRID_X
  const maxY = unitsY * GRID_Y

  let w, d, tx, ty
  if (orientation === 'x') {
    // Wall along X axis
    w = length * GRID_X
    d = wt
    tx = position.x * GRID_X * 0.25
    ty = position.y * GRID_Y * 0.25
  } else {
    // Wall along Y axis
    w = wt
    d = length * GRID_Y
    tx = position.x * GRID_X * 0.25
    ty = position.y * GRID_Y * 0.25
  }

  const geo = new THREE.BoxGeometry(w, d, h)
  geo.translate(tx + w / 2, ty + d / 2, BASE_HEIGHT + h / 2)
  return geo
}

// Create scoop geometry
export function createScoopGeometry(position, width, unitsZ, orientation, unitsX, unitsY) {
  const h = unitsZ * GRID_Z - BASE_HEIGHT + LIP_HEIGHT
  const radius = h * 0.7

  const curve = new THREE.QuadraticBezierCurve(
    new THREE.Vector2(0, 0),
    new THREE.Vector2(radius * 0.5, 0),
    new THREE.Vector2(radius, radius)
  )
  const points = curve.getPoints(16)

  const scoopShape = new THREE.Shape()
  scoopShape.moveTo(0, 0)
  for (const p of points) {
    scoopShape.lineTo(p.x, p.y)
  }
  scoopShape.lineTo(0, radius)
  scoopShape.closePath()

  const extrudeWidth = width * GRID_X

  const geo = new THREE.ExtrudeGeometry(scoopShape, {
    depth: extrudeWidth,
    bevelEnabled: false
  })

  return geo
}

// Create baseplate geometry (no walls)
export function createBaseplateGeometry(unitsX, unitsY) {
  const w = unitsX * GRID_X
  const d = unitsY * GRID_Y
  const h = BASE_HEIGHT
  const chamfer = 0.8

  const geometries = []

  // Main plate
  const base = createBaseGeometry(unitsX, unitsY)
  geometries.push(base)

  // Grid lines (grooves) - represented as thin indentations
  for (let x = 1; x < unitsX; x++) {
    const groove = new THREE.BoxGeometry(0.5, d, 1)
    groove.translate(x * GRID_X, d / 2, h - 0.5)
    geometries.push(groove)
  }
  for (let y = 1; y < unitsY; y++) {
    const groove = new THREE.BoxGeometry(w, 0.5, 1)
    groove.translate(w / 2, y * GRID_Y, h - 0.5)
    geometries.push(groove)
  }

  return geometries
}
