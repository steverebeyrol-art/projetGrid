import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'
import {
  getAllCategories, getCategories, getModules,
  addCategory, updateCategory, deleteCategory,
  addModule, updateModule, deleteModule, resetToDefaults,
} from '../utils/moduleStore'

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('categories')
  const [categories, setCategories] = useState(() => getAllCategories())
  const [showCatForm, setShowCatForm] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [showModForm, setShowModForm] = useState(false)
  const [editingMod, setEditingMod] = useState(null)
  const [selectedCatId, setSelectedCatId] = useState(null)

  useEffect(() => {
    if (!user || !user.isAdmin) navigate('/login')
  }, [user, navigate])

  if (!user || !user.isAdmin) return null

  const refresh = () => setCategories(getAllCategories())
  const totalModules = getModules().length
  const totalCats = getCategories().length

  // Category handlers
  const handleSaveCat = (data) => {
    if (editingCat) {
      updateCategory(editingCat.id, data)
    } else {
      addCategory({ ...data, id: `cat-${Date.now()}` })
    }
    refresh()
    setShowCatForm(false)
    setEditingCat(null)
  }

  const handleDeleteCat = (id) => {
    const cat = categories.find(c => c.id === id)
    if (!confirm(`Supprimer "${cat?.name}" et tous ses modules ?`)) return
    deleteCategory(id)
    refresh()
    if (selectedCatId === id) setSelectedCatId(null)
  }

  const handleEditCat = (cat) => {
    setEditingCat(cat)
    setShowCatForm(true)
  }

  // Module handlers
  const handleSaveMod = (data) => {
    if (editingMod) {
      updateModule(editingMod.id, data)
    } else {
      addModule({ ...data, id: `mod-${Date.now()}`, createdAt: new Date().toISOString() })
    }
    refresh()
    setShowModForm(false)
    setEditingMod(null)
  }

  const handleDeleteMod = (id) => {
    if (!confirm('Supprimer ce module ?')) return
    deleteModule(id)
    refresh()
  }

  const handleEditMod = (mod) => {
    setEditingMod(mod)
    setShowModForm(true)
  }

  const handleReset = () => {
    if (!confirm('Reinitialiser toutes les categories et modules aux valeurs par defaut ? Les modifications seront perdues.')) return
    resetToDefaults()
    refresh()
  }

  const selectedCat = selectedCatId ? categories.find(c => c.id === selectedCatId) : null

  return (
    <div className="admin-page">
      <div className="admin-layout">
        <nav className="admin-nav">
          <h2>Espace Pro</h2>
          <div className="account-tabs">
            <button className={`account-tab ${tab === 'categories' ? 'active' : ''}`} onClick={() => setTab('categories')}>
              <span>&#x1F4C1;</span> Categories
            </button>
            <button className={`account-tab ${tab === 'modules' ? 'active' : ''}`} onClick={() => setTab('modules')}>
              <span>&#x1F4E6;</span> Modules
            </button>
            <button className={`account-tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
              <span>&#x1F4CA;</span> Statistiques
            </button>
          </div>
        </nav>

        <div className="admin-content">

          {/* ====== CATEGORIES TAB ====== */}
          {tab === 'categories' && (
            <div>
              <div className="admin-header">
                <h2>Categories</h2>
                <button className="btn btn-primary" onClick={() => { setEditingCat(null); setShowCatForm(true) }}>
                  + Nouvelle categorie
                </button>
              </div>

              <div className="admin-summary">
                <div className="stat-card">
                  <div className="stat-value">{totalCats}</div>
                  <div className="stat-label">Categories</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{totalModules}</div>
                  <div className="stat-label">Modules au total</div>
                </div>
              </div>

              <div className="admin-modules-grid">
                {categories.map(cat => (
                  <div key={cat.id} className="admin-module-card">
                    <div className="admin-module-icon" style={{ background: 'var(--bg-secondary)' }}>
                      {cat.icon}
                    </div>
                    <div className="admin-module-info">
                      <div className="admin-module-name">{cat.name}</div>
                      <div className="admin-module-meta">
                        {cat.modules.length} module(s)
                        {cat.slug && <> &middot; /{cat.slug}</>}
                      </div>
                    </div>
                    <div className="admin-module-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedCatId(cat.id); setTab('modules') }}>
                        Voir
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEditCat(cat)}>Modifier</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCat(cat.id)}>Supprimer</button>
                    </div>
                  </div>
                ))}
              </div>

              {showCatForm && (
                <CategoryForm
                  initial={editingCat}
                  onSave={handleSaveCat}
                  onCancel={() => { setShowCatForm(false); setEditingCat(null) }}
                />
              )}
            </div>
          )}

          {/* ====== MODULES TAB ====== */}
          {tab === 'modules' && (
            <div>
              <div className="admin-header">
                <h2>
                  {selectedCat ? `Modules : ${selectedCat.name}` : 'Tous les modules'}
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {selectedCatId && (
                    <button className="btn btn-secondary" onClick={() => setSelectedCatId(null)}>
                      Toutes les categories
                    </button>
                  )}
                  <button className="btn btn-primary" onClick={() => { setEditingMod(null); setShowModForm(true) }}>
                    + Ajouter un module
                  </button>
                </div>
              </div>

              {/* Category filter pills */}
              <div className="admin-cat-pills">
                <button
                  className={`pill ${!selectedCatId ? 'pill-active' : ''}`}
                  onClick={() => setSelectedCatId(null)}
                >
                  Tous
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`pill ${selectedCatId === cat.id ? 'pill-active' : ''}`}
                    onClick={() => setSelectedCatId(cat.id)}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>

              {(() => {
                const displayCats = selectedCatId
                  ? categories.filter(c => c.id === selectedCatId)
                  : categories

                const hasModules = displayCats.some(c => c.modules.length > 0)

                if (!hasModules) {
                  return (
                    <div className="empty-state">
                      <p>Aucun module dans cette categorie.</p>
                    </div>
                  )
                }

                return displayCats.map(cat => {
                  if (cat.modules.length === 0) return null
                  return (
                    <div key={cat.id} className="admin-cat-section">
                      <h3 className="admin-cat-section-title">
                        {cat.icon} {cat.name}
                        <span className="pill pill-sm" style={{ marginLeft: '0.5rem' }}>{cat.modules.length}</span>
                      </h3>
                      <div className="admin-modules-grid">
                        {cat.modules.map(mod => (
                          <div key={mod.id} className="admin-module-card">
                            <div className="admin-module-icon" style={{ background: mod.color }}>{mod.icon}</div>
                            <div className="admin-module-info">
                              <div className="admin-module-name">{mod.name}</div>
                              <div className="admin-module-meta">
                                {mod.w}x{mod.d}x{mod.h}u
                                {mod.stlFileName && <> &middot; {mod.stlFileName}</>}
                              </div>
                            </div>
                            <div className="admin-module-actions">
                              <button className="btn btn-secondary btn-sm" onClick={() => handleEditMod(mod)}>Modifier</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMod(mod.id)}>Supprimer</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              })()}

              {showModForm && (
                <ModuleForm
                  initial={editingMod}
                  categories={categories}
                  defaultCategory={selectedCatId}
                  onSave={handleSaveMod}
                  onCancel={() => { setShowModForm(false); setEditingMod(null) }}
                />
              )}
            </div>
          )}

          {/* ====== STATS TAB ====== */}
          {tab === 'stats' && (
            <div>
              <h2>Statistiques</h2>
              <div className="admin-summary">
                <div className="stat-card">
                  <div className="stat-value">{totalModules}</div>
                  <div className="stat-label">Modules</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{totalCats}</div>
                  <div className="stat-label">Categories</div>
                </div>
              </div>
              <div style={{ marginTop: '2rem' }}>
                <button className="btn btn-danger" onClick={handleReset}>
                  Reinitialiser aux valeurs par defaut
                </button>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Remet toutes les categories et modules a leur etat initial.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ====== Category Form ======
function CategoryForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [icon, setIcon] = useState(initial?.icon || '📁')
  const [slug, setSlug] = useState(initial?.slug || '')
  const [description, setDescription] = useState(initial?.description || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name) return
    const autoSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    onSave({ name, icon, slug: autoSlug, description })
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h3>{initial ? 'Modifier la categorie' : 'Nouvelle categorie'}</h3>
        <form onSubmit={handleSubmit} className="module-form">
          <div className="form-row">
            <div className="form-field">
              <label>Nom</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Garage" required />
            </div>
            <div className="form-field small">
              <label>Icone</label>
              <input type="text" value={icon} onChange={e => setIcon(e.target.value)} />
            </div>
          </div>
          <div className="form-field">
            <label>Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description de la categorie" />
          </div>
          <div className="form-field">
            <label>Slug URL (auto-genere si vide)</label>
            <input type="text" value={slug} onChange={e => setSlug(e.target.value)} placeholder="ex: garage" />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Annuler</button>
            <button type="submit" className="btn btn-primary">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ====== Module Form ======
function ModuleForm({ initial, categories, defaultCategory, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    icon: initial?.icon || '📦',
    description: initial?.description || '',
    category: initial?.category || defaultCategory || categories[0]?.id || '',
    w: initial?.w || 1,
    d: initial?.d || 1,
    h: initial?.h || 1,
    color: initial?.color || '#8B6E4E',
    stlFileName: initial?.stlFileName || '',
  })

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) update('stlFileName', file.name)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name) return
    onSave(form)
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h3>{initial ? 'Modifier le module' : 'Nouveau module'}</h3>
        <form onSubmit={handleSubmit} className="module-form">
          <div className="form-row">
            <div className="form-field">
              <label>Nom</label>
              <input type="text" value={form.name} onChange={e => update('name', e.target.value)} required />
            </div>
            <div className="form-field small">
              <label>Icone</label>
              <input type="text" value={form.icon} onChange={e => update('icon', e.target.value)} />
            </div>
          </div>

          <div className="form-field">
            <label>Description</label>
            <input type="text" value={form.description} onChange={e => update('description', e.target.value)} />
          </div>

          <div className="form-field">
            <label>Categorie</label>
            <select value={form.category} onChange={e => update('category', e.target.value)}>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-row three">
            <div className="form-field">
              <label>Largeur (u)</label>
              <input type="number" min={1} max={10} value={form.w} onChange={e => update('w', Number(e.target.value))} />
            </div>
            <div className="form-field">
              <label>Profondeur (u)</label>
              <input type="number" min={1} max={10} value={form.d} onChange={e => update('d', Number(e.target.value))} />
            </div>
            <div className="form-field">
              <label>Hauteur (u)</label>
              <input type="number" min={1} max={10} value={form.h} onChange={e => update('h', Number(e.target.value))} />
            </div>
          </div>

          <div className="form-field">
            <label>Couleur</label>
            <input type="color" value={form.color} onChange={e => update('color', e.target.value)} />
          </div>

          <div className="form-field">
            <label>Fichier STL (optionnel)</label>
            <input type="file" accept=".stl" onChange={handleFileChange} />
            {form.stlFileName && <span className="form-file-name">{form.stlFileName}</span>}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Annuler</button>
            <button type="submit" className="btn btn-primary">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  )
}
