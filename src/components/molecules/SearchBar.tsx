/**
 * Composant SearchBar (Molecule)
 * 
 * Barre de recherche avec autocomplétion et historique pour trouver des amodiataires.
 * 
 * @module components/molecules/SearchBar
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, TouchableOpacity, FlatList, Text, ActivityIndicator, Alert, Keyboard, Platform, Dimensions, SafeAreaView } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { 
    MagnifyingGlassIcon, 
    XMarkIcon, 
    ClockIcon,
    TrashIcon,
    ArrowLeftIcon
} from 'react-native-heroicons/outline';

// Components & Services
import { Input } from '@/components/atoms';
import { get } from '@/services/api/client';
import { ApiRoutes } from '@/services/api/routes';
import { searchRoutes } from '@/utils/routeUtils';
import { 
    getSearchHistory, 
    addToSearchHistory, 
    removeFromSearchHistory, 
    clearSearchHistory,
    type SearchHistoryItem 
} from '@/services/searchHistory';
import type { AmodiatairMinimal, Route } from '@/types';

// ============================================================================
// Props
// ============================================================================

export type SearchType = 'amodiataires' | 'routes' | 'announcements';

export interface SearchBarProps {
    /** Callback quand un résultat est sélectionné */
    onResultSelect?: (amodiataire: AmodiatairMinimal) => void;
    /** Type de recherche (amodiataires par défaut) */
    searchType?: SearchType;
    /** Routes disponibles pour la recherche */
    routes?: Route[];
    /** Callback quand une route est sélectionnée */
    onRouteSelect?: (route: Route) => void;
    /** Callback pour changer le type de recherche */
    onSearchTypeChange?: (type: SearchType) => void;
}

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant SearchBar
 */
export function SearchBar({ 
    onResultSelect, 
    searchType = 'amodiataires',
    routes = [],
    onRouteSelect,
    onSearchTypeChange 
}: SearchBarProps) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isSelectingResult, setIsSelectingResult] = useState(false);
    
    // État Modal de recherche plein écran
    const [isModalVisible, setIsModalVisible] = useState(false);
    const inputRef = useRef<any>(null);

    // ============================================================================
    // Chargement de l'historique
    // ============================================================================

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

    // Charger l'historique au montage et quand le type change
    useEffect(() => {
        loadSearchHistory();
    }, [loadSearchHistory]);

    // ============================================================================
    // Recherche d'Amodiataires
    // ============================================================================

    const { data: searchResponse, isLoading, error } = useQuery({
        queryKey: ['amodiataires-search', query],
        queryFn: async () => {
            try {
                const response = await get<{ 
                    amodiataires: AmodiatairMinimal[]; 
                    count: number; 
                    success: boolean;
                }>(
                    ApiRoutes.getAmodiatairesSearch(query)
                );
                console.log('🔍 Réponse recherche:', response);
                return response;
            } catch (err) {
                console.error('❌ Erreur recherche:', err);
                throw err;
            }
        },
        enabled: query.length >= 2 && searchType === 'amodiataires',
        staleTime: 30 * 1000,
        retry: 1,
        retryDelay: 1000,
    });

    // Extraire les résultats de recherche avec vérification
    const amodiataireResults = React.useMemo(() => {
        console.log('🔍 searchResponse:', searchResponse);
        
        // Gérer les différentes structures de réponse possibles
        let amodiataires: AmodiatairMinimal[] = [];
        
        const responseData = searchResponse as any;

        // Structure 1: { amodiataires: [...], count: 2, success: true } (réponse directe)
        if (responseData?.amodiataires && Array.isArray(responseData.amodiataires)) {
            amodiataires = responseData.amodiataires;
        }
        // Structure 2: { data: { amodiataires: [...] } }
        else if (responseData?.data?.amodiataires && Array.isArray(responseData.data.amodiataires)) {
            amodiataires = responseData.data.amodiataires;
        }
        // Structure 3: { data: [...] }
        else if (responseData?.data && Array.isArray(responseData.data)) {
            amodiataires = responseData.data as any;
        }
        // Structure 4: [...]
        else if (Array.isArray(responseData)) {
            amodiataires = responseData as any;
        }
        
        console.log('🔍 Amodiataires extraits:', amodiataires.length);
        
        // Filtrer les éléments valides
        const validAmodiataires = amodiataires.filter(item => item && item.id);
        
        // Trier par ordre alphabétique (raison sociale ou nom)
        const sortedAmodiataires = validAmodiataires.sort((a, b) => {
            const nameA = (a.raisonSociale || `${a.nom || ''} ${a.prenom || ''}`).trim().toLowerCase();
            const nameB = (b.raisonSociale || `${b.nom || ''} ${b.prenom || ''}`).trim().toLowerCase();
            return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
        });
        
        console.log('🔍 Résultats triés:', sortedAmodiataires.map(a => a.raisonSociale || a.nom).join(', '));
        
        return sortedAmodiataires;
    }, [searchResponse]);

    // ============================================================================
    // Recherche de Routes
    // ============================================================================

    // COMMENTÉ: Fonctionnalité de recherche de routes désactivée
    // const routeResults = React.useMemo(() => {
    //     if (searchType !== 'routes' || !query || query.length < 2) {
    //         return [];
    //     }
    //     return searchRoutes(routes, query);
    // }, [routes, query, searchType]);
    const routeResults: Route[] = [];

    // ============================================================================
    // Résultats combinés selon le type de recherche
    // ============================================================================

    const results = React.useMemo(() => {
        switch (searchType) {
            case 'routes':
                return routeResults;
            case 'amodiataires':
            default:
                return amodiataireResults;
        }
    }, [searchType, amodiataireResults, routeResults]);

    const isLoadingSearch = searchType === 'amodiataires' && isLoading;
    const hasError = searchType === 'amodiataires' && error;

    // ============================================================================
    // Handlers
    // ============================================================================

    /**
     * Gère le changement de texte
     */
    const handleChangeText = useCallback((text: string) => {
        setQuery(text);
        setShowResults(text.length >= 2);
        setShowHistory(text.length === 0); // Afficher l'historique quand le champ est vide
    }, []);

    /**
     * Ferme le modal de recherche
     */
    const handleCloseModal = useCallback(() => {
        setIsModalVisible(false);
        Keyboard.dismiss();
    }, []);

    /**
     * Gère la perte de focus
     */
    const handleBlur = useCallback(() => {
        // Ne pas fermer si on est en train de sélectionner un résultat
        if (isSelectingResult) {
            return;
        }
        
        // Délai plus long pour permettre les clics sur les résultats
        setTimeout(() => {
            if (!isSelectingResult) {
                setShowResults(false);
                setShowHistory(false);
            }
        }, 300);
    }, [isSelectingResult]);

    /**
     * Gère la sélection d'un résultat amodiataire
     */
    const handleSelectAmodiataire = useCallback(async (amodiataire: AmodiatairMinimal) => {
        try {
            // Marquer qu'on est en train de sélectionner
            setIsSelectingResult(true);
            
            // Fermer le clavier immédiatement
            Keyboard.dismiss();
            
            // Ajouter à l'historique
            await addToSearchHistory(
                amodiataire.raisonSociale || `${amodiataire.nom || ''} ${amodiataire.prenom || ''}`.trim(),
                'amodiataires',
                {
                    amodiataireId: amodiataire.id,
                    amodiataireName: amodiataire.raisonSociale || `${amodiataire.nom || ''} ${amodiataire.prenom || ''}`.trim()
                }
            );

            // Fermer les résultats
            setShowResults(false);
            setShowHistory(false);
            setQuery('');
            setIsModalVisible(false);

            // Recharger l'historique
            loadSearchHistory();

            // Callback pour ouvrir la page de détails
            onResultSelect?.(amodiataire);
            
            // Réinitialiser le flag après un délai
            setTimeout(() => {
                setIsSelectingResult(false);
            }, 500);
        } catch (err) {
            console.error('❌ Erreur sélection résultat:', err);
            setIsSelectingResult(false);
        }
    }, [onResultSelect, loadSearchHistory]);

    /**
     * Gère la sélection d'une route
     */
    const handleSelectRoute = useCallback(async (route: Route) => {
        try {
            // Marquer qu'on est en train de sélectionner
            setIsSelectingResult(true);
            
            // Fermer le clavier immédiatement
            Keyboard.dismiss();
            
            // Ajouter à l'historique
            await addToSearchHistory(
                route.name,
                'routes',
                {
                    routeId: route.id,
                    routeName: route.name
                }
            );

            // Fermer les résultats
            setShowResults(false);
            setShowHistory(false);
            setQuery('');
            setIsModalVisible(false);

            // Recharger l'historique
            loadSearchHistory();

            // Callback pour sélectionner la route
            onRouteSelect?.(route);
            
            // Réinitialiser le flag après un délai
            setTimeout(() => {
                setIsSelectingResult(false);
            }, 500);
        } catch (err) {
            console.error('❌ Erreur sélection route:', err);
            setIsSelectingResult(false);
        }
    }, [onRouteSelect, loadSearchHistory]);

    /**
     * Gère la sélection d'un élément de l'historique
     */
    const handleSelectHistoryItem = useCallback((item: SearchHistoryItem) => {
        setIsSelectingResult(true);
        setQuery(item.query);
        setShowHistory(false);
        setShowResults(true);
        setTimeout(() => {
            setIsSelectingResult(false);
        }, 500);
    }, []);

    /**
     * Supprime un élément de l'historique
     */
    const handleRemoveHistoryItem = useCallback(async (item: SearchHistoryItem) => {
        try {
            await removeFromSearchHistory(item.id);
            loadSearchHistory();
            // Optionnel: afficher un message de confirmation
            console.log(`📚 Élément supprimé: ${item.query}`);
        } catch (error) {
            console.error('❌ Erreur suppression élément:', error);
        }
    }, [loadSearchHistory]);

    /**
     * Efface tout l'historique
     */
    const handleClearHistory = useCallback(async () => {
        Alert.alert(
            t('search.clear_recent', 'Effacer l\'historique'),
            t('search.clear_all', 'Voulez-vous effacer tout l\'historique de recherche ?'),
            [
                {
                    text: t('common.cancel', 'Annuler'),
                    style: 'cancel'
                },
                {
                    text: t('search.clear_all', 'Tout effacer'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await clearSearchHistory(searchType);
                            loadSearchHistory();
                            console.log('📚 Historique effacé');
                        } catch (error) {
                            console.error('❌ Erreur effacement historique:', error);
                        }
                    }
                }
            ]
        );
    }, [t, searchType, loadSearchHistory]);

    /**
     * Gère l'effacement de la recherche
     */
    const handleClear = useCallback(() => {
        setQuery('');
        setShowResults(false);
        setShowHistory(true);
        loadSearchHistory();
    }, [loadSearchHistory]);

    // ============================================================================
    // Rendu des Items
    // ============================================================================

    const renderAmodiataireItem = useCallback(({ item, index }: { item: AmodiatairMinimal; index: number }) => {
        if (!item || !item.id) return null;

        const isFirst = index === 0;
        const isLast = index === results.length - 1;

        return (
            <TouchableOpacity
                onPressIn={() => setIsSelectingResult(true)}
                onPress={() => handleSelectAmodiataire(item)}
                className={`p-4 flex-row items-center bg-white/95 dark:bg-gray-800/95 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    index < results.length - 1 ? 'border-b border-gray-200 dark:border-gray-600' : ''
                } ${isFirst ? 'rounded-t-3xl' : ''} ${isLast ? 'rounded-b-3xl' : ''}`}
                activeOpacity={0.7}
            >
                <View className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full items-center justify-center mr-4">
                    <Text className="text-emerald-700 dark:text-emerald-300 font-bold text-lg">
                        {((item.nom || item.raisonSociale) || '?').charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View className="flex-1">
                    <Text className="text-black dark:text-white font-black text-base uppercase">
                        {item.raisonSociale || `${item.nom || ''} ${item.prenom || ''}`}
                    </Text>
                    {item.telephone && (
                        <Text className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                            {item.telephone}
                        </Text>
                    )}
                </View>
                <View className="w-6 h-6 bg-emerald-500 rounded-full items-center justify-center">
                    <Text className="text-white text-xs font-bold">→</Text>
                </View>
            </TouchableOpacity>
        );
    }, [handleSelectAmodiataire, results.length]);

    const renderRouteItem = useCallback(({ item, index }: { item: Route; index: number }) => {
        const isFirst = index === 0;
        const isLast = index === results.length - 1;

        return (
            <TouchableOpacity
                onPressIn={() => setIsSelectingResult(true)}
                onPress={() => handleSelectRoute(item)}
                className={`p-4 flex-row items-center bg-white/95 dark:bg-gray-800/95 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    index < results.length - 1 ? 'border-b border-gray-200 dark:border-gray-600' : ''
                } ${isFirst ? 'rounded-t-3xl' : ''} ${isLast ? 'rounded-b-3xl' : ''}`}
                activeOpacity={0.7}
            >
                <View className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full items-center justify-center mr-4">
                    <Text className="text-blue-700 dark:text-blue-300 font-bold text-lg">
                        🛣️
                    </Text>
                </View>
                <View className="flex-1">
                    <Text className="text-black dark:text-white font-black text-base uppercase">
                        {item.name}
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                        {t(`route.status.${item.status}`, item.status)} • {item.metadata.roadType}
                    </Text>
                </View>
                <View className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center">
                    <Text className="text-white text-xs font-bold">→</Text>
                </View>
            </TouchableOpacity>
        );
    }, [handleSelectRoute, results.length, t]);

    const renderSearchItem = useCallback((props: { item: any; index: number }) => {
        switch (searchType) {
            case 'routes':
                return renderRouteItem(props as { item: Route; index: number });
            case 'amodiataires':
            default:
                return renderAmodiataireItem(props as { item: AmodiatairMinimal; index: number });
        }
    }, [searchType, renderRouteItem, renderAmodiataireItem]);

    /**
     * Rendu d'un élément de l'historique
     */
    const renderHistoryItem = useCallback(({ item, index }: { item: SearchHistoryItem; index: number }) => {
        const isFirst = index === 0;
        const isLast = index === searchHistory.length - 1;

        return (
            <View
                className={`flex-row items-center bg-white/95 dark:bg-gray-800/95 ${
                    index < searchHistory.length - 1 ? 'border-b border-gray-200 dark:border-gray-600' : ''
                } ${isFirst ? 'rounded-t-3xl' : ''} ${isLast ? 'rounded-b-3xl' : ''}`}
            >
                {/* Zone cliquable principale */}
                <TouchableOpacity
                    onPressIn={() => setIsSelectingResult(true)}
                    onPress={() => handleSelectHistoryItem(item)}
                    className="flex-1 p-4 flex-row items-center"
                    activeOpacity={0.7}
                >
                    <View className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full items-center justify-center mr-3">
                        <ClockIcon size={16} color="#9CA3AF" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-black dark:text-white font-black text-base uppercase">
                            {item.query}
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                            {new Date(item.timestamp).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Bouton de suppression */}
                <TouchableOpacity
                    onPress={() => handleRemoveHistoryItem(item)}
                    className="p-3 mr-2"
                    activeOpacity={0.7}
                >
                    <XMarkIcon size={16} color="#9CA3AF" />
                </TouchableOpacity>
            </View>
        );
    }, [searchHistory.length, handleSelectHistoryItem, handleRemoveHistoryItem]);

    // ============================================================================
    // Rendu Principal
    // ============================================================================

    // Déterminer le placeholder selon le type de recherche
    const placeholder = React.useMemo(() => {
        switch (searchType) {
            case 'routes':
                return t('search.placeholder.routes', 'Rechercher une route...');
            case 'announcements':
                return t('search.placeholder.announcements', 'Rechercher une annonce...');
            case 'amodiataires':
            default:
                return t('search.defaultPlaceholder', 'Rechercher un amodiataire...');
        }
    }, [searchType, t]);

    return (
        <View className="w-full h-full relative z-50" pointerEvents="box-none">
            {/* Backdrop: Fermer au clic en dehors */}
            {isModalVisible && (
                <TouchableOpacity 
                    style={{
                        position: 'absolute',
                        top: -500,
                        left: -500,
                        right: -500,
                        bottom: -2000,
                    }}
                    activeOpacity={1}
                    onPress={handleCloseModal}
                />
            )}

            {/* Vraie Barre de recherche */}
            <View className="h-[40px] justify-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-sm z-50 px-1" pointerEvents="auto">
                <Input
                    value={query}
                    onChangeText={handleChangeText}
                    onFocus={() => {
                        setIsModalVisible(true);
                        if (query.length === 0) {
                            setShowHistory(true);
                            loadSearchHistory();
                        }
                    }}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    leftIcon={<MagnifyingGlassIcon size={20} color="#9CA3AF" />}
                    rightIcon={
                        query.length > 0 ? (
                            <TouchableOpacity onPress={handleClear} className="p-1">
                                <XMarkIcon size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        ) : undefined
                    }
                    className="border-0 bg-transparent h-[40px]"
                    blurOnSubmit={false}
                    returnKeyType="search"
                />
            </View>

            {/* "Dropdown" Overlay (Fix pour le scroll) */}
            {isModalVisible && (showHistory || showResults) && (
                <View 
                    style={{
                        position: 'absolute',
                        top: 56, // Juste en dessous de la barre (48px + margin 8px)
                        left: 0,
                        right: 0,
                        maxHeight: Dimensions.get('window').height * 0.7, // 70% de l'écran max
                        zIndex: 9999,
                    }}
                    pointerEvents="auto"
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/30 overflow-hidden"
                >
                    {/* Zone de contenu principale */}
                    <View className="flex-1">
                        
                        {/* Historique de recherche */}
                        {showHistory && searchHistory.length > 0 && (
                            <View className="flex-1">
                                <View className="flex-row items-center justify-between p-4 border-b border-gray-100/50 dark:border-gray-800/50 bg-white/10 dark:bg-gray-800/10">
                                    <Text className="text-gray-700 dark:text-gray-300 font-semibold text-sm">
                                        {t('search.recent', 'Recherches récentes')}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={handleClearHistory}
                                        className="flex-row items-center"
                                        activeOpacity={0.7}
                                    >
                                        <TrashIcon size={14} color="#9CA3AF" />
                                        <Text className="text-gray-500 dark:text-gray-400 text-xs ml-1">
                                            {t('search.clear_all', 'Tout effacer')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView
                                    keyboardShouldPersistTaps="handled"
                                    keyboardDismissMode="on-drag"
                                    contentContainerStyle={{ paddingBottom: 16 }}
                                    nestedScrollEnabled={true}
                                >
                                    {searchHistory.map((item, index) => (
                                        <View key={item.id}>
                                            {renderHistoryItem({ item, index })}
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Message vide pour historique */}
                        {showHistory && searchHistory.length === 0 && (
                            <View className="p-8 items-center justify-center">
                                <ClockIcon size={32} color="#D1D5DB" />
                                <Text className="text-gray-400 dark:text-gray-500 text-sm mt-3 text-center">
                                    {t('search.no_history', 'Aucun historique de recherche')}
                                </Text>
                            </View>
                        )}

                        {/* Résultats de recherche */}
                        {showResults && (
                            <ScrollView
                                keyboardShouldPersistTaps="handled"
                                keyboardDismissMode="on-drag"
                                className="flex-1"
                                contentContainerStyle={{ paddingBottom: 16 }}
                                nestedScrollEnabled={true}
                            >
                                {isLoadingSearch ? (
                                    <View className="p-6 items-center">
                                        <ActivityIndicator size="small" color="#10B981" />
                                        <Text className="text-gray-500 dark:text-gray-400 mt-3 text-sm font-medium">
                                            {t('search.loading', 'Recherche en cours...')}
                                        </Text>
                                    </View>
                                ) : hasError ? (
                                    <View className="p-4 items-center bg-red-50 dark:bg-red-900/20 m-3 rounded-xl border border-red-100 dark:border-red-800">
                                        <Text className="text-red-600 dark:text-red-400 text-sm font-medium">
                                            {t('search.error', 'Erreur lors de la recherche')}
                                        </Text>
                                    </View>
                                ) : results.length > 0 ? (
                                    <View>
                                        {results.map((item, index) => (
                                            <View key={
                                                searchType === 'routes' 
                                                    ? (item as Route).id || `route-${index}`
                                                    : (item as AmodiatairMinimal)?.id || `item-${index}`
                                            }>
                                                {renderSearchItem({ item, index })}
                                            </View>
                                        ))}
                                    </View>
                                ) : query.length >= 2 ? (
                                    <View className="p-6 items-center">
                                        <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                            {t('search.noResults', 'Aucun résultat trouvé')}
                                        </Text>
                                    </View>
                                ) : null}
                            </ScrollView>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
}
