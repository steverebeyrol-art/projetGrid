import { useState, useRef, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import {
  loadAndPrepareImage,
  autoDetectPaperCorners,
  calibrateFromCorners,
  cleanMask,
  dilateMask,
  maskToContour,
  simplifyContour,
  polygonToMask,
  contourToMm,
  getBounds,
  snapToGrid,
  centerInGrid,
  renderContourOutline,
  renderPaperCorners,
} from '../utils/contourDetection'
import { addModule, getCategories, addCategory } from '../utils/moduleStore'

const GRID_UNIT = 42

// ===== Step 1: Upload Photo =====
function StepUpload({ onPhotoLoaded }) {
  const fileRef = useRef(null)
  const cameraRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setLoading(true)
    try {
      const data = await loadAndPrepareImage(file, 900)
      onPhotoLoaded(data)
    } catch (err) {
      console.error(err)
      alert("Erreur lors du chargement de l'image.")
    }
    setLoading(false)
  }, [onPhotoLoaded])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }

  return (
    <div className="cr-step">
      <div className="cr-step-head">
        <div className="cr-step-num">1</div>
        <div>
          <h4>Photographiez votre objet</h4>
          <p>Placez-le sur une feuille A4 blanche et prenez une photo du dessus.</p>
        </div>
      </div>

      <div
        className={`cr-dropzone ${dragOver ? 'over' : ''} ${loading ? 'loading' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {loading ? (
          <><div className="cr-spinner" /><p>Chargement...</p></>
        ) : (
          <>
            <span className="cr-drop-icon">📁</span>
            <p>Glisser-deposer une image ici</p>
            <div className="cr-upload-btns">
              <button className="cr-upload-btn" onClick={() => fileRef.current?.click()}>
                🖼️ Choisir un fichier
              </button>
              <button className="cr-upload-btn" onClick={() => cameraRef.current?.click()}>
                📸 Prendre une photo
              </button>
            </div>
          </>
        )}
      </div>

      {/* File picker (gallery/files) - no capture attribute */}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      {/* Camera capture */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

      <div className="cr-tips">
        <p className="cr-tips-title">Conseils pour de bons resultats :</p>
        <ul>
          <li>Feuille <strong>A4 blanche</strong> = reference de mesure</li>
          <li>Photo prise du <strong>dessus</strong>, bien droite</li>
          <li>Bonne luminosite, eviter les ombres portees</li>
          <li>L'objet doit etre entierement sur la feuille</li>
        </ul>
      </div>
    </div>
  )
}

// ===== Step 2: Mark A4 Paper Corners =====
function StepPaper({ imageData, onCalibrated, onBack }) {
  const canvasRef = useRef(null)
  const [corners, setCorners] = useState([])
  const [autoCorners, setAutoCorners] = useState(null)

  // Try auto-detect on mount
  useEffect(() => {
    const detected = autoDetectPaperCorners(imageData.ctx, imageData.drawW, imageData.drawH)
    if (detected) setAutoCorners(detected)
  }, [imageData])

  // Redraw canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = imageData.drawW
    canvas.height = imageData.drawH
    ctx.drawImage(imageData.img, 0, 0, imageData.drawW, imageData.drawH)
    renderPaperCorners(ctx, corners)

    if (corners.length < 4 && autoCorners) {
      // Show auto-detected as ghost
      ctx.globalAlpha = 0.3
      renderPaperCorners(ctx, autoCorners)
      ctx.globalAlpha = 1
    }
  }, [imageData, corners, autoCorners])

  const handleCanvasClick = (e) => {
    if (corners.length >= 4) return
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = imageData.drawW / rect.width
    const scaleY = imageData.drawH / rect.height
    const x = Math.round((e.clientX - rect.left) * scaleX)
    const y = Math.round((e.clientY - rect.top) * scaleY)
    setCorners(prev => [...prev, { x, y }])
  }

  const useAutoCorners = () => {
    if (autoCorners) setCorners(autoCorners)
  }

  const handleConfirm = () => {
    const calib = calibrateFromCorners(corners)
    if (calib) onCalibrated(calib)
  }

  return (
    <div className="cr-step">
      <div className="cr-step-head">
        <div className="cr-step-num">2</div>
        <div>
          <h4>Delimitez la feuille A4</h4>
          <p>Cliquez sur les 4 coins de la feuille.</p>
        </div>
      </div>

      <div className="cr-split">
        <div className="cr-split-left">
          <div className="cr-info-row">
            <span className="cr-info-badge">{corners.length}/4 coins</span>
            {autoCorners && corners.length === 0 && (
              <button className="cr-link-btn" onClick={useAutoCorners}>Detection auto</button>
            )}
            {corners.length > 0 && (
              <button className="cr-link-btn" onClick={() => setCorners([])}>Recommencer</button>
            )}
          </div>

          {corners.length === 4 && (
            <div className="cr-calibration-info">
              {(() => {
                const calib = calibrateFromCorners(corners)
                return calib ? (
                  <p>Echelle: <strong>{calib.pixelsPerMm.toFixed(2)} px/mm</strong><br/>Feuille: {Math.round(calib.shortSidePx / calib.pixelsPerMm)}mm x {Math.round(calib.longSidePx / calib.pixelsPerMm)}mm</p>
                ) : null
              })()}
            </div>
          )}

          <div className="cr-tips" style={{ marginTop: 'auto' }}>
            <p className="cr-tips-title">Instructions :</p>
            <ul>
              <li>Cliquez sur les 4 coins de la feuille A4</li>
              <li>L'ordre des coins n'a pas d'importance</li>
              <li>La feuille sert de reference de mesure</li>
            </ul>
          </div>

          <div className="cr-actions">
            <button className="btn btn-secondary" onClick={onBack}>←</button>
            <button className="btn btn-primary" onClick={handleConfirm} disabled={corners.length !== 4}>
              Continuer →
            </button>
          </div>
        </div>

        <div className="cr-split-right">
          <div className="cr-canvas-wrap">
            <canvas ref={canvasRef} className="cr-canvas" onClick={handleCanvasClick} style={{ cursor: corners.length < 4 ? 'crosshair' : 'default' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== Step 3: Select Tool (Vector Points) =====
function StepSelect({ imageData, calibration, onContourReady, onBack }) {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const [vectorPoints, setVectorPoints] = useState([])
  const [tool, setTool] = useState('add') // 'add' | 'move' | 'insert' | 'delete'
  const [dragIdx, setDragIdx] = useState(-1)
  const [hoverSegment, setHoverSegment] = useState(-1)
  const [hoverPos, setHoverPos] = useState(null)
  const [margin, setMargin] = useState(5)
  const [validated, setValidated] = useState(false)

  // Zoom & pan
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

  const { drawW: w, drawH: h } = imageData
  const POINT_RADIUS = 8
  const HIT_RADIUS = 12
  const SEGMENT_HIT_DIST = 8

  // Convert mouse event to image coordinates (accounting for zoom+pan)
  const getCanvasXY = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    // Mouse position in canvas pixel space
    const canvasX = (e.clientX - rect.left) * (canvas.width / rect.width)
    const canvasY = (e.clientY - rect.top) * (canvas.height / rect.height)
    // Reverse the transform: canvas coords → image coords
    return {
      x: Math.round((canvasX - pan.x) / zoom),
      y: Math.round((canvasY - pan.y) / zoom),
    }
  }

  // Find closest point index within hit radius
  const findPointAt = (px, py) => {
    for (let i = 0; i < vectorPoints.length; i++) {
      const dx = vectorPoints[i].x - px, dy = vectorPoints[i].y - py
      if (dx * dx + dy * dy <= HIT_RADIUS * HIT_RADIUS) return i
    }
    return -1
  }

  // Find closest segment and project point onto it
  const findSegmentAt = (px, py) => {
    if (vectorPoints.length < 2) return { idx: -1, pos: null }
    let bestDist = Infinity, bestIdx = -1, bestPos = null
    const n = vectorPoints.length
    for (let i = 0; i < n; i++) {
      const a = vectorPoints[i], b = vectorPoints[(i + 1) % n]
      const abx = b.x - a.x, aby = b.y - a.y
      const len2 = abx * abx + aby * aby
      if (len2 === 0) continue
      let t = ((px - a.x) * abx + (py - a.y) * aby) / len2
      t = Math.max(0.05, Math.min(0.95, t)) // clamp away from endpoints
      const projX = a.x + t * abx, projY = a.y + t * aby
      const dx = px - projX, dy = py - projY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < bestDist) { bestDist = dist; bestIdx = i; bestPos = { x: Math.round(projX), y: Math.round(projY) } }
    }
    return bestDist <= SEGMENT_HIT_DIST ? { idx: bestIdx, pos: bestPos } : { idx: -1, pos: null }
  }

  // Redraw canvas with zoom+pan
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = w
    canvas.height = h

    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    // Draw image
    ctx.drawImage(imageData.img, 0, 0, w, h)

    if (vectorPoints.length > 0) {
      // Draw filled polygon with semi-transparent overlay
      if (vectorPoints.length >= 3) {
        ctx.beginPath()
        ctx.moveTo(vectorPoints[0].x, vectorPoints[0].y)
        for (let i = 1; i < vectorPoints.length; i++) ctx.lineTo(vectorPoints[i].x, vectorPoints[i].y)
        ctx.closePath()
        ctx.fillStyle = 'rgba(139, 110, 78, 0.15)'
        ctx.fill()
      }

      // Draw outline (scale-independent line width)
      const lw = 1 / zoom
      renderContourOutline(ctx, vectorPoints, '#FFFFFF', 3 * lw, vectorPoints.length >= 3)
      renderContourOutline(ctx, vectorPoints, '#8B6E4E', 1.5 * lw, vectorPoints.length >= 3)

      // Draw points (scale-independent size)
      const pr = POINT_RADIUS / zoom
      for (let i = 0; i < vectorPoints.length; i++) {
        const p = vectorPoints[i]
        ctx.beginPath()
        ctx.arc(p.x, p.y, pr, 0, Math.PI * 2)
        ctx.fillStyle = dragIdx === i ? '#8B6E4E' : '#FFFFFF'
        ctx.fill()
        ctx.strokeStyle = '#8B6E4E'
        ctx.lineWidth = 2 / zoom
        ctx.stroke()
        ctx.fillStyle = dragIdx === i ? '#FFFFFF' : '#8B6E4E'
        ctx.font = `bold ${Math.round(9 / zoom)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(i + 1), p.x, p.y)
      }

      // Draw insert preview on hovered segment
      if (hoverSegment >= 0 && hoverPos && dragIdx < 0) {
        ctx.beginPath()
        ctx.arc(hoverPos.x, hoverPos.y, 6 / zoom, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(139, 110, 78, 0.5)'
        ctx.fill()
        ctx.strokeStyle = '#8B6E4E'
        ctx.lineWidth = 1.5 / zoom
        ctx.setLineDash([3 / zoom, 3 / zoom])
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    ctx.restore()
  }, [imageData, vectorPoints, w, h, dragIdx, hoverSegment, hoverPos, zoom, pan])

  // Zoom helpers
  const zoomIn = () => setZoom(z => Math.min(5, z + 0.5))
  const zoomOut = () => {
    setZoom(z => {
      const next = Math.max(1, z - 0.5)
      if (next === 1) setPan({ x: 0, y: 0 })
      return next
    })
  }
  const zoomReset = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  // Mouse wheel zoom (centered on cursor)
  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.25 : 0.25
    setZoom(z => {
      const next = Math.max(1, Math.min(5, z + delta))
      if (next === 1) setPan({ x: 0, y: 0 })
      return next
    })
  }

  // Attach wheel listener with passive:false
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [])

  // Mouse down: action depends on selected tool
  const handleMouseDown = (e) => {
    e.preventDefault()

    // Middle mouse button = pan
    if (e.button === 1) {
      setIsPanning(true)
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
      return
    }

    if (validated) return
    const { x, y } = getCanvasXY(e)

    if (tool === 'add') {
      setVectorPoints(prev => [...prev, { x, y }])
    } else if (tool === 'move') {
      const ptIdx = findPointAt(x, y)
      if (ptIdx >= 0) setDragIdx(ptIdx)
    } else if (tool === 'insert') {
      if (vectorPoints.length >= 2) {
        const { idx, pos } = findSegmentAt(x, y)
        if (idx >= 0 && pos) {
          const newPts = [...vectorPoints]
          newPts.splice(idx + 1, 0, pos)
          setVectorPoints(newPts)
          setDragIdx(idx + 1)
          setTool('move')
        }
      }
    } else if (tool === 'delete') {
      const ptIdx = findPointAt(x, y)
      if (ptIdx >= 0) {
        setVectorPoints(prev => prev.filter((_, i) => i !== ptIdx))
      }
    }
  }

  // Mouse move: drag point, pan, or show insert preview
  const handleMouseMove = (e) => {
    // Panning
    if (isPanning) {
      const dx = e.clientX - panStart.current.x
      const dy = e.clientY - panStart.current.y
      const canvas = canvasRef.current
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      setPan({ x: panStart.current.panX + dx * scaleX, y: panStart.current.panY + dy * scaleY })
      return
    }

    const { x, y } = getCanvasXY(e)

    if (dragIdx >= 0) {
      setVectorPoints(prev => {
        const pts = [...prev]
        pts[dragIdx] = { x: Math.max(0, Math.min(w, x)), y: Math.max(0, Math.min(h, y)) }
        return pts
      })
      return
    }

    if (validated) return

    if (tool === 'insert' && vectorPoints.length >= 2) {
      const { idx, pos } = findSegmentAt(x, y)
      if (idx !== hoverSegment) setHoverSegment(idx)
      if (pos !== hoverPos) setHoverPos(pos)
    } else {
      if (hoverSegment >= 0) { setHoverSegment(-1); setHoverPos(null) }
    }
  }

  const handleMouseUp = () => {
    setDragIdx(-1)
    setIsPanning(false)
  }

  // Right click always deletes (shortcut)
  const handleContextMenu = (e) => {
    e.preventDefault()
    if (validated) return
    const { x, y } = getCanvasXY(e)
    const ptIdx = findPointAt(x, y)
    if (ptIdx >= 0) {
      setVectorPoints(prev => prev.filter((_, i) => i !== ptIdx))
    }
  }

  const cursorForTool = { add: 'crosshair', move: dragIdx >= 0 ? 'grabbing' : 'grab', insert: 'copy', delete: 'pointer' }

  const clearAll = () => {
    setVectorPoints([])
    setValidated(false)
  }

  const handleValidate = () => {
    if (vectorPoints.length < 3) { alert('Minimum 3 points requis.'); return }
    setValidated(true)
  }

  const handleModify = () => {
    setValidated(false)
  }

  const handleConfirm = () => {
    if (vectorPoints.length < 3) { alert('Minimum 3 points requis.'); return }

    // Use vector points directly as contour (with optional margin via dilation)
    let contourPx = vectorPoints
    if (margin > 0) {
      // Create mask from polygon, dilate, extract contour
      const polyMask = polygonToMask(vectorPoints, w, h)
      const expanded = dilateMask(polyMask, w, h, margin)
      const cleaned = cleanMask(expanded, w, h, 1, 1)
      const extracted = maskToContour(cleaned, w, h, 180)
      if (extracted.length >= 5) {
        contourPx = simplifyContour(extracted, 2)
      }
    }

    const { pixelsPerMm } = calibration
    const bounds = getBounds(contourPx)
    const contourMm = contourToMm(contourPx, pixelsPerMm, bounds.x, bounds.y)
    const boundsMm = getBounds(contourMm)
    const gridSize = snapToGrid(boundsMm.w, boundsMm.h, GRID_UNIT)
    const centered = centerInGrid(contourMm, gridSize.w, gridSize.h, GRID_UNIT)

    onContourReady({
      contourMm: centered,
      contourPx,
      gridSize,
      boundsMm,
      mask: null,
    })
  }

  return (
    <div className="cr-step">
      <div className="cr-step-head">
        <div className="cr-step-num">3</div>
        <div>
          <h4>Detourer l'objet</h4>
          <p>Placez des points autour de votre objet.</p>
        </div>
      </div>

      <div className="cr-split">
        <div className="cr-split-left">
          {/* Toolbar icons */}
          <div className="cr-toolbar cr-toolbar-vertical">
            <button className={`cr-tool ${tool === 'add' ? 'active' : ''}`} onClick={() => setTool('add')} title="Ajouter un point">
              <span>+</span> Ajouter
            </button>
            <button className={`cr-tool ${tool === 'move' ? 'active' : ''}`} onClick={() => setTool('move')} title="Deplacer un point">
              <span>&#9995;</span> Deplacer
            </button>
            <button className={`cr-tool ${tool === 'insert' ? 'active' : ''}`} onClick={() => setTool('insert')} title="Inserer sur une ligne">
              <span>&#10010;</span> Inserer
            </button>
            <button className={`cr-tool ${tool === 'delete' ? 'active' : ''}`} onClick={() => setTool('delete')} title="Supprimer un point">
              <span>&#10005;</span> Supprimer
            </button>
            <button className="cr-tool" onClick={clearAll} title="Tout effacer">
              <span>&#8634;</span> Reset
            </button>
          </div>

          {/* Legend */}
          <div className="cr-legend">
            {tool === 'add' && <p>Cliquez sur la photo pour placer des points autour de l'objet.</p>}
            {tool === 'move' && <p>Cliquez sur un point et glissez pour le deplacer.</p>}
            {tool === 'insert' && <p>Cliquez sur une ligne entre deux points pour en inserer un nouveau.</p>}
            {tool === 'delete' && <p>Cliquez sur un point pour le supprimer.</p>}
            <p className="cr-legend-shortcut">Clic droit = supprimer (raccourci)</p>
          </div>

          {vectorPoints.length > 0 && (
            <div className="cr-info-row">
              <span className="cr-info-badge">{vectorPoints.length} points</span>
            </div>
          )}

          {validated && (
            <div className="cr-option cr-margin-option">
              <div className="cr-option-success">Contour valide</div>
              <label>Marge: {margin}px</label>
              <input type="range" min={0} max={30} value={margin} onChange={e => setMargin(Number(e.target.value))} />
              <p className="cr-option-hint">Espace autour de l'objet dans le module.</p>
              <button className="cr-link-btn" onClick={handleModify} style={{ marginTop: '0.3rem' }}>Modifier les points</button>
            </div>
          )}

          {!validated && vectorPoints.length >= 3 && (
            <button className="btn btn-sm btn-primary" onClick={handleValidate} style={{ marginTop: '0.5rem' }}>
              Valider la selection
            </button>
          )}

          <div className="cr-actions" style={{ marginTop: 'auto' }}>
            <button className="btn btn-secondary" onClick={onBack}>←</button>
            <button className="btn btn-primary" onClick={handleConfirm} disabled={!validated}>
              Continuer →
            </button>
          </div>
        </div>

        <div className="cr-split-right">
          <div className="cr-zoom-bar">
            <button className="cr-zoom-btn" onClick={zoomOut} title="Zoom -">&#8722;</button>
            <span className="cr-zoom-level" onClick={zoomReset} title="Reinitialiser">{Math.round(zoom * 100)}%</span>
            <button className="cr-zoom-btn" onClick={zoomIn} title="Zoom +">+</button>
          </div>
          <div className="cr-canvas-wrap" ref={wrapRef}>
            <canvas
              ref={canvasRef}
              className="cr-canvas"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onContextMenu={handleContextMenu}
              style={{ cursor: isPanning ? 'grabbing' : (cursorForTool[tool] || 'crosshair') }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== Step 4: 3D Preview + Save =====
function GridfinityModule3D({ contourMm, gridW, gridH, depth }) {
  const totalW = gridW * GRID_UNIT
  const totalH = gridH * GRID_UNIT
  const s = 0.01 // mm to scene units
  const baseThick = 3 // mm - solid bottom under the cavity
  const cavityDepth = depth * GRID_UNIT * 0.5 // mm
  const totalHeight = baseThick + cavityDepth // full block height in mm

  // Single solid block = outer rectangle extruded to full height, with tool shape as hole extruded only for the cavity part
  // Approach: solid base (full rectangle) + walls around cavity (full rect with hole, extruded cavity depth)

  // 1. Solid base plate (full rectangle, no hole) - the bottom
  const basePlate = (
    <mesh position={[0, baseThick * s / 2, 0]}>
      <boxGeometry args={[totalW * s, baseThick * s, totalH * s]} />
      <meshStandardMaterial color="#C8B8A4" />
    </mesh>
  )

  // 2. Upper part: full rectangle with tool contour as hole, extruded to cavity depth
  let upperWalls = null
  let cavityBottom = null
  if (contourMm.length >= 3) {
    // Full outer rectangle in scene units
    const blockShape = new THREE.Shape()
    blockShape.moveTo(0, 0)
    blockShape.lineTo(totalW * s, 0)
    blockShape.lineTo(totalW * s, totalH * s)
    blockShape.lineTo(0, totalH * s)
    blockShape.closePath()

    // Tool contour as a hole
    const holePath = new THREE.Path()
    holePath.moveTo(contourMm[0].x * s, contourMm[0].y * s)
    for (let i = 1; i < contourMm.length; i++) {
      holePath.lineTo(contourMm[i].x * s, contourMm[i].y * s)
    }
    holePath.closePath()
    blockShape.holes.push(holePath)

    upperWalls = (
      <mesh
        position={[-totalW * s / 2, baseThick * s, -totalH * s / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <extrudeGeometry args={[blockShape, {
          steps: 1,
          depth: cavityDepth * s,
          bevelEnabled: false,
        }]} />
        <meshStandardMaterial color="#D4C4B0" side={THREE.DoubleSide} />
      </mesh>
    )

    // Colored bottom of cavity (tool silhouette)
    const toolShape = new THREE.Shape()
    toolShape.moveTo(contourMm[0].x * s, contourMm[0].y * s)
    for (let i = 1; i < contourMm.length; i++) {
      toolShape.lineTo(contourMm[i].x * s, contourMm[i].y * s)
    }
    toolShape.closePath()

    cavityBottom = (
      <mesh
        position={[-totalW * s / 2, baseThick * s + 0.001, -totalH * s / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <shapeGeometry args={[toolShape]} />
        <meshStandardMaterial color="#A08060" side={THREE.DoubleSide} />
      </mesh>
    )
  }

  return (
    <group>
      {basePlate}
      {upperWalls}
      {cavityBottom}
    </group>
  )
}

function StepPreview({ contourData, onBack, onSave }) {
  const [name, setName] = useState('')
  const [depth, setDepth] = useState(1)
  const [viewMode, setViewMode] = useState('3d')

  const { contourMm, gridSize, boundsMm } = contourData

  const handleSave = () => {
    if (!name.trim()) return
    const mod = {
      id: 'custom_' + Date.now(),
      name: name.trim(),
      icon: '🔧',
      description: 'Module sur mesure - ' + name.trim(),
      w: gridSize.w,
      d: gridSize.h,
      h: depth,
      color: '#8B6E4E',
      category: 'custom',
      isCustom: true,
      contour: contourMm,
      createdAt: new Date().toISOString(),
    }
    addModule(mod)
    onSave(mod)
  }

  return (
    <div className="cr-step">
      <div className="cr-step-head">
        <div className="cr-step-num">4</div>
        <div>
          <h4>Apercu du module</h4>
          <p>Votre module Gridfinity {gridSize.w}x{gridSize.h} est pret.</p>
        </div>
      </div>

      <div className="cr-split">
        <div className="cr-split-left">
          <div className="cr-form">
            <div className="cr-field">
              <label>Nom du module</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Pince, Casque..." />
            </div>

            <div className="cr-field">
              <label>Profondeur</label>
              <div className="cr-depth-btns">
                {[1, 2, 3, 4].map(d => (
                  <button key={d} className={`cr-depth-btn ${depth === d ? 'active' : ''}`} onClick={() => setDepth(d)}>
                    {d}u
                  </button>
                ))}
              </div>
            </div>

            <div className="cr-info-grid" style={{ flexDirection: 'column' }}>
              <div className="cr-info-cell">
                <span className="cr-info-label">Taille reelle</span>
                <span className="cr-info-val">{Math.round(boundsMm.w)}x{Math.round(boundsMm.h)}mm</span>
              </div>
              <div className="cr-info-cell">
                <span className="cr-info-label">Grille</span>
                <span className="cr-info-val">{gridSize.w}x{gridSize.h} unites</span>
              </div>
            </div>
          </div>

          <div className="cr-actions" style={{ marginTop: 'auto' }}>
            <button className="btn btn-secondary" onClick={onBack}>←</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim()}>Sauvegarder</button>
          </div>
        </div>

        <div className="cr-split-right">
          <div className="cr-viewport">
            <div className="cr-vtabs">
              <button className={`cr-vtab ${viewMode === '3d' ? 'active' : ''}`} onClick={() => setViewMode('3d')}>Vue 3D</button>
              <button className={`cr-vtab ${viewMode === 'top' ? 'active' : ''}`} onClick={() => setViewMode('top')}>Vue dessus</button>
            </div>
            <Canvas
              camera={{ position: viewMode === 'top' ? [0, 5, 0] : [3, 3, 3], fov: 40 }}
              style={{ background: '#F5F1EC', borderRadius: '0 0 12px 12px', height: '100%', minHeight: '320px' }}
            >
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 8, 5]} intensity={0.8} />
              <GridfinityModule3D contourMm={contourMm} gridW={gridSize.w} gridH={gridSize.h} depth={depth} />
              <OrbitControls enablePan={false} maxPolarAngle={viewMode === 'top' ? 0.01 : Math.PI / 2} />
            </Canvas>
            <div className="cr-viewport-info">{gridSize.w}x{gridSize.h} Grille — {gridSize.w * GRID_UNIT}mm x {gridSize.h * GRID_UNIT}mm</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/// ===== Step 5: Done =====
function StepDone({ moduleData, onClose, onReset }) {
  return (
    <div className="cr-done">
      <div className="cr-done-icon">✅</div>
      <h4>Module "{moduleData.name}" cree !</h4>
      <p>Votre module sur mesure ({moduleData.w}x{moduleData.d} unites) est disponible dans le catalogue sous "Personnalise".</p>
      <p className="cr-done-sub">Placez-le sur votre grille depuis le catalogue de modules.</p>
      <div className="cr-done-btns">
        <button className="btn btn-primary btn-block" onClick={onReset}>Creer un autre module</button>
        <button className="btn btn-secondary btn-block" onClick={onClose} style={{ marginTop: '0.5rem' }}>Fermer</button>
      </div>
    </div>
  )
}

// ===== Main =====
export default function ModuleCreator({ onClose }) {
  const [step, setStep] = useState(1)
  const [imageData, setImageData] = useState(null)
  const [calibration, setCalibration] = useState(null)
  const [contourData, setContourData] = useState(null)
  const [savedModule, setSavedModule] = useState(null)

  // Ensure custom category exists
  useEffect(() => {
    const cats = getCategories()
    if (!cats.find(c => c.id === 'custom')) {
      addCategory({ id: 'custom', name: 'Personnalise', icon: '🔧', description: 'Vos modules sur mesure.', slug: 'personnalise' })
    }
  }, [])

  const reset = () => { setStep(1); setImageData(null); setCalibration(null); setContourData(null); setSavedModule(null) }

  const stepLabels = ['Photo', 'Feuille A4', 'Selection', 'Apercu']

  return (
    <div className="creator-content">
      {/* Progress */}
      <div className="cr-progress">
        <div className="cr-progress-steps">
          {stepLabels.map((label, i) => (
            <div key={i} className={`cr-prog-step ${step > i + 1 ? 'done' : ''} ${step === i + 1 ? 'active' : ''}`}>
              <div className="cr-prog-dot">{step > i + 1 ? '✓' : i + 1}</div>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="cr-prog-bar"><div className="cr-prog-fill" style={{ width: `${((step - 1) / 4) * 100}%` }} /></div>
      </div>

      {step === 1 && <StepUpload onPhotoLoaded={(d) => { setImageData(d); setStep(2) }} />}
      {step === 2 && imageData && <StepPaper imageData={imageData} onCalibrated={(c) => { setCalibration(c); setStep(3) }} onBack={() => setStep(1)} />}
      {step === 3 && imageData && calibration && <StepSelect imageData={imageData} calibration={calibration} onContourReady={(d) => { setContourData(d); setStep(4) }} onBack={() => setStep(2)} />}
      {step === 4 && contourData && <StepPreview contourData={contourData} onBack={() => setStep(3)} onSave={(m) => { setSavedModule(m); setStep(5) }} />}
      {step === 5 && savedModule && <StepDone moduleData={savedModule} onClose={onClose} onReset={reset} />}
    </div>
  )
}
