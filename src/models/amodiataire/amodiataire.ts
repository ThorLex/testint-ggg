/**
 * Modèles amodiataire pour l'affichage public et la gestion
 * 
 * @description Version simplifiée pour la carte et les listes, plus version complète pour la gestion
 * Converti depuis le modèle Flutter amodiataire.dart
 */

import { User, UserMedia } from '../auth/user';
import { Coordinates } from '../types/common';

/**
 * Modèle amodiataire pour l'affichage public
 * Version simplifiée pour la carte et les listes
 */
export interface Amodiataire {
  /** Identifiant unique */
  id: string;
  /** Nom de l'entreprise */
  companyName: string;
  /** Description de l'entreprise */
  description?: string;
  /** URL du logo */
  logoUrl?: string;
  /** Secteur d'activité */
  activitySector?: string;
  /** Expérience */
  experience?: string;
  /** URLs des photos */
  photosUrls: string[];
  /** URLs des vidéos */
  videosUrls: string[];
  /** Nom du responsable */
  responsibleName?: string;
  /** Type d'entité */
  entityType?: string;
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
  /** Email administrateur */
  adminEmail?: string;
  /** Nom du représentant légal */
  legalRepresentativeName?: string;
  /** Rôle du représentant légal */
  legalRepresentativeRole?: string;
  /** Adresse physique */
  physicalAddress?: string;
  /** Latitude GPS (string pour compatibilité API) */
  gpsLat?: string;
  /** Longitude GPS (string pour compatibilité API) */
  gpsLng?: string;
  /** Description de la localisation */
  locationDescription?: string;
  /** Documents administratifs */
  documents?: AmodiataireDocuments;
  /** Contact principal */
  contact?: string;
  /** Statut de vérification */
  isVerified: boolean;
  /** Note moyenne */
  rating: number;
  /** Nombre d'avis */
  reviewCount: number;
  /** Date de création */
  createdAt?: Date;
  /** Date de mise à jour */
  updatedAt?: Date;
}

/**
 * Documents d'amodiataire
 */
export interface AmodiataireDocuments {
  /** Document d'identité */
  identityDocument?: string;
  /** Registre de commerce */
  tradeRegister?: string;
  /** Attestation de localisation */
  locationAttestation?: string;
  /** Photos d'accès */
  accessPhotos?: string;
}

/**
 * Position d'un amodiataire avec méthodes utilitaires
 */
export interface AmodiataireLocation extends Coordinates {
  /** Adresse textuelle */
  address?: string;
  /** Description de la localisation */
  description?: string;
}

/**
 * Profil complet d'amodiataire (version authentifiée)
 */
export interface AmodiataireProfile {
  /** Identifiant unique */
  id: string;
  /** Nom de l'entreprise */
  companyName: string;
  /** Email administrateur */
  adminEmail: string;
  /** Nom du responsable */
  responsibleName?: string;
  /** Type d'entité */
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
  /** Profil public */
  isPublic: boolean;
  /** Date de création */
  createdAt?: Date;
  /** Date de mise à jour */
  updatedAt?: Date;
}

/**
 * Détails d'amodiataire pour l'affichage détaillé
 */
export interface AmodiataireDetails extends Amodiataire {
  /** Horaires d'ouverture */
  openingHours?: OpeningHours;
  /** Services proposés */
  services: string[];
  /** Équipements disponibles */
  equipment: string[];
  /** Avis clients */
  reviews: AmodiataireReview[];
  /** Galerie de photos */
  gallery: GalleryItem[];
  /** Informations de contact étendues */
  extendedContact?: ExtendedContact;
  /** Certifications */
  certifications: string[];
  /** Langues parlées */
  languages: string[];
}

/**
 * Horaires d'ouverture
 */
export interface OpeningHours {
  /** Lundi */
  monday?: DaySchedule;
  /** Mardi */
  tuesday?: DaySchedule;
  /** Mercredi */
  wednesday?: DaySchedule;
  /** Jeudi */
  thursday?: DaySchedule;
  /** Vendredi */
  friday?: DaySchedule;
  /** Samedi */
  saturday?: DaySchedule;
  /** Dimanche */
  sunday?: DaySchedule;
  /** Jours fériés */
  holidays?: DaySchedule;
  /** Notes spéciales */
  notes?: string;
}

/**
 * Horaire d'une journée
 */
export interface DaySchedule {
  /** Ouvert ce jour */
  isOpen: boolean;
  /** Heure d'ouverture matin */
  morningOpen?: string;
  /** Heure de fermeture matin */
  morningClose?: string;
  /** Heure d'ouverture après-midi */
  afternoonOpen?: string;
  /** Heure de fermeture après-midi */
  afternoonClose?: string;
  /** Ouvert 24h/24 */
  is24Hours?: boolean;
  /** Notes spéciales pour ce jour */
  notes?: string;
}

/**
 * Avis client
 */
export interface AmodiataireReview {
  /** Identifiant de l'avis */
  id: string;
  /** Nom du client (anonymisé) */
  clientName: string;
  /** Note (1-5) */
  rating: number;
  /** Commentaire */
  comment: string;
  /** Date de l'avis */
  createdAt: Date;
  /** Réponse de l'amodiataire */
  response?: string;
  /** Date de la réponse */
  responseDate?: Date;
  /** Avis vérifié */
  isVerified: boolean;
}

/**
 * Élément de galerie
 */
export interface GalleryItem {
  /** Identifiant */
  id: string;
  /** URL de l'image/vidéo */
  url: string;
  /** URL de la miniature */
  thumbnailUrl?: string;
  /** Type (image, video) */
  type: 'image' | 'video';
  /** Titre */
  title?: string;
  /** Description */
  description?: string;
  /** Ordre d'affichage */
  order: number;
}

/**
 * Informations de contact étendues
 */
export interface ExtendedContact {
  /** Site web */
  website?: string;
  /** Facebook */
  facebook?: string;
  /** Instagram */
  instagram?: string;
  /** LinkedIn */
  linkedin?: string;
  /** WhatsApp */
  whatsapp?: string;
  /** Telegram */
  telegram?: string;
  /** Skype */
  skype?: string;
}

/**
 * Fonctions utilitaires pour les amodiataires
 */
export class AmodiataireUtils {
  /**
   * Vérifie si l'amodiataire a une position GPS valide
   */
  static hasLocation(amodiataire: Amodiataire): boolean {
    if (!amodiataire.gpsLat || !amodiataire.gpsLng) return false;
    if (amodiataire.gpsLat.trim() === '' || amodiataire.gpsLng.trim() === '') return false;
    
    const lat = parseFloat(amodiataire.gpsLat);
    const lng = parseFloat(amodiataire.gpsLng);
    
    if (isNaN(lat) || isNaN(lng)) return false;
    if (lat === 0.0 && lng === 0.0) return false; // Coordonnées invalides
    
    return true;
  }

  /**
   * Retourne la position GPS sous forme de coordonnées
   */
  static getLocation(amodiataire: Amodiataire): AmodiataireLocation | null {
    if (!this.hasLocation(amodiataire)) return null;
    
    const lat = parseFloat(amodiataire.gpsLat!);
    const lng = parseFloat(amodiataire.gpsLng!);
    
    if (isNaN(lat) || isNaN(lng)) return null;
    
    return {
      latitude: lat,
      longitude: lng,
      address: amodiataire.physicalAddress,
      description: amodiataire.locationDescription,
    };
  }

  /**
   * Vérifie si l'amodiataire a des médias
   */
  static hasMedia(amodiataire: Amodiataire): boolean {
    return amodiataire.photosUrls.length > 0 || 
           amodiataire.videosUrls.length > 0 || 
           !!amodiataire.logoUrl;
  }

  /**
   * Retourne le nombre total de médias
   */
  static getMediaCount(amodiataire: Amodiataire): number {
    return amodiataire.photosUrls.length + 
           amodiataire.videosUrls.length + 
           (amodiataire.logoUrl ? 1 : 0);
  }

  /**
   * Vérifie si l'amodiataire a des informations de contact
   */
  static hasContactInfo(amodiataire: Amodiataire): boolean {
    return !!amodiataire.adminPhone || 
           !!amodiataire.adminMobile || 
           !!amodiataire.adminEmail;
  }

  /**
   * Retourne le téléphone principal
   */
  static getPrimaryPhone(amodiataire: Amodiataire): string | null {
    return amodiataire.adminMobile || amodiataire.adminPhone || null;
  }

  /**
   * Calcule la distance entre deux positions (formule de Haversine)
   */
  static calculateDistance(
    location1: AmodiataireLocation,
    location2: AmodiataireLocation
  ): number {
    const earthRadius = 6371; // Rayon de la Terre en km
    
    const lat1Rad = (location1.latitude * Math.PI) / 180;
    const lat2Rad = (location2.latitude * Math.PI) / 180;
    const deltaLatRad = ((location2.latitude - location1.latitude) * Math.PI) / 180;
    const deltaLngRad = ((location2.longitude - location1.longitude) * Math.PI) / 180;

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
        Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return earthRadius * c;
  }

  /**
   * Convertit un profil d'amodiataire en User pour l'authentification
   */
  static profileToUser(profile: AmodiataireProfile): User {
    return {
      id: profile.id,
      companyName: profile.companyName,
      adminEmail: profile.adminEmail,
      responsibleName: profile.responsibleName,
      entityType: profile.entityType,
      activitySector: profile.activitySector,
      tradeRegisterNumber: profile.tradeRegisterNumber,
      nif: profile.nif,
      adminAddress: profile.adminAddress,
      adminPhone: profile.adminPhone,
      adminMobile: profile.adminMobile,
      legalRepresentativeName: profile.legalRepresentativeName,
      legalRepresentativeRole: profile.legalRepresentativeRole,
      physicalAddress: profile.physicalAddress,
      gpsLat: profile.gpsLat,
      gpsLng: profile.gpsLng,
      locationDescription: profile.locationDescription,
      description: profile.description,
      logoUrl: profile.logoUrl,
      photosUrls: profile.photosUrls,
      videosUrls: profile.videosUrls,
      media: profile.media,
      isVerified: profile.isVerified,
      isFrozen: profile.isFrozen,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  /**
   * Formate la note avec des étoiles
   */
  static formatRating(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
  }

  /**
   * Vérifie si l'amodiataire est ouvert maintenant
   */
  static isOpenNow(openingHours?: OpeningHours): boolean {
    if (!openingHours) return false;
    
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = dimanche, 1 = lundi, etc.
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek] as keyof OpeningHours;
    const daySchedule = openingHours[dayName] as DaySchedule | undefined;
    
    if (!daySchedule || !daySchedule.isOpen) return false;
    if (daySchedule.is24Hours) return true;
    
    // Vérification des horaires matin
    if (daySchedule.morningOpen && daySchedule.morningClose) {
      if (currentTime >= daySchedule.morningOpen && currentTime <= daySchedule.morningClose) {
        return true;
      }
    }
    
    // Vérification des horaires après-midi
    if (daySchedule.afternoonOpen && daySchedule.afternoonClose) {
      if (currentTime >= daySchedule.afternoonOpen && currentTime <= daySchedule.afternoonClose) {
        return true;
      }
    }
    
    return false;
  }
}