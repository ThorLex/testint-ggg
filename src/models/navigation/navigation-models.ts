/**
 * Modèles de navigation en temps réel
 * 
 * @description Gestion de la navigation GPS avec instructions et alertes
 * Converti depuis le modèle Flutter navigation_models.dart
 */

import { Coordinates } from '../types/common';

/**
 * États de la navigation en temps réel
 */
export enum NavigationStatus {
  /** Pas de navigation active */
  IDLE = 'idle',
  /** Calcul de l'itinéraire */
  CALCULATING = 'calculating',
  /** Prêt à démarrer */
  READY = 'ready',
  /** Navigation en cours */
  NAVIGATING = 'navigating',
  /** Recalcul en cours */
  RECALCULATING = 'recalculating',
  /** Navigation en pause */
  PAUSED = 'paused',
  /** Arrivé à destination */
  COMPLETED = 'completed',
  /** Navigation annulée */
  CANCELLED = 'cancelled',
  /** Erreur de navigation */
  ERROR = 'error',
}

/**
 * Types d'instructions de navigation
 */
export enum NavigationInstructionType {
  /** Démarrer */
  START = 'start',
  /** Tourner à gauche */
  TURN_LEFT = 'turn_left',
  /** Tourner à droite */
  TURN_RIGHT = 'turn_right',
  /** Tourner légèrement à gauche */
  TURN_SLIGHT_LEFT = 'turn_slight_left',
  /** Tourner légèrement à droite */
  TURN_SLIGHT_RIGHT = 'turn_slight_right',
  /** Tourner fortement à gauche */
  TURN_SHARP_LEFT = 'turn_sharp_left',
  /** Tourner fortement à droite */
  TURN_SHARP_RIGHT = 'turn_sharp_right',
  /** Demi-tour à gauche */
  UTURN_LEFT = 'uturn_left',
  /** Demi-tour à droite */
  UTURN_RIGHT = 'uturn_right',
  /** Continuer tout droit */
  STRAIGHT = 'straight',
  /** Fusionner */
  MERGE = 'merge',
  /** Rond-point */
  ROUNDABOUT = 'roundabout',
  /** Sortir du rond-point */
  EXIT_ROUNDABOUT = 'exit_roundabout',
  /** Ferry */
  FERRY = 'ferry',
  /** Bretelle à gauche */
  RAMP_LEFT = 'ramp_left',
  /** Bretelle à droite */
  RAMP_RIGHT = 'ramp_right',
  /** Bifurcation à gauche */
  FORK_LEFT = 'fork_left',
  /** Bifurcation à droite */
  FORK_RIGHT = 'fork_right',
  /** Garder la gauche */
  KEEP_LEFT = 'keep_left',
  /** Garder la droite */
  KEEP_RIGHT = 'keep_right',
  /** Arrivée à destination */
  DESTINATION = 'destination',
}

/**
 * Types d'alertes de navigation
 */
export enum NavigationAlertType {
  /** Radar de vitesse */
  SPEED_CAMERA = 'speed_camera',
  /** Embouteillage */
  TRAFFIC_JAM = 'traffic_jam',
  /** Accident */
  ACCIDENT = 'accident',
  /** Travaux */
  ROAD_WORK = 'road_work',
  /** Route fermée */
  CLOSURE = 'closure',
  /** Conditions météo */
  WEATHER = 'weather',
  /** Contrôle police */
  POLICE = 'police',
  /** Danger */
  HAZARD = 'hazard',
}

/**
 * Instruction de navigation
 */
export interface NavigationInstruction {
  /** Identifiant unique */
  id: string;
  /** Type d'instruction */
  type: NavigationInstructionType;
  /** Texte de l'instruction */
  text: string;
  /** Texte à prononcer */
  spokenText: string;
  /** Distance en mètres */
  distanceMeters: number;
  /** Temps estimé */
  estimatedTime: number; // en secondes
  /** Position GPS */
  location: Coordinates;
  /** Nom de la rue */
  streetName?: string;
  /** Numéro de sortie */
  exitNumber?: string;
  /** Numéro de sortie de rond-point */
  roundaboutExitNumber?: number;
  /** Instruction complétée */
  isCompleted: boolean;
  /** Instruction active */
  isActive: boolean;
}

/**
 * Alerte de navigation
 */
export interface NavigationAlert {
  /** Identifiant unique */
  id: string;
  /** Type d'alerte */
  type: NavigationAlertType;
  /** Titre de l'alerte */
  title: string;
  /** Description */
  description: string;
  /** Position GPS */
  location: Coordinates;
  /** Distance depuis l'utilisateur */
  distanceFromUser: number;
  /** Alerte active */
  isActive: boolean;
  /** Date d'expiration */
  expiresAt?: Date;
}

/**
 * Statistiques de navigation
 */
export interface NavigationStats {
  /** Distance totale en mètres */
  totalDistance: number;
  /** Distance restante en mètres */
  remainingDistance: number;
  /** Temps total en secondes */
  totalTime: number;
  /** Temps restant en secondes */
  remainingTime: number;
  /** Temps écoulé en secondes */
  elapsedTime: number;
  /** Vitesse moyenne en km/h */
  averageSpeed: number;
  /** Vitesse actuelle en km/h */
  currentSpeed: number;
  /** Vitesse maximale en km/h */
  maxSpeed: number;
  /** Instructions complétées */
  completedInstructions: number;
  /** Total d'instructions */
  totalInstructions: number;
  /** Heure de départ */
  startTime?: Date;
  /** Heure d'arrivée estimée */
  estimatedArrival?: Date;
}

/**
 * Configuration de navigation
 */
export interface NavigationConfig {
  /** Voix activée */
  voiceEnabled: boolean;
  /** Volume de la voix (0-1) */
  voiceVolume: number;
  /** Langue de la voix */
  voiceLanguage: string;
  /** Alertes activées */
  alertsEnabled: boolean;
  /** Alertes radars */
  speedCameraAlerts: boolean;
  /** Alertes trafic */
  trafficAlerts: boolean;
  /** Recalcul automatique */
  autoRecalculate: boolean;
  /** Seuil de recalcul en mètres */
  recalculateThresholdMeters: number;
  /** Garder l'écran allumé */
  keepScreenOn: boolean;
  /** Afficher la limitation de vitesse */
  showSpeedLimit: boolean;
  /** Afficher la vitesse actuelle */
  showCurrentSpeed: boolean;
  /** Temps d'avance pour les instructions (secondes) */
  instructionAdvanceTime: number;
  /** Intervalle de mise à jour de position (secondes) */
  locationUpdateInterval: number;
}

/**
 * État complet de la navigation
 */
export interface NavigationState {
  /** Statut actuel */
  status: NavigationStatus;
  /** Point de départ */
  origin: Coordinates | null;
  /** Destination */
  destination: Coordinates | null;
  /** Position actuelle */
  currentLocation: Coordinates | null;
  /** Points de la route */
  routePoints: Coordinates[];
  /** Instructions de navigation */
  instructions: NavigationInstruction[];
  /** Instruction actuelle */
  currentInstruction: NavigationInstruction | null;
  /** Prochaine instruction */
  nextInstruction: NavigationInstruction | null;
  /** Alertes actives */
  alerts: NavigationAlert[];
  /** Statistiques */
  stats: NavigationStats | null;
  /** Configuration */
  config: NavigationConfig | null;
  /** Message d'erreur */
  errorMessage: string | null;
  /** Cap en degrés */
  bearing: number;
  /** Précision GPS en mètres */
  accuracy: number;
  /** Hors route */
  isOffRoute: boolean;
  /** Recalcul en cours */
  isRerouting: boolean;
  /** Dernière mise à jour de position */
  lastLocationUpdate: Date | null;
}

/**
 * Configuration par défaut de la navigation
 */
export const defaultNavigationConfig: NavigationConfig = {
  voiceEnabled: true,
  voiceVolume: 1.0,
  voiceLanguage: 'fr-FR',
  alertsEnabled: true,
  speedCameraAlerts: true,
  trafficAlerts: true,
  autoRecalculate: true,
  recalculateThresholdMeters: 50.0,
  keepScreenOn: true,
  showSpeedLimit: true,
  showCurrentSpeed: true,
  instructionAdvanceTime: 5,
  locationUpdateInterval: 30,
};

/**
 * État initial de la navigation
 */
export const initialNavigationState: NavigationState = {
  status: NavigationStatus.IDLE,
  origin: null,
  destination: null,
  currentLocation: null,
  routePoints: [],
  instructions: [],
  currentInstruction: null,
  nextInstruction: null,
  alerts: [],
  stats: null,
  config: null,
  errorMessage: null,
  bearing: 0.0,
  accuracy: 0.0,
  isOffRoute: false,
  isRerouting: false,
  lastLocationUpdate: null,
};

/**
 * Extensions utilitaires pour les types d'instructions
 */
export class NavigationInstructionTypeUtils {
  /**
   * Retourne l'icône pour l'instruction
   */
  static getIcon(type: NavigationInstructionType): string {
    const icons: Record<NavigationInstructionType, string> = {
      [NavigationInstructionType.START]: '🚀',
      [NavigationInstructionType.TURN_LEFT]: '↰',
      [NavigationInstructionType.TURN_RIGHT]: '↱',
      [NavigationInstructionType.TURN_SLIGHT_LEFT]: '↖',
      [NavigationInstructionType.TURN_SLIGHT_RIGHT]: '↗',
      [NavigationInstructionType.TURN_SHARP_LEFT]: '↙',
      [NavigationInstructionType.TURN_SHARP_RIGHT]: '↘',
      [NavigationInstructionType.UTURN_LEFT]: '↩',
      [NavigationInstructionType.UTURN_RIGHT]: '↩',
      [NavigationInstructionType.STRAIGHT]: '↑',
      [NavigationInstructionType.MERGE]: '🔀',
      [NavigationInstructionType.ROUNDABOUT]: '🔄',
      [NavigationInstructionType.EXIT_ROUNDABOUT]: '🔄',
      [NavigationInstructionType.FERRY]: '⛴',
      [NavigationInstructionType.RAMP_LEFT]: '↰',
      [NavigationInstructionType.RAMP_RIGHT]: '↱',
      [NavigationInstructionType.FORK_LEFT]: '↖',
      [NavigationInstructionType.FORK_RIGHT]: '↗',
      [NavigationInstructionType.KEEP_LEFT]: '↖',
      [NavigationInstructionType.KEEP_RIGHT]: '↗',
      [NavigationInstructionType.DESTINATION]: '🏁',
    };

    return icons[type] || '➡';
  }

  /**
   * Retourne la couleur pour l'instruction
   */
  static getColor(type: NavigationInstructionType): string {
    const colors: Record<NavigationInstructionType, string> = {
      [NavigationInstructionType.START]: '#4CAF50',
      [NavigationInstructionType.TURN_LEFT]: '#2196F3',
      [NavigationInstructionType.TURN_RIGHT]: '#2196F3',
      [NavigationInstructionType.TURN_SLIGHT_LEFT]: '#2196F3',
      [NavigationInstructionType.TURN_SLIGHT_RIGHT]: '#2196F3',
      [NavigationInstructionType.TURN_SHARP_LEFT]: '#FF9800',
      [NavigationInstructionType.TURN_SHARP_RIGHT]: '#FF9800',
      [NavigationInstructionType.UTURN_LEFT]: '#FF9800',
      [NavigationInstructionType.UTURN_RIGHT]: '#FF9800',
      [NavigationInstructionType.STRAIGHT]: '#4CAF50',
      [NavigationInstructionType.MERGE]: '#9C27B0',
      [NavigationInstructionType.ROUNDABOUT]: '#9C27B0',
      [NavigationInstructionType.EXIT_ROUNDABOUT]: '#9C27B0',
      [NavigationInstructionType.FERRY]: '#00BCD4',
      [NavigationInstructionType.RAMP_LEFT]: '#2196F3',
      [NavigationInstructionType.RAMP_RIGHT]: '#2196F3',
      [NavigationInstructionType.FORK_LEFT]: '#2196F3',
      [NavigationInstructionType.FORK_RIGHT]: '#2196F3',
      [NavigationInstructionType.KEEP_LEFT]: '#2196F3',
      [NavigationInstructionType.KEEP_RIGHT]: '#2196F3',
      [NavigationInstructionType.DESTINATION]: '#F44336',
    };

    return colors[type] || '#757575';
  }
}

/**
 * Extensions utilitaires pour les types d'alertes
 */
export class NavigationAlertTypeUtils {
  /**
   * Retourne l'icône pour l'alerte
   */
  static getIcon(type: NavigationAlertType): string {
    const icons: Record<NavigationAlertType, string> = {
      [NavigationAlertType.SPEED_CAMERA]: '📷',
      [NavigationAlertType.TRAFFIC_JAM]: '🚗',
      [NavigationAlertType.ACCIDENT]: '⚠️',
      [NavigationAlertType.ROAD_WORK]: '🚧',
      [NavigationAlertType.CLOSURE]: '🚫',
      [NavigationAlertType.WEATHER]: '🌧️',
      [NavigationAlertType.POLICE]: '👮',
      [NavigationAlertType.HAZARD]: '⚠️',
    };

    return icons[type] || '⚠️';
  }

  /**
   * Retourne la couleur pour l'alerte
   */
  static getColor(type: NavigationAlertType): string {
    const colors: Record<NavigationAlertType, string> = {
      [NavigationAlertType.SPEED_CAMERA]: '#FF5722',
      [NavigationAlertType.TRAFFIC_JAM]: '#FF9800',
      [NavigationAlertType.ACCIDENT]: '#F44336',
      [NavigationAlertType.ROAD_WORK]: '#FF9800',
      [NavigationAlertType.CLOSURE]: '#F44336',
      [NavigationAlertType.WEATHER]: '#2196F3',
      [NavigationAlertType.POLICE]: '#3F51B5',
      [NavigationAlertType.HAZARD]: '#FF5722',
    };

    return colors[type] || '#FF5722';
  }
}

/**
 * Fonctions utilitaires pour la navigation
 */
export class NavigationUtils {
  /**
   * Formate une distance en mètres vers un texte lisible
   */
  static formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  }

  /**
   * Formate une durée en secondes vers un texte lisible
   */
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else {
      return `${minutes}min`;
    }
  }

  /**
   * Formate une vitesse en km/h
   */
  static formatSpeed(kmh: number): string {
    return `${Math.round(kmh)} km/h`;
  }

  /**
   * Calcule l'heure d'arrivée estimée
   */
  static calculateETA(remainingSeconds: number): Date {
    return new Date(Date.now() + remainingSeconds * 1000);
  }

  /**
   * Vérifie si une alerte est encore valide
   */
  static isAlertValid(alert: NavigationAlert): boolean {
    if (!alert.expiresAt) return true;
    return new Date() < alert.expiresAt;
  }

  /**
   * Filtre les alertes valides
   */
  static getValidAlerts(alerts: NavigationAlert[]): NavigationAlert[] {
    return alerts.filter(alert => this.isAlertValid(alert));
  }

  /**
   * Trouve l'instruction active
   */
  static findActiveInstruction(instructions: NavigationInstruction[]): NavigationInstruction | null {
    return instructions.find(instruction => instruction.isActive) || null;
  }

  /**
   * Trouve la prochaine instruction
   */
  static findNextInstruction(instructions: NavigationInstruction[]): NavigationInstruction | null {
    const activeIndex = instructions.findIndex(instruction => instruction.isActive);
    if (activeIndex >= 0 && activeIndex < instructions.length - 1) {
      return instructions[activeIndex + 1];
    }
    return null;
  }

  /**
   * Calcule le pourcentage de progression
   */
  static calculateProgress(stats: NavigationStats): number {
    if (stats.totalDistance === 0) return 0;
    return ((stats.totalDistance - stats.remainingDistance) / stats.totalDistance) * 100;
  }
}