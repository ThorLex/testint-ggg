/**
 * Intégration des modèles TypeScript avec les routes API
 * 
 * @description Exemples d'utilisation des modèles avec les services API existants
 */

import { ApiRoutes } from '../../services/api/routes';
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
  PaginatedResponse,
  ApiResponse,
} from '../index';

/**
 * Service d'authentification utilisant les modèles typés
 */
export class AuthService {
  /**
   * Connexion utilisateur avec modèles typés
   */
  static async login(email: string, password: string): Promise<LoginResponse> {
    const loginRequest: LoginRequest = {
      email,
      password,
    };

    try {
      const response = await fetch(ApiRoutes.getFullUrl(ApiRoutes.LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': ApiRoutes.API_KEY,
        },
        body: JSON.stringify(loginRequest),
      });

      if (!response.ok) {
        throw AppErrorFactory.fromHttpResponse(
          response.status,
          response.statusText,
          await response.json().catch(() => null)
        );
      }

      const data: LoginResponse = await response.json();
      
      // Valider la structure de la réponse
      if (!data.accessToken || !data.user) {
        throw AppErrorFactory.validation('Réponse de connexion invalide');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw AppErrorFactory.fromError(error);
      }
      throw error;
    }
  }

  /**
   * Rafraîchissement des tokens
   */
  static async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const response = await fetch(ApiRoutes.getFullUrl(ApiRoutes.REFRESH_TOKEN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': ApiRoutes.API_KEY,
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw AppErrorFactory.fromHttpResponse(response.status, response.statusText);
      }

      const data = await response.json();
      
      return AuthTokensUtils.createTokensWithExpiration(
        data.accessToken,
        data.refreshToken,
        data.tokenType || 'Bearer'
      );
    } catch (error) {
      throw AppErrorFactory.fromError(error as Error);
    }
  }

  /**
   * Déconnexion
   */
  static async logout(tokens: AuthTokens): Promise<void> {
    try {
      await fetch(ApiRoutes.getFullUrl(ApiRoutes.LOGOUT), {
        method: 'POST',
        headers: {
          'Authorization': AuthTokensUtils.getAuthorizationHeader(tokens),
          'X-API-Key': ApiRoutes.API_KEY,
        },
      });
    } catch (error) {
      // La déconnexion peut échouer côté serveur mais on continue
      console.warn('Erreur lors de la déconnexion:', error);
    }
  }
}

/**
 * Service des amodiataires utilisant les modèles typés
 */
export class AmodiataireService {
  /**
   * Récupération de tous les amodiataires publics
   */
  static async getAllPublicAmodiataires(): Promise<Amodiataire[]> {
    try {
      const response = await fetch(ApiRoutes.getFullUrl(ApiRoutes.AMODIATAIRES), {
        headers: {
          'X-API-Key': ApiRoutes.API_KEY,
        },
      });

      if (!response.ok) {
        throw AppErrorFactory.fromHttpResponse(response.status, response.statusText);
      }

      const data: ApiResponse<Amodiataire[]> = await response.json();
      
      if (!data.success || !Array.isArray(data.data)) {
        throw AppErrorFactory.validation('Format de réponse invalide');
      }

      // Valider et nettoyer les données
      return data.data.map(amodiataire => ({
        ...amodiataire,
        photosUrls: amodiataire.photosUrls || [],
        videosUrls: amodiataire.videosUrls || [],
        rating: amodiataire.rating || 0,
        reviewCount: amodiataire.reviewCount || 0,
        isVerified: amodiataire.isVerified || false,
      }));
    } catch (error) {
      throw AppErrorFactory.fromError(error as Error);
    }
  }

  /**
   * Recherche d'amodiataires avec filtres
   */
  static async searchAmodiataires(
    query: string,
    filters?: {
      verifiedOnly?: boolean;
      minRating?: number;
      activitySectors?: string[];
      location?: { latitude: number; longitude: number; radius?: number };
    }
  ): Promise<Amodiataire[]> {
    try {
      const params: Record<string, any> = { q: query };
      
      if (filters) {
        if (filters.verifiedOnly) params.verified = '1';
        if (filters.minRating) params.minRating = filters.minRating;
        if (filters.activitySectors?.length) {
          params.sectors = filters.activitySectors.join(',');
        }
        if (filters.location) {
          params.lat = filters.location.latitude;
          params.lng = filters.location.longitude;
          params.radius = filters.location.radius || 10;
        }
      }

      const response = await fetch(
        ApiRoutes.getFullUrl(ApiRoutes.AMODIATAIRES, params),
        {
          headers: {
            'X-API-Key': ApiRoutes.API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw AppErrorFactory.fromHttpResponse(response.status, response.statusText);
      }

      const data: ApiResponse<Amodiataire[]> = await response.json();
      return data.data || [];
    } catch (error) {
      throw AppErrorFactory.fromError(error as Error);
    }
  }

  /**
   * Récupération des détails d'un amodiataire
   */
  static async getAmodiataireDetails(id: string): Promise<Amodiataire> {
    try {
      const response = await fetch(ApiRoutes.getAmodiataireDetailsUrl(id), {
        headers: {
          'X-API-Key': ApiRoutes.API_KEY,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw AppErrorFactory.notFound('Amodiataire', `Amodiataire avec l'ID ${id} non trouvé`);
        }
        throw AppErrorFactory.fromHttpResponse(response.status, response.statusText);
      }

      const data: ApiResponse<Amodiataire> = await response.json();
      
      if (!data.success || !data.data) {
        throw AppErrorFactory.validation('Données d\'amodiataire invalides');
      }

      return data.data;
    } catch (error) {
      throw AppErrorFactory.fromError(error as Error);
    }
  }

  /**
   * Filtrage local des amodiataires
   */
  static filterAmodiataires(
    amodiataires: Amodiataire[],
    filters: {
      verifiedOnly?: boolean;
      minRating?: number;
      activitySectors?: string[];
      searchQuery?: string;
      userLocation?: { latitude: number; longitude: number };
      maxDistance?: number;
    }
  ): Amodiataire[] {
    return amodiataires.filter(amodiataire => {
      // Filtre vérifiés uniquement
      if (filters.verifiedOnly && !amodiataire.isVerified) {
        return false;
      }

      // Filtre note minimum
      if (filters.minRating && amodiataire.rating < filters.minRating) {
        return false;
      }

      // Filtre secteurs d'activité
      if (filters.activitySectors?.length) {
        if (!amodiataire.activitySector || 
            !filters.activitySectors.includes(amodiataire.activitySector)) {
          return false;
        }
      }

      // Filtre recherche textuelle
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchableText = [
          amodiataire.companyName,
          amodiataire.description,
          amodiataire.activitySector,
          amodiataire.responsibleName,
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      // Filtre distance
      if (filters.userLocation && filters.maxDistance && 
          AmodiataireUtils.hasLocation(amodiataire)) {
        const amodiataireLocation = AmodiataireUtils.getLocation(amodiataire);
        if (amodiataireLocation) {
          const distance = AmodiataireUtils.calculateDistance(
            filters.userLocation,
            amodiataireLocation
          );
          if (distance > filters.maxDistance) {
            return false;
          }
        }
      }

      return true;
    });
  }
}

/**
 * Service de carte utilisant les modèles typés
 */
export class MapService {
  /**
   * Chargement des données de carte avec état typé
   */
  static async loadMapData(
    userLocation?: { latitude: number; longitude: number }
  ): Promise<MapState> {
    try {
      // Créer un état de chargement
      let mapState = MapStateUtils.createLoadingState();

      // Charger les amodiataires
      const amodiataires = await AmodiataireService.getAllPublicAmodiataires();

      // Créer l'état avec les données chargées
      mapState = MapStateUtils.createLoadedState(
        amodiataires,
        userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        } : undefined
      );

      return mapState;
    } catch (error) {
      const appError = AppErrorUtils.isNetworkError(error as any) 
        ? error as any
        : AppErrorFactory.fromError(error as Error);
      
      return MapStateUtils.createErrorState(
        AppErrorUtils.getLocalizedMessage(appError)
      );
    }
  }

  /**
   * Recherche sur la carte avec filtres
   */
  static async searchOnMap(
    query: string,
    currentMapState: MapState,
    filters?: {
      verifiedOnly?: boolean;
      minRating?: number;
      activitySectors?: string[];
    }
  ): Promise<MapState> {
    try {
      const searchResults = await AmodiataireService.searchAmodiataires(query, filters);
      
      return {
        ...currentMapState,
        amodiataires: searchResults,
        filters: {
          ...currentMapState.filters,
          searchQuery: query,
          verifiedOnly: filters?.verifiedOnly || false,
          minRating: filters?.minRating || 0,
          activitySectors: filters?.activitySectors || [],
        },
        lastUpdate: new Date(),
      };
    } catch (error) {
      return MapStateUtils.createErrorState(
        AppErrorUtils.getLocalizedMessage(error as any)
      );
    }
  }
}

/**
 * Service de gestion des erreurs avec logging
 */
export class ErrorService {
  /**
   * Gestion centralisée des erreurs avec logging
   */
  static handleError(error: any, context?: string): void {
    let appError;

    if (AppErrorUtils.isNetworkError(error)) {
      appError = error;
    } else if (error.response) {
      appError = AppErrorFactory.fromHttpResponse(
        error.response.status,
        error.response.statusText,
        error.response.data
      );
    } else if (error instanceof Error) {
      appError = AppErrorFactory.fromError(error);
    } else {
      appError = AppErrorFactory.unknown(String(error));
    }

    // Logging
    console.error(`[${context || 'Unknown'}] ${AppErrorUtils.toString(appError)}`);
    
    // Sérialisation pour le stockage/envoi
    const serialized = AppErrorUtils.serialize(appError);
    
    // Ici on pourrait envoyer l'erreur à un service de monitoring
    // this.sendToMonitoring(serialized);
    
    // Affichage utilisateur
    const userMessage = AppErrorUtils.getLocalizedMessage(appError);
    console.log('Message utilisateur:', userMessage);
  }

  /**
   * Vérification de la connectivité réseau
   */
  static async checkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch(ApiRoutes.getFullUrl('/health'), {
        method: 'HEAD',
        timeout: 5000,
      } as any);
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Exemple d'utilisation complète des services
 */
export class IntegrationExample {
  /**
   * Scénario complet d'utilisation
   */
  static async demonstrateIntegration(): Promise<void> {
    console.log('🚀 Démonstration de l\'intégration API + Modèles\n');

    try {
      // 1. Vérification de la connectivité
      console.log('1. Vérification de la connectivité...');
      const isConnected = await ErrorService.checkConnectivity();
      console.log(`Connectivité: ${isConnected ? '✅' : '❌'}`);

      if (!isConnected) {
        throw AppErrorFactory.noInternet();
      }

      // 2. Connexion (simulation)
      console.log('\n2. Connexion utilisateur...');
      // const loginResponse = await AuthService.login('user@example.com', 'password');
      // console.log(`Utilisateur connecté: ${loginResponse.user.companyName}`);

      // 3. Chargement de la carte
      console.log('\n3. Chargement des données de carte...');
      const userLocation = { latitude: 14.6928, longitude: -17.4467 };
      const mapState = await MapService.loadMapData(userLocation);
      
      if (MapStateUtils.hasError(mapState)) {
        throw new Error(mapState.errorMessage || 'Erreur de chargement');
      }

      console.log(`Amodiataires chargés: ${mapState.amodiataires.length}`);
      console.log(`Position utilisateur: ${MapStateUtils.hasUserLocation(mapState) ? 'OK' : 'Non disponible'}`);

      // 4. Recherche et filtrage
      console.log('\n4. Recherche et filtrage...');
      const searchResults = await MapService.searchOnMap(
        'restaurant',
        mapState,
        {
          verifiedOnly: true,
          minRating: 3.0,
          activitySectors: ['Restaurant', 'Hôtel'],
        }
      );

      console.log(`Résultats de recherche: ${searchResults.amodiataires.length}`);

      // 5. Détails d'un amodiataire
      if (searchResults.amodiataires.length > 0) {
        console.log('\n5. Récupération des détails...');
        const firstAmodiataire = searchResults.amodiataires[0];
        const details = await AmodiataireService.getAmodiataireDetails(firstAmodiataire.id);
        console.log(`Détails récupérés pour: ${details.companyName}`);
        console.log(`Note: ${AmodiataireUtils.formatRating(details.rating)}`);
        console.log(`Localisation: ${AmodiataireUtils.hasLocation(details) ? 'Disponible' : 'Non disponible'}`);
      }

      console.log('\n🎉 Intégration réussie !');

    } catch (error) {
      console.error('\n❌ Erreur lors de l\'intégration:');
      ErrorService.handleError(error, 'IntegrationExample');
    }
  }
}

// Export des services
export default {
  AuthService,
  AmodiataireService,
  MapService,
  ErrorService,
  IntegrationExample,
};