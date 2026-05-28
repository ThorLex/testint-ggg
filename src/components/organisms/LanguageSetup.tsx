/**
 * Composant LanguageSetup (Organism)
 * 
 * Modal pour choisir la langue au premier lancement
 * 
 * @module components/organisms/LanguageSetup
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { GlobeAltIcon, CheckIcon } from 'react-native-heroicons/outline';
import { useAppStore } from '@/store';
import { saveLanguage, getLanguage } from '@/services/storage';
import type { Language } from '@/types';

// ============================================================================
// Props
// ============================================================================

export interface LanguageSetupProps {
    /** Visibilité de la modal */
    visible: boolean;
    /** Callback après sélection */
    onComplete: () => void;
}

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant LanguageSetup
 */
export function LanguageSetup({ visible, onComplete }: LanguageSetupProps) {
    const { i18n } = useTranslation();
    const { setLanguage } = useAppStore();
    const [selectedLanguage, setSelectedLanguage] = useState<Language>('fr');

    // Charger la langue sauvegardée au montage
    useEffect(() => {
        const loadSavedLanguage = async () => {
            const savedLang = await getLanguage();
            setSelectedLanguage(savedLang);
        };
        loadSavedLanguage();
    }, []);

    const languages: { code: Language; name: string; nativeName: string }[] = [
        { code: 'fr', name: 'French', nativeName: 'Français' },
        { code: 'en', name: 'English', nativeName: 'English' },
    ];

    const handleSelectLanguage = (lang: Language) => {
        setSelectedLanguage(lang);
    };

    const handleConfirm = async () => {
        // Sauvegarder la langue dans les préférences
        await saveLanguage(selectedLanguage);
        setLanguage(selectedLanguage);
        i18n.changeLanguage(selectedLanguage);
        console.log(`🌍 Langue sauvegardée: ${selectedLanguage}`);
        onComplete();
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={handleConfirm}
        >
            <View className="flex-1 bg-black/50 items-center justify-center p-6">
                <View className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-md">
                    {/* Icône */}
                    <View className="items-center mb-6">
                        <View className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900 rounded-full items-center justify-center mb-4">
                            <GlobeAltIcon size={40} color="#10B981" />
                        </View>
                        <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                            Choose your language
                        </Text>
                        <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                            Choisissez votre langue
                        </Text>
                    </View>

                    {/* Liste des langues */}
                    <View className="mb-6">
                        {languages.map((lang) => (
                            <TouchableOpacity
                                key={lang.code}
                                onPress={() => handleSelectLanguage(lang.code)}
                                className={`p-4 rounded-xl mb-3 border-2 ${
                                    selectedLanguage === lang.code
                                        ? 'bg-emerald-50 dark:bg-emerald-900 border-emerald-500'
                                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                                }`}
                            >
                                <View className="flex-row items-center justify-between">
                                    <View>
                                        <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {lang.nativeName}
                                        </Text>
                                        <Text className="text-sm text-gray-500 dark:text-gray-400">
                                            {lang.name}
                                        </Text>
                                    </View>
                                    {selectedLanguage === lang.code && (
                                        <View className="w-8 h-8 bg-emerald-500 rounded-full items-center justify-center">
                                            <CheckIcon size={20} color="white" />
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Bouton de confirmation */}
                    <TouchableOpacity
                        onPress={handleConfirm}
                        className="bg-emerald-500 rounded-xl p-4 items-center"
                    >
                        <Text className="text-white font-semibold text-lg">
                            {selectedLanguage === 'fr' ? 'Continuer' : 'Continue'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
