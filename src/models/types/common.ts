/**
 * Types utilitaires communs pour l'application NAVIPAD
 * 
 * @description Types de base utilisés dans tous les modèles
 */

/**
 * Coordonnées GPS
 */
export interface Coordinates {
  /** Latitude en degrés décimaux */
  latitude: number;
  /** Longitude en degrés décimaux */
  longitude: number;
}

/**
 * Élément média (photo, vidéo, document)
 */
export interface MediaItem {
  /** URL du média */
  url: string;
  /** Type de média (image, video, document) */
  type: string;
  /** Identifiant unique du média */
  id?: string;
  /** Nom du fichier */
  name?: string;
  /** Taille du fichier en octets */
  size?: number;
  /** Date d'upload */
  uploadedAt?: Date;
}

/**
 * Réponse API générique
 */
export interface ApiResponse<T = any> {
  /** Données de la réponse */
  data: T;
  /** Message de la réponse */
  message?: string;
  /** Statut de la réponse */
  success: boolean;
  /** Code d'erreur éventuel */
  errorCode?: string;
}

/**
 * Paramètres de pagination
 */
export interface PaginationParams {
  /** Numéro de page (commence à 1) */
  page: number;
  /** Nombre d'éléments par page */
  limit: number;
  /** Terme de recherche optionnel */
  search?: string;
  /** Tri optionnel */
  sortBy?: string;
  /** Ordre de tri */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Réponse paginée
 */
export interface PaginatedResponse<T> {
  /** Données de la page courante */
  data: T[];
  /** Informations de pagination */
  pagination: {
    /** Page courante */
    currentPage: number;
    /** Nombre total de pages */
    totalPages: number;
    /** Nombre total d'éléments */
    totalItems: number;
    /** Nombre d'éléments par page */
    itemsPerPage: number;
    /** Y a-t-il une page suivante */
    hasNext: boolean;
    /** Y a-t-il une page précédente */
    hasPrev: boolean;
  };
}

/**
 * État de chargement générique
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Résultat d'opération générique
 */
export interface OperationResult<T = any> {
  /** Succès de l'opération */
  success: boolean;
  /** Données résultantes */
  data?: T;
  /** Message d'erreur éventuel */
  error?: string;
  /** Code d'erreur */
  errorCode?: string;
}