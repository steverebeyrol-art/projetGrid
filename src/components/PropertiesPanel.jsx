import { GRID_UNIT, GRID_HEIGHT_UNIT } from '../data/modules'

export default function PropertiesPanel({ module, gridSize, onRotate, onDelete, onDuplicate, onUpdate, placedModules }) {
  if (!module) {
    return (
      <div className="panel-section">
        <h3 className="panel-title">📋 Propriétés</h3>
        <p className="panel-empty">Sélectionnez un module sur la grille ou glissez-en un depuis le catalogue.</p>
        {placedModules && placedModules.length > 0 && (
          <div className="placed-list">
            <h4 className="panel-subtitle">Modules placés ({placedModules.length})</h4>
            {placedModules.map(m => (
              <div key={m.id} className="placed-item">
                <span>{m.icon} {m.name}</span>
                <span className="placed-pos">({m.gridX}, {m.gridY})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="panel-section">
      <h3 className="panel-title">📋 Propriétés</h3>

      <div className="prop-module-header">
        <div className="prop-module-icon" style={{ background: module.color }}>
          {module.icon}
        </div>
        <div>
          <div className="prop-module-name">{module.name}</div>
          <div className="prop-module-size">
            {module.w}×{module.d}×{module.h}u
            ({module.w * GRID_UNIT}×{module.d * GRID_UNIT}×{module.h * GRID_HEIGHT_UNIT} mm)
          </div>
        </div>
      </div>

      <div className="prop-group">
        <h4 className="panel-subtitle">Position</h4>
        <div className="prop-row">
          <label>X</label>
          <input
            type="number"
            min={0}
            max={gridSize.x - module.w}
            value={module.gridX}
            onChange={e => onUpdate(module.id, { gridX: Math.max(0, Math.min(gridSize.x - module.w, Number(e.target.value))) })}
          />
        </div>
        <div className="prop-row">
          <label>Y</label>
          <input
            type="number"
            min={0}
            max={gridSize.y - module.d}
            value={module.gridY}
            onChange={e => onUpdate(module.id, { gridY: Math.max(0, Math.min(gridSize.y - module.d, Number(e.target.value))) })}
          />
        </div>
      </div>

      <div className="prop-group">
        <h4 className="panel-subtitle">Rotation</h4>
        <div className="prop-rotation">
          <span className="rotation-value">{module.rotation}°</span>
          <button className="btn btn-secondary btn-sm" onClick={() => onRotate(module.id)}>
            ↻ Tourner 90°
          </button>
        </div>
      </div>

      <div className="prop-actions">
        <button className="btn btn-secondary btn-sm btn-block" onClick={() => onDuplicate(module.id)}>
          ⧉ Dupliquer
        </button>
        <button className="btn btn-danger btn-sm btn-block" onClick={() => onDelete(module.id)}>
          🗑 Supprimer
        </button>
      </div>

      {placedModules && placedModules.length > 0 && (
        <div className="placed-list">
          <h4 className="panel-subtitle">Tous les modules ({placedModules.length})</h4>
          {placedModules.map(m => (
            <div key={m.id} className={`placed-item ${m.id === module.id ? 'active' : ''}`}>
              <span>{m.icon} {m.name}</span>
              <span className="placed-pos">({m.gridX}, {m.gridY})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
