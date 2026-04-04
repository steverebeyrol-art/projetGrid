import { useState, useRef, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import {
  loadAndPrepareImage,
  autoDetectPaperCorners,
  calibrateFromCorners,
  magicWandSelect,
  addToMask,
  subtractFromMask,
  cleanMask,
  maskToContour,
  simplifyContour,
  polygonToMask,
  contourToMm,
  getBounds,
  snapToGrid,
  centerInGrid,
  renderMaskOverlay,
  renderContourOutline,
  renderControlPoints,
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
          <p>Cliquez sur les 4 coins de la feuille pour calibrer les mesures.</p>
        </div>
      </div>

      <div className="cr-canvas-wrap">
        <canvas ref={canvasRef} className="cr-canvas" onClick={handleCanvasClick} style={{ cursor: corners.length < 4 ? 'crosshair' : 'default' }} />
      </div>

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
              <p>Echelle: <strong>{calib.pixelsPerMm.toFixed(2)} px/mm</strong> — Feuille detectee: {Math.round(calib.shortSidePx / calib.pixelsPerMm)}mm x {Math.round(calib.longSidePx / calib.pixelsPerMm)}mm</p>
            ) : null
          })()}
        </div>
      )}

      <div className="cr-actions">
        <button className="btn btn-secondary" onClick={onBack}>← Retour</button>
        <button className="btn btn-primary" onClick={handleConfirm} disabled={corners.length !== 4}>
          Continuer →
        </button>
      </div>
    </div>
  )
}

// ===== Step 3: Select Tool (Magic Wand / Vector Points) =====
function StepSelect({ imageData, calibration, onContourReady, onBack }) {
  const canvasRef = useRef(null)
  const [mode, setMode] = useState('wand') // 'wand' | 'vector' | 'eraser'
  const [mask, setMask] = useState(null)
  const [vectorPoints, setVectorPoints] = useState([])
  const [tolerance, setTolerance] = useState(45)
  const [brushSize, setBrushSize] = useState(15)

  const { drawW: w, drawH: h } = imageData

  // Redraw
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = w
    canvas.height = h

    // Draw image
    ctx.drawImage(imageData.img, 0, 0, w, h)

    // Draw mask overlay
    if (mask) {
      renderMaskOverlay(ctx, mask, w, h, 139, 110, 78, 90)
      // Draw contour outline
      const contour = maskToContour(mask, w, h)
      if (contour.length > 10) {
        const simplified = simplifyContour(contour, 2)
        renderContourOutline(ctx, simplified, '#FFFFFF', 2.5)
        renderContourOutline(ctx, simplified, '#8B6E4E', 1.5)
      }
    }

    // Draw vector points
    if (mode === 'vector' && vectorPoints.length > 0) {
      renderContourOutline(ctx, vectorPoints, '#8B6E4E', 2, vectorPoints.length >= 3)
      renderControlPoints(ctx, vectorPoints)
    }
  }, [imageData, mask, vectorPoints, mode, w, h])

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = w / rect.width
    const scaleY = h / rect.height
    const x = Math.round((e.clientX - rect.left) * scaleX)
    const y = Math.round((e.clientY - rect.top) * scaleY)

    if (mode === 'wand') {
      const newMask = mask
        ? addToMask(imageData.ctx, w, h, mask, x, y, tolerance)
        : magicWandSelect(imageData.ctx, w, h, x, y, tolerance)
      setMask(newMask)
    } else if (mode === 'eraser') {
      if (mask) {
        setMask(subtractFromMask(mask, w, h, x, y, brushSize))
      }
    } else if (mode === 'vector') {
      setVectorPoints(prev => [...prev, { x, y }])
    }
  }

  const handleMouseMove = (e) => {
    if (mode !== 'eraser' || !e.buttons) return
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = w / rect.width
    const scaleY = h / rect.height
    const x = Math.round((e.clientX - rect.left) * scaleX)
    const y = Math.round((e.clientY - rect.top) * scaleY)
    if (mask) setMask(subtractFromMask(mask, w, h, x, y, brushSize))
  }

  const applyVectorPoints = () => {
    if (vectorPoints.length < 3) return
    const polyMask = polygonToMask(vectorPoints, w, h)
    setMask(polyMask)
    setMode('wand')
  }

  const clearAll = () => {
    setMask(null)
    setVectorPoints([])
  }

  const handleConfirm = () => {
    let finalMask = mask
    if (!finalMask && vectorPoints.length >= 3) {
      finalMask = polygonToMask(vectorPoints, w, h)
    }
    if (!finalMask) { alert('Selectionnez d\'abord l\'objet.'); return }

    // Clean up mask
    const cleaned = cleanMask(finalMask, w, h, 1, 1)

    // Extract contour
    const contourPx = maskToContour(cleaned, w, h)
    if (contourPx.length < 10) { alert('Contour trop petit. Reessayez.'); return }
    const simplified = simplifyContour(contourPx, 3)

    // Convert to mm
    const { pixelsPerMm } = calibration
    // Origin = mask bounding box top-left
    const bounds = getBounds(simplified)
    const contourMm = contourToMm(simplified, pixelsPerMm, bounds.x, bounds.y)
    const boundsMm = getBounds(contourMm)
    const gridSize = snapToGrid(boundsMm.w, boundsMm.h, GRID_UNIT)
    const centered = centerInGrid(contourMm, gridSize.w, gridSize.h, GRID_UNIT)

    onContourReady({
      contourMm: centered,
      contourPx: simplified,
      gridSize,
      boundsMm,
      mask: cleaned,
    })
  }

  const cursorStyle = mode === 'wand' ? 'crosshair' : mode === 'eraser' ? 'cell' : 'crosshair'

  return (
    <div className="cr-step">
      <div className="cr-step-head">
        <div className="cr-step-num">3</div>
        <div>
          <h4>Selectionnez l'objet</h4>
          <p>Utilisez les outils pour detourer votre objet sur la photo.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="cr-toolbar">
        <button className={`cr-tool ${mode === 'wand' ? 'active' : ''}`} onClick={() => setMode('wand')} title="Baguette magique">
          <span>✨</span> Baguette
        </button>
        <button className={`cr-tool ${mode === 'vector' ? 'active' : ''}`} onClick={() => setMode('vector')} title="Points vectoriels">
          <span>📐</span> Points
        </button>
        <button className={`cr-tool ${mode === 'eraser' ? 'active' : ''}`} onClick={() => setMode('eraser')} title="Gomme">
          <span>🧹</span> Gomme
        </button>
        <div className="cr-tool-sep" />
        <button className="cr-tool" onClick={clearAll} title="Tout effacer">
          <span>🗑️</span> Reset
        </button>
      </div>

      {/* Tool options */}
      <div className="cr-tool-options">
        {mode === 'wand' && (
          <div className="cr-option">
            <label>Tolerance: {tolerance}</label>
            <input type="range" min={10} max={100} value={tolerance} onChange={e => setTolerance(Number(e.target.value))} />
            <p className="cr-option-hint">Cliquez sur l'objet. Chaque clic ajoute a la selection.</p>
          </div>
        )}
        {mode === 'vector' && (
          <div className="cr-option">
            <p className="cr-option-hint">Cliquez autour de l'objet pour placer des points. Min 3 points.</p>
            {vectorPoints.length >= 3 && (
              <button className="btn btn-sm btn-secondary" onClick={applyVectorPoints}>
                Appliquer les {vectorPoints.length} points
              </button>
            )}
          </div>
        )}
        {mode === 'eraser' && (
          <div className="cr-option">
            <label>Taille: {brushSize}px</label>
            <input type="range" min={5} max={50} value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} />
            <p className="cr-option-hint">Cliquez/glissez pour effacer des zones de la selection.</p>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="cr-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="cr-canvas"
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          style={{ cursor: cursorStyle }}
        />
      </div>

      {mask && (
        <div className="cr-info-row">
          <span className="cr-info-badge">Selection active</span>
        </div>
      )}

      <div className="cr-actions">
        <button className="btn btn-secondary" onClick={onBack}>← Retour</button>
        <button className="btn btn-primary" onClick={handleConfirm} disabled={!mask && vectorPoints.length < 3}>
          Continuer →
        </button>
      </div>
    </div>
  )
}

// ===== Step 4: 3D Preview + Save =====
function GridfinityModule3D({ contourMm, gridW, gridH, depth }) {
  const totalW = gridW * GRID_UNIT
  const totalH = gridH * GRID_UNIT
  const s = 0.01
  const wallT = 1.2
  const baseH = depth * GRID_UNIT * 0.5

  // Grid walls
  const walls = []
  for (let i = 0; i <= gridW; i++) {
    walls.push(
      <mesh key={`v${i}`} position={[i * GRID_UNIT * s - totalW * s / 2, baseH * s / 2, 0]}>
        <boxGeometry args={[wallT * s, baseH * s, totalH * s]} />
        <meshStandardMaterial color="#B8A08A" />
      </mesh>
    )
  }
  for (let j = 0; j <= gridH; j++) {
    walls.push(
      <mesh key={`h${j}`} position={[0, baseH * s / 2, j * GRID_UNIT * s - totalH * s / 2]}>
        <boxGeometry args={[totalW * s, baseH * s, wallT * s]} />
        <meshStandardMaterial color="#B8A08A" />
      </mesh>
    )
  }

  // Tool cavity shape
  let cavityMesh = null
  if (contourMm.length >= 3) {
    const shape = new THREE.Shape()
    shape.moveTo(contourMm[0].x, contourMm[0].y)
    for (let i = 1; i < contourMm.length; i++) {
      shape.lineTo(contourMm[i].x, contourMm[i].y)
    }
    shape.closePath()

    cavityMesh = (
      <mesh position={[-totalW * s / 2, baseH * s + 1 * s, -totalH * s / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <extrudeGeometry args={[shape, { steps: 1, depth: baseH * s * 0.8, bevelEnabled: false }]} />
        <meshStandardMaterial color="#C8956C" side={THREE.DoubleSide} />
      </mesh>
    )
  }

  return (
    <group>
      <mesh position={[0, 1 * s, 0]}>
        <boxGeometry args={[totalW * s, 2 * s, totalH * s]} />
        <meshStandardMaterial color="#D4C4B0" />
      </mesh>
      {walls}
      {cavityMesh}
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

      <div className="cr-viewport">
        <div className="cr-vtabs">
          <button className={`cr-vtab ${viewMode === '3d' ? 'active' : ''}`} onClick={() => setViewMode('3d')}>Vue 3D</button>
          <button className={`cr-vtab ${viewMode === 'top' ? 'active' : ''}`} onClick={() => setViewMode('top')}>Vue dessus</button>
        </div>
        <Canvas
          camera={{ position: viewMode === 'top' ? [0, 5, 0] : [3, 3, 3], fov: 40 }}
          style={{ background: '#F5F1EC', borderRadius: '0 0 12px 12px', height: '260px' }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 8, 5]} intensity={0.8} />
          <GridfinityModule3D contourMm={contourMm} gridW={gridSize.w} gridH={gridSize.h} depth={depth} />
          <OrbitControls enablePan={false} maxPolarAngle={viewMode === 'top' ? 0.01 : Math.PI / 2} />
        </Canvas>
        <div className="cr-viewport-info">{gridSize.w}x{gridSize.h} Grille — {gridSize.w * GRID_UNIT}mm x {gridSize.h * GRID_UNIT}mm</div>
      </div>

      <div className="cr-form">
        <div className="cr-field">
          <label>Nom du module</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Pince, Casque, Tournevis..." />
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

        <div className="cr-info-grid">
          <div className="cr-info-cell">
            <span className="cr-info-label">Taille reelle</span>
            <span className="cr-info-val">{Math.round(boundsMm.w)}x{Math.round(boundsMm.h)}mm</span>
          </div>
          <div className="cr-info-cell">
            <span className="cr-info-label">Grille</span>
            <span className="cr-info-val">{gridSize.w}x{gridSize.h} unites</span>
          </div>
          <div className="cr-info-cell">
            <span className="cr-info-label">Points</span>
            <span className="cr-info-val">{contourMm.length}</span>
          </div>
        </div>
      </div>

      <div className="cr-actions">
        <button className="btn btn-secondary" onClick={onBack}>← Retour</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim()}>Sauvegarder</button>
      </div>
    </div>
  )
}

// ===== Step 5: Done =====
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
