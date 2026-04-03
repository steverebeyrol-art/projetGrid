import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'
import { getFabrications, getDownloads, getFavorites, toggleFavorite } from '../utils/auth'
import { getModuleById, GRID_UNIT, GRID_HEIGHT_UNIT } from '../utils/moduleStore'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export default function Account() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  if (!user) return null

  const fabrications = getFabrications()
  const downloads = getDownloads()

  const [favs, setFavs] = useState(getFavorites())

  const handleRemoveFav = (moduleId) => {
    const updated = toggleFavorite(moduleId)
    setFavs([...updated])
  }

  const favModules = favs.map(id => getModuleById(id)).filter(Boolean)

  const tabs = [
    { id: 'overview', label: 'Apercu', icon: '👤' },
    { id: 'favorites', label: 'Favoris', icon: '♥' },
    { id: 'fabrications', label: 'Fabrications', icon: '🏭' },
    { id: 'downloads', label: 'Telechargements', icon: '📥' },
    { id: 'subscription', label: 'Abonnement', icon: '💳' },
  ]

  return (
    <div className="account-page">
      <div className="account-layout">
        {/* Sidebar nav */}
        <nav className="account-nav">
          <div className="account-user">
            <div className="account-avatar">{user.name?.[0]?.toUpperCase() || '?'}</div>
            <div>
              <div className="account-name">{user.name}</div>
              <div className="account-email">{user.email}</div>
            </div>
          </div>
          <div className="account-tabs">
            {tabs.map(t => (
              <button
                key={t.id}
                className={`account-tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
            {user.isAdmin && (
              <Link to="/admin" className="account-tab admin-tab">
                <span>⚙️</span> Espace Pro
              </Link>
            )}
          </div>
          <button className="btn btn-secondary btn-sm btn-block" style={{ marginTop: 'auto' }} onClick={() => { logout(); navigate('/') }}>
            Déconnexion
          </button>
        </nav>

        {/* Content */}
        <div className="account-content">
          {tab === 'overview' && (
            <div>
              <h2>Bonjour, {user.name} !</h2>
              <div className="account-stats">
                <div className="stat-card">
                  <div className="stat-value">{fabrications.length}</div>
                  <div className="stat-label">Fabrications</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{downloads.length}</div>
                  <div className="stat-label">Téléchargements</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{user.planLabel}</div>
                  <div className="stat-label">Forfait actuel</div>
                </div>
                {user.plan === 'free' && (
                  <div className="stat-card accent">
                    <div className="stat-value">{Math.max(0, (user.downloadsLimit || 10) - (user.downloadsUsed || 0))}</div>
                    <div className="stat-label">Téléchargements restants</div>
                  </div>
                )}
              </div>
              <div className="account-quick-actions">
                <Link to="/designer" className="btn btn-primary">Ouvrir le Designer</Link>
                <Link to="/pricing" className="btn btn-secondary">Changer de forfait</Link>
              </div>
            </div>
          )}

          {tab === 'favorites' && (
            <div>
              <h2>Mes favoris</h2>
              {favModules.length === 0 ? (
                <div className="empty-state">
                  <p>Aucun module en favori pour le moment.</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Parcourez les modules et cliquez sur le coeur pour les ajouter ici.
                  </p>
                  <Link to="/modules/cuisine" className="btn btn-primary">Parcourir les modules</Link>
                </div>
              ) : (
                <div className="fav-grid">
                  {favModules.map(mod => (
                    <div key={mod.id} className="bento-card fav-card">
                      <div className="fav-card-top">
                        <div className="fav-card-icon" style={{ background: mod.color }}>{mod.icon}</div>
                        <button className="cat-fav-btn active" onClick={() => handleRemoveFav(mod.id)} title="Retirer des favoris">
                          &#9829;
                        </button>
                      </div>
                      <h4>{mod.name}</h4>
                      <p className="fav-card-desc">{mod.description}</p>
                      <div className="fav-card-specs">
                        <span className="cat-spec">{mod.w}x{mod.d}x{mod.h} u</span>
                        <span className="cat-spec">{mod.w * GRID_UNIT}x{mod.d * GRID_UNIT}x{mod.h * GRID_HEIGHT_UNIT} mm</span>
                      </div>
                      <Link to="/designer" className="btn btn-secondary btn-sm btn-block">Utiliser</Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'fabrications' && (
            <div>
              <h2>Historique des fabrications</h2>
              {fabrications.length === 0 ? (
                <div className="empty-state">
                  <p>Aucune fabrication pour le moment.</p>
                  <Link to="/designer" className="btn btn-primary">Créer ma première configuration</Link>
                </div>
              ) : (
                <div className="history-list">
                  {fabrications.map(f => (
                    <div key={f.id} className="history-item">
                      <div className="history-info">
                        <div className="history-name">{f.name}</div>
                        <div className="history-meta">
                          Grille {f.gridSize?.x}×{f.gridSize?.y} — {f.moduleCount} module(s)
                        </div>
                      </div>
                      <div className="history-date">{formatDate(f.date)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'downloads' && (
            <div>
              <h2>Historique des téléchargements</h2>
              {downloads.length === 0 ? (
                <div className="empty-state">
                  <p>Aucun téléchargement pour le moment.</p>
                </div>
              ) : (
                <div className="history-list">
                  {downloads.map(d => (
                    <div key={d.id} className="history-item">
                      <div className="history-info">
                        <div className="history-name">📄 {d.filename}</div>
                      </div>
                      <div className="history-date">{formatDate(d.date)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'subscription' && (
            <div>
              <h2>Mon abonnement</h2>
              <div className="sub-current">
                <div className="sub-plan-name">{user.planLabel}</div>
                {user.plan === 'free' && (
                  <div className="sub-info">
                    <p>{user.downloadsUsed || 0} / {user.downloadsLimit || 10} téléchargements utilisés</p>
                    <div className="sub-bar">
                      <div className="sub-bar-fill" style={{ width: `${Math.min(100, ((user.downloadsUsed || 0) / (user.downloadsLimit || 10)) * 100)}%` }} />
                    </div>
                  </div>
                )}
                {user.plan !== 'free' && (
                  <p className="sub-unlimited">Téléchargements illimités</p>
                )}
              </div>
              <Link to="/pricing" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                {user.plan === 'free' ? 'Passer à un forfait supérieur' : 'Gérer mon abonnement'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
