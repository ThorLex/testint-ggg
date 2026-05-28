/**
 * Composant LocationButton (Molecule)
 * 
 * Bouton flottant pour centrer la carte sur la position de l'utilisateur.
 * Gère automatiquement les permissions de localisation et force toujours
 * la récupération d'une position fraîche (pas de cache).
 * 
 * @module components/molecules/LocationButton
 */

import React, { useState } from 'react';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { MapPinIcon } from 'react-native-heroicons/solid';

// Services & Store
import { useMapStore } from '@/store';
import { useThemeColors } from '@/theme';
import { useLocationPermission } from '@/hooks/useLocationPermission';
import { LocationPermissionModal } from '@/components/organisms/LocationPermissionModal';

// ============================================================================
// Props
// ============================================================================

export interface LocationButtonProps {
    /** Référence optionnelle à la carte pour animation fluide */
    mapRef?: React.RefObject<any>;
    /** Indique si le bouton flottant doit être masqué */
    hideFloating?: boolean;
}

export interface LocationButtonRef {
    center: () => Promise<void>;
}

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant LocationButton
 */
export const LocationButton = React.forwardRef<LocationButtonRef, LocationButtonProps>(({ 
    mapRef,
    hideFloating = false,
}, ref) => {
    const colors = useThemeColors();
    const { setRegion, setIsFollowingUser } = useMapStore();
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    
    const {
        permission,
        isEnabled,
        isLoadingLocation,
        getCurrentPosition,
    } = useLocationPermission();

    // ============================================================================
    // Handlers
    // ============================================================================

    /**
     * Gère le clic sur le bouton de localisation
     * Force TOUJOURS la récupération d'une nouvelle position (pas de cache)
     */
    const handlePress = async () => {
        // Vérifier si la permission est accordée
        if (permission !== 'granted' || !isEnabled) {
            setShowPermissionModal(true);
            return;
        }

        // Forcer la récupération d'une nouvelle position (pas de cache)
        console.log('📍 Récupération de la position actuelle...');
        const location = await getCurrentPosition();
        
        if (location) {
            const newRegion = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
            
            // Si on a une référence à la carte, utiliser animateToRegion pour une animation fluide
            if (mapRef?.current) {
                mapRef.current.animateToRegion(newRegion, 500);
                console.log('🎯 Animation vers la position actuelle');
            } else {
                // Sinon, utiliser setRegion du store
                setRegion(newRegion);
                console.log('📍 Région mise à jour');
            }
            
            setIsFollowingUser(true);
            
            console.log('✅ Carte centrée sur la position actuelle:', {
                lat: location.coords.latitude.toFixed(6),
                lng: location.coords.longitude.toFixed(6),
                accuracy: location.coords.accuracy?.toFixed(2) + 'm'
            });
        } else {
            console.warn('⚠️ Impossible de récupérer la position actuelle');
        }
    };

    /**
     * Gère l'obtention de la permission
     */
    const handlePermissionGranted = async () => {
        // Une fois la permission accordée, centrer automatiquement
        const location = await getCurrentPosition();
        if (location) {
            setRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
            setIsFollowingUser(true);
        }
    };

    // Exposer l'action de centrage via ref
    React.useImperativeHandle(ref, () => ({
        center: handlePress,
    }));

    // ============================================================================
    // Rendu
    // ============================================================================

    if (hideFloating) {
        return (
            <LocationPermissionModal
                visible={showPermissionModal}
                onClose={() => setShowPermissionModal(false)}
                onPermissionGranted={handlePermissionGranted}
                dismissible={true}
            />
        );
    }

    return (
        <>
            <TouchableOpacity
                onPress={handlePress}
                disabled={isLoadingLocation}
                className="absolute bottom-36 right-4 w-14 h-14 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full shadow-lg border border-gray-200/50 dark:border-gray-700/50 items-center justify-center"
                activeOpacity={0.7}
            >
                {isLoadingLocation ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    <MapPinIcon 
                        size={24} 
                        color={
                            permission === 'granted' && isEnabled
                                ? colors.primary
                                : '#9CA3AF'
                        }
                    />
                )}
            </TouchableOpacity>

            {/* Modal de permission */}
            <LocationPermissionModal
                visible={showPermissionModal}
                onClose={() => setShowPermissionModal(false)}
                onPermissionGranted={handlePermissionGranted}
                dismissible={true}
            />
        </>
    );
});
