/**
 * Hook useBasicNetworkStatus
 * 
 * Version basique sans aucune dépendance externe.
 * Utilise seulement React Native core APIs.
 * 
 * @module hooks/useBasicNetworkStatus
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export interface BasicNetworkStatus {
    /** État de la connexion (toujours true pour cette version basique) */
    isConnected: boolean | null;
    /** Type de connexion */
    type: string | null;
    /** Indique si c'est la première vérification */
    isInitialLoad: boolean;
    /** Composant Toast (vide pour cette version) */
    ToastComponent: () => JSX.Element | null;
}

/**
 * Hook basique pour l'état réseau (version sans dépendances)
 * 
 * @returns BasicNetworkStatus - État simulé de la connexion
 */
export function useBasicNetworkStatus(): BasicNetworkStatus {
    const { t } = useTranslation();
    const [isConnected] = useState<boolean | null>(true);
    const [connectionType] = useState<string | null>('wifi');
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        // Simuler le chargement initial
        const timer = setTimeout(() => {
            setIsInitialLoad(false);
            console.log('📱 Système réseau basique initialisé (simulation)');
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    // Composant Toast vide
    const ToastComponent = () => null;

    return {
        isConnected,
        type: connectionType,
        isInitialLoad,
        ToastComponent,
    };
}