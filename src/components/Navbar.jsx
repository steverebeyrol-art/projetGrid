import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function Navbar() {
  const { user } = useAuth()

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        <span className="logo-icon">⬡</span>
        <span className="logo-text">MODO</span>
        <span className="logo-sub">by OMMEdesign</span>
      </Link>
      <div className="nav-links">
        <Link to="/designer" className="nav-link">Designer</Link>
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
