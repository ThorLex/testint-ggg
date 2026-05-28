/**
 * Composant TutorialModal (Organism)
 * 
 * Modale de tutoriel affichée au premier lancement de l'application.
 * 
 * @module components/organisms/TutorialModal
 */

import { useState } from 'react';
import { View, Text, Modal, ScrollView, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapIcon, MagnifyingGlassIcon, MapPinIcon, UserCircleIcon } from 'react-native-heroicons/outline';

// Components & Services
import { Button } from '@/components/atoms';
import { markTutorialSeen } from '@/services/storage';

// ============================================================================
// Props
// ============================================================================

export interface TutorialModalProps {
    /** Visibilité de la modale */
    visible: boolean;
    /** Callback à la fermeture */
    onClose: () => void;
}

// ============================================================================
// Steps du Tutoriel
// ============================================================================

interface TutorialStep {
    icon: React.ReactNode;
    title: string;
    message: string;
}

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant TutorialModal
 */
export function TutorialModal({ visible, onClose }: TutorialModalProps) {
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(0);

    const steps: TutorialStep[] = [
        {
            icon: <MapIcon size={64} color="#10B981" />,
            title: t('tutorial.welcome_title'),
            message: t('tutorial.welcome_message'),
        },
        {
            icon: <MapPinIcon size={64} color="#10B981" />,
            title: t('tutorial.step1_title'),
            message: t('tutorial.step1_message'),
        },
        {
            icon: <MagnifyingGlassIcon size={64} color="#10B981" />,
            title: t('tutorial.step2_title'),
            message: t('tutorial.step2_message'),
        },
        {
            icon: <MapIcon size={64} color="#10B981" />,
            title: t('tutorial.step3_title'),
            message: t('tutorial.step3_message'),
        },
        {
            icon: <UserCircleIcon size={64} color="#10B981" />,
            title: t('tutorial.step4_title'),
            message: t('tutorial.step4_message'),
        },
    ];

    const isLastStep = currentStep === steps.length - 1;
    const currentStepData = steps[currentStep];

    // ============================================================================
    // Handlers
    // ============================================================================

    /**
     * Passe au step suivant
     */
    const handleNext = () => {
        if (isLastStep) {
            handleFinish();
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    /**
     * Passe le tutoriel
     */
    const handleSkip = () => {
        handleFinish();
    };

    /**
     * Termine le tutoriel
     */
    const handleFinish = async () => {
        await markTutorialSeen();
        onClose();
    };

    // ============================================================================
    // Rendu
    // ============================================================================

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleFinish}
        >
            <View className="flex-1 bg-black/50 justify-center items-center p-4">
                <View className="bg-white dark:bg-neutral-800 rounded-3xl p-6 w-full max-w-md">
                    {/* Contenu du Step */}
                    <ScrollView className="max-h-96">
                        <View className="items-center mb-6">
                            {currentStepData.icon}
                        </View>

                        <Text className="text-2xl font-bold text-center text-neutral-900 dark:text-neutral-50 mb-4">
                            {currentStepData.title}
                        </Text>

                        <Text className="text-base text-center text-neutral-600 dark:text-neutral-400 mb-6">
                            {currentStepData.message}
                        </Text>
                    </ScrollView>

                    {/* Indicateurs de Step */}
                    <View className="flex-row justify-center items-center mb-6">
                        {steps.map((_, index) => (
                            <View
                                key={index}
                                className={`h-2 rounded-full mx-1 ${index === currentStep
                                        ? 'w-8 bg-primary-500'
                                        : 'w-2 bg-neutral-300 dark:bg-neutral-600'
                                    }`}
                            />
                        ))}
                    </View>

                    {/* Boutons */}
                    <View className="flex-row gap-3">
                        {!isLastStep && (
                            <Button
                                variant="ghost"
                                onPress={handleSkip}
                                className="flex-1"
                            >
                                {t('common.skip')}
                            </Button>
                        )}

                        <Button
                            variant="primary"
                            onPress={handleNext}
                            className="flex-1"
                        >
                            {isLastStep ? t('tutorial.get_started') : t('common.next')}
                        </Button>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
