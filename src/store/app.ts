/**
 * Store Zustand pour l'état global de l'application
 * 
 * Ce fichier gère l'état global de l'application incluant :
 * - Thème (light/dark/auto)
 * - Langue (fr/en)
 * - Premier lancement
 * - État de connexion réseau
 * - État de localisation
 * 
 * @module store/app
 */

import { create } from 'zustand';
import type { ThemeMode, Language, NetworkState, LocationState, AppMapType } from '@/types';
import { getThemeMode, saveThemeMode, getLanguage, saveLanguage, getMapType, saveMapType } from '@/services/storage';

// ============================================================================
// Interface du Store
// ============================================================================

/**
 * État du store de l'application
 */
interface AppState {
    // Thème
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;

    // Langue
    language: Language;
    setLanguage: (language: Language) => void;

    // Type de carte
    mapType: AppMapType;
    setMapType: (type: AppMapType) => void;

    // Premier lancement
    isFirstLaunch: boolean;
    setIsFirstLaunch: (value: boolean) => void;
    hasSeenTutorial: boolean;
    setHasSeenTutorial: (value: boolean) => void;

    // État réseau
    networkState: NetworkState;
    setNetworkState: (state: NetworkState) => void;

    // État localisation
    locationState: LocationState;
    setLocationState: (state: LocationState) => void;

    // Initialisation
    initialize: () => Promise<void>;
}

// ============================================================================
// Store Zustand
// ============================================================================

/**
 * Store global de l'application
 */
export const useAppStore = create<AppState>((set) => ({
    // ============================================================================
    // État Initial
    // ============================================================================

    themeMode: 'auto',
    language: 'fr',
    mapType: 'hybrid',
    isFirstLaunch: true,
    hasSeenTutorial: false,

    networkState: {
        isConnected: true,
        isInternetReachable: null,
        type: null,
    },

    locationState: {
        permission: 'undetermined',
        isEnabled: false,
        currentLocation: null,
    },

    // ============================================================================
    // Actions Thème
    // ============================================================================

    /**
     * Change le mode de thème et le sauvegarde
     */
    setThemeMode: (mode: ThemeMode) => {
        set({ themeMode: mode });
        // Sauvegarder de manière asynchrone sans bloquer l'UI
        saveThemeMode(mode).then(() => {
            console.log('🎨 Thème changé et sauvegardé:', mode);
        });
    },

    // ============================================================================
    // Actions Langue
    // ============================================================================

    /**
     * Change la langue et la sauvegarde
     */
    setLanguage: (language: Language) => {
        set({ language });
        // Sauvegarder de manière asynchrone sans bloquer l'UI
        saveLanguage(language).then(() => {
            console.log('🌍 Langue changée et sauvegardée:', language);
        });
    },

    // ============================================================================
    // Actions Carte
    // ============================================================================

    /**
     * Change le type de carte et le sauvegarde
     */
    setMapType: (type: AppMapType) => {
        set({ mapType: type });
        saveMapType(type).then(() => {
            console.log('🗺️ Type de carte changé et sauvegardé:', type);
        });
    },

    // ============================================================================
    // Actions Premier Lancement
    // ============================================================================

    /**
     * Définit si c'est le premier lancement
     */
    setIsFirstLaunch: (value: boolean) => {
        set({ isFirstLaunch: value });
    },

    /**
     * Définit si le tutoriel a été vu
     */
    setHasSeenTutorial: (value: boolean) => {
        set({ hasSeenTutorial: value });
    },

    // ============================================================================
    // Actions Réseau
    // ============================================================================

    /**
     * Met à jour l'état du réseau
     */
    setNetworkState: (state: NetworkState) => {
        set({ networkState: state });

        if (!state.isConnected) {
            console.log('⚠️ Connexion internet perdue');
        } else {
            console.log('✅ Connexion internet rétablie');
        }
    },

    // ============================================================================
    // Actions Localisation
    // ============================================================================

    /**
     * Met à jour l'état de la localisation
     */
    setLocationState: (state: LocationState) => {
        set({ locationState: state });
    },

    // ============================================================================
    // Initialisation
    // ============================================================================

    /**
     * Initialise le store avec les valeurs sauvegardées
     */
    initialize: async () => {
        try {
            // Charger les préférences sauvegardées
            const savedTheme = await getThemeMode();
            const savedLanguage = await getLanguage();
            const savedMapType = await getMapType() as AppMapType;

            set({
                themeMode: savedTheme,
                language: savedLanguage,
                mapType: savedMapType || 'hybrid',
            });

            console.log('✅ Store initialisé:', {
                themeMode: savedTheme,
                language: savedLanguage,
                mapType: savedMapType,
            });
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du store:', error);
        }
    },
}));

// ============================================================================
// Sélecteurs (pour optimiser les re-renders)
// ============================================================================

/**
 * Sélectionne uniquement le mode de thème
 */
export const useThemeMode = () => useAppStore((state) => state.themeMode);

/**
 * Sélectionne uniquement la langue
 */
export const useLanguage = () => useAppStore((state) => state.language);

/**
 * Sélectionne uniquement l'état réseau
 */
export const useNetworkState = () => useAppStore((state) => state.networkState);

/**
 * Sélectionne uniquement l'état de localisation
 */
export const useLocationState = () => useAppStore((state) => state.locationState);

/**
 * Sélectionne uniquement si c'est le premier lancement
 */
export const useIsFirstLaunch = () => useAppStore((state) => state.isFirstLaunch);

/**
 * Sélectionne uniquement le type de carte
 */
export const useMapType = () => useAppStore((state) => state.mapType);
