/**
 * Hook useSearchHistory
 * 
 * Hook personnalisé pour gérer l'historique de recherche avec état réactif.
 * Facilite l'utilisation du service searchHistory dans les composants React.
 * 
 * @module hooks/useSearchHistory
 */

import { useState, useEffect, useCallback } from 'react';
import {
    getSearchHistory,
    addToSearchHistory,
    removeFromSearchHistory,
    clearSearchHistory,
    cleanupExpiredHistory,
    getSearchHistoryStats,
    type SearchHistoryItem
} from '@/services/searchHistory';

// ============================================================================
// Types
// ============================================================================

export interface UseSearchHistoryOptions {
    /** Type de recherche à filtrer */
    type?: 'amodiataires' | 'routes' | 'announcements';
    /** Charger automatiquement au montage */
    autoLoad?: boolean;
    /** Nettoyer automatiquement les éléments expirés */
    autoCleanup?: boolean;
}

export interface UseSearchHistoryReturn {
    /** Liste des éléments d'historique */
    history: SearchHistoryItem[];
    /** Indique si le chargement est en cours */
    isLoading: boolean;
    /** Erreur éventuelle */
    error: Error | null;
    /** Recharger l'historique */
    reload: () => Promise<void>;
    /** Ajouter un élément à l'historique */
    addItem: (
        query: string,
        type: 'amodiataires' | 'routes' | 'announcements',
        data?: SearchHistoryItem['data']
    ) => Promise<void>;
    /** Supprimer un élément de l'historique */
    removeItem: (itemId: string) => Promise<void>;
    /** Effacer tout l'historique */
    clearAll: (type?: 'amodiataires' | 'routes' | 'announcements') => Promise<void>;
    /** Statistiques de l'historique */
    stats: {
        total: number;
        byType: Record<string, number>;
        oldestTimestamp: number | null;
        newestTimestamp: number | null;
    } | null;
    /** Recharger les statistiques */
    reloadStats: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook pour gérer l'historique de recherche
 * 
 * @param options - Options de configuration
 * @returns Objet avec l'historique et les fonctions de gestion
 * 
 * @example
 * ```typescript
 * const { history, addItem, removeItem, clearAll } = useSearchHistory({
 *     type: 'amodiataires',
 *     autoLoad: true
 * });
 * 
 * // Ajouter un élément
 * await addItem('Recherche test', 'amodiataires');
 * 
 * // Supprimer un élément
 * await removeItem(history[0].id);
 * 
 * // Effacer tout
 * await clearAll();
 * ```
 */
export function useSearchHistory(options: UseSearchHistoryOptions = {}): UseSearchHistoryReturn {
    const {
        type,
        autoLoad = true,
        autoCleanup = true
    } = options;

    // ============================================================================
    // État
    // ============================================================================

    const [history, setHistory] = useState<SearchHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [stats, setStats] = useState<UseSearchHistoryReturn['stats']>(null);

    // ============================================================================
    // Fonctions
    // ============================================================================

    /**
     * Charge l'historique depuis le cache
     */
    const reload = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Nettoyer les éléments expirés si activé
            if (autoCleanup) {
                await cleanupExpiredHistory();
            }

            // Charger l'historique
            const loadedHistory = await getSearchHistory(type);
            setHistory(loadedHistory);

            console.log(`📚 Historique chargé: ${loadedHistory.length} éléments`);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Erreur chargement historique');
            setError(error);
            console.error('❌ Erreur chargement historique:', error);
        } finally {
            setIsLoading(false);
        }
    }, [type, autoCleanup]);

    /**
     * Ajoute un élément à l'historique
     */
    const addItem = useCallback(async (
        query: string,
        itemType: 'amodiataires' | 'routes' | 'announcements',
        data?: SearchHistoryItem['data']
    ) => {
        try {
            await addToSearchHistory(query, itemType, data);
            
            // Recharger l'historique si le type correspond
            if (!type || type === itemType) {
                await reload();
            }

            console.log(`📚 Élément ajouté: "${query}"`);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Erreur ajout élément');
            setError(error);
            console.error('❌ Erreur ajout élément:', error);
            throw error;
        }
    }, [type, reload]);

    /**
     * Supprime un élément de l'historique
     */
    const removeItem = useCallback(async (itemId: string) => {
        try {
            await removeFromSearchHistory(itemId);
            
            // Mettre à jour l'état local immédiatement
            setHistory(prev => prev.filter(item => item.id !== itemId));

            console.log(`📚 Élément supprimé: ${itemId}`);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Erreur suppression élément');
            setError(error);
            console.error('❌ Erreur suppression élément:', error);
            throw error;
        }
    }, []);

    /**
     * Efface tout l'historique
     */
    const clearAll = useCallback(async (clearType?: 'amodiataires' | 'routes' | 'announcements') => {
        try {
            await clearSearchHistory(clearType);
            
            // Recharger l'historique
            await reload();

            console.log(`📚 Historique effacé${clearType ? ` (type: ${clearType})` : ''}`);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Erreur effacement historique');
            setError(error);
            console.error('❌ Erreur effacement historique:', error);
            throw error;
        }
    }, [reload]);

    /**
     * Recharge les statistiques
     */
    const reloadStats = useCallback(async () => {
        try {
            const loadedStats = await getSearchHistoryStats();
            setStats(loadedStats);
            console.log('📊 Statistiques chargées:', loadedStats);
        } catch (err) {
            console.error('❌ Erreur chargement statistiques:', err);
        }
    }, []);

    // ============================================================================
    // Effets
    // ============================================================================

    /**
     * Charge l'historique au montage si autoLoad est activé
     */
    useEffect(() => {
        if (autoLoad) {
            reload();
            reloadStats();
        }
    }, [autoLoad, reload, reloadStats]);

    /**
     * Recharge l'historique quand le type change
     */
    useEffect(() => {
        if (autoLoad) {
            reload();
        }
    }, [type, autoLoad, reload]);

    // ============================================================================
    // Retour
    // ============================================================================

    return {
        history,
        isLoading,
        error,
        reload,
        addItem,
        removeItem,
        clearAll,
        stats,
        reloadStats,
    };
}

// ============================================================================
// Hooks utilitaires
// ============================================================================

/**
 * Hook pour obtenir uniquement les statistiques de l'historique
 * 
 * @example
 * ```typescript
 * const stats = useSearchHistoryStats();
 * console.log(`Total: ${stats?.total}`);
 * ```
 */
export function useSearchHistoryStats() {
    const [stats, setStats] = useState<UseSearchHistoryReturn['stats']>(null);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const loadedStats = await getSearchHistoryStats();
                setStats(loadedStats);
            } catch (error) {
                console.error('❌ Erreur chargement statistiques:', error);
            }
        };

        loadStats();
    }, []);

    return stats;
}

/**
 * Hook pour vérifier si un élément existe dans l'historique
 * 
 * @param query - Texte de recherche à vérifier
 * @param type - Type de recherche
 * @returns true si l'élément existe dans l'historique
 * 
 * @example
 * ```typescript
 * const exists = useSearchHistoryExists('Test', 'amodiataires');
 * ```
 */
export function useSearchHistoryExists(
    query: string,
    type: 'amodiataires' | 'routes' | 'announcements'
): boolean {
    const { history } = useSearchHistory({ type, autoLoad: true });

    return history.some(
        item => item.query.toLowerCase() === query.toLowerCase() && item.type === type
    );
}
