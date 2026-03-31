// Gridfinity unit system
export const GRID_X = 42 // mm per X-unit
export const GRID_Y = 42 // mm per Y-unit
export const GRID_Z = 7  // mm per Z-unit
export const BASE_HEIGHT = 7 // 1 Z-unit base
export const LIP_HEIGHT = 4.4 // stacking lip height in mm
export const WALL_SNAP = 0.25 // quarter-unit snap
export const MAGNET_DIAMETER = 6.2
export const MAGNET_DEPTH = 2.4
export const SCREW_DIAMETER = 2.5
export const SCREW_DEPTH = 6
export const WALL_THICKNESS_DEFAULT = 1.2

export function toMM(units, axis) {
  if (axis === 'z') return units * GRID_Z
  return units * GRID_X
}

export function toInches(mm) {
  return mm / 25.4
}

export function formatDimension(units, axis, useInches) {
  const mm = toMM(units, axis)
  if (useInches) {
    return `${units}u (${toInches(mm).toFixed(2)}″)`
  }
  return `${units}u (${mm.toFixed(1)} mm)`
}

// Scale factor: 1 mm = 0.001 in Three.js world units
// We'll use 1 unit = 1mm for simplicity
export const SCALE = 1
