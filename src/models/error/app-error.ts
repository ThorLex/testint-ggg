/**
 * Modèles d'erreur personnalisés pour l'application NAVIPAD
 * 
 * @description Gestion centralisée des erreurs avec types et messages localisés
 * Converti depuis le modèle Flutter app_error.dart
 */

/**
 * Types d'erreurs de l'application
 */
export enum AppErrorType {
  // Erreurs réseau
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  NO_INTERNET = 'no_internet',
  
  // Erreurs d'authentification
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  TOKEN_EXPIRED = 'token_expired',
  
  // Erreurs de validation
  VALIDATION = 'validation',
  INVALID_INPUT = 'invalid_input',
  
  // Erreurs serveur
  SERVER = 'server',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  
  // Erreurs de localisation
  LOCATION_PERMISSION_DENIED = 'location_permission_denied',
  LOCATION_SERVICE_DISABLED = 'location_service_disabled',
  LOCATION_UNAVAILABLE = 'location_unavailable',
  
  // Erreurs de médias
  MEDIA_UPLOAD_FAILED = 'media_upload_failed',
  MEDIA_FORMAT_NOT_SUPPORTED = 'media_format_not_supported',
  MEDIA_FILE_TOO_LARGE = 'media_file_too_large',
  
  // Erreurs génériques
  UNKNOWN = 'unknown',
  CANCELLED = 'cancelled',
}

/**
 * Modèle d'erreur personnalisé pour l'application
 */
export interface AppError {
  /** Message d'erreur */
  message: string;
  /** Type d'erreur */
  type: AppErrorType;
  /** Code d'erreur spécifique */
  code?: string;
  /** Détails supplémentaires */
  details?: any;
  /** Stack trace pour le debug */
  stackTrace?: string;
  /** Timestamp de l'erreur */
  timestamp?: Date;
}

/**
 * Factory pour créer des erreurs typées
 */
export class AppErrorFactory {
  // Erreurs réseau
  static network(message: string, details?: any): AppError {
    return {
      message,
      type: AppErrorType.NETWORK,
      details,
      timestamp: new Date(),
    };
  }

  static timeout(message?: string): AppError {
    return {
      message: message || 'Délai d\'attente dépassé',
      type: AppErrorType.TIMEOUT,
      timestamp: new Date(),
    };
  }

  static noInternet(message?: string): AppError {
    return {
      message: message || 'Aucune connexion Internet',
      type: AppErrorType.NO_INTERNET,
      timestamp: new Date(),
    };
  }

  // Erreurs d'authentification
  static authentication(message: string, code?: string): AppError {
    return {
      message,
      type: AppErrorType.AUTHENTICATION,
      code,
      timestamp: new Date(),
    };
  }

  static authorization(message: string, code?: string): AppError {
    return {
      message,
      type: AppErrorType.AUTHORIZATION,
      code,
      timestamp: new Date(),
    };
  }

  static tokenExpired(message?: string): AppError {
    return {
      message: message || 'Session expirée, veuillez vous reconnecter',
      type: AppErrorType.TOKEN_EXPIRED,
      timestamp: new Date(),
    };
  }

  // Erreurs de validation
  static validation(message: string, details?: any): AppError {
    return {
      message,
      type: AppErrorType.VALIDATION,
      details,
      timestamp: new Date(),
    };
  }

  static invalidInput(field: string, message: string): AppError {
    return {
      message,
      type: AppErrorType.INVALID_INPUT,
      details: { field },
      timestamp: new Date(),
    };
  }

  // Erreurs serveur
  static server(message: string, code?: string): AppError {
    return {
      message,
      type: AppErrorType.SERVER,
      code,
      timestamp: new Date(),
    };
  }

  static notFound(resource: string, message?: string): AppError {
    return {
      message: message || `${resource} non trouvé`,
      type: AppErrorType.NOT_FOUND,
      details: { resource },
      timestamp: new Date(),
    };
  }

  static conflict(message: string, details?: any): AppError {
    return {
      message,
      type: AppErrorType.CONFLICT,
      details,
      timestamp: new Date(),
    };
  }

  // Erreurs de localisation
  static locationPermissionDenied(message?: string): AppError {
    return {
      message: message || 'Permission de localisation refusée',
      type: AppErrorType.LOCATION_PERMISSION_DENIED,
      timestamp: new Date(),
    };
  }

  static locationServiceDisabled(message?: string): AppError {
    return {
      message: message || 'Service de localisation désactivé',
      type: AppErrorType.LOCATION_SERVICE_DISABLED,
      timestamp: new Date(),
    };
  }

  static locationUnavailable(message?: string): AppError {
    return {
      message: message || 'Localisation indisponible',
      type: AppErrorType.LOCATION_UNAVAILABLE,
      timestamp: new Date(),
    };
  }

  // Erreurs de médias
  static mediaUploadFailed(message: string, details?: any): AppError {
    return {
      message,
      type: AppErrorType.MEDIA_UPLOAD_FAILED,
      details,
      timestamp: new Date(),
    };
  }

  static mediaFormatNotSupported(format: string): AppError {
    return {
      message: `Format de fichier non supporté: ${format}`,
      type: AppErrorType.MEDIA_FORMAT_NOT_SUPPORTED,
      details: { format },
      timestamp: new Date(),
    };
  }

  static mediaFileTooLarge(size: number, maxSize: number): AppError {
    const sizeMB = (size / 1024 / 1024).toFixed(1);
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
    
    return {
      message: `Fichier trop volumineux (${sizeMB}MB). Taille maximale: ${maxSizeMB}MB`,
      type: AppErrorType.MEDIA_FILE_TOO_LARGE,
      details: { size, maxSize },
      timestamp: new Date(),
    };
  }

  // Erreurs génériques
  static unknown(message: string, details?: any): AppError {
    return {
      message,
      type: AppErrorType.UNKNOWN,
      details,
      timestamp: new Date(),
    };
  }

  static cancelled(message?: string): AppError {
    return {
      message: message || 'Opération annulée',
      type: AppErrorType.CANCELLED,
      timestamp: new Date(),
    };
  }

  /**
   * Crée une erreur à partir d'une exception JavaScript
   */
  static fromError(error: Error, type: AppErrorType = AppErrorType.UNKNOWN): AppError {
    return {
      message: error.message,
      type,
      stackTrace: error.stack,
      timestamp: new Date(),
    };
  }

  /**
   * Crée une erreur à partir d'une réponse HTTP
   */
  static fromHttpResponse(
    status: number,
    statusText: string,
    data?: any
  ): AppError {
    let type: AppErrorType;
    let message: string;

    switch (status) {
      case 400:
        type = AppErrorType.VALIDATION;
        message = data?.message || 'Données invalides';
        break;
      case 401:
        type = AppErrorType.AUTHENTICATION;
        message = data?.message || 'Non authentifié';
        break;
      case 403:
        type = AppErrorType.AUTHORIZATION;
        message = data?.message || 'Accès refusé';
        break;
      case 404:
        type = AppErrorType.NOT_FOUND;
        message = data?.message || 'Ressource non trouvée';
        break;
      case 409:
        type = AppErrorType.CONFLICT;
        message = data?.message || 'Conflit de données';
        break;
      case 408:
        type = AppErrorType.TIMEOUT;
        message = data?.message || 'Délai d\'attente dépassé';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        type = AppErrorType.SERVER;
        message = data?.message || 'Erreur du serveur';
        break;
      default:
        type = AppErrorType.UNKNOWN;
        message = data?.message || statusText || 'Erreur inconnue';
    }

    return {
      message,
      type,
      code: status.toString(),
      details: data,
      timestamp: new Date(),
    };
  }
}

/**
 * Fonctions utilitaires pour les erreurs
 */
export class AppErrorUtils {
  /**
   * Vérifie si c'est une erreur réseau
   */
  static isNetworkError(error: AppError): boolean {
    return [
      AppErrorType.NETWORK,
      AppErrorType.TIMEOUT,
      AppErrorType.NO_INTERNET,
    ].includes(error.type);
  }

  /**
   * Vérifie si c'est une erreur d'authentification
   */
  static isAuthError(error: AppError): boolean {
    return [
      AppErrorType.AUTHENTICATION,
      AppErrorType.AUTHORIZATION,
      AppErrorType.TOKEN_EXPIRED,
    ].includes(error.type);
  }

  /**
   * Vérifie si c'est une erreur de validation
   */
  static isValidationError(error: AppError): boolean {
    return [
      AppErrorType.VALIDATION,
      AppErrorType.INVALID_INPUT,
    ].includes(error.type);
  }

  /**
   * Vérifie si c'est une erreur serveur
   */
  static isServerError(error: AppError): boolean {
    return [
      AppErrorType.SERVER,
      AppErrorType.NOT_FOUND,
      AppErrorType.CONFLICT,
    ].includes(error.type);
  }

  /**
   * Vérifie si c'est une erreur de localisation
   */
  static isLocationError(error: AppError): boolean {
    return [
      AppErrorType.LOCATION_PERMISSION_DENIED,
      AppErrorType.LOCATION_SERVICE_DISABLED,
      AppErrorType.LOCATION_UNAVAILABLE,
    ].includes(error.type);
  }

  /**
   * Vérifie si c'est une erreur de média
   */
  static isMediaError(error: AppError): boolean {
    return [
      AppErrorType.MEDIA_UPLOAD_FAILED,
      AppErrorType.MEDIA_FORMAT_NOT_SUPPORTED,
      AppErrorType.MEDIA_FILE_TOO_LARGE,
    ].includes(error.type);
  }

  /**
   * Vérifie si l'erreur peut être retentée
   */
  static isRetryable(error: AppError): boolean {
    return [
      AppErrorType.NETWORK,
      AppErrorType.TIMEOUT,
      AppErrorType.SERVER,
    ].includes(error.type);
  }

  /**
   * Retourne un message d'erreur localisé
   */
  static getLocalizedMessage(error: AppError): string {
    const errorMessages: Record<AppErrorType, string> = {
      [AppErrorType.NETWORK]: 'Erreur de connexion réseau',
      [AppErrorType.TIMEOUT]: 'Délai d\'attente dépassé',
      [AppErrorType.NO_INTERNET]: 'Aucune connexion Internet',
      [AppErrorType.AUTHENTICATION]: 'Erreur d\'authentification',
      [AppErrorType.AUTHORIZATION]: 'Accès non autorisé',
      [AppErrorType.TOKEN_EXPIRED]: 'Session expirée',
      [AppErrorType.VALIDATION]: 'Données invalides',
      [AppErrorType.INVALID_INPUT]: 'Saisie invalide',
      [AppErrorType.SERVER]: 'Erreur du serveur',
      [AppErrorType.NOT_FOUND]: 'Ressource non trouvée',
      [AppErrorType.CONFLICT]: 'Conflit de données',
      [AppErrorType.LOCATION_PERMISSION_DENIED]: 'Permission de localisation refusée',
      [AppErrorType.LOCATION_SERVICE_DISABLED]: 'Service de localisation désactivé',
      [AppErrorType.LOCATION_UNAVAILABLE]: 'Localisation indisponible',
      [AppErrorType.MEDIA_UPLOAD_FAILED]: 'Échec de l\'upload du média',
      [AppErrorType.MEDIA_FORMAT_NOT_SUPPORTED]: 'Format de fichier non supporté',
      [AppErrorType.MEDIA_FILE_TOO_LARGE]: 'Fichier trop volumineux',
      [AppErrorType.CANCELLED]: 'Opération annulée',
      [AppErrorType.UNKNOWN]: error.message,
    };

    return errorMessages[error.type] || error.message;
  }

  /**
   * Convertit une erreur en string pour le logging
   */
  static toString(error: AppError): string {
    return `AppError(type: ${error.type}, message: ${error.message})`;
  }

  /**
   * Sérialise une erreur pour le stockage/transmission
   */
  static serialize(error: AppError): string {
    return JSON.stringify({
      message: error.message,
      type: error.type,
      code: error.code,
      details: error.details,
      timestamp: error.timestamp?.toISOString(),
    });
  }

  /**
   * Désérialise une erreur depuis JSON
   */
  static deserialize(json: string): AppError {
    const data = JSON.parse(json);
    return {
      message: data.message,
      type: data.type,
      code: data.code,
      details: data.details,
      timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
    };
  }
}