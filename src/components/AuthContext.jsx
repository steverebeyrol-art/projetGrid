import { createContext, useContext, useState, useEffect } from 'react'
import * as auth from '../utils/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => auth.getUser())

  const login = (email, password) => {
    const u = auth.login(email, password)
    setUser(u)
    return u
  }

  const register = (email, password, name) => {
    const u = auth.register(email, password, name)
    setUser(u)
    return u
  }

  const logout = () => {
    auth.logout()
    setUser(null)
  }

  const refreshUser = () => {
    setUser(auth.getUser())
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
