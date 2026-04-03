// Dynamic module store - persists custom categories and modules in localStorage
// Falls back to built-in data from modules.js for default categories

import { CATEGORIES as BUILTIN_CATEGORIES, GRID_UNIT, GRID_HEIGHT_UNIT, BASE_HEIGHT } from '../data/modules'

const CUSTOM_CATEGORIES_KEY = 'modo_custom_categories'
const CUSTOM_MODULES_KEY = 'modo_custom_modules'

// Get custom categories created by admin
export function getCustomCategories() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_CATEGORIES_KEY)) || []
  } catch { return [] }
}

export function saveCustomCategories(cats) {
  localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(cats))
}

// Get custom modules created by admin
export function getCustomModules() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_MODULES_KEY)) || []
  } catch { return [] }
}

export function saveCustomModules(mods) {
  localStorage.setItem(CUSTOM_MODULES_KEY, JSON.stringify(mods))
}

// Merge built-in + custom categories, injecting custom modules into matching categories
export function getAllCategories() {
  const customCats = getCustomCategories()
  const customMods = getCustomModules()

  // Start with built-in categories, add any custom modules to them
  const merged = BUILTIN_CATEGORIES.map(cat => ({
    ...cat,
    builtIn: true,
    modules: [
      ...cat.modules,
      ...customMods.filter(m => m.category === cat.id),
    ],
  }))

  // Add custom categories with their modules
  customCats.forEach(cc => {
    merged.push({
      ...cc,
      builtIn: false,
      modules: customMods.filter(m => m.category === cc.id),
    })
  })

  return merged
}

// Get all modules flat
export function getAllModules() {
  return getAllCategories().flatMap(cat =>
    cat.modules.map(mod => ({ ...mod, category: cat.id, categoryName: cat.name }))
  )
}

// Get module by ID
export function getModuleById(id) {
  return getAllModules().find(m => m.id === id)
}

// Category CRUD
export function addCategory(cat) {
  const cats = getCustomCategories()
  cats.push(cat)
  saveCustomCategories(cats)
  return cats
}

export function updateCategory(id, updates) {
  const cats = getCustomCategories().map(c => c.id === id ? { ...c, ...updates } : c)
  saveCustomCategories(cats)
  return cats
}

export function deleteCategory(id) {
  const cats = getCustomCategories().filter(c => c.id !== id)
  saveCustomCategories(cats)
  // Also delete modules in this category
  const mods = getCustomModules().filter(m => m.category !== id)
  saveCustomModules(mods)
  return cats
}

// Module CRUD
export function addModule(mod) {
  const mods = getCustomModules()
  mods.push(mod)
  saveCustomModules(mods)
  return mods
}

export function updateModule(id, updates) {
  const mods = getCustomModules().map(m => m.id === id ? { ...m, ...updates } : m)
  saveCustomModules(mods)
  return mods
}

export function deleteModule(id) {
  const mods = getCustomModules().filter(m => m.id !== id)
  saveCustomModules(mods)
  return mods
}

export { GRID_UNIT, GRID_HEIGHT_UNIT, BASE_HEIGHT }
