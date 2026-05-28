/**
 * Cache dédié pour les données détaillées d'amodiataires.
 *
 * Cache LRU en RAM avec TTL — indépendant de React Query.
 * Permet à l'AmodiataireDetailsSheet d'afficher les données
 * immédiatement sans attendre le réseau.
 *
 * @module services/api/amodiataireDetailsCache
 */

import type { AmodiataireDetailResponse } from '@/types';

/** Nombre maximum d'entrées conservées en mémoire */
const MAX_ENTRIES = 30;

/** Durée de validité d'une entrée (10 minutes) */
const TTL_MS = 10 * 60 * 1000;

interface CacheEntry {
    data: AmodiataireDetailResponse;
    cachedAt: number;
}

// Map ordonnée pour permettre l'éviction LRU (Map conserve l'ordre d'insertion)
const cache = new Map<string, CacheEntry>();

/** Retourne les données en cache pour un ID, ou null si absent/expiré. */
export function getCachedDetail(id: string): AmodiataireDetailResponse | null {
    const entry = cache.get(id);
    if (!entry) return null;

    if (Date.now() - entry.cachedAt > TTL_MS) {
        cache.delete(id);
        return null;
    }

    // Remettre en fin de Map (accès récent = LRU)
    cache.delete(id);
    cache.set(id, entry);
    return entry.data;
}

/** Stocke les données en cache pour un ID. Évicte le plus ancien si plein. */
export function setCachedDetail(id: string, data: AmodiataireDetailResponse): void {
    if (cache.size >= MAX_ENTRIES) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey) cache.delete(oldestKey);
    }
    cache.set(id, { data, cachedAt: Date.now() });
}

/** Invalide une entrée spécifique. */
export function invalidateDetail(id: string): void {
    cache.delete(id);
}

/** Vide entièrement le cache. */
export function clearDetailsCache(): void {
    cache.clear();
}

/** Statistiques du cache (debug). */
export function getDetailsCacheStats(): { size: number; maxEntries: number } {
    return { size: cache.size, maxEntries: MAX_ENTRIES };
}
