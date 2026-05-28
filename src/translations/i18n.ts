/**
 * Configuration i18next pour l'internationalisation
 * 
 * Ce fichier configure i18next pour gérer les traductions
 * en français et en anglais.
 * 
 * @module translations/i18n
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLanguage } from '@/services/storage';

// Import des traductions
import fr from './fr.json';
import en from './en.json';

/**
 * Initialise i18next avec la langue sauvegardée
 */
async function initializeI18n() {
    const savedLanguage = await getLanguage();
    
    await i18n
        .use(initReactI18next) // Passe i18n à react-i18next
        .init({
            // Ressources de traduction
            resources: {
                fr: { translation: fr },
                en: { translation: en },
            },

            // Langue par défaut
            lng: savedLanguage,

            // Langue de secours si une traduction est manquante
            fallbackLng: 'fr',

            // Désactiver l'échappement pour permettre le HTML dans les traductions
            interpolation: {
                escapeValue: false,
            },

            // Configuration React
            react: {
                useSuspense: false,
            },

            // Mode debug en développement
            debug: __DEV__,
        });
}

// Initialiser i18n
initializeI18n().catch(console.error);

export default i18n;
