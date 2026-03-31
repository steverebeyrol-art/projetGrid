import { Link } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function MiniBox() {
  return (
    <group scale={0.03} position={[0, -0.5, 0]}>
      {/* Base */}
      <mesh position={[21, 3.5, 21]}>
        <boxGeometry args={[42, 7, 42]} />
        <meshStandardMaterial color="#6366f1" />
      </mesh>
      {/* Walls */}
      <mesh position={[21, 17.5, 0.6]}>
        <boxGeometry args={[42, 21, 1.2]} />
        <meshStandardMaterial color="#818cf8" />
      </mesh>
      <mesh position={[21, 17.5, 41.4]}>
        <boxGeometry args={[42, 21, 1.2]} />
        <meshStandardMaterial color="#818cf8" />
      </mesh>
      <mesh position={[0.6, 17.5, 21]}>
        <boxGeometry args={[1.2, 21, 39.6]} />
        <meshStandardMaterial color="#818cf8" />
      </mesh>
      <mesh position={[41.4, 17.5, 21]}>
        <boxGeometry args={[1.2, 21, 39.6]} />
        <meshStandardMaterial color="#818cf8" />
      </mesh>
    </group>
  )
}

function MiniBaseplate() {
  return (
    <group scale={0.02} position={[0, -0.3, 0]}>
      <mesh position={[42, 3.5, 42]}>
        <boxGeometry args={[84, 7, 84]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      {/* Grid lines */}
      <mesh position={[42, 7.1, 42]}>
        <boxGeometry args={[0.5, 0.5, 84]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
      <mesh position={[42, 7.1, 42]}>
        <boxGeometry args={[84, 0.5, 0.5]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
    </group>
  )
}

function MiniCutout() {
  return (
    <group scale={0.03} position={[0, -0.5, 0]}>
      <mesh position={[21, 3.5, 21]}>
        <boxGeometry args={[42, 7, 42]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
      <mesh position={[21, 17.5, 0.6]}>
        <boxGeometry args={[42, 21, 1.2]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[21, 17.5, 41.4]}>
        <boxGeometry args={[42, 21, 1.2]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[0.6, 17.5, 21]}>
        <boxGeometry args={[1.2, 21, 39.6]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[41.4, 17.5, 21]}>
        <boxGeometry args={[1.2, 21, 39.6]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      {/* Cutout shape */}
      <mesh position={[21, 14, 21]}>
        <cylinderGeometry args={[8, 8, 14, 6]} />
        <meshStandardMaterial color="#d97706" transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

function PreviewCanvas({ children }) {
  return (
    <Canvas camera={{ position: [3, 2, 3], fov: 40 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      {children}
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={2} />
    </Canvas>
  )
}

const cards = [
  {
    type: 'box',
    title: 'Box',
    description: 'Make a custom box with full control over dimensions and wall placement',
    tag: 'Most Popular',
    preview: MiniBox,
  },
  {
    type: 'baseplate',
    title: 'Baseplate',
    description: 'A simple baseplate grid creator',
    tag: 'Quick & Easy',
    preview: MiniBaseplate,
  },
  {
    type: 'cutout',
    title: 'Cutout',
    description: 'Import your own STL files and create custom fitted cutouts',
    tag: 'Advanced',
    preview: MiniCutout,
  },
]

export default function Home() {
  return (
    <div className="home">
      <div className="home-header">
        <h1>Gridfinity Designer</h1>
        <p>Design and export custom Gridfinity-compatible boxes, baseplates and cutouts</p>
      </div>
      <div className="cards-grid">
        {cards.map((card) => (
          <Link key={card.type} to={`/editor/${card.type}`} className="model-card">
            <div className="card-preview">
              <PreviewCanvas>
                <card.preview />
              </PreviewCanvas>
            </div>
            <div className="card-body">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <span className="card-tag">{card.tag}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
