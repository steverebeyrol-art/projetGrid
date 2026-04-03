import { useRef, useState, useCallback, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei'
import * as THREE from 'three'
import { GRID_UNIT, GRID_HEIGHT_UNIT, BASE_HEIGHT } from '../data/modules'

const SCALE = 0.01 // 1mm = 0.01 three.js units
const CELL = GRID_UNIT * SCALE

// Check if a module placement overlaps with any existing module
function isCellAvailable(gridX, gridY, w, d, gridSize, placedModules, excludeId = null) {
  // Out of bounds check
  if (gridX < 0 || gridY < 0 || gridX + w > gridSize.x || gridY + d > gridSize.y) return false

  for (const m of placedModules) {
    if (m.id === excludeId) continue
    // AABB overlap check
    if (
      gridX < m.gridX + m.w &&
      gridX + w > m.gridX &&
      gridY < m.gridY + m.d &&
      gridY + d > m.gridY
    ) {
      return false
    }
  }
  return true
}

function BaseGrid({ gridSize }) {
  const w = gridSize.x * CELL
  const d = gridSize.y * CELL
  const h = BASE_HEIGHT * SCALE

  return (
    <group>
      {/* Base plate */}
      <mesh position={[w / 2, h / 2, d / 2]} receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#D4C4B0" />
      </mesh>

      {/* Grid cells */}
      {Array.from({ length: gridSize.x }, (_, x) =>
        Array.from({ length: gridSize.y }, (_, y) => (
          <mesh
            key={`cell-${x}-${y}`}
            position={[(x + 0.5) * CELL, h + 0.001, (y + 0.5) * CELL]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[CELL - 0.005, CELL - 0.005]} />
            <meshStandardMaterial color="#E8DFD4" transparent opacity={0.6} />
          </mesh>
        ))
      )}

      {/* Grid lines */}
      {Array.from({ length: gridSize.x + 1 }, (_, i) => (
        <mesh key={`lx-${i}`} position={[i * CELL, h + 0.002, d / 2]}>
          <boxGeometry args={[0.003, 0.001, d]} />
          <meshStandardMaterial color="#B8A08A" transparent opacity={0.5} />
        </mesh>
      ))}
      {Array.from({ length: gridSize.y + 1 }, (_, i) => (
        <mesh key={`ly-${i}`} position={[w / 2, h + 0.002, i * CELL]}>
          <boxGeometry args={[w, 0.001, 0.003]} />
          <meshStandardMaterial color="#B8A08A" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function PlacedModule({ module, isSelected, onPointerDown }) {
  const w = module.w * CELL
  const d = module.d * CELL
  const h = module.h * GRID_HEIGHT_UNIT * SCALE
  const baseH = BASE_HEIGHT * SCALE

  const posX = module.gridX * CELL + w / 2
  const posZ = module.gridY * CELL + d / 2
  const posY = baseH + h / 2

  return (
    <group
      position={[posX, posY, posZ]}
      rotation={[0, THREE.MathUtils.degToRad(module.rotation), 0]}
    >
      <mesh
        onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e, module.id) }}
        castShadow
      >
        <boxGeometry args={[w - 0.005, h, d - 0.005]} />
        <meshStandardMaterial
          color={module.color}
          transparent
          opacity={isSelected ? 1 : 0.9}
          emissive={isSelected ? '#8B6E4E' : '#000000'}
          emissiveIntensity={isSelected ? 0.15 : 0}
        />
      </mesh>
      {isSelected && (
        <mesh>
          <boxGeometry args={[w - 0.003, h + 0.002, d - 0.003]} />
          <meshBasicMaterial color="#8B6E4E" wireframe />
        </mesh>
      )}
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[w - 0.02, h - 0.01, d - 0.02]} />
        <meshStandardMaterial color={module.color} transparent opacity={0.3} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

// Ghost preview of module being placed
function GhostModule({ moduleData, gridPos, gridSize, placedModules, excludeId }) {
  if (!moduleData || !gridPos) return null

  const gx = Math.max(0, Math.min(gridSize.x - moduleData.w, gridPos.x))
  const gy = Math.max(0, Math.min(gridSize.y - moduleData.d, gridPos.y))
  const w = moduleData.w * CELL
  const d = moduleData.d * CELL
  const h = moduleData.h * GRID_HEIGHT_UNIT * SCALE
  const baseH = BASE_HEIGHT * SCALE
  const available = isCellAvailable(gx, gy, moduleData.w, moduleData.d, gridSize, placedModules, excludeId)

  return (
    <mesh position={[gx * CELL + w / 2, baseH + h / 2, gy * CELL + d / 2]}>
      <boxGeometry args={[w - 0.005, h, d - 0.005]} />
      <meshStandardMaterial
        color={available ? moduleData.color : '#ef4444'}
        transparent
        opacity={available ? 0.4 : 0.6}
      />
    </mesh>
  )
}

// Invisible plane to catch mouse events on the grid
function GridPlane({ gridSize, onGridClick, onGridMove, orbitRef }) {
  const w = gridSize.x * CELL
  const d = gridSize.y * CELL
  const baseH = BASE_HEIGHT * SCALE
  const planeRef = useRef()
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())
  const { camera, gl } = useThree()

  const getGridPos = useCallback((e) => {
    const rect = gl.domElement.getBoundingClientRect()
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.current.setFromCamera(mouse.current, camera)

    if (planeRef.current) {
      const intersects = raycaster.current.intersectObject(planeRef.current)
      if (intersects.length > 0) {
        const p = intersects[0].point
        return {
          x: Math.floor(p.x / CELL),
          y: Math.floor(p.z / CELL)
        }
      }
    }
    return null
  }, [camera, gl])

  useEffect(() => {
    const canvas = gl.domElement

    const handleMouseMove = (e) => {
      const pos = getGridPos(e)
      if (pos) onGridMove(pos)
    }

    const handleClick = (e) => {
      // Only handle left click, and only when not orbiting
      if (e.button !== 0) return
      const pos = getGridPos(e)
      if (pos) onGridClick(pos)
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
    }
  }, [gl, getGridPos, onGridClick, onGridMove])

  return (
    <mesh
      ref={planeRef}
      position={[w / 2, baseH + 0.003, d / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      visible={false}
    >
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  )
}

function Scene({ gridSize, placedModules, selectedId, onSelectModule, onPlaceModule, onMoveModule, catalogModule, sceneRef }) {
  const { scene } = useThree()
  if (sceneRef) sceneRef.current = scene

  const [ghostPos, setGhostPos] = useState(null)
  const [dragging, setDragging] = useState(null) // { id, offsetX, offsetY }
  const [dragGhostPos, setDragGhostPos] = useState(null)
  const orbitRef = useRef()

  const handleModulePointerDown = useCallback((e, id) => {
    // Start dragging a placed module
    if (catalogModule) return // Don't move if placing new module

    onSelectModule(id)
    const mod = placedModules.find(m => m.id === id)
    if (!mod) return

    const point = e.point
    const gx = Math.floor(point.x / CELL)
    const gy = Math.floor(point.z / CELL)

    setDragging({
      id,
      offsetX: gx - mod.gridX,
      offsetY: gy - mod.gridY
    })

    // Disable orbit controls while dragging
    if (orbitRef.current) orbitRef.current.enabled = false
  }, [catalogModule, onSelectModule, placedModules])

  const handleGridClick = useCallback((pos) => {
    if (dragging) {
      // Finish moving — only if target is available
      const mod = placedModules.find(m => m.id === dragging.id)
      if (mod) {
        const newX = Math.max(0, Math.min(gridSize.x - mod.w, pos.x - dragging.offsetX))
        const newY = Math.max(0, Math.min(gridSize.y - mod.d, pos.y - dragging.offsetY))
        if (isCellAvailable(newX, newY, mod.w, mod.d, gridSize, placedModules, dragging.id)) {
          onMoveModule(dragging.id, newX, newY)
        }
        // If not available, module stays at its original position
      }
      setDragging(null)
      if (orbitRef.current) orbitRef.current.enabled = true
      return
    }

    if (catalogModule) {
      // Place new module from catalog — only if target is available
      const gx = Math.max(0, Math.min(gridSize.x - catalogModule.w, pos.x))
      const gy = Math.max(0, Math.min(gridSize.y - catalogModule.d, pos.y))
      if (isCellAvailable(gx, gy, catalogModule.w, catalogModule.d, gridSize, placedModules)) {
        onPlaceModule(catalogModule, gx, gy)
      }
      return
    }

    // Click on empty grid = deselect
    onSelectModule(null)
  }, [dragging, catalogModule, placedModules, gridSize, onMoveModule, onPlaceModule, onSelectModule])

  const handleGridMove = useCallback((pos) => {
    if (dragging) {
      const mod = placedModules.find(m => m.id === dragging.id)
      if (mod) {
        const newX = Math.max(0, Math.min(gridSize.x - mod.w, pos.x - dragging.offsetX))
        const newY = Math.max(0, Math.min(gridSize.y - mod.d, pos.y - dragging.offsetY))
        setDragGhostPos({ x: newX, y: newY })
        // Only move the actual module if the position is available
        if (isCellAvailable(newX, newY, mod.w, mod.d, gridSize, placedModules, dragging.id)) {
          onMoveModule(dragging.id, newX, newY)
        }
      }
      return
    }

    if (catalogModule) {
      setGhostPos(pos)
    } else {
      setGhostPos(null)
    }
  }, [dragging, catalogModule, placedModules, gridSize, onMoveModule])

  // Listen for pointerup anywhere to stop dragging
  useEffect(() => {
    const handlePointerUp = () => {
      if (dragging) {
        setDragging(null)
        setDragGhostPos(null)
        if (orbitRef.current) orbitRef.current.enabled = true
      }
    }
    window.addEventListener('pointerup', handlePointerUp)
    return () => window.removeEventListener('pointerup', handlePointerUp)
  }, [dragging])

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 3]} intensity={0.8} castShadow />
      <directionalLight position={[-2, 3, -1]} intensity={0.3} />

      <BaseGrid gridSize={gridSize} />

      <GridPlane
        gridSize={gridSize}
        onGridClick={handleGridClick}
        onGridMove={handleGridMove}
        orbitRef={orbitRef}
      />

      {placedModules.map(mod => (
        <PlacedModule
          key={mod.id}
          module={mod}
          isSelected={selectedId === mod.id}
          onPointerDown={handleModulePointerDown}
        />
      ))}

      {catalogModule && ghostPos && (
        <GhostModule
          moduleData={catalogModule}
          gridPos={ghostPos}
          gridSize={gridSize}
          placedModules={placedModules}
        />
      )}

      {dragging && dragGhostPos && (() => {
        const mod = placedModules.find(m => m.id === dragging.id)
        return mod ? (
          <GhostModule
            moduleData={mod}
            gridPos={dragGhostPos}
            gridSize={gridSize}
            placedModules={placedModules}
            excludeId={dragging.id}
          />
        ) : null
      })()}

      <Grid
        args={[20, 20]}
        position={[0, -0.001, 0]}
        cellSize={CELL}
        cellThickness={0.3}
        cellColor="#E0D8CE"
        sectionSize={CELL * 4}
        sectionThickness={0.6}
        sectionColor="#D4C4B0"
        fadeDistance={8}
        infiniteGrid
      />

      <OrbitControls
        ref={orbitRef}
        makeDefault
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN
        }}
        minDistance={0.5}
        maxDistance={10}
        target={[
          (gridSize.x * CELL) / 2,
          0,
          (gridSize.y * CELL) / 2
        ]}
      />

      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport />
      </GizmoHelper>
    </>
  )
}

export default function DesignerViewport({ gridSize, placedModules, selectedId, onSelectModule, onPlaceModule, onMoveModule, catalogModule, sceneRef }) {
  const camDist = Math.max(gridSize.x, gridSize.y) * CELL * 2
  const cursorStyle = catalogModule ? 'crosshair' : 'default'

  return (
    <div className="viewport" style={{ cursor: cursorStyle }}>
      <Canvas
        camera={{
          position: [camDist, camDist * 0.6, camDist],
          fov: 45,
          near: 0.01,
          far: 100
        }}
        shadows
        style={{ background: '#F5F1EC' }}
      >
        <Scene
          gridSize={gridSize}
          placedModules={placedModules}
          selectedId={selectedId}
          onSelectModule={onSelectModule}
          onPlaceModule={onPlaceModule}
          onMoveModule={onMoveModule}
          catalogModule={catalogModule}
          sceneRef={sceneRef}
        />
      </Canvas>
    </div>
  )
}
