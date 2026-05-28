/**
 * Modèles pour les tokens d'authentification
 * 
 * @description Gestion des tokens JWT et des réponses d'authentification
 * Converti depuis le modèle Flutter auth_tokens.dart
 */

import { User } from './user';

/**
 * Tokens d'authentification JWT
 */
export interface AuthTokens {
  /** Token d'accès JWT */
  accessToken: string;
  /** Token de rafraîchissement */
  refreshToken: string;
  /** Type de token (généralement 'Bearer') */
  tokenType: string;
  /** Date d'expiration du token d'accès */
  expiresAt?: Date;
  /** Date d'expiration du token de rafraîchissement */
  refreshExpiresAt?: Date;
}

/**
 * Réponse de connexion complète
 */
export interface LoginResponse {
  /** Token d'accès JWT */
  accessToken: string;
  /** Token de rafraîchissement */
  refreshToken: string;
  /** Informations utilisateur */
  user: User;
  /** Type de token (généralement 'Bearer') */
  tokenType: string;
}

/**
 * Requête de connexion
 */
export interface LoginRequest {
  /** Adresse email */
  email: string;
  /** Mot de passe */
  password: string;
}

/**
 * Requête de rafraîchissement de token
 */
export interface RefreshTokenRequest {
  /** Token de rafraîchissement */
  refreshToken: string;
}

/**
 * Requête d'inscription
 */
export interface RegisterRequest {
  /** Nom de l'entreprise */
  companyName: string;
  /** Email administrateur */
  adminEmail: string;
  /** Mot de passe */
  password: string;
  /** Confirmation du mot de passe */
  passwordConfirmation: string;
  /** Nom du responsable */
  responsibleName?: string;
  /** Type d'entité */
  entityType?: string;
  /** Secteur d'activité */
  activitySector?: string;
  /** Téléphone administrateur */
  adminPhone?: string;
  /** Mobile administrateur */
  adminMobile?: string;
  /** Adresse administrative */
  adminAddress?: string;
}

/**
 * Requête de réinitialisation de mot de passe
 */
export interface ForgotPasswordRequest {
  /** Adresse email */
  email: string;
}

/**
 * Requête de nouveau mot de passe
 */
export interface ResetPasswordRequest {
  /** Token de réinitialisation */
  token: string;
  /** Nouveau mot de passe */
  password: string;
  /** Confirmation du nouveau mot de passe */
  passwordConfirmation: string;
}

/**
 * Fonctions utilitaires pour les tokens d'authentification
 */
export class AuthTokensUtils {
  /**
   * Vérifie si le token d'accès est expiré
   */
  static isAccessTokenExpired(tokens: AuthTokens): boolean {
    if (!tokens.expiresAt) return false;
    return new Date() > tokens.expiresAt;
  }

  /**
   * Vérifie si le refresh token est expiré
   */
  static isRefreshTokenExpired(tokens: AuthTokens): boolean {
    if (!tokens.refreshExpiresAt) return false;
    return new Date() > tokens.refreshExpiresAt;
  }

  /**
   * Vérifie si les tokens sont valides
   */
  static isValid(tokens: AuthTokens): boolean {
    return !this.isAccessTokenExpired(tokens) && !this.isRefreshTokenExpired(tokens);
  }

  /**
   * Vérifie si le token d'accès doit être rafraîchi
   * (expire dans moins de 5 minutes)
   */
  static shouldRefresh(tokens: AuthTokens): boolean {
    if (!tokens.expiresAt) return false;
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return tokens.expiresAt < fiveMinutesFromNow;
  }

  /**
   * Crée un header d'autorisation à partir des tokens
   */
  static getAuthorizationHeader(tokens: AuthTokens): string {
    return `${tokens.tokenType} ${tokens.accessToken}`;
  }

  /**
   * Parse un token JWT et retourne le payload
   */
  static parseJwtPayload(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Erreur lors du parsing du JWT:', error);
      return null;
    }
  }

  /**
   * Extrait la date d'expiration d'un token JWT
   */
  static getTokenExpiration(token: string): Date | null {
    const payload = this.parseJwtPayload(token);
    if (!payload || !payload.exp) return null;
    return new Date(payload.exp * 1000);
  }

  /**
   * Crée des tokens avec les dates d'expiration calculées
   */
  static createTokensWithExpiration(
    accessToken: string,
    refreshToken: string,
    tokenType: string = 'Bearer'
  ): AuthTokens {
    return {
      accessToken,
      refreshToken,
      tokenType,
      expiresAt: this.getTokenExpiration(accessToken),
      refreshExpiresAt: this.getTokenExpiration(refreshToken),
    };
  }
}