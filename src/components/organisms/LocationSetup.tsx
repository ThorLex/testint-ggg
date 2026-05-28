/**
 * Composant LocationSetup (Organism)
 * 
 * Composant pour configurer la localisation au premier lancement.
 * Demande automatiquement la permission et guide l'utilisateur.
 * 
 * @module components/organisms/LocationSetup
 */

import React, { useEffect, useState } from 'react';
import { useLocationPermission } from '@/hooks/useLocationPermission';
import { LocationPermissionModal } from './LocationPermissionModal';

// ============================================================================
// Props
// ============================================================================

export interface LocationSetupProps {
    /** Si le setup doit être automatique au premier lancement */
    autoSetup?: boolean;
    /** Callback quand la localisation est configurée */
    onSetupComplete?: (hasPermission: boolean) => void;
}

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant LocationSetup
 */
export function LocationSetup({ 
    autoSetup = true, 
    onSetupComplete 
}: LocationSetupProps) {
    const [showModal, setShowModal] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);
    
    const { permission, isEnabled, checkPermission } = useLocationPermission();

    // ============================================================================
    // Effets
    // ============================================================================

    /**
     * Vérifier la permission au montage
     */
    useEffect(() => {
        if (autoSetup && !hasChecked) {
            checkPermission().then(() => {
                setHasChecked(true);
                
                // Si pas de permission et services activés, montrer la modal
                if (permission === 'undetermined' && isEnabled) {
                    setShowModal(true);
                } else {
                    // Notifier que le setup est terminé
                    onSetupComplete?.(permission === 'granted' && isEnabled);
                }
            });
        }
    }, [autoSetup, hasChecked, permission, isEnabled, checkPermission, onSetupComplete]);

    /**
     * Surveiller les changements de permission
     */
    useEffect(() => {
        if (hasChecked && permission !== 'undetermined') {
            onSetupComplete?.(permission === 'granted' && isEnabled);
        }
    }, [permission, isEnabled, hasChecked, onSetupComplete]);

    // ============================================================================
    // Handlers
    // ============================================================================

    /**
     * Gère la fermeture de la modal
     */
    const handleClose = () => {
        setShowModal(false);
        onSetupComplete?.(permission === 'granted' && isEnabled);
    };

    /**
     * Gère l'obtention de la permission
     */
    const handlePermissionGranted = () => {
        setShowModal(false);
        onSetupComplete?.(true);
    };

    // ============================================================================
    // Rendu
    // ============================================================================

    if (!autoSetup || !showModal) {
        return null;
    }

    return (
        <LocationPermissionModal
            visible={showModal}
            onClose={handleClose}
            onPermissionGranted={handlePermissionGranted}
            dismissible={true}
        />
    );
}