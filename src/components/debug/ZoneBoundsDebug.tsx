/**
 * Composant de debug pour vérifier le chargement de zone-bounds
 * À utiliser temporairement pour diagnostiquer les problèmes d'affichage
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/services/api/client';
import { ApiRoutes } from '@/services/api/routes';
import { useMapStore } from '@/store';
import type { ZoneBoundsResponse } from '@/types';

export function ZoneBoundsDebug() {
    const { showsZoneBounds } = useMapStore();
    
    const { 
        data: zoneBounds, 
        isLoading,
        error,
    } = useQuery({
        queryKey: ['zone-bounds'],
        queryFn: () => get<ZoneBoundsResponse>(ApiRoutes.getFullUrl(ApiRoutes.DELIMITATION)),
        staleTime: 24 * 60 * 60 * 1000,
    });

    return (
        <ScrollView className="flex-1 bg-white dark:bg-neutral-900 p-4">
            <Text className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                🔍 Zone Bounds Debug
            </Text>

            {/* État du store */}
            <View className="mb-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <Text className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    📊 État du Store
                </Text>
                <Text className="text-blue-800 dark:text-blue-200">
                    showsZoneBounds: {showsZoneBounds ? '✅ true' : '❌ false'}
                </Text>
            </View>

            {/* État du chargement */}
            <View className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                <Text className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                    ⏳ État du chargement
                </Text>
                <Text className="text-yellow-800 dark:text-yellow-200">
                    isLoading: {isLoading ? '⏳ Chargement...' : '✅ Terminé'}
                </Text>
                <Text className="text-yellow-800 dark:text-yellow-200">
                    hasError: {error ? '❌ Oui' : '✅ Non'}
                </Text>
                <Text className="text-yellow-800 dark:text-yellow-200">
                    hasData: {zoneBounds ? '✅ Oui' : '❌ Non'}
                </Text>
            </View>

            {/* Erreur */}
            {error && (
                <View className="mb-4 p-4 bg-red-50 dark:bg-red-900 rounded-lg">
                    <Text className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                        ❌ Erreur
                    </Text>
                    <Text className="text-red-800 dark:text-red-200">
                        {String(error)}
                    </Text>
                </View>
            )}

            {/* Données */}
            {zoneBounds && (
                <>
                    {/* Bounds */}
                    <View className="mb-4 p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                        <Text className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                            🗺️ Bounds
                        </Text>
                        <Text className="text-green-800 dark:text-green-200">
                            North: {zoneBounds.bounds?.north}
                        </Text>
                        <Text className="text-green-800 dark:text-green-200">
                            South: {zoneBounds.bounds?.south}
                        </Text>
                        <Text className="text-green-800 dark:text-green-200">
                            East: {zoneBounds.bounds?.east}
                        </Text>
                        <Text className="text-green-800 dark:text-green-200">
                            West: {zoneBounds.bounds?.west}
                        </Text>
                    </View>

                    {/* Center */}
                    <View className="mb-4 p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
                        <Text className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
                            📍 Center
                        </Text>
                        <Text className="text-purple-800 dark:text-purple-200">
                            Lat: {zoneBounds.center?.lat ?? zoneBounds.center?.latitude}
                        </Text>
                        <Text className="text-purple-800 dark:text-purple-200">
                            Lng: {zoneBounds.center?.lng ?? zoneBounds.center?.longitude}
                        </Text>
                    </View>

                    {/* Polygon */}
                    <View className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900 rounded-lg">
                        <Text className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                            🔷 Polygon Coordinates
                        </Text>
                        <Text className="text-indigo-800 dark:text-indigo-200">
                            Nombre de points: {zoneBounds.polygonCoordinates?.length ?? 0}
                        </Text>
                        {zoneBounds.polygonCoordinates && zoneBounds.polygonCoordinates.length > 0 && (
                            <>
                                <Text className="text-indigo-800 dark:text-indigo-200 mt-2">
                                    Premier point:
                                </Text>
                                <Text className="text-indigo-700 dark:text-indigo-300 ml-2">
                                    lat: {zoneBounds.polygonCoordinates[0].lat}
                                </Text>
                                <Text className="text-indigo-700 dark:text-indigo-300 ml-2">
                                    lng: {zoneBounds.polygonCoordinates[0].lng}
                                </Text>
                                <Text className="text-indigo-800 dark:text-indigo-200 mt-2">
                                    Dernier point:
                                </Text>
                                <Text className="text-indigo-700 dark:text-indigo-300 ml-2">
                                    lat: {zoneBounds.polygonCoordinates[zoneBounds.polygonCoordinates.length - 1].lat}
                                </Text>
                                <Text className="text-indigo-700 dark:text-indigo-300 ml-2">
                                    lng: {zoneBounds.polygonCoordinates[zoneBounds.polygonCoordinates.length - 1].lng}
                                </Text>
                            </>
                        )}
                    </View>

                    {/* Métadonnées */}
                    <View className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            📝 Métadonnées
                        </Text>
                        <Text className="text-gray-800 dark:text-gray-200">
                            Point Count: {zoneBounds.pointCount ?? 'N/A'}
                        </Text>
                        <Text className="text-gray-800 dark:text-gray-200">
                            Source: {zoneBounds.source ?? 'N/A'}
                        </Text>
                        <Text className="text-gray-800 dark:text-gray-200">
                            Message: {zoneBounds.message ?? 'N/A'}
                        </Text>
                    </View>

                    {/* Verdict */}
                    <View className="mb-4 p-4 bg-teal-50 dark:bg-teal-900 rounded-lg">
                        <Text className="text-lg font-semibold text-teal-900 dark:text-teal-100 mb-2">
                            ✅ Verdict
                        </Text>
                        <Text className="text-teal-800 dark:text-teal-200">
                            {showsZoneBounds && zoneBounds.polygonCoordinates && zoneBounds.polygonCoordinates.length > 0
                                ? '🎉 Le polygone DEVRAIT s\'afficher sur la carte!'
                                : '⚠️ Le polygone ne s\'affichera PAS'}
                        </Text>
                        {!showsZoneBounds && (
                            <Text className="text-teal-700 dark:text-teal-300 mt-2">
                                Raison: showsZoneBounds est désactivé
                            </Text>
                        )}
                        {(!zoneBounds.polygonCoordinates || zoneBounds.polygonCoordinates.length === 0) && (
                            <Text className="text-teal-700 dark:text-teal-300 mt-2">
                                Raison: Aucune coordonnée de polygone
                            </Text>
                        )}
                    </View>
                </>
            )}
        </ScrollView>
    );
}
