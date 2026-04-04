import { useState, useRef, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import {
  processToolImage,
  getContourBounds,
  snapToGrid,
} from '../utils/contourDetection'
import { addModule, getCategories, addCategory } from '../utils/moduleStore'

const GRID_UNIT = 42 // mm

// ===== Step 1: Photo Upload =====
function StepUpload({ onPhotoReady }) {
  const fileRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setProcessing(true)
    setError(null)
    try {
      const result = await processToolImage(file, {
        threshold: 110,
        simplifyTolerance: 3,
      })
      if (result.contourMm.length < 10) {
        setError("Impossible de detecter le contour de l'outil. Essayez avec une photo plus contrastee sur fond blanc.")
        setProcessing(false)
        return
      }
      onPhotoReady(result)
    } catch (err) {
      console.error('Processing error:', err)
      setError("Erreur lors du traitement de l'image. Reessayez.")
    }
    setProcessing(false)
  }, [onPhotoReady])

  const handleFileInput = (e) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="creator-step-upload">
      <div className="creator-step-header">
        <div className="creator-step-number">1</div>
        <div>
          <h4>Photographiez votre outil</h4>
          <p>Placez l'outil sur une feuille A4 blanche et prenez une photo.</p>
        </div>
      </div>

      <div
        className={`creator-dropzone ${dragOver ? 'dragover' : ''} ${processing ? 'processing' : ''}`}
        onClick={() => !processing && fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {processing ? (
          <>
            <div className="creator-spinner" />
            <p>Analyse de l'image en cours...</p>
          </>
        ) : (
          <>
            <span className="creator-dropzone-icon">📁</span>
            <p><strong>Parcourir</strong> ou glisser-deposer</p>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />

      {error && <div className="creator-error">{error}</div>}

      <div className="creator-tips">
        <p className="creator-tip-title">Conseils :</p>
        <ul>
          <li>Utilisez une feuille <strong>A4 blanche</strong> comme reference de mesure</li>
          <li>Placez l'outil a plat sur la feuille</li>
          <li>Bonne luminosite, evitez les ombres</li>
          <li>L'outil doit etre plus fonce que le papier</li>
        </ul>
      </div>

      <div className="creator-examples">
        <div className="creator-example-img">📐</div>
        <div className="creator-example-img">🔧</div>
        <div className="creator-example-img">✂️</div>
        <div className="creator-example-img">🔨</div>
      </div>
    </div>
  )
}

// ===== Step 2: Contour Editor =====
function StepContour({ data, onConfirm, onBack }) {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const [threshold, setThreshold] = useState(110)
  const [offset, setOffset] = useState('medium')
  const [contour, setContour] = useState(data.contourMm)
  const [loaded, setLoaded] = useState(false)

  // Offset multiplier in mm
  const offsets = { none: 0, small: 1, medium: 2, large: 3 }

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setLoaded(true)
    }
    img.src = data.imageUrl
  }, [data.imageUrl])

  useEffect(() => {
    if (!loaded || !canvasRef.current || !imgRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = imgRef.current

    // Fit image to canvas
    const maxW = canvas.parentElement.clientWidth - 20
    const maxH = 400
    const scale = Math.min(maxW / data.maskWidth, maxH / data.maskHeight)
    canvas.width = Math.round(data.maskWidth * scale)
    canvas.height = Math.round(data.maskHeight * scale)

    // Draw original image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // Draw semi-transparent overlay on detected tool
    const overlayCanvas = document.createElement('canvas')
    overlayCanvas.width = data.maskWidth
    overlayCanvas.height = data.maskHeight
    const octx = overlayCanvas.getContext('2d')
    const imgData = octx.createImageData(data.maskWidth, data.maskHeight)
    for (let i = 0; i < data.maskWidth * data.maskHeight; i++) {
      if (data.mask[i]) {
        imgData.data[i * 4] = 139
        imgData.data[i * 4 + 1] = 110
        imgData.data[i * 4 + 2] = 78
        imgData.data[i * 4 + 3] = 80
      }
    }
    octx.putImageData(imgData, 0, 0)
    ctx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height)

    // Draw contour outline
    if (data.contourPx.length > 2) {
      ctx.beginPath()
      ctx.moveTo(data.contourPx[0].x * scale, data.contourPx[0].y * scale)
      for (let i = 1; i < data.contourPx.length; i++) {
        ctx.lineTo(data.contourPx[i].x * scale, data.contourPx[i].y * scale)
      }
      ctx.closePath()
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2.5
      ctx.stroke()
      ctx.strokeStyle = '#8B6E4E'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }, [loaded, data])

  const bounds = getContourBounds(contour)
  const gridSize = snapToGrid(bounds, GRID_UNIT)

  return (
    <div className="creator-step-contour">
      <div className="creator-step-header">
        <div className="creator-step-number">2</div>
        <div>
          <h4>Verification du contour</h4>
          <p>Le contour de votre outil a ete detecte. Verifiez et ajustez si necessaire.</p>
        </div>
      </div>

      <div className="creator-contour-canvas-wrap">
        <canvas ref={canvasRef} className="creator-contour-canvas" />
      </div>

      <div className="creator-contour-controls">
        <div className="creator-control-group">
          <label>Marge autour</label>
          <div className="creator-offset-btns">
            {Object.keys(offsets).map(key => (
              <button
                key={key}
                className={`creator-offset-btn ${offset === key ? 'active' : ''}`}
                onClick={() => setOffset(key)}
              >
                {key === 'none' ? 'Aucune' : key === 'small' ? 'Petite' : key === 'medium' ? 'Moyenne' : 'Grande'}
              </button>
            ))}
          </div>
        </div>

        <div className="creator-contour-info">
          <div className="creator-info-item">
            <span className="creator-info-label">Taille detectee</span>
            <span className="creator-info-value">{Math.round(bounds.w)}mm x {Math.round(bounds.h)}mm</span>
          </div>
          <div className="creator-info-item">
            <span className="creator-info-label">Grille requise</span>
            <span className="creator-info-value pill pill-sm">{gridSize.w}x{gridSize.h} unites</span>
          </div>
        </div>
      </div>

      <div className="creator-step-actions">
        <button className="btn btn-secondary" onClick={onBack}>← Retour</button>
        <button className="btn btn-primary" onClick={() => onConfirm({ contour, gridSize, offset: offsets[offset] })}>
          Continuer →
        </button>
      </div>
    </div>
  )
}

// ===== Step 3: 3D Preview + Save =====
function GridfinityModule({ contourMm, gridW, gridH, depth }) {
  const totalW = gridW * GRID_UNIT
  const totalH = gridH * GRID_UNIT
  const s = 0.01 // scale factor (mm to scene units)
  const wallThickness = 1.2 // mm
  const baseHeight = depth * GRID_UNIT * 0.5 // mm

  // Create the base shape
  const baseShape = new THREE.Shape()
  baseShape.moveTo(0, 0)
  baseShape.lineTo(totalW, 0)
  baseShape.lineTo(totalW, totalH)
  baseShape.lineTo(0, totalH)
  baseShape.closePath()

  // Create cavity shape from contour (as a hole)
  let cavityShape = null
  if (contourMm.length >= 3) {
    cavityShape = new THREE.Shape()
    cavityShape.moveTo(contourMm[0].x, contourMm[0].y)
    for (let i = 1; i < contourMm.length; i++) {
      cavityShape.lineTo(contourMm[i].x, contourMm[i].y)
    }
    cavityShape.closePath()
  }

  // Create grid lines for the base
  const gridLines = []
  for (let i = 0; i <= gridW; i++) {
    gridLines.push(
      <mesh key={`vl${i}`} position={[i * GRID_UNIT * s - totalW * s / 2, baseHeight * s / 2, 0]}>
        <boxGeometry args={[wallThickness * s, baseHeight * s, totalH * s]} />
        <meshStandardMaterial color="#B8A08A" />
      </mesh>
    )
  }
  for (let j = 0; j <= gridH; j++) {
    gridLines.push(
      <mesh key={`hl${j}`} position={[0, baseHeight * s / 2, j * GRID_UNIT * s - totalH * s / 2]}>
        <boxGeometry args={[totalW * s, baseHeight * s, wallThickness * s]} />
        <meshStandardMaterial color="#B8A08A" />
      </mesh>
    )
  }

  return (
    <group>
      {/* Base plate */}
      <mesh position={[0, 1 * s, 0]}>
        <boxGeometry args={[totalW * s, 2 * s, totalH * s]} />
        <meshStandardMaterial color="#D4C4B0" />
      </mesh>

      {/* Grid walls */}
      {gridLines}

      {/* Tool cavity (extruded shape) */}
      {cavityShape && (
        <mesh
          position={[-totalW * s / 2, baseHeight * s + 1 * s, -totalH * s / 2]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <extrudeGeometry args={[cavityShape, {
            steps: 1,
            depth: baseHeight * s * 0.8,
            bevelEnabled: false,
          }]} />
          <meshStandardMaterial color="#C8956C" side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}

function StepPreview({ contour, gridSize, offset, onBack, onSave }) {
  const [name, setName] = useState('')
  const [depth, setDepth] = useState(1)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState('3d') // '3d' or 'top'

  const handleSave = () => {
    if (!name.trim()) return
    setSaving(true)

    const moduleData = {
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
      contour: contour,
      offset: offset,
      createdAt: new Date().toISOString(),
    }

    addModule(moduleData)
    onSave(moduleData)
  }

  return (
    <div className="creator-step-preview">
      <div className="creator-step-header">
        <div className="creator-step-number">3</div>
        <div>
          <h4>Apercu du module</h4>
          <p>Votre module Gridfinity sur mesure est pret.</p>
        </div>
      </div>

      <div className="creator-3d-viewport">
        <div className="creator-viewport-tabs">
          <button
            className={`creator-vtab ${viewMode === '3d' ? 'active' : ''}`}
            onClick={() => setViewMode('3d')}
          >
            Vue 3D
          </button>
          <button
            className={`creator-vtab ${viewMode === 'top' ? 'active' : ''}`}
            onClick={() => setViewMode('top')}
          >
            Vue dessus
          </button>
        </div>
        <Canvas
          camera={{
            position: viewMode === 'top' ? [0, 5, 0] : [3, 3, 3],
            fov: 40,
          }}
          style={{ background: '#F5F1EC', borderRadius: '0 0 12px 12px' }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 8, 5]} intensity={0.8} />
          <GridfinityModule
            contourMm={contour}
            gridW={gridSize.w}
            gridH={gridSize.h}
            depth={depth}
          />
          <OrbitControls
            enablePan={false}
            maxPolarAngle={viewMode === 'top' ? 0.01 : Math.PI / 2}
          />
        </Canvas>
        <div className="creator-viewport-info">
          {gridSize.w}x{gridSize.h} Grille — {gridSize.w * GRID_UNIT}mm x {gridSize.h * GRID_UNIT}mm
        </div>
      </div>

      <div className="creator-save-form">
        <div className="creator-field">
          <label>Nom du module</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Pince, Marteau, Tournevis..."
          />
        </div>

        <div className="creator-field">
          <label>Profondeur (unites)</label>
          <div className="creator-depth-btns">
            {[1, 2, 3, 4].map(d => (
              <button
                key={d}
                className={`creator-depth-btn ${depth === d ? 'active' : ''}`}
                onClick={() => setDepth(d)}
              >
                {d}u ({d * GRID_UNIT * 0.5}mm)
              </button>
            ))}
          </div>
        </div>

        <div className="creator-contour-info">
          <div className="creator-info-item">
            <span className="creator-info-label">Taille grille</span>
            <span className="creator-info-value">{gridSize.w}x{gridSize.h} unites</span>
          </div>
          <div className="creator-info-item">
            <span className="creator-info-label">Dimensions</span>
            <span className="creator-info-value">{gridSize.w * GRID_UNIT}mm x {gridSize.h * GRID_UNIT}mm</span>
          </div>
          <div className="creator-info-item">
            <span className="creator-info-label">Points contour</span>
            <span className="creator-info-value">{contour.length}</span>
          </div>
        </div>
      </div>

      <div className="creator-step-actions">
        <button className="btn btn-secondary" onClick={onBack}>← Retour</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim() || saving}>
          Sauvegarder le module
        </button>
      </div>
    </div>
  )
}

// ===== Step 4: Done =====
function StepDone({ moduleData, onClose, onReset }) {
  return (
    <div className="creator-step-done">
      <div className="creator-done-icon">✅</div>
      <h4>Module "{moduleData.name}" cree !</h4>
      <p className="creator-desc">
        Votre module sur mesure ({moduleData.w}x{moduleData.d} unites) est disponible dans le catalogue
        sous la categorie "Personnalise".
      </p>
      <p className="creator-desc-sub">
        Vous pouvez le placer sur votre grille depuis le catalogue de modules.
      </p>
      <div className="creator-done-actions">
        <button className="btn btn-primary btn-block" onClick={onReset}>
          Creer un autre module
        </button>
        <button className="btn btn-secondary btn-block" onClick={onClose} style={{ marginTop: '0.5rem' }}>
          Fermer
        </button>
      </div>
    </div>
  )
}

// ===== Main Creator Component =====
export default function ModuleCreator({ onClose }) {
  const [step, setStep] = useState(1) // 1: upload, 2: contour, 3: preview, 4: done
  const [processedData, setProcessedData] = useState(null)
  const [confirmedData, setConfirmedData] = useState(null)
  const [savedModule, setSavedModule] = useState(null)

  // Ensure "custom" category exists
  useEffect(() => {
    const cats = getCategories()
    if (!cats.find(c => c.id === 'custom')) {
      addCategory({
        id: 'custom',
        name: 'Personnalise',
        icon: '🔧',
        description: 'Vos modules sur mesure crees a partir de photos.',
        slug: 'personnalise',
      })
    }
  }, [])

  const handlePhotoReady = useCallback((data) => {
    setProcessedData(data)
    setStep(2)
  }, [])

  const handleContourConfirm = useCallback(({ contour, gridSize, offset }) => {
    setConfirmedData({ contour, gridSize, offset })
    setStep(3)
  }, [])

  const handleSave = useCallback((moduleData) => {
    setSavedModule(moduleData)
    setStep(4)
  }, [])

  const handleReset = useCallback(() => {
    setStep(1)
    setProcessedData(null)
    setConfirmedData(null)
    setSavedModule(null)
  }, [])

  return (
    <div className="creator-content">
      {/* Progress bar */}
      <div className="creator-progress">
        <div className="creator-progress-steps">
          {['Photo', 'Contour', 'Apercu'].map((label, i) => (
            <div key={i} className={`creator-progress-step ${step > i + 1 ? 'done' : ''} ${step === i + 1 ? 'active' : ''}`}>
              <div className="creator-progress-dot">{step > i + 1 ? '✓' : i + 1}</div>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="creator-progress-bar">
          <div className="creator-progress-fill" style={{ width: `${((step - 1) / 3) * 100}%` }} />
        </div>
      </div>

      {step === 1 && <StepUpload onPhotoReady={handlePhotoReady} />}
      {step === 2 && processedData && (
        <StepContour data={processedData} onConfirm={handleContourConfirm} onBack={() => setStep(1)} />
      )}
      {step === 3 && confirmedData && (
        <StepPreview
          contour={confirmedData.contour}
          gridSize={confirmedData.gridSize}
          offset={confirmedData.offset}
          onBack={() => setStep(2)}
          onSave={handleSave}
        />
      )}
      {step === 4 && savedModule && (
        <StepDone moduleData={savedModule} onClose={onClose} onReset={handleReset} />
      )}
    </div>
  )
}
