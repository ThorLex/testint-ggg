/**
 * Système de thème pour Navipad
 * 
 * Ce fichier gère le thème dynamique (clair/sombre) de l'application
 * en utilisant NativeWind et le système de couleurs Tailwind.
 * 
 * @module theme/colors
 */

import { useColorScheme } from 'react-native';
import { useThemeMode } from '@/store';

/**
 * Palette de couleurs pour le thème clair
 */
export const lightColors = {
    primary: '#10B981',      // Vert principal
    background: '#FFFFFF',   // Blanc
    surface: '#F5F5F5',      // Gris très clair
    text: '#171717',         // Noir profond
    textSecondary: '#737373', // Gris
    border: '#E5E5E5',       // Gris clair
    error: '#EF4444',        // Rouge
    success: '#10B981',      // Vert
    warning: '#F59E0B',      // Orange
    info: '#3B82F6',         // Bleu
};

/**
 * Palette de couleurs pour le thème sombre
 */
export const darkColors = {
    primary: '#10B981',      // Vert principal
    background: '#0A0A0A',   // Noir absolu
    surface: '#171717',      // Noir profond
    text: '#FAFAFA',         // Blanc cassé
    textSecondary: '#A3A3A3', // Gris moyen
    border: '#262626',       // Presque noir
    error: '#EF4444',        // Rouge
    success: '#10B981',      // Vert
    warning: '#F59E0B',      // Orange
    info: '#3B82F6',         // Bleu
};

/**
 * Hook pour obtenir les couleurs du thème actuel
 * 
 * @returns Palette de couleurs selon le thème
 */
export function useThemeColors() {
    const themeMode = useThemeMode();
    const systemColorScheme = useColorScheme();

    // Déterminer le thème effectif
    const effectiveTheme =
        themeMode === 'auto'
            ? systemColorScheme || 'light'
            : themeMode;

    return effectiveTheme === 'dark' ? darkColors : lightColors;
}

/**
 * Hook pour savoir si on est en mode sombre
 * 
 * @returns true si mode sombre, false sinon
 */
export function useIsDarkMode(): boolean {
    const themeMode = useThemeMode();
    const systemColorScheme = useColorScheme();

    if (themeMode === 'auto') {
        return systemColorScheme === 'dark';
    }

    return themeMode === 'dark';
}
