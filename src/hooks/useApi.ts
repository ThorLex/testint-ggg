/**
 * Hooks API pour Navipad
 * 
 * Ce fichier contient les hooks React Query pour charger les données
 * depuis l'API backend.
 * 
 * @module hooks/useApi
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { get, post, put, deleteRequest } from '@/services/api/client';
import { ApiRoutes } from '@/services/api/routes';
import { setNameFromDetail } from '@/services/api/amodiataireNamesCache';
import { getCachedDetail, setCachedDetail } from '@/services/api/amodiataireDetailsCache';
import type {
    AmodiatairMinimal,
    AmodiatairCoordinates,
    AmodiatairDetails,
    ZoneBoundsResponse,
    MapData,
    AmodiatairSearchParams,
    LoginResponse,
    MediaType,
    UploadMediaResponse,
    SearchParams,
    AmodiatairesListResponse,
    AmodiataireDetailResponse,
    NearbyParams,
    NearbySearchResponse,
    AnnouncementQueryParams,
    AnnouncementListResponse,
    MediaQueryParams,
    MediaListResponse,
    ProfileResponse,
    ProfileUpdateRequest,
    ProfileUpdateResponse,
    MediaDeleteResponse,
    MediaSubmitValidationResponse,
    AnnouncementCreateRequest,
    AnnouncementCreateResponse,
} from '@/types';

// ============================================================================
// Hooks Amodiataires
// ============================================================================

/**
 * Hook pour charger la liste des amodiataires
 * Supports pagination and search parameters
 * 
 * @param params - Optional search parameters (limit, offset, search)
 * @returns Query result with amodiataires list
 */
export function useAmodiataires(params?: SearchParams) {
    return useQuery({
        queryKey: ['amodiataires', 'list', params],
        queryFn: async () => {
            try {
                const response = await get<AmodiatairesListResponse>(
                    ApiRoutes.getFullUrl(ApiRoutes.AMODIATAIRES, params)
                );
                
                // Filter out mock data
                const amodiataires = response.amodiataires || [];
                const filteredAmodiataires = amodiataires.filter((a: any) => {
                    const name = (a.raisonSociale || a.profile?.username || a.nom || '').toLowerCase();
                    const isMock = name.includes('test') || 
                                  name.includes('mock') || 
                                  name.includes('maintenance portuaire') || 
                                  name.includes('temporaire') ||
                                  a.id?.toString().includes('mock');
                    return !isMock;
                });
                
                return {
                    ...response,
                    amodiataires: filteredAmodiataires,
                    count: filteredAmodiataires.length
                };
            } catch (error) {
                console.error('❌ [useAmodiataires] Erreur API:', error);
                throw error;
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook pour charger les détails d'un amodiataire
 * 
 * @param id - ID of the amodiataire
 * @returns Query result with amodiataire details
 */
export function useAmodiataireDetail(id: string) {
    return useQuery({
        queryKey: ['amodiataire', 'detail', id],
        queryFn: async () => {
            // Vérifier le cache dédié avant de faire une requête réseau
            const cached = getCachedDetail(id);
            if (cached) {
                console.log('⚡ [useAmodiataireDetail] Cache hit pour ID:', id);
                return cached;
            }

            const response = await get<AmodiataireDetailResponse>(
                ApiRoutes.getAmodiataireDetailsUrl(id)
            );

            // Mettre en cache dédié
            setCachedDetail(id, response);

            // Mettre à jour le cache des noms avec la source authoritative (lot.raisonSociale)
            const canonicalName = response?.amodiataire?.lot?.raisonSociale;
            if (canonicalName && id) {
                setNameFromDetail(id, canonicalName);
            }

            return response;
        },
        enabled: !!id,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

// ============================================================================
// Hooks Services (Clone of Amodiataires)
// ============================================================================

/**
 * Hook pour charger la liste des services (Amodiataires de type 'service')
 */
export function useServices(params?: SearchParams) {
    const serviceParams = { ...params, type: 'service' };
    
    return useQuery({
        queryKey: ['services', 'list', serviceParams],
        queryFn: async () => {
            try {
                // On appelle l'API avec le filtre type=service
                const response = await get<AmodiatairesListResponse>(
                    ApiRoutes.getFullUrl(ApiRoutes.AMODIATAIRES, serviceParams)
                );
                
                // Filtrage côté client par sécurité pour s'assurer qu'on n'a que des types 'service'
                const amodiataires = response.amodiataires || [];
                const serviceItems = amodiataires.filter((a: any) => {
                    if (a.type !== 'service') return false;
                    
                    const name = (a.raisonSociale || a.profile?.username || a.nom || '').toLowerCase();
                    const isMock = name.includes('test') || 
                                  name.includes('mock') || 
                                  name.includes('maintenance portuaire') || 
                                  name.includes('temporaire') ||
                                  a.id?.toString().includes('mock');
                    
                    return !isMock;
                });
                
                return {
                    ...response,
                    amodiataires: serviceItems,
                    count: serviceItems.length
                };
            } catch (error) {
                console.error('❌ [useServices] Erreur API:', error);
                throw error;
            }
        },
        staleTime: 5 * 60 * 1000, 
    });
}

/**
 * Hook pour charger les détails d'un service
 */
export function useServiceDetail(id: string) {
    return useQuery({
        queryKey: ['service', 'detail', id],
        queryFn: async () => {
            const response = await get<AmodiataireDetailResponse>(
                ApiRoutes.getAmodiataireDetailsUrl(id)
            );
            console.log('📡 [useServiceDetail] ID:', id);
            console.log('📡 [useServiceDetail] Response Data:', JSON.stringify(response));
            if (response?.amodiataire?.id?.includes('mock')) {
                console.warn('⚠️ [useServiceDetail] DATA IS MOCKED!');
            }
            return response;
        },
        enabled: !!id,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

/**
 * Hook pour rechercher des amodiataires à proximité
 * 
 * @param params - Nearby search parameters (lat, lng, radius)
 * @returns Query result with nearby amodiataires
 */
export function useNearbyAmodiataires(params: NearbyParams) {
    return useQuery({
        queryKey: ['amodiataires', 'nearby', params],
        queryFn: () => get<NearbySearchResponse>(
            ApiRoutes.getFullUrl(ApiRoutes.AMODIATAIRES_NEARBY, params)
        ),
        enabled: !!params.lat && !!params.lng,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Hook pour charger les annonces d'un amodiataire
 * 
 * @param id - ID of the amodiataire
 * @param params - Optional query parameters (limit, offset, category)
 * @returns Query result with amodiataire announcements
 */
export function useAmodiataireAnnouncements(
    id: string,
    params?: AnnouncementQueryParams
) {
    return useQuery({
        queryKey: ['amodiataire', 'announcements', id, params],
        queryFn: () => get<AnnouncementListResponse>(
            ApiRoutes.getAmodiataireAnnouncementsUrl(id, params)
        ),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook pour charger les médias d'un amodiataire
 * 
 * @param id - ID of the amodiataire
 * @param params - Optional query parameters (limit, offset, type)
 * @returns Query result with amodiataire media
 */
export function useAmodiataireMedia(
    id: string,
    params?: MediaQueryParams
) {
    return useQuery({
        queryKey: ['amodiataire', 'media', id, params],
        queryFn: () => get<MediaListResponse>(
            ApiRoutes.getAmodiataireMediaUrl(id, params)
        ),
        enabled: !!id,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

// ============================================================================
// Hooks Carte
// ============================================================================

/**
 * Hook pour charger les données de la carte
 * Includes routes and announcements with validation
 */
export function useMapData(options?: UseQueryOptions<MapData>) {
    return useQuery({
        queryKey: ['map', 'data'],
        queryFn: async () => {
            const response = await get<{ success: boolean; data: MapData }>(ApiRoutes.getFullUrl(ApiRoutes.MAP_DATA));
            
            // Extract data from response
            const data = response.data || response;
            
            // Transform and validate data
            // Ensure routes and announcements are arrays, default to empty arrays if missing
            const routes = Array.isArray(data.routes) ? data.routes : [];
            const announcements = Array.isArray(data.announcements) ? data.announcements : [];
            
            // Log data for debugging
            console.log('📍 Map data loaded:', {
                buildings: data.buildings?.length || 0,
                amodiatairBuildings: data.amodiatairBuildings?.length || 0,
                routes: routes.length,
                announcements: announcements.length,
            });
            
            // Filter out mock announcements
            const filteredAnnouncements = announcements.filter((a: any) => {
                const title = (a.title || '').toLowerCase();
                const content = (a.content || '').toLowerCase();
                const isMock = title.includes('test') || title.includes('mock') || title.includes('maintenance portuaire') ||
                               content.includes('test') || content.includes('mock') || content.includes('maintenance portuaire') ||
                               a.id?.toString().includes('mock');
                return !isMock;
            });

            return {
                buildings: data.buildings || [],
                amodiatairBuildings: data.amodiatairBuildings || [],
                routes,
                announcements: filteredAnnouncements,
                zoneBounds: data.zoneBounds,
            };
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
        ...options,
    });
}

/**
 * Hook pour charger la zone de délimitation
 */
export function useZoneBounds(options?: UseQueryOptions<ZoneBoundsResponse>) {
    return useQuery({
        queryKey: ['zone', 'bounds'],
        queryFn: () => get<ZoneBoundsResponse>(ApiRoutes.getFullUrl(ApiRoutes.DELIMITATION)),
        staleTime: 24 * 60 * 60 * 1000, // 24 heures
        ...options,
    });
}

// ============================================================================
// Hooks Authentification
// ============================================================================

/**
 * Hook pour la connexion
 */
export function useLogin() {
    return useMutation({
        mutationFn: (credentials: { email: string; password: string }) =>
            post<LoginResponse>(ApiRoutes.getFullUrl(ApiRoutes.LOGIN), credentials),
    });
}

// ============================================================================
// Hooks Profil Authentifié
// ============================================================================

/**
 * Hook pour charger le profil de l'utilisateur authentifié
 * 
 * @returns Query result with authenticated user's profile
 */
export function useProfile() {
    return useQuery({
        queryKey: ['profile', 'me'],
        queryFn: () => get<ProfileResponse>(
            ApiRoutes.getFullUrl(ApiRoutes.PROFILE)
        ),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook pour mettre à jour le profil de l'utilisateur authentifié
 * 
 * @returns Mutation hook for updating profile
 */
export function useUpdateProfile() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (data: ProfileUpdateRequest) =>
            put<ProfileUpdateResponse>(
                ApiRoutes.getFullUrl(ApiRoutes.PROFILE),
                data
            ),
        onSuccess: () => {
            // Invalidate profile cache to trigger refetch
            queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
        },
    });
}

/**
 * Hook pour la déconnexion
 */
export function useLogout() {
    return useMutation({
        mutationFn: () => post(ApiRoutes.getFullUrl(ApiRoutes.LOGOUT)),
    });
}

// ============================================================================
// Hooks Médias
// ============================================================================

/**
 * Hook pour uploader un média (photo, vidéo, document)
 */
export function useUploadMedia() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ type, file }: { type: MediaType; file: any }) => {
            console.log('🔄 Début upload API:', { type, file });

            const formData = new FormData();
            formData.append('type', type);
            
            // Gérer les différents types de fichiers
            if (file.uri) {
                // Fichier depuis ImagePicker ou DocumentPicker
                let fileName = file.name || file.fileName || `${type}_${Date.now()}`;
                let mimeType = file.mimeType || file.type;

                // Déterminer l'extension et le type MIME si manquants
                if (!fileName.includes('.')) {
                    const extension = getDefaultExtension(type);
                    fileName = `${fileName}.${extension}`;
                }

                if (!mimeType) {
                    mimeType = getDefaultMimeType(type);
                }

                console.log('📎 Préparation fichier:', {
                    uri: file.uri,
                    name: fileName,
                    type: mimeType,
                    size: file.size || file.fileSize
                });

                // Validation du type de fichier pour les documents
                if (type === 'document') {
                    const supportedMimeTypes = [
                        'application/pdf',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/vnd.ms-excel',
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'application/vnd.ms-powerpoint',
                        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                        'text/plain',
                        'image/jpeg',
                        'image/png',
                        'image/gif',
                    ];

                    const fileExtension = fileName.split('.').pop()?.toLowerCase();
                    const supportedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'gif'];

                    const mimeTypeValid = supportedMimeTypes.includes(mimeType);
                    const extensionValid = fileExtension && supportedExtensions.includes(fileExtension);

                    if (!mimeTypeValid && !extensionValid) {
                        throw new Error(`Type de fichier non supporté: ${mimeType}. Types acceptés: PDF, Word, Excel, PowerPoint, Texte, Images.`);
                    }
                }

                // Validation de la taille (max 10MB)
                const fileSize = file.size || file.fileSize;
                if (fileSize && fileSize > 10 * 1024 * 1024) {
                    throw new Error('Fichier trop volumineux. Taille maximale: 10 MB.');
                }

                // Créer l'objet fichier pour React Native
                const fileObject = {
                    uri: file.uri,
                    type: mimeType,
                    name: fileName,
                } as any;

                formData.append('file', fileObject);
            } else {
                // Fichier Blob/File standard (web)
                formData.append('file', file);
            }

            // Utiliser fetch directement pour l'upload de fichiers
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const token = await AsyncStorage.getItem('@navipad:auth_token');

            console.log('🌐 Envoi requête upload vers:', ApiRoutes.getFullUrl(ApiRoutes.MEDIA));

            const response = await fetch(ApiRoutes.getFullUrl(ApiRoutes.MEDIA), {
                method: 'POST',
                headers: {
                    'X-API-Key': ApiRoutes.API_KEY,
                    'Authorization': token ? `Bearer ${token}` : '',
                    // Ne pas définir Content-Type, laissez le navigateur le faire pour FormData
                },
                body: formData,
            });

            console.log('📡 Réponse serveur:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                headers: Object.fromEntries(response.headers.entries())
            });

            if (!response.ok) {
                let errorData: string;
                try {
                    errorData = await response.text();
                } catch {
                    errorData = 'Erreur de lecture de la réponse';
                }
                
                console.error('❌ Erreur serveur:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorData
                });
                
                if (response.status === 413) {
                    throw new Error('Fichier trop volumineux pour le serveur (max 10MB)');
                } else if (response.status === 415) {
                    throw new Error('Type de fichier non supporté par le serveur');
                } else if (response.status === 401) {
                    throw new Error('Non autorisé - Veuillez vous reconnecter');
                } else if (response.status === 400) {
                    throw new Error(`Requête invalide: ${errorData}`);
                } else if (response.status === 500) {
                    throw new Error('Erreur interne du serveur - Réessayez plus tard');
                } else {
                    throw new Error(`Upload failed (${response.status}): ${errorData}`);
                }
            }

            let result: UploadMediaResponse;
            try {
                result = await response.json() as UploadMediaResponse;
            } catch (parseError) {
                console.error('❌ Erreur parsing JSON:', parseError);
                throw new Error('Réponse serveur invalide');
            }
            
            console.log('✅ Upload terminé:', result);
            
            return result;
        },
        onSuccess: () => {
            // Invalider la liste des médias après un upload réussi
            queryClient.invalidateQueries({ queryKey: ['media', 'list'] });
        },
    });
}

/**
 * Hook pour lister les médias de l'utilisateur authentifié
 *
 * @param params - Paramètres optionnels (pagination, type)
 * @returns Query result with media list
 */
export function useMediaList(params?: MediaQueryParams) {
    return useQuery({
        queryKey: ['media', 'list', params],
        queryFn: () =>
            get<MediaListResponse>(
                ApiRoutes.getFullUrl(ApiRoutes.MEDIA, params)
            ),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook pour supprimer un média
 *
 * Invalide la liste des médias après succès.
 */
export function useDeleteMedia() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (mediaId: string) =>
            deleteRequest<MediaDeleteResponse>(
                ApiRoutes.getDeleteMediaUrl(mediaId)
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media', 'list'] });
        },
    });
}

/**
 * Hook pour soumettre les médias à la validation
 *
 * Invalide les caches ['media', 'list'] et ['profile', 'me'] après succès.
 */
export function useSubmitMediaValidation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () =>
            post<MediaSubmitValidationResponse>(
                ApiRoutes.getFullUrl(ApiRoutes.MEDIA_SUBMIT_VALIDATION)
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media', 'list'] });
            queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
        },
    });
}

// ============================================================================
// Hooks Annonces Authentifiées
// ============================================================================

/**
 * Hook pour créer une annonce
 */
export function useCreateAnnouncement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: AnnouncementCreateRequest) =>
            post<AnnouncementCreateResponse>(
                ApiRoutes.getFullUrl(ApiRoutes.ANNOUNCEMENTS),
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements', 'list'] });
        },
    });
}

/**
 * Hook pour lister les annonces de l'utilisateur
 */
export function useAnnouncementsList(params?: AnnouncementQueryParams) {
    return useQuery({
        queryKey: ['announcements', 'list', params],
        queryFn: () =>
            get<AnnouncementListResponse>(
                ApiRoutes.getFullUrl(ApiRoutes.ANNOUNCEMENTS, params)
            ),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// Fonctions utilitaires
function getDefaultMimeType(type: MediaType): string {
    switch (type) {
        case 'photo': return 'image/jpeg';
        case 'video': return 'video/mp4';
        case 'document': return 'application/pdf';
        default: return 'application/octet-stream';
    }
}

function getDefaultExtension(type: MediaType): string {
    switch (type) {
        case 'photo': return 'jpg';
        case 'video': return 'mp4';
        case 'document': return 'pdf';
        default: return 'bin';
    }
}
