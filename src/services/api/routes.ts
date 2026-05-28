/**
 * Configuration des routes API pour Navipad
 * 
 * Ce fichier contient toutes les URLs des endpoints API utilisées dans l'application.
 * Structure basée sur la documentation API_ROUTES_DOCUMENTATION.md
 * 
 * @module services/api/routes
 */

/**
 * Configuration des routes API Navipad
 */
export class ApiRoutes {
    // Constructeur privé pour empêcher l'instanciation
    private constructor() { }

    // ============================================================================
    // URLs de base
    // ============================================================================

    /**
     * URL de base de l'API backend
     */
    static readonly BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ||
        'https://navipad-superbase.vercel.app';

    /**
     * Clé API Backend (requise pour toutes les requêtes)
     */
    static readonly API_KEY = process.env.EXPO_PUBLIC_API_KEY ||
        '88abf96eead6f01f632b98a6315f64a8c09d084b1ba43917ca1d4591581cd95d';

    /**
     * Clé API Google Maps
     */
    static readonly GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
        'AIzaSyCRyntmD7dGu3X8j4FPMmfXXNMeTrrmDGY';

    // ============================================================================
    // Endpoints Publics - Amodiataires
    // ============================================================================

    /**
     * Liste de tous les amodiataires
     * GET /api/mobile/public/amodiataires
     * Query params: limit, offset, search
     */
    static readonly AMODIATAIRES = '/api/mobile/public/amodiataires';

    /**
     * Détails d'un amodiataire par ID
     * GET /api/mobile/public/amodiataires/:id
     */
    static readonly AMODIATAIRE_DETAILS = '/api/mobile/public/amodiataires/:id';

    /**
     * Recherche d'amodiataires à proximité
     * GET /api/mobile/public/amodiataires/nearby
     * Query params: lat, lng, radius
     */
    static readonly AMODIATAIRES_NEARBY = '/api/mobile/public/amodiataires/nearby';

    /**
     * Recherche d'amodiataires par texte
     * GET /api/mobile/public/amodiataires
     * Query params: search
     */
    static readonly AMODIATAIRES_SEARCH = '/api/mobile/public/amodiataires';

    /**
     * Annonces d'un amodiataire
     * GET /api/mobile/public/amodiataires/:id/announcements
     * Query params: limit, offset, category
     */
    static readonly AMODIATAIRE_ANNOUNCEMENTS = '/api/mobile/public/amodiataires/:id/announcements';

    /**
     * Médias d'un amodiataire
     * GET /api/mobile/public/amodiataires/:id/media
     * Query params: type, limit, offset
     */
    static readonly AMODIATAIRE_MEDIA = '/api/mobile/public/amodiataires/:id/media';

    // ============================================================================
    // Endpoints Authentifiés - Profil
    // ============================================================================

    /**
     * Profil de l'amodiataire authentifié
     * GET /api/mobile/profile
     * PUT /api/mobile/profile
     */
    static readonly PROFILE = '/api/mobile/profile';

    // ============================================================================
    // Endpoints Authentifiés - Médias
    // ============================================================================

    /**
     * Gestion des médias
     * GET /api/mobile/media - Liste des médias
     * POST /api/mobile/media - Upload d'un média
     */
    static readonly MEDIA = '/api/mobile/media';

    /**
     * Suppression d'un média spécifique
     * DELETE /api/mobile/media/:mediaId
     */
    static readonly MEDIA_DELETE = '/api/mobile/media/:mediaId';

    /**
     * Soumission des médias pour validation
     * POST /api/mobile/media/submit-validation
     */
    static readonly MEDIA_SUBMIT_VALIDATION = '/api/mobile/media/submit-validation';

    // ============================================================================
    // Endpoints Authentifiés - Annonces
    // ============================================================================

    /**
     * Gestion des annonces
     * GET /api/mobile/announcements - Liste des annonces
     * POST /api/mobile/announcements - Créer une annonce
     */
    static readonly ANNOUNCEMENTS = '/api/mobile/announcements';

    // ============================================================================
    // Endpoints Géolocalisation
    // ============================================================================

    /**
     * Endpoint pour la zone de délimitation
     */
    static readonly DELIMITATION = '/api/geolocation/zone-bounds';

    // ============================================================================
    // Endpoints Authentification
    // ============================================================================

    /**
     * Endpoint de connexion
     */
    static readonly LOGIN = '/api/auth/login';

    /**
     * Endpoint de déconnexion
     */
    static readonly LOGOUT = '/api/auth/logout';

    /**
     * Endpoint de rafraîchissement de token
     */
    static readonly REFRESH_TOKEN = '/api/auth/refresh';

    // ============================================================================
    // Endpoints Carte Publics
    // ============================================================================

    /**
     * Toutes les données de la carte
     */
    static readonly MAP_DATA = '/api/public/map/all';

    // ============================================================================
    // Endpoints Navigation History
    // ============================================================================

    /**
     * Enregistrer un historique de navigation
     * POST /api/mobile/navigation/history
     */
    static readonly NAVIGATION_HISTORY = '/api/mobile/navigation/history';

    /**
     * Marquer un itinéraire comme terminé
     * PUT /api/mobile/navigation/history/:id/complete
     */
    static readonly NAVIGATION_HISTORY_COMPLETE = '/api/mobile/navigation/history/:id/complete';

    /**
     * Récupérer l'historique d'un appareil
     * GET /api/mobile/navigation/history/:deviceId
     */
    static readonly NAVIGATION_HISTORY_DEVICE = '/api/mobile/navigation/history/:deviceId';

    // ============================================================================
    // Endpoints Google Services
    // ============================================================================

    /**
     * API Google Directions
     */
    static readonly GOOGLE_DIRECTIONS = 'https://maps.googleapis.com/maps/api/directions/json';

    /**
     * API Google Geocoding
     */
    static readonly GOOGLE_GEOCODING = 'https://maps.googleapis.com/maps/api/geocode/json';

    /**
     * API Google Places
     */
    static readonly GOOGLE_PLACES = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

    // ============================================================================
    // Méthodes Utilitaires
    // ============================================================================

    /**
     * Construit l'URL complète pour un endpoint
     * 
     * @param endpoint - Le chemin de l'endpoint
     * @param queryParams - Paramètres de requête optionnels
     * @returns URL complète
     */
    static getFullUrl(endpoint: string, queryParams?: Record<string, any>): string {
        const params = queryParams ? this.buildQueryParams(queryParams) : '';
        return `${this.BASE_URL}${endpoint}${params}`;
    }

    /**
     * Construit une chaîne de paramètres de requête
     * 
     * @param params - Objet de paramètres
     * @returns Chaîne de requête formatée
     */
    static buildQueryParams(params: Record<string, any>): string {
        if (!params || Object.keys(params).length === 0) return '';

        const queryString = Object.entries(params)
            .filter(([_, value]) => value != null)
            .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
            .join('&');

        return queryString ? `?${queryString}` : '';
    }

    /**
     * Obtient l'URL des détails d'un amodiataire
     * 
     * @param id - ID de l'amodiataire
     * @returns URL complète
     */
    static getAmodiataireDetailsUrl(id: string): string {
        const endpoint = this.AMODIATAIRE_DETAILS.replace(':id', id);
        return this.getFullUrl(endpoint);
    }

    /**
     * Obtient l'URL des annonces d'un amodiataire
     * 
     * @param id - ID de l'amodiataire
     * @param params - Paramètres de requête optionnels
     * @returns URL complète
     */
    static getAmodiataireAnnouncementsUrl(id: string, params?: Record<string, any>): string {
        const endpoint = this.AMODIATAIRE_ANNOUNCEMENTS.replace(':id', id);
        return this.getFullUrl(endpoint, params);
    }

    /**
     * Obtient l'URL des médias d'un amodiataire
     * 
     * @param id - ID de l'amodiataire
     * @param params - Paramètres de requête optionnels
     * @returns URL complète
     */
    static getAmodiataireMediaUrl(id: string, params?: Record<string, any>): string {
        const endpoint = this.AMODIATAIRE_MEDIA.replace(':id', id);
        return this.getFullUrl(endpoint, params);
    }

    /**
     * Obtient l'URL pour supprimer un média spécifique
     * 
     * @param mediaId - ID du média
     * @returns URL complète
     */
    static getDeleteMediaUrl(mediaId: string): string {
        const endpoint = this.MEDIA_DELETE.replace(':mediaId', mediaId);
        return this.getFullUrl(endpoint);
    }

    /**
     * Obtient l'URL pour rechercher des amodiataires
     * 
     * @param query - Texte de recherche
     * @returns URL complète avec paramètre de recherche
     */
    static getAmodiatairesSearch(query: string): string {
        return this.getFullUrl(this.AMODIATAIRES_SEARCH, { search: query });
    }

    /**
     * Obtient l'URL pour obtenir les coordonnées des amodiataires
     * 
     * @returns URL complète
     */
    static getAmodiatairesCoordinatesUrl(): string {
        return this.getFullUrl(this.AMODIATAIRES);
    }

    /**
     * Obtient l'URL pour marquer un itinéraire comme terminé
     * 
     * @param id - ID de l'historique
     * @returns URL complète
     */
    static getNavigationHistoryCompleteUrl(id: string): string {
        const endpoint = this.NAVIGATION_HISTORY_COMPLETE.replace(':id', id);
        return this.getFullUrl(endpoint);
    }

    /**
     * Obtient l'URL de l'historique d'un appareil
     * 
     * @param deviceId - ID de l'appareil
     * @param params - Paramètres de requête (limit, offset, days)
     * @returns URL complète
     */
    static getNavigationHistoryDeviceUrl(deviceId: string, params?: Record<string, any>): string {
        const endpoint = this.NAVIGATION_HISTORY_DEVICE.replace(':deviceId', deviceId);
        return this.getFullUrl(endpoint, params);
    }
}
