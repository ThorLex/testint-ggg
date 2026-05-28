/**
 * Service de cache en mémoire RAM pour les données des bâtiments
 *
 * Stratégie à 3 niveaux :
 *   1. RAM (Map JS)       — lecture instantanée, 0 I/O
 *   2. React Query        — déduplication des requêtes, revalidation en arrière-plan
 *   3. AsyncStorage       — persistance entre sessions (fallback hors-ligne)
 *
 * @module services/api/buildingsCache
 */

import { getItem, setItem, removeItem, StorageKeys } from '@/services/storage';
import type { AmodiataireListItem } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface BuildingsCacheEntry {
    data: { success: boolean; amodiataires: AmodiataireListItem[]; count: number };
    /** Timestamp Unix (ms) de la mise en cache */
    cachedAt: number;
}

// ============================================================================
// Configuration
// ============================================================================

/** Durée de validité du cache RAM et AsyncStorage (30 minutes) */
const RAM_CACHE_TTL_MS = 30 * 60 * 1000;

/** Durée de validité du cache AsyncStorage (fallback hors-ligne : 24h) */
const DISK_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// Cache RAM — Map JS (singleton, vit pendant toute la session)
// ============================================================================

/**
 * Stockage RAM : clé = URL de la requête, valeur = entrée de cache
 * Utilise une Map pour O(1) en lecture/écriture.
 */
const ramCache = new Map<string, BuildingsCacheEntry>();

// ============================================================================
// API publique
// ============================================================================

/**
 * Lit les données depuis le cache RAM.
 * Retourne null si absent ou expiré.
 */
export function getFromRam(url: string): BuildingsCacheEntry['data'] | null {
    const entry = ramCache.get(url);
    if (!entry) return null;

    const age = Date.now() - entry.cachedAt;
    if (age > RAM_CACHE_TTL_MS) {
        ramCache.delete(url);
        return null;
    }

    return entry.data;
}

/**
 * Écrit les données dans le cache RAM.
 */
export function setInRam(
    url: string,
    data: BuildingsCacheEntry['data']
): void {
    ramCache.set(url, { data, cachedAt: Date.now() });
}

/**
 * Lit les données depuis AsyncStorage (fallback hors-ligne).
 * Retourne null si absent ou expiré.
 */
export async function getFromDisk(): Promise<BuildingsCacheEntry['data'] | null> {
    try {
        const entry = await getItem<BuildingsCacheEntry>(StorageKeys.AMODIATAIRES_CACHE);
        if (!entry) return null;

        const age = Date.now() - entry.cachedAt;
        if (age > DISK_CACHE_TTL_MS) {
            await removeItem(StorageKeys.AMODIATAIRES_CACHE);
            return null;
        }

        return entry.data;
    } catch {
        return null;
    }
}

/**
 * Écrit les données dans AsyncStorage (opération asynchrone non bloquante).
 */
export async function setOnDisk(
    data: BuildingsCacheEntry['data']
): Promise<void> {
    try {
        const entry: BuildingsCacheEntry = { data, cachedAt: Date.now() };
        await setItem(StorageKeys.AMODIATAIRES_CACHE, entry);
    } catch (err) {
        // Ne pas bloquer l'UI si le disque est plein ou indisponible
        console.warn('⚠️ [buildingsCache] Impossible d\'écrire sur disque:', err);
    }
}

/**
 * Invalide le cache RAM et disque (forcer un re-fetch).
 */
export async function invalidateCache(): Promise<void> {
    ramCache.clear();
    await removeItem(StorageKeys.AMODIATAIRES_CACHE);
    console.log('🗑️ [buildingsCache] Cache invalidé');
}

/**
 * Retourne des statistiques sur le cache RAM (debug).
 */
export function getRamStats(): { entries: number; keys: string[] } {
    return {
        entries: ramCache.size,
        keys: Array.from(ramCache.keys()),
    };
}
