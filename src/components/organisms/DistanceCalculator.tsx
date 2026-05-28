/**
 * Composant DistanceCalculator (Organism)
 * 
 * Un outil flottant pour calculer la distance entre deux points par la route.
 * Flux enrichi : Recherche amodiataire → Sélection de lot → Destination → Routes alternatives → Résultat
 * 
 * @module components/organisms/DistanceCalculator
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions,
    Keyboard,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    useWindowDimensions,
    TouchableWithoutFeedback,
    useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import {
    XMarkIcon,
    MapPinIcon,
    ArrowPathIcon,
    MapIcon,
    ChevronLeftIcon,
    ChevronDownIcon,
    BuildingOfficeIcon,
    ArrowRightIcon,
} from 'react-native-heroicons/outline';
import { Waypoints } from 'lucide-react-native';
import * as Location from 'expo-location';

// Services & Hooks
import { useMapStore } from '@/store';
import { useLocationPermission } from '@/hooks/useLocationPermission';
import { decodePolyline, createHybridRoute, isPointInPolygon, calculateInternalRoute, calculateRouteMetrics, formatDistance, formatDuration } from '@/utils/geoUtils';
import { get } from '@/services/api/client';
import { ApiRoutes } from '@/services/api/routes';
import { useMapData } from '@/hooks/useApi';
import { useQuery } from '@tanstack/react-query';
import i18n from 'i18next';

// Components
import { CalculatorSearchBar } from '@/components/molecules/CalculatorSearchBar';

// Types
import type { AmodiataireDetailResponse, AmodiataireLot, Building } from '@/types/api';

// ============================================================================
// Types
// ============================================================================

export interface PointInfo {
    latitude: number;
    longitude: number;
    name: string;
    polygonCoordinates?: { latitude: number; longitude: number }[];
}

export interface RouteAlternative {
    index: number;
    distance: string;
    duration: string;
    summary: string;
    polyline: { latitude: number; longitude: number }[];
    segments?: any[]; // On pourrait typer plus précisément si besoin
}

export interface DistanceCalculatorProps {
    /** Callback quand une route est calculée pour l'afficher sur la carte */
    onRouteCalculated: (route: {
        polyline: { latitude: number; longitude: number }[];
        summary: string;
        distance: string;
        duration: string;
        originMarker?: PointInfo;
        destinationMarker?: PointInfo;
        segments?: any[];
    } | null) => void;
    /** Callback pour fermer les autres panels si besoin */
    onExpand?: () => void;
    /** Indique si le FAB interne doit être affiché */
    showFab?: boolean;
}

export interface DistanceCalculatorRef {
    open: () => void;
    close: () => void;
}

// Étapes du flux
type CalculatorStep = 
    | 'search_origin'       // 0: Rechercher un amodiataire origine
    | 'select_origin_parcel'  // 1: Sélectionner la parcelle origine
    | 'search_destination'  // 2: Rechercher destination
    | 'select_dest_parcel'    // 2b: Sélectionner la parcelle destination
    | 'select_route'        // 3: Choisir parmi les routes alternatives
    | 'result';             // 4: Résultat final

// ============================================================================
// Composant
// ============================================================================
/**
 * Composant DistanceCalculator
 */
export const DistanceCalculator = React.forwardRef<DistanceCalculatorRef, DistanceCalculatorProps>(({ 
    onRouteCalculated, 
    onExpand,
    showFab = true,
}, ref) => {
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { getCurrentPosition } = useLocationPermission();
    const insets = useSafeAreaInsets();
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    
    // Boundary constants
    const BOTTOM_NAV_HEIGHT = 110;
    const APP_BAR_HEIGHT = 100; // top-20 + logo/search height
    const SAFE_TOP = insets.top + APP_BAR_HEIGHT;
    
    // États principaux
    const [isExpanded, setIsExpanded] = useState(false);
    const [step, setStep] = useState<CalculatorStep>('search_origin');
    const [origin, setOrigin] = useState<PointInfo | null>(null);
    const [destination, setDestination] = useState<PointInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState<RouteAlternative | null>(null);
    
    // États lots
    const [originLots, setOriginLots] = useState<AmodiataireLot[]>([]);
    const [destLots, setDestLots] = useState<AmodiataireLot[]>([]);
    const [selectedAmoditaireName, setSelectedAmoditaireName] = useState('');
    const [selectedDestAmoditaireName, setSelectedDestAmoditaireName] = useState('');

    // Charger les données de la carte (incluant les routes backend)
    const { data: mapData } = useMapData();

    // Charger la zone de délimitation
    const { data: zoneBounds } = useQuery({
        queryKey: ['zone-bounds'],
        queryFn: () => get<any>(ApiRoutes.getFullUrl(ApiRoutes.DELIMITATION)),
        staleTime: 24 * 60 * 60 * 1000, // 24 heures
    });
    
    // Routes alternatives
    const [routeAlternatives, setRouteAlternatives] = useState<RouteAlternative[]>([]);
    
    // Mode compact pour le résultat
    const [isMinimizedResult, setIsMinimizedResult] = useState(false);
    
    // Keyboard
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    // Drag values
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const keyboardOffset = useSharedValue(0);
    const startX = useSharedValue(0);
    const startY = useSharedValue(0);

    const panGesture = Gesture.Pan()
        .onStart(() => {
            startX.value = translateX.value;
            startY.value = translateY.value;
        })
        .onUpdate((event) => {
            translateX.value = startX.value + event.translationX;
            translateY.value = startY.value + event.translationY;
        })
        .runOnJS(true);

    // Animation values
    const animatedFabStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: withTiming(isExpanded || !showFab ? 0 : 1, { duration: 300 }) }
            ],
            opacity: withTiming(isExpanded || !showFab ? 0 : 1, { duration: 300 }),
        };
    });

    const animatedPanelStyle = useAnimatedStyle(() => {
        const panelInitialBottom = BOTTOM_NAV_HEIGHT;
        
        // Dynamic target height based on step and minimization
        let targetHeight = windowHeight * 0.7;
        if (step === 'result' && isMinimizedResult) {
            targetHeight = windowHeight * 0.18; // Even more compact
        }
        
        const baseTranslateY = withTiming(isExpanded ? 0 : windowHeight, { duration: 400 });
        
        const topEdgeBase = windowHeight - BOTTOM_NAV_HEIGHT - targetHeight;
        const currentShift = translateY.value - keyboardOffset.value;
        const clampedShift = Math.max(currentShift, SAFE_TOP - topEdgeBase);

        return {
            height: withTiming(isExpanded ? targetHeight : 0, { duration: 400 }),
            transform: [
                { translateY: baseTranslateY },
                { translateX: translateX.value },
                { translateY: clampedShift }
            ],
            opacity: withTiming(isExpanded ? 1 : 0, { duration: 300 }),
            pointerEvents: isExpanded ? 'auto' : 'none',
        };
    });

    // Keyboard listeners
    useEffect(() => {
        const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
            setKeyboardVisible(true);
            setKeyboardHeight(e.endCoordinates.height);
            // Move up by keyboard height minus the base bottom offset (110) plus a small margin (10)
            const offset = Math.max(0, e.endCoordinates.height - 100);
            keyboardOffset.value = withTiming(offset, { duration: 300 });
        });
        const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
            setKeyboardVisible(false);
            setKeyboardHeight(0);
            keyboardOffset.value = withTiming(0, { duration: 300 });
        });
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    // Sync state to map
    useEffect(() => {
        if (!origin && !destination && !selectedRoute) {
            onRouteCalculated(null);
            return;
        }

        onRouteCalculated({
            polyline: selectedRoute?.polyline || [],
            summary: selectedRoute ? `${origin?.name} → ${destination?.name}` : '',
            distance: selectedRoute?.distance || '',
            duration: selectedRoute?.duration || '',
            originMarker: origin || undefined,
            destinationMarker: destination || undefined,
            segments: selectedRoute?.segments,
        });
    }, [origin, destination, selectedRoute]);

    // ============================================================================
    // Handlers
    // ============================================================================

    // Helper function to normalize coordinates into array of {latitude, longitude}
    const normalizePolygon = (coords: any): {latitude: number, longitude: number}[] | undefined => {
        if (!Array.isArray(coords)) return undefined;
        
        // If it's already an array of objects with lat/lng
        if (coords.length > 0 && typeof coords[0] === 'object' && !Array.isArray(coords[0])) {
            return coords.map((c: any) => ({
                latitude: c.latitude || c.lat || 0,
                longitude: c.longitude || c.lng || 0,
            })).filter(c => c.latitude !== 0 && c.longitude !== 0);
        }
        
        // If it's an array of [lng, lat] or [lat, lng] arrays (GeoJSON style)
        if (coords.length > 0 && Array.isArray(coords[0])) {
            // Check if it's nested like GeoJSON Polygon coordinates [[[lng,lat], ...]]
            let flatCoords = coords;
            if (Array.isArray(coords[0][0])) {
                flatCoords = coords[0];
            }
            
            return flatCoords.map((c: any[]) => {
                // GeoJSON is [longitude, latitude]
                if (c.length >= 2) {
                    return {
                        latitude: typeof c[1] === 'number' ? c[1] : parseFloat(c[1]),
                        longitude: typeof c[0] === 'number' ? c[0] : parseFloat(c[0])
                    };
                }
                return null;
            }).filter(c => c !== null) as {latitude: number, longitude: number}[];
        }
        return undefined;
    };

    // Helper function to calculate exact center of a polygon
    const calculatePolygonCenter = (coords: {latitude: number, longitude: number}[] | undefined) => {
        if (!coords || coords.length === 0) return null;
        let minLat = coords[0].latitude;
        let maxLat = coords[0].latitude;
        let minLng = coords[0].longitude;
        let maxLng = coords[0].longitude;
        for (const c of coords) {
            if (c.latitude < minLat) minLat = c.latitude;
            if (c.latitude > maxLat) maxLat = c.latitude;
            if (c.longitude < minLng) minLng = c.longitude;
            if (c.longitude > maxLng) maxLng = c.longitude;
        }
        return {
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2
        };
    };

    const handleExpand = useCallback(() => {
        setIsExpanded(true);
        onExpand?.();
    }, [onExpand]);

    /** Rétracter : minimise le panel en FAB sans perdre l'état */
    const handleRetract = () => {
        setIsExpanded(false);
        Keyboard.dismiss();
    };

    /** Fermer : reset complet de tous les états */
    const handleClose = useCallback(() => {
        setIsExpanded(false);
        setStep('search_origin');
        setOrigin(null);
        setDestination(null);
        setSelectedRoute(null);
        setOriginLots([]);
        setDestLots([]);
        setRouteAlternatives([]);
        setSelectedAmoditaireName('');
        setSelectedDestAmoditaireName('');
        onRouteCalculated(null);
        Keyboard.dismiss();
        
        // Reset drag
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
    }, [onRouteCalculated, translateX, translateY]);

    // Exposer les méthodes via ref
    React.useImperativeHandle(ref, () => ({
        open: handleExpand,
        close: handleClose,
    }));

    /** Chargement des parcelles à partir de l'ID amodiataire */
    const loadAmodiataireeParcelles = async (amodiataireId: string): Promise<{ lots: AmodiataireLot[]; name: string }> => {
        try {
            const response = await get<AmodiataireDetailResponse>(
                ApiRoutes.getAmodiataireDetailsUrl(amodiataireId)
            );
            
            const detail = response.amodiataire || (response as any);
            const lotData = detail?.lot || detail;
            const name = lotData?.raisonSociale || detail?.profile?.username || 'Amodiataire';
            
            let lots: AmodiataireLot[] = [];
            
            // Priorité aux bâtiments explicites
            if (lotData?.batiments && lotData.batiments.length > 0) {
                lots = lotData.batiments.map((batiment: Building, index: number) => {
                    let normalizedCoord: { latitude: number; longitude: number };
                    
                    const batWithExtras = batiment as any;
                    if (batWithExtras.center) {
                        normalizedCoord = {
                            latitude: batWithExtras.center.latitude || batWithExtras.center.lat || 0,
                            longitude: batWithExtras.center.longitude || batWithExtras.center.lng || 0,
                        };
                    } else if (Array.isArray(batiment.coordinates) && batiment.coordinates.length > 0) {
                        const firstCoord = batiment.coordinates[0] as any;
                        normalizedCoord = {
                            latitude: firstCoord.latitude || firstCoord.lat || 0,
                            longitude: firstCoord.longitude || firstCoord.lng || 0,
                        };
                    } else {
                        normalizedCoord = { latitude: 0, longitude: 0 };
                    }
                    
                    return {
                        id: batiment.id || `parcelle-${index}`,
                        numeroLot: batWithExtras.numeroLot || batiment.id || `Parcelle ${index + 1}`,
                        adresse: batWithExtras.adresse || lotData.adresse || 'Sans adresse',
                        center: normalizedCoord,
                        coordinates: batiment.coordinates,
                        description: batWithExtras.description,
                        superficie: batWithExtras.superficie,
                    } as AmodiataireLot;
                });
            }
            // Fallback: coordonnées multiples
            else if (lotData?.coordinates && Array.isArray(lotData.coordinates) && lotData.coordinates.length > 1) {
                lots = lotData.coordinates.map((coord: any, index: number) => ({
                    id: `${amodiataireId}-parcelle-${index}`,
                    numeroLot: lotData.adresse || `Parcelle ${index + 1}`,
                    adresse: lotData.adresse || `Parcelle ${index + 1}`,
                    center: {
                        latitude: coord.latitude || coord.lat || 0,
                        longitude: coord.longitude || coord.lng || 0,
                    },
                    coordinates: coord,
                } as AmodiataireLot));
            }
            // Fallback: un seul point (center)
            else if (lotData?.center) {
                const center = lotData.center;
                lots = [{
                    id: `${amodiataireId}-parcelle-0`,
                    numeroLot: lotData.numeroLot || 'Parcelle principale',
                    adresse: lotData.adresse || 'Sans adresse',
                    center: {
                        latitude: center.latitude || center.lat || 0,
                        longitude: center.longitude || center.lng || 0,
                    },
                    coordinates: lotData.coordinates || [],
                    superficie: lotData.superficie,
                } as AmodiataireLot];
            }
            
            return { lots, name };
        } catch (error) {
            console.error('❌ Error loading amodiataire parcelles:', error);
            return { lots: [], name: 'Amodiataire' };
        }
    };

    /** Sélection d'un amodiataire en tant qu'origine */
    const handleSelectOriginAmodiataire = async (amodiataire: any) => {
        setIsLoading(true);
        Keyboard.dismiss();
        try {
            const { lots, name } = await loadAmodiataireeParcelles(amodiataire.id);
            setSelectedAmoditaireName(name);
            
            if (lots.length === 0) {
                Alert.alert(t('common.error'), 'Aucune parcelle trouvée pour cet amodiataire');
                return;
            }
            
            if (lots.length === 1) {
                // Si un seul lot, le sélectionner directement
                const lot = lots[0];
                const polyCoords = normalizePolygon(lot.coordinates);
                const computedCenter = calculatePolygonCenter(polyCoords);
                const finalCenter = computedCenter || lot.center || { latitude: 0, longitude: 0 };
                
                setOrigin({
                    latitude: finalCenter.latitude,
                    longitude: finalCenter.longitude,
                    name: `${name} — ${lot.adresse || lot.numeroLot}`,
                    polygonCoordinates: polyCoords,
                });
                setStep('search_destination');
            } else {
                setOriginLots(lots);
                setStep('select_origin_parcel');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Alert.alert(t('common.error'), 'Erreur lors du chargement');
        } finally {
            setIsLoading(false);
        }
    };

    /** Sélection d'un lot comme point d'origine */
    const handleSelectOriginLot = (lot: AmodiataireLot) => {
        const polyCoords = normalizePolygon(lot.coordinates);
        const computedCenter = calculatePolygonCenter(polyCoords);
        const finalCenter = computedCenter || lot.center || { latitude: 0, longitude: 0 };
        
        setOrigin({
            latitude: finalCenter.latitude,
            longitude: finalCenter.longitude,
            name: `${selectedAmoditaireName} — ${lot.adresse || lot.numeroLot}`,
            polygonCoordinates: polyCoords,
        });
        setStep('search_destination');
    };

    /** Utiliser la position actuelle comme origine */
    const handlePickCurrentLocationOrigin = async () => {
        setIsLoading(true);
        try {
            const location = await getCurrentPosition();
            if (location) {
                setOrigin({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    name: t('calculator.myLocation', 'Ma position'),
                });
                setStep('search_destination');
            }
        } catch (error) {
            Alert.alert(t('common.error'), t('calculator.locationError', 'Impossible de récupérer votre position'));
        } finally {
            setIsLoading(false);
        }
    };

    /** Sélection d'un amodiataire en tant que destination */
    const handleSelectDestAmodiataire = async (amodiataire: any) => {
        setIsLoading(true);
        Keyboard.dismiss();
        try {
            const { lots, name } = await loadAmodiataireeParcelles(amodiataire.id);
            setSelectedDestAmoditaireName(name);
            
            if (lots.length === 0) {
                Alert.alert(t('common.error'), 'Aucune parcelle trouvée pour cet amodiataire');
                return;
            }
            
            if (lots.length === 1) {
                const lot = lots[0];
                const polyCoords = normalizePolygon(lot.coordinates);
                const computedCenter = calculatePolygonCenter(polyCoords);
                const finalCenter = computedCenter || lot.center || { latitude: 0, longitude: 0 };
                
                const destPoint: PointInfo = {
                    latitude: finalCenter.latitude,
                    longitude: finalCenter.longitude,
                    name: `${name} — ${lot.adresse || lot.numeroLot}`,
                    polygonCoordinates: polyCoords,
                };
                setDestination(destPoint);
                // Calculer les routes
                await calculateRoutes(origin!, destPoint);
            } else {
                setDestLots(lots);
                setStep('select_dest_parcel');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Alert.alert(t('common.error'), 'Erreur lors du chargement');
        } finally {
            setIsLoading(false);
        }
    };

    /** Sélection d'un lot comme destination */
    const handleSelectDestLot = async (lot: AmodiataireLot) => {
        Keyboard.dismiss();
        const polyCoords = normalizePolygon(lot.coordinates);
        const computedCenter = calculatePolygonCenter(polyCoords);
        const finalCenter = computedCenter || lot.center || { latitude: 0, longitude: 0 };
        
        const destPoint: PointInfo = {
            latitude: finalCenter.latitude,
            longitude: finalCenter.longitude,
            name: `${selectedDestAmoditaireName} — ${lot.adresse || lot.numeroLot}`,
            polygonCoordinates: polyCoords,
        };
        setDestination(destPoint);
        await calculateRoutes(origin!, destPoint);
    };

    /** Utiliser la position actuelle comme destination */
    const handlePickCurrentLocationDest = async () => {
        setIsLoading(true);
        Keyboard.dismiss();
        try {
            const location = await getCurrentPosition();
            if (location) {
                const destPoint: PointInfo = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    name: t('calculator.myLocation', 'Ma position'),
                };
                setDestination(destPoint);
                await calculateRoutes(origin!, destPoint);
            }
        } catch (error) {
            Alert.alert(t('common.error'), t('calculator.locationError', 'Impossible de récupérer votre position'));
        } finally {
            setIsLoading(false);
        }
    };

    /** Calculer les routes alternatives */
    const calculateRoutes = async (orig: PointInfo, dest: PointInfo) => {
        setIsLoading(true);
        try {
            // --- Vérification Zone de Délimitation ---
            const isOriginInZone = zoneBounds?.polygonCoordinates ? isPointInPolygon({ lat: orig.latitude, lng: orig.longitude }, zoneBounds.polygonCoordinates) : false;
            const isDestInZone = zoneBounds?.polygonCoordinates ? isPointInPolygon({ lat: dest.latitude, lng: dest.longitude }, zoneBounds.polygonCoordinates) : false;

            if (isOriginInZone && isDestInZone) {
                console.log('🛡️ [Calculator] Trajet entièrement en zone. Bypass Google API.');
                const internalSegments = calculateInternalRoute(
                    { latitude: orig.latitude, longitude: orig.longitude },
                    { lat: dest.latitude, lng: dest.longitude },
                    mapData?.routes || []
                );

                if (internalSegments) {
                    const finalPolyline = internalSegments.reduce((acc, seg) => [...acc, ...seg.points], [] as { latitude: number, longitude: number }[]);
                    const metrics = calculateRouteMetrics(internalSegments);
                    const internalRoadNames = internalSegments
                        .map(seg => seg.name)
                        .filter((name, idx, self) => name && self.indexOf(name) === idx);

                    const internalRoute: RouteAlternative = {
                        index: 0,
                        distance: formatDistance(metrics.distance),
                        duration: formatDuration(metrics.duration),
                        summary: internalRoadNames.length > 0 ? internalRoadNames.join(' / ') : 'Réseau Interne',
                        polyline: finalPolyline,
                        segments: internalSegments,
                    };
                    
                    setRouteAlternatives([internalRoute]);
                    handleSelectRoute(internalRoute, orig, dest);
                    setIsLoading(false);
                    return;
                }
            }

            const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
            const currentLanguage = i18n.language || 'fr';
            const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${orig.latitude},${orig.longitude}&destination=${dest.latitude},${dest.longitude}&mode=driving&language=${currentLanguage}&alternatives=true&key=${GOOGLE_MAPS_API_KEY}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'OK' && data.routes.length > 0) {
                const alternatives: RouteAlternative[] = data.routes.map((route: any, index: number) => {
                    const leg = route.legs[0];
                    const googlePoints = decodePolyline(route.overview_polyline.points);
                    
                    // --- Logique Hybride Dijkstra ---
                    const segments = createHybridRoute(
                        googlePoints,
                        mapData?.routes || [],
                        { latitude: orig.latitude, longitude: orig.longitude },
                        { lat: dest.latitude, lng: dest.longitude },
                        zoneBounds?.polygonCoordinates
                    );
                    
                    // Reconstruire la polyline à partir des segments (pour compatibilité avec l'existant)
                    const finalPolyline = segments.reduce((acc, seg) => [
                        ...acc, 
                        ...seg.points
                    ], [] as { latitude: number, longitude: number }[]);

                     // --- Calcul des métriques réelles (Hybride) ---
                     const metrics = calculateRouteMetrics(
                         segments, 
                         leg.distance.value, 
                         leg.duration.value
                     );

                     // --- Extraction des noms des routes internes ---
                     const internalRoadNames = segments
                         .filter(seg => seg.type === 'backend' || seg.type === 'internal')
                         .map(seg => seg.name)
                         .filter((name, idx, self) => name && self.indexOf(name) === idx);

                     const googleSummary = route.summary || `Route ${index + 1}`;
                     const combinedSummary = internalRoadNames.length > 0 
                         ? `${googleSummary} — ${internalRoadNames.join(', ')}` 
                         : googleSummary;

                     return {
                         index,
                         distance: formatDistance(metrics.distance),
                         duration: formatDuration(metrics.duration),
                         summary: combinedSummary,
                         polyline: finalPolyline,
                         segments: segments,
                     };
                });
                
                setRouteAlternatives(alternatives);
                
                if (alternatives.length === 1) {
                    // Une seule route : la sélectionner directement
                    handleSelectRoute(alternatives[0], orig, dest);
                } else {
                    setStep('select_route');
                }
            } else {
                throw new Error(data.status);
            }
        } catch (error) {
            console.error('❌ Error calculating routes:', error);
            Alert.alert(t('common.error'), t('calculator.routeError', 'Impossible de calculer l\'itinéraire'));
        } finally {
            setIsLoading(false);
        }
    };

    /** Sélectionner une route parmi les alternatives */
    const handleSelectRoute = (route: RouteAlternative, orig?: PointInfo, dest?: PointInfo) => {
        Keyboard.dismiss();
        setSelectedRoute(route);
        setStep('result');
        setIsMinimizedResult(true); // Auto-minimize when route is selected
    };

    /** Nouveau calcul */
    const handleReset = () => {
        setStep('search_origin');
        setOrigin(null);
        setDestination(null);
        setSelectedRoute(null);
        setOriginLots([]);
        setDestLots([]);
        setRouteAlternatives([]);
        setSelectedAmoditaireName('');
        setSelectedDestAmoditaireName('');
        setIsMinimizedResult(false);
    };

    /** Retour à l'étape précédente */
    const handleBack = () => {
        switch (step) {
            case 'select_origin_parcel':
                setStep('search_origin');
                break;
            case 'search_destination':
                // Si on avait déjà choisi une parcelle, on y retourne
                if (originLots.length > 1) {
                    setStep('select_origin_parcel');
                } else {
                    setStep('search_origin');
                    setOrigin(null);
                }
                break;
            case 'select_dest_parcel':
                setStep('search_destination');
                break;
            case 'select_route':
                if (destLots.length > 1) {
                    setStep('select_dest_parcel');
                } else {
                    setStep('search_destination');
                    setDestination(null);
                }
                break;
            case 'result':
                setStep('select_route');
                setSelectedRoute(null);
                setIsMinimizedResult(false);
                break;
        }
    };

    // ============================================================================
    // Sous-composants de rendu
    // ============================================================================

    /** Affichage des deux points sélectionnés */
    const renderSelectedPoints = () => {
        if (!origin && !destination) return null;
        return (
            <View className="mb-6 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/50">
                {origin && (
                    <View className="flex-row items-center mb-1">
                        <View className="w-3.5 h-3.5 rounded-full bg-emerald-500 mr-3 shadow-sm shadow-emerald-500/50" />
                        <Text className="text-gray-700 dark:text-gray-200 text-sm font-semibold flex-1" numberOfLines={1}>
                            {origin.name}
                        </Text>
                    </View>
                )}
                {origin && destination && (
                    <View className="ml-1.5 mb-1 border-l-2 border-dashed border-gray-300 dark:border-gray-600 h-6" />
                )}
                {destination && (
                    <View className="flex-row items-center">
                        <View className="w-3.5 h-3.5 rounded-full bg-red-500 mr-3 shadow-sm shadow-red-500/50" />
                        <Text className="text-gray-700 dark:text-gray-200 text-sm font-semibold flex-1" numberOfLines={1}>
                            {destination.name}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    /** Rendu d'un lot dans la liste */
    const renderLotItem = (lot: AmodiataireLot, title: string, onSelect: (lot: AmodiataireLot) => void) => (
        <TouchableOpacity
            key={lot.id}
            onPress={() => onSelect(lot)}
            className="bg-white dark:bg-gray-800/80 rounded-xl p-3 mb-2 shadow-sm border border-gray-100 dark:border-gray-700"
            activeOpacity={0.7}
        >
            <View className="flex-row items-center">
                <View className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg items-center justify-center mr-3">
                    <BuildingOfficeIcon size={20} color="#10B981" />
                </View>
                <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-bold text-sm">
                        {title}
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-xs mt-0.5" numberOfLines={1}>
                        {lot.adresse}
                    </Text>
                </View>
                <View className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-full">
                    <ArrowRightIcon size={16} color="#9CA3AF" />
                </View>
            </View>
        </TouchableOpacity>
    );

    /** Rendu d'une route alternative */
    const renderRouteAlternativeItem = (route: RouteAlternative) => (
        <TouchableOpacity
            key={`route-${route.index}`}
            onPress={() => handleSelectRoute(route)}
            className="bg-white dark:bg-gray-800/80 rounded-xl p-3 mb-2 shadow-sm border border-gray-100 dark:border-gray-700"
            activeOpacity={0.7}
        >
            <View className="flex-row items-center">
                <View className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg items-center justify-center mr-3">
                    <MapIcon size={20} color="#3B82F6" />
                </View>
                <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-bold text-sm">
                        {route.summary}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                        <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                            {route.distance}
                        </Text>
                        <Text className="text-gray-400 mx-1.5 text-base">·</Text>
                        <Text className="text-gray-600 dark:text-gray-300 text-xs font-medium">
                            {route.duration}
                        </Text>
                    </View>
                </View>
                <View className="bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-full">
                    <ArrowRightIcon size={14} color="#9CA3AF" />
                </View>
            </View>
        </TouchableOpacity>
    );

    // ============================================================================
    // Rendu du contenu selon l'étape
    // ============================================================================

    const renderStepContent = () => {
        if (isLoading) {
            return (
                <View className="py-8 items-center justify-center">
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text className="text-gray-500 dark:text-gray-400 mt-4 text-sm">
                        {t('calculator.loading', 'Chargement...')}
                    </Text>
                </View>
            );
        }

        switch (step) {
            case 'search_origin':
                return (
                    <View>
                        <Text className="text-gray-900 dark:text-white mb-4 text-lg font-black tracking-tight">
                            {t('calculator.pickOrigin', 'Départ')}
                        </Text>
                        
                        <TouchableOpacity
                            onPress={handlePickCurrentLocationOrigin}
                            className="flex-row items-center p-4 bg-emerald-50 dark:bg-emerald-900/40 rounded-2xl mb-6 border border-emerald-100 dark:border-emerald-800 shadow-sm"
                        >
                            <View className="bg-emerald-500 p-2 rounded-xl mr-3 shadow-md shadow-emerald-500/30">
                                <MapPinIcon size={20} color="white" />
                            </View>
                            <Text className="text-emerald-800 dark:text-emerald-200 font-bold text-base">
                                {t('calculator.useCurrentLocation', 'Utiliser ma position actuelle')}
                            </Text>
                        </TouchableOpacity>

                        <View className="mb-6">
                            <CalculatorSearchBar 
                                onResultSelect={handleSelectOriginAmodiataire}
                            />
                        </View>
                    </View>
                );

            case 'select_origin_parcel':
                return (
                    <View>
                        <Text className="text-gray-500 dark:text-gray-400 mb-2 text-sm font-bold uppercase tracking-widest">
                            {selectedAmoditaireName}
                        </Text>
                        <Text className="text-gray-900 dark:text-white font-black mb-6 text-xl tracking-tight leading-tight">
                            {t('calculator.selectOriginParcel', 'Sélectionnez une parcelle comme point de départ')}
                        </Text>
                        <View className="mb-6">
                            {originLots.map(lot => renderLotItem(lot, selectedAmoditaireName, handleSelectOriginLot))}
                        </View>
                    </View>
                );

            case 'search_destination':
                const isOriginCurrentPos = origin?.name === t('calculator.myLocation', 'Ma position');
                
                return (
                    <View>
                        <Text className="text-gray-900 dark:text-white mb-4 text-lg font-black tracking-tight">
                            {t('calculator.pickDestination', 'Arrivée')}
                        </Text>
                        
                        {!isOriginCurrentPos && (
                            <TouchableOpacity
                                onPress={handlePickCurrentLocationDest}
                                className="flex-row items-center p-4 bg-emerald-50 dark:bg-emerald-900/40 rounded-2xl mb-6 border border-emerald-100 dark:border-emerald-800 shadow-sm"
                            >
                                <View className="bg-emerald-500 p-2 rounded-xl mr-3 shadow-md shadow-emerald-500/30">
                                    <MapPinIcon size={20} color="white" />
                                </View>
                                <Text className="text-emerald-800 dark:text-emerald-200 font-bold text-base">
                                    {t('calculator.useCurrentLocation', 'Utiliser ma position actuelle')}
                                </Text>
                            </TouchableOpacity>
                        )}

                        <View className="mb-6">
                            <CalculatorSearchBar 
                                onResultSelect={handleSelectDestAmodiataire}
                            />
                        </View>
                    </View>
                );

            case 'select_dest_parcel':
                return (
                    <View>
                        <Text className="text-gray-500 dark:text-gray-400 mb-2 text-sm font-bold uppercase tracking-widest">
                            {selectedDestAmoditaireName}
                        </Text>
                        <Text className="text-gray-900 dark:text-white font-black mb-6 text-xl tracking-tight leading-tight">
                            {t('calculator.selectDestParcel', 'Sélectionnez une parcelle de destination')}
                        </Text>
                        <View className="mb-6">
                            {destLots.map(lot => renderLotItem(lot, selectedDestAmoditaireName, handleSelectDestLot))}
                        </View>
                    </View>
                );

            case 'select_route':
                return (
                    <View>
                        <Text className="text-gray-900 dark:text-white font-black mb-1 text-xl tracking-tight">
                            {t('calculator.availableRoutes', { count: routeAlternatives.length, defaultValue: '{{count}} routes disponibles' })}
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 mb-6 text-sm font-bold">
                            {t('calculator.chooseRoute', 'Choisissez un itinéraire')}
                        </Text>
                        <View className="mb-6">
                            {routeAlternatives.map(renderRouteAlternativeItem)}
                        </View>
                    </View>
                );

            case 'result':
                return (
                    <View className="py-2">
                        {selectedRoute && (
                            <>
                                {isMinimizedResult ? (
                                    /* VUE COMPACTE - SIBRE & PRO */
                                    <View className="flex-row items-center justify-between bg-white dark:bg-gray-800/80 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                        <View className="flex-row items-center flex-1">
                                            {/* Distance en Premier */}
                                            <View className="mr-6 pr-6 border-r border-gray-100 dark:border-gray-700">
                                                <Text className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest mb-0.5">
                                                    {t('calculator.distance', 'DISTANCE')}
                                                </Text>
                                                <Text className="text-emerald-500 dark:text-emerald-400 text-3xl font-black tracking-tighter">
                                                    {selectedRoute.distance}
                                                </Text>
                                            </View>

                                            {/* Points ensuite */}
                                            <View className="flex-1">
                                                <Text className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest mb-0.5">
                                                    {t('calculator.route', 'TRAJET')}
                                                </Text>
                                                <Text className="text-gray-900 dark:text-white text-sm font-bold truncate" numberOfLines={1}>
                                                    {origin?.name.split(' — ')[0]}
                                                </Text>
                                                <Text className="text-gray-400 dark:text-gray-500 text-xs font-bold">
                                                    ↓ {destination?.name.split(' — ')[0]}
                                                </Text>
                                            </View>
                                        </View>
                                        
                                        <TouchableOpacity 
                                            onPress={() => setIsMinimizedResult(false)}
                                            className="ml-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700"
                                        >
                                            <ChevronDownIcon size={20} color="#10B981" style={{ transform: [{ rotate: '180deg' }] }} />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    /* VUE COMPLÈTE */
                                    <>
                                        <View className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-[40px] items-center mb-6 border border-emerald-100/50 dark:border-emerald-800/30">
                                            <TouchableOpacity 
                                                onPress={() => setIsMinimizedResult(true)}
                                                className="absolute top-4 right-4 bg-white/80 dark:bg-gray-800/80 p-2 rounded-xl border border-white dark:border-gray-700"
                                            >
                                                <ChevronDownIcon size={18} color="#10B981" />
                                            </TouchableOpacity>

                                            <View className="bg-emerald-500/10 p-3 rounded-2xl mb-4">
                                                <MapIcon size={24} color="#10B981" />
                                            </View>
                                            <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-[2px]">
                                                {t('calculator.totalDistance', 'Distance Totale')}
                                            </Text>
                                            <Text className="text-gray-900 dark:text-white text-5xl font-black mt-2 tracking-tighter">
                                                {selectedRoute.distance}
                                            </Text>
                                            <View className="flex-row items-center mt-4 bg-white/80 dark:bg-gray-800/80 px-4 py-2 rounded-full border border-white/50 dark:border-gray-700/50">
                                                <Text className="text-gray-900 dark:text-white font-black text-base">
                                                    {selectedRoute.duration}
                                                </Text>
                                            </View>
                                            <Text className="text-gray-400 dark:text-gray-500 text-xs mt-6 font-bold text-center">
                                                {t('calculator.via', { summary: selectedRoute.summary, defaultValue: 'via {{summary}}' })}
                                            </Text>
                                        </View>

                                        <TouchableOpacity
                                            onPress={handleReset}
                                            className="flex-row items-center justify-center p-5 bg-gray-900 dark:bg-white rounded-2xl shadow-xl"
                                        >
                                            <ArrowPathIcon size={20} color={isDark ? "#111827" : "white"} />
                                            <Text className="text-white dark:text-gray-900 font-black ml-3 text-base">
                                                {t('calculator.newCalculation', 'Nouveau calcul')}
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </>
                        )}
                    </View>
                );

            default:
                return null;
        }
    };

    // ============================================================================
    // Rendu Principal
    // ============================================================================

    return (
        <View style={styles.container} pointerEvents="box-none">
            {/* FAB Button - Optionnel */}
            {!isExpanded && showFab && (
                <Animated.View style={[styles.fabContainer, animatedFabStyle]}>
                    <TouchableOpacity
                        onPress={handleExpand}
                        className="w-14 h-14 bg-emerald-500 rounded-full items-center justify-center shadow-lg"
                        activeOpacity={0.8}
                    >
                        <Waypoints size={28} color="white" />
                    </TouchableOpacity>
                </Animated.View>
            )}

            <Animated.View 
                style={[
                    styles.panelContainer, 
                    animatedPanelStyle,
                ]}
                className="rounded-[40px] border border-white/40 dark:border-gray-700/50 shadow-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl overflow-hidden"
            >
                <View style={{ flex: 1 }}>
                    {/* Handle Area (Drag Zone) */}
                    <GestureDetector gesture={panGesture}>
                        <View className="items-center pt-2 pb-1 bg-transparent active:bg-gray-100 dark:active:bg-gray-800 transition-colors">
                            <View className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
                        </View>
                    </GestureDetector>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
                        style={{ flex: 1 }}
                    >
                        <GestureScrollView 
                            showsVerticalScrollIndicator={true}
                            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 150 }}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="on-drag"
                            nestedScrollEnabled={true}
                            style={{ flex: 1 }}
                        >
                            <View>
                                {/* Header avec boutons Rétracter et Fermer - Caché en mode ultra-compact */}
                                {!(step === 'result' && isMinimizedResult) && (
                                    <View className="flex-row items-center justify-between mb-6 p-1">
                                        <View className="flex-row items-center flex-1">
                                            {step !== 'search_origin' && (
                                                <TouchableOpacity 
                                                    onPress={handleBack}
                                                    className="mr-3 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm"
                                                >
                                                    <ChevronLeftIcon size={18} color="#10B981" />
                                                </TouchableOpacity>
                                            )}
                                            <View className="bg-emerald-500/10 p-2 rounded-xl">
                                                <Waypoints size={20} color="#10B981" />
                                            </View>
                                            <View className="ml-3 flex-1">
                                                <Text className="text-gray-900 dark:text-white font-black text-lg tracking-tight" numberOfLines={1}>
                                                    {t('calculator.title', 'Calculateur')}
                                                </Text>
                                            </View>
                                        </View>
                                    
                                        {/* Bouton Rétracter */}
                                        <TouchableOpacity 
                                            onPress={handleRetract}
                                            className="w-8 h-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mr-2"
                                        >
                                            <ChevronDownIcon size={18} color="#6B7280" />
                                        </TouchableOpacity>
                                        
                                        {/* Bouton Fermer (reset tout) */}
                                        <TouchableOpacity 
                                            onPress={handleClose}
                                            className="w-8 h-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"
                                        >
                                            <XMarkIcon size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                )}

                            {/* Points sélectionnés - Cachés en mode ultra-compact */}
                            {!(step === 'result' && isMinimizedResult) && renderSelectedPoints()}

                            {/* Contenu de l'étape */}
                            {renderStepContent()}
                        </View>
                    </GestureScrollView>
                </KeyboardAvoidingView>
                </View>
            </Animated.View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 210, // Just above the Location Button
        right: 16,
    },
    panelContainer: {
        position: 'absolute',
        bottom: 110, // Above the BottomNavigation
        left: '5%',
        right: '5%',
        width: '90%',
        alignSelf: 'center',
    },
});
