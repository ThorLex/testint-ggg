/**
 * Hook useCustomAlert
 * 
 * Hook pour afficher des alertes modernes et stylées
 * 
 * @module hooks/useCustomAlert
 */

import React, { useState, useCallback } from 'react';
import { CustomAlert, AlertType, AlertButton } from '@/components/atoms/CustomAlert';

// ============================================================================
// Types
// ============================================================================

interface AlertOptions {
    type?: AlertType;
    title: string;
    message?: string;
    buttons?: AlertButton[];
}

interface UseCustomAlertReturn {
    /** Composant d'alerte à rendre */
    AlertComponent: React.ReactElement;
    /** Fonction pour afficher une alerte */
    showAlert: (options: AlertOptions) => void;
    /** Fonction pour masquer l'alerte */
    hideAlert: () => void;
    /** État de visibilité */
    isVisible: boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useCustomAlert(): UseCustomAlertReturn {
    const [isVisible, setIsVisible] = useState(false);
    const [alertOptions, setAlertOptions] = useState<AlertOptions>({
        title: '',
    });

    const showAlert = useCallback((options: AlertOptions) => {
        setAlertOptions(options);
        setIsVisible(true);
    }, []);

    const hideAlert = useCallback(() => {
        setIsVisible(false);
    }, []);

    const AlertComponent = (
        <CustomAlert
            visible={isVisible}
            type={alertOptions.type}
            title={alertOptions.title}
            message={alertOptions.message}
            buttons={alertOptions.buttons}
            onClose={hideAlert}
        />
    );

    return {
        AlertComponent,
        showAlert,
        hideAlert,
        isVisible,
    };
}

// ============================================================================
// Fonctions utilitaires
// ============================================================================

/**
 * Affiche une alerte de succès
 */
export function showSuccessAlert(
    title: string,
    message?: string,
    onPress?: () => void
) {
    return {
        type: 'success' as AlertType,
        title,
        message,
        buttons: [
            {
                text: 'OK',
                onPress,
            },
        ],
    };
}

/**
 * Affiche une alerte d'erreur
 */
export function showErrorAlert(
    title: string,
    message?: string,
    onPress?: () => void
) {
    return {
        type: 'error' as AlertType,
        title,
        message,
        buttons: [
            {
                text: 'OK',
                onPress,
            },
        ],
    };
}

/**
 * Affiche une alerte de confirmation
 */
export function showConfirmAlert(
    title: string,
    message?: string,
    onConfirm?: () => void,
    onCancel?: () => void
) {
    return {
        type: 'warning' as AlertType,
        title,
        message,
        buttons: [
            {
                text: 'Annuler',
                style: 'cancel' as const,
                onPress: onCancel,
            },
            {
                text: 'Confirmer',
                style: 'destructive' as const,
                onPress: onConfirm,
            },
        ],
    };
}

/**
 * Affiche une alerte d'information
 */
export function showInfoAlert(
    title: string,
    message?: string,
    onPress?: () => void
) {
    return {
        type: 'info' as AlertType,
        title,
        message,
        buttons: [
            {
                text: 'OK',
                onPress,
            },
        ],
    };
}