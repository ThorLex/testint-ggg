/**
 * Hook useBuildingsData
 *
 * Récupère les données des bâtiments (amodiataires) avec une stratégie
 * de cache à 3 niveaux pour minimiser les appels réseau :
 *
 *   1. RAM (Map JS)       — retour immédiat si données fraîches en mémoire
 *   2. React Query        — déduplication, revalidation en arrière-plan
 *   3. AsyncStorage       — fallback hors-ligne si le réseau est indisponible
 *
 * @module hooks/useBuildingsData
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { get } from '@/services/api/client';
import { ApiRoutes } from '@/services/api/routes';
import {
    getFromRam,
    setInRam,
    getFromDisk,
    setOnDisk,
} from '@/services/api/buildingsCache';
import { bulkSetFromList } from '@/services/api/amodiataireNamesCache';
import type { AmodiataireListItem } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface BuildingsResponse {
    success: boolean;
    amodiataires: AmodiataireListItem[];
    count: number;
}

// ============================================================================
// Constantes
// ============================================================================

export const BUILDINGS_QUERY_KEY = ['amodiataires-coordinates'] as const;

/** Durée pendant laquelle React Query considère les données comme fraîches (30 min) */
const STALE_TIME_MS = 30 * 60 * 1000;

/** Durée de conservation dans le cache React Query (1h) */
const GC_TIME_MS = 60 * 60 * 1000;

/** Nombre d'amodiataires traités en parallèle lors de la population du cache des noms */
const NAME_CACHE_CHUNK_SIZE = 100;

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook principal pour récupérer les données des bâtiments.
 *
 * @returns Données des amodiataires, état de chargement et erreur éventuelle
 */
export function useBuildingsData() {
    const queryClient = useQueryClient();
    const url = ApiRoutes.getAmodiatairesCoordinatesUrl();

    // ------------------------------------------------------------------
    // Pré-remplissage du cache React Query depuis la RAM ou le disque
    // au premier montage — évite le flash de chargement
    // ------------------------------------------------------------------
    useEffect(() => {
        const prefill = async () => {
            // 1. Vérifier si React Query a déjà des données fraîches
            const existing = queryClient.getQueryData<BuildingsResponse>(BUILDINGS_QUERY_KEY);
            if (existing) return;

            // 2. Essayer la RAM d'abord (synchrone, instantané)
            const ramData = getFromRam(url);
            if (ramData) {
                queryClient.setQueryData(BUILDINGS_QUERY_KEY, ramData);
                console.log('⚡ [useBuildingsData] Données chargées depuis la RAM');
                return;
            }

            // 3. Fallback sur AsyncStorage (asynchrone)
            const diskData = await getFromDisk();
            if (diskData) {
                queryClient.setQueryData(BUILDINGS_QUERY_KEY, diskData);
                // Remettre aussi en RAM pour les prochains accès
                setInRam(url, diskData);
                console.log('💾 [useBuildingsData] Données chargées depuis le disque');
            }
        };

        prefill();
    }, [queryClient, url]);

    // ------------------------------------------------------------------
    // Requête React Query — ne fait un appel réseau que si nécessaire
    // ------------------------------------------------------------------
    const query = useQuery<BuildingsResponse>({
        queryKey: BUILDINGS_QUERY_KEY,
        queryFn: async () => {
            // Vérifier la RAM avant de faire la requête réseau
            const ramData = getFromRam(url);
            if (ramData) {
                console.log('⚡ [useBuildingsData] queryFn — hit RAM, pas d\'appel réseau');
                return ramData;
            }

            console.log('🌐 [useBuildingsData] Appel API bâtiments...');
            const response = await get<BuildingsResponse>(url);

            // Mettre en cache RAM (synchrone)
            setInRam(url, response);

            // Mettre en cache disque (asynchrone, non bloquant)
            setOnDisk(response).catch(() => {});

            // Populer le cache des noms en parallèle par chunks
            const items = response?.amodiataires ?? [];
            if (items.length > 0) {
                const chunks: AmodiataireListItem[][] = [];
                for (let i = 0; i < items.length; i += NAME_CACHE_CHUNK_SIZE) {
                    chunks.push(items.slice(i, i + NAME_CACHE_CHUNK_SIZE));
                }
                await Promise.all(chunks.map((chunk) => {
                    bulkSetFromList(chunk.map((a) => ({ id: a.id, raisonSociale: a.raisonSociale })));
                    return Promise.resolve();
                }));
            }

            console.log(
                `✅ [useBuildingsData] ${items.length} amodiataires mis en cache`
            );

            return response;
        },
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        // Retry limité pour ne pas spammer l'API en cas d'erreur réseau
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    });

    // ------------------------------------------------------------------
    // Extraire le tableau d'amodiataires depuis la réponse
    // ------------------------------------------------------------------
    const amodiataires: AmodiataireListItem[] =
        (query.data as any)?.data?.amodiataires ??
        (query.data as any)?.amodiataires ??
        [];

    return {
        /** Liste des amodiataires avec leurs bâtiments */
        amodiataires,
        /** Réponse brute de l'API */
        rawData: query.data,
        /** true uniquement lors du tout premier chargement (pas de données en cache) */
        isLoading: query.isLoading && !query.data,
        /** true lors d'un re-fetch en arrière-plan */
        isFetching: query.isFetching,
        /** Erreur éventuelle */
        error: query.error,
        /** Forcer un re-fetch (invalide aussi le cache RAM) */
        refetch: query.refetch,
    };
}
