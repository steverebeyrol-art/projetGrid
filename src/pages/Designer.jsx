import { useState, useRef, useCallback } from 'react'
import ModuleCatalog from '../components/ModuleCatalog'
import DesignerViewport from '../components/DesignerViewport'
import PropertiesPanel from '../components/PropertiesPanel'
import GridConfig from '../components/GridConfig'
import { downloadSTL } from '../utils/stlExporter'

export default function Designer() {
  const [gridSize, setGridSize] = useState({ x: 4, y: 4 })
  const [placedModules, setPlacedModules] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [draggedModule, setDraggedModule] = useState(null)
  const sceneRef = useRef(null)

  const handleDropModule = useCallback((moduleData, gridX, gridY) => {
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
      // Swap w and d on rotation
      const swapped = newRotation % 180 !== (m.rotation - 90 + 360) % 180
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
    if (sceneRef.current) {
      downloadSTL(sceneRef.current, 'gridmodular-design.stl')
    }
  }

  const selectedModule = placedModules.find(m => m.id === selectedId) || null

  return (
    <div className="designer">
      {/* Left panel - Module catalog */}
      <div className="designer-left">
        <GridConfig gridSize={gridSize} setGridSize={setGridSize} />
        <ModuleCatalog
          onDragStart={setDraggedModule}
          onDragEnd={() => setDraggedModule(null)}
        />
      </div>

      {/* Center - 3D Viewport */}
      <div className="designer-center">
        <DesignerViewport
          gridSize={gridSize}
          placedModules={placedModules}
          selectedId={selectedId}
          onSelectModule={handleSelectModule}
          onDropModule={handleDropModule}
          onMoveModule={handleMoveModule}
          draggedModule={draggedModule}
          sceneRef={sceneRef}
        />
        <div className="viewport-toolbar">
          <button className="btn btn-primary btn-sm" onClick={handleExport}>
            📥 Export STL
          </button>
        </div>
        <div className="viewport-info">
          LMB: Rotation &nbsp;|&nbsp; RMB: Translation &nbsp;|&nbsp; Molette: Zoom &nbsp;|&nbsp; Clic: Sélectionner
        </div>
      </div>

      {/* Right panel - Properties */}
      <div className="designer-right">
        <PropertiesPanel
          module={selectedModule}
          gridSize={gridSize}
          onRotate={handleRotateModule}
          onDelete={handleDeleteModule}
          onDuplicate={handleDuplicateModule}
          onUpdate={handleUpdateModule}
          placedModules={placedModules}
        />
      </div>
    </div>
  )
}
