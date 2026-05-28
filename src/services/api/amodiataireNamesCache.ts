/**
 * Cache canonique des noms d'amodiataires.
 *
 * Source de vérité unique pour les noms affichés dans le BitmapLabelFactory
 * ET dans l'AmodiataireDetailsSheet, évitant toute divergence.
 *
 * Priorité : detail (endpoint /:id) > list (endpoint /amodiataires)
 *
 * @module services/api/amodiataireNamesCache
 */

type NameSource = 'list' | 'detail';

interface NameEntry {
    name: string;
    source: NameSource;
}

const cache = new Map<string, NameEntry>();

/** Enregistre un nom depuis l'endpoint liste (priorité basse). */
export function setNameFromList(id: string, name: string): void {
    if (!cache.has(id)) {
        cache.set(id, { name, source: 'list' });
    }
}

/** Enregistre un nom depuis l'endpoint détail (priorité haute, écrase la liste). */
export function setNameFromDetail(id: string, name: string): void {
    cache.set(id, { name, source: 'detail' });
}

/** Retourne le nom canonique pour un ID, ou null si inconnu. */
export function getCanonicalName(id: string): string | null {
    return cache.get(id)?.name ?? null;
}

/** Popule le cache depuis un tableau d'items de liste. Opération O(n). */
export function bulkSetFromList(items: Array<{ id: string; raisonSociale: string }>): void {
    for (const item of items) {
        setNameFromList(item.id, item.raisonSociale);
    }
}

/** Vide le cache (invalidation). */
export function clearNamesCache(): void {
    cache.clear();
}
