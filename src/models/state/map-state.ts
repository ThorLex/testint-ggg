/**
 * État de la carte et de la navigation
 * 
 * @description Gestion de l'état de la carte, des amodiataires et de la navigation
 * Converti depuis le modèle Flutter map_state.dart
 */

import { Amodiataire, AmodiataireLocation } from '../amodiataire/amodiataire';

/**
 * États possibles de la carte
 */
export enum MapStatus {
  /** État initial */
  INITIAL = 'initial',
  /** Chargement en cours */
  LOADING = 'loading',
  /** Données chargées */
  LOADED = 'loaded',
  /** Erreur */
  ERROR = 'error',
  /** Permission de localisation refusée */
  LOCATION_PERMISSION_DENIED = 'location_permission_denied',
  /** Service de localisation désactivé */
  LOCATION_SERVICE_DISABLED = 'location_service_disabled',
}

/**
 * État complet de la carte
 */
export interface MapState {
  /** Statut actuel de la carte */
  status: MapStatus;
  /** Liste des amodiataires */
  amodiataires: Amodiataire[];
  /** Amodiataire sélectionné */
  selectedAmodiataire: Amodiataire | null;
  /** Position de l'utilisateur */
  userLocation: AmodiataireLocation | null;
  /** Centre de la carte */
  mapCenter: AmodiataireLocation | null;
  /** Niveau de zoom de la carte */
  mapZoom: number;
  /** Chargement des amodiataires en cours */
  isLoadingAmodiataires: boolean;
  /** Chargement de la localisation en cours */
  isLoadingLocation: boolean;
  /** Afficher la position de l'utilisateur */
  showUserLocation: boolean;
  /** Suivre la position de l'utilisateur */
  followUserLocation: boolean;
  /** Message d'erreur */
  errorMessage: string | null;
  /** Informations de route active */
  currentRoute: RouteInfo | null;
  /** Calcul de route en cours */
  isCalculatingRoute: boolean;
  /** Filtres appliqués */
  filters: MapFilters;
  /** Mode de vue de la carte */
  mapType: MapType;
  /** Rayon de recherche en kilomètres */
  searchRadius: number;
  /** Dernière mise à jour */
  lastUpdate: Date | null;
}

/**
 * Types de carte disponibles
 */
export enum MapType {
  /** Vue normale */
  NORMAL = 'normal',
  /** Vue satellite */
  SATELLITE = 'satellite',
  /** Vue hybride */
  HYBRID = 'hybrid',
  /** Vue terrain */
  TERRAIN = 'terrain',
}

/**
 * Filtres de recherche sur la carte
 */
export interface MapFilters {
  /** Secteurs d'activité */
  activitySectors: string[];
  /** Amodiataires vérifiés uniquement */
  verifiedOnly: boolean;
  /** Note minimum */
  minRating: number;
  /** Rayon de recherche maximum */
  maxDistance: number | null;
  /** Recherche textuelle */
  searchQuery: string;
  /** Ouvert maintenant */
  openNow: boolean;
}

/**
 * Informations de route entre deux points
 */
export interface RouteInfo {
  /** Point de départ */
  origin: AmodiataireLocation;
  /** Point d'arrivée */
  destination: AmodiataireLocation;
  /** Points de la polyligne */
  polylinePoints: AmodiataireLocation[];
  /** Distance formatée */
  distance: string;
  /** Durée formatée */
  duration: string;
  /** Instructions de navigation */
  instructions?: string;
  /** Mode de transport */
  travelMode: TravelMode;
  /** Distance en mètres */
  distanceMeters: number;
  /** Durée en secondes */
  durationSeconds: number;
  /** Péages sur le trajet */
  hasTolls: boolean;
  /** Autoroutes sur le trajet */
  hasHighways: boolean;
}

/**
 * Modes de transport disponibles
 */
export enum TravelMode {
  /** Conduite */
  DRIVING = 'driving',
  /** Marche */
  WALKING = 'walking',
  /** Vélo */
  BICYCLING = 'bicycling',
  /** Transport en commun */
  TRANSIT = 'transit',
}

/**
 * Actions de la carte
 */
export interface MapActions {
  /** Charger les amodiataires */
  loadAmodiataires: (filters?: Partial<MapFilters>) => Promise<void>;
  /** Sélectionner un amodiataire */
  selectAmodiataire: (amodiataire: Amodiataire | null) => void;
  /** Obtenir la position de l'utilisateur */
  getUserLocation: () => Promise<void>;
  /** Centrer la carte sur une position */
  centerMap: (location: AmodiataireLocation, zoom?: number) => void;
  /** Calculer un itinéraire */
  calculateRoute: (destination: AmodiataireLocation, travelMode?: TravelMode) => Promise<void>;
  /** Effacer l'itinéraire */
  clearRoute: () => void;
  /** Appliquer des filtres */
  applyFilters: (filters: Partial<MapFilters>) => void;
  /** Changer le type de carte */
  setMapType: (mapType: MapType) => void;
  /** Activer/désactiver le suivi de position */
  toggleLocationFollow: (follow: boolean) => void;
  /** Rechercher des amodiataires */
  searchAmodiataires: (query: string) => Promise<void>;
  /** Effacer les erreurs */
  clearError: () => void;
  /** Rafraîchir les données */
  refresh: () => Promise<void>;
}

/**
 * État initial de la carte
 */
export const initialMapState: MapState = {
  status: MapStatus.INITIAL,
  amodiataires: [],
  selectedAmodiataire: null,
  userLocation: null,
  mapCenter: null,
  mapZoom: 14.0,
  isLoadingAmodiataires: false,
  isLoadingLocation: false,
  showUserLocation: false,
  followUserLocation: false,
  errorMessage: null,
  currentRoute: null,
  isCalculatingRoute: false,
  filters: {
    activitySectors: [],
    verifiedOnly: false,
    minRating: 0,
    maxDistance: null,
    searchQuery: '',
    openNow: false,
  },
  mapType: MapType.NORMAL,
  searchRadius: 10,
  lastUpdate: null,
};

/**
 * Fonctions utilitaires pour l'état de la carte
 */
export class MapStateUtils {
  /**
   * Vérifie si il y a une erreur
   */
  static hasError(state: MapState): boolean {
    return state.status === MapStatus.ERROR && state.errorMessage !== null;
  }

  /**
   * Vérifie si des amodiataires sont chargés
   */
  static hasAmodiataires(state: MapState): boolean {
    return state.amodiataires.length > 0;
  }

  /**
   * Vérifie si un amodiataire est sélectionné
   */
  static hasSelectedAmodiataire(state: MapState): boolean {
    return state.selectedAmodiataire !== null;
  }

  /**
   * Vérifie si la position utilisateur est disponible
   */
  static hasUserLocation(state: MapState): boolean {
    return state.userLocation !== null;
  }

  /**
   * Vérifie si une route est active
   */
  static hasActiveRoute(state: MapState): boolean {
    return state.currentRoute !== null;
  }

  /**
   * Vérifie si un chargement est en cours
   */
  static isLoading(state: MapState): boolean {
    return state.status === MapStatus.LOADING || 
           state.isLoadingAmodiataires || 
           state.isLoadingLocation || 
           state.isCalculatingRoute;
  }

  /**
   * Vérifie si des filtres sont appliqués
   */
  static hasActiveFilters(state: MapState): boolean {
    const filters = state.filters;
    return filters.activitySectors.length > 0 ||
           filters.verifiedOnly ||
           filters.minRating > 0 ||
           filters.maxDistance !== null ||
           filters.searchQuery.trim() !== '' ||
           filters.openNow;
  }

  /**
   * Compte le nombre d'amodiataires visibles selon les filtres
   */
  static getVisibleAmodiatairesCount(state: MapState): number {
    if (!this.hasActiveFilters(state)) {
      return state.amodiataires.length;
    }

    return state.amodiataires.filter(amodiataire => 
      this.matchesFilters(amodiataire, state.filters, state.userLocation)
    ).length;
  }

  /**
   * Vérifie si un amodiataire correspond aux filtres
   */
  static matchesFilters(
    amodiataire: Amodiataire,
    filters: MapFilters,
    userLocation: AmodiataireLocation | null
  ): boolean {
    // Filtre par secteur d'activité
    if (filters.activitySectors.length > 0) {
      if (!amodiataire.activitySector || 
          !filters.activitySectors.includes(amodiataire.activitySector)) {
        return false;
      }
    }

    // Filtre vérifiés uniquement
    if (filters.verifiedOnly && !amodiataire.isVerified) {
      return false;
    }

    // Filtre note minimum
    if (filters.minRating > 0 && amodiataire.rating < filters.minRating) {
      return false;
    }

    // Filtre distance maximum
    if (filters.maxDistance !== null && userLocation) {
      const amodiataireLocation = {
        latitude: parseFloat(amodiataire.gpsLat || '0'),
        longitude: parseFloat(amodiataire.gpsLng || '0'),
      };
      
      if (amodiataireLocation.latitude !== 0 && amodiataireLocation.longitude !== 0) {
        const distance = this.calculateDistance(userLocation, amodiataireLocation);
        if (distance > filters.maxDistance) {
          return false;
        }
      }
    }

    // Filtre recherche textuelle
    if (filters.searchQuery.trim() !== '') {
      const query = filters.searchQuery.toLowerCase();
      const searchableText = [
        amodiataire.companyName,
        amodiataire.description,
        amodiataire.activitySector,
        amodiataire.responsibleName,
        amodiataire.physicalAddress,
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (!searchableText.includes(query)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calcule la distance entre deux points (formule de Haversine)
   */
  static calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const earthRadius = 6371; // Rayon de la Terre en km
    
    const lat1Rad = (point1.latitude * Math.PI) / 180;
    const lat2Rad = (point2.latitude * Math.PI) / 180;
    const deltaLatRad = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const deltaLngRad = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
        Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return earthRadius * c;
  }

  /**
   * Crée un état de chargement
   */
  static createLoadingState(): MapState {
    return {
      ...initialMapState,
      status: MapStatus.LOADING,
    };
  }

  /**
   * Crée un état avec des données chargées
   */
  static createLoadedState(
    amodiataires: Amodiataire[],
    userLocation?: AmodiataireLocation
  ): MapState {
    return {
      ...initialMapState,
      status: MapStatus.LOADED,
      amodiataires,
      userLocation: userLocation || null,
      showUserLocation: !!userLocation,
      lastUpdate: new Date(),
    };
  }

  /**
   * Crée un état d'erreur
   */
  static createErrorState(message: string): MapState {
    return {
      ...initialMapState,
      status: MapStatus.ERROR,
      errorMessage: message,
    };
  }

  /**
   * Crée un état d'erreur de permission de localisation
   */
  static createLocationPermissionDeniedState(): MapState {
    return {
      ...initialMapState,
      status: MapStatus.LOCATION_PERMISSION_DENIED,
      errorMessage: 'Permission de localisation refusée',
    };
  }

  /**
   * Crée un état d'erreur de service de localisation
   */
  static createLocationServiceDisabledState(): MapState {
    return {
      ...initialMapState,
      status: MapStatus.LOCATION_SERVICE_DISABLED,
      errorMessage: 'Service de localisation désactivé',
    };
  }
}