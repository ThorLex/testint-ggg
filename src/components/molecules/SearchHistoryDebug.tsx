/**
 * Composant SearchHistoryDebug (Molecule)
 * 
 * Composant de débogage pour visualiser et tester l'historique de recherche.
 * À utiliser uniquement en développement.
 * 
 * @module components/molecules/SearchHistoryDebug
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { TrashIcon, ArrowPathIcon } from 'react-native-heroicons/outline';

// ============================================================================
// Props
// ============================================================================

export interface SearchHistoryDebugProps {
    /** Type de recherche à afficher */
    type?: 'amodiataires' | 'routes' | 'announcements';
}

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant SearchHistoryDebug
 * 
 * Affiche l'historique de recherche avec des outils de débogage.
 * 
 * @example
 * ```tsx
 * <SearchHistoryDebug type="amodiataires" />
 * ```
 */
export function SearchHistoryDebug({ type }: SearchHistoryDebugProps) {
    const {
        history,
        isLoading,
        error,
        reload,
        addItem,
        removeItem,
        clearAll,
        stats,
        reloadStats
    } = useSearchHistory({ type, autoLoad: true });

    // ============================================================================
    // Handlers
    // ============================================================================

    /**
     * Ajoute un élément de test
     */
    const handleAddTest = async () => {
        try {
            const testQuery = `Test ${Date.now()}`;
            await addItem(testQuery, type || 'amodiataires', {
                amodiataireId: 'test-id',
                amodiataireName: testQuery
            });
            Alert.alert('Succès', 'Élément de test ajouté');
        } catch (err) {
            Alert.alert('Erreur', 'Impossible d\'ajouter l\'élément de test');
        }
    };

    /**
     * Supprime un élément
     */
    const handleRemove = async (itemId: string, query: string) => {
        Alert.alert(
            'Confirmer',
            `Supprimer "${query}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeItem(itemId);
                            Alert.alert('Succès', 'Élément supprimé');
                        } catch (err) {
                            Alert.alert('Erreur', 'Impossible de supprimer l\'élément');
                        }
                    }
                }
            ]
        );
    };

    /**
     * Efface tout l'historique
     */
    const handleClearAll = () => {
        Alert.alert(
            'Confirmer',
            'Effacer tout l\'historique ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Effacer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await clearAll(type);
                            Alert.alert('Succès', 'Historique effacé');
                        } catch (err) {
                            Alert.alert('Erreur', 'Impossible d\'effacer l\'historique');
                        }
                    }
                }
            ]
        );
    };

    /**
     * Recharge l'historique et les stats
     */
    const handleReload = async () => {
        await reload();
        await reloadStats();
        Alert.alert('Succès', 'Historique rechargé');
    };

    // ============================================================================
    // Rendu
    // ============================================================================

    return (
        <View className="flex-1 bg-white dark:bg-gray-900 p-4">
            {/* Header */}
            <View className="mb-4">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    🔍 Historique de Recherche
                </Text>
                <Text className="text-gray-600 dark:text-gray-400">
                    Composant de débogage - Développement uniquement
                </Text>
            </View>

            {/* Statistiques */}
            {stats && (
                <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
                    <Text className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        📊 Statistiques
                    </Text>
                    <Text className="text-blue-800 dark:text-blue-200">
                        Total: {stats.total} éléments
                    </Text>
                    {Object.entries(stats.byType).map(([type, count]) => (
                        <Text key={type} className="text-blue-700 dark:text-blue-300 text-sm">
                            • {type}: {count}
                        </Text>
                    ))}
                    {stats.newestTimestamp && (
                        <Text className="text-blue-600 dark:text-blue-400 text-xs mt-2">
                            Plus récent: {new Date(stats.newestTimestamp).toLocaleString('fr-FR')}
                        </Text>
                    )}
                </View>
            )}

            {/* Actions */}
            <View className="flex-row gap-2 mb-4">
                <TouchableOpacity
                    onPress={handleAddTest}
                    className="flex-1 bg-green-500 rounded-lg p-3 items-center"
                    activeOpacity={0.7}
                >
                    <Text className="text-white font-semibold">+ Ajouter Test</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleReload}
                    className="bg-blue-500 rounded-lg p-3 items-center justify-center"
                    activeOpacity={0.7}
                >
                    <ArrowPathIcon size={20} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleClearAll}
                    className="bg-red-500 rounded-lg p-3 items-center justify-center"
                    activeOpacity={0.7}
                >
                    <TrashIcon size={20} color="white" />
                </TouchableOpacity>
            </View>

            {/* État */}
            {isLoading && (
                <View className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 mb-4">
                    <Text className="text-yellow-800 dark:text-yellow-200">
                        ⏳ Chargement...
                    </Text>
                </View>
            )}

            {error && (
                <View className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 mb-4">
                    <Text className="text-red-800 dark:text-red-200">
                        ❌ Erreur: {error.message}
                    </Text>
                </View>
            )}

            {/* Liste de l'historique */}
            <ScrollView className="flex-1">
                {history.length === 0 ? (
                    <View className="items-center justify-center py-8">
                        <Text className="text-gray-500 dark:text-gray-400 text-center">
                            Aucun élément dans l'historique
                        </Text>
                    </View>
                ) : (
                    history.map((item, index) => (
                        <View
                            key={item.id}
                            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-2"
                        >
                            <View className="flex-row items-start justify-between mb-2">
                                <View className="flex-1">
                                    <Text className="text-gray-900 dark:text-white font-semibold">
                                        {item.query}
                                    </Text>
                                    <Text className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                                        Type: {item.type}
                                    </Text>
                                    <Text className="text-gray-500 dark:text-gray-500 text-xs">
                                        {new Date(item.timestamp).toLocaleString('fr-FR')}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => handleRemove(item.id, item.query)}
                                    className="bg-red-100 dark:bg-red-900/30 rounded-lg p-2"
                                    activeOpacity={0.7}
                                >
                                    <TrashIcon size={16} color="#EF4444" />
                                </TouchableOpacity>
                            </View>

                            {/* Métadonnées */}
                            {item.data && (
                                <View className="bg-white dark:bg-gray-700 rounded p-2 mt-2">
                                    <Text className="text-gray-700 dark:text-gray-300 text-xs font-mono">
                                        {JSON.stringify(item.data, null, 2)}
                                    </Text>
                                </View>
                            )}

                            {/* ID */}
                            <Text className="text-gray-400 dark:text-gray-600 text-xs mt-2">
                                ID: {item.id}
                            </Text>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}
