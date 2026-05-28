/**
 * Composant SettingsModal (Organism)
 * 
 * Modal des paramètres de l'application avec :
 * - Thème (light/dark/auto)
 * - Langue (fr/en)
 * - Préférences de carte (Standard/Satellite/Android Auto/CarPlay)
 * - À propos
 * 
 * @module components/organisms/SettingsModal
 */

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Switch,
    Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    XMarkIcon,
    SunIcon,
    MoonIcon,
    ComputerDesktopIcon,
    GlobeAltIcon,
    MapIcon,
    InformationCircleIcon,
    Cog6ToothIcon,
    CheckIcon,
} from 'react-native-heroicons/outline';

// Store & Types
import { useAppStore } from '@/store';
import type { ThemeMode, Language, AppMapType } from '@/types';
import { BottomSheet } from '@/components/molecules/BottomSheet';

// ============================================================================
// Props
// ============================================================================

export interface SettingsModalProps {
    /** Visibilité de la modal */
    visible: boolean;
    /** Callback de fermeture */
    onClose: () => void;
}

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant SettingsModal
 */
export function SettingsModal({ visible, onClose }: SettingsModalProps) {
    const { t, i18n } = useTranslation();
    const { themeMode, setThemeMode, language, setLanguage, mapType, setMapType } = useAppStore();

    // ============================================================================
    // Handlers
    // ============================================================================

    /**
     * Gère le changement de thème
     */
    const handleThemeChange = (mode: ThemeMode) => {
        console.log('🎨 Changement de thème vers:', mode);
        setThemeMode(mode);
    };

    /**
     * Gère le changement de langue
     */
    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang);
        i18n.changeLanguage(lang);
    };

    /**
     * Gère le changement de type de carte
     */
    const handleMapTypeChange = (type: AppMapType) => {
        setMapType(type);
    };

    // ============================================================================
    // Composants Utilitaires
    // ============================================================================

    /**
     * Section de paramètres
     */
    const SettingsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3 px-1">
                {title}
            </Text>
            <View className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                {children}
            </View>
        </View>
    );

    /**
     * Option de paramètres
     */
    const SettingsOption = ({
        icon,
        title,
        subtitle,
        onPress,
        rightElement,
        isLast = false,
    }: {
        icon: React.ReactNode;
        title: string;
        subtitle?: string;
        onPress?: () => void;
        rightElement?: React.ReactNode;
        isLast?: boolean;
    }) => (
        <TouchableOpacity
            onPress={onPress}
            className={`flex-row items-center p-4 ${!isLast ? 'border-b border-gray-50 dark:border-gray-700' : ''}`}
            activeOpacity={0.7}
        >
            <View className="w-8 h-8 items-center justify-center mr-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {icon}
            </View>
            <View className="flex-1">
                <Text className="text-gray-900 dark:text-white font-medium">
                    {title}
                </Text>
                {subtitle && (
                    <Text className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                        {subtitle}
                    </Text>
                )}
            </View>
            {rightElement}
        </TouchableOpacity>
    );

    // ============================================================================
    // Rendu Principal
    // ============================================================================

    return (
        <BottomSheet
            visible={visible}
            onClose={onClose}
            maxHeight={85}
            showHandle={true}
            scrollable={true}
        >
            {/* Header */}
            <View className="px-4 pt-2 pb-4 border-b border-gray-200 dark:border-gray-700">
                <View className="flex-row items-center justify-between">
                    {/* Logo subtil */}
                    <View className="mr-3">
                        <Image
                            source={require('../../../assets/icon.png')}
                            className="w-8 h-8 opacity-60"
                            resizeMode="contain"
                        />
                    </View>
                    
                    <Text className="text-xl font-bold text-gray-900 dark:text-white flex-1">
                        {t('settings.title', 'Paramètres')}
                    </Text>
                    <TouchableOpacity
                        onPress={onClose}
                        className="w-8 h-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
                    >
                        <XMarkIcon size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Contenu */}
            <View className="px-4 pt-6">
                {/* Section Apparence */}
                <SettingsSection title={t('settings.appearance', 'Apparence')}>
                    <SettingsOption
                        icon={<SunIcon size={20} color="#6B7280" />}
                        title={t('settings.theme.light', 'Thème clair')}
                        onPress={() => handleThemeChange('light')}
                        rightElement={
                            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                                themeMode === 'light' 
                                    ? 'bg-emerald-500 border-emerald-500' 
                                    : 'border-gray-300 dark:border-gray-600'
                            }`}>
                                {themeMode === 'light' && <CheckIcon size={12} color="white" />}
                            </View>
                        }
                    />
                    <SettingsOption
                        icon={<MoonIcon size={20} color="#6B7280" />}
                        title={t('settings.theme.dark', 'Thème sombre')}
                        onPress={() => handleThemeChange('dark')}
                        rightElement={
                            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                                themeMode === 'dark' 
                                    ? 'bg-emerald-500 border-emerald-500' 
                                    : 'border-gray-300 dark:border-gray-600'
                            }`}>
                                {themeMode === 'dark' && <CheckIcon size={12} color="white" />}
                            </View>
                        }
                    />
                    <SettingsOption
                        icon={<ComputerDesktopIcon size={20} color="#6B7280" />}
                        title={t('settings.theme.auto', 'Automatique')}
                        subtitle={t('settings.theme.autoSubtitle', 'Suit le système')}
                        onPress={() => handleThemeChange('auto')}
                        rightElement={
                            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                                themeMode === 'auto' 
                                    ? 'bg-emerald-500 border-emerald-500' 
                                    : 'border-gray-300 dark:border-gray-600'
                            }`}>
                                {themeMode === 'auto' && <CheckIcon size={12} color="white" />}
                            </View>
                        }
                        isLast
                    />
                </SettingsSection>

                {/* Section Carte */}
                <SettingsSection title={t('settings.map', 'Mode de Navigation')}>
                    <SettingsOption
                        icon={<MapIcon size={20} color="#6B7280" />}
                        title={t('map.type.standard', 'Standard')}
                        onPress={() => handleMapTypeChange('standard')}
                        rightElement={
                            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                                mapType === 'standard' 
                                    ? 'bg-emerald-500 border-emerald-500' 
                                    : 'border-gray-300 dark:border-gray-600'
                            }`}>
                                {mapType === 'standard' && <CheckIcon size={12} color="white" />}
                            </View>
                        }
                    />
                    <SettingsOption
                        icon={<GlobeAltIcon size={20} color="#6B7280" />}
                        title={t('map.type.satellite', 'Satellite')}
                        onPress={() => handleMapTypeChange('satellite')}
                        rightElement={
                            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                                mapType === 'satellite' 
                                    ? 'bg-emerald-500 border-emerald-500' 
                                    : 'border-gray-300 dark:border-gray-600'
                            }`}>
                                {mapType === 'satellite' && <CheckIcon size={12} color="white" />}
                            </View>
                        }
                    />
                    <SettingsOption
                        icon={<GlobeAltIcon size={20} color="#6B7280" />}
                        title={t('map.type.hybrid', 'Hybride')}
                        onPress={() => handleMapTypeChange('hybrid')}
                        rightElement={
                            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                                mapType === 'hybrid' 
                                    ? 'bg-emerald-500 border-emerald-500' 
                                    : 'border-gray-300 dark:border-gray-600'
                            }`}>
                                {mapType === 'hybrid' && <CheckIcon size={12} color="white" />}
                            </View>
                        }
                    />
                    <SettingsOption
                        icon={<ComputerDesktopIcon size={20} color="#6B7280" />}
                        title="Android Auto"
                        subtitle={t('map.type.androidAutoSubtitle', 'Mode conduite sombre')}
                        onPress={() => handleMapTypeChange('android_auto')}
                        rightElement={
                            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                                mapType === 'android_auto' 
                                    ? 'bg-emerald-500 border-emerald-500' 
                                    : 'border-gray-300 dark:border-gray-600'
                            }`}>
                                {mapType === 'android_auto' && <CheckIcon size={12} color="white" />}
                            </View>
                        }
                    />
                    <SettingsOption
                        icon={<ComputerDesktopIcon size={20} color="#6B7280" />}
                        title="CarPlay"
                        subtitle={t('map.type.carplaySubtitle', 'Mode conduite clair')}
                        onPress={() => handleMapTypeChange('carplay')}
                        rightElement={
                            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                                mapType === 'carplay' 
                                    ? 'bg-emerald-500 border-emerald-500' 
                                    : 'border-gray-300 dark:border-gray-600'
                            }`}>
                                {mapType === 'carplay' && <CheckIcon size={12} color="white" />}
                            </View>
                        }
                        isLast
                    />
                </SettingsSection>

                {/* Section Langue */}
                <SettingsSection title={t('settings.language', 'Langue')}>
                    <SettingsOption
                        icon={<GlobeAltIcon size={20} color="#6B7280" />}
                        title="Français"
                        onPress={() => handleLanguageChange('fr')}
                        rightElement={
                            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                                language === 'fr' 
                                    ? 'bg-emerald-500 border-emerald-500' 
                                    : 'border-gray-300 dark:border-gray-600'
                            }`}>
                                {language === 'fr' && <CheckIcon size={12} color="white" />}
                            </View>
                        }
                    />
                    <SettingsOption
                        icon={<GlobeAltIcon size={20} color="#6B7280" />}
                        title="English"
                        onPress={() => handleLanguageChange('en')}
                        rightElement={
                            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                                language === 'en' 
                                    ? 'bg-emerald-500 border-emerald-500' 
                                    : 'border-gray-300 dark:border-gray-600'
                            }`}>
                                {language === 'en' && <CheckIcon size={12} color="white" />}
                            </View>
                        }
                        isLast
                    />
                </SettingsSection>

                {/* Section À propos */}
                <SettingsSection title={t('settings.about', 'À propos')}>
                    <SettingsOption
                        icon={<InformationCircleIcon size={20} color="#6B7280" />}
                        title={t('settings.version', 'Version')}
                        subtitle="1.0.0"
                        isLast
                    />
                </SettingsSection>

                {/* Espacement en bas */}
                <View className="h-20" />
            </View>
        </BottomSheet>
    );
}