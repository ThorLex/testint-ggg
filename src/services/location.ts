/**
 * Service de géolocalisation
 * 
 * Ce fichier gère toutes les fonctionnalités liées à la géolocalisation :
 * - Demande de permissions
 * - Récupération de la position actuelle
 * - Suivi de la position en temps réel
 * 
 * @module services/location
 */

import * as Location from 'expo-location';
import type { LocationPermissionStatus } from '@/types';

// ============================================================================
// Gestion des Permissions
// ============================================================================

/**
 * Demande la permission d'accès à la localisation
 * 
 * @returns Statut de la permission
 */
export async function requestLocationPermission(): Promise<LocationPermissionStatus> {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status === 'granted') {
            console.log('✅ Permission de localisation accordée');
            return 'granted';
        } else if (status === 'denied') {
            console.log('❌ Permission de localisation refusée');
            return 'denied';
        } else {
            console.log('⏳ Permission de localisation indéterminée');
            return 'undetermined';
        }
    } catch (error) {
        console.error('❌ Erreur lors de la demande de permission:', error);
        return 'denied';
    }
}

/**
 * Vérifie le statut actuel de la permission de localisation
 * 
 * @returns Statut de la permission
 */
export async function checkLocationPermission(): Promise<LocationPermissionStatus> {
    try {
        const { status } = await Location.getForegroundPermissionsAsync();

        if (status === 'granted') {
            return 'granted';
        } else if (status === 'denied') {
            return 'denied';
        } else {
            return 'undetermined';
        }
    } catch (error) {
        console.error('❌ Erreur lors de la vérification de permission:', error);
        return 'denied';
    }
}

/**
 * Vérifie si les services de localisation sont activés sur l'appareil
 * 
 * @returns true si activés, false sinon
 */
export async function isLocationEnabled(): Promise<boolean> {
    try {
        const enabled = await Location.hasServicesEnabledAsync();

        if (!enabled) {
            console.log('⚠️ Services de localisation désactivés');
        }

        return enabled;
    } catch (error) {
        console.error('❌ Erreur lors de la vérification des services:', error);
        return false;
    }
}

// ============================================================================
// Récupération de la Position
// ============================================================================

/**
 * Options pour la récupération de la position
 */
export interface LocationOptions {
    accuracy?: Location.LocationAccuracy;
    timeout?: number;
}

/**
 * Récupère la position actuelle de l'utilisateur
 * 
 * @param options - Options de localisation
 * @returns Position actuelle ou null en cas d'erreur
 */
export async function getCurrentLocation(
    options: LocationOptions = {}
): Promise<Location.LocationObject | null> {
    try {
        // Vérifier la permission
        const permission = await checkLocationPermission();
        if (permission !== 'granted') {
            console.log('⚠️ Permission de localisation non accordée');
            return null;
        }

        // Vérifier si les services sont activés
        const enabled = await isLocationEnabled();
        if (!enabled) {
            console.log('⚠️ Services de localisation désactivés');
            return null;
        }

        // Récupérer la position
        const location = await Location.getCurrentPositionAsync({
            accuracy: options.accuracy || Location.LocationAccuracy.Balanced,
            timeInterval: options.timeout || 10000,
        });

        console.log('📍 Position actuelle:', {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
        });

        return location;
    } catch (error) {
        console.error('❌ Erreur lors de la récupération de la position:', error);
        return null;
    }
}

/**
 * Récupère rapidement une position approximative (utilise le cache si disponible)
 * 
 * @returns Position ou null
 */
export async function getLastKnownLocation(): Promise<Location.LocationObject | null> {
    try {
        const permission = await checkLocationPermission();
        if (permission !== 'granted') {
            return null;
        }

        const location = await Location.getLastKnownPositionAsync({
            maxAge: 60000, // 1 minute
            requiredAccuracy: 100, // 100 mètres
        });

        if (location) {
            console.log('📍 Dernière position connue:', {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
        }

        return location;
    } catch (error) {
        console.error('❌ Erreur lors de la récupération de la dernière position:', error);
        return null;
    }
}

// ============================================================================
// Suivi de la Position en Temps Réel
// ============================================================================

/**
 * Type de callback pour le suivi de position
 */
export type LocationCallback = (location: Location.LocationObject) => void;

/**
 * Type de callback pour les erreurs de localisation
 */
export type LocationErrorCallback = (error: Error) => void;

/**
 * Démarre le suivi de la position en temps réel
 * 
 * @param callback - Fonction appelée à chaque mise à jour de position
 * @param errorCallback - Fonction appelée en cas d'erreur
 * @param options - Options de localisation
 * @returns Fonction pour arrêter le suivi
 */
export async function watchLocation(
    callback: LocationCallback,
    errorCallback?: LocationErrorCallback,
    options: LocationOptions = {}
): Promise<(() => void) | null> {
    try {
        // Vérifier la permission
        const permission = await checkLocationPermission();
        if (permission !== 'granted') {
            console.log('⚠️ Permission de localisation non accordée');
            return null;
        }

        // Démarrer le suivi
        const subscription = await Location.watchPositionAsync(
            {
                accuracy: options.accuracy || Location.LocationAccuracy.Balanced,
                timeInterval: 5000, // Mise à jour toutes les 5 secondes
                distanceInterval: 10, // Ou tous les 10 mètres
            },
            (location) => {
                console.log('📍 Position mise à jour:', {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });
                callback(location);
            }
        );

        console.log('✅ Suivi de position démarré');

        // Retourner une fonction pour arrêter le suivi
        return () => {
            subscription.remove();
            console.log('🛑 Suivi de position arrêté');
        };
    } catch (error) {
        console.error('❌ Erreur lors du démarrage du suivi:', error);
        if (errorCallback) {
            errorCallback(error as Error);
        }
        return null;
    }
}

// ============================================================================
// Utilitaires de Distance
// ============================================================================

/**
 * Calcule la distance entre deux points (en mètres) en utilisant la formule de Haversine
 * 
 * @param lat1 - Latitude du point 1
 * @param lon1 - Longitude du point 1
 * @param lat2 - Latitude du point 2
 * @param lon2 - Longitude du point 2
 * @returns Distance en mètres
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Formate une distance en texte lisible
 * 
 * @param meters - Distance en mètres
 * @returns Distance formatée (ex: "1.5 km" ou "250 m")
 */
export function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    } else {
        return `${(meters / 1000).toFixed(1)} km`;
    }
}
