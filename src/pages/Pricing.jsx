import { useState } from 'react'
import { Link } from 'react-router-dom'

const plans = [
  {
    id: 'free',
    name: 'Gratuit',
    icon: '🆓',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      '10 téléchargements STL',
      'Accès au designer 3D',
      'Modules de base',
      'Export STL standard',
    ],
    limitations: [
      'Modules premium verrouillés',
      'Pas de sauvegarde cloud',
    ],
    cta: 'Commencer gratuitement',
    highlight: false,
  },
  {
    id: 'user',
    name: 'Utilisateur',
    icon: '👤',
    monthlyPrice: 9,
    annualPrice: 5,
    features: [
      'Téléchargements illimités',
      'Tous les modules disponibles',
      'Export STL haute qualité',
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
      <section className="pricing-hero">
        <h1>Choisissez votre forfait</h1>
        <p>Commencez gratuitement, évoluez selon vos besoins.</p>

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
      </section>

      <div className="plans-grid">
        {plans.map(plan => {
          const price = annual ? plan.annualPrice : plan.monthlyPrice
          return (
            <div key={plan.id} className={`plan-card ${plan.highlight ? 'highlighted' : ''}`}>
              {plan.highlight && <div className="plan-badge">Le plus populaire</div>}
              <div className="plan-header">
                <span className="plan-icon">{plan.icon}</span>
                <h2>{plan.name}</h2>
              </div>
              <div className="plan-price">
                <span className="price-amount">{price}€</span>
                {price > 0 && <span className="price-period">/mois</span>}
                {price === 0 && <span className="price-period">pour toujours</span>}
              </div>
              {annual && plan.monthlyPrice > 0 && (
                <div className="price-savings">
                  Au lieu de {plan.monthlyPrice}€/mois
                </div>
              )}
              <ul className="plan-features">
                {plan.features.map(f => (
                  <li key={f} className="feature-yes">✓ {f}</li>
                ))}
                {plan.limitations.map(f => (
                  <li key={f} className="feature-no">✕ {f}</li>
                ))}
              </ul>
              <Link to="/designer" className={`btn btn-block ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}>
                {plan.cta}
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
