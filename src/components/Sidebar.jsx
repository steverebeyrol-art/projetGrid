import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { GRID_X, GRID_Y, GRID_Z, BASE_HEIGHT, LIP_HEIGHT, formatDimension } from '../utils/units'
import { downloadSTL } from '../utils/stlExporter'

function DimensionDisplay({ label, units, axis, useInches }) {
  return (
    <div className="dim-display">
      <span className="dim-label">{label}</span>
      <span className="dim-value">{formatDimension(units, axis, useInches)}</span>
    </div>
  )
}

function Slider({ label, value, min, max, step, onChange, suffix }) {
  return (
    <div className="control-row">
      <label>{label}</label>
      <div className="slider-group">
        <input type="range" min={min} max={max} step={step || 1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
        <span className="slider-val">{value}{suffix || ''}</span>
      </div>
    </div>
  )
}

function ElementsList({ elements, selectedElement, onSelect, onAdd, onDuplicate, onDelete, onUpdate, config }) {
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const maxX = config.unitsX * 4
  const maxY = config.unitsY * 4

  const handleContextMenu = (e, idx) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, idx })
  }

  return (
    <div className="sidebar-section">
      <h3>Elements</h3>
      <div className="elements-list">
        {elements.map((el, idx) => (
          <div
            key={idx}
            className={`element-item ${selectedElement === idx ? 'selected' : ''}`}
            onClick={() => onSelect(idx)}
            onContextMenu={(e) => handleContextMenu(e, idx)}
          >
            <div>
              <div className="el-name">
                {el.type === 'wall' ? '╫ Wall' : el.type === 'scoop' ? '◗ Scoop' : '▭ Tab'}
              </div>
              <div className="el-info">
                {el.type === 'wall' && `${el.orientation.toUpperCase()}-axis, len: ${el.length}u, pos: (${el.posX / 4}, ${el.posY / 4})`}
                {el.type === 'scoop' && `width: ${el.width}u, pos: (${el.posX / 4}, ${el.posY / 4})`}
                {el.type === 'tab' && `pos: (${el.posX / 4}, ${el.posY / 4})`}
              </div>
            </div>
            <div className="element-actions">
              <button title="Duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate(idx) }}>⧉</button>
              <button title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(idx) }}>✕</button>
            </div>
          </div>
        ))}

        <div className="add-menu">
          {showAddMenu && (
            <div className="add-dropdown">
              <button onClick={() => { onAdd('wall'); setShowAddMenu(false) }}>╫ Interior Wall</button>
              <button onClick={() => { onAdd('scoop'); setShowAddMenu(false) }}>◗ Scoop</button>
              <button onClick={() => { onAdd('tab'); setShowAddMenu(false) }}>▭ Label Tab</button>
            </div>
          )}
          <button className="add-element-btn" onClick={() => setShowAddMenu(!showAddMenu)}>
            + Add Element
          </button>
        </div>
      </div>

      {/* Selected element editor */}
      {selectedElement !== null && elements[selectedElement] && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <h3>Edit: {elements[selectedElement].type}</h3>
          {elements[selectedElement].type === 'wall' && (
            <>
              <div className="control-row" style={{ marginTop: '0.5rem' }}>
                <label>Axis</label>
                <div className="toggle-group">
                  <button
                    className={elements[selectedElement].orientation === 'x' ? 'active' : ''}
                    onClick={() => onUpdate(selectedElement, { orientation: 'x' })}
                  >X</button>
                  <button
                    className={elements[selectedElement].orientation === 'y' ? 'active' : ''}
                    onClick={() => onUpdate(selectedElement, { orientation: 'y' })}
                  >Y</button>
                </div>
              </div>
              <Slider label="Pos X" value={elements[selectedElement].posX} min={0} max={maxX} step={1} onChange={(v) => onUpdate(selectedElement, { posX: v })} suffix="/4u" />
              <Slider label="Pos Y" value={elements[selectedElement].posY} min={0} max={maxY} step={1} onChange={(v) => onUpdate(selectedElement, { posY: v })} suffix="/4u" />
              <Slider
                label="Length"
                value={elements[selectedElement].length}
                min={1}
                max={elements[selectedElement].orientation === 'x' ? config.unitsX : config.unitsY}
                onChange={(v) => onUpdate(selectedElement, { length: v })}
                suffix="u"
              />
            </>
          )}
          {elements[selectedElement].type === 'scoop' && (
            <>
              <Slider label="Pos X" value={elements[selectedElement].posX} min={0} max={maxX} step={1} onChange={(v) => onUpdate(selectedElement, { posX: v })} suffix="/4u" />
              <Slider label="Pos Y" value={elements[selectedElement].posY} min={0} max={maxY} step={1} onChange={(v) => onUpdate(selectedElement, { posY: v })} suffix="/4u" />
              <Slider label="Width" value={elements[selectedElement].width} min={1} max={config.unitsX} onChange={(v) => onUpdate(selectedElement, { width: v })} suffix="u" />
            </>
          )}
          {elements[selectedElement].type === 'tab' && (
            <>
              <Slider label="Pos X" value={elements[selectedElement].posX} min={0} max={maxX} step={1} onChange={(v) => onUpdate(selectedElement, { posX: v })} suffix="/4u" />
              <Slider label="Pos Y" value={elements[selectedElement].posY} min={0} max={maxY} step={1} onChange={(v) => onUpdate(selectedElement, { posY: v })} suffix="/4u" />
            </>
          )}
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setContextMenu(null)} />
          <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
            <button onClick={() => { onDuplicate(contextMenu.idx); setContextMenu(null) }}>Duplicate</button>
            <button className="danger" onClick={() => { onDelete(contextMenu.idx); setContextMenu(null) }}>Delete</button>
          </div>
        </>
      )}
    </div>
  )
}

export default function Sidebar({ type, config, setConfig, elements, setElements, selectedElement, setSelectedElement, showImported, setShowImported, onImportSTL, modelRef }) {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [useInches, setUseInches] = useState(false)

  const updateConfig = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleAddElement = (elType) => {
    const newEl = elType === 'wall'
      ? { type: 'wall', orientation: 'x', posX: 4, posY: 4, length: 1 }
      : elType === 'scoop'
      ? { type: 'scoop', posX: 0, posY: 0, width: 1 }
      : { type: 'tab', posX: 4, posY: 0 }
    setElements((prev) => [...prev, newEl])
    setSelectedElement(elements.length)
  }

  const handleDuplicate = (idx) => {
    const el = { ...elements[idx] }
    el.posX = Math.min(el.posX + 2, config.unitsX * 4)
    setElements((prev) => [...prev, el])
  }

  const handleDelete = (idx) => {
    setElements((prev) => prev.filter((_, i) => i !== idx))
    if (selectedElement === idx) setSelectedElement(null)
    else if (selectedElement > idx) setSelectedElement(selectedElement - 1)
  }

  const handleUpdate = (idx, updates) => {
    setElements((prev) => prev.map((el, i) => i === idx ? { ...el, ...updates } : el))
  }

  const handleExport = () => {
    if (modelRef?.current) {
      downloadSTL(modelRef.current, `gridfinity-${type}.stl`)
    }
  }

  const handleFileImport = (e) => {
    const file = e.target.files[0]
    if (file && onImportSTL) {
      onImportSTL(file)
    }
  }

  const totalHeight = type !== 'baseplate'
    ? (config.unitsZ * GRID_Z + (config.lipStyle !== 'none' ? LIP_HEIGHT : 0))
    : BASE_HEIGHT

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <button className="back-btn" onClick={() => navigate('/')}>←</button>
        <h2>{type === 'box' ? 'Box Editor' : type === 'baseplate' ? 'Baseplate Editor' : 'Cutout Editor'}</h2>
      </div>

      <div className="sidebar-content">
        {/* Unit toggle */}
        <div className="sidebar-section">
          <h3>Units</h3>
          <div className="toggle-group">
            <button className={!useInches ? 'active' : ''} onClick={() => setUseInches(false)}>Millimeters</button>
            <button className={useInches ? 'active' : ''} onClick={() => setUseInches(true)}>Inches</button>
          </div>
        </div>

        {/* Size */}
        <div className="sidebar-section">
          <h3>Size</h3>
          <Slider label="X Units" value={config.unitsX} min={1} max={8} onChange={(v) => updateConfig('unitsX', v)} />
          <DimensionDisplay label="Width" units={config.unitsX} axis="x" useInches={useInches} />
          <div style={{ height: '0.4rem' }} />
          <Slider label="Y Units" value={config.unitsY} min={1} max={8} onChange={(v) => updateConfig('unitsY', v)} />
          <DimensionDisplay label="Depth" units={config.unitsY} axis="y" useInches={useInches} />
          {type !== 'baseplate' && (
            <>
              <div style={{ height: '0.4rem' }} />
              <Slider label="Z Units" value={config.unitsZ} min={1} max={10} onChange={(v) => updateConfig('unitsZ', v)} />
              <DimensionDisplay label="Height" units={config.unitsZ} axis="z" useInches={useInches} />
              <div className="dim-display" style={{ marginTop: '0.3rem' }}>
                <span className="dim-label">Total Height</span>
                <span className="dim-value">
                  {useInches ? `${(totalHeight / 25.4).toFixed(2)}″` : `${totalHeight.toFixed(1)} mm`}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Wall & Lip (box and cutout only) */}
        {type !== 'baseplate' && (
          <div className="sidebar-section">
            <h3>Walls & Lip</h3>
            <Slider label="Wall Thickness" value={config.wallThickness} min={0.6} max={3} step={0.2} onChange={(v) => updateConfig('wallThickness', v)} suffix="mm" />
            <div className="control-row">
              <label>Lip Style</label>
              <select value={config.lipStyle} onChange={(e) => updateConfig('lipStyle', e.target.value)}>
                <option value="standard">Standard</option>
                <option value="reduced">Reduced</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
        )}

        {/* Magnets & Screws */}
        {type !== 'baseplate' && (
          <div className="sidebar-section">
            <h3>Fasteners</h3>
            <div className="checkbox-row">
              <input type="checkbox" id="magnets" checked={config.hasMagnets} onChange={(e) => updateConfig('hasMagnets', e.target.checked)} />
              <label htmlFor="magnets">Magnet holes (6.2 × 2.4 mm)</label>
            </div>
            <div className="checkbox-row">
              <input type="checkbox" id="screws" checked={config.hasScrews} onChange={(e) => updateConfig('hasScrews', e.target.checked)} />
              <label htmlFor="screws">Screw holes (2.5 × 6 mm)</label>
            </div>
          </div>
        )}

        {/* Box elements */}
        {type === 'box' && (
          <ElementsList
            elements={elements}
            selectedElement={selectedElement}
            onSelect={setSelectedElement}
            onAdd={handleAddElement}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            config={config}
          />
        )}

        {/* Cutout STL import */}
        {type === 'cutout' && (
          <div className="sidebar-section">
            <h3>Import STL</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept=".stl"
              style={{ display: 'none' }}
              onChange={handleFileImport}
            />
            <div className="file-upload" onClick={() => fileInputRef.current?.click()}>
              <div className="upload-icon">⬆</div>
              <p>Click to import STL file</p>
            </div>

            {config.hasImportedSTL && (
              <>
                <div style={{ marginTop: '0.75rem' }}>
                  <div className="checkbox-row">
                    <input type="checkbox" id="showImported" checked={showImported} onChange={(e) => setShowImported(e.target.checked)} />
                    <label htmlFor="showImported">Show imported model</label>
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <h3>Transform</h3>
                  <div className="transform-controls" style={{ marginTop: '0.4rem' }}>
                    <div className="tc-field">
                      <label>X</label>
                      <input type="number" value={config.importX} step={1} onChange={(e) => updateConfig('importX', Number(e.target.value))} />
                    </div>
                    <div className="tc-field">
                      <label>Y</label>
                      <input type="number" value={config.importY} step={1} onChange={(e) => updateConfig('importY', Number(e.target.value))} />
                    </div>
                    <div className="tc-field">
                      <label>Z</label>
                      <input type="number" value={config.importZ} step={1} onChange={(e) => updateConfig('importZ', Number(e.target.value))} />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '0.5rem' }}>
                  <h3>Rotation (15° steps)</h3>
                  <div className="transform-controls" style={{ marginTop: '0.4rem' }}>
                    <div className="tc-field">
                      <label>RX</label>
                      <input type="number" value={config.importRotX} step={15} onChange={(e) => updateConfig('importRotX', Number(e.target.value))} />
                    </div>
                    <div className="tc-field">
                      <label>RY</label>
                      <input type="number" value={config.importRotY} step={15} onChange={(e) => updateConfig('importRotY', Number(e.target.value))} />
                    </div>
                    <div className="tc-field">
                      <label>RZ</label>
                      <input type="number" value={config.importRotZ} step={15} onChange={(e) => updateConfig('importRotZ', Number(e.target.value))} />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '0.5rem' }}>
                  <Slider label="Scale" value={config.importScale} min={0.1} max={5} step={0.1} onChange={(v) => updateConfig('importScale', v)} suffix="×" />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <button className="btn btn-primary btn-block" onClick={handleExport}>
          ↓ Export STL
        </button>
      </div>
    </div>
  )
}
