// Unified module store - all categories and modules in localStorage
// On first launch, seeds with default data from modules.js
// After that, admin has full control over everything

import { CATEGORIES as DEFAULT_CATEGORIES, GRID_UNIT, GRID_HEIGHT_UNIT, BASE_HEIGHT } from '../data/modules'

const CATEGORIES_KEY = 'modo_categories'
const MODULES_KEY = 'modo_modules'
const SEEDED_KEY = 'modo_seeded'

// Seed default data on first launch
function seedIfNeeded() {
  if (localStorage.getItem(SEEDED_KEY)) return

  const descriptions = {
    kitchen: 'Organisez vos tiroirs et placards avec des modules sur mesure. Range-couverts, epices, ustensiles... tout a sa place.',
    office: 'Optimisez votre espace de travail. Stylos, cables, cartes, accessoires : chaque objet trouve son rangement.',
    bathroom: 'Creez des rangements pratiques pour vos cosmetiques, brosses, accessoires de soin et produits de beaute.',
  }

  const categories = DEFAULT_CATEGORIES.map(cat => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    description: descriptions[cat.id] || '',
    slug: cat.id === 'kitchen' ? 'cuisine' : cat.id === 'office' ? 'bureau' : cat.id === 'bathroom' ? 'salle-de-bain' : cat.id,
  }))

  const modules = DEFAULT_CATEGORIES.flatMap(cat =>
    cat.modules.map(mod => ({
      ...mod,
      category: cat.id,
    }))
  )

  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
  localStorage.setItem(MODULES_KEY, JSON.stringify(modules))
  localStorage.setItem(SEEDED_KEY, '1')
}

// Get all categories with their modules
export function getAllCategories() {
  seedIfNeeded()
  const cats = getCategories()
  const mods = getModules()
  return cats.map(cat => ({
    ...cat,
    modules: mods.filter(m => m.category === cat.id),
  }))
}

// Raw getters
export function getCategories() {
  seedIfNeeded()
  try {
    return JSON.parse(localStorage.getItem(CATEGORIES_KEY)) || []
  } catch { return [] }
}

function saveCategories(cats) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats))
}

export function getModules() {
  seedIfNeeded()
  try {
    return JSON.parse(localStorage.getItem(MODULES_KEY)) || []
  } catch { return [] }
}

function saveModules(mods) {
  localStorage.setItem(MODULES_KEY, JSON.stringify(mods))
}

// Get all modules flat with category info
export function getAllModules() {
  const cats = getCategories()
  return getModules().map(mod => {
    const cat = cats.find(c => c.id === mod.category)
    return { ...mod, categoryName: cat?.name || '' }
  })
}

// Get module by ID
export function getModuleById(id) {
  return getModules().find(m => m.id === id)
}

// ====== Category CRUD ======
export function addCategory(cat) {
  const cats = getCategories()
  cats.push(cat)
  saveCategories(cats)
}

export function updateCategory(id, updates) {
  const cats = getCategories().map(c => c.id === id ? { ...c, ...updates } : c)
  saveCategories(cats)
}

export function deleteCategory(id) {
  saveCategories(getCategories().filter(c => c.id !== id))
  // Also delete all modules in this category
  saveModules(getModules().filter(m => m.category !== id))
}

// ====== Module CRUD ======
export function addModule(mod) {
  const mods = getModules()
  mods.push(mod)
  saveModules(mods)
}

export function updateModule(id, updates) {
  saveModules(getModules().map(m => m.id === id ? { ...m, ...updates } : m))
}

export function deleteModule(id) {
  saveModules(getModules().filter(m => m.id !== id))
}

// Reset to defaults (useful for admin)
export function resetToDefaults() {
  localStorage.removeItem(SEEDED_KEY)
  localStorage.removeItem(CATEGORIES_KEY)
  localStorage.removeItem(MODULES_KEY)
  seedIfNeeded()
}

export { GRID_UNIT, GRID_HEIGHT_UNIT, BASE_HEIGHT }
