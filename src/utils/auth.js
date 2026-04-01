// Simulated auth context (to be replaced with real backend later)
// Stores user data in localStorage for demo purposes

const STORAGE_KEY = 'modo_user'
const HISTORY_KEY = 'modo_history'
const DOWNLOADS_KEY = 'modo_downloads'

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY))
  } catch { return null }
}

export function login(email, password) {
  // Simulated - in production, call API
  const user = {
    id: Date.now(),
    email,
    name: email.split('@')[0],
    plan: 'free', // free | user | commercial
    planLabel: 'Gratuit',
    downloadsUsed: 0,
    downloadsLimit: 10,
    createdAt: new Date().toISOString(),
    isAdmin: email.includes('admin') || email.includes('ommedesign'),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  return user
}

export function register(email, password, name) {
  const user = {
    id: Date.now(),
    email,
    name: name || email.split('@')[0],
    plan: 'free',
    planLabel: 'Gratuit',
    downloadsUsed: 0,
    downloadsLimit: 10,
    createdAt: new Date().toISOString(),
    isAdmin: email.includes('admin') || email.includes('ommedesign'),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  return user
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY)
}

export function updateUser(updates) {
  const user = getUser()
  if (!user) return null
  const updated = { ...user, ...updates }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}

export function upgradePlan(planId) {
  const plans = {
    free: { plan: 'free', planLabel: 'Gratuit', downloadsLimit: 10 },
    user: { plan: 'user', planLabel: 'Utilisateur', downloadsLimit: Infinity },
    commercial: { plan: 'commercial', planLabel: 'Commercial', downloadsLimit: Infinity },
  }
  return updateUser(plans[planId] || plans.free)
}

// Fabrication history
export function getFabrications() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []
  } catch { return [] }
}

export function addFabrication(config) {
  const history = getFabrications()
  history.unshift({
    id: Date.now(),
    date: new Date().toISOString(),
    name: config.name || 'Configuration sans nom',
    gridSize: config.gridSize,
    moduleCount: config.moduleCount || 0,
    modules: config.modules || [],
  })
  // Keep last 50
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)))
}

// Download history
export function getDownloads() {
  try {
    return JSON.parse(localStorage.getItem(DOWNLOADS_KEY)) || []
  } catch { return [] }
}

export function addDownload(filename) {
  const downloads = getDownloads()
  downloads.unshift({
    id: Date.now(),
    date: new Date().toISOString(),
    filename,
  })
  localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads.slice(0, 100)))

  // Increment download counter
  const user = getUser()
  if (user) {
    updateUser({ downloadsUsed: (user.downloadsUsed || 0) + 1 })
  }
}

export function canDownload() {
  const user = getUser()
  if (!user) return false
  if (user.plan !== 'free') return true
  return (user.downloadsUsed || 0) < (user.downloadsLimit || 10)
}
