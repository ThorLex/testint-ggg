/**
 * Hook useSafeNetworkStatus
 * 
 * Version améliorée qui utilise @react-native-community/netinfo
 * et affiche des toasts lors des changements d'état.
 * 
 * @module hooks/useSafeNetworkStatus
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';

export interface SafeNetworkStatus {
    /** État de la connexion */
    isConnected: boolean | null;
    /** Type de connexion */
    type: string | null;
    /** Indique si c'est la première vérification */
    isInitialLoad: boolean;
    /** Composant Toast exporté pour rétrocompatibilité (utiliser react-native-toast-message directement en réalité) */
    ToastComponent: () => null;
}

/**
 * Hook pour l'état réseau utilisant NetInfo
 * Affiche un toast lorsque la connexion est perdue ou retrouvée.
 * 
 * @returns SafeNetworkStatus - État de la connexion
 */
export function useSafeNetworkStatus(): SafeNetworkStatus {
    const { t } = useTranslation();
    const [isConnected, setIsConnected] = useState<boolean | null>(true);
    const [connectionType, setConnectionType] = useState<string | null>('wifi');
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const hasLostConnection = useRef(false);

    useEffect(() => {
        // Initialiser NetInfo
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            const connected = state.isConnected ?? false;
            setIsConnected(connected);
            setConnectionType(state.type);
            setIsInitialLoad(false);

            // Gérer les notifications de changement d'état
            if (!connected && !hasLostConnection.current) {
                // Connexion perdue
                hasLostConnection.current = true;
                Toast.show({
                    type: 'error',
                    text1: 'Hors ligne',
                    text2: 'Vous n\'êtes plus connecté à Internet.',
                    position: 'top',
                    topOffset: 60,
                    visibilityTime: 4000,
                });
            } else if (connected && hasLostConnection.current) {
                // Connexion rétablie
                hasLostConnection.current = false;
                Toast.show({
                    type: 'success',
                    text1: 'En ligne',
                    text2: 'Connexion Internet rétablie.',
                    position: 'top',
                    topOffset: 60,
                    visibilityTime: 4000,
                });
            }
        });

        // Simuler le délai de chargement pour que l'app ait le temps de s'initialiser
        const timer = setTimeout(() => {
            setIsInitialLoad(false);
        }, 500);

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    }, []);

    // Composant Toast vide pour rétrocompatibilité
    const ToastComponent = () => null;

    return {
        isConnected,
        type: connectionType,
        isInitialLoad,
        ToastComponent,
    };
}