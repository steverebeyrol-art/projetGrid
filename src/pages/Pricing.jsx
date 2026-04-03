import { useState } from 'react'
import { Link } from 'react-router-dom'

const plans = [
  {
    id: 'free',
    name: 'Gratuit',
    icon: '🌱',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      '10 telechargements STL',
      'Acces au designer 3D',
      'Modules de base',
      'Export STL standard',
    ],
    limitations: [
      'Modules premium verrouilles',
      'Pas de sauvegarde cloud',
    ],
    cta: 'Commencer gratuitement',
    highlight: false,
  },
  {
    id: 'user',
    name: 'Utilisateur',
    icon: '🏠',
    monthlyPrice: 9,
    annualPrice: 5,
    features: [
      'Telechargements illimites',
      'Tous les modules disponibles',
      'Export STL haute qualite',
      'Sauvegarde cloud',
      'Support par email',
    ],
    limitations: [],
    cta: 'S\'abonner',
    highlight: true,
  },
  {
    id: 'commercial',
    name: 'Commercial',
    icon: '🏢',
    monthlyPrice: 29,
    annualPrice: 19,
    features: [
      'Tout du forfait Utilisateur',
      'Licence commerciale',
      'Modules sur mesure',
      'Support prioritaire',
      'API d\'export en lot',
      'Gestion multi-utilisateurs',
    ],
    limitations: [],
    cta: 'Contacter les ventes',
    highlight: false,
  },
]

export default function Pricing() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="pricing-page">
      <section className="bento-section" style={{ paddingTop: '3rem' }}>
        <div className="pricing-header-card bento-card">
          <div className="pricing-header-content">
            <span className="pill">Tarifs</span>
            <h1>Choisissez votre forfait</h1>
            <p>Commencez gratuitement, evoluez selon vos besoins.</p>
          </div>
          <div className="billing-toggle">
            <span className={!annual ? 'active' : ''}>Mensuel</span>
            <button
              className={`toggle-switch ${annual ? 'on' : ''}`}
              onClick={() => setAnnual(!annual)}
              aria-label="Basculer facturation annuelle"
            >
              <span className="toggle-knob" />
            </button>
            <span className={annual ? 'active' : ''}>
              Annuel <span className="badge-save">-44%</span>
            </span>
          </div>
        </div>
      </section>

      <section className="bento-section" style={{ paddingTop: 0 }}>
        <div className="plans-grid">
          {plans.map(plan => {
            const price = annual ? plan.annualPrice : plan.monthlyPrice
            return (
              <div key={plan.id} className={`bento-card plan-card ${plan.highlight ? 'highlighted' : ''}`}>
                {plan.highlight && <div className="plan-badge">Le plus populaire</div>}
                <div className="plan-header">
                  <span className="plan-icon">{plan.icon}</span>
                  <h2>{plan.name}</h2>
                </div>
                <div className="plan-price">
                  <span className="price-amount">{price}&#8364;</span>
                  {price > 0 && <span className="price-period">/mois</span>}
                  {price === 0 && <span className="price-period">pour toujours</span>}
                </div>
                {annual && plan.monthlyPrice > 0 && (
                  <div className="price-savings">
                    Au lieu de {plan.monthlyPrice}&#8364;/mois
                  </div>
                )}
                <ul className="plan-features">
                  {plan.features.map(f => (
                    <li key={f} className="feature-yes">&#10003; {f}</li>
                  ))}
                  {plan.limitations.map(f => (
                    <li key={f} className="feature-no">&#10007; {f}</li>
                  ))}
                </ul>
                <Link to="/designer" className={`btn btn-block ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}>
                  {plan.cta}
                </Link>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
