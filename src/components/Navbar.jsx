import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { getAllCategories } from '../utils/moduleStore'

function getModuleLinks() {
  return getAllCategories().map(c => ({
    slug: c.slug || c.id,
    label: c.name,
    icon: c.icon,
  }))
}

function getSearchResults(query) {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  const results = []

  // Search pages
  const pages = [
    { name: 'Designer', desc: 'Configurateur 3D', path: '/designer', icon: '🎨' },
    { name: 'Tarifs', desc: 'Plans et abonnements', path: '/pricing', icon: '💰' },
    { name: 'Mon compte', desc: 'Espace personnel', path: '/account', icon: '👤' },
  ]
  pages.forEach(p => {
    if (p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)) {
      results.push({ type: 'page', ...p })
    }
  })

  // Search categories & modules
  const cats = getAllCategories()
  cats.forEach(cat => {
    if (cat.name.toLowerCase().includes(q)) {
      results.push({ type: 'category', name: cat.name, icon: cat.icon, path: `/modules/${cat.slug || cat.id}` })
    }
    cat.modules.forEach(mod => {
      if (mod.name.toLowerCase().includes(q) || mod.description?.toLowerCase().includes(q)) {
        results.push({ type: 'module', name: mod.name, icon: mod.icon, desc: `${mod.w}x${mod.d}x${mod.h}u — ${cat.name}`, path: `/modules/${cat.slug || cat.id}` })
      }
    })
  })

  return results.slice(0, 8)
}

export default function Navbar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showModules, setShowModules] = useState(false)
  const [navSearch, setNavSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef(null)

  const searchResults = getSearchResults(navSearch)
  const showResults = searchFocused && navSearch.trim().length > 0

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleResultClick(path) {
    navigate(path)
    setNavSearch('')
    setSearchFocused(false)
  }

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        <span className="logo-icon">&#x2B21;</span>
        <span className="logo-text">MODO</span>
        <span className="logo-sub">by OMMEdesign</span>
      </Link>

      <div className="nav-search-wrapper" ref={searchRef}>
        <span className="nav-search-icon">&#x1F50D;</span>
        <input
          type="text"
          className="nav-search-input"
          placeholder="Rechercher..."
          value={navSearch}
          onChange={e => setNavSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
        />
        {navSearch && (
          <button className="nav-search-clear" onClick={() => setNavSearch('')}>&#10005;</button>
        )}
        {showResults && (
          <div className="nav-search-results">
            {searchResults.length > 0 ? searchResults.map((r, i) => (
              <button key={i} className="nav-search-result" onClick={() => handleResultClick(r.path)}>
                <span className="nav-search-result-icon">{r.icon}</span>
                <div className="nav-search-result-info">
                  <span className="nav-search-result-name">{r.name}</span>
                  {r.desc && <span className="nav-search-result-desc">{r.desc}</span>}
                </div>
                <span className="nav-search-result-type">{r.type === 'page' ? 'Page' : r.type === 'category' ? 'Categorie' : 'Module'}</span>
              </button>
            )) : (
              <div className="nav-search-empty">Aucun resultat</div>
            )}
          </div>
        )}
      </div>

      <div className="nav-links">
        <Link to="/designer" className="nav-link">Designer</Link>

        <div
          className="nav-dropdown"
          onMouseEnter={() => setShowModules(true)}
          onMouseLeave={() => setShowModules(false)}
        >
          <span className="nav-link nav-link-trigger">Modules</span>
          {showModules && (
            <div className="nav-dropdown-menu">
              {getModuleLinks().map(m => (
                <Link key={m.slug} to={`/modules/${m.slug}`} className="nav-dropdown-item" onClick={() => setShowModules(false)}>
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link to="/pricing" className="nav-link">Tarifs</Link>

        {user ? (
          <>
            <Link to="/account" className="nav-link">Mon compte</Link>
            {user.isAdmin && <Link to="/admin" className="nav-link nav-link-pro">Pro</Link>}
            <Link to="/account" className="nav-avatar" title={user.name}>
              {user.name?.[0]?.toUpperCase() || '?'}
            </Link>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary btn-sm">Connexion</Link>
        )}
      </div>
    </nav>
  )
}
