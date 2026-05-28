/**
 * Composant AmodiataireDetailsSheet (Organism)
 * 
 * Affiche les détails d'un amodiataire dans une feuille escamotable (bottom sheet).
 * Utilise Reanimated pour les animations fluides.
 * 
 * @module components/organisms/AmodiataireDetailsSheet
 */

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Linking,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    runOnJS,
} from 'react-native-reanimated';
import {
    PhoneIcon,
    MapPinIcon,
    XMarkIcon,
    ChevronRightIcon,
    ArrowTopRightOnSquareIcon,
    BuildingOffice2Icon,
    ArrowLeftIcon,
} from 'react-native-heroicons/outline';
import { useMapStore } from '@/store';
import { useAmodiataireDetail } from '@/hooks';
import { getCanonicalName } from '@/services/api/amodiataireNamesCache';
import { Card, Button } from '@/components/atoms';
import { useTranslation } from 'react-i18next';
import { DataErrorState } from '@/components/molecules/DataErrorState';
import { LotSelectionModal } from './LotSelectionModal';
import { NavigationModal } from './NavigationModal';
import type { AmodiataireLot } from '@/types';
import { closeAllBottomSheets } from '@/utils/navigationHelpers';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.98;

interface AmodiataireDetailsSheetProps {
    /** Callback appelé quand la navigation démarre */
    onNavigationStart?: () => void;
    /** Callback appelé quand une route est sélectionnée pour la navigation */
    onRouteSelected?: (route: any) => void;
}

export const AmodiataireDetailsSheet = ({ onNavigationStart, onRouteSelected }: AmodiataireDetailsSheetProps = {}) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { selectedMarkerId, setSelectedMarkerId } = useMapStore();
    const [isVisible, setIsVisible] = useState(false);
    const [showLotSelection, setShowLotSelection] = useState(false);
    
    // LOG pour vérifier si le callback est reçu
    console.log('🔍 AmodiataireDetailsSheet: onNavigationStart défini?', !!onNavigationStart);
    const [showNavigation, setShowNavigation] = useState(false);
    const [selectedCoordinates, setSelectedCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<string>('');
    const [buildingCoordinates, setBuildingCoordinates] = useState<{ latitude: number; longitude: number }[] | undefined>(undefined);
    const [currentAmodiataireName, setCurrentAmodiataireName] = useState<string | undefined>(undefined);

    // Hook API pour charger les détails (cache dédié + React Query)
    const { data: detailsResponse, isLoading, isError, refetch } = useAmodiataireDetail(selectedMarkerId || '');

    // Extraire les données de l'amodiataire
    const details = detailsResponse?.amodiataire;

    // Nom résolu : priorité au détail chargé, sinon au cache des noms (disponible dès le chargement de la liste),
    // garantissant que le nom affiché ici est toujours identique à celui gravé dans le bitmap
    const resolvedName = React.useMemo(() => {
        if (details?.lot?.raisonSociale) return details.lot.raisonSociale;
        if ((details as any)?.raisonSociale) return (details as any).raisonSociale;
        if (selectedMarkerId) return getCanonicalName(selectedMarkerId) ?? '';
        return '';
    }, [details, selectedMarkerId]);

    // Animation de la feuille
    const translateY = useSharedValue(SCREEN_HEIGHT);

    useEffect(() => {
        if (selectedMarkerId) {
            setIsVisible(true);
            translateY.value = withSpring(SCREEN_HEIGHT - SHEET_HEIGHT, {
                damping: 20,
                stiffness: 90,
            });
        } else {
            translateY.value = withTiming(SCREEN_HEIGHT, {}, (finished) => {
                if (finished) {
                    runOnJS(setIsVisible)(false);
                }
            });
        }
    }, [selectedMarkerId]);

    useEffect(() => {
        if (details) {
            console.log('--------------------------------------------------');
            console.log('📄 [AmodiataireDetailsSheet] Détails chargés');
            console.log('🆔 ID:', details.id);
            console.log('👤 Nom:', resolvedName || 'Inconnu');
            console.log('🏗️ Bâtiments (lot.batiments):', (details.lot?.batiments || (details as any).batiments)?.length || 0);
            console.log('📍 Coordonnées (lot.coordinates):', (details.lot?.coordinates || (details as any).coordinates)?.length || 0);
            console.log('🎯 Centre (lot.center):', !!(details.lot?.center || (details as any).center));
            console.log('--------------------------------------------------');
        }
    }, [details]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
            paddingBottom: insets.bottom,
        };
    });

    const handleClose = () => {
        setSelectedMarkerId(null);
    };

    const handleCall = () => {
        if (details?.profile?.phone) {
            Linking.openURL(`tel:${details.profile.phone}`);
        }
    };

    const handleEmail = () => {
        if (details?.profile?.email) {
            Linking.openURL(`mailto:${details.profile.email}`);
        }
    };

    const handleNavigate = () => {
        console.log('🚀 AmodiataireDetailsSheet: handleNavigate appelé');
        if (details) {
            console.log('📦 Details structure:', JSON.stringify({
                id: details.id,
                hasLot: !!details.lot,
                lotCoordsLength: details.lot?.coordinates?.length,
                directCoordsLength: (details as any).coordinates?.length,
                batimentsLength: (details.lot?.batiments || (details as any).batiments)?.length
            }));

            // Gérer le cas où les données sont à la racine (flat) ou dans l'objet 'lot'
            const lot = details.lot || details;
            
            // Si plusieurs bâtiments ou lots, afficher la sélection
            if ((lot?.batiments && lot.batiments.length > 1) || (lot?.coordinates && Array.isArray(lot.coordinates) && lot.coordinates.length > 1 && lot.coordinates.length < 5)) {
                console.log('📍 Plusieurs bâtiments ou lots détectés, ouverture de la sélection');
                setShowLotSelection(true);
            } else {
                // Un seul lot ou coordonnées simples
                let coords = null;
                
                if (lot?.center) {
                    coords = lot.center;
                } else if (lot?.coordinates && Array.isArray(lot.coordinates) && lot.coordinates.length > 0) {
                    // Si c'est un point unique ou le début d'un polygone
                    coords = lot.coordinates[0];
                } else if (lot?.coordinates && !Array.isArray(lot.coordinates)) {
                    coords = lot.coordinates;
                }
                
                if (coords) {
                    // Normaliser les coordonnées de destination
                    const normalizedCoords = {
                        latitude: (coords as any).latitude || (coords as any).lat,
                        longitude: (coords as any).longitude || (coords as any).lng,
                    };
                    
                    if (normalizedCoords.latitude && normalizedCoords.longitude) {
                        console.log('📍 Coordonnées de destination:', normalizedCoords);
                        
                        // Chercher le bâtiment correspondant pour le tracé (footprint)
                        let buildingCoords: { latitude: number; longitude: number }[] | undefined = undefined;
                        
                        // 1. Essayer de prendre le tracé du premier bâtiment
                        if (lot?.batiments && lot.batiments.length > 0) {
                            const bat = lot.batiments[0];
                            if (Array.isArray(bat.coordinates) && bat.coordinates.length > 2) {
                                buildingCoords = bat.coordinates.map(c => ({
                                    latitude: (c as any).latitude || (c as any).lat,
                                    longitude: (c as any).longitude || (c as any).lng
                                }));
                            }
                        }
                        
                        // 2. Fallback: Utiliser lot.coordinates si c'est un tracé (plus de 2 points)
                        if (!buildingCoords && Array.isArray(lot?.coordinates) && lot.coordinates.length > 2) {
                            console.log('📍 Utilisation de lot.coordinates comme tracé');
                            buildingCoords = lot.coordinates.map(c => {
                                const lat = (c as any).latitude || (c as any).lat;
                                const lng = (c as any).longitude || (c as any).lng;
                                return { latitude: Number(lat), longitude: Number(lng) };
                            }).filter(p => !isNaN(p.latitude) && !isNaN(p.longitude));
                        }

                        // Construire l'affichage de la destination : Nom + Adresse Alphanumérique
                        const alphaNum = (lot as any)?.adresseAlphanumerique || (lot as any)?.adresseAlphanumérique || lot?.numeroLot || '';
                        const destinationLabel = alphaNum ? `${resolvedName} - ${alphaNum}` : resolvedName;

                        setSelectedCoordinates(normalizedCoords);
                        setSelectedAddress(destinationLabel);
                        setBuildingCoordinates(buildingCoords);
                        setCurrentAmodiataireName(resolvedName);
                        console.log('🚀 Ouverture de NavigationModal', buildingCoords ? `avec tracé (${buildingCoords.length} points)` : 'sans tracé');
                        setShowNavigation(true);
                    } else {
                        console.error('❌ Coordonnées invalides:', normalizedCoords);
                    }
                } else {
                    console.error('❌ Aucune coordonnée trouvée');
                }
            }
        } else {
            console.error('❌ Pas de détails disponibles');
        }
    };

    const handleLotSelect = (lot: any) => {
        // Extraire les coordonnées du bâtiment (footprint)
        let buildingCoords: { latitude: number; longitude: number }[] | undefined = undefined;
        if (Array.isArray(lot.coordinates) && lot.coordinates.length > 2) {
            buildingCoords = lot.coordinates.map((c: any) => ({
                latitude: c.latitude || c.lat,
                longitude: c.longitude || c.lng
            }));
        }

        // Utiliser lot.center pour la destination (marqueur Google), fallback sur le premier point
        const destinationPoint = lot.center || (Array.isArray(lot.coordinates) ? lot.coordinates[0] : lot.coordinates);

        const alphaNum = lot.adresseAlphanumerique || lot.adresseAlphanumérique || lot.numeroLot || '';
        const destinationLabel = alphaNum ? `${resolvedName} - ${alphaNum}` : resolvedName;

        setSelectedCoordinates({
            latitude: destinationPoint.latitude || destinationPoint.lat,
            longitude: destinationPoint.longitude || destinationPoint.lng
        });
        setSelectedAddress(destinationLabel);
        setBuildingCoordinates(buildingCoords);
        setCurrentAmodiataireName(resolvedName);
        setShowLotSelection(false);
        setShowNavigation(true);
    };

    if (!isVisible) return null;

    return (
        <Animated.View
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 rounded-t-3xl shadow-2xl overflow-hidden"
            style={[{ height: SHEET_HEIGHT, zIndex: 1000 }, animatedStyle]}
        >
            {/* Barre de saisie / Fermeture */}
            <View className="items-center py-3">
                <View className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
            </View>

            <TouchableOpacity
                onPress={handleClose}
                className="absolute top-4 left-4 z-10 p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full"
            >
                <ArrowLeftIcon size={20} color="#10B981" />
            </TouchableOpacity>

            <TouchableOpacity
                onPress={handleClose}
                className="absolute top-4 right-4 z-10 p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full"
            >
                <XMarkIcon size={20} color="#737373" />
            </TouchableOpacity>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {isLoading ? (
                    <View className="flex-1 justify-center items-center py-20">
                        <ActivityIndicator size="large" color="#10B981" />
                        <Text className="mt-4 text-neutral-500">{t('common.loading')}</Text>
                    </View>
                ) : isError || !details ? (
                    <DataErrorState 
                        onRetry={() => refetch()}
                    />
                ) : (
                    <View className="pb-10">

                        {/* En-tête Infos */}
                        <View className="px-6 mt-10 mb-6">
                            <Text className="text-2xl font-black text-black dark:text-white mb-1 uppercase">
                                {resolvedName}
                            </Text>
                            <View className="flex-row items-center">
                                <View className="bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded mr-2">
                                    <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase">
                                        {details.lot?.isTemporary ? 'Temporaire' : 'Amodiataire/service'}
                                    </Text>
                                </View>
                                {details.lot?.adresse && (
                                    <View className="flex-row items-center">
                                        <MapPinIcon size={14} color="#737373" />
                                        <Text className="text-neutral-500 text-sm ml-1">
                                            {details.lot.adresse}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Bouton Itinéraire uniquement */}
                        <View className="px-6 mb-8">
                            <TouchableOpacity
                                onPress={handleNavigate}
                                className="items-center justify-center py-3 rounded-2xl flex-row bg-neutral-900 dark:bg-white"
                            >
                                <ArrowTopRightOnSquareIcon size={20} color="#FFF" />
                                <Text className="text-white dark:text-black font-bold ml-2">{t('navigationModal.title', 'Itinéraire')}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Section Bâtiments */}
                        {(details.lot?.nombreLots || (details as any).nombreLots || 0) > 1 && (
                            <View className="px-6 mb-8">
                                <Text className="text-lg font-black text-black dark:text-white mb-4 uppercase">
                                    Bâtiments
                                </Text>
                                <TouchableOpacity 
                                    onPress={() => setShowLotSelection(true)}
                                    className="flex-row items-center bg-neutral-50 dark:bg-neutral-800 p-4 rounded-2xl"
                                >
                                    <View className="bg-blue-100 p-2 rounded-lg">
                                        <BuildingOffice2Icon size={20} color="#3B82F6" />
                                    </View>
                                    <View className="flex-1 ml-4">
                                        <Text className="text-neutral-800 dark:text-neutral-200 font-medium">
                                            {details.lot.nombreLots} bâtiments disponibles
                                        </Text>
                                        <Text className="text-neutral-500 dark:text-neutral-400 text-sm">
                                            Sélectionner un bâtiment pour la navigation
                                        </Text>
                                    </View>
                                    <ChevronRightIcon size={16} color="#737373" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Modals */}
            <LotSelectionModal
                visible={showLotSelection}
                onClose={() => setShowLotSelection(false)}
                onSelectLot={handleLotSelect}
                amodiataire={details || null}
            />

            <NavigationModal
                visible={showNavigation}
                onClose={() => setShowNavigation(false)}
                destination={selectedCoordinates}
                destinationAddress={selectedAddress}
                buildingCoordinates={buildingCoordinates}
                amodiataireName={currentAmodiataireName}
                onRouteSelected={(route) => {
                    console.log('📍 AmodiataireDetailsSheet: Route reçue pour navigation:', route);
                    // NE PAS fermer le modal ici - attendre que l'utilisateur clique sur "Démarrer"
                    // Passer la route au parent (app/index.tsx) pour afficher le polyline sur la carte
                    if (onRouteSelected) {
                        onRouteSelected(route);
                    }
                }}
                onNavigationStart={() => {
                    console.log('🔒 AmodiataireDetailsSheet: onNavigationStart appelé!');
                    
                    // Informer le parent qu'on démarre la navigation
                    console.log('📍 AmodiataireDetailsSheet: Activation de la navigation dans HomeScreen');
                    
                    // Fermer le modal de navigation
                    setShowNavigation(false);
                    // Fermer ce sheet
                    handleClose();
                    // Appeler le callback parent pour fermer tous les sheets et activer la navigation
                    if (onNavigationStart) {
                        onNavigationStart();
                    }
                    // Appeler la fonction globale
                    console.log('🔒 AmodiataireDetailsSheet: Appel de closeAllBottomSheets GLOBAL');
                    closeAllBottomSheets();
                }}
            />
        </Animated.View>
    );
};
