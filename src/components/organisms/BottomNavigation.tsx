/**
 * Composant BottomNavigation (Organism)
 * 
 * Barre de navigation en bas de l'écran avec les boutons principaux :
 * - Login/Profil
 * - Liste des amodiataires
 * - Paramètres
 * - Mode d'affichage de la carte
 * 
 * @module components/organisms/BottomNavigation
 */

import React from 'react';
import { View, TouchableOpacity, Text, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import {
    UserIcon,
    UserCircleIcon,
    ListBulletIcon,
    Cog6ToothIcon,
    MapIcon,
    ViewColumnsIcon,
    BellIcon,
    WrenchScrewdriverIcon,
    ClockIcon,
} from 'react-native-heroicons/outline';
import {
    UserIcon as UserIconSolid,
    ListBulletIcon as ListBulletIconSolid,
    Cog6ToothIcon as Cog6ToothIconSolid,
} from 'react-native-heroicons/solid';

// Store & Types
import { useAppStore } from '@/store';

// ============================================================================
// Types
// ============================================================================

export interface BottomNavigationProps {
    /** Callback pour le bouton login */
    onLoginPress?: () => void;
    /** Callback pour le bouton liste */
    onListPress?: () => void;
    /** Callback pour le bouton services */
    onServicesPress?: () => void;
    /** Callback pour le bouton paramètres */
    onSettingsPress?: () => void;
    /** Callback pour le bouton historique */
    onHistoryPress?: () => void;
    /** Callback pour le bouton notifications */
    onNotificationsPress?: () => void;
    /** Nombre de notifications non lues */
    notificationCount?: number;
    /** Indique si l'utilisateur est connecté */
    isAuthenticated?: boolean;
    /** Layout de la barre de navigation */
    layout?: 'bottom' | 'side';
}

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant BottomNavigation
 */
export function BottomNavigation({
    onLoginPress,
    onListPress,
    onServicesPress,
    onSettingsPress,
    onHistoryPress,
    onNotificationsPress,
    notificationCount = 0,
    isAuthenticated = false,
    layout = 'bottom',
}: BottomNavigationProps) {
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    
    // Obtenir le type de carte du store global
    const { mapType } = useAppStore();

    // Icon colors based on theme and glassmorphism
    const iconColor = isDark ? '#FFFFFF' : '#000000';
    const textColor = isDark ? 'text-white' : 'text-black';
    const activeBg = isDark ? 'active:bg-white/10' : 'active:bg-black/10';

    // ============================================================================
    // Handlers
    // ============================================================================


    // ============================================================================
    // Rendu
    // ============================================================================

    const isSide = layout === 'side';

    return (
        <View 
            className={`absolute z-20 ${
                isSide 
                    ? 'left-4 top-[20%] bottom-[20%] w-16 justify-center' 
                    : 'bottom-6 left-4 right-4'
            }`}
        >
            <View className={`overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl ${isSide ? 'h-full' : ''}`}>
                <BlurView 
                    intensity={80} 
                    tint={isDark ? 'dark' : 'light'}
                    className={`bg-white/70 dark:bg-black/20 ${isSide ? 'flex-1' : ''}`}
                >
                    <View className={`${isSide ? 'flex-col h-full py-4' : 'flex-row py-3'} items-center justify-around px-2`}>
                        {/* Bouton Liste */}
                        <TouchableOpacity
                            onPress={onListPress}
                            className={`${isSide ? 'w-full py-4' : 'flex-1 py-3'} items-center px-2 rounded-2xl ${activeBg}`}
                            activeOpacity={0.7}
                        >
                            <ListBulletIcon size={24} color={iconColor} />
                            {!isSide && (
                                <Text className={`${textColor} text-[10px] font-bold mt-1 text-center`} numberOfLines={1}>
                                    Amodiataires
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Bouton Services */}
                        <TouchableOpacity
                            onPress={onServicesPress}
                            className={`${isSide ? 'w-full py-4' : 'flex-1 py-3'} items-center px-2 rounded-2xl ${activeBg}`}
                            activeOpacity={0.7}
                        >
                            <WrenchScrewdriverIcon size={24} color={iconColor} />
                            {!isSide && (
                                <Text className={`${textColor} text-[10px] font-bold mt-1 text-center`} numberOfLines={1}>
                                    Services
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Bouton Notifications / Annonces */}
                        <TouchableOpacity
                            onPress={onNotificationsPress}
                            className={`${isSide ? 'w-full py-4' : 'flex-1 py-3'} items-center px-2 rounded-2xl ${activeBg}`}
                            activeOpacity={0.7}
                        >
                            <View className="relative">
                                <BellIcon size={24} color={iconColor} />
                                {notificationCount > 0 && (
                                    <View className="absolute -top-1 -right-1 bg-red-600 rounded-full w-4 h-4 items-center justify-center">
                                        <Text className="text-white text-[9px] font-bold">
                                            {notificationCount > 9 ? '9+' : notificationCount}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            {!isSide && (
                                <Text className={`${textColor} text-[10px] font-bold mt-1 text-center`} numberOfLines={1}>
                                    {t('navigation.notifications', 'Annonce')}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Bouton Paramètres */}
                        <TouchableOpacity
                            onPress={onSettingsPress}
                            className={`${isSide ? 'w-full py-4' : 'flex-1 py-3'} items-center px-2 rounded-2xl ${activeBg}`}
                            activeOpacity={0.7}
                        >
                            <Cog6ToothIcon size={24} color={iconColor} />
                            {!isSide && (
                                <Text className={`${textColor} text-[10px] font-bold mt-1 text-center`} numberOfLines={1}>
                                    {t('navigation.settings', 'Paramètres')}
                                </Text>
                            )}
                        </TouchableOpacity>

                    </View>
                </BlurView>
            </View>
        </View>
    );
}