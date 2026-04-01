import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Designer from './pages/Designer'
import Pricing from './pages/Pricing'
import Navbar from './components/Navbar'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/designer" element={<Designer />} />
        <Route path="/pricing" element={<Pricing />} />
      </Routes>
    </>
  )
}
