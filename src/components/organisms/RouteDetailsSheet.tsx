/**
 * RouteDetailsSheet Component (Organism)
 * 
 * Displays detailed information about a selected route in a bottom sheet.
 * Shows route name, status badge, and metadata fields.
 * 
 * @module components/organisms/RouteDetailsSheet
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { XMarkIcon, MapIcon } from 'react-native-heroicons/outline';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/molecules/BottomSheet';
import type { Route } from '@/types';

interface RouteDetailsSheetProps {
    route: Route | null;
    visible: boolean;
    onClose: () => void;
    onNavigate?: (route: Route) => void;
}

export function RouteDetailsSheet({ route, visible, onClose, onNavigate }: RouteDetailsSheetProps) {
    const { t } = useTranslation();
    
    if (!route) return null;
    
    return (
        <BottomSheet
            visible={visible}
            onClose={onClose}
            maxHeight={60}
            showHandle={true}
            scrollable={false}
        >
            <View className="px-6 pt-2 pb-6">
                {/* Header */}
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-2xl font-bold text-gray-900 dark:text-white flex-1 pr-2">
                        {route.name}
                    </Text>
                    <TouchableOpacity 
                        onPress={onClose}
                        className="w-8 h-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
                    >
                        <XMarkIcon size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>
                
                {/* Status Badge */}
                <View className={`self-start px-3 py-1 rounded-full mb-4 ${
                    route.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900' :
                    route.status === 'maintenance' ? 'bg-yellow-100 dark:bg-yellow-900' :
                    'bg-gray-100 dark:bg-gray-700'
                }`}>
                    <Text className={`text-sm font-semibold ${
                        route.status === 'active' ? 'text-emerald-700 dark:text-emerald-300' :
                        route.status === 'maintenance' ? 'text-yellow-700 dark:text-yellow-300' :
                        'text-gray-700 dark:text-gray-300'
                    }`}>
                        {t(`route.status.${route.status}`, route.status)}
                    </Text>
                </View>
                
                {/* Metadata */}
                <View className="space-y-3 mb-4">
                    <MetadataRow 
                        label={t('route.roadType', 'Type de route')}
                        value={route.metadata.roadType}
                    />
                    <MetadataRow 
                        label={t('route.maxSpeed', 'Vitesse max')}
                        value={`${route.metadata.maxSpeed} km/h`}
                    />
                    <MetadataRow 
                        label={t('route.width', 'Largeur')}
                        value={`${route.metadata.width} m`}
                    />
                    <MetadataRow 
                        label={t('route.surface', 'Surface')}
                        value={route.metadata.surface}
                    />
                </View>

                {/* Bouton de navigation */}
                {onNavigate && (
                    <TouchableOpacity
                        onPress={() => onNavigate(route)}
                        className="bg-emerald-500 rounded-xl p-4 flex-row items-center justify-center"
                    >
                        <MapIcon size={20} color="white" />
                        <Text className="text-white font-semibold ml-2">
                            {t('route.navigate', 'Naviguer vers cette route')}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </BottomSheet>
    );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
    return (
        <View className="flex-row justify-between items-center">
            <Text className="text-gray-600 dark:text-gray-400 font-medium">
                {label}
            </Text>
            <Text className="text-gray-900 dark:text-white font-semibold">
                {value}
            </Text>
        </View>
    );
}
