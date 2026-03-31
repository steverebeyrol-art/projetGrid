import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei'
import * as THREE from 'three'
import { GRID_X, GRID_Y, GRID_Z, BASE_HEIGHT, LIP_HEIGHT } from '../utils/units'

function BoxModel({ config, elements, selectedElement, onSelectElement }) {
  const { unitsX, unitsY, unitsZ, wallThickness, lipStyle, hasMagnets, hasScrews } = config
  const w = unitsX * GRID_X
  const d = unitsY * GRID_Y
  const totalH = unitsZ * GRID_Z
  const lipH = lipStyle === 'none' ? 0 : LIP_HEIGHT
  const wallH = totalH - BASE_HEIGHT + lipH
  const wt = wallThickness

  return (
    <group position={[-w / 2, 0, -d / 2]}>
      {/* Base */}
      <mesh position={[w / 2, BASE_HEIGHT / 2, d / 2]}>
        <boxGeometry args={[w, BASE_HEIGHT, d]} />
        <meshStandardMaterial color="#6366f1" />
      </mesh>

      {/* Grid pattern on base */}
      {Array.from({ length: unitsX - 1 }, (_, i) => (
        <mesh key={`gx${i}`} position={[(i + 1) * GRID_X, BASE_HEIGHT + 0.05, d / 2]}>
          <boxGeometry args={[0.3, 0.1, d]} />
          <meshStandardMaterial color="#4f46e5" />
        </mesh>
      ))}
      {Array.from({ length: unitsY - 1 }, (_, i) => (
        <mesh key={`gy${i}`} position={[w / 2, BASE_HEIGHT + 0.05, (i + 1) * GRID_Y]}>
          <boxGeometry args={[w, 0.1, 0.3]} />
          <meshStandardMaterial color="#4f46e5" />
        </mesh>
      ))}

      {/* Outer walls */}
      {wallH > 0 && (
        <>
          {/* Front wall */}
          <mesh position={[w / 2, BASE_HEIGHT + wallH / 2, wt / 2]}>
            <boxGeometry args={[w, wallH, wt]} />
            <meshStandardMaterial color="#818cf8" transparent opacity={0.85} />
          </mesh>
          {/* Back wall */}
          <mesh position={[w / 2, BASE_HEIGHT + wallH / 2, d - wt / 2]}>
            <boxGeometry args={[w, wallH, wt]} />
            <meshStandardMaterial color="#818cf8" transparent opacity={0.85} />
          </mesh>
          {/* Left wall */}
          <mesh position={[wt / 2, BASE_HEIGHT + wallH / 2, d / 2]}>
            <boxGeometry args={[wt, wallH, d - 2 * wt]} />
            <meshStandardMaterial color="#818cf8" transparent opacity={0.85} />
          </mesh>
          {/* Right wall */}
          <mesh position={[w - wt / 2, BASE_HEIGHT + wallH / 2, d / 2]}>
            <boxGeometry args={[wt, wallH, d - 2 * wt]} />
            <meshStandardMaterial color="#818cf8" transparent opacity={0.85} />
          </mesh>
        </>
      )}

      {/* Stacking lip */}
      {lipStyle !== 'none' && lipH > 0 && (
        <>
          <mesh position={[w / 2, totalH + lipH / 2, 0.25]}>
            <boxGeometry args={[w - 1, lipH, wt - 0.5]} />
            <meshStandardMaterial color="#a5b4fc" />
          </mesh>
          <mesh position={[w / 2, totalH + lipH / 2, d - 0.25]}>
            <boxGeometry args={[w - 1, lipH, wt - 0.5]} />
            <meshStandardMaterial color="#a5b4fc" />
          </mesh>
          <mesh position={[0.25, totalH + lipH / 2, d / 2]}>
            <boxGeometry args={[wt - 0.5, lipH, d - 2 * wt + 0.5]} />
            <meshStandardMaterial color="#a5b4fc" />
          </mesh>
          <mesh position={[w - 0.25, totalH + lipH / 2, d / 2]}>
            <boxGeometry args={[wt - 0.5, lipH, d - 2 * wt + 0.5]} />
            <meshStandardMaterial color="#a5b4fc" />
          </mesh>
        </>
      )}

      {/* Magnet holes */}
      {hasMagnets && Array.from({ length: unitsX }, (_, x) =>
        Array.from({ length: unitsY }, (_, y) => {
          const cx = x * GRID_X + GRID_X / 2
          const cy = y * GRID_Y + GRID_Y / 2
          const offsets = [[-13, -13], [13, -13], [-13, 13], [13, 13]]
          return offsets.map(([ox, oy], i) => (
            <mesh key={`mag${x}${y}${i}`} position={[cx + ox, 1.2, cy + oy]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[3.1, 3.1, 2.4, 16]} />
              <meshStandardMaterial color="#1e1b4b" />
            </mesh>
          ))
        })
      )}

      {/* Screw holes */}
      {hasScrews && Array.from({ length: unitsX }, (_, x) =>
        Array.from({ length: unitsY }, (_, y) => {
          const cx = x * GRID_X + GRID_X / 2
          const cy = y * GRID_Y + GRID_Y / 2
          return (
            <mesh key={`scr${x}${y}`} position={[cx, 3, cy]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[1.25, 1.25, 6, 12]} />
              <meshStandardMaterial color="#1e1b4b" />
            </mesh>
          )
        })
      )}

      {/* Interior elements (walls, scoops, tabs) */}
      {elements.map((el, idx) => {
        const isSelected = selectedElement === idx
        const color = isSelected ? '#f59e0b' : '#a78bfa'

        if (el.type === 'wall') {
          const posX = el.posX * GRID_X * 0.25
          const posY = el.posY * GRID_Y * 0.25
          let geoW, geoD
          if (el.orientation === 'x') {
            geoW = el.length * GRID_X
            geoD = wt
          } else {
            geoW = wt
            geoD = el.length * GRID_Y
          }
          return (
            <mesh
              key={`el${idx}`}
              position={[posX + geoW / 2, BASE_HEIGHT + wallH / 2, posY + geoD / 2]}
              onClick={(e) => { e.stopPropagation(); onSelectElement(idx) }}
            >
              <boxGeometry args={[geoW, wallH, geoD]} />
              <meshStandardMaterial color={color} transparent opacity={isSelected ? 0.9 : 0.7} />
            </mesh>
          )
        }

        if (el.type === 'scoop') {
          const posX = el.posX * GRID_X * 0.25
          const posY = el.posY * GRID_Y * 0.25
          const scoopW = el.width * GRID_X
          const radius = wallH * 0.6
          return (
            <mesh
              key={`el${idx}`}
              position={[posX + scoopW / 2, BASE_HEIGHT + radius / 2, posY + radius / 2]}
              onClick={(e) => { e.stopPropagation(); onSelectElement(idx) }}
            >
              <sphereGeometry args={[radius, 16, 8, 0, Math.PI, 0, Math.PI / 2]} />
              <meshStandardMaterial color={color} transparent opacity={isSelected ? 0.9 : 0.7} side={THREE.DoubleSide} />
            </mesh>
          )
        }

        if (el.type === 'tab') {
          const posX = el.posX * GRID_X * 0.25
          const posY = el.posY * GRID_Y * 0.25
          const tabH = 12
          return (
            <mesh
              key={`el${idx}`}
              position={[posX + 5, totalH + lipH - tabH / 2, posY + wt / 2]}
              onClick={(e) => { e.stopPropagation(); onSelectElement(idx) }}
            >
              <boxGeometry args={[10, tabH, wt]} />
              <meshStandardMaterial color={color} transparent opacity={isSelected ? 0.9 : 0.7} />
            </mesh>
          )
        }

        return null
      })}
    </group>
  )
}

function BaseplateModel({ config }) {
  const { unitsX, unitsY } = config
  const w = unitsX * GRID_X
  const d = unitsY * GRID_Y

  return (
    <group position={[-w / 2, 0, -d / 2]}>
      <mesh position={[w / 2, BASE_HEIGHT / 2, d / 2]}>
        <boxGeometry args={[w, BASE_HEIGHT, d]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      {/* Grid lines */}
      {Array.from({ length: unitsX - 1 }, (_, i) => (
        <mesh key={`gx${i}`} position={[(i + 1) * GRID_X, BASE_HEIGHT + 0.05, d / 2]}>
          <boxGeometry args={[0.4, 0.1, d]} />
          <meshStandardMaterial color="#16a34a" />
        </mesh>
      ))}
      {Array.from({ length: unitsY - 1 }, (_, i) => (
        <mesh key={`gy${i}`} position={[w / 2, BASE_HEIGHT + 0.05, (i + 1) * GRID_Y]}>
          <boxGeometry args={[w, 0.1, 0.4]} />
          <meshStandardMaterial color="#16a34a" />
        </mesh>
      ))}
      {/* Cell recesses */}
      {Array.from({ length: unitsX }, (_, x) =>
        Array.from({ length: unitsY }, (_, y) => (
          <mesh key={`cell${x}${y}`} position={[x * GRID_X + GRID_X / 2, BASE_HEIGHT - 0.5, y * GRID_Y + GRID_Y / 2]}>
            <boxGeometry args={[GRID_X - 1, 1, GRID_Y - 1]} />
            <meshStandardMaterial color="#15803d" />
          </mesh>
        ))
      )}
    </group>
  )
}

function CutoutModel({ config, stlGeometry, showImported }) {
  const { unitsX, unitsY, unitsZ, wallThickness } = config
  const w = unitsX * GRID_X
  const d = unitsY * GRID_Y
  const totalH = unitsZ * GRID_Z
  const wallH = totalH - BASE_HEIGHT + LIP_HEIGHT
  const wt = wallThickness

  return (
    <group position={[-w / 2, 0, -d / 2]}>
      {/* Base */}
      <mesh position={[w / 2, BASE_HEIGHT / 2, d / 2]}>
        <boxGeometry args={[w, BASE_HEIGHT, d]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>

      {/* Walls */}
      {wallH > 0 && (
        <>
          <mesh position={[w / 2, BASE_HEIGHT + wallH / 2, wt / 2]}>
            <boxGeometry args={[w, wallH, wt]} />
            <meshStandardMaterial color="#fbbf24" transparent opacity={0.85} />
          </mesh>
          <mesh position={[w / 2, BASE_HEIGHT + wallH / 2, d - wt / 2]}>
            <boxGeometry args={[w, wallH, wt]} />
            <meshStandardMaterial color="#fbbf24" transparent opacity={0.85} />
          </mesh>
          <mesh position={[wt / 2, BASE_HEIGHT + wallH / 2, d / 2]}>
            <boxGeometry args={[wt, wallH, d - 2 * wt]} />
            <meshStandardMaterial color="#fbbf24" transparent opacity={0.85} />
          </mesh>
          <mesh position={[w - wt / 2, BASE_HEIGHT + wallH / 2, d / 2]}>
            <boxGeometry args={[wt, wallH, d - 2 * wt]} />
            <meshStandardMaterial color="#fbbf24" transparent opacity={0.85} />
          </mesh>
        </>
      )}

      {/* Imported STL model */}
      {stlGeometry && showImported && (
        <mesh
          geometry={stlGeometry}
          position={[
            config.importX + w / 2,
            config.importY + BASE_HEIGHT,
            config.importZ + d / 2
          ]}
          rotation={[
            THREE.MathUtils.degToRad(config.importRotX),
            THREE.MathUtils.degToRad(config.importRotY),
            THREE.MathUtils.degToRad(config.importRotZ)
          ]}
          scale={[config.importScale, config.importScale, config.importScale]}
        >
          <meshStandardMaterial color="#ef4444" transparent opacity={0.6} />
        </mesh>
      )}

      {/* Cutout cavity preview */}
      {stlGeometry && (
        <mesh
          geometry={stlGeometry}
          position={[
            config.importX + w / 2,
            config.importY + BASE_HEIGHT,
            config.importZ + d / 2
          ]}
          rotation={[
            THREE.MathUtils.degToRad(config.importRotX),
            THREE.MathUtils.degToRad(config.importRotY),
            THREE.MathUtils.degToRad(config.importRotZ)
          ]}
          scale={[config.importScale, config.importScale, config.importScale]}
        >
          <meshStandardMaterial color="#dc2626" wireframe transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  )
}

function Scene({ type, config, elements, selectedElement, onSelectElement, stlGeometry, showImported }) {
  const maxDim = Math.max(
    (config.unitsX || 1) * GRID_X,
    (config.unitsY || 1) * GRID_Y,
    (config.unitsZ || 1) * GRID_Z
  )

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[80, 100, 60]} intensity={0.8} castShadow />
      <directionalLight position={[-40, 60, -30]} intensity={0.3} />

      {type === 'box' && (
        <BoxModel
          config={config}
          elements={elements}
          selectedElement={selectedElement}
          onSelectElement={onSelectElement}
        />
      )}
      {type === 'baseplate' && <BaseplateModel config={config} />}
      {type === 'cutout' && (
        <CutoutModel
          config={config}
          stlGeometry={stlGeometry}
          showImported={showImported}
        />
      )}

      <Grid
        args={[500, 500]}
        position={[0, -0.1, 0]}
        cellSize={GRID_X / 4}
        cellThickness={0.3}
        cellColor="#2d3142"
        sectionSize={GRID_X}
        sectionThickness={0.8}
        sectionColor="#3d4255"
        fadeDistance={300}
        infiniteGrid
      />

      <OrbitControls
        makeDefault
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN
        }}
        minDistance={20}
        maxDistance={400}
      />

      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport />
      </GizmoHelper>
    </>
  )
}

export default function Viewport({ type, config, elements, selectedElement, onSelectElement, stlGeometry, showImported, modelRef }) {
  const maxDim = Math.max(
    (config.unitsX || 1) * GRID_X,
    (config.unitsY || 1) * GRID_Y
  )
  const camDist = maxDim * 1.8

  return (
    <div className="viewport">
      <Canvas
        camera={{ position: [camDist, camDist * 0.7, camDist], fov: 45, near: 1, far: 2000 }}
        onCreated={({ scene }) => { if (modelRef) modelRef.current = scene }}
      >
        <Scene
          type={type}
          config={config}
          elements={elements}
          selectedElement={selectedElement}
          onSelectElement={onSelectElement}
          stlGeometry={stlGeometry}
          showImported={showImported}
        />
      </Canvas>
      <div className="viewport-info">
        LMB: Rotate &nbsp;|&nbsp; RMB: Pan &nbsp;|&nbsp; Scroll: Zoom
      </div>
    </div>
  )
}
