/**
 * Configuration Tailwind CSS pour Navipad
 * 
 * Ce fichier définit la palette de couleurs personnalisée (vert, noir, blanc)
 * et configure NativeWind pour React Native.
 * 
 * @see https://www.nativewind.dev/
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Fichiers à scanner pour les classes Tailwind
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],

  // Mode sombre basé sur la classe 'dark' (contrôle manuel)
  darkMode: 'class',

  // Préréglages NativeWind pour React Native
  presets: [require("nativewind/preset")],

  theme: {
    extend: {
      // Palette de couleurs personnalisée Navipad
      colors: {
        // Couleurs principales
        primary: {
          50: '#ECFDF5',   // Vert très clair
          100: '#D1FAE5',  // Vert clair
          200: '#A7F3D0',  // Vert pastel
          300: '#6EE7B7',  // Vert moyen clair
          400: '#34D399',  // Vert moyen
          500: '#10B981',  // Vert principal (brand)
          600: '#059669',  // Vert foncé
          700: '#047857',  // Vert très foncé
          800: '#065F46',  // Vert profond
          900: '#064E3B',  // Vert ultra foncé
        },

        // Couleurs neutres (noir/blanc/gris)
        neutral: {
          50: '#FAFAFA',   // Blanc cassé
          100: '#F5F5F5',  // Gris très clair
          200: '#E5E5E5',  // Gris clair
          300: '#D4D4D4',  // Gris moyen clair
          400: '#A3A3A3',  // Gris moyen
          500: '#737373',  // Gris
          600: '#525252',  // Gris foncé
          700: '#404040',  // Gris très foncé
          800: '#262626',  // Presque noir
          900: '#171717',  // Noir profond
          950: '#0A0A0A',  // Noir absolu
        },

        // Couleurs sémantiques
        success: '#10B981',  // Vert (succès)
        warning: '#F59E0B',  // Orange (avertissement)
        error: '#EF4444',    // Rouge (erreur)
        info: '#3B82F6',     // Bleu (information)

        // Couleurs de fond selon le thème
        background: {
          light: '#FFFFFF',
          dark: '#0A0A0A',
        },

        // Couleurs de surface (cartes, modales)
        surface: {
          light: '#F5F5F5',
          dark: '#171717',
        },
      },

      // Espacements personnalisés
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      // Bordures arrondies
      borderRadius: {
        '4xl': '2rem',
      },

      // Ombres personnalisées
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'hard': '0 8px 24px rgba(0, 0, 0, 0.16)',
      },

      // Polices (à ajouter via expo-font si nécessaire)
      fontFamily: {
        sans: ['System'],
        mono: ['Courier'],
      },
    },
  },

  plugins: [],
}
