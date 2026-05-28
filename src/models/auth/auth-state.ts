/**
 * État d'authentification de l'application
 * 
 * @description Gestion de l'état global d'authentification
 * Converti depuis le modèle Flutter auth_state.dart
 */

import { User } from './user';
import { AuthTokens } from './auth-tokens';

/**
 * États possibles de l'authentification
 */
export enum AuthStatus {
  /** État initial, non déterminé */
  INITIAL = 'initial',
  /** Utilisateur non authentifié */
  UNAUTHENTICATED = 'unauthenticated',
  /** En cours d'authentification */
  AUTHENTICATING = 'authenticating',
  /** Utilisateur authentifié */
  AUTHENTICATED = 'authenticated',
  /** En cours de rafraîchissement des tokens */
  REFRESHING = 'refreshing',
  /** Erreur d'authentification */
  ERROR = 'error',
  /** Déconnexion en cours */
  LOGGING_OUT = 'logging_out',
}

/**
 * État complet de l'authentification
 */
export interface AuthState {
  /** Statut actuel de l'authentification */
  status: AuthStatus;
  /** Utilisateur connecté */
  user: User | null;
  /** Tokens d'authentification */
  tokens: AuthTokens | null;
  /** Message d'erreur éventuel */
  errorMessage: string | null;
  /** Code d'erreur */
  errorCode: string | null;
  /** Indique si c'est la première connexion */
  isFirstLogin: boolean;
  /** Indique si l'utilisateur a accepté les conditions */
  hasAcceptedTerms: boolean;
  /** Indique si le profil est complet */
  isProfileComplete: boolean;
  /** Dernière activité */
  lastActivity: Date | null;
  /** Tentatives de connexion échouées */
  failedLoginAttempts: number;
  /** Compte temporairement bloqué */
  isTemporarilyBlocked: boolean;
  /** Date de fin de blocage */
  blockExpiresAt: Date | null;
}

/**
 * Actions d'authentification
 */
export interface AuthActions {
  /** Connexion avec email/mot de passe */
  login: (email: string, password: string) => Promise<void>;
  /** Déconnexion */
  logout: () => Promise<void>;
  /** Inscription */
  register: (data: any) => Promise<void>;
  /** Rafraîchissement des tokens */
  refreshTokens: () => Promise<void>;
  /** Réinitialisation du mot de passe */
  forgotPassword: (email: string) => Promise<void>;
  /** Nouveau mot de passe */
  resetPassword: (token: string, password: string) => Promise<void>;
  /** Mise à jour du profil */
  updateProfile: (data: Partial<User>) => Promise<void>;
  /** Vérification de l'email */
  verifyEmail: (token: string) => Promise<void>;
  /** Renvoi de l'email de vérification */
  resendVerificationEmail: () => Promise<void>;
  /** Effacement des erreurs */
  clearError: () => void;
  /** Acceptation des conditions */
  acceptTerms: () => void;
  /** Marquer le profil comme complet */
  markProfileComplete: () => void;
}

/**
 * État initial de l'authentification
 */
export const initialAuthState: AuthState = {
  status: AuthStatus.INITIAL,
  user: null,
  tokens: null,
  errorMessage: null,
  errorCode: null,
  isFirstLogin: false,
  hasAcceptedTerms: false,
  isProfileComplete: false,
  lastActivity: null,
  failedLoginAttempts: 0,
  isTemporarilyBlocked: false,
  blockExpiresAt: null,
};

/**
 * Fonctions utilitaires pour l'état d'authentification
 */
export class AuthStateUtils {
  /**
   * Vérifie si l'utilisateur est authentifié
   */
  static isAuthenticated(state: AuthState): boolean {
    return state.status === AuthStatus.AUTHENTICATED && 
           state.user !== null && 
           state.tokens !== null;
  }

  /**
   * Vérifie si l'authentification est en cours
   */
  static isLoading(state: AuthState): boolean {
    return [
      AuthStatus.AUTHENTICATING,
      AuthStatus.REFRESHING,
      AuthStatus.LOGGING_OUT,
    ].includes(state.status);
  }

  /**
   * Vérifie si il y a une erreur
   */
  static hasError(state: AuthState): boolean {
    return state.status === AuthStatus.ERROR && state.errorMessage !== null;
  }

  /**
   * Vérifie si le compte est temporairement bloqué
   */
  static isBlocked(state: AuthState): boolean {
    if (!state.isTemporarilyBlocked || !state.blockExpiresAt) return false;
    return new Date() < state.blockExpiresAt;
  }

  /**
   * Calcule le temps restant avant déblocage
   */
  static getBlockTimeRemaining(state: AuthState): number {
    if (!state.isTemporarilyBlocked || !state.blockExpiresAt) return 0;
    const now = new Date().getTime();
    const blockExpires = state.blockExpiresAt.getTime();
    return Math.max(0, blockExpires - now);
  }

  /**
   * Vérifie si l'utilisateur doit compléter son profil
   */
  static needsProfileCompletion(state: AuthState): boolean {
    return this.isAuthenticated(state) && !state.isProfileComplete;
  }

  /**
   * Vérifie si l'utilisateur doit accepter les conditions
   */
  static needsTermsAcceptance(state: AuthState): boolean {
    return this.isAuthenticated(state) && !state.hasAcceptedTerms;
  }

  /**
   * Vérifie si c'est la première connexion
   */
  static isFirstLogin(state: AuthState): boolean {
    return this.isAuthenticated(state) && state.isFirstLogin;
  }

  /**
   * Retourne un message d'erreur localisé
   */
  static getLocalizedError(state: AuthState): string | null {
    if (!state.errorMessage) return null;

    // Mapping des codes d'erreur vers des messages localisés
    const errorMessages: Record<string, string> = {
      'invalid_credentials': 'Email ou mot de passe incorrect',
      'account_not_found': 'Compte non trouvé',
      'account_disabled': 'Compte désactivé',
      'account_not_verified': 'Compte non vérifié',
      'too_many_attempts': 'Trop de tentatives, compte temporairement bloqué',
      'token_expired': 'Session expirée, veuillez vous reconnecter',
      'token_invalid': 'Token invalide',
      'network_error': 'Erreur de connexion',
      'server_error': 'Erreur du serveur',
      'validation_error': 'Données invalides',
      'email_already_exists': 'Cette adresse email est déjà utilisée',
      'weak_password': 'Le mot de passe est trop faible',
      'password_mismatch': 'Les mots de passe ne correspondent pas',
    };

    return errorMessages[state.errorCode || ''] || state.errorMessage;
  }

  /**
   * Crée un nouvel état avec un utilisateur connecté
   */
  static createAuthenticatedState(
    user: User,
    tokens: AuthTokens,
    isFirstLogin: boolean = false
  ): AuthState {
    return {
      ...initialAuthState,
      status: AuthStatus.AUTHENTICATED,
      user,
      tokens,
      isFirstLogin,
      lastActivity: new Date(),
      failedLoginAttempts: 0,
      isTemporarilyBlocked: false,
      blockExpiresAt: null,
    };
  }

  /**
   * Crée un nouvel état d'erreur
   */
  static createErrorState(
    errorMessage: string,
    errorCode?: string,
    failedAttempts?: number
  ): AuthState {
    return {
      ...initialAuthState,
      status: AuthStatus.ERROR,
      errorMessage,
      errorCode: errorCode || null,
      failedLoginAttempts: failedAttempts || 0,
    };
  }
}