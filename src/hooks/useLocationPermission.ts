/**
 * Hook pour gérer les permissions de localisation
 * 
 * Ce hook gère l'état des permissions de localisation et fournit
 * des méthodes pour demander et vérifier les permissions.
 * 
 * @module hooks/useLocationPermission
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { useAppStore } from '@/store';
import { 
    requestLocationPermission, 
    checkLocationPermission, 
    isLocationEnabled,
    getCurrentLocation,
    type LocationPermissionStatus 
} from '@/services/location';

// ============================================================================
// Types
// ============================================================================

export interface LocationPermissionState {
    /** Statut de la permission */
    permission: LocationPermissionStatus;
    /** Si les services de localisation sont activés */
    isEnabled: boolean;
    /** Si une demande de permission est en cours */
    isRequesting: boolean;
    /** Position actuelle si disponible */
    currentLocation: Location.LocationObject | null;
    /** Si la position est en cours de récupération */
    isLoadingLocation: boolean;
}

export interface LocationPermissionActions {
    /** Demander la permission de localisation */
    requestPermission: () => Promise<boolean>;
    /** Vérifier le statut de la permission */
    checkPermission: () => Promise<void>;
    /** Récupérer la position actuelle */
    getCurrentPosition: () => Promise<Location.LocationObject | null>;
    /** Ouvrir les paramètres de l'appareil */
    openSettings: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook pour gérer les permissions de localisation
 */
export function useLocationPermission(): LocationPermissionState & LocationPermissionActions {
    const { t } = useTranslation();
    const { locationState, setLocationState } = useAppStore();
    
    const [isRequesting, setIsRequesting] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    // ============================================================================
    // Vérification initiale
    // ============================================================================

    useEffect(() => {
        checkPermission();
    }, []);

    // ============================================================================
    // Actions
    // ============================================================================

    /**
     * Vérifier le statut actuel de la permission
     */
    const checkPermission = useCallback(async () => {
        try {
            const permission = await checkLocationPermission();
            const enabled = await isLocationEnabled();

            setLocationState({
                ...locationState,
                permission,
                isEnabled: enabled,
            });

            console.log('📍 Statut localisation:', { permission, enabled });
        } catch (error) {
            console.error('❌ Erreur vérification permission:', error);
        }
    }, [locationState, setLocationState]);

    /**
     * Demander la permission de localisation
     */
    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (isRequesting) return false;

        setIsRequesting(true);

        try {
            // Vérifier d'abord si les services sont activés
            const enabled = await isLocationEnabled();
            if (!enabled) {
                Alert.alert(
                    t('permissions.location_disabled_title', 'Services de localisation désactivés'),
                    t('permissions.location_disabled_message', 'Veuillez activer les services de localisation dans les paramètres de votre appareil.'),
                    [
                        { text: t('common.cancel', 'Annuler'), style: 'cancel' },
                        { text: t('permissions.open_settings', 'Ouvrir les paramètres'), onPress: openSettings },
                    ]
                );
                return false;
            }

            // Demander la permission
            const permission = await requestLocationPermission();

            // Mettre à jour l'état
            setLocationState({
                ...locationState,
                permission,
                isEnabled: enabled,
            });

            if (permission === 'granted') {
                // Récupérer immédiatement la position
                await getCurrentPosition();
                return true;
            } else if (permission === 'denied') {
                // Afficher une alerte pour expliquer comment activer manuellement
                Alert.alert(
                    t('permissions.location_denied_title', 'Permission refusée'),
                    t('permissions.location_denied_message', 'Pour utiliser la localisation, vous devez autoriser l\'accès dans les paramètres de l\'application.'),
                    [
                        { text: t('common.cancel', 'Annuler'), style: 'cancel' },
                        { text: t('permissions.open_settings', 'Ouvrir les paramètres'), onPress: openSettings },
                    ]
                );
                return false;
            }

            return false;
        } catch (error) {
            console.error('❌ Erreur demande permission:', error);
            Alert.alert(
                t('common.error', 'Erreur'),
                t('errors.location_permission', 'Impossible de demander la permission de localisation.')
            );
            return false;
        } finally {
            setIsRequesting(false);
        }
    }, [isRequesting, locationState, setLocationState, t]);

    /**
     * Récupérer la position actuelle
     */
    const getCurrentPosition = useCallback(async (): Promise<Location.LocationObject | null> => {
        if (locationState.permission !== 'granted') {
            console.log('⚠️ Permission non accordée pour récupérer la position');
            return null;
        }

        setIsLoadingLocation(true);

        try {
            const location = await getCurrentLocation({
                accuracy: Location.LocationAccuracy.Balanced,
                timeout: 15000, // 15 secondes
            });

            if (location) {
                setLocationState({
                    ...locationState,
                    currentLocation: {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    },
                });

                console.log('📍 Position récupérée:', {
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                    accuracy: location.coords.accuracy,
                });
            }

            return location;
        } catch (error) {
            console.error('❌ Erreur récupération position:', error);
            Alert.alert(
                t('common.error', 'Erreur'),
                t('errors.location_disabled', 'Impossible de récupérer votre position.')
            );
            return null;
        } finally {
            setIsLoadingLocation(false);
        }
    }, [locationState, setLocationState, t]);

    /**
     * Ouvrir les paramètres de l'appareil
     */
    const openSettings = useCallback(() => {
        if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
        } else {
            Linking.openSettings();
        }
    }, []);

    // ============================================================================
    // Retour
    // ============================================================================

    return {
        // État
        permission: locationState.permission,
        isEnabled: locationState.isEnabled,
        isRequesting,
        currentLocation: locationState.currentLocation,
        isLoadingLocation,

        // Actions
        requestPermission,
        checkPermission,
        getCurrentPosition,
        openSettings,
    };
}