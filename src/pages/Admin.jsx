import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'
import { CATEGORIES } from '../data/modules'

// Simulated admin module storage (localStorage)
const ADMIN_MODULES_KEY = 'modo_admin_modules'

function getAdminModules() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_MODULES_KEY)) || []
  } catch { return [] }
}

function saveAdminModules(modules) {
  localStorage.setItem(ADMIN_MODULES_KEY, JSON.stringify(modules))
}

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('modules')
  const [modules, setModules] = useState(() => getAdminModules())
  const [editingModule, setEditingModule] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!user || !user.isAdmin) navigate('/login')
  }, [user, navigate])

  if (!user || !user.isAdmin) return null

  const defaultModule = {
    id: '',
    name: '',
    icon: '📦',
    description: '',
    category: 'kitchen',
    w: 1, d: 1, h: 1,
    color: '#6366f1',
    stlFile: null,
    stlFileName: '',
  }

  const handleSave = (moduleData) => {
    let updated
    if (editingModule) {
      updated = modules.map(m => m.id === editingModule.id ? { ...moduleData, id: editingModule.id } : m)
    } else {
      const newId = `custom-${Date.now()}`
      updated = [...modules, { ...moduleData, id: newId, createdAt: new Date().toISOString() }]
    }
    setModules(updated)
    saveAdminModules(updated)
    setShowForm(false)
    setEditingModule(null)
  }

  const handleDelete = (id) => {
    const updated = modules.filter(m => m.id !== id)
    setModules(updated)
    saveAdminModules(updated)
  }

  const handleEdit = (mod) => {
    setEditingModule(mod)
    setShowForm(true)
  }

  // Count built-in modules
  const builtInCount = CATEGORIES.reduce((sum, cat) => sum + cat.modules.length, 0)

  return (
    <div className="admin-page">
      <div className="admin-layout">
        <nav className="admin-nav">
          <h2>⚙️ Espace Pro</h2>
          <div className="account-tabs">
            <button className={`account-tab ${tab === 'modules' ? 'active' : ''}`} onClick={() => setTab('modules')}>
              <span>📦</span> Modules
            </button>
            <button className={`account-tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
              <span>📊</span> Statistiques
            </button>
          </div>
        </nav>

        <div className="admin-content">
          {tab === 'modules' && (
            <div>
              <div className="admin-header">
                <h2>Gestion des modules</h2>
                <button className="btn btn-primary" onClick={() => { setEditingModule(null); setShowForm(true) }}>
                  + Ajouter un module
                </button>
              </div>

              <div className="admin-summary">
                <div className="stat-card">
                  <div className="stat-value">{builtInCount}</div>
                  <div className="stat-label">Modules intégrés</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{modules.length}</div>
                  <div className="stat-label">Modules personnalisés</div>
                </div>
              </div>

              {/* Custom modules list */}
              {modules.length === 0 && !showForm ? (
                <div className="empty-state">
                  <p>Aucun module personnalisé. Cliquez sur "Ajouter un module" pour commencer.</p>
                </div>
              ) : (
                <div className="admin-modules-grid">
                  {modules.map(mod => (
                    <div key={mod.id} className="admin-module-card">
                      <div className="admin-module-icon" style={{ background: mod.color }}>{mod.icon}</div>
                      <div className="admin-module-info">
                        <div className="admin-module-name">{mod.name}</div>
                        <div className="admin-module-meta">{mod.w}×{mod.d}×{mod.h}u — {mod.category}</div>
                        {mod.stlFileName && <div className="admin-module-stl">📄 {mod.stlFileName}</div>}
                      </div>
                      <div className="admin-module-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(mod)}>Modifier</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(mod.id)}>Supprimer</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Module form modal */}
              {showForm && (
                <ModuleForm
                  initial={editingModule || defaultModule}
                  onSave={handleSave}
                  onCancel={() => { setShowForm(false); setEditingModule(null) }}
                />
              )}
            </div>
          )}

          {tab === 'stats' && (
            <div>
              <h2>Statistiques</h2>
              <div className="admin-summary">
                <div className="stat-card">
                  <div className="stat-value">{builtInCount + modules.length}</div>
                  <div className="stat-label">Total modules</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{CATEGORIES.length}</div>
                  <div className="stat-label">Catégories</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ModuleForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ ...initial })
  const fileRef = useRef(null)

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      update('stlFileName', file.name)
      // In production, upload to server. For now, store name only.
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name) return
    onSave(form)
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h3>{initial.id ? 'Modifier le module' : 'Nouveau module'}</h3>
        <form onSubmit={handleSubmit} className="module-form">
          <div className="form-row">
            <div className="form-field">
              <label>Nom</label>
              <input type="text" value={form.name} onChange={e => update('name', e.target.value)} required />
            </div>
            <div className="form-field small">
              <label>Icône</label>
              <input type="text" value={form.icon} onChange={e => update('icon', e.target.value)} />
            </div>
          </div>

          <div className="form-field">
            <label>Description</label>
            <input type="text" value={form.description} onChange={e => update('description', e.target.value)} />
          </div>

          <div className="form-field">
            <label>Catégorie</label>
            <select value={form.category} onChange={e => update('category', e.target.value)}>
              <option value="kitchen">Cuisine</option>
              <option value="office">Bureau</option>
              <option value="bathroom">Salle de bain</option>
              <option value="custom">Personnalisé</option>
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
            <input ref={fileRef} type="file" accept=".stl" onChange={handleFileChange} />
            {form.stlFileName && <span className="form-file-name">📄 {form.stlFileName}</span>}
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
