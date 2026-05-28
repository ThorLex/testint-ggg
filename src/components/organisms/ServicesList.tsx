/**
 * Composant ServicesList (Organism)
 * 
 * Liste des services avec recherche et filtres.
 * Affichée dans une modal ou bottom sheet.
 * 
 * @module components/organisms/ServicesList
 */

import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    XMarkIcon,
    PhoneIcon,
    MapPinIcon,
    MagnifyingGlassIcon,
} from 'react-native-heroicons/outline';

// Hooks & Store
import { useServices } from '@/hooks';
import { useMapStore } from '@/store';
import type { AmodiataireListItem } from '@/types';
import { BottomSheet } from '@/components/molecules/BottomSheet';
import { DataErrorState } from '@/components/molecules/DataErrorState';

// ============================================================================
// Props
// ============================================================================

export interface ServicesListProps {
    /** Visibilité de la modal */
    visible: boolean;
    /** Callback de fermeture */
    onClose: () => void;
    /** Callback de sélection d'un service */
    onSelectService?: (service: AmodiataireListItem) => void;
    /** Callback appelé quand la navigation démarre */
    onNavigationStart?: () => void;
    /** Callback appelé quand une route est sélectionnée pour la navigation */
    onRouteSelected?: (route: any) => void;
}

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant ServicesList
 */
export function ServicesList({
    visible,
    onClose,
    onSelectService,
    onNavigationStart,
    onRouteSelected,
}: ServicesListProps) {
    const { t } = useTranslation();
    const { setRegion, setSelectedMarkerId } = useMapStore();

    // ============================================================================
    // État Local
    // ============================================================================

    const [searchQuery, setSearchQuery] = useState('');

    // ============================================================================
    // Données
    // ============================================================================

    const { data: servicesResponse, isLoading, isError, refetch } = useServices({
        search: searchQuery
    });

    // Extraire le tableau de données (l'API retourne { success: boolean, amodiataires: AmodiatairMinimal[], count: number })
    const services = servicesResponse?.amodiataires || [];

    // Filtrer et trier les services (Filtre local en plus du filtre API pour la fluidité)
    const filteredAndSortedServices = useMemo(() => {
        let filtered = services.filter((service) => {
            if (!service) return false;
            
            const raisonSociale = service.raisonSociale || '';
            const phone = service.profile?.phone || '';
            const username = service.profile?.username || '';
            
            return raisonSociale.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   phone.includes(searchQuery);
        });

        // Tri alphabétique par raison sociale
        filtered.sort((a, b) => {
            const nameA = (a.raisonSociale || '').toLowerCase().trim();
            const nameB = (b.raisonSociale || '').toLowerCase().trim();
            return nameA.localeCompare(nameB);
        });

        return filtered;
    }, [services, searchQuery]);

    // ============================================================================
    // Handlers
    // ============================================================================

    /**
     * Gère la sélection d'un service
     */
    const handleSelectService = (service: AmodiataireListItem) => {
        // Propager au parent
        if (onSelectService) {
            onSelectService(service);
        }
    };

    // ============================================================================
    // Rendu d'un Item
    // ============================================================================

    const renderServiceItem = ({ item }: { item: AmodiataireListItem }) => {
        if (!item || !item.id) return null;
        
        return (
            <TouchableOpacity
                onPress={() => handleSelectService(item)}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 dark:border-gray-700"
                activeOpacity={0.7}
            >
                <View className="flex-row items-center">
                    {/* Avatar */}
                    <View className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full items-center justify-center mr-4">
                        <Text className="text-blue-700 dark:text-blue-300 font-bold text-lg">
                            {(item.raisonSociale || '?').charAt(0).toUpperCase()}
                        </Text>
                    </View>

                    {/* Informations */}
                    <View className="flex-1">
                        <Text className="text-black dark:text-white font-black text-base uppercase">
                            {item.raisonSociale}
                        </Text>
                        
                        {(item.profile?.phone) && (
                            <View className="flex-row items-center mt-1">
                                <PhoneIcon size={14} color="#9CA3AF" />
                                <Text className="text-gray-600 dark:text-gray-300 text-sm ml-1">
                                    {item.profile.phone}
                                </Text>
                            </View>
                        )}

                        <View className="flex-row items-center mt-1">
                            <MapPinIcon size={14} color="#9CA3AF" />
                            <Text className="text-gray-600 dark:text-gray-300 text-sm ml-1">
                                {item.adresse || t('list.hasLocation', 'Localisation disponible')}
                            </Text>
                        </View>
                    </View>

                    {/* Indicateur de sélection */}
                    <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center">
                        <Text className="text-white text-sm font-bold">→</Text>
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
            maxHeight={75}
            showHandle={true}
            scrollable={false}
        >
            {/* Header */}
            <View className="px-4 pt-2 pb-4 border-b border-gray-200 dark:border-gray-700">
                <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-xl font-black text-black dark:text-white">
                            {t('navigation.services', 'Services')}
                        </Text>
                    <TouchableOpacity
                        onPress={onClose}
                        className="w-8 h-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
                    >
                        <XMarkIcon size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {/* Barre de recherche */}
                <View className="mb-3">
                    <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
                        <MagnifyingGlassIcon size={20} color="#9CA3AF" />
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder={t('search.placeholder.services', 'Rechercher un service...')}
                            placeholderTextColor="#9CA3AF"
                            className="flex-1 ml-3 text-gray-900 dark:text-white text-base"
                        />
                    </View>
                </View>

                {/* Compteur */}
                {servicesResponse && (
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">
                        {t('list.servicesCount', '{{count}} services trouvés', { count: filteredAndSortedServices.length })}
                    </Text>
                )}
            </View>

            {/* Contenu */}
            <View className="flex-1 px-4 pt-4">
                {isLoading ? (
                    <View className="flex-1 items-center justify-center py-20">
                        <ActivityIndicator size="large" className="text-primary-500" />
                        <Text className="text-gray-500 dark:text-gray-400 mt-4">
                            {t('list.loadingServices', 'Chargement des services...')}
                        </Text>
                    </View>
                ) : isError ? (
                    <DataErrorState 
                        onRetry={() => refetch()}
                    />
                ) : (
                    <FlatList
                        data={filteredAndSortedServices}
                        keyExtractor={(item) => item.id}
                        renderItem={renderServiceItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListEmptyComponent={
                            <View className="flex-1 items-center justify-center py-20">
                                <Text className="text-gray-500 dark:text-gray-400 text-center">
                                    {searchQuery 
                                        ? t('search.noResults', 'Aucun résultat trouvé')
                                        : t('list.emptyServices', 'Aucun service retrouvé')
                                    }
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>
        </BottomSheet>
    );
}
