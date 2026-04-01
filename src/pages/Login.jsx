import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login, register } = useAuth()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Veuillez remplir tous les champs.')
      return
    }

    try {
      if (isRegister) {
        register(email, password, name)
      } else {
        login(email, password)
      }
      navigate('/account')
    } catch (err) {
      setError('Erreur de connexion.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{isRegister ? 'Créer un compte' : 'Connexion'}</h1>
          <p>{isRegister ? 'Rejoignez MODO by OMMEdesign' : 'Accédez à votre espace'}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <div className="auth-field">
              <label>Nom</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Votre nom" />
            </div>
          )}
          <div className="auth-field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemple.com" required />
          </div>
          <div className="auth-field">
            <label>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg">
            {isRegister ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>

        <div className="auth-switch">
          {isRegister ? (
            <p>Déjà un compte ? <button onClick={() => setIsRegister(false)}>Se connecter</button></p>
          ) : (
            <p>Pas encore de compte ? <button onClick={() => setIsRegister(true)}>Créer un compte</button></p>
          )}
        </div>
      </div>
    </div>
  )
}
