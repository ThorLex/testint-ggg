/**
 * Exemples d'utilisation des modèles NAVIPAD
 * 
 * @description Exemples pratiques d'utilisation des modèles avec les services API
 */

import {
  User,
  AuthTokens,
  AuthTokensUtils,
  LoginRequest,
  LoginResponse,
  Amodiataire,
  AmodiataireUtils,
  MapState,
  MapStateUtils,
  AppErrorFactory,
  AppErrorUtils,
  NavigationState,
  NavigationUtils,
} from '../index';

/**
 * Exemple 1: Authentification utilisateur
 */
export class AuthenticationExample {
  /**
   * Connexion d'un utilisateur
   */
  static async loginUser(email: string, password: string): Promise<LoginResponse> {
    // Créer la requête de connexion
    const loginRequest: LoginRequest = {
      email,
      password,
    };

    try {
      // Simuler un appel API
      const response: LoginResponse = {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'refresh_token_here',
        tokenType: 'Bearer',
        user: {
          id: '123',
          companyName: 'Entreprise Test',
          adminEmail: email,
          responsibleName: 'Jean Dupont',
          photosUrls: [],
          videosUrls: [],
          isVerified: true,
          isFrozen: false,
          createdAt: new Date(),
        },
      };

      // Créer les tokens avec expiration
      const tokens = AuthTokensUtils.createTokensWithExpiration(
        response.accessToken,
        response.refreshToken,
        response.tokenType
      );

      console.log('Tokens valides:', AuthTokensUtils.isValid(tokens));
      console.log('Header auth:', AuthTokensUtils.getAuthorizationHeader(tokens));

      return response;
    } catch (error) {
      // Créer une erreur d'authentification typée
      throw AppErrorFactory.authentication('Identifiants incorrects');
    }
  }

  /**
   * Vérification et rafraîchissement des tokens
   */
  static async checkAndRefreshTokens(tokens: AuthTokens): Promise<AuthTokens> {
    // Vérifier si les tokens doivent être rafraîchis
    if (AuthTokensUtils.shouldRefresh(tokens)) {
      console.log('Rafraîchissement des tokens nécessaire');
      
      try {
        // Simuler le rafraîchissement
        const newTokens = AuthTokensUtils.createTokensWithExpiration(
          'new_access_token',
          tokens.refreshToken,
          tokens.tokenType
        );
        
        return newTokens;
      } catch (error) {
        throw AppErrorFactory.tokenExpired();
      }
    }

    return tokens;
  }
}

/**
 * Exemple 2: Gestion des amodiataires
 */
export class AmodiataireExample {
  /**
   * Filtrage et recherche d'amodiataires
   */
  static filterAmodiataires(
    amodiataires: Amodiataire[],
    userLocation?: { latitude: number; longitude: number }
  ): Amodiataire[] {
    return amodiataires.filter(amodiataire => {
      // Filtrer uniquement les amodiataires vérifiés
      if (!amodiataire.isVerified) return false;

      // Filtrer par localisation (dans un rayon de 10km)
      if (userLocation && AmodiataireUtils.hasLocation(amodiataire)) {
        const amodiataireLocation = AmodiataireUtils.getLocation(amodiataire);
        if (amodiataireLocation) {
          const distance = AmodiataireUtils.calculateDistance(
            userLocation,
            amodiataireLocation
          );
          if (distance > 10) return false; // Plus de 10km
        }
      }

      // Filtrer par note minimum
      if (amodiataire.rating < 3.0) return false;

      return true;
    });
  }

  /**
   * Affichage des informations d'un amodiataire
   */
  static displayAmodiataireInfo(amodiataire: Amodiataire): void {
    console.log(`=== ${amodiataire.companyName} ===`);
    console.log(`Responsable: ${amodiataire.responsibleName || 'Non spécifié'}`);
    console.log(`Secteur: ${amodiataire.activitySector || 'Non spécifié'}`);
    console.log(`Note: ${AmodiataireUtils.formatRating(amodiataire.rating)} (${amodiataire.reviewCount} avis)`);
    console.log(`Vérifié: ${amodiataire.isVerified ? 'Oui' : 'Non'}`);
    
    if (AmodiataireUtils.hasLocation(amodiataire)) {
      const location = AmodiataireUtils.getLocation(amodiataire);
      console.log(`Position: ${location?.latitude}, ${location?.longitude}`);
    }
    
    if (AmodiataireUtils.hasContactInfo(amodiataire)) {
      const phone = AmodiataireUtils.getPrimaryPhone(amodiataire);
      console.log(`Contact: ${phone || amodiataire.adminEmail}`);
    }
    
    console.log(`Médias: ${AmodiataireUtils.getMediaCount(amodiataire)} éléments`);
  }
}

/**
 * Exemple 3: Gestion de l'état de la carte
 */
export class MapStateExample {
  /**
   * Initialisation de l'état de la carte
   */
  static initializeMapState(): MapState {
    return MapStateUtils.createLoadingState();
  }

  /**
   * Chargement des amodiataires sur la carte
   */
  static async loadAmodiatairesOnMap(
    amodiataires: Amodiataire[],
    userLocation?: { latitude: number; longitude: number }
  ): Promise<MapState> {
    try {
      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Créer l'état avec les données chargées
      const mapState = MapStateUtils.createLoadedState(
        amodiataires,
        userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        } : undefined
      );

      console.log(`Carte chargée avec ${MapStateUtils.getVisibleAmodiatairesCount(mapState)} amodiataires`);
      console.log(`Position utilisateur: ${MapStateUtils.hasUserLocation(mapState) ? 'Disponible' : 'Non disponible'}`);

      return mapState;
    } catch (error) {
      // Créer un état d'erreur
      return MapStateUtils.createErrorState('Erreur lors du chargement de la carte');
    }
  }

  /**
   * Application de filtres sur la carte
   */
  static applyMapFilters(mapState: MapState): MapState {
    const newFilters = {
      ...mapState.filters,
      verifiedOnly: true,
      minRating: 3.0,
      activitySectors: ['Restaurant', 'Hôtel'],
      maxDistance: 5, // 5km
    };

    const updatedState: MapState = {
      ...mapState,
      filters: newFilters,
    };

    console.log(`Filtres appliqués. Amodiataires visibles: ${MapStateUtils.getVisibleAmodiatairesCount(updatedState)}`);

    return updatedState;
  }
}

/**
 * Exemple 4: Gestion des erreurs
 */
export class ErrorHandlingExample {
  /**
   * Gestion centralisée des erreurs API
   */
  static handleApiError(error: any): void {
    let appError;

    if (error.response) {
      // Erreur HTTP
      appError = AppErrorFactory.fromHttpResponse(
        error.response.status,
        error.response.statusText,
        error.response.data
      );
    } else if (error.request) {
      // Erreur réseau
      appError = AppErrorFactory.network('Impossible de contacter le serveur');
    } else {
      // Erreur inconnue
      appError = AppErrorFactory.unknown(error.message);
    }

    // Afficher le message localisé
    console.error('Erreur:', AppErrorUtils.getLocalizedMessage(appError));

    // Vérifier si l'erreur peut être retentée
    if (AppErrorUtils.isRetryable(appError)) {
      console.log('Cette erreur peut être retentée');
    }

    // Gestion spécifique par type
    if (AppErrorUtils.isAuthError(appError)) {
      console.log('Redirection vers la page de connexion');
    } else if (AppErrorUtils.isNetworkError(appError)) {
      console.log('Vérifier la connexion Internet');
    }
  }

  /**
   * Création d'erreurs spécifiques
   */
  static createSpecificErrors(): void {
    // Erreur de validation
    const validationError = AppErrorFactory.invalidInput(
      'email',
      'Format d\'email invalide'
    );

    // Erreur de média
    const mediaError = AppErrorFactory.mediaFileTooLarge(
      5 * 1024 * 1024, // 5MB
      2 * 1024 * 1024  // Max 2MB
    );

    // Erreur de localisation
    const locationError = AppErrorFactory.locationPermissionDenied();

    console.log('Erreurs créées:', [validationError, mediaError, locationError]);
  }
}

/**
 * Exemple 5: Navigation GPS
 */
export class NavigationExample {
  /**
   * Formatage des informations de navigation
   */
  static displayNavigationInfo(navState: NavigationState): void {
    if (!navState.stats) return;

    console.log('=== Navigation en cours ===');
    console.log(`Distance restante: ${NavigationUtils.formatDistance(navState.stats.remainingDistance)}`);
    console.log(`Temps restant: ${NavigationUtils.formatDuration(navState.stats.remainingTime)}`);
    console.log(`Vitesse actuelle: ${NavigationUtils.formatSpeed(navState.stats.currentSpeed)}`);
    console.log(`Progression: ${NavigationUtils.calculateProgress(navState.stats).toFixed(1)}%`);

    if (navState.currentInstruction) {
      console.log(`Instruction: ${navState.currentInstruction.text}`);
      console.log(`Dans: ${NavigationUtils.formatDistance(navState.currentInstruction.distanceMeters)}`);
    }

    // Afficher les alertes valides
    const validAlerts = NavigationUtils.getValidAlerts(navState.alerts);
    if (validAlerts.length > 0) {
      console.log(`Alertes actives: ${validAlerts.length}`);
      validAlerts.forEach(alert => {
        console.log(`- ${alert.title}: ${alert.description}`);
      });
    }
  }
}

/**
 * Exemple d'utilisation complète
 */
export class CompleteUsageExample {
  /**
   * Scénario complet: connexion, chargement de la carte, navigation
   */
  static async completeScenario(): Promise<void> {
    try {
      // 1. Connexion utilisateur
      console.log('1. Connexion utilisateur...');
      const loginResponse = await AuthenticationExample.loginUser(
        'user@example.com',
        'password123'
      );
      console.log(`Utilisateur connecté: ${loginResponse.user.companyName}`);

      // 2. Chargement des amodiataires
      console.log('2. Chargement des amodiataires...');
      const mockAmodiataires: Amodiataire[] = [
        {
          id: '1',
          companyName: 'Restaurant Le Gourmet',
          activitySector: 'Restaurant',
          gpsLat: '14.6928',
          gpsLng: '-17.4467',
          rating: 4.5,
          reviewCount: 25,
          isVerified: true,
          photosUrls: [],
          videosUrls: [],
        },
        {
          id: '2',
          companyName: 'Hôtel Teranga',
          activitySector: 'Hôtel',
          gpsLat: '14.6937',
          gpsLng: '-17.4441',
          rating: 4.2,
          reviewCount: 18,
          isVerified: true,
          photosUrls: [],
          videosUrls: [],
        },
      ];

      // 3. Initialisation de la carte
      console.log('3. Initialisation de la carte...');
      const userLocation = { latitude: 14.6928, longitude: -17.4467 };
      let mapState = await MapStateExample.loadAmodiatairesOnMap(
        mockAmodiataires,
        userLocation
      );

      // 4. Application de filtres
      console.log('4. Application de filtres...');
      mapState = MapStateExample.applyMapFilters(mapState);

      // 5. Affichage des résultats
      console.log('5. Résultats:');
      const filteredAmodiataires = AmodiataireExample.filterAmodiataires(
        mockAmodiataires,
        userLocation
      );
      
      filteredAmodiataires.forEach(amodiataire => {
        AmodiataireExample.displayAmodiataireInfo(amodiataire);
      });

      console.log('Scénario terminé avec succès !');

    } catch (error) {
      console.error('Erreur dans le scénario:', error);
      ErrorHandlingExample.handleApiError(error);
    }
  }
}

// Export pour utilisation dans d'autres fichiers
export default {
  AuthenticationExample,
  AmodiataireExample,
  MapStateExample,
  ErrorHandlingExample,
  NavigationExample,
  CompleteUsageExample,
};