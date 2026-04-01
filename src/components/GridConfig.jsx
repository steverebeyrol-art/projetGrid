import { GRID_UNIT } from '../data/modules'

export default function GridConfig({ gridSize, setGridSize }) {
  return (
    <div className="panel-section">
      <h3 className="panel-title">⬡ Configuration Grille</h3>
      <div className="config-row">
        <label>Largeur (X)</label>
        <div className="config-slider">
          <input
            type="range"
            min={1}
            max={10}
            value={gridSize.x}
            onChange={e => setGridSize(prev => ({ ...prev, x: Number(e.target.value) }))}
          />
          <span className="config-val">{gridSize.x}u</span>
        </div>
        <span className="config-mm">{gridSize.x * GRID_UNIT} mm</span>
      </div>
      <div className="config-row">
        <label>Profondeur (Y)</label>
        <div className="config-slider">
          <input
            type="range"
            min={1}
            max={10}
            value={gridSize.y}
            onChange={e => setGridSize(prev => ({ ...prev, y: Number(e.target.value) }))}
          />
          <span className="config-val">{gridSize.y}u</span>
        </div>
        <span className="config-mm">{gridSize.y * GRID_UNIT} mm</span>
      </div>
    </div>
  )
}
