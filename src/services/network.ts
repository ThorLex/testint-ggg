/**
 * Service de connectivité réseau
 * 
 * Version sécurisée qui simule l'état réseau pour éviter les erreurs de compilation.
 * En production, ceci devrait être remplacé par une vraie implémentation.
 * 
 * @module services/network
 */

import type { NetworkState } from '@/types';

// ============================================================================
// État de la Connexion (Version Simulée)
// ============================================================================

/**
 * Récupère l'état actuel de la connexion réseau (simulé)
 * 
 * @returns État de la connexion simulé
 */
export async function getNetworkState(): Promise<NetworkState> {
    try {
        // Simuler un état de connexion stable
        const networkState: NetworkState = {
            isConnected: true,
            isInternetReachable: true,
            type: 'wifi',
        };

        console.log('🌐 État réseau (simulé):', networkState);
        return networkState;
    } catch (error) {
        console.error('❌ Erreur lors de la récupération de l\'état réseau:', error);
        return {
            isConnected: false,
            isInternetReachable: null,
            type: null,
        };
    }
}

/**
 * Vérifie si l'appareil est connecté à internet (simulé)
 * 
 * @returns true (simulé comme toujours connecté)
 */
export async function isConnected(): Promise<boolean> {
    const state = await getNetworkState();
    return state.isConnected && state.isInternetReachable !== false;
}

// ============================================================================
// Écoute des Changements de Connexion (Version Simulée)
// ============================================================================

/**
 * Type de callback pour les changements de connexion
 */
export type NetworkCallback = (state: NetworkState) => void;

/**
 * Écoute les changements d'état de la connexion réseau (simulé)
 * 
 * @param callback - Fonction appelée à chaque changement d'état
 * @returns Fonction pour arrêter l'écoute
 */
export function watchNetworkState(callback: NetworkCallback): () => void {
    console.log('✅ Écoute des changements de connexion démarrée (mode simulation)');

    // Simuler un état initial stable
    setTimeout(() => {
        const networkState: NetworkState = {
            isConnected: true,
            isInternetReachable: true,
            type: 'wifi',
        };
        callback(networkState);
    }, 100);

    // En mode développement, simuler quelques changements
    let simulationInterval: NodeJS.Timeout | null = null;
    
    if (__DEV__) {
        // Simuler un changement de connexion après 10 secondes (une seule fois)
        const simulationTimeout = setTimeout(() => {
            console.log('🔧 Simulation: Maintien de la connexion stable');
        }, 10000);

        simulationInterval = simulationTimeout;
    }

    // Retourner une fonction pour arrêter l'écoute
    return () => {
        if (simulationInterval) {
            clearTimeout(simulationInterval);
        }
        console.log('🛑 Écoute des changements de connexion arrêtée');
    };
}

// ============================================================================
// Utilitaires
// ============================================================================

/**
 * Obtient le type de connexion en texte lisible
 * 
 * @param type - Type de connexion
 * @returns Texte lisible
 */
export function getConnectionTypeLabel(type: string | null): string {
    switch (type) {
        case 'wifi':
            return 'Wi-Fi';
        case 'cellular':
            return 'Données mobiles';
        case 'ethernet':
            return 'Ethernet';
        case 'bluetooth':
            return 'Bluetooth';
        case 'none':
            return 'Aucune connexion';
        case 'unknown':
        default:
            return 'Connexion inconnue';
    }
}

/**
 * Vérifie si la connexion est rapide (Wi-Fi ou 4G/5G)
 * 
 * @param state - État de la connexion
 * @returns true si la connexion est rapide
 */
export function isFastConnection(state: NetworkState): boolean {
    return state.type === 'wifi' || state.type === 'ethernet';
}

/**
 * Attend que la connexion soit rétablie (simulé)
 * 
 * @param timeout - Timeout en millisecondes (par défaut 30 secondes)
 * @returns Promise qui se résout immédiatement (simulé comme connecté)
 */
export async function waitForConnection(timeout: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
        // Simuler une connexion immédiate
        setTimeout(() => {
            console.log('🌐 Connexion simulée comme disponible');
            resolve(true);
        }, 100);
    });
}
