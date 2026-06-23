// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { TRANSLATIONS } from './utils/translation';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ko: { translation: TRANSLATIONS.ko },
      en: { translation: TRANSLATIONS.en },
      ja: { translation: TRANSLATIONS.ja },
      zh: { translation: TRANSLATIONS.zh }
    },
    fallbackLng: 'ko',
    debug: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
