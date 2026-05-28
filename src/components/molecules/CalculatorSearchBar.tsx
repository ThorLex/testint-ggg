/**
 * Composant CalculatorSearchBar (Molecule)
 * 
 * Version spécialisée de SearchBar pour le DistanceCalculator.
 * Optimisée pour la visibilité et l'intégration dans un panneau transparent.
 * 
 * @module components/molecules/CalculatorSearchBar
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, TouchableOpacity, FlatList, Text, ActivityIndicator, Alert, Keyboard, Platform, Dimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { 
    MagnifyingGlassIcon, 
    XMarkIcon, 
    ClockIcon,
    TrashIcon
} from 'react-native-heroicons/outline';

// Components & Services
import { Input } from '@/components/atoms';
import { get } from '@/services/api/client';
import { ApiRoutes } from '@/services/api/routes';
import { 
    getSearchHistory, 
    addToSearchHistory, 
    removeFromSearchHistory, 
    clearSearchHistory,
    type SearchHistoryItem 
} from '@/services/searchHistory';
import type { AmodiatairMinimal } from '@/types';

// ============================================================================
// Props
// ============================================================================

export interface CalculatorSearchBarProps {
    /** Callback quand un résultat est sélectionné */
    onResultSelect?: (amodiataire: AmodiatairMinimal) => void;
    /** Type de recherche (amodiataires par défaut) */
    searchType?: 'amodiataires' | 'routes' | 'announcements';
}

// ============================================================================
// Composant
// ============================================================================

export function CalculatorSearchBar({ 
    onResultSelect, 
    searchType = 'amodiataires'
}: CalculatorSearchBarProps) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isSelectingResult, setIsSelectingResult] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);

    /**
     * Charge l'historique de recherche
     */
    const loadSearchHistory = useCallback(async () => {
        try {
            const history = await getSearchHistory(searchType);
            setSearchHistory(history);
        } catch (error) {
            console.error('❌ Erreur chargement historique:', error);
        }
    }, [searchType]);

    useEffect(() => {
        loadSearchHistory();
    }, [loadSearchHistory]);

    // Recherche d'Amodiataires
    const { data: searchResponse, isLoading, error } = useQuery({
        queryKey: ['calculator-search', query],
        queryFn: async () => {
            return await get<{ 
                amodiataires: AmodiatairMinimal[]; 
                count: number; 
                success: boolean;
            }>(ApiRoutes.getAmodiatairesSearch(query));
        },
        enabled: query.length >= 2 && searchType === 'amodiataires',
        staleTime: 60 * 1000,
    });

    const results = React.useMemo(() => {
        const responseData = searchResponse as any;
        let amodiataires: AmodiatairMinimal[] = [];
        if (responseData?.amodiataires) amodiataires = responseData.amodiataires;
        else if (responseData?.data?.amodiataires) amodiataires = responseData.data.amodiataires;
        else if (Array.isArray(responseData)) amodiataires = responseData;
        
        return amodiataires.filter(item => item && item.id).sort((a, b) => {
            const nameA = (a.raisonSociale || `${a.nom || ''} ${a.prenom || ''}`).trim().toLowerCase();
            const nameB = (b.raisonSociale || `${b.nom || ''} ${b.prenom || ''}`).trim().toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [searchResponse]);

    const handleChangeText = useCallback((text: string) => {
        setQuery(text);
        setShowResults(text.length >= 2);
        setShowHistory(text.length === 0);
    }, []);

    const handleSelectResult = useCallback(async (amodiataire: AmodiatairMinimal) => {
        setIsSelectingResult(true);
        Keyboard.dismiss();
        await addToSearchHistory(
            amodiataire.raisonSociale || `${amodiataire.nom || ''} ${amodiataire.prenom || ''}`.trim(),
            'amodiataires',
            {
                amodiataireId: amodiataire.id,
                amodiataireName: amodiataire.raisonSociale || `${amodiataire.nom || ''} ${amodiataire.prenom || ''}`.trim()
            }
        );
        setShowResults(false);
        setShowHistory(false);
        setQuery('');
        setIsInputFocused(false);
        onResultSelect?.(amodiataire);
        setTimeout(() => setIsSelectingResult(false), 500);
    }, [onResultSelect]);

    const handleSelectHistoryItem = useCallback((item: SearchHistoryItem) => {
        setQuery(item.query);
        setShowHistory(false);
        setShowResults(true);
    }, []);

    const handleClear = useCallback(() => {
        setQuery('');
        setShowResults(false);
        setShowHistory(true);
        loadSearchHistory();
    }, [loadSearchHistory]);

    return (
        <View className="w-full relative z-[1000]">
            {/* Barre de Recherche XXL */}
            <View className="h-14 justify-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-emerald-100 dark:border-emerald-800">
                <Input
                    value={query}
                    onChangeText={handleChangeText}
                    onFocus={() => {
                        setIsInputFocused(true);
                        if (query.length === 0) setShowHistory(true);
                    }}
                    onBlur={() => {
                        if (!isSelectingResult) {
                            setTimeout(() => {
                                setIsInputFocused(false);
                                setShowResults(false);
                                setShowHistory(false);
                            }, 200);
                        }
                    }}
                    placeholder={t('search.defaultPlaceholder', 'Rechercher...')}
                    leftIcon={<MagnifyingGlassIcon size={24} color="#10B981" strokeWidth={2.5} />}
                    rightIcon={
                        query.length > 0 ? (
                            <TouchableOpacity onPress={handleClear} className="p-1">
                                <XMarkIcon size={22} color="#9CA3AF" />
                            </TouchableOpacity>
                        ) : undefined
                    }
                    className="border-0 bg-transparent h-14 text-lg font-bold"
                    placeholderTextColor="#9CA3AF"
                />
            </View>

            {/* Résultats et Historique Inline (pour visibilité totale) */}
            {isInputFocused && (showHistory || showResults) && (
                <View 
                    style={{ maxHeight: 450 }}
                    className="mt-3 mx-[-10] bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-xl border border-emerald-100 dark:border-emerald-900/50 overflow-hidden"
                >
                    <ScrollView 
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                    >
                        <View className="flex-1">
                        {showHistory && searchHistory.length > 0 && (
                            <View>
                                <View className="flex-row items-center justify-between p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-900/30">
                                    <Text className="text-emerald-800 dark:text-emerald-400 font-bold text-sm">
                                        {t('search.recent', 'RECHERCHES RÉCENTES')}
                                    </Text>
                                    <TouchableOpacity onPress={async () => { await clearSearchHistory(searchType); loadSearchHistory(); }}>
                                        <TrashIcon size={16} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                                <View>
                                    {searchHistory.map((item, index) => (
                                        <TouchableOpacity 
                                            key={item.id} 
                                            onPress={() => handleSelectHistoryItem(item)}
                                            className="p-4 flex-row items-center border-b border-gray-100 dark:border-gray-800"
                                        >
                                            <ClockIcon size={20} color="#9CA3AF" />
                                            <Text className="text-gray-900 dark:text-white font-bold text-base ml-3">{item.query}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {showResults && (
                            <View>
                                {isLoading ? (
                                    <ActivityIndicator size="large" color="#10B981" className="p-8" />
                                ) : results.length > 0 ? (
                                    results.map((item, index) => (
                                        <TouchableOpacity 
                                            key={item.id} 
                                            onPress={() => handleSelectResult(item)}
                                            className="p-4 flex-row items-center border-b border-gray-100 dark:border-gray-800"
                                        >
                                            <View className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full items-center justify-center mr-4">
                                                <Text className="text-emerald-700 dark:text-emerald-300 font-black text-xl">
                                                    {(item.raisonSociale || item.nom || '?').charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-gray-900 dark:text-white font-black text-base">
                                                    {item.raisonSociale || `${item.nom || ''} ${item.prenom || ''}`}
                                                </Text>
                                                <Text className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">{item.telephone || 'Amodiataire'}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <Text className="p-8 text-center text-gray-500 font-bold">{t('search.noResults', 'Aucun résultat')}</Text>
                                )}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
            )}
        </View>
    );
}
