/**
 * Service de gestion de l'historique de recherche
 * 
 * Gère la sauvegarde et la récupération de l'historique des recherches
 * dans le cache local de l'appareil avec AsyncStorage.
 * 
 * @module services/searchHistory
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Types
// ============================================================================

export interface SearchHistoryItem {
    /** ID unique de l'élément */
    id: string;
    /** Texte de la recherche */
    query: string;
    /** Type de recherche */
    type: 'amodiataires' | 'routes' | 'announcements';
    /** Timestamp de la recherche */
    timestamp: number;
    /** Données associées (optionnel) */
    data?: {
        /** Pour les amodiataires */
        amodiataireId?: string;
        amodiataireName?: string;
        /** Pour les routes */
        routeId?: string;
        routeName?: string;
    };
}

// ============================================================================
// Configuration
// ============================================================================

/** Clé de stockage pour l'historique */
const STORAGE_KEY = '@navipad_search_history';

/** Nombre maximum d'éléments dans l'historique */
const MAX_HISTORY_ITEMS = 50;

/** Durée de conservation en millisecondes (30 jours) */
const HISTORY_RETENTION_DAYS = 30;
const HISTORY_RETENTION_MS = HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000;

// ============================================================================
// Service de gestion de l'historique
// ============================================================================

/**
 * Récupère l'historique de recherche depuis le cache
 * 
 * @param type - Type de recherche à filtrer (optionnel)
 * @returns Liste des éléments d'historique
 */
export async function getSearchHistory(type?: 'amodiataires' | 'routes' | 'announcements'): Promise<SearchHistoryItem[]> {
    try {
        const historyJson = await AsyncStorage.getItem(STORAGE_KEY);
        
        if (!historyJson) {
            return [];
        }

        const history: SearchHistoryItem[] = JSON.parse(historyJson);
        
        // Nettoyer les éléments expirés
        const now = Date.now();
        const validHistory = history.filter(item => 
            (now - item.timestamp) < HISTORY_RETENTION_MS
        );

        // Filtrer par type si spécifié
        const filteredHistory = type 
            ? validHistory.filter(item => item.type === type)
            : validHistory;

        // Trier par timestamp décroissant (plus récent en premier)
        const sortedHistory = filteredHistory.sort((a, b) => b.timestamp - a.timestamp);

        console.log(`📚 Historique récupéré: ${sortedHistory.length} éléments${type ? ` (type: ${type})` : ''}`);
        
        return sortedHistory;
    } catch (error) {
        console.error('❌ Erreur récupération historique:', error);
        return [];
    }
}

/**
 * Ajoute une recherche à l'historique
 * 
 * @param query - Texte de la recherche
 * @param type - Type de recherche
 * @param data - Données associées (optionnel)
 */
export async function addToSearchHistory(
    query: string, 
    type: 'amodiataires' | 'routes' | 'announcements',
    data?: SearchHistoryItem['data']
): Promise<void> {
    try {
        // Ne pas ajouter les recherches vides ou trop courtes
        if (!query || query.trim().length < 2) {
            return;
        }

        const trimmedQuery = query.trim();
        
        // Récupérer l'historique existant
        const existingHistory = await getSearchHistory();
        
        // Vérifier si cette recherche existe déjà (même query et type)
        const existingIndex = existingHistory.findIndex(item => 
            item.query.toLowerCase() === trimmedQuery.toLowerCase() && 
            item.type === type
        );

        // Si elle existe, la supprimer pour la remettre en premier
        if (existingIndex !== -1) {
            existingHistory.splice(existingIndex, 1);
        }

        // Créer le nouvel élément
        const newItem: SearchHistoryItem = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            query: trimmedQuery,
            type,
            timestamp: Date.now(),
            data,
        };

        // Ajouter en premier
        const updatedHistory = [newItem, ...existingHistory];

        // Limiter le nombre d'éléments
        const limitedHistory = updatedHistory.slice(0, MAX_HISTORY_ITEMS);

        // Sauvegarder
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
        
        console.log(`📚 Recherche ajoutée à l'historique: "${trimmedQuery}" (${type})`);
    } catch (error) {
        console.error('❌ Erreur ajout historique:', error);
    }
}

/**
 * Supprime un élément spécifique de l'historique
 * 
 * @param itemId - ID de l'élément à supprimer
 */
export async function removeFromSearchHistory(itemId: string): Promise<void> {
    try {
        const existingHistory = await getSearchHistory();
        const updatedHistory = existingHistory.filter(item => item.id !== itemId);
        
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
        
        console.log(`📚 Élément supprimé de l'historique: ${itemId}`);
    } catch (error) {
        console.error('❌ Erreur suppression élément historique:', error);
    }
}

/**
 * Efface tout l'historique de recherche
 * 
 * @param type - Type spécifique à effacer (optionnel, sinon tout)
 */
export async function clearSearchHistory(type?: 'amodiataires' | 'routes' | 'announcements'): Promise<void> {
    try {
        if (type) {
            // Effacer seulement un type spécifique
            const existingHistory = await getSearchHistory();
            const filteredHistory = existingHistory.filter(item => item.type !== type);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHistory));
            console.log(`📚 Historique effacé pour le type: ${type}`);
        } else {
            // Effacer tout l'historique
            await AsyncStorage.removeItem(STORAGE_KEY);
            console.log('📚 Tout l\'historique effacé');
        }
    } catch (error) {
        console.error('❌ Erreur effacement historique:', error);
    }
}

/**
 * Nettoie automatiquement l'historique expiré
 */
export async function cleanupExpiredHistory(): Promise<void> {
    try {
        const history = await getSearchHistory();
        // La fonction getSearchHistory() nettoie déjà les éléments expirés
        // Il suffit de sauvegarder le résultat nettoyé
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        console.log('📚 Nettoyage automatique de l\'historique terminé');
    } catch (error) {
        console.error('❌ Erreur nettoyage historique:', error);
    }
}

/**
 * Obtient les statistiques de l'historique
 */
export async function getSearchHistoryStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    oldestTimestamp: number | null;
    newestTimestamp: number | null;
}> {
    try {
        const history = await getSearchHistory();
        
        const stats = {
            total: history.length,
            byType: {} as Record<string, number>,
            oldestTimestamp: null as number | null,
            newestTimestamp: null as number | null,
        };

        if (history.length > 0) {
            // Compter par type
            history.forEach(item => {
                stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
            });

            // Timestamps (l'historique est déjà trié par timestamp décroissant)
            stats.newestTimestamp = history[0].timestamp;
            stats.oldestTimestamp = history[history.length - 1].timestamp;
        }

        return stats;
    } catch (error) {
        console.error('❌ Erreur statistiques historique:', error);
        return {
            total: 0,
            byType: {},
            oldestTimestamp: null,
            newestTimestamp: null,
        };
    }
}