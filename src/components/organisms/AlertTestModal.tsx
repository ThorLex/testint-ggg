/**
 * Composant AlertTestModal (Organism)
 * 
 * Modal de test pour les alertes personnalisées
 * 
 * @module components/organisms/AlertTestModal
 */

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
} from 'react-native';
import { XMarkIcon } from 'react-native-heroicons/outline';
import { useCustomAlert, showSuccessAlert, showErrorAlert, showConfirmAlert, showInfoAlert } from '@/hooks/useCustomAlert';

// ============================================================================
// Props
// ============================================================================

export interface AlertTestModalProps {
    /** Visibilité de la modal */
    visible: boolean;
    /** Callback de fermeture */
    onClose: () => void;
}

// ============================================================================
// Composant
// ============================================================================

export function AlertTestModal({ visible, onClose }: AlertTestModalProps) {
    const { AlertComponent, showAlert } = useCustomAlert();

    const testAlerts = [
        {
            title: 'Alerte de Succès',
            color: 'bg-green-500',
            onPress: () => showAlert(showSuccessAlert(
                'Opération réussie',
                'Votre action a été effectuée avec succès!'
            ))
        },
        {
            title: 'Alerte d\'Erreur',
            color: 'bg-red-500',
            onPress: () => showAlert(showErrorAlert(
                'Erreur détectée',
                'Une erreur s\'est produite lors de l\'opération.'
            ))
        },
        {
            title: 'Alerte d\'Information',
            color: 'bg-blue-500',
            onPress: () => showAlert(showInfoAlert(
                'Information importante',
                'Voici une information que vous devez connaître.'
            ))
        },
        {
            title: 'Alerte de Confirmation',
            color: 'bg-yellow-500',
            onPress: () => showAlert(showConfirmAlert(
                'Confirmer l\'action',
                'Êtes-vous sûr de vouloir continuer?',
                () => console.log('Confirmé!'),
                () => console.log('Annulé!')
            ))
        },
    ];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-gray-50 dark:bg-gray-900">
                {/* Header */}
                <View className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 pt-12 pb-4">
                    <View className="flex-row items-center justify-between px-4">
                        <Text className="text-xl font-bold text-gray-900 dark:text-white">
                            Test des Alertes
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
                        >
                            <XMarkIcon size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Contenu */}
                <ScrollView className="flex-1 p-4">
                    <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Testez les différents types d'alertes :
                    </Text>

                    {testAlerts.map((alert, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={alert.onPress}
                            className={`${alert.color} rounded-xl p-4 mb-3 shadow-sm`}
                        >
                            <Text className="text-white font-semibold text-center">
                                {alert.title}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    <View className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-xl">
                        <Text className="text-gray-900 dark:text-white font-semibold mb-2">
                            Fonctionnalités des alertes :
                        </Text>
                        <Text className="text-gray-600 dark:text-gray-400 text-sm leading-6">
                            • Design moderne avec blur et ombres{'\n'}
                            • Icônes colorées selon le type{'\n'}
                            • Animations fluides{'\n'}
                            • Support du mode sombre{'\n'}
                            • Boutons personnalisables{'\n'}
                            • Responsive design
                        </Text>
                    </View>
                </ScrollView>
            </View>

            {/* Alerte personnalisée */}
            {AlertComponent}
        </Modal>
    );
}