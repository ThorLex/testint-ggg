/**
 * Client API Axios pour Navipad
 * 
 * Ce fichier configure l'instance Axios avec les intercepteurs
 * pour gérer l'authentification, les erreurs, et les headers.
 * 
 * @module services/api/client
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { ApiRoutes } from './routes';

/**
 * Instance Axios configurée pour l'API Navipad
 */
export const apiClient: AxiosInstance = axios.create({
    baseURL: ApiRoutes.BASE_URL,
    timeout: 30000, // 30 secondes
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// ============================================================================
// Intercepteur de Requête
// ============================================================================

/**
 * Intercepteur pour ajouter les headers d'authentification et la clé API
 */
apiClient.interceptors.request.use(
    async (config) => {
        // Ajouter la clé API à toutes les requêtes
        if (config.headers) {
            config.headers['x-api-key'] = ApiRoutes.API_KEY;
        }

        // Ajouter le token d'authentification si disponible
        const token = await AsyncStorage.getItem('@navipad:auth_token');
        if (token && config.headers) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Logger la requête en mode développement
        if (__DEV__) {
            console.log('🚀 API Request:', {
                method: config.method?.toUpperCase(),
                url: config.url,
                params: config.params,
                data: config.data,
            });
        }

        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// ============================================================================
// Intercepteur de Réponse
// ============================================================================

/**
 * Intercepteur pour gérer les réponses et les erreurs
 */
apiClient.interceptors.response.use(
    (response) => {
        // Logger la réponse en mode développement
        if (__DEV__) {
            console.log('✅ API Response:', {
                status: response.status,
                url: response.config.url,
                data: response.data,
            });
        }

        return response;
    },
    async (error: AxiosError) => {
        const status = error.response?.status;
        const responseData = error.response?.data as any;

        // Logger l'erreur
        console.error('❌ API Error:', {
            status,
            url: error.config?.url,
            message: error.message,
            data: responseData,
        });

        // Fonction pour afficher un toast d'erreur formaté
        const showErrorToast = (title: string, message: string) => {
            Toast.show({
                type: 'error',
                text1: title,
                text2: message,
                position: 'top',
                topOffset: 60,
                visibilityTime: 4000,
            });
        };

        // Gérer les erreurs réseau (pas de réponse du serveur)
        if (!error.response) {
            showErrorToast('Erreur de connexion', 'Veuillez vérifier votre connexion internet et réessayer.');
            return Promise.reject({
                code: 'NETWORK_ERROR',
                message: 'Connection failed. Check your internet connection.',
                details: error.message,
            });
        }

        // Gérer les erreurs d'authentification (401)
        if (status === 401) {
            // Supprimer le token d'authentification
            await AsyncStorage.removeItem('@navipad:auth_token');
            
            // Tenter de rafraîchir le token si disponible
            const refreshToken = await AsyncStorage.getItem('@navipad:refresh_token');

            if (refreshToken) {
                try {
                    // Appeler l'endpoint de rafraîchissement
                    const response = await axios.post(
                        `${ApiRoutes.BASE_URL}${ApiRoutes.REFRESH_TOKEN}`,
                        { refreshToken },
                        {
                            headers: {
                                'x-api-key': ApiRoutes.API_KEY,
                            },
                        }
                    );

                    const { accessToken } = response.data;

                    // Sauvegarder le nouveau token
                    await AsyncStorage.setItem('@navipad:auth_token', accessToken);

                    // Réessayer la requête originale avec le nouveau token
                    if (error.config) {
                        error.config.headers['Authorization'] = `Bearer ${accessToken}`;
                        return apiClient.request(error.config);
                    }
                } catch (refreshError) {
                    // Échec du rafraîchissement, déconnecter l'utilisateur
                    await AsyncStorage.removeItem('@navipad:refresh_token');
                    console.error('❌ Token refresh failed, user logged out');
                    showErrorToast('Session expirée', 'Veuillez vous reconnecter pour continuer.');
                }
            } else {
                showErrorToast('Session expirée', 'Veuillez vous reconnecter pour continuer.');
            }

            // Retourner une erreur d'authentification formatée
            return Promise.reject({
                code: 'UNAUTHORIZED',
                message: responseData?.error !== undefined ? responseData.error : 
                         responseData?.message !== undefined ? responseData.message : 
                         'Authentication required. Please log in again.',
                details: responseData?.details !== undefined ? responseData.details : responseData,
                status: 401,
            });
        }

        // Gérer les erreurs 400 (Bad Request)
        if (status === 400) {
            showErrorToast('Requête invalide', 'Veuillez vérifier les informations fournies.');
            return Promise.reject({
                code: 'BAD_REQUEST',
                message: responseData?.error !== undefined ? responseData.error :
                         responseData?.message !== undefined ? responseData.message :
                         'Invalid request. Please check your input.',
                details: responseData?.details !== undefined ? responseData.details : responseData,
                status: 400,
            });
        }

        // Gérer les erreurs 403 (Forbidden - API key required)
        if (status === 403) {
            showErrorToast('Accès refusé', 'Vous n\'avez pas la permission d\'effectuer cette action.');
            return Promise.reject({
                code: 'FORBIDDEN',
                message: responseData?.error !== undefined ? responseData.error :
                         responseData?.message !== undefined ? responseData.message :
                         'Access forbidden. API key may be invalid or missing.',
                details: responseData?.details !== undefined ? responseData.details : responseData,
                status: 403,
            });
        }

        // Gérer les erreurs 404 (Not Found)
        if (status === 404) {
            showErrorToast('Introuvable', 'La ressource demandée n\'existe pas.');
            return Promise.reject({
                code: 'NOT_FOUND',
                message: responseData?.error !== undefined ? responseData.error :
                         responseData?.message !== undefined ? responseData.message :
                         'Resource not found.',
                details: responseData?.details !== undefined ? responseData.details : responseData,
                status: 404,
            });
        }

        // Gérer les erreurs serveur (500+)
        if (status >= 500) {
            showErrorToast('Erreur serveur', 'Un problème est survenu. Veuillez réessayer plus tard.');
            return Promise.reject({
                code: 'SERVER_ERROR',
                message: responseData?.error !== undefined ? responseData.error :
                         responseData?.message !== undefined ? responseData.message :
                         'Server error. Please try again later.',
                details: responseData?.details !== undefined ? responseData.details : responseData,
                status,
            });
        }

        // Retourner l'erreur formatée pour les autres codes d'erreur
        showErrorToast('Erreur', 'Une erreur inattendue est survenue.');
        return Promise.reject({
            code: responseData?.error || `HTTP_${status ?? 'UNKNOWN'}`,
            message: responseData?.error !== undefined ? responseData.error :
                     responseData?.message !== undefined ? responseData.message :
                     error.message,
            details: responseData?.details !== undefined ? responseData.details : responseData,
            status: status ?? 0,
        });
    }
);

// ============================================================================
// Fonctions Utilitaires
// ============================================================================

/**
 * Effectue une requête GET
 * 
 * @param url - URL de l'endpoint
 * @param config - Configuration Axios optionnelle
 * @returns Promesse avec les données de la réponse
 */
export async function get<T = any>(
    url: string,
    config?: AxiosRequestConfig
): Promise<T> {
    const response = await apiClient.get<T>(url, config);
    return response.data;
}

/**
 * Effectue une requête POST
 * 
 * @param url - URL de l'endpoint
 * @param data - Données à envoyer
 * @param config - Configuration Axios optionnelle
 * @returns Promesse avec les données de la réponse
 */
export async function post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
): Promise<T> {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
}

/**
 * Effectue une requête PUT
 * 
 * @param url - URL de l'endpoint
 * @param data - Données à envoyer
 * @param config - Configuration Axios optionnelle
 * @returns Promesse avec les données de la réponse
 */
export async function put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
): Promise<T> {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
}

/**
 * Effectue une requête DELETE
 * 
 * @param url - URL de l'endpoint
 * @param config - Configuration Axios optionnelle
 * @returns Promesse avec les données de la réponse
 */
export async function del<T = any>(
    url: string,
    config?: AxiosRequestConfig
): Promise<T> {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
}

/**
 * Effectue une requête DELETE (alias de del)
 * 
 * @param url - URL de l'endpoint
 * @param config - Configuration Axios optionnelle
 * @returns Promesse avec les données de la réponse
 */
export async function deleteRequest<T = any>(
    url: string,
    config?: AxiosRequestConfig
): Promise<T> {
    return del<T>(url, config);
}

/**
 * Effectue une requête PATCH
 * 
 * @param url - URL de l'endpoint
 * @param data - Données à envoyer
 * @param config - Configuration Axios optionnelle
 * @returns Promesse avec les données de la réponse
 */
export async function patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
): Promise<T> {
    const response = await apiClient.patch<T>(url, data, config);
    return response.data;
}
