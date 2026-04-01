// Module catalog organized by categories
// Each module has an id, name, icon, description, dimensions (grid units), and a color for 3D preview
// STL models will be added later to replace the placeholder geometries

export const CATEGORIES = [
  {
    id: 'kitchen',
    name: 'Cuisine',
    icon: '🍳',
    modules: [
      { id: 'k-cutlery', name: 'Range-couverts', icon: '🍴', description: 'Bac à couverts compartimenté', w: 2, d: 2, h: 1, color: '#6366f1' },
      { id: 'k-spice', name: 'Range-épices', icon: '🧂', description: 'Support pour pots à épices', w: 1, d: 2, h: 2, color: '#818cf8' },
      { id: 'k-utensils', name: 'Range-ustensiles', icon: '🥄', description: 'Bac pour spatules et louches', w: 2, d: 1, h: 2, color: '#a78bfa' },
      { id: 'k-bottle', name: 'Porte-bouteille', icon: '🍾', description: 'Support pour bouteilles d\'huile', w: 1, d: 1, h: 3, color: '#7c3aed' },
      { id: 'k-wrap', name: 'Range-film', icon: '📦', description: 'Support pour rouleaux film/alu', w: 3, d: 1, h: 1, color: '#5b21b6' },
      { id: 'k-tray', name: 'Bac plat', icon: '🫙', description: 'Bac peu profond polyvalent', w: 2, d: 2, h: 1, color: '#4c1d95' },
    ],
  },
  {
    id: 'office',
    name: 'Bureau',
    icon: '🖊️',
    modules: [
      { id: 'o-pens', name: 'Porte-stylos', icon: '✏️', description: 'Rangement vertical pour stylos', w: 1, d: 1, h: 2, color: '#22c55e' },
      { id: 'o-cards', name: 'Porte-cartes', icon: '💳', description: 'Support pour cartes de visite', w: 1, d: 1, h: 1, color: '#16a34a' },
      { id: 'o-clips', name: 'Bac trombones', icon: '📎', description: 'Petit bac pour trombones et agrafes', w: 1, d: 1, h: 1, color: '#15803d' },
      { id: 'o-phone', name: 'Support téléphone', icon: '📱', description: 'Dock pour smartphone', w: 1, d: 2, h: 1, color: '#166534' },
      { id: 'o-usb', name: 'Range-USB', icon: '🔌', description: 'Support pour clés USB et câbles', w: 2, d: 1, h: 1, color: '#14532d' },
      { id: 'o-notes', name: 'Porte-notes', icon: '📝', description: 'Support pour bloc-notes et post-it', w: 2, d: 2, h: 1, color: '#052e16' },
    ],
  },
  {
    id: 'bathroom',
    name: 'Salle de bain',
    icon: '🛁',
    modules: [
      { id: 'b-brush', name: 'Porte-brosses', icon: '🪥', description: 'Support pour brosses à dents', w: 1, d: 1, h: 2, color: '#f59e0b' },
      { id: 'b-soap', name: 'Porte-savon', icon: '🧼', description: 'Bac de rangement pour savons', w: 1, d: 1, h: 1, color: '#d97706' },
      { id: 'b-cream', name: 'Range-crèmes', icon: '🧴', description: 'Rangement pour tubes et flacons', w: 2, d: 1, h: 2, color: '#b45309' },
      { id: 'b-cotton', name: 'Bac cotons', icon: '🩹', description: 'Bac pour cotons et cotons-tiges', w: 1, d: 1, h: 1, color: '#92400e' },
      { id: 'b-makeup', name: 'Range-maquillage', icon: '💄', description: 'Organisateur de maquillage', w: 2, d: 2, h: 2, color: '#78350f' },
      { id: 'b-razor', name: 'Porte-rasoir', icon: '🪒', description: 'Support pour rasoirs', w: 1, d: 1, h: 2, color: '#451a03' },
    ],
  },
]

// Flat list for quick lookup
export const ALL_MODULES = CATEGORIES.flatMap(cat =>
  cat.modules.map(mod => ({ ...mod, category: cat.id, categoryName: cat.name }))
)

export function getModuleById(id) {
  return ALL_MODULES.find(m => m.id === id)
}

// Grid configuration constants
export const GRID_UNIT = 42 // mm per grid unit
export const GRID_HEIGHT_UNIT = 7 // mm per height unit
export const BASE_HEIGHT = 5 // mm base plate thickness
