/**
 * Store Zustand pour l'├®tat global de l'application
 * 
 * Ce fichier g├¿re l'├®tat global de l'application incluant :
 * - Th├¿me (light/dark/auto)
 * - Langue (fr/en)
 * - Premier lancement
 * - ├ëtat de connexion r├®seau
 * - ├ëtat de localisation
 * 
 * @module store/app
 */

import { create } from 'zustand';
import type { ThemeMode, Language, NetworkState, LocationState } from '@/types';
import { getThemeMode, saveThemeMode, getLanguage, saveLanguage } from '@/services/storage';

// ============================================================================
// Interface du Store
// ============================================================================

/**
 * ├ëtat du store de l'application
 */
interface AppState {
    // Th├¿me
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;

    // Langue
    language: Language;
    setLanguage: (language: Language) => void;

    // Premier lancement
    isFirstLaunch: boolean;
    setIsFirstLaunch: (value: boolean) => void;
    hasSeenTutorial: boolean;
    setHasSeenTutorial: (value: boolean) => void;

    // ├ëtat r├®seau
    networkState: NetworkState;
    setNetworkState: (state: NetworkState) => void;

    // ├ëtat localisation
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
    // ├ëtat Initial
    // ============================================================================

    themeMode: 'auto',
    language: 'fr',
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
    // Actions Th├¿me
    // ============================================================================

    /**
     * Change le mode de th├¿me et le sauvegarde
     */
    setThemeMode: (mode: ThemeMode) => {
        set({ themeMode: mode });
        // Sauvegarder de mani├¿re asynchrone sans bloquer l'UI
        saveThemeMode(mode).then(() => {
            console.log('­ƒÄ¿ Th├¿me chang├® et sauvegard├®:', mode);
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
        // Sauvegarder de mani├¿re asynchrone sans bloquer l'UI
        saveLanguage(language).then(() => {
            console.log('­ƒîì Langue chang├®e et sauvegard├®e:', language);
        });
    },

    // ============================================================================
    // Actions Premier Lancement
    // ============================================================================

    /**
     * D├®finit si c'est le premier lancement
     */
    setIsFirstLaunch: (value: boolean) => {
        set({ isFirstLaunch: value });
    },

    /**
     * D├®finit si le tutoriel a ├®t├® vu
     */
    setHasSeenTutorial: (value: boolean) => {
        set({ hasSeenTutorial: value });
    },

    // ============================================================================
    // Actions R├®seau
    // ============================================================================

    /**
     * Met ├á jour l'├®tat du r├®seau
     */
    setNetworkState: (state: NetworkState) => {
        set({ networkState: state });

        if (!state.isConnected) {
            console.log('ÔÜá´©Å Connexion internet perdue');
        } else {
            console.log('Ô£à Connexion internet r├®tablie');
        }
    },

    // ============================================================================
    // Actions Localisation
    // ============================================================================

    /**
     * Met ├á jour l'├®tat de la localisation
     */
    setLocationState: (state: LocationState) => {
        set({ locationState: state });
    },

    // ============================================================================
    // Initialisation
    // ============================================================================

    /**
     * Initialise le store avec les valeurs sauvegard├®es
     */
    initialize: async () => {
        try {
            // Charger les pr├®f├®rences sauvegard├®es
            const savedTheme = await getThemeMode();
            const savedLanguage = await getLanguage();

            set({
                themeMode: savedTheme,
                language: savedLanguage,
            });

            console.log('Ô£à Store initialis├®:', {
                themeMode: savedTheme,
                language: savedLanguage,
            });
        } catch (error) {
            console.error('ÔØî Erreur lors de l\'initialisation du store:', error);
        }
    },
}));

// ============================================================================
// S├®lecteurs (pour optimiser les re-renders)
// ============================================================================

/**
 * S├®lectionne uniquement le mode de th├¿me
 */
export const useThemeMode = () => useAppStore((state) => state.themeMode);

/**
 * S├®lectionne uniquement la langue
 */
export const useLanguage = () => useAppStore((state) => state.language);

/**
 * S├®lectionne uniquement l'├®tat r├®seau
 */
export const useNetworkState = () => useAppStore((state) => state.networkState);

/**
 * S├®lectionne uniquement l'├®tat de localisation
 */
export const useLocationState = () => useAppStore((state) => state.locationState);

/**
 * S├®lectionne si c'est le premier lancement
 */
export const useIsFirstLaunch = () => useAppStore((state) => state.isFirstLaunch);
