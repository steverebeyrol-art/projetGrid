import { Link } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function HeroScene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={0.9} />
      <directionalLight position={[-3, 4, -2]} intensity={0.3} />
      <group scale={0.4} position={[0, -1, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[6, 0.3, 6]} />
          <meshStandardMaterial color="#D4C4B0" />
        </mesh>
        {[-2, 0, 2].map(x => (
          <mesh key={`gx${x}`} position={[x, 0.2, 0]}>
            <boxGeometry args={[0.03, 0.05, 6]} />
            <meshStandardMaterial color="#C8B89A" />
          </mesh>
        ))}
        {[-2, 0, 2].map(z => (
          <mesh key={`gz${z}`} position={[0, 0.2, z]}>
            <boxGeometry args={[6, 0.05, 0.03]} />
            <meshStandardMaterial color="#C8B89A" />
          </mesh>
        ))}
        <mesh position={[-2, 0.9, -2]}>
          <boxGeometry args={[1.8, 1.5, 1.8]} />
          <meshStandardMaterial color="#8B6E4E" />
        </mesh>
        <mesh position={[0, 0.55, -2]}>
          <boxGeometry args={[1.8, 0.8, 1.8]} />
          <meshStandardMaterial color="#C8956C" />
        </mesh>
        <mesh position={[2, 1.2, -2]}>
          <boxGeometry args={[1.8, 2.1, 1.8]} />
          <meshStandardMaterial color="#A0826D" />
        </mesh>
        <mesh position={[-2, 0.55, 0]}>
          <boxGeometry args={[1.8, 0.8, 1.8]} />
          <meshStandardMaterial color="#B8A08A" />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[1.8, 1.5, 1.8]} />
          <meshStandardMaterial color="#6B5B4E" />
        </mesh>
      </group>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.5} />
    </>
  )
}

const stats = [
  { value: '42mm', label: 'Grille standard', sub: 'Unit system' },
  { value: '18+', label: 'Modules disponibles', sub: 'Et plus a venir' },
  { value: '3D', label: 'Visualisation temps reel', sub: 'Interactif' },
]

const useCases = [
  {
    icon: '🍳',
    title: 'Cuisine',
    desc: 'Organisez tiroirs et placards avec des range-couverts, epices, ustensiles.',
    tag: 'Populaire',
  },
  {
    icon: '🖊️',
    title: 'Bureau',
    desc: 'Rangez stylos, cables, cartes et accessoires de bureau.',
    tag: 'Nouveau',
  },
  {
    icon: '🛁',
    title: 'Salle de bain',
    desc: 'Creez des rangements pour cosmetiques, brosses et accessoires.',
    tag: 'Tendance',
  },
]

const features = [
  {
    icon: '🧩',
    title: 'Catalogue de modules',
    desc: 'Cuisine, bureau, salle de bain... Un catalogue adapte a chaque piece.',
  },
  {
    icon: '🖱️',
    title: 'Placement intuitif',
    desc: 'Selectionnez et placez vos modules sur la grille en un clic.',
  },
  {
    icon: '📐',
    title: 'Grille personnalisable',
    desc: 'Definissez les dimensions en unites ou en millimetres.',
  },
  {
    icon: '🎨',
    title: 'Visualisation 3D',
    desc: 'Previsualisez votre agencement en temps reel.',
  },
  {
    icon: '📥',
    title: 'Export STL',
    desc: 'Telechargez vos modeles prets pour l\'impression 3D.',
  },
  {
    icon: '🔄',
    title: 'Historique & sauvegarde',
    desc: 'Retrouvez et reutilisez toutes vos configurations.',
  },
]

export default function Home() {
  return (
    <div className="home-page">
      {/* Hero bento */}
      <section className="bento-hero">
        <div className="bento-hero-left">
          <div className="bento-card bento-intro">
            <span className="pill">Nouveau</span>
            <h1>Organisez vos espaces<br /><span className="gradient-text">avec la precision modulaire</span></h1>
            <p className="bento-intro-sub">
              Concevez des systemes de rangement sur grille pour vos tiroirs, meubles et espaces.
              Visualisez en 3D et exportez pour l'impression 3D.
            </p>
            <div className="bento-intro-actions">
              <Link to="/designer" className="btn btn-primary btn-lg">Lancer le Designer</Link>
              <Link to="/pricing" className="btn btn-secondary btn-lg">Voir les tarifs</Link>
            </div>
          </div>

          <div className="bento-stats-row">
            {stats.map(s => (
              <div key={s.label} className="bento-card bento-stat">
                <span className="bento-stat-value">{s.value}</span>
                <span className="bento-stat-label">{s.label}</span>
                <span className="bento-stat-sub">{s.sub}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bento-card bento-3d">
          <Canvas camera={{ position: [5, 4, 5], fov: 35 }} style={{ background: '#FAF8F5' }}>
            <HeroScene />
          </Canvas>
          <div className="bento-3d-label">
            <span className="pill pill-glass">Apercu 3D en direct</span>
          </div>
        </div>
      </section>

      {/* Use cases bento */}
      <section className="bento-section">
        <div className="bento-section-header">
          <h2>Adapte a chaque piece</h2>
          <p>Des modules concus pour chaque espace de votre maison</p>
        </div>
        <div className="bento-cases-grid">
          {useCases.map(uc => (
            <div key={uc.title} className="bento-card bento-case">
              <div className="bento-case-top">
                <span className="bento-case-icon">{uc.icon}</span>
                <span className="pill pill-sm">{uc.tag}</span>
              </div>
              <h3>{uc.title}</h3>
              <p>{uc.desc}</p>
              <Link to="/designer" className="bento-case-link">Explorer &rarr;</Link>
            </div>
          ))}
        </div>
      </section>

      {/* Features bento */}
      <section className="bento-section">
        <div className="bento-section-header">
          <h2>Tout ce qu'il vous faut</h2>
          <p>Des outils puissants pour concevoir vos rangements</p>
        </div>
        <div className="bento-features-grid">
          {features.map(f => (
            <div key={f.title} className="bento-card bento-feature">
              <span className="bento-feature-icon">{f.icon}</span>
              <div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bento */}
      <section className="bento-section">
        <div className="bento-card bento-cta">
          <div className="bento-cta-content">
            <span className="pill">Gratuit</span>
            <h2>Pret a organiser vos espaces ?</h2>
            <p>Commencez gratuitement avec 10 telechargements offerts. Aucune carte requise.</p>
            <div className="bento-cta-actions">
              <Link to="/designer" className="btn btn-primary btn-lg">Commencer maintenant</Link>
              <Link to="/pricing" className="btn btn-secondary btn-lg">Comparer les forfaits</Link>
            </div>
          </div>
          <div className="bento-cta-visual">
            <div className="bento-cta-grid">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bento-cta-cell" style={{ opacity: 0.3 + Math.random() * 0.7 }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <span className="footer-logo">MODO <span>by OMMEdesign</span></span>
          <span className="footer-copy">&copy; 2026 Tous droits reserves.</span>
        </div>
      </footer>
    </div>
  )
}
