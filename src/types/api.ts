/**
 * Types TypeScript pour l'API Navipad
 * 
 * Ce fichier contient toutes les interfaces et types utilisés
 * pour la communication avec le backend Navipad.
 * 
 * @module types/api
 */

// ============================================================================
// Types de base
// ============================================================================

/**
 * Coordonnées géographiques (latitude/longitude)
 */
export interface Coordinates {
    latitude: number;
    longitude: number;
    lat?: number;  // Alias pour compatibilité API
    lng?: number;  // Alias pour compatibilité API
}

/**
 * Zone de délimitation géographique
 */
export interface BoundingBox {
    north: number;
    south: number;
    east: number;
    west: number;
}

/**
 * Coordonnées de polygone pour la zone
 */
export interface PolygonCoordinate {
    lat: number;
    lng: number;
}

// ============================================================================
// Types Amodiataire
// ============================================================================

/**
 * Type de média (photo, vidéo, document)
 */
export type MediaType = 'photo' | 'video' | 'document';

/**
 * Média attaché à un amodiataire
 */
export interface Media {
    type: MediaType;
    url: string;
    thumbnail?: string;
    createdAt?: string;
}

/**
 * Item de média pour la galerie d'upload
 * Utilisé pour afficher les médias uploadés dans la section MediaUploadSection
 */
export interface MediaItem {
    id: string;
    url: string;
    thumbnail?: string;
    uploadedAt: string;
    type: 'photo' | 'video' | 'document';
}

/**
 * Amodiataire minimal (pour la liste et la carte)
 * Utilisé par la route /api/amodiataires-light/minimal
 */
export interface AmodiatairMinimal {
    id: string;
    nom?: string;
    prenom?: string;
    raisonSociale?: string;
    telephone?: string;
    email?: string;
    coordinates?: Coordinates;
}

/**
 * Coordonnées d'amodiataire (pour les marqueurs de carte)
 * Utilisé par la route /api/amodiataires-light/coordinates
 */
export interface AmodiatairCoordinates {
    id: string;
    coordinates: Coordinates;
    nom: string;
    prenom: string;
}

/**
 * Lot/Bâtiment d'un amodiataire
 */
export interface AmodiataireLot {
    id: string;
    nom?: string | null;
    numeroLot: string;
    adresse: string;
    superficie?: number;
    coordinates: Coordinates[] | Coordinates;
    center?: Coordinates;
    description?: string;
}

/**
 * Détails d'un amodiataire avec ses lots/bâtiments
 * Utilisé par la route /api/amodiataires-light/{id}/details
 */
export interface AmodiatairDetails {
    id: string;
    nom?: string;
    prenom?: string;
    telephone?: string;
    telephoneFixe?: string;
    email?: string;
    raisonSociale?: string;
    secteur?: string;
    numeroLot?: string;
    adresseAlphanumérique?: string;
    superficieAmodiee?: number;
    nombreLots?: number;
    center?: Coordinates;
    coordinates?: Coordinates[]; // Array pour les lots multiples
    batiments?: AmodiataireLot[]; // Array des bâtiments avec leurs détails
    adresse?: string;
    ville?: string;
    codePostal?: string;
    pays?: string;
    photos?: string[];
    videos?: string[];
    documents?: string[];
    description?: string;
    statut?: 'actif' | 'inactif' | 'suspendu';
    dateInscription?: string;
    derniereMiseAJour?: string;
    media?: {
        photos?: MediaItem[];
        videos?: MediaItem[];
        documents?: MediaItem[];
    };
}

/**
 * Profil d'amodiataire (authentifié)
 * Utilisé par la route /api/amodiataire/profile
 */
export interface AmodiatairProfile extends AmodiatairDetails {
    // Champs supplémentaires pour le profil authentifié
    preferences?: {
        notifications?: boolean;
        langue?: 'fr' | 'en';
        theme?: 'light' | 'dark' | 'auto';
    };
}

// ============================================================================
// Types Authentification
// ============================================================================

/**
 * Requête de connexion
 */
export interface LoginRequest {
    email: string;
    password: string;
}

/**
 * Réponse de connexion
 */
export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        role: string;
    };
}

/**
 * Requête de rafraîchissement de token
 */
export interface RefreshTokenRequest {
    refreshToken: string;
}

/**
 * Réponse de rafraîchissement de token
 */
export interface RefreshTokenResponse {
    token: string;
    expiresIn: number;
}

// ============================================================================
// Types Carte
// ============================================================================

/**
 * Bâtiment sur la carte
 */
export interface MapBuilding {
    id: string;
    nom: string;
    type: string;
    coordinates: Coordinates;
    adresse?: string;
    description?: string;
}

/**
 * Bâtiment d'amodiataire sur la carte
 */
export interface MapAmodiatairBuilding extends MapBuilding {
    amodiatairId: string;
    amodiatairNom: string;
}

/**
 * Route/Itinéraire sur la carte
 */
export interface MapRoute {
    id: string;
    nom: string;
    points: Coordinates[];
    distance?: number;
    duree?: number;
    type?: 'pieton' | 'voiture' | 'velo';
}

/**
 * Coordinate point in a route with ordering
 */
export interface RouteCoordinate {
    lat: number;
    lng: number;
    order: number;
}

/**
 * Metadata for a route
 */
export interface RouteMetadata {
    roadType: string;
    maxSpeed: number;
    width: number;
    surface: string;
    length?: number;
    estimatedTime?: string;
}

/**
 * Route object from API
 */
export interface Route {
    id: string;
    name: string;
    coordinates: RouteCoordinate[];
    status: 'active' | 'inactive' | 'maintenance';
    metadata: RouteMetadata;
    length?: number;
    estimatedTime?: string;
}

/**
 * Announcement/Notification object from API
 */
export interface Announcement {
    id: string;
    title: string;
    message: string;
    shortMessage: string;
    type: string;
    priority: 'basse' | 'normale' | 'haute';
    status: 'brouillon' | 'publiee' | 'archivee';
    targetAudience: string;
    startDate: string;
    endDate: string | null;
    createdAt: string;
    publishedAt: string | null;
    metadata: {
        imageUrl: string | null;
        attachments: string[];
        contactInfo: string | null;
        actionRequired: boolean;
        actionUrl: string | null;
    };
}

/**
 * Response from /api/public/map/all endpoint
 */
export interface MapAllResponse {
    routes: Route[];
    announcements: Announcement[];
    buildings?: MapBuilding[];
    amodiatairBuildings?: MapAmodiatairBuilding[];
    zoneBounds?: BoundingBox;
}

/**
 * Données complètes de la carte
 */
export interface MapData {
    buildings: MapBuilding[];
    amodiatairBuildings: MapAmodiatairBuilding[];
    routes: Route[];
    announcements: Announcement[];
    zoneBounds?: BoundingBox;
}

// ============================================================================
// Types Google Services
// ============================================================================

/**
 * Requête Google Directions
 */
export interface GoogleDirectionsRequest {
    origin: string | Coordinates;
    destination: string | Coordinates;
    mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
    language?: string;
}

/**
 * Réponse Google Directions (simplifiée)
 */
export interface GoogleDirectionsResponse {
    routes: Array<{
        legs: Array<{
            distance: { text: string; value: number };
            duration: { text: string; value: number };
            steps: Array<{
                distance: { text: string; value: number };
                duration: { text: string; value: number };
                html_instructions: string;
                polyline: { points: string };
            }>;
        }>;
        overview_polyline: { points: string };
    }>;
    status: string;
}

/**
 * Requête Google Geocoding
 */
export interface GoogleGeocodingRequest {
    address?: string;
    latlng?: string;
    language?: string;
}

/**
 * Réponse Google Geocoding (simplifiée)
 */
export interface GoogleGeocodingResponse {
    results: Array<{
        formatted_address: string;
        geometry: {
            location: Coordinates;
            location_type: string;
        };
        place_id: string;
    }>;
    status: string;
}

// ============================================================================
// Types Upload
// ============================================================================

/**
 * Requête d'upload de média
 */
export interface UploadMediaRequest {
    type: MediaType;
    file: File | Blob;
}

/**
 * Réponse d'upload de média
 */
export interface UploadMediaResponse {
    url: string;
    thumbnail?: string;
    type: MediaType;
}

// ============================================================================
// Types Recherche
// ============================================================================

/**
 * Paramètres de recherche d'amodiataires
 */
export interface AmodiatairSearchParams {
    q: string;
    limit?: number;
    offset?: number;
}

/**
 * Résultat de recherche
 */
export interface SearchResult {
    items: AmodiatairMinimal[];
    total: number;
    limit: number;
    offset: number;
}

// ============================================================================
// Types Réponse API
// ============================================================================

/**
 * Réponse API générique avec succès
 */
export interface ApiSuccessResponse<T = any> {
    success: true;
    data: T;
    message?: string;
}

/**
 * Réponse API générique avec erreur
 */
export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
    };
}

/**
 * Réponse API (succès ou erreur)
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// Types Zone de délimitation
// ============================================================================

/**
 * Réponse de la zone de délimitation
 */
export interface ZoneBoundsResponse {
    bounds: BoundingBox;
    center: Coordinates;
    polygonCoordinates?: PolygonCoordinate[];
    pointCount?: number;
    source?: string;
    message?: string;
}

// ============================================================================
// New API Response Interfaces (API Routes Refactoring)
// ============================================================================

/**
 * Response from /api/mobile/public/amodiataires endpoint
 * Lists all amodiataires with summary information
 */
export interface AmodiatairesListResponse {
    success: boolean;
    count: number;
    amodiataires: AmodiataireListItem[];
}

/**
 * Individual amodiataire item in the list response
 */
export interface AmodiataireListItem {
    id: string;
    userId: string;
    raisonSociale: string;
    numeroLot: string;
    adresse: string;
    superficie: number;
    nombreLots: number;
    coordinates: Coordinates[];
    center: Coordinates;
    batiments: Building[];
    profile: ProfileSummary;
    featuredImage?: string;
    stats: {
        totalMedia: number;
        activeAnnouncements: number;
    };
    createdAt: string;
}

/**
 * Building structure for amodiataire
 */
export interface Building {
    id: string;
    nom?: string | null;
    type: string;
    coordinates: Coordinates[];
}

/**
 * Profile summary for list view
 */
export interface ProfileSummary {
    biography?: string;
    phone?: string;
    website?: string;
    socialMedia?: SocialMediaLinks;
    email: string;
    username: string;
    isPublished: boolean;
}

/**
 * Social media links
 */
export interface SocialMediaLinks {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
}

/**
 * Response from /api/mobile/public/amodiataires/:id endpoint
 * Detailed information about a specific amodiataire
 */
export interface AmodiataireDetailResponse {
    success: boolean;
    amodiataire: AmodiataireDetail;
}

/**
 * Detailed amodiataire information
 */
export interface AmodiataireDetail {
    id: string;
    userId: string;
    lot: LotDetail;
    profile: ProfileDetail;
    media: MediaCollection;
    announcements: AnnouncementItem[];
    stats: MediaStats;
    metadata: {
        createdAt: string;
        updatedAt: string;
    };
}

/**
 * Lot detail information
 */
export interface LotDetail {
    numeroLot: string;
    raisonSociale: string;
    adresse: string;
    superficie: number;
    nombreLots: number;
    coordinates: Coordinates[];
    center: Coordinates;
    batiments: Building[];
    source: string;
    isTemporary: boolean;
}

/**
 * Profile detail information
 */
export interface ProfileDetail {
    biography?: string;
    phone?: string;
    website?: string;
    socialMedia?: SocialMediaLinks;
    email: string;
    username: string;
    isPublished: boolean;
    publishedAt?: string;
    validatedAt?: string;
}

/**
 * Media collection organized by type
 */
export interface MediaCollection {
    featured?: MediaDetail;
    images: MediaDetail[];
    videos: MediaDetail[];
    documents: MediaDetail[];
}

/**
 * Detailed media information
 */
export interface MediaDetail {
    id: string;
    url: string;
    thumbnailUrl?: string;
    title?: string;
    description?: string;
    altText?: string;
    fileSize?: number;
    mimeType?: string;
    isFeatured?: boolean;
    displayOrder?: number;
    createdAt: string;
}

/**
 * Media statistics
 */
export interface MediaStats {
    totalImages: number;
    totalVideos: number;
    totalDocuments: number;
    totalMedia: number;
    activeAnnouncements: number;
}

/**
 * Announcement item
 */
export interface AnnouncementItem {
    id: string;
    title: string;
    shortDescription?: string;
    content: string;
    category?: string;
    tags?: string[];
    featuredImage?: string;
    mediaUrls?: string[];
    isPublic: boolean;
    targetAudience?: string;
    startsAt?: string;
    expiresAt?: string;
    viewCount?: number;
    clickCount?: number;
    publishedAt?: string;
    createdAt: string;
}

/**
 * Response from /api/mobile/public/amodiataires/nearby endpoint
 * Search for amodiataires near a location
 */
export interface NearbySearchResponse {
    success: boolean;
    count: number;
    userLocation: Coordinates;
    radius: number;
    amodiataires: NearbyAmodiataire[];
}

/**
 * Amodiataire with distance information
 */
export interface NearbyAmodiataire extends AmodiataireListItem {
    distance: number; // in kilometers
}

/**
 * Response from /api/mobile/profile endpoint
 * Authenticated user's profile
 */
export interface ProfileResponse {
    success: boolean;
    profile: AuthenticatedProfile;
}

/**
 * Authenticated profile with full details
 */
export interface AuthenticatedProfile extends ProfileDetail {
    id: string;
    lot: LotDetail;
    profileStatus: 'draft' | 'pending' | 'approved' | 'rejected';
    profileValidationNotes?: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Request to update profile
 */
export interface ProfileUpdateRequest {
    biography?: string;
    phone?: string;
    website?: string;
    socialMedia?: SocialMediaLinks;
}

/**
 * Response from profile update
 */
export interface ProfileUpdateResponse {
    success: boolean;
    message: string;
    status: 'pending_validation' | 'approved';
}

/**
 * Request to upload media
 */
export interface MediaUploadRequest {
    mediaUrl: string;
    mediaType: 'image' | 'video' | 'document';
    title?: string;
    description?: string;
    isFeatured?: boolean;
}

/**
 * Response from /api/mobile/media POST endpoint
 * Media upload response
 */
export interface MediaUploadResponse {
    success: boolean;
    message: string;
    media: MediaDetail;
}

/**
 * Response from /api/mobile/media GET endpoint
 * List of user's media
 */
export interface MediaListResponse {
    success: boolean;
    media: MediaDetail[];
}

/**
 * Response from /api/mobile/media/:mediaId DELETE endpoint
 * Media deletion response
 */
export interface MediaDeleteResponse {
    success: boolean;
    message: string;
}

/**
 * Response from /api/mobile/media/submit-validation POST endpoint
 * Submit media for validation
 */
export interface MediaSubmitValidationResponse {
    success: boolean;
    message: string;
    count: number;
}

/**
 * Request to create an announcement
 */
export interface AnnouncementCreateRequest {
    title: string;
    content: string;
    shortDescription?: string;
    category?: string;
    tags?: string[];
    mediaUrls?: string[];
    featuredImageUrl?: string;
    startsAt?: string;
    expiresAt?: string;
}

/**
 * Response from /api/mobile/announcements POST endpoint
 * Announcement creation response
 */
export interface AnnouncementCreateResponse {
    success: boolean;
    message: string;
    announcement: {
        id: string;
        title: string;
        status: 'pending_validation';
        createdAt: string;
    };
}

/**
 * Response from /api/mobile/announcements GET endpoint
 * List of user's announcements
 */
export interface AnnouncementListResponse {
    success: boolean;
    announcements: AnnouncementItem[];
}

// ============================================================================
// Query Parameter Interfaces
// ============================================================================

/**
 * Pagination parameters
 */
export interface PaginationParams {
    limit?: number;
    offset?: number;
}

/**
 * Search parameters with pagination
 */
export interface SearchParams extends PaginationParams {
    search?: string;
}

/**
 * Nearby search parameters
 */
export interface NearbyParams {
    lat: number;
    lng: number;
    radius?: number;
}

/**
 * Media query parameters
 */
export interface MediaQueryParams extends PaginationParams {
    type?: 'image' | 'video' | 'document' | 'all';
}

/**
 * Announcement query parameters
 */
export interface AnnouncementQueryParams extends PaginationParams {
    status?: 'draft' | 'active' | 'paused' | 'expired' | 'all';
    category?: string;
}
