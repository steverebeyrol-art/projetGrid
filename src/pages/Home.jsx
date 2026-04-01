import { Link } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function HeroScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} />
      <group scale={0.4} position={[0, -1, 0]}>
        {/* Base grid */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[6, 0.3, 6]} />
          <meshStandardMaterial color="#6366f1" />
        </mesh>
        {/* Grid lines */}
        {[-2, 0, 2].map(x => (
          <mesh key={`gx${x}`} position={[x, 0.2, 0]}>
            <boxGeometry args={[0.03, 0.05, 6]} />
            <meshStandardMaterial color="#818cf8" />
          </mesh>
        ))}
        {[-2, 0, 2].map(z => (
          <mesh key={`gz${z}`} position={[0, 0.2, z]}>
            <boxGeometry args={[6, 0.05, 0.03]} />
            <meshStandardMaterial color="#818cf8" />
          </mesh>
        ))}
        {/* Modules */}
        <mesh position={[-2, 0.9, -2]}>
          <boxGeometry args={[1.8, 1.5, 1.8]} />
          <meshStandardMaterial color="#22c55e" />
        </mesh>
        <mesh position={[0, 0.55, -2]}>
          <boxGeometry args={[1.8, 0.8, 1.8]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
        <mesh position={[2, 1.2, -2]}>
          <boxGeometry args={[1.8, 2.1, 1.8]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <mesh position={[-2, 0.55, 0]}>
          <boxGeometry args={[1.8, 0.8, 1.8]} />
          <meshStandardMaterial color="#06b6d4" />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[1.8, 1.5, 1.8]} />
          <meshStandardMaterial color="#a78bfa" />
        </mesh>
      </group>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.5} />
    </>
  )
}

const features = [
  {
    icon: '🧩',
    title: 'Modules par catégorie',
    desc: 'Cuisine, bureau, salle de bain... Choisissez parmi un catalogue de modules adaptés à chaque pièce.'
  },
  {
    icon: '🖱️',
    title: 'Glisser-déposer',
    desc: 'Placez vos modules sur la grille en un clic. Déplacez, tournez et supprimez-les librement.'
  },
  {
    icon: '📐',
    title: 'Grille personnalisable',
    desc: 'Définissez les dimensions de votre grille pour l\'adapter à n\'importe quel tiroir ou meuble.'
  },
  {
    icon: '🎨',
    title: 'Visualisation 3D',
    desc: 'Prévisualisez votre agencement en temps réel avec un rendu 3D interactif.'
  },
  {
    icon: '📥',
    title: 'Export STL',
    desc: 'Téléchargez vos modèles au format STL, prêts pour l\'impression 3D.'
  },
  {
    icon: '🔄',
    title: 'Modèles réutilisables',
    desc: 'Sauvegardez et partagez vos configurations pour les reproduire facilement.'
  },
]

const useCases = [
  { icon: '🍳', title: 'Cuisine', desc: 'Organisez tiroirs et placards avec des range-couverts, épices, ustensiles.' },
  { icon: '🖊️', title: 'Bureau', desc: 'Rangez stylos, câbles, cartes et accessoires de bureau.' },
  { icon: '🛁', title: 'Salle de bain', desc: 'Créez des rangements pour cosmétiques, brosses et accessoires.' },
]

export default function Home() {
  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>Organisez vos espaces<br /><span className="gradient-text">avec la précision modulaire</span></h1>
          <p className="hero-subtitle">
            Concevez des systèmes de rangement sur grille pour vos tiroirs, meubles et espaces.
            Glissez-déposez des modules, visualisez en 3D et exportez pour l'impression 3D.
          </p>
          <div className="hero-actions">
            <Link to="/designer" className="btn btn-primary btn-lg">Lancer le Designer</Link>
            <Link to="/pricing" className="btn btn-secondary btn-lg">Voir les tarifs</Link>
          </div>
        </div>
        <div className="hero-3d">
          <Canvas camera={{ position: [5, 4, 5], fov: 35 }}>
            <HeroScene />
          </Canvas>
        </div>
      </section>

      {/* Use Cases */}
      <section className="section">
        <h2 className="section-title">Adapté à chaque pièce</h2>
        <div className="use-cases-grid">
          {useCases.map(uc => (
            <div key={uc.title} className="use-case-card">
              <span className="use-case-icon">{uc.icon}</span>
              <h3>{uc.title}</h3>
              <p>{uc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="section section-dark">
        <h2 className="section-title">Fonctionnalités</h2>
        <div className="features-grid">
          {features.map(f => (
            <div key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <h2>Prêt à organiser vos espaces ?</h2>
        <p>Commencez gratuitement avec 10 téléchargements offerts.</p>
        <Link to="/designer" className="btn btn-primary btn-lg">Commencer maintenant</Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 GridModular. Tous droits réservés.</p>
      </footer>
    </div>
  )
}
