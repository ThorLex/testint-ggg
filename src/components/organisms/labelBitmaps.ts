/**
 * Cache mémoire des bitmaps de labels.
 *
 * buildLabelKeyById  → clé basée sur l'ID (préféré, évite les collisions de noms)
 * buildLabelKey      → clé basée sur le nom (compatibilité segments)
 * buildSegmentKey    → clé unique par segment de route
 * getCachedBitmap    → lecture synchrone (null si absent)
 * setCachedBitmap    → écriture async
 * invalidateBitmap   → supprime une entrée du cache (ex: nom changé)
 *
 * @module components/organisms/labelBitmaps
 */

const bitmapCache = new Map<string, string>();

/** Clé basée sur l'ID d'amodiataire — évite les collisions quand deux amodiataires
 *  ont le même nom. C'est la clé préférée pour les bâtiments. */
export function buildLabelKeyById(id: string, isPriority: boolean): string {
    return `bid:${isPriority ? '1' : '0'}:${id}`;
}

/** Clé basée sur le nom — conservée pour les segments et la rétrocompatibilité. */
export function buildLabelKey(name: string, isPriority: boolean): string {
    return `b:${isPriority ? '1' : '0'}:${name}`;
}

export function buildSegmentKey(name: string, color: string): string {
    return `s:${color}:${name}`;
}

export function getCachedBitmap(key: string): string | null {
    return bitmapCache.get(key) ?? null;
}

export async function setCachedBitmap(key: string, dataUri: string): Promise<void> {
    bitmapCache.set(key, dataUri);
}

/** Clé unique pour un label de route/allée — basée sur l'ID. */
export function buildRouteKey(id: string): string {
    return `route:${id}`;
}

/** Supprime un bitmap du cache (permet la régénération si le nom a changé). */
export function invalidateBitmap(key: string): void {
    bitmapCache.delete(key);
}
