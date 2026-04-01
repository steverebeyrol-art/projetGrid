import { useRef, useState, useCallback } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei'
import * as THREE from 'three'
import { GRID_UNIT, GRID_HEIGHT_UNIT, BASE_HEIGHT } from '../data/modules'

const SCALE = 0.01 // 1mm = 0.01 three.js units

function BaseGrid({ gridSize }) {
  const w = gridSize.x * GRID_UNIT * SCALE
  const d = gridSize.y * GRID_UNIT * SCALE
  const h = BASE_HEIGHT * SCALE

  return (
    <group>
      {/* Base plate */}
      <mesh position={[w / 2, h / 2, d / 2]} receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#2a2f3e" />
      </mesh>

      {/* Grid cells */}
      {Array.from({ length: gridSize.x }, (_, x) =>
        Array.from({ length: gridSize.y }, (_, y) => (
          <mesh
            key={`cell-${x}-${y}`}
            position={[
              (x + 0.5) * GRID_UNIT * SCALE,
              h + 0.001,
              (y + 0.5) * GRID_UNIT * SCALE
            ]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[GRID_UNIT * SCALE - 0.005, GRID_UNIT * SCALE - 0.005]} />
            <meshStandardMaterial color="#343952" transparent opacity={0.5} />
          </mesh>
        ))
      )}

      {/* Grid lines */}
      {Array.from({ length: gridSize.x + 1 }, (_, i) => (
        <mesh key={`lx-${i}`} position={[i * GRID_UNIT * SCALE, h + 0.002, d / 2]}>
          <boxGeometry args={[0.003, 0.001, d]} />
          <meshStandardMaterial color="#6366f1" transparent opacity={0.4} />
        </mesh>
      ))}
      {Array.from({ length: gridSize.y + 1 }, (_, i) => (
        <mesh key={`ly-${i}`} position={[w / 2, h + 0.002, i * GRID_UNIT * SCALE]}>
          <boxGeometry args={[w, 0.001, 0.003]} />
          <meshStandardMaterial color="#6366f1" transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  )
}

function PlacedModule({ module, isSelected, onClick }) {
  const w = module.w * GRID_UNIT * SCALE
  const d = module.d * GRID_UNIT * SCALE
  const h = module.h * GRID_HEIGHT_UNIT * SCALE
  const baseH = BASE_HEIGHT * SCALE

  const posX = module.gridX * GRID_UNIT * SCALE + w / 2
  const posZ = module.gridY * GRID_UNIT * SCALE + d / 2
  const posY = baseH + h / 2

  return (
    <group
      position={[posX, posY, posZ]}
      rotation={[0, THREE.MathUtils.degToRad(module.rotation), 0]}
    >
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(module.id) }}
        castShadow
      >
        <boxGeometry args={[w - 0.005, h, d - 0.005]} />
        <meshStandardMaterial
          color={module.color}
          transparent
          opacity={isSelected ? 1 : 0.85}
          emissive={isSelected ? '#ffffff' : '#000000'}
          emissiveIntensity={isSelected ? 0.1 : 0}
        />
      </mesh>
      {/* Selection outline */}
      {isSelected && (
        <mesh>
          <boxGeometry args={[w - 0.003, h + 0.002, d - 0.003]} />
          <meshBasicMaterial color="#f59e0b" wireframe />
        </mesh>
      )}
      {/* Inner cavity */}
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[w - 0.02, h - 0.01, d - 0.02]} />
        <meshStandardMaterial color={module.color} transparent opacity={0.3} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

function DropPlane({ gridSize, onDrop }) {
  const w = gridSize.x * GRID_UNIT * SCALE
  const d = gridSize.y * GRID_UNIT * SCALE
  const baseH = BASE_HEIGHT * SCALE
  const ref = useRef()

  return (
    <mesh
      ref={ref}
      position={[w / 2, baseH + 0.003, d / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      visible={false}
      onPointerUp={(e) => {
        if (onDrop) {
          const point = e.point
          const gx = Math.floor(point.x / (GRID_UNIT * SCALE))
          const gy = Math.floor(point.z / (GRID_UNIT * SCALE))
          onDrop(gx, gy)
        }
      }}
    >
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  )
}

function Scene({ gridSize, placedModules, selectedId, onSelectModule, sceneRef }) {
  const { scene } = useThree()
  if (sceneRef) sceneRef.current = scene

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 3]} intensity={0.8} castShadow />
      <directionalLight position={[-2, 3, -1]} intensity={0.3} />

      <BaseGrid gridSize={gridSize} />

      {placedModules.map(mod => (
        <PlacedModule
          key={mod.id}
          module={mod}
          isSelected={selectedId === mod.id}
          onClick={onSelectModule}
        />
      ))}

      <Grid
        args={[20, 20]}
        position={[0, -0.001, 0]}
        cellSize={GRID_UNIT * SCALE}
        cellThickness={0.3}
        cellColor="#1e2230"
        sectionSize={GRID_UNIT * SCALE * 4}
        sectionThickness={0.6}
        sectionColor="#2d3142"
        fadeDistance={8}
        infiniteGrid
      />

      <OrbitControls
        makeDefault
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN
        }}
        minDistance={0.5}
        maxDistance={10}
        target={[
          (gridSize.x * GRID_UNIT * SCALE) / 2,
          0,
          (gridSize.y * GRID_UNIT * SCALE) / 2
        ]}
      />

      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport />
      </GizmoHelper>
    </>
  )
}

export default function DesignerViewport({ gridSize, placedModules, selectedId, onSelectModule, onDropModule, onMoveModule, draggedModule, sceneRef }) {
  const containerRef = useRef()
  const [dragOver, setDragOver] = useState(false)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (!data || !data.id) return

      // Calculate grid position from drop coordinates
      const rect = containerRef.current.getBoundingClientRect()
      const relX = (e.clientX - rect.left) / rect.width
      const relY = (e.clientY - rect.top) / rect.height

      // Map to grid coordinates (approximate - center of grid)
      const gx = Math.floor(relX * gridSize.x)
      const gy = Math.floor(relY * gridSize.y)

      const clampedX = Math.max(0, Math.min(gridSize.x - data.w, gx))
      const clampedY = Math.max(0, Math.min(gridSize.y - data.d, gy))

      onDropModule(data, clampedX, clampedY)
    } catch (err) {
      // Invalid drop data
    }
  }, [gridSize, onDropModule])

  const camDist = Math.max(gridSize.x, gridSize.y) * GRID_UNIT * SCALE * 2

  return (
    <div
      ref={containerRef}
      className={`viewport ${dragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Canvas
        camera={{
          position: [camDist, camDist * 0.6, camDist],
          fov: 45,
          near: 0.01,
          far: 100
        }}
        shadows
      >
        <Scene
          gridSize={gridSize}
          placedModules={placedModules}
          selectedId={selectedId}
          onSelectModule={onSelectModule}
          sceneRef={sceneRef}
        />
      </Canvas>
    </div>
  )
}
