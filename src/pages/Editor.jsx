import { useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import * as THREE from 'three'
import { STLLoader } from 'three-stdlib'
import Sidebar from '../components/Sidebar'
import Viewport from '../components/Viewport'

const defaultBoxConfig = {
  unitsX: 2,
  unitsY: 2,
  unitsZ: 3,
  wallThickness: 1.2,
  lipStyle: 'standard',
  hasMagnets: false,
  hasScrews: false,
}

const defaultBaseplateConfig = {
  unitsX: 3,
  unitsY: 3,
}

const defaultCutoutConfig = {
  unitsX: 2,
  unitsY: 2,
  unitsZ: 4,
  wallThickness: 1.2,
  lipStyle: 'standard',
  hasMagnets: false,
  hasScrews: false,
  hasImportedSTL: false,
  importX: 0,
  importY: 0,
  importZ: 0,
  importRotX: 0,
  importRotY: 0,
  importRotZ: 0,
  importScale: 1,
}

function getDefaultConfig(type) {
  switch (type) {
    case 'box': return { ...defaultBoxConfig }
    case 'baseplate': return { ...defaultBaseplateConfig }
    case 'cutout': return { ...defaultCutoutConfig }
    default: return { ...defaultBoxConfig }
  }
}

export default function Editor() {
  const { type } = useParams()
  const [config, setConfig] = useState(() => getDefaultConfig(type))
  const [elements, setElements] = useState([])
  const [selectedElement, setSelectedElement] = useState(null)
  const [stlGeometry, setStlGeometry] = useState(null)
  const [showImported, setShowImported] = useState(true)
  const modelRef = useRef(null)

  const handleImportSTL = useCallback((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const loader = new STLLoader()
      const geometry = loader.parse(e.target.result)
      geometry.computeVertexNormals()
      geometry.center()
      setStlGeometry(geometry)
      setConfig((prev) => ({ ...prev, hasImportedSTL: true }))
    }
    reader.readAsArrayBuffer(file)
  }, [])

  return (
    <div className="editor">
      <Sidebar
        type={type}
        config={config}
        setConfig={setConfig}
        elements={elements}
        setElements={setElements}
        selectedElement={selectedElement}
        setSelectedElement={setSelectedElement}
        showImported={showImported}
        setShowImported={setShowImported}
        onImportSTL={handleImportSTL}
        modelRef={modelRef}
      />
      <Viewport
        type={type}
        config={config}
        elements={elements}
        selectedElement={selectedElement}
        onSelectElement={setSelectedElement}
        stlGeometry={stlGeometry}
        showImported={showImported}
        modelRef={modelRef}
      />
    </div>
  )
}
