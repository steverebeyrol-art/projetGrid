import { useState, useRef } from 'react'

export default function ModuleCreator({ onClose }) {
  const [step, setStep] = useState(0) // 0: intro, 1: upload photos, 2: configure, 3: done
  const [photos, setPhotos] = useState([])
  const [config, setConfig] = useState({ name: '', w: 1, d: 1, h: 1, padding: 1 })
  const fileRef = useRef(null)

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files)
    const newPhotos = files.map(f => ({
      file: f,
      url: URL.createObjectURL(f),
      name: f.name,
    }))
    setPhotos(prev => [...prev, ...newPhotos])
    if (step === 0) setStep(1)
  }

  const removePhoto = (idx) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[idx].url)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handleGenerate = () => {
    setStep(3)
  }

  return (
    <div className="creator-content">
      {step === 0 && (
        <div className="creator-intro">
          <p className="creator-desc">
            Prenez des photos de votre objet et nous créerons un module parfaitement adapté à sa forme.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handlePhotos}
          />
          <button className="creator-upload-btn" onClick={() => fileRef.current?.click()}>
            <span className="creator-upload-icon">📸</span>
            <span>Ajouter des photos de l'objet</span>
          </button>
          <div className="creator-tips">
            <p className="creator-tip-title">Conseils pour de meilleurs résultats :</p>
            <ul>
              <li>Prenez l'objet de face, de côté et du dessus</li>
              <li>Fond uni et bonne luminosité</li>
              <li>Placez une règle à côté pour l'échelle</li>
            </ul>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="creator-photos">
          <div className="creator-photo-grid">
            {photos.map((p, i) => (
              <div key={i} className="creator-photo">
                <img src={p.url} alt={p.name} />
                <button className="creator-photo-remove" onClick={() => removePhoto(i)}>✕</button>
              </div>
            ))}
            <button className="creator-photo-add" onClick={() => fileRef.current?.click()}>
              + Ajouter
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handlePhotos}
          />
          <p className="creator-photo-count">{photos.length} photo(s) ajoutée(s)</p>
          <button className="btn btn-primary btn-block" onClick={() => setStep(2)} disabled={photos.length === 0}>
            Continuer
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="creator-config">
          <p className="creator-desc">Configurez les dimensions du module sur la grille :</p>

          <div className="creator-field">
            <label>Nom du module</label>
            <input
              type="text"
              value={config.name}
              onChange={e => setConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Support tournevis"
            />
          </div>

          <div className="creator-dims">
            <div className="creator-field">
              <label>Largeur (u)</label>
              <input type="number" min={1} max={8} value={config.w} onChange={e => setConfig(prev => ({ ...prev, w: Number(e.target.value) }))} />
            </div>
            <div className="creator-field">
              <label>Prof. (u)</label>
              <input type="number" min={1} max={8} value={config.d} onChange={e => setConfig(prev => ({ ...prev, d: Number(e.target.value) }))} />
            </div>
            <div className="creator-field">
              <label>Haut. (u)</label>
              <input type="number" min={1} max={8} value={config.h} onChange={e => setConfig(prev => ({ ...prev, h: Number(e.target.value) }))} />
            </div>
          </div>

          <div className="creator-field">
            <label>Marge autour de l'objet (mm)</label>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={config.padding}
              onChange={e => setConfig(prev => ({ ...prev, padding: Number(e.target.value) }))}
            />
            <span className="creator-field-val">{config.padding} mm</span>
          </div>

          <div className="creator-preview-photos">
            {photos.slice(0, 3).map((p, i) => (
              <img key={i} src={p.url} alt="" className="creator-thumb" />
            ))}
          </div>

          <button className="btn btn-primary btn-block" onClick={handleGenerate} disabled={!config.name}>
            ✨ Générer le module
          </button>
          <button className="btn btn-secondary btn-block btn-sm" onClick={() => setStep(1)} style={{ marginTop: '0.5rem' }}>
            ← Retour aux photos
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="creator-done">
          <div className="creator-done-icon">✅</div>
          <h4>Module "{config.name}" créé !</h4>
          <p className="creator-desc">
            Le module est prêt à être utilisé. Vous pouvez le placer sur votre grille depuis le catalogue.
          </p>
          <p className="creator-desc" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            En production, l'IA analysera vos photos pour créer automatiquement la forme 3D de l'objet dans le module.
          </p>
          <div className="creator-done-actions">
            <button className="btn btn-primary btn-block" onClick={() => { setStep(0); setPhotos([]); setConfig({ name: '', w: 1, d: 1, h: 1, padding: 1 }) }}>
              Créer un autre module
            </button>
            {onClose && (
              <button className="btn btn-secondary btn-block" onClick={onClose} style={{ marginTop: '0.5rem' }}>
                Fermer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
