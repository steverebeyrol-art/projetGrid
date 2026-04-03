import { GRID_UNIT, GRID_HEIGHT_UNIT } from '../data/modules'

export default function PropertiesPanel({ module, gridSize, onRotate, onDelete, onDuplicate, onUpdate, placedModules }) {
  if (!module) {
    return (
      <>
        <div className="d-card">
          <div className="d-card-header">
            <h3 className="d-card-title">Proprietes</h3>
          </div>
          <p className="d-card-hint">Selectionnez un module sur la grille pour voir ses proprietes.</p>
        </div>

        {placedModules && placedModules.length > 0 && (
          <div className="d-card">
            <div className="d-card-header">
              <h3 className="d-card-title">Modules places</h3>
              <span className="pill pill-sm">{placedModules.length}</span>
            </div>
            <div className="placed-list">
              {placedModules.map(m => (
                <div key={m.id} className="placed-item">
                  <span>{m.icon} {m.name}</span>
                  <span className="placed-pos">({m.gridX}, {m.gridY})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div className="d-card">
        <div className="d-card-header">
          <h3 className="d-card-title">Proprietes</h3>
          <span className="pill pill-sm">Selection</span>
        </div>

        <div className="prop-module-header">
          <div className="prop-module-icon" style={{ background: module.color }}>
            {module.icon}
          </div>
          <div>
            <div className="prop-module-name">{module.name}</div>
            <div className="prop-module-size">
              {module.w}x{module.d}x{module.h}u
              ({module.w * GRID_UNIT}x{module.d * GRID_UNIT}x{module.h * GRID_HEIGHT_UNIT} mm)
            </div>
          </div>
        </div>
      </div>

      <div className="d-card">
        <h4 className="d-card-subtitle">Position</h4>
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

      <div className="d-card">
        <h4 className="d-card-subtitle">Rotation</h4>
        <div className="prop-rotation">
          <span className="rotation-value">{module.rotation}&#176;</span>
          <button className="btn btn-secondary btn-sm" onClick={() => onRotate(module.id)}>
            Tourner 90&#176;
          </button>
        </div>
      </div>

      <div className="d-card">
        <h4 className="d-card-subtitle">Actions</h4>
        <div className="prop-actions">
          <button className="btn btn-secondary btn-sm btn-block" onClick={() => onDuplicate(module.id)}>
            Dupliquer
          </button>
          <button className="btn btn-danger btn-sm btn-block" onClick={() => onDelete(module.id)}>
            Supprimer
          </button>
        </div>
      </div>

      {placedModules && placedModules.length > 0 && (
        <div className="d-card">
          <div className="d-card-header">
            <h3 className="d-card-title">Tous les modules</h3>
            <span className="pill pill-sm">{placedModules.length}</span>
          </div>
          <div className="placed-list">
            {placedModules.map(m => (
              <div key={m.id} className={`placed-item ${m.id === module.id ? 'active' : ''}`}>
                <span>{m.icon} {m.name}</span>
                <span className="placed-pos">({m.gridX}, {m.gridY})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
