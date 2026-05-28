/**
 * Helpers pour la navigation
 * Permet de fermer tous les bottom sheets depuis n'importe où
 */

import { useMapStore } from '@/store';

// Variable globale pour stocker les setters
let globalSetters: {
    setShowAmodiatairesList: (value: boolean) => void;
    setShowSettings: (value: boolean) => void;
    setShowLogin: (value: boolean) => void;
    setShowDashboard: (value: boolean) => void;
    setShowDetailsPage: (value: boolean) => void;
    setShowServicesList: (value: boolean) => void;
    setShowHistoryMenu: (value: boolean) => void;
    setShowNotifications: (value: boolean) => void;
    setShowRouteDetails: (value: boolean) => void;
    setShowTutorial: (value: boolean) => void;
} | null = null;

/**
 * Enregistrer les setters depuis app/index.tsx
 */
export function registerBottomSheetSetters(setters: {
    setShowAmodiatairesList: (value: boolean) => void;
    setShowSettings: (value: boolean) => void;
    setShowLogin: (value: boolean) => void;
    setShowDashboard: (value: boolean) => void;
    setShowDetailsPage: (value: boolean) => void;
    setShowServicesList: (value: boolean) => void;
    setShowHistoryMenu: (value: boolean) => void;
    setShowNotifications: (value: boolean) => void;
    setShowRouteDetails: (value: boolean) => void;
    setShowTutorial: (value: boolean) => void;
}) {
    globalSetters = setters;
    console.log('✅ Bottom sheet setters enregistrés');
}

/**
 * Fermer TOUS les bottom sheets
 * Peut être appelé depuis n'importe où dans l'application
 */
export function closeAllBottomSheets() {
    console.log('🔥 FERMETURE DE TOUS LES BOTTOM SHEETS (GLOBAL)');
    
    if (!globalSetters) {
        console.error('❌ Setters non enregistrés! Appeler registerBottomSheetSetters d\'abord');
        return;
    }
    
    // Fermer tous les bottom sheets
    globalSetters.setShowAmodiatairesList(false);
    globalSetters.setShowSettings(false);
    globalSetters.setShowLogin(false);
    globalSetters.setShowDashboard(false);
    globalSetters.setShowDetailsPage(false);
    globalSetters.setShowServicesList(false);
    globalSetters.setShowHistoryMenu(false);
    globalSetters.setShowNotifications(false);
    globalSetters.setShowRouteDetails(false);
    globalSetters.setShowTutorial(false);
    
    // Fermer AmodiataireDetailsSheet via le store
    const { setSelectedMarkerId } = useMapStore.getState();
    setSelectedMarkerId(null);
    
    console.log('✅ Tous les bottom sheets fermés');
}
