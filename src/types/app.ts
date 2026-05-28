/**
 * Types TypeScript pour l'application Navipad
 * 
 * Ce fichier contient les types généraux utilisés dans l'application,
 * notamment pour le thème, la navigation, et les états UI.
 * 
 * @module types/app
 */

// ============================================================================
// Types Thème
// ============================================================================

/**
 * Mode de thème de l'application
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Configuration du thème
 */
export interface ThemeConfig {
    mode: ThemeMode;
    colors: {
        primary: string;
        background: string;
        surface: string;
        text: string;
        textSecondary: string;
        border: string;
        error: string;
        success: string;
        warning: string;
        info: string;
    };
}

// ============================================================================
// Types Langue
// ============================================================================

/**
 * Langues supportées par l'application
 */
export type Language = 'fr' | 'en';

// ============================================================================
// Types Navigation
// ============================================================================

/**
 * Paramètres de navigation pour l'écran de détails d'amodiataire
 */
export interface AmodiatairDetailsParams {
    id: string;
}

/**
 * Paramètres de navigation pour l'écran de recherche
 */
export interface NavigationSearchParams {
    query?: string;
}

// ============================================================================
// Types État UI
// ============================================================================

/**
 * État de chargement générique
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * État de connexion réseau
 */
export interface NetworkState {
    isConnected: boolean;
    isInternetReachable: boolean | null;
    type: string | null;
}

/**
 * État de permission de localisation
 */
export type LocationPermissionStatus =
    | 'granted'
    | 'denied'
    | 'undetermined';

/**
 * État de localisation
 */
export interface LocationState {
    permission: LocationPermissionStatus;
    isEnabled: boolean;
    currentLocation: {
        latitude: number;
        longitude: number;
    } | null;
}

// ============================================================================
// Types Modal
// ============================================================================

/**
 * État de la modale de recherche
 */
export interface SearchModalState {
    isOpen: boolean;
    query: string;
    results: any[];
    isLoading: boolean;
}

/**
 * État de la modale de tutoriel
 */
export interface TutorialModalState {
    isOpen: boolean;
    currentStep: number;
    totalSteps: number;
}

// ============================================================================
// Types Premier Lancement
// ============================================================================

/**
 * État du premier lancement
 */
export interface FirstLaunchState {
    isFirstLaunch: boolean;
    hasSeenTutorial: boolean;
    hasGrantedLocationPermission: boolean;
}

// ============================================================================
// Types Carte
// ============================================================================

/**
 * Types de carte personnalisés pour l'application
 */
export type AppMapType = 'standard' | 'satellite' | 'hybrid' | 'terrain' | 'android_auto' | 'carplay';

/**
 * Région de la carte
 */
export interface MapRegion {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}

/**
 * Marqueur de carte
 */
export interface MapMarker {
    id: string;
    coordinate: {
        latitude: number;
        longitude: number;
    };
    title: string;
    description?: string;
    type?: 'amodiataire' | 'building' | 'custom';
}

/**
 * État de la carte
 */
export interface MapState {
    region: MapRegion;
    markers: MapMarker[];
    selectedMarkerId: string | null;
    isFollowingUser: boolean;
    showsUserLocation: boolean;
}

// ============================================================================
// Types Erreur
// ============================================================================

/**
 * Erreur de l'application
 */
export interface AppError {
    code: string;
    message: string;
    details?: any;
    timestamp: number;
}

/**
 * Type d'erreur
 */
export type ErrorType =
    | 'network'
    | 'permission'
    | 'api'
    | 'validation'
    | 'unknown';

// ============================================================================
// Types Cache
// ============================================================================

/**
 * Métadonnées de cache
 */
export interface CacheMetadata {
    key: string;
    timestamp: number;
    expiresAt: number;
    size?: number;
}

/**
 * Entrée de cache
 */
export interface CacheEntry<T = any> {
    data: T;
    metadata: CacheMetadata;
}

// ============================================================================
// Types Préférences Utilisateur
// ============================================================================

/**
 * Préférences utilisateur
 */
export interface UserPreferences {
    theme: ThemeMode;
    language: Language;
    notifications: {
        enabled: boolean;
        sound: boolean;
        vibration: boolean;
    };
    map: {
        mapType: AppMapType;
        showTraffic: boolean;
        showBuildings: boolean;
        showZoneBounds: boolean;
    };
}
