import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showModules, setShowModules] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileModules, setMobileModules] = useState(false)
  const [navSearch, setNavSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef(null)

  const toggleLang = () => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')

  const searchResults = getSearchResults(navSearch)
  const showResults = searchFocused && navSearch.trim().length > 0

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false)
    setMobileModules(false)
  }, [location.pathname])

  // Close mobile menu on outside click
  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

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

      {/* Search bar - desktop */}
      <div className="nav-search-wrapper nav-desktop-only" ref={searchRef}>
        <span className="nav-search-icon">&#x1F50D;</span>
        <input
          type="text"
          className="nav-search-input"
          placeholder={t('nav.search')}
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
                <span className="nav-search-result-type">{r.type === 'page' ? 'Page' : r.type === 'category' ? t('nav.categories') : 'Module'}</span>
              </button>
            )) : (
              <div className="nav-search-empty">{t('nav.noResults')}</div>
            )}
          </div>
        )}
      </div>

      {/* Desktop nav links */}
      <div className="nav-links nav-desktop-only">
        <Link to="/designer" className="nav-link">{t('nav.designer')}</Link>

        <div
          className="nav-dropdown"
          onMouseEnter={() => setShowModules(true)}
          onMouseLeave={() => setShowModules(false)}
        >
          <span className="nav-link nav-link-trigger">{t('nav.modules')}</span>
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

        <Link to="/pricing" className="nav-link">{t('nav.pricing')}</Link>

        {user ? (
          <>
            <Link to="/account" className="nav-link">{t('nav.account')}</Link>
            {user.isAdmin && <Link to="/admin" className="nav-link nav-link-pro">Pro</Link>}
            <Link to="/account" className="nav-avatar" title={user.name}>
              {user.name?.[0]?.toUpperCase() || '?'}
            </Link>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary btn-sm">{t('nav.login')}</Link>
        )}

        <button className="nav-lang-btn" onClick={toggleLang} title="FR / EN">
          {i18n.language === 'fr' ? 'FR' : 'EN'}
        </button>
      </div>

      {/* Mobile hamburger button */}
      <button
        className={`nav-hamburger ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menu"
      >
        <span /><span /><span />
      </button>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="nav-mobile-overlay" onClick={() => setMobileOpen(false)}>
          <div className="nav-mobile-menu" onClick={e => e.stopPropagation()}>
            {/* Mobile search */}
            <div className="nav-mobile-search">
              <span className="nav-search-icon">&#x1F50D;</span>
              <input
                type="text"
                placeholder={t('nav.search')}
                value={navSearch}
                onChange={e => setNavSearch(e.target.value)}
              />
              {navSearch && <button className="nav-search-clear" onClick={() => setNavSearch('')}>&#10005;</button>}
            </div>

            {/* Mobile nav links */}
            <div className="nav-mobile-links">
              <Link to="/designer" className="nav-mobile-link">
                <span>🎨</span> {t('nav.designer')}
              </Link>

              <button className="nav-mobile-link" onClick={() => setMobileModules(!mobileModules)}>
                <span>📦</span> {t('nav.modules')}
                <span className={`nav-mobile-chevron ${mobileModules ? 'open' : ''}`}>&#9662;</span>
              </button>
              {mobileModules && (
                <div className="nav-mobile-sub">
                  {getModuleLinks().map(m => (
                    <Link key={m.slug} to={`/modules/${m.slug}`} className="nav-mobile-sub-link">
                      {m.icon} {m.label}
                    </Link>
                  ))}
                </div>
              )}

              <Link to="/pricing" className="nav-mobile-link">
                <span>💰</span> {t('nav.pricing')}
              </Link>

              {user ? (
                <>
                  <Link to="/account" className="nav-mobile-link">
                    <span>👤</span> {t('nav.account')}
                  </Link>
                  {user.isAdmin && (
                    <Link to="/admin" className="nav-mobile-link">
                      <span>⚙️</span> Admin
                    </Link>
                  )}
                </>
              ) : (
                <Link to="/login" className="nav-mobile-link nav-mobile-link-cta">
                  {t('nav.login')}
                </Link>
              )}
            </div>

            {/* Mobile footer: lang toggle */}
            <div className="nav-mobile-footer">
              <button className="nav-lang-btn" onClick={toggleLang}>
                {i18n.language === 'fr' ? '🇫🇷 Francais' : '🇬🇧 English'}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
