import { useState } from 'react'
import { CATEGORIES } from '../data/modules'

export default function ModuleCatalog({ onDragStart, onDragEnd }) {
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
                    className="module-card"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify(mod))
                      onDragStart(mod)
                    }}
                    onDragEnd={onDragEnd}
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
    </div>
  )
}
