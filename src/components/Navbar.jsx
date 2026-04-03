import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'

const moduleLinks = [
  { slug: 'cuisine', label: 'Cuisine', icon: '🍳' },
  { slug: 'bureau', label: 'Bureau', icon: '🖊️' },
  { slug: 'salle-de-bain', label: 'Salle de bain', icon: '🛁' },
]

export default function Navbar() {
  const { user } = useAuth()
  const [showModules, setShowModules] = useState(false)

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        <span className="logo-icon">&#x2B21;</span>
        <span className="logo-text">MODO</span>
        <span className="logo-sub">by OMMEdesign</span>
      </Link>
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
              {moduleLinks.map(m => (
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
