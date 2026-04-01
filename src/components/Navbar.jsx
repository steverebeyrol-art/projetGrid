import { Link } from 'react-router-dom'

export default function Navbar() {
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
        <Link to="/designer" className="btn btn-primary btn-sm">Commencer</Link>
      </div>
    </nav>
  )
}
