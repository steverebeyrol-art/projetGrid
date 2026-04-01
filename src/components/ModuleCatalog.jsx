import { useState } from 'react'
import { CATEGORIES } from '../data/modules'

export default function ModuleCatalog({ activeModule, onSelectModule }) {
  const [openCategory, setOpenCategory] = useState(CATEGORIES[0].id)
  const [search, setSearch] = useState('')

  const filteredCategories = CATEGORIES.map(cat => ({
    ...cat,
    modules: cat.modules.filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.modules.length > 0)

  return (
    <div className="panel-section catalog-section">
      <h3 className="panel-title">🧩 Modules</h3>
      <p className="panel-hint">Cliquez sur un module puis cliquez sur la grille pour le placer.</p>

      <input
        type="text"
        className="catalog-search"
        placeholder="Rechercher un module..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="catalog-categories">
        {filteredCategories.map(cat => (
          <div key={cat.id} className="catalog-category">
            <button
              className={`category-header ${openCategory === cat.id ? 'open' : ''}`}
              onClick={() => setOpenCategory(openCategory === cat.id ? null : cat.id)}
            >
              <span>{cat.icon} {cat.name}</span>
              <span className="category-count">{cat.modules.length}</span>
            </button>

            {openCategory === cat.id && (
              <div className="category-modules">
                {cat.modules.map(mod => (
                  <div
                    key={mod.id}
                    className={`module-card ${activeModule?.id === mod.id ? 'active' : ''}`}
                    onClick={() => onSelectModule(activeModule?.id === mod.id ? null : mod)}
                  >
                    <div className="module-card-icon" style={{ background: mod.color }}>
                      {mod.icon}
                    </div>
                    <div className="module-card-info">
                      <div className="module-card-name">{mod.name}</div>
                      <div className="module-card-size">{mod.w}×{mod.d}×{mod.h}u</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {activeModule && (
        <div className="catalog-active">
          <div className="catalog-active-inner">
            <span className="catalog-active-icon" style={{ background: activeModule.color }}>{activeModule.icon}</span>
            <span className="catalog-active-name">{activeModule.name}</span>
            <button className="catalog-active-cancel" onClick={() => onSelectModule(null)}>✕</button>
          </div>
          <p className="catalog-active-hint">Cliquez sur la grille pour placer le module</p>
        </div>
      )}
    </div>
  )
}
