import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getAllCategories, GRID_UNIT, GRID_HEIGHT_UNIT } from '../utils/moduleStore'
import { useAuth } from '../components/AuthContext'
import { getFavorites, toggleFavorite } from '../utils/auth'

export default function CategoryPage() {
  const { slug } = useParams()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [favs, setFavs] = useState(getFavorites())
  const [sortBy, setSortBy] = useState('name')

  const allCategories = getAllCategories()

  // Find category by slug
  const category = allCategories.find(c => c.slug === slug || c.id === slug)

  if (!category) {
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

  const allCatModules = category.modules || []

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

  // Build links for other categories
  const otherCategories = allCategories
    .filter(c => c.id !== category.id)
    .map(c => ({ slug: c.slug || c.id, title: c.name, icon: c.icon }))

  return (
    <div className="cat-page">
      {/* Header */}
      <section className="bento-section" style={{ paddingTop: '2.5rem' }}>
        <div className="bento-card cat-hero">
          <div className="cat-hero-content">
            <div className="cat-hero-icon">{category.icon}</div>
            <div>
              <h1>{category.name}</h1>
              <p>{category.description || `Decouvrez les modules de la categorie ${category.name}`}</p>
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
          {otherCategories.map(oc => (
            <Link key={oc.slug} to={`/modules/${oc.slug}`} className="bento-card cat-other-card">
              <span className="cat-other-icon">{oc.icon}</span>
              <span className="cat-other-name">{oc.title}</span>
              <span className="cat-other-arrow">&rarr;</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
