import { useState, useRef, useCallback } from 'react'
import ModuleCatalog from '../components/ModuleCatalog'
import ModuleCreator from '../components/ModuleCreator'
import DesignerViewport from '../components/DesignerViewport'
import PropertiesPanel from '../components/PropertiesPanel'
import GridConfig from '../components/GridConfig'
import { downloadSTL } from '../utils/stlExporter'
import { addFabrication, addDownload, canDownload } from '../utils/auth'
import { useAuth } from '../components/AuthContext'

export default function Designer() {
  const [gridSize, setGridSize] = useState({ x: 4, y: 4 })
  const [placedModules, setPlacedModules] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [catalogModule, setCatalogModule] = useState(null)
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const sceneRef = useRef(null)
  const { user, refreshUser } = useAuth()

  const handlePlaceModule = useCallback((moduleData, gridX, gridY) => {
    const newModule = {
      id: Date.now() + Math.random(),
      moduleId: moduleData.id,
      name: moduleData.name,
      icon: moduleData.icon,
      color: moduleData.color,
      w: moduleData.w,
      d: moduleData.d,
      h: moduleData.h,
      gridX,
      gridY,
      rotation: 0,
    }
    setPlacedModules(prev => [...prev, newModule])
    setSelectedId(newModule.id)
  }, [])

  const handleSelectModule = useCallback((id) => {
    setSelectedId(id)
  }, [])

  const handleMoveModule = useCallback((id, newGridX, newGridY) => {
    setPlacedModules(prev => prev.map(m =>
      m.id === id ? { ...m, gridX: newGridX, gridY: newGridY } : m
    ))
  }, [])

  const handleRotateModule = useCallback((id) => {
    setPlacedModules(prev => prev.map(m => {
      if (m.id !== id) return m
      const newRotation = (m.rotation + 90) % 360
      return { ...m, rotation: newRotation, w: m.d, d: m.w }
    }))
  }, [])

  const handleDeleteModule = useCallback((id) => {
    setPlacedModules(prev => prev.filter(m => m.id !== id))
    if (selectedId === id) setSelectedId(null)
  }, [selectedId])

  const handleDuplicateModule = useCallback((id) => {
    const mod = placedModules.find(m => m.id === id)
    if (!mod) return
    const newModule = {
      ...mod,
      id: Date.now() + Math.random(),
      gridX: Math.min(mod.gridX + 1, gridSize.x - 1),
    }
    setPlacedModules(prev => [...prev, newModule])
    setSelectedId(newModule.id)
  }, [placedModules, gridSize])

  const handleUpdateModule = useCallback((id, updates) => {
    setPlacedModules(prev => prev.map(m =>
      m.id === id ? { ...m, ...updates } : m
    ))
  }, [])

  const handleExport = () => {
    if (!user) {
      alert('Connectez-vous pour exporter vos modèles.')
      return
    }
    if (!canDownload()) {
      alert('Vous avez atteint la limite de téléchargements. Passez à un forfait supérieur.')
      return
    }
    if (sceneRef.current) {
      const filename = 'modo-design.stl'
      downloadSTL(sceneRef.current, filename)
      addDownload(filename)
      addFabrication({
        name: `Config ${new Date().toLocaleDateString('fr-FR')}`,
        gridSize: gridSize,
        moduleCount: placedModules.length,
        modules: placedModules.map(m => ({ name: m.name, gridX: m.gridX, gridY: m.gridY })),
      })
      refreshUser()
    }
  }

  const selectedModule = placedModules.find(m => m.id === selectedId) || null

  return (
    <div className="designer">
      {/* Left panel */}
      <div className={`designer-left ${leftCollapsed ? 'collapsed' : ''}`}>
        <button className="panel-collapse-btn" onClick={() => setLeftCollapsed(!leftCollapsed)} title={leftCollapsed ? 'Ouvrir' : 'Réduire'}>
          {leftCollapsed ? '▶' : '◀'}
        </button>
        {!leftCollapsed && (
          <>
            <GridConfig gridSize={gridSize} setGridSize={setGridSize} />
            <ModuleCatalog
              activeModule={catalogModule}
              onSelectModule={setCatalogModule}
            />
            <ModuleCreator />
          </>
        )}
      </div>

      {/* Center - 3D Viewport */}
      <div className="designer-center">
        <DesignerViewport
          gridSize={gridSize}
          placedModules={placedModules}
          selectedId={selectedId}
          onSelectModule={handleSelectModule}
          onPlaceModule={handlePlaceModule}
          onMoveModule={handleMoveModule}
          catalogModule={catalogModule}
          sceneRef={sceneRef}
        />
        <div className="viewport-toolbar">
          <button className="btn btn-primary btn-sm" onClick={handleExport}>
            📥 Export STL
          </button>
        </div>
        <div className="viewport-info">
          {catalogModule
            ? `Mode placement : ${catalogModule.name} — Cliquez sur la grille pour placer, Echap pour annuler`
            : 'Clic gauche: Rotation | Clic droit: Translation | Molette: Zoom | Clic sur module: Sélectionner/Déplacer'
          }
        </div>
      </div>

      {/* Right panel */}
      <div className={`designer-right ${rightCollapsed ? 'collapsed' : ''}`}>
        <button className="panel-collapse-btn right" onClick={() => setRightCollapsed(!rightCollapsed)} title={rightCollapsed ? 'Ouvrir' : 'Réduire'}>
          {rightCollapsed ? '◀' : '▶'}
        </button>
        {!rightCollapsed && (
          <PropertiesPanel
            module={selectedModule}
            gridSize={gridSize}
            onRotate={handleRotateModule}
            onDelete={handleDeleteModule}
            onDuplicate={handleDuplicateModule}
            onUpdate={handleUpdateModule}
            placedModules={placedModules}
          />
        )}
      </div>
    </div>
  )
}
