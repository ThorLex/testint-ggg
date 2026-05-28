/**
 * Composant LotSelectionModal (Organism)
 * 
 * Modal pour sélectionner un lot spécifique d'un amodiataire
 * qui possède plusieurs lots.
 * 
 * @module components/organisms/LotSelectionModal
 */

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    XMarkIcon,
    MapPinIcon,
    BuildingOfficeIcon,
    ArrowRightIcon,
} from 'react-native-heroicons/outline';

// Types
import type { AmodiataireDetail, AmodiataireLot } from '@/types/api';

// ============================================================================
// Props
// ============================================================================

export interface LotSelectionModalProps {
    /** Visibilité de la modal */
    visible: boolean;
    /** Callback de fermeture */
    onClose: () => void;
    /** Amodiataire sélectionné avec ses détails */
    amodiataire: AmodiataireDetail | null;
    /** Callback de sélection d'un lot */
    onSelectLot: (lot: AmodiataireLot) => void;
}

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant LotSelectionModal
 */
export function LotSelectionModal({
    visible,
    onClose,
    amodiataire,
    onSelectLot,
}: LotSelectionModalProps) {
    const { t } = useTranslation();

    // Générer les lots à partir des bâtiments de l'amodiataire
    const lots: AmodiataireLot[] = React.useMemo(() => {
        const lotData = amodiataire?.lot || amodiataire;

        console.log('--------------------------------------------------');
        console.log('🏗️ [LotSelectionModal] Génération des lots');
        console.log('📦 lotData structure:', JSON.stringify({
            hasBatiments: !!lotData?.batiments,
            batimentsCount: lotData?.batiments?.length,
            hasCoordinates: !!lotData?.coordinates,
            coordsCount: Array.isArray(lotData?.coordinates) ? lotData.coordinates.length : 1
        }));

        // Priorité aux bâtiments explicites
        if (lotData?.batiments && lotData.batiments.length > 0) {
            return lotData.batiments.map((batiment) => {
                // Normaliser les coordonnées (utiliser center si disponible, sinon le premier point de coordinates)
                let normalizedCoord: { latitude: number; longitude: number };

                const batimentWithExtras = batiment as any;
                if (batimentWithExtras.center) {
                    normalizedCoord = {
                        latitude: batimentWithExtras.center.latitude || batimentWithExtras.center.lat || 0,
                        longitude: batimentWithExtras.center.longitude || batimentWithExtras.center.lng || 0,
                    };
                } else if (Array.isArray(batiment.coordinates) && batiment.coordinates.length > 0) {
                    const firstCoord = batiment.coordinates[0];
                    normalizedCoord = {
                        latitude: (firstCoord as any).latitude || (firstCoord as any).lat || 0,
                        longitude: (firstCoord as any).longitude || (firstCoord as any).lng || 0,
                    };
                } else {
                    normalizedCoord = {
                        latitude: 0,
                        longitude: 0,
                    };
                }

                return {
                    ...batiment,
                    center: normalizedCoord,
                    // S'assurer que numeroLot et adresse sont présents pour l'affichage
                    numeroLot: batimentWithExtras.numeroLot || batiment.id || 'Bâtiment',
                    adresse: batimentWithExtras.adresse || lotData.adresse || 'Sans adresse',
                } as AmodiataireLot;
            });
        }

        // Fallback: Si pas de bâtiments mais un tableau de coordonnées (lots multiples)
        if (lotData?.coordinates && Array.isArray(lotData.coordinates) && lotData.coordinates.length > 1 && lotData.coordinates.length < 5) {
            return lotData.coordinates.map((coord: any, index: number) => {
                const normalizedCoord = {
                    latitude: coord.latitude || coord.lat,
                    longitude: coord.longitude || coord.lng,
                };

                const adresse = lotData.adresse || `Lot ${index + 1}`;

                return {
                    id: `${amodiataire?.id || 'unknown'}-lot-${index + 1}`,
                    numeroLot: adresse,
                    adresse: adresse,
                    coordinates: coord, // Garder l'original si c'est un polygone
                    center: normalizedCoord, // Point pour le marqueur/destination
                    description: `${adresse} - ${lotData.raisonSociale || amodiataire?.profile?.username || ''}`,
                    superficie: lotData.superficie ? Math.round(lotData.superficie / (lotData.coordinates?.length || 1)) : undefined,
                } as AmodiataireLot;
            });
        }

        console.log('⚠️ [LotSelectionModal] Aucun lot généré !');
        return [];
    }, [amodiataire]);

    console.log('📋 [LotSelectionModal] Nombre de lots disponibles:', lots.length);

    // ============================================================================
    // Handlers
    // ============================================================================

    /**
     * Gère la sélection d'un lot
     */
    const handleLotSelect = (lot: AmodiataireLot) => {
        onSelectLot(lot);
        onClose();
    };

    // ============================================================================
    // Rendu d'un Lot
    // ============================================================================

    const renderLotItem = ({ item, index }: { item: AmodiataireLot; index: number }) => (
        <TouchableOpacity
            onPress={() => handleLotSelect(item)}
            className={`bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 dark:border-gray-700 ${index === 0 ? 'border-emerald-200 dark:border-emerald-800' : ''
                }`}
            activeOpacity={0.7}
        >
            <View className="flex-row items-center">
                {/* Icône */}
                <View className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full items-center justify-center mr-4">
                    <BuildingOfficeIcon size={24} color="#10B981" />
                </View>

                {/* Informations */}
                <View className="flex-1">
                    {/* Nom de la parcelle (Titre) */}
                    <Text className="text-gray-900 dark:text-white font-semibold text-base">
                        {item.nom || '-'}
                    </Text>

                    <View className="flex-row items-center mt-1">
                        <MapPinIcon size={14} color="#9CA3AF" />
                        <Text className="text-gray-600 dark:text-gray-300 text-sm ml-1 flex-1">
                            {item.adresse}
                        </Text>
                    </View>

                    {item.numeroLot && (
                        <View className="flex-row items-center mt-1">
                            <Text className="text-gray-400 text-xs uppercase font-bold">Lot: </Text>
                            <Text className="text-gray-600 dark:text-gray-300 text-sm ml-1">
                                {item.numeroLot}
                            </Text>
                        </View>
                    )}

                    {item.description && (
                        <Text className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                            {item.description}
                        </Text>
                    )}

                    {/* Informations supplémentaires */}
                    {item.superficie && (
                        <View className="flex-row mt-2">
                            <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                                Superficie: {item.superficie}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Flèche */}
                <ArrowRightIcon size={20} color="#9CA3AF" />
            </View>
        </TouchableOpacity>
    );

    // ============================================================================
    // Rendu Principal
    // ============================================================================

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-gray-50 dark:bg-gray-900">
                {/* Header */}
                <View className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 pt-12 pb-4">
                    <View className="flex-row items-center justify-between px-4">
                        <View className="flex-1">
                            <Text className="text-xl font-bold text-gray-900 dark:text-white">
                                Sélectionner un bâtiment
                            </Text>
                            {amodiataire && (
                                <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                    {amodiataire.lot?.raisonSociale || amodiataire.profile?.username || ''}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-8 h-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
                        >
                            <XMarkIcon size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Compteur */}
                    <Text className="text-gray-500 dark:text-gray-400 text-sm px-4 mt-2">
                        {lots.length} bâtiments disponibles
                    </Text>
                </View>

                {/* Contenu */}
                <View className="flex-1 px-4 pt-4">
                    {lots.length > 0 ? (
                        <FlatList
                            data={lots}
                            keyExtractor={(item) => item.id}
                            renderItem={renderLotItem}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    ) : (
                        <View className="flex-1 items-center justify-center">
                            <BuildingOfficeIcon size={48} color="#9CA3AF" />
                            <Text className="text-gray-500 dark:text-gray-400 text-center mt-4">
                                Aucun bâtiment disponible
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}