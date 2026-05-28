/**
 * Composant LocationPermissionModal (Organism)
 * 
 * Modal pour demander l'autorisation de localisation avec une interface native.
 * Explique pourquoi la permission est nécessaire et guide l'utilisateur.
 * 
 * @module components/organisms/LocationPermissionModal
 */

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    MapPinIcon,
    XMarkIcon,
    Cog6ToothIcon,
    ExclamationTriangleIcon,
} from 'react-native-heroicons/outline';

// Components & Hooks
import { Button } from '@/components/atoms';
import { useLocationPermission } from '@/hooks/useLocationPermission';

// ============================================================================
// Props
// ============================================================================

export interface LocationPermissionModalProps {
    /** Visibilité de la modal */
    visible: boolean;
    /** Callback de fermeture */
    onClose: () => void;
    /** Callback quand la permission est accordée */
    onPermissionGranted?: () => void;
    /** Si la modal peut être fermée (optionnel pour forcer la permission) */
    dismissible?: boolean;
}

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant LocationPermissionModal
 */
export function LocationPermissionModal({
    visible,
    onClose,
    onPermissionGranted,
    dismissible = true,
}: LocationPermissionModalProps) {
    const { t } = useTranslation();
    const {
        permission,
        isEnabled,
        isRequesting,
        requestPermission,
        openSettings,
    } = useLocationPermission();

    // ============================================================================
    // Handlers
    // ============================================================================

    /**
     * Gère la demande de permission
     */
    const handleRequestPermission = async () => {
        const granted = await requestPermission();
        if (granted) {
            onPermissionGranted?.();
            onClose();
        }
    };

    /**
     * Gère l'ouverture des paramètres
     */
    const handleOpenSettings = () => {
        openSettings();
        onClose();
    };

    /**
     * Gère la fermeture de la modal
     */
    const handleClose = () => {
        if (dismissible) {
            onClose();
        }
    };

    // ============================================================================
    // Rendu conditionnel selon l'état
    // ============================================================================

    /**
     * Contenu pour demander la permission initiale
     */
    const renderPermissionRequest = () => (
        <>
            {/* Icône principale */}
            <View className="items-center mb-6">
                <View className="w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-full items-center justify-center mb-4">
                    <MapPinIcon size={40} className="text-primary-600 dark:text-primary-400" />
                </View>
                <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">
                    {t('permissions.location_title', 'Autoriser la localisation')}
                </Text>
            </View>

            {/* Explication */}
            <Text className="text-gray-600 dark:text-gray-400 text-center mb-6 leading-6">
                {t('permissions.location_message', 'Navipad a besoin d\'accéder à votre position pour afficher votre localisation sur la carte et vous aider à trouver les amodiataires près de chez vous.')}
            </Text>

            {/* Avantages */}
            <View className="mb-6">
                <Text className="text-gray-900 dark:text-white font-semibold mb-3">
                    {t('permissions.location_benefits', 'Cela vous permettra de :')}
                </Text>
                <View className="space-y-2">
                    <View className="flex-row items-center">
                        <View className="w-2 h-2 bg-primary-500 rounded-full mr-3" />
                        <Text className="text-gray-600 dark:text-gray-400 flex-1">
                            {t('permissions.benefit_1', 'Voir votre position sur la carte')}
                        </Text>
                    </View>
                    <View className="flex-row items-center">
                        <View className="w-2 h-2 bg-primary-500 rounded-full mr-3" />
                        <Text className="text-gray-600 dark:text-gray-400 flex-1">
                            {t('permissions.benefit_2', 'Trouver les amodiataires les plus proches')}
                        </Text>
                    </View>
                    <View className="flex-row items-center">
                        <View className="w-2 h-2 bg-primary-500 rounded-full mr-3" />
                        <Text className="text-gray-600 dark:text-gray-400 flex-1">
                            {t('permissions.benefit_3', 'Obtenir des directions précises')}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Boutons */}
            <View className="space-y-3">
                <Button
                    onPress={handleRequestPermission}
                    loading={isRequesting}
                    className="bg-primary-500"
                >
                    {t('permissions.location_button', 'Autoriser la localisation')}
                </Button>

                {dismissible && (
                    <TouchableOpacity
                        onPress={handleClose}
                        className="py-3 items-center"
                    >
                        <Text className="text-gray-500 dark:text-gray-400">
                            {t('permissions.maybe_later', 'Plus tard')}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </>
    );

    /**
     * Contenu pour permission refusée
     */
    const renderPermissionDenied = () => (
        <>
            {/* Icône d'avertissement */}
            <View className="items-center mb-6">
                <View className="w-20 h-20 bg-orange-100 dark:bg-orange-900 rounded-full items-center justify-center mb-4">
                    <ExclamationTriangleIcon size={40} className="text-orange-600 dark:text-orange-400" />
                </View>
                <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">
                    {t('permissions.location_denied_title', 'Permission refusée')}
                </Text>
            </View>

            {/* Explication */}
            <Text className="text-gray-600 dark:text-gray-400 text-center mb-6 leading-6">
                {t('permissions.location_denied_message', 'Pour utiliser la localisation, vous devez autoriser l\'accès dans les paramètres de l\'application.')}
            </Text>

            {/* Instructions */}
            <View className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-6">
                <Text className="text-gray-900 dark:text-white font-semibold mb-2">
                    {t('permissions.how_to_enable', 'Comment activer :')}
                </Text>
                <Text className="text-gray-600 dark:text-gray-400 text-sm leading-5">
                    {t('permissions.enable_instructions', '1. Appuyez sur "Ouvrir les paramètres"\n2. Trouvez "Localisation" ou "Position"\n3. Activez l\'autorisation pour Navipad')}
                </Text>
            </View>

            {/* Boutons */}
            <View className="space-y-3">
                <Button
                    onPress={handleOpenSettings}
                    className="bg-primary-500"
                    leftIcon={<Cog6ToothIcon size={20} className="text-white" />}
                >
                    {t('permissions.open_settings', 'Ouvrir les paramètres')}
                </Button>

                {dismissible && (
                    <TouchableOpacity
                        onPress={handleClose}
                        className="py-3 items-center"
                    >
                        <Text className="text-gray-500 dark:text-gray-400">
                            {t('common.cancel', 'Annuler')}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </>
    );

    /**
     * Contenu pour services désactivés
     */
    const renderServicesDisabled = () => (
        <>
            {/* Icône d'avertissement */}
            <View className="items-center mb-6">
                <View className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full items-center justify-center mb-4">
                    <ExclamationTriangleIcon size={40} className="text-red-600 dark:text-red-400" />
                </View>
                <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">
                    {t('permissions.location_disabled_title', 'Services de localisation désactivés')}
                </Text>
            </View>

            {/* Explication */}
            <Text className="text-gray-600 dark:text-gray-400 text-center mb-6 leading-6">
                {t('permissions.location_disabled_message', 'Les services de localisation sont désactivés sur votre appareil. Veuillez les activer dans les paramètres système.')}
            </Text>

            {/* Boutons */}
            <View className="space-y-3">
                <Button
                    onPress={handleOpenSettings}
                    className="bg-primary-500"
                    leftIcon={<Cog6ToothIcon size={20} className="text-white" />}
                >
                    {t('permissions.open_settings', 'Ouvrir les paramètres')}
                </Button>

                {dismissible && (
                    <TouchableOpacity
                        onPress={handleClose}
                        className="py-3 items-center"
                    >
                        <Text className="text-gray-500 dark:text-gray-400">
                            {t('common.cancel', 'Annuler')}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </>
    );

    // ============================================================================
    // Sélection du contenu
    // ============================================================================

    const renderContent = () => {
        if (!isEnabled) {
            return renderServicesDisabled();
        } else if (permission === 'denied') {
            return renderPermissionDenied();
        } else {
            return renderPermissionRequest();
        }
    };

    // ============================================================================
    // Rendu Principal
    // ============================================================================

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View className="flex-1 bg-white dark:bg-gray-900">
                {/* Header */}
                <View className="pt-12 pb-4 px-4">
                    {dismissible && (
                        <TouchableOpacity
                            onPress={handleClose}
                            className="absolute top-12 right-4 w-8 h-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 z-10"
                        >
                            <XMarkIcon size={20} className="text-gray-600 dark:text-gray-300" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Contenu */}
                <View className="flex-1 px-6 justify-center">
                    {renderContent()}
                </View>

                {/* Espacement en bas */}
                <View className="h-8" />
            </View>
        </Modal>
    );
}