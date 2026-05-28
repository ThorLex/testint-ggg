/**
 * Composant NavigationHistoryMenu (Organism)
 * 
 * Menu affichant l'historique de navigation de l'utilisateur.
 * 
 * @module components/organisms/NavigationHistoryMenu
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    XMarkIcon,
    MapPinIcon,
    ClockIcon,
    ArrowPathIcon,
    MapIcon,
} from 'react-native-heroicons/outline';

// API & Components
import { getNavigationHistory } from '@/services/api/navigationHistory';
import { getOrCreateDeviceId } from '@/services/storage';
import { BottomSheet } from '@/components/molecules/BottomSheet';
import { DataErrorState } from '@/components/molecules/DataErrorState';

// ============================================================================
// Props
// ============================================================================

export interface NavigationHistoryMenuProps {
    /** Visibilité de la modal */
    visible: boolean;
    /** Callback de fermeture */
    onClose: () => void;
    /** Callback appelé quand une route est sélectionnée pour être reprise */
    onResumeNavigation?: (historyItem: any) => void;
}

// ============================================================================
// Composant
// ============================================================================

export function NavigationHistoryMenu({
    visible,
    onClose,
    onResumeNavigation,
}: NavigationHistoryMenuProps) {
    const { t } = useTranslation();

    // ============================================================================
    // État Local
    // ============================================================================
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    // ============================================================================
    // Effets
    // ============================================================================
    useEffect(() => {
        if (visible) {
            fetchHistory();
        }
    }, [visible]);

    const fetchHistory = async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const data = await getNavigationHistory(50, 0); // Fetch a bit more just in case
            const currentDeviceId = await getOrCreateDeviceId();
            
            console.log('📡 [HistoryMenu] Données reçues:', data?.length);
            console.log('📱 [HistoryMenu] Device ID Actuel:', currentDeviceId);
            
            // Comparaison explicite demandée par l'utilisateur
            const filteredData = (data || []).filter(item => {
                const match = item.deviceId === currentDeviceId;
                if (!match) {
                    console.log(`⚠️ Ignoré: ${item.id} (device: ${item.deviceId})`);
                }
                return match;
            });
            
            console.log('✅ [HistoryMenu] Données filtrées:', filteredData.length);
            setHistory(filteredData);
        } catch (error) {
            console.error('Erreur fetch history:', error);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    // ============================================================================
    // Helpers
    // ============================================================================
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return t('history.date_today', "Aujourd'hui") + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (date.toDateString() === yesterday.toDateString()) {
            return t('history.date_yesterday', 'Hier') + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDistance = (meters?: number) => {
        if (!meters) return `0 ${t('history.km', 'km')}`;
        return (meters / 1000).toFixed(1) + ` ${t('history.km', 'km')}`;
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return `0 ${t('history.minutes', 'min')}`;
        return Math.floor(seconds / 60) + ` ${t('history.minutes', 'min')}`;
    };

    const getModeText = (mode?: string) => {
        switch (mode) {
            case 'WALKING': return t('history.walking', 'À pied');
            case 'TRANSIT': return t('history.transit', 'Transport en commun');
            case 'BICYCLING': return t('history.bicycling', 'À vélo');
            case 'DRIVING':
            default: return t('history.driving', 'En voiture');
        }
    };

    // ============================================================================
    // Rendu d'un Item
    // ============================================================================
    const renderHistoryItem = ({ item }: { item: any }) => {
        if (!item || !item.id) return null;
        
        return (
            <TouchableOpacity
                onPress={() => onResumeNavigation?.(item)}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 dark:border-gray-700"
                activeOpacity={0.7}
            >
                <View className="flex-row items-center mb-2">
                    <View className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full items-center justify-center mr-3">
                        <MapIcon size={20} color="#3B82F6" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-gray-900 dark:text-white font-bold text-sm" numberOfLines={1}>
                            {item.origin?.address?.split(' — ')[0] || 'Origine'} 
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-xs">
                            ↓ {item.destination?.address?.split(' — ')[0] || 'Destination'}
                        </Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-gray-400 dark:text-gray-500 text-xs font-bold">
                            {formatDate(item.createdAt || item.timestamp || item.startedAt)}
                        </Text>
                        <Text className="text-emerald-500 dark:text-emerald-400 text-xs font-bold mt-1">
                            {item.status === 'COMPLETED' ? 'Terminé' : getModeText(item.travelMode)}
                        </Text>
                    </View>
                </View>

                {/* Détails */}
                <View className="flex-row items-center pt-2 border-t border-gray-100 dark:border-gray-700/50">
                    <View className="flex-row items-center mr-4">
                        <MapPinIcon size={14} color="#9CA3AF" />
                        <Text className="text-gray-500 dark:text-gray-400 text-xs ml-1 font-bold">
                            {item.distance?.formatted || formatDistance(item.distance?.meters || item.distanceMeters)}
                        </Text>
                    </View>
                    <View className="flex-row items-center">
                        <ClockIcon size={14} color="#9CA3AF" />
                        <Text className="text-gray-500 dark:text-gray-400 text-xs ml-1 font-bold">
                            {item.duration?.formatted || formatDuration(item.duration?.seconds || item.durationSeconds)}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // ============================================================================
    // Rendu Principal
    // ============================================================================

    return (
        <BottomSheet
            visible={visible}
            onClose={onClose}
            maxHeight={80}
            scrollable={false}
        >
            <View className="flex-1 p-4">
                {/* Header */}
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-2xl font-black text-black dark:text-white uppercase tracking-tight">
                            {t('history.title', 'Historique de navigation')}
                        </Text>
                        <Text className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest">
                            {history.length} {t('history.title', 'Trajets')}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={onClose}
                        className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"
                    >
                        <XMarkIcon size={24} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {/* Contenu */}
                {isLoading && history.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#10B981" />
                        <Text className="mt-4 text-gray-500 dark:text-gray-400 font-bold">
                            {t('history.loading', 'Chargement...')}
                        </Text>
                    </View>
                ) : isError && history.length === 0 ? (
                    <DataErrorState 
                        onRetry={fetchHistory}
                    />
                ) : (
                    <FlatList
                        data={history}
                        keyExtractor={(item) => item.id || Math.random().toString()}
                        renderItem={renderHistoryItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        ListEmptyComponent={
                            <View className="flex-1 items-center justify-center py-20">
                                <MapPinIcon size={48} color="#D1D5DB" />
                                <Text className="mt-4 text-gray-400 font-bold text-center">
                                    {t('history.empty', 'Aucun historique disponible')}
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>
        </BottomSheet>
    );
}
