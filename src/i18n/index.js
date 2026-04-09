import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './fr.json'
import en from './en.json'

const LANG_KEY = 'modo_lang'

// Get saved language or detect from browser
function getDefaultLang() {
  const saved = localStorage.getItem(LANG_KEY)
  if (saved && ['fr', 'en'].includes(saved)) return saved
  const browser = navigator.language?.slice(0, 2)
  return browser === 'en' ? 'en' : 'fr'
}

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: getDefaultLang(),
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
})

// Save language preference when changed
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(LANG_KEY, lng)
  document.documentElement.lang = lng
})

export default i18n
