/**
 * Modèles utilisateur pour l'application NAVIPAD
 * 
 * @description Représente un amodiataire connecté avec toutes ses informations
 * Converti depuis le modèle Flutter user.dart
 */

import { MediaItem } from '../types/common';

/**
 * Modèle utilisateur principal
 * Représente un amodiataire connecté avec toutes ses informations
 */
export interface User {
  /** Identifiant unique de l'utilisateur */
  id: string;
  /** Nom de l'entreprise */
  companyName: string;
  /** Email administrateur */
  adminEmail: string;
  /** Nom du responsable */
  responsibleName?: string;
  /** Type d'entité (entreprise, particulier, etc.) */
  entityType?: string;
  /** Secteur d'activité */
  activitySector?: string;
  /** Numéro de registre de commerce */
  tradeRegisterNumber?: string;
  /** Numéro d'identification fiscale */
  nif?: string;
  /** Adresse administrative */
  adminAddress?: string;
  /** Téléphone administrateur */
  adminPhone?: string;
  /** Mobile administrateur */
  adminMobile?: string;
  /** Nom du représentant légal */
  legalRepresentativeName?: string;
  /** Rôle du représentant légal */
  legalRepresentativeRole?: string;
  /** Adresse physique */
  physicalAddress?: string;
  /** Latitude GPS */
  gpsLat?: string;
  /** Longitude GPS */
  gpsLng?: string;
  /** Description de la localisation */
  locationDescription?: string;
  /** Description de l'entreprise */
  description?: string;
  /** URL du logo */
  logoUrl?: string;
  /** URLs des photos */
  photosUrls: string[];
  /** URLs des vidéos */
  videosUrls: string[];
  /** Médias structurés */
  media?: UserMedia;
  /** Statut de vérification */
  isVerified: boolean;
  /** Compte gelé */
  isFrozen: boolean;
  /** Date de création */
  createdAt?: Date;
  /** Date de mise à jour */
  updatedAt?: Date;
}

/**
 * Médias utilisateur structurés
 */
export interface UserMedia {
  /** Logo de l'entreprise */
  logo?: MediaItem;
  /** Photos de l'entreprise */
  photos: MediaItem[];
  /** Vidéos de l'entreprise */
  videos: MediaItem[];
  /** Documents administratifs */
  documents?: UserDocuments;
}

/**
 * Documents administratifs de l'utilisateur
 */
export interface UserDocuments {
  /** Document d'identité */
  identityDocument?: MediaItem;
  /** Registre de commerce */
  tradeRegister?: MediaItem;
  /** Attestation de localisation */
  locationAttestation?: MediaItem;
  /** Photos d'accès */
  accessPhotos?: MediaItem;
}

/**
 * Fonctions utilitaires pour le modèle User
 */
export class UserUtils {
  /**
   * Vérifie si l'utilisateur a une position GPS valide
   */
  static hasLocation(user: User): boolean {
    if (!user.gpsLat || !user.gpsLng) return false;
    if (user.gpsLat.trim() === '' || user.gpsLng.trim() === '') return false;
    
    const lat = parseFloat(user.gpsLat);
    const lng = parseFloat(user.gpsLng);
    
    if (isNaN(lat) || isNaN(lng)) return false;
    if (lat === 0.0 && lng === 0.0) return false; // Coordonnées invalides
    
    return true;
  }

  /**
   * Retourne les coordonnées GPS de l'utilisateur
   */
  static getCoordinates(user: User): { latitude: number; longitude: number } | null {
    if (!this.hasLocation(user)) return null;
    
    const lat = parseFloat(user.gpsLat!);
    const lng = parseFloat(user.gpsLng!);
    
    if (isNaN(lat) || isNaN(lng)) return null;
    
    return { latitude: lat, longitude: lng };
  }

  /**
   * Vérifie si l'utilisateur a des médias
   */
  static hasMedia(user: User): boolean {
    return user.photosUrls.length > 0 || 
           user.videosUrls.length > 0 || 
           !!user.logoUrl;
  }

  /**
   * Retourne le nombre total de médias
   */
  static getMediaCount(user: User): number {
    return user.photosUrls.length + 
           user.videosUrls.length + 
           (user.logoUrl ? 1 : 0);
  }

  /**
   * Vérifie si l'utilisateur a des informations de contact
   */
  static hasContactInfo(user: User): boolean {
    return !!user.adminPhone || !!user.adminMobile || !!user.adminEmail;
  }

  /**
   * Retourne le nom d'affichage de l'utilisateur
   */
  static getDisplayName(user: User): string {
    return user.responsibleName || user.companyName;
  }

  /**
   * Retourne le téléphone principal de l'utilisateur
   */
  static getPrimaryPhone(user: User): string | null {
    return user.adminMobile || user.adminPhone || null;
  }
}