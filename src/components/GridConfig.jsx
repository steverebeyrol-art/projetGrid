import { useState } from 'react'
import { GRID_UNIT } from '../data/modules'

export default function GridConfig({ gridSize, setGridSize }) {
  const [mode, setMode] = useState('units')
  const [mmX, setMmX] = useState(gridSize.x * GRID_UNIT)
  const [mmY, setMmY] = useState(gridSize.y * GRID_UNIT)

  const handleUnitsChange = (axis, value) => {
    const v = Number(value)
    setGridSize(prev => ({ ...prev, [axis]: v }))
    if (axis === 'x') setMmX(v * GRID_UNIT)
    else setMmY(v * GRID_UNIT)
  }

  const handleMmChange = (axis, value) => {
    const mm = Number(value)
    if (isNaN(mm) || mm < 0) return
    const units = Math.max(1, Math.round(mm / GRID_UNIT))
    if (axis === 'x') {
      setMmX(mm)
      setGridSize(prev => ({ ...prev, x: units }))
    } else {
      setMmY(mm)
      setGridSize(prev => ({ ...prev, y: units }))
    }
  }

  const handleMmBlur = (axis) => {
    if (axis === 'x') setMmX(gridSize.x * GRID_UNIT)
    else setMmY(gridSize.y * GRID_UNIT)
  }

  return (
    <div className="d-card">
      <div className="d-card-header">
        <h3 className="d-card-title">Configuration</h3>
        <span className="pill pill-sm">{gridSize.x * GRID_UNIT} x {gridSize.y * GRID_UNIT} mm</span>
      </div>

      <div className="grid-mode-toggle">
        <button
          className={`grid-mode-btn ${mode === 'units' ? 'active' : ''}`}
          onClick={() => setMode('units')}
        >
          Par unites
        </button>
        <button
          className={`grid-mode-btn ${mode === 'mm' ? 'active' : ''}`}
          onClick={() => setMode('mm')}
        >
          Par dimensions
        </button>
      </div>

      {mode === 'units' ? (
        <>
          <div className="config-row">
            <label>Largeur (X)</label>
            <div className="config-slider">
              <input
                type="range"
                min={1}
                max={16}
                value={gridSize.x}
                onChange={e => handleUnitsChange('x', e.target.value)}
              />
              <span className="config-val">{gridSize.x}u</span>
            </div>
          </div>
          <div className="config-dim-result">
            {gridSize.x} x 42 mm = <strong>{gridSize.x * GRID_UNIT} mm</strong>
          </div>

          <div className="config-row" style={{ marginTop: '0.5rem' }}>
            <label>Profondeur (Y)</label>
            <div className="config-slider">
              <input
                type="range"
                min={1}
                max={16}
                value={gridSize.y}
                onChange={e => handleUnitsChange('y', e.target.value)}
              />
              <span className="config-val">{gridSize.y}u</span>
            </div>
          </div>
          <div className="config-dim-result">
            {gridSize.y} x 42 mm = <strong>{gridSize.y * GRID_UNIT} mm</strong>
          </div>
        </>
      ) : (
        <>
          <div className="config-mm-input">
            <label>Largeur souhaitee</label>
            <div className="config-mm-row">
              <input
                type="number"
                min={GRID_UNIT}
                step={1}
                value={mmX}
                onChange={e => handleMmChange('x', e.target.value)}
                onBlur={() => handleMmBlur('x')}
              />
              <span className="config-mm-unit">mm</span>
            </div>
            <div className="config-dim-calc">
              &rarr; <strong>{gridSize.x} carres</strong> de 42 mm = {gridSize.x * GRID_UNIT} mm
              {mmX !== gridSize.x * GRID_UNIT && (
                <span className="config-dim-diff"> (arrondi depuis {mmX} mm)</span>
              )}
            </div>
          </div>

          <div className="config-mm-input">
            <label>Profondeur souhaitee</label>
            <div className="config-mm-row">
              <input
                type="number"
                min={GRID_UNIT}
                step={1}
                value={mmY}
                onChange={e => handleMmChange('y', e.target.value)}
                onBlur={() => handleMmBlur('y')}
              />
              <span className="config-mm-unit">mm</span>
            </div>
            <div className="config-dim-calc">
              &rarr; <strong>{gridSize.y} carres</strong> de 42 mm = {gridSize.y * GRID_UNIT} mm
              {mmY !== gridSize.y * GRID_UNIT && (
                <span className="config-dim-diff"> (arrondi depuis {mmY} mm)</span>
              )}
            </div>
          </div>
        </>
      )}

      <div className="config-summary">
        <div className="config-summary-label">Grille totale</div>
        <div className="config-summary-value">
          {gridSize.x}x{gridSize.y} ({gridSize.x * GRID_UNIT} x {gridSize.y * GRID_UNIT} mm)
        </div>
      </div>
    </div>
  )
}
