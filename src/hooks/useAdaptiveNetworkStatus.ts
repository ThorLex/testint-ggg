/**
 * Hook useAdaptiveNetworkStatus
 * 
 * Système adaptatif qui bascule automatiquement entre les différentes
 * implémentations selon les dépendances disponibles.
 * 
 * @module hooks/useAdaptiveNetworkStatus
 */

import { useBasicNetworkStatus } from './useBasicNetworkStatus';

/**
 * Hook adaptatif pour la surveillance réseau
 */
export function useAdaptiveNetworkStatus() {
    // Pour l'instant, utilisons seulement la version basique pour éviter les erreurs
    const result = useBasicNetworkStatus();
    
    return {
        ...result,
        hookType: 'basic', // Pour debug
    };
}