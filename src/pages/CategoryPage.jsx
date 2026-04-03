import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CATEGORIES, ALL_MODULES, GRID_UNIT, GRID_HEIGHT_UNIT } from '../data/modules'
import { useAuth } from '../components/AuthContext'
import { getFavorites, toggleFavorite } from '../utils/auth'

const categoryMeta = {
  cuisine: {
    id: 'kitchen',
    title: 'Cuisine',
    icon: '🍳',
    desc: 'Organisez vos tiroirs et placards avec des modules sur mesure. Range-couverts, epices, ustensiles... tout a sa place.',
    color: '#8B6E4E',
  },
  bureau: {
    id: 'office',
    title: 'Bureau',
    icon: '🖊️',
    desc: 'Optimisez votre espace de travail. Stylos, cables, cartes, accessoires : chaque objet trouve son rangement.',
    color: '#5B8C5A',
  },
  'salle-de-bain': {
    id: 'bathroom',
    title: 'Salle de bain',
    icon: '🛁',
    desc: 'Creez des rangements pratiques pour vos cosmetiques, brosses, accessoires de soin et produits de beaute.',
    color: '#C8956C',
  },
}

export default function CategoryPage() {
  const { slug } = useParams()
  const meta = categoryMeta[slug]
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [favs, setFavs] = useState(getFavorites())
  const [sortBy, setSortBy] = useState('name') // name | size | favorites

  if (!meta) {
    return (
      <div className="cat-page">
        <div className="bento-section" style={{ paddingTop: '4rem', textAlign: 'center' }}>
          <h1>Categorie introuvable</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Cette categorie n'existe pas.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Retour a l'accueil</Link>
        </div>
      </div>
    )
  }

  const category = CATEGORIES.find(c => c.id === meta.id)
  const allCatModules = category ? category.modules : []

  const filtered = allCatModules.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.description.toLowerCase().includes(search.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'favorites') {
      const aFav = favs.includes(a.id) ? -1 : 1
      const bFav = favs.includes(b.id) ? -1 : 1
      return aFav - bFav
    }
    if (sortBy === 'size') return (b.w * b.d * b.h) - (a.w * a.d * a.h)
    return a.name.localeCompare(b.name)
  })

  const handleToggleFav = (moduleId) => {
    const updated = toggleFavorite(moduleId)
    setFavs([...updated])
  }

  const otherCategories = Object.entries(categoryMeta).filter(([s]) => s !== slug)

  return (
    <div className="cat-page">
      {/* Header */}
      <section className="bento-section" style={{ paddingTop: '2.5rem' }}>
        <div className="bento-card cat-hero">
          <div className="cat-hero-content">
            <div className="cat-hero-icon">{meta.icon}</div>
            <div>
              <h1>{meta.title}</h1>
              <p>{meta.desc}</p>
            </div>
          </div>
          <div className="cat-hero-actions">
            <Link to="/designer" className="btn btn-primary">Ouvrir le Designer</Link>
            <span className="pill">{allCatModules.length} modules</span>
          </div>
        </div>
      </section>

      {/* Search + filters */}
      <section className="bento-section" style={{ paddingTop: 0 }}>
        <div className="cat-toolbar">
          <input
            type="text"
            className="cat-search"
            placeholder="Rechercher un module..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="cat-sort">
            <button className={`cat-sort-btn ${sortBy === 'name' ? 'active' : ''}`} onClick={() => setSortBy('name')}>Nom</button>
            <button className={`cat-sort-btn ${sortBy === 'size' ? 'active' : ''}`} onClick={() => setSortBy('size')}>Taille</button>
            <button className={`cat-sort-btn ${sortBy === 'favorites' ? 'active' : ''}`} onClick={() => setSortBy('favorites')}>Favoris</button>
          </div>
        </div>
      </section>

      {/* Modules grid */}
      <section className="bento-section" style={{ paddingTop: 0 }}>
        {sorted.length === 0 ? (
          <div className="cat-empty">
            <p>Aucun module ne correspond a votre recherche.</p>
          </div>
        ) : (
          <div className="cat-modules-grid">
            {sorted.map(mod => (
              <div key={mod.id} className="bento-card cat-module-card">
                <div className="cat-module-top">
                  <div className="cat-module-icon" style={{ background: mod.color }}>
                    {mod.icon}
                  </div>
                  <button
                    className={`cat-fav-btn ${favs.includes(mod.id) ? 'active' : ''}`}
                    onClick={() => handleToggleFav(mod.id)}
                    title={favs.includes(mod.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    {favs.includes(mod.id) ? '\u2665' : '\u2661'}
                  </button>
                </div>
                <h3 className="cat-module-name">{mod.name}</h3>
                <p className="cat-module-desc">{mod.description}</p>
                <div className="cat-module-specs">
                  <span className="cat-spec">
                    {mod.w}x{mod.d}x{mod.h} u
                  </span>
                  <span className="cat-spec">
                    {mod.w * GRID_UNIT}x{mod.d * GRID_UNIT}x{mod.h * GRID_HEIGHT_UNIT} mm
                  </span>
                </div>
                <Link to="/designer" className="btn btn-secondary btn-sm btn-block cat-module-cta">
                  Utiliser dans le Designer
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Other categories */}
      <section className="bento-section">
        <div className="bento-section-header">
          <h2>Autres categories</h2>
        </div>
        <div className="cat-other-grid">
          {otherCategories.map(([s, m]) => (
            <Link key={s} to={`/modules/${s}`} className="bento-card cat-other-card">
              <span className="cat-other-icon">{m.icon}</span>
              <span className="cat-other-name">{m.title}</span>
              <span className="cat-other-arrow">&rarr;</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
