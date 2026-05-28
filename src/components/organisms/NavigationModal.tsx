/**
 * Composant NavigationModal (Organism)
 * 
 * Modal pour la navigation avec Google Maps, affichage des routes
 * et assistance vocale.
 * 
 * @module components/organisms/NavigationModal
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import {
    XMarkIcon,
    MapIcon,
    ClockIcon,
    TruckIcon,
    UserIcon,
    PlayIcon,
} from 'react-native-heroicons/outline';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

// Services
import { useLocationPermission } from '@/hooks/useLocationPermission';
import { get } from '@/services/api/client';
import { ApiRoutes } from '@/services/api/routes';
import { useMapData } from '@/hooks/useApi';
import { isPointInPolygon, findNearestRoute, decodePolyline, findBestBackendEntrance, createHybridRoute, calculateDistance, calculateInternalRoute, type PolylineSegment } from '@/utils/geoUtils';
import type { ZoneBoundsResponse, Route } from '@/types';

// Components - CompactNavigationAssistant is rendered by the parent (app/index.tsx)

// ============================================================================
// Types
// ============================================================================

export interface NavigationRoute {
    id: string;
    summary: string;
    duration: string;
    distance: string;
    originName?: string;
    destinationName?: string;
    amodiataireName?: string;
    polyline: {
        latitude: number;
        longitude: number;
    }[];
    buildingCoordinates?: {
        latitude: number;
        longitude: number;
    }[];
    destinationCoordinates?: {
        latitude: number;
        longitude: number;
    };
    segments?: PolylineSegment[];
    steps: NavigationStep[];
    travelMode?: 'driving' | 'walking' | 'transit';
}

export interface NavigationStep {
    instruction: string;
    distance: string;
    duration: string;
    maneuver: string;
}

export interface NavigationModalProps {
    /** Visibilité de la modal */
    visible: boolean;
    /** Callback de fermeture */
    onClose: () => void;
    /** Destination avec coordonnées */
    destination: {
        latitude: number;
        longitude: number;
    } | null;
    /** Adresse de destination */
    destinationAddress?: string;
    /** Mode de transport */
    travelMode?: 'driving' | 'walking' | 'transit';
    /** Callback appelé quand la navigation démarre */
    onNavigationStart?: () => void;
    /** Callback appelé quand une route est sélectionnée pour la navigation */
    onRouteSelected?: (route: NavigationRoute | null) => void;
    /** Coordonnées du polygone du bâtiment */
    buildingCoordinates?: {
        latitude: number;
        longitude: number;
    }[];
    /** Nom de l'amodiataire (pour l'assistant de navigation) */
    amodiataireName?: string;
}

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant NavigationModal
 */
export function NavigationModal({
    visible,
    onClose,
    destination,
    destinationAddress,
    travelMode = 'driving',
    onNavigationStart,
    onRouteSelected,
    buildingCoordinates,
    amodiataireName,
}: NavigationModalProps) {
    const { t } = useTranslation();
    const { getCurrentPosition } = useLocationPermission();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    
    const [routes, setRoutes] = useState<NavigationRoute[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<NavigationRoute | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [currentTravelMode, setCurrentTravelMode] = useState<'driving' | 'walking'>(
        travelMode === 'transit' ? 'driving' : travelMode
    );

    // Charger les données de la carte (incluant les routes backend)
    const { data: mapData } = useMapData();

    // Charger la zone de délimitation
    const { data: zoneBounds } = useQuery({
        queryKey: ['zone-bounds'],
        queryFn: () => get<ZoneBoundsResponse>(ApiRoutes.getFullUrl(ApiRoutes.DELIMITATION)),
        staleTime: 24 * 60 * 60 * 1000, // 24 heures
    });

    // ============================================================================
    // Effets
    // ============================================================================

    /**
     * Charger les routes quand la modal s'ouvre
     */
    useEffect(() => {
        console.log('🔍 NavigationModal: useEffect visible/destination/travelMode', {
            visible,
            hasDestination: !!destination,
            destination,
            travelMode: currentTravelMode
        });
        
        if (visible && destination) {
            console.log('🚀 NavigationModal: Chargement des routes...');
            loadRoutes();
        }
    }, [visible, destination, currentTravelMode]);

    // ============================================================================
    // API Google Directions
    // ============================================================================

    /**
     * Charger les routes depuis Google Directions API
     */
    const loadRoutes = async () => {
        if (!destination) return;

        setIsLoading(true);
        try {
            // Récupérer la position actuelle
            const location = await getCurrentPosition();
            if (!location) {
                Alert.alert(
                    t('navigationModal.error', 'Erreur'),
                    t('navigationModal.noLocation', 'Impossible de récupérer votre position')
                );
                setIsLoading(false);
                return;
            }

            const origin = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            // Sauvegarder la position de l'utilisateur
            setUserLocation(origin);

            console.log('📍 Calcul de l\'itinéraire de', origin, 'vers', destination);

            // --- Logique Hybride Multi-segments ---
            let showInternalFirst = false;
            if (zoneBounds?.polygonCoordinates && mapData?.routes) {
                const isDestInZone = isPointInPolygon(
                    { lat: destination.latitude, lng: destination.longitude },
                    zoneBounds.polygonCoordinates
                );
                const isOriginInZone = isPointInPolygon(
                    { lat: origin.latitude, lng: origin.longitude },
                    zoneBounds.polygonCoordinates
                );
                
                showInternalFirst = isDestInZone && isOriginInZone;
            }

            // --- Déterminer le nom de l'origine ---
            let originName = t('inAppNavigation.myLocation', 'Ma position');
            try {
                const reverseGeocode = await Location.reverseGeocodeAsync({
                    latitude: origin.latitude,
                    longitude: origin.longitude,
                });
                if (reverseGeocode && reverseGeocode[0]) {
                    const address = reverseGeocode[0];
                    const street = address.street || '';
                    const name = address.name || '';
                    const cleanName = (name && !name.includes('+')) ? name : '';
                    if (cleanName && street) originName = `${cleanName}, ${street}`;
                    else if (street) originName = street;
                    else if (cleanName) originName = cleanName;
                }
            } catch (e) {
                console.warn('⚠️ Erreur reverse geocoding:', e);
            }

            // --- Vérification Zone de Délimitation ---
            const isOriginInZone = zoneBounds?.polygonCoordinates ? isPointInPolygon({ lat: origin.latitude, lng: origin.longitude }, zoneBounds.polygonCoordinates) : false;
            const isDestInZone = zoneBounds?.polygonCoordinates ? isPointInPolygon({ lat: destination.latitude, lng: destination.longitude }, zoneBounds.polygonCoordinates) : false;

            if (isOriginInZone && isDestInZone) {
                console.log('🛡️ [Navigation] Le trajet est entièrement dans la zone de délimitation. Bypass Google API.');
                const internalSegments = calculateInternalRoute(
                    origin,
                    { lat: destination.latitude, lng: destination.longitude },
                    mapData?.routes || []
                );

                if (internalSegments) {
                    const finalPolyline = internalSegments.reduce((acc, seg) => [...acc, ...seg.points], [] as { latitude: number, longitude: number }[]);
                    
                    // Extraire les noms des routes backend utilisées
                    const backendNames = internalSegments
                        .filter(s => s.type === 'backend' && s.routeIds)
                        .flatMap(s => s.routeIds!)
                        .map(id => mapData?.routes?.find(r => r.id === id)?.name)
                        .filter(Boolean) as string[];
                    
                    const uniqueBackendNames = Array.from(new Set(backendNames));
                    const backendSummary = uniqueBackendNames.length > 0 
                        ? `: ${uniqueBackendNames.join(', ')}` 
                        : '';

                    const internalRoute: NavigationRoute = {
                        id: 'internal-1',
                        summary: 'Navigation Portuaire' + backendSummary,
                        duration: '-- min',
                        distance: '-- m',
                        originName: originName,
                        destinationName: destinationAddress || 'Zone Portuaire',
                        amodiataireName: amodiataireName,
                        polyline: finalPolyline,
                        buildingCoordinates: buildingCoordinates,
                        destinationCoordinates: destination,
                        segments: internalSegments,
                        steps: [{
                            instruction: 'Suivez le guidage portuaire interne',
                            distance: '',
                            duration: '',
                            maneuver: 'straight',
                        }],
                        travelMode: currentTravelMode,
                    };

                    setRoutes([internalRoute]);
                    setSelectedRoute(internalRoute);
                    if (onRouteSelected) onRouteSelected(internalRoute);
                    setIsLoading(false);
                    return;
                }
            }

            // Appeler l'API Google Directions
            const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
            const currentLanguage = i18n.language || 'fr';
            const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=${currentTravelMode}&alternatives=true&language=${currentLanguage}&key=${GOOGLE_MAPS_API_KEY}`;

            const response = await fetch(directionsUrl);
            const data = await response.json();

            if (data.status === 'OK' && data.routes && data.routes.length > 0) {
                // Récupérer l'adresse de départ
                let originName = data.routes[0].legs[0].start_address || t('inAppNavigation.myLocation', 'Ma position');
                
                // Si l'adresse Google est un Plus Code ou trop générique, tenter expo-location
                if (originName.includes('+') || originName === t('inAppNavigation.myLocation', 'Ma position')) {
                    try {
                        const reverseGeocode = await Location.reverseGeocodeAsync({
                            latitude: origin.latitude,
                            longitude: origin.longitude,
                        });
                        
                        if (reverseGeocode && reverseGeocode[0]) {
                            const address = reverseGeocode[0];
                            const street = address.street || '';
                            const name = address.name || '';
                            const city = address.city || '';
                            const district = address.district || '';
                            const cleanName = (name && !name.includes('+')) ? name : '';
                            if (cleanName && street) {
                                originName = `${cleanName}, ${street}`;
                            } else if (street) {
                                originName = street;
                            } else if (cleanName) {
                                originName = cleanName;
                            } else if (district) {
                                originName = district;
                            } else if (city) {
                                originName = city;
                            }
                        }
                    } catch (geocodingError) {
                        console.warn('⚠️ Erreur reverse geocoding fallback:', geocodingError);
                    }
                }
                
                const parsedRoutes: NavigationRoute[] = data.routes.map((route: any, index: number) => {
                    const googlePoints = decodePolyline(route.overview_polyline.points);
                    
                    // Application du nouveau moteur hybride (Dijkstra)
                    const segments = createHybridRoute(
                        googlePoints,
                        mapData?.routes || [],
                        origin,
                        { lat: destination.latitude, lng: destination.longitude },
                        zoneBounds?.polygonCoordinates
                    );
                    
                    const finalPolyline = segments.reduce((acc, seg) => [
                        ...acc, 
                        ...seg.points
                    ], [] as { latitude: number, longitude: number }[]);
                    
                    // Extraire les étapes
                    const steps: NavigationStep[] = route.legs[0].steps.map((step: any) => ({
                        instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Retirer les balises HTML
                        distance: step.distance.text,
                        duration: step.duration.text,
                        maneuver: step.maneuver || 'straight',
                    }));

                    // Extraire les noms des routes backend utilisées
                    const backendNames = segments
                        .filter(s => s.type === 'backend' && s.routeIds)
                        .flatMap(s => s.routeIds!)
                        .map(id => mapData?.routes?.find(r => r.id === id)?.name)
                        .filter(Boolean) as string[];
                    
                    const uniqueBackendNames = Array.from(new Set(backendNames));
                    const backendSummary = uniqueBackendNames.length > 0 
                        ? ` (via ${uniqueBackendNames.join(', ')})` 
                        : '';

                    return {
                        id: `${index + 1}`,
                        summary: (route.summary || `Route ${index + 1}`) + backendSummary,
                        duration: route.legs[0].duration.text,
                        distance: route.legs[0].distance.text,
                        originName: originName,
                        destinationName: destinationAddress || route.summary || `Route ${index + 1}`,
                        amodiataireName: amodiataireName,
                        polyline: finalPolyline,
                        buildingCoordinates: buildingCoordinates,
                        destinationCoordinates: destination,
                        segments, // Nouveau champ pour le rendu multicolore
                        steps,
                        travelMode: currentTravelMode,
                    } as NavigationRoute;
                });

                setRoutes(parsedRoutes);
                
                // Sélectionner automatiquement la première route
                const firstRoute = parsedRoutes[0];
                setSelectedRoute(firstRoute);
                
                // Envoyer immédiatement la première route au parent pour prévisualisation
                if (onRouteSelected && firstRoute) {
                    console.log('📍 NavigationModal: Envoi automatique de la première route pour prévisualisation:', {
                        id: firstRoute.id,
                        polylineLength: firstRoute.polyline?.length || 0
                    });
                    onRouteSelected(firstRoute);
                }
                
                console.log('✅ Routes chargées depuis Google:', parsedRoutes.length);
            } else {
                console.error('❌ Erreur Google Directions:', data.status);
                Alert.alert(
                    t('navigationModal.error', 'Erreur'),
                    t('navigationModal.routeError', 'Impossible de charger les itinéraires')
                );
            }
        } catch (error) {
            console.error('❌ Erreur chargement routes:', error);
            Alert.alert(
                t('navigationModal.error', 'Erreur'),
                t('navigationModal.routeError', 'Impossible de charger les itinéraires')
            );
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Décoder une polyline encodée de Google
     */
    /**
     * Cache la fonction locale car on utilise celle de geoUtils
     */
    // const decodePolyline = ... (déjà importé de geoUtils)

    // ============================================================================
    // Styles dynamiques
    // ============================================================================

    const dynamicStyles = StyleSheet.create({
        travelModeSelector: {
            flexDirection: 'row',
            backgroundColor: isDark ? '#374151' : '#F3F4F6',
            borderRadius: 12,
            padding: 4,
        },
        travelModeButtonActive: {
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        travelModeText: {
            marginLeft: 8,
            fontSize: 14,
            fontWeight: '500',
            color: isDark ? '#9CA3AF' : '#6B7280',
        },
        travelModeTextActive: {
            color: '#10B981',
            fontWeight: '600',
        },
        closeButton: {
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 16,
            backgroundColor: isDark ? '#374151' : '#F3F4F6',
        },
        routeItem: {
            padding: 12,
            borderRadius: 12,
            marginBottom: 8,
            borderWidth: 1,
            backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
            borderColor: isDark ? '#374151' : '#E5E7EB',
        },
        routeItemSelected: {
            backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
            borderColor: '#10B981',
        },
    });

    // ============================================================================
    // Handlers
    // ============================================================================

    /**
     * Handler pour sélectionner le mode voiture
     */
    const handleDrivingMode = useCallback(() => {
        setCurrentTravelMode('driving');
    }, []);

    /**
     * Handler pour sélectionner le mode à pied
     */
    const handleWalkingMode = useCallback(() => {
        setCurrentTravelMode('walking');
    }, []);

    /**
     * Démarrer la navigation
     */
    const startNavigation = () => {
        console.log('🚀 NavigationModal: startNavigation appelé', { 
            hasDestination: !!destination, 
            hasSelectedRoute: !!selectedRoute,
            selectedRoute: selectedRoute ? {
                id: selectedRoute.id,
                polylineLength: selectedRoute.polyline?.length || 0
            } : null
        });
        
        if (!destination || !selectedRoute) {
            console.error('❌ NavigationModal: Impossible de démarrer - destination ou route manquante');
            return;
        }
        
        console.log('🚀 NavigationModal: Démarrage de la navigation');
        
        // Log ID Unique de l'appareil
        const deviceId = Constants.installationId || Constants.sessionId || 'id-session-missing';
        console.log('**************************************************');
        console.log(`📱 [Navigation] DÉMARRAGE NAVIGATION`);
        console.log(`🆔 DEVICE ID (installationId): ${Constants.installationId || 'N/A'}`);
        console.log(`🆔 SESSION ID: ${Constants.sessionId || 'N/A'}`);
        console.log(`🆔 FINAL ID: ${deviceId}`);
        console.log('**************************************************');
        
        if (onRouteSelected && selectedRoute) {
            console.log('📍 NavigationModal: Envoi de la route au parent avant démarrage:', {
                polylineLength: selectedRoute.polyline?.length || 0,
                stepsCount: selectedRoute.steps?.length || 0,
                travelMode: currentTravelMode
            });
            onRouteSelected({ ...selectedRoute, travelMode: currentTravelMode } as any);
        }
        
        // Appeler le callback de démarrage de navigation
        // Cela va fermer tous les bottom sheets et activer showNavigation dans HomeScreen
        if (onNavigationStart) {
            console.log('🔒 NavigationModal: Appel du callback onNavigationStart');
            onNavigationStart();
        }
        
        // Fermer le modal de sélection de route (le parent gère le CompactNavigationAssistant)
        onClose();
    };


    /**
     * Obtenir l'icône du mode de transport
     */
    const getTravelModeIcon = () => {
        const iconColor = isDark ? '#9CA3AF' : '#6B7280';
        switch (currentTravelMode) {
            case 'walking':
                return <UserIcon size={20} color={iconColor} />;
            default:
                return <TruckIcon size={20} color={iconColor} />;
        }
    };

    // ============================================================================
    // Rendu Principal
    // ============================================================================

    return (
        <>
            <Modal
                visible={visible}
                animationType="slide"
                transparent={true}
                onRequestClose={onClose}
            >
            <View className="flex-1 bg-black/50">
                {/* Zone cliquable pour fermer */}
                <TouchableOpacity 
                    style={{ flex: 1 }}
                    activeOpacity={1} 
                    onPress={onClose}
                />
                
                {/* Bottom Sheet */}
                <View className="bg-white dark:bg-gray-900 rounded-t-3xl max-h-[75%] flex-1">
                    {/* Header avec poignée */}
                    <View className="items-center pt-3 pb-2">
                        <View className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                    </View>
                    
                    <View className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 pb-4">
                        <View className="flex-row items-center justify-between">
                            {/* Logo subtil */}
                            <View className="mr-3">
                                <Image
                                    source={require('../../../assets/icon.png')}
                                    className="w-8 h-8 opacity-60"
                                    resizeMode="contain"
                                />
                            </View>
                            
                            <View className="flex-1 pr-4">
                                <Text className="text-xl font-black text-black dark:text-white uppercase">
                                    {t('navigationModal.title', 'Navigation')}
                                </Text>
                                {destinationAddress && (
                                    <Text className="text-gray-600 dark:text-gray-300 text-sm mt-1" numberOfLines={2}>
                                        {amodiataireName} - {destinationAddress}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity
                                onPress={onClose}
                                style={dynamicStyles.closeButton}
                            >
                                <XMarkIcon size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                            </TouchableOpacity>
                        </View>

                        {/* Sélecteur de mode de transport */}
                        <View style={styles.travelModeContainer}>
                            <View style={dynamicStyles.travelModeSelector}>
                                <TouchableOpacity
                                    onPress={handleDrivingMode}
                                    style={[
                                        styles.travelModeButton,
                                        currentTravelMode === 'driving' && dynamicStyles.travelModeButtonActive
                                    ]}
                                    activeOpacity={0.7}
                                >
                                    <TruckIcon 
                                        size={18} 
                                        color={currentTravelMode === 'driving' ? '#10B981' : (isDark ? '#9CA3AF' : '#6B7280')} 
                                    />
                                    <Text style={[
                                        dynamicStyles.travelModeText,
                                        currentTravelMode === 'driving' && dynamicStyles.travelModeTextActive
                                    ]}>
                                        Véhicule
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    onPress={handleWalkingMode}
                                    style={[
                                        styles.travelModeButton,
                                        currentTravelMode === 'walking' && dynamicStyles.travelModeButtonActive
                                    ]}
                                    activeOpacity={0.7}
                                >
                                    <UserIcon 
                                        size={18} 
                                        color={currentTravelMode === 'walking' ? '#10B981' : (isDark ? '#9CA3AF' : '#6B7280')} 
                                    />
                                    <Text style={[
                                        dynamicStyles.travelModeText,
                                        currentTravelMode === 'walking' && dynamicStyles.travelModeTextActive
                                    ]}>
                                        À pied
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Contenu scrollable - Carte + Routes */}
                    <View className="flex-1">
                        {/* Carte compacte - Affichée seulement pendant le chargement ou si pas de routes */}
                        {(isLoading || routes.length === 0) && (
                            <View className="h-40 bg-gray-100 dark:bg-gray-800">
                                {isLoading ? (
                                    <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
                                        <ActivityIndicator size="large" color="#10B981" />
                                        <Text className="text-gray-500 dark:text-gray-400 mt-4">
                                            {t('navigationModal.loading', 'Calcul de l\'itinéraire...')}
                                        </Text>
                                    </View>
                                ) : !destination ? (
                                    <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
                                        <MapIcon size={48} color="#9CA3AF" />
                                        <Text className="text-gray-500 dark:text-gray-400 text-center mt-4 px-4">
                                            {t('navigationModal.noDestination', 'Aucune destination sélectionnée')}
                                        </Text>
                                    </View>
                                ) : !userLocation ? (
                                    <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
                                        <MapIcon size={48} color="#9CA3AF" />
                                        <Text className="text-gray-500 dark:text-gray-400 text-center mt-4 px-4">
                                            {t('navigationModal.fetchingPosition', 'Récupération de votre position...')}
                                        </Text>
                                    </View>
                                ) : null}
                            </View>
                        )}

                        {/* Panel des routes avec scroll - Prend l'espace restant */}
                        {routes.length > 0 && (
                            <View className="flex-1 bg-white dark:bg-gray-800 px-4 pt-4">
                                {/* Routes disponibles - ScrollView flexible */}
                                <View className="flex-1 mb-4">
                                    <FlatList
                                        data={routes}
                                        keyExtractor={(route) => route.id}
                                        showsVerticalScrollIndicator={true}
                                        nestedScrollEnabled={true}
                                        contentContainerStyle={{ paddingBottom: 16 }}
                                        renderItem={({ item: route }) => (
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setSelectedRoute(route);
                                                    // Informer l'app de la route sélectionnée pour prévisualiser le polyline
                                                    if (onRouteSelected) {
                                                        console.log('📍 NavigationModal: Route sélectionnée pour prévisualisation:', {
                                                            id: route.id,
                                                            polylineLength: route.polyline?.length || 0
                                                        });
                                                        onRouteSelected(route);
                                                    }
                                                }}
                                                style={[
                                                    dynamicStyles.routeItem,
                                                    selectedRoute?.id === route.id && dynamicStyles.routeItemSelected
                                                ]}
                                            >
                                                <View className="flex-row items-center justify-between">
                                                    <View className="flex-row items-center flex-1">
                                                        {getTravelModeIcon()}
                                                        <View className="ml-3 flex-1">
                                                            <Text className="text-black dark:text-white font-black uppercase">
                                                                {route.summary}
                                                            </Text>
                                                            <View className="flex-row items-center mt-1">
                                                                <ClockIcon size={14} color="#9CA3AF" />
                                                                <Text className="text-gray-500 dark:text-gray-400 text-sm ml-1">
                                                                    {route.duration} • {route.distance}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        )}
                                    />
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Bouton de navigation fixe en bas - TOUJOURS VISIBLE */}
                    {routes.length > 0 && (
                        <View 
                            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
                            className="bg-white dark:bg-gray-800 px-4 pb-6 pt-2 border-t border-gray-200 dark:border-gray-700"
                        >
                            <TouchableOpacity
                                onPress={startNavigation}
                                disabled={!selectedRoute}
                                style={[
                                    styles.startButton,
                                    !selectedRoute && styles.startButtonDisabled
                                ]}
                            >
                                <PlayIcon size={20} color="white" />
                                <Text className="text-white font-black ml-2 uppercase">
                                    {t('navigationModal.start', 'Démarrer la navigation')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
        </>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    travelModeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    travelModeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    startButton: {
        backgroundColor: '#10B981',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    startButtonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0,
        elevation: 0,
    },
});