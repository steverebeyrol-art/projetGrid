import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Designer from './pages/Designer'
import Pricing from './pages/Pricing'
import Login from './pages/Login'
import Account from './pages/Account'
import Admin from './pages/Admin'
import Navbar from './components/Navbar'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/designer" element={<Designer />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/account" element={<Account />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </>
  )
}
