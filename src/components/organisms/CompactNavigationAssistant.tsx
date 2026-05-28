/**
 * Composant CompactNavigationAssistant (Organism)
 * 
 * Assistant de navigation ultra-compact qui s'affiche en overlay minimal
 * en bas de l'écran pour préserver la visibilité maximale de la carte.
 * 
 * @module components/organisms/CompactNavigationAssistant
 */

import React, { useState, useEffect, useRef } from 'react';
import Constants from 'expo-constants';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    useColorScheme,
    Animated,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import {
    XMarkIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    ArrowRightIcon,
    TruckIcon,
    UserIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    ArrowLeftIcon,
    ArrowUturnLeftIcon,
    ArrowUturnRightIcon,
} from 'react-native-heroicons/outline';

// Services
import { speak, stopSpeaking } from '@/services/speech';
import { type PolylineSegment, calculateDistance as geoCalculateDistance } from '@/utils/geoUtils';
import type { NavigationRoute } from './NavigationModal';

// ============================================================================
// Types
// ============================================================================

export interface CompactNavigationAssistantProps {
    /** Visibilité du composant */
    visible: boolean;
    /** Callback de fermeture */
    onClose: () => void;
    /** Route sélectionnée */
    route: NavigationRoute | null;
    /** Destination */
    destination: {
        latitude: number;
        longitude: number;
    } | null;
    /** Position initiale de l'utilisateur */
    userLocation?: {
        latitude: number;
        longitude: number;
    } | null;
    /** Mode de transport */
    travelMode?: 'driving' | 'walking';
    /** Callback appelé quand la navigation démarre */
    onNavigationStart?: () => void;
    /** Nom de l'amodiataire (préfixe de la destination) */
    amodiataireName?: string | null;
}

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant CompactNavigationAssistant - Version Ultra-Compacte
 */
export function CompactNavigationAssistant({
    visible,
    onClose,
    route,
    destination,
    userLocation: initialUserLocation,
    travelMode = 'driving',
    onNavigationStart,
    amodiataireName,
}: CompactNavigationAssistantProps) {
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    
    const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
    const [distanceToNextStep, setDistanceToNextStep] = useState<number>(0);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const [remainingDistance, setRemainingDistance] = useState<number>(0);
    const [totalRouteDistance, setTotalRouteDistance] = useState<number>(0);
    const [traveledDistance, setTraveledDistance] = useState<number>(0);
    const [isExpanded, setIsExpanded] = useState<boolean>(true);
    const [lastAnnouncedDistance, setLastAnnouncedDistance] = useState<number>(0);
    const [lastAnnouncedStep, setLastAnnouncedStep] = useState<number>(-1);
    const [isOffRoute, setIsOffRoute] = useState<boolean>(false);
    const [remainingPolyline, setRemainingPolyline] = useState<Array<{ latitude: number; longitude: number }>>([]);
    const [hasArrived, setHasArrived] = useState<boolean>(false);
    const [currentSegmentName, setCurrentSegmentName] = useState<string | null>(null);
    
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);
    const startTime = useRef<number>(Date.now());
    const navigationStartTimeRef = useRef<number>(0);
    const remainingPolylineRef = useRef<Array<{ latitude: number; longitude: number }>>([]);
    const isOffRouteRef = useRef<boolean>(false);
    const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const previousLocation = useRef<Location.LocationObject | null>(null);
    // Ref vers la dernière version d'updateNavigation — évite la stale closure
    // dans la souscription GPS (créée une seule fois au démarrage)
    const updateNavigationRef = useRef<((location: Location.LocationObject) => void) | null>(null);

    // ============================================================================
    // Effets
    // ============================================================================

    /**
     * Initialisation et nettoyage
     */
    useEffect(() => {
        if (visible && route) {
            console.log('🚀 CompactNavigationAssistant: Navigation démarrée');
            
            // NE PAS appeler onNavigationStart ici - c'est déjà fait par NavigationModal
            // Le callback onNavigationStart est appelé AVANT que ce composant devienne visible
            
            startNavigation();
        }

        return () => {
            cleanup();
        };
    }, [visible, route]); // onNavigationStart retiré des dépendances

    /**
     * Animation d'expansion
     */
    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: isExpanded ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isExpanded]);

    // ============================================================================
    // Fonctions
    // ============================================================================

    /**
     * Démarre la navigation
     */
    const startNavigation = async () => {
        // Log ID Unique de l'appareil (pour confirmation dans l'assistant)
        const deviceId = Constants.installationId || Constants.sessionId || 'unknown';
        console.log(`🚀 [Assistant] Démarrage - Device ID: ${deviceId}`);

        try {
            // Initialiser la polyline depuis la route
            if (route && route.polyline) {
                remainingPolylineRef.current = route.polyline;
                setRemainingPolyline(route.polyline);
            }

            // Démarrer le suivi de position
            locationSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 1000,
                    distanceInterval: 5,
                },
                (location) => {
                    setCurrentLocation(location);
                    // Utiliser le ref pour toujours appeler la version à jour
                    // d'updateNavigation (évite la stale closure)
                    updateNavigationRef.current?.(location);
                }
            );

            // Démarrer le timer
            startTime.current = Date.now();
            navigationStartTimeRef.current = Date.now();
            timerInterval.current = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime.current) / 1000));
            }, 1000);

            // Initialiser les distances
            if (route) {
                // Calculer la distance réelle depuis la polyline (source de vérité = ce qui s'affiche)
                let totalDistance = 0;
                if (route.polyline && route.polyline.length > 1) {
                    for (let i = 0; i < route.polyline.length - 1; i++) {
                        totalDistance += calculateDistance(
                            route.polyline[i].latitude,
                            route.polyline[i].longitude,
                            route.polyline[i + 1].latitude,
                            route.polyline[i + 1].longitude
                        );
                    }
                }
                // Fallback sur la distance parsée si la polyline ne donne rien
                if (totalDistance === 0) {
                    totalDistance = parseDistance(route.distance);
                }

                setTotalRouteDistance(totalDistance);
                setRemainingDistance(totalDistance);
                setLastAnnouncedDistance(totalDistance);
                
                // Annonce de démarrage avec instruction
                if (!isMuted && route.steps.length > 0) {
                    const firstStep = route.steps[0];
                    const formattedDistance = formatDistance(totalDistance);
                    const startMessage = t('inAppNavigation.voice.started', { 
                        distance: formattedDistance, 
                        duration: route.duration || '',
                        defaultValue: `Navigation démarrée. Distance totale : ${formattedDistance}. Durée estimée : ${route.duration || ''}. Bonne route !`
                    });
                    speak(`${startMessage} ${firstStep.instruction}`);
                    setLastAnnouncedStep(0);
                }
            }
        } catch (error) {
            console.error('❌ Erreur démarrage navigation:', error);
        }
    };

    /**
     * Calcule la distance parcourue depuis le début
     * Seulement si le mouvement est significatif (> 3 mètres)
     */
    const calculateTraveledDistance = (location: Location.LocationObject): number => {
        if (!previousLocation.current) {
            previousLocation.current = location;
            return 0;
        }

        const dist = calculateDistance(
            previousLocation.current.coords.latitude,
            previousLocation.current.coords.longitude,
            location.coords.latitude,
            location.coords.longitude
        );

        // Seuil de mouvement minimum : 3 mètres
        // Cela évite de compter les variations GPS quand on est immobile
        const MOVEMENT_THRESHOLD = 3; // mètres
        
        if (dist >= MOVEMENT_THRESHOLD) {
            previousLocation.current = location;
            return dist;
        }
        
        // Pas de mouvement significatif, ne pas incrémenter la distance
        return 0;
    };

    /**
     * Met à jour la polyline restante en fonction de la position actuelle
     */
    const updateRemainingPolyline = (location: Location.LocationObject) => {
        if (remainingPolylineRef.current.length === 0) return;

        // Trouver le point le plus proche sur la polyline
        let closestIndex = 0;
        let minDistance = Infinity;

        remainingPolylineRef.current.forEach((point, index) => {
            const dist = calculateDistance(
                location.coords.latitude,
                location.coords.longitude,
                point.latitude,
                point.longitude
            );

            if (dist < minDistance) {
                minDistance = dist;
                closestIndex = index;
            }
        });

        // Vérifier si on est hors route (> 100m du point le plus proche)
        if (minDistance > 100) {
            isOffRouteRef.current = true;
            setIsOffRoute(true);
        } else {
            const newPolyline = remainingPolylineRef.current.slice(closestIndex);
            isOffRouteRef.current = false;
            setIsOffRoute(false);
            // Mettre à jour la polyline restante
            remainingPolylineRef.current = newPolyline;
            setRemainingPolyline(newPolyline);
        }
    };

    /**
     * Calcule la distance restante le long de la polyline
     */
    const calculatePolylineDistance = (polyline: Array<{ latitude: number; longitude: number }>): number => {
        let totalDistance = 0;
        for (let i = 0; i < polyline.length - 1; i++) {
            totalDistance += calculateDistance(
                polyline[i].latitude,
                polyline[i].longitude,
                polyline[i + 1].latitude,
                polyline[i + 1].longitude
            );
        }
        return totalDistance;
    };

    /**
     * Trouve les coordonnées de la prochaine étape
     */
    const findNextStepCoordinate = (): { latitude: number; longitude: number } | null => {
        if (!route || currentStepIndex >= route.steps.length) return null;
        
        // Si on a une polyline, utiliser le point correspondant
        if (remainingPolylineRef.current.length > 0) {
            // Estimer le point de la prochaine étape basé sur la distance
            const currentStep = route.steps[currentStepIndex];
            const stepDistance = parseDistance(currentStep.distance);
            
            let accumulatedDistance = 0;
            for (let i = 0; i < remainingPolylineRef.current.length - 1; i++) {
                const segmentDist = calculateDistance(
                    remainingPolylineRef.current[i].latitude,
                    remainingPolylineRef.current[i].longitude,
                    remainingPolylineRef.current[i + 1].latitude,
                    remainingPolylineRef.current[i + 1].longitude
                );
                
                accumulatedDistance += segmentDist;
                
                if (accumulatedDistance >= stepDistance) {
                    return remainingPolylineRef.current[i + 1];
                }
            }
            
            // Fallback: dernier point de la polyline
            return remainingPolylineRef.current[remainingPolylineRef.current.length - 1];
        }
        
        // Fallback: destination finale
        return destination;
    };

    /**
     * Retourne l'icône de direction basée sur l'instruction
     */
    const getDirectionIcon = (instruction: string) => {
        const lowerInstruction = instruction.toLowerCase();
        
        if (lowerInstruction.includes('gauche') || lowerInstruction.includes('left')) {
            if (lowerInstruction.includes('demi-tour') || lowerInstruction.includes('u-turn')) {
                return <ArrowUturnLeftIcon size={20} color="#10B981" />;
            }
            return <ArrowLeftIcon size={20} color="#10B981" />;
        }
        
        if (lowerInstruction.includes('droite') || lowerInstruction.includes('right')) {
            if (lowerInstruction.includes('demi-tour') || lowerInstruction.includes('u-turn')) {
                return <ArrowUturnRightIcon size={20} color="#10B981" />;
            }
            return <ArrowRightIcon size={20} color="#10B981" />;
        }
        
        if (lowerInstruction.includes('tout droit') || lowerInstruction.includes('straight') || 
            lowerInstruction.includes('continuez') || lowerInstruction.includes('continue')) {
            return <ArrowUpIcon size={20} color="#10B981" />;
        }
        
        return <ArrowUpIcon size={20} color="#10B981" />;
    };

    /**
     * Annonce les directions avec instructions détaillées
     */
    const announceDirections = (distToNextStep: number, currentStep: any) => {
        if (isMuted || !currentStep) return;

        // Annonces à différentes distances
        if (distToNextStep <= 100 && lastAnnouncedStep !== currentStepIndex) {
            speak(t('inAppNavigation.voice.in', { distance: '100 mètres', instruction: currentStep.instruction, defaultValue: `Dans 100 mètres, ${currentStep.instruction}` }));
            setLastAnnouncedStep(currentStepIndex);
        } else if (distToNextStep <= 50 && lastAnnouncedDistance > 50) {
            speak(t('inAppNavigation.voice.in', { distance: '50 mètres', instruction: currentStep.instruction, defaultValue: `Dans 50 mètres, ${currentStep.instruction}` }));
            setLastAnnouncedDistance(50);
        } else if (distToNextStep <= 20 && lastAnnouncedDistance > 20) {
            speak(currentStep.instruction);
            setLastAnnouncedDistance(20);
        }
    };

    /**
     * Annonce les avertissements contextuels
     */
    const announceContextualWarnings = (instruction: string) => {
        if (isMuted) return;

        const lowerInstruction = instruction.toLowerCase();
        
        if (lowerInstruction.includes('école') || lowerInstruction.includes('school')) {
            speak(t('inAppNavigation.voice.warnings.school', { defaultValue: 'Attention, zone scolaire à proximité.' }));
        } else if (lowerInstruction.includes('feu') || lowerInstruction.includes('traffic light')) {
            speak(t('inAppNavigation.voice.warnings.trafficLight', { defaultValue: 'Attention, feu de circulation à venir.' }));
        } else if (lowerInstruction.includes('rond-point') || lowerInstruction.includes('roundabout')) {
            speak(t('inAppNavigation.voice.warnings.roundabout', { defaultValue: 'Attention, rond-point à venir.' }));
        } else if (lowerInstruction.includes('péage') || lowerInstruction.includes('toll')) {
            speak(t('inAppNavigation.voice.warnings.toll', { defaultValue: 'Attention, péage à venir.' }));
        } else if (lowerInstruction.includes('pont') || lowerInstruction.includes('bridge')) {
            speak(t('inAppNavigation.voice.warnings.bridge', { defaultValue: 'Attention, pont à venir.' }));
        }
    };

    /**
     * Met à jour la navigation
     */
    const updateNavigation = (location: Location.LocationObject) => {
        if (!route || !destination || hasArrived) return; // Ne pas continuer si déjà arrivé

        // Calculer la distance parcourue
        const traveled = calculateTraveledDistance(location);
        setTraveledDistance(prev => prev + traveled);

        // Mettre à jour la polyline restante
        if (route.polyline && route.polyline.length > 0) {
            updateRemainingPolyline(location);
            
            // Calculer la distance restante le long de la polyline (utilise le ref, toujours à jour)
            if (!isOffRouteRef.current && remainingPolylineRef.current.length > 0) {
                const polylineDist = calculatePolylineDistance(remainingPolylineRef.current);
                setRemainingDistance(polylineDist);
                
                // Détecter le segment actuel
                if (route.segments) {
                    let nearestSegment = null;
                    let minSegDist = Infinity;
                    
                    route.segments.forEach(segment => {
                        segment.points.forEach(point => {
                            const dist = geoCalculateDistance(
                                location.coords.latitude,
                                location.coords.longitude,
                                point.latitude,
                                point.longitude
                            );
                            if (dist < minSegDist) {
                                minSegDist = dist;
                                nearestSegment = segment;
                            }
                        });
                    });
                    
                    if (nearestSegment && (nearestSegment as PolylineSegment).type === 'backend') {
                        setCurrentSegmentName((nearestSegment as PolylineSegment).name || null);
                    } else {
                        setCurrentSegmentName(null);
                    }
                }
            } else {
                // Fallback: distance directe à la destination
                const directDist = calculateDistance(
                    location.coords.latitude,
                    location.coords.longitude,
                    destination.latitude,
                    destination.longitude
                );
                setRemainingDistance(directDist);
            }
        } else {
            // Pas de polyline: utiliser la distance directe
            const distToDest = calculateDistance(
                location.coords.latitude,
                location.coords.longitude,
                destination.latitude,
                destination.longitude
            );
            setRemainingDistance(distToDest);
        }

        // Trouver la prochaine étape
        const nextStepCoord = findNextStepCoordinate();
        if (nextStepCoord && currentStepIndex < route.steps.length) {
            const distToNextStep = calculateDistance(
                location.coords.latitude,
                location.coords.longitude,
                nextStepCoord.latitude,
                nextStepCoord.longitude
            );
            
            setDistanceToNextStep(distToNextStep);

            const currentStep = route.steps[currentStepIndex];
            
            // Annonces de direction
            announceDirections(distToNextStep, currentStep);
            
            // Avertissements contextuels
            if (lastAnnouncedStep !== currentStepIndex) {
                announceContextualWarnings(currentStep.instruction);
            }

            // Passer à l'étape suivante si on est proche
            if (distToNextStep < 20 && currentStepIndex < route.steps.length - 1) {
                setCurrentStepIndex(prev => prev + 1);
                setLastAnnouncedStep(-1); // Reset pour la nouvelle étape
                setLastAnnouncedDistance(1000); // Reset pour les annonces de distance
            }
        }

        // Annonces vocales basées sur la distance totale restante
        const distToDest = remainingDistance;
        if (!isMuted) {
            // Annonce à 1000m
            if (distToDest <= 1000 && lastAnnouncedDistance > 1000) {
                speak(t('inAppNavigation.voice.remaining', { distance: '1 kilomètre', defaultValue: `Dans 1 kilomètre, vous arriverez à destination.` }));
                setLastAnnouncedDistance(1000);
            }
            // Annonce à 500m
            else if (distToDest <= 500 && lastAnnouncedDistance > 500) {
                speak(t('inAppNavigation.voice.remaining', { distance: '500 mètres', defaultValue: `Dans 500 mètres, vous arriverez à destination.` }));
                setLastAnnouncedDistance(500);
            }
            // Annonce à 200m
            else if (distToDest <= 200 && lastAnnouncedDistance > 200) {
                speak(t('inAppNavigation.voice.remaining', { distance: '200 mètres', defaultValue: `Dans 200 mètres, vous arriverez à destination.` }));
                setLastAnnouncedDistance(200);
            }
            // Annonce à 100m
            else if (distToDest <= 100 && lastAnnouncedDistance > 100) {
                speak(t('inAppNavigation.voice.remaining', { distance: '100 mètres', defaultValue: `Dans 100 mètres, vous arriverez à destination.` }));
                setLastAnnouncedDistance(100);
            }
            // Annonce à 50m
            else if (distToDest <= 50 && lastAnnouncedDistance > 50) {
                speak(t('inAppNavigation.voice.remaining', { distance: '50 mètres', defaultValue: `Dans 50 mètres, vous arriverez à destination.` }));
                setLastAnnouncedDistance(50);
            }
        }

        // Vérifier si on est arrivé avec des conditions plus strictes
        const timeSinceStart = Date.now() - navigationStartTimeRef.current;
        const hasMovedEnough = traveledDistance > 10; // Au moins 10m parcourus
        
        console.log('🎯 Distance à destination:', distToDest.toFixed(2), 'm, Temps écoulé:', Math.floor(timeSinceStart / 1000), 's, Parcouru:', traveledDistance.toFixed(2), 'm');
        
        // Conditions d'arrivée plus strictes :
        // 1. Distance < 8m (au lieu de 5m)
        // 2. Au moins 30 secondes de navigation (au lieu de 10s)
        // 3. Au moins 10m parcourus (pour éviter les fausses détections si on démarre près de la destination)
        if (distToDest < 8 && timeSinceStart > 30000 && hasMovedEnough) {
            console.log('🏁 ARRIVÉE DÉTECTÉE! Distance:', distToDest.toFixed(2), 'm après', Math.floor(timeSinceStart / 1000), 's, Parcouru:', traveledDistance.toFixed(2), 'm');
            handleArrival();
        } else if (distToDest < 8 && timeSinceStart <= 30000) {
            console.log('⏳ Trop tôt pour détecter l\'arrivée (< 30s)');
        } else if (distToDest < 8 && !hasMovedEnough) {
            console.log('⏳ Pas assez de mouvement pour confirmer l\'arrivée (< 10m parcourus)');
        }
    };

    // Mettre à jour le ref à chaque rendu pour que la souscription GPS
    // appelle toujours la version fraîche d'updateNavigation
    updateNavigationRef.current = updateNavigation;

    /**
     * Gère l'arrivée à destination
     */
    const handleArrival = () => {
        console.log('🏁 handleArrival appelé');
        
        // Marquer comme arrivé
        setHasArrived(true);
        
        // Arrêter le suivi de position et les annonces
        if (locationSubscription.current) {
            locationSubscription.current.remove();
            locationSubscription.current = null;
        }
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
            timerInterval.current = null;
        }
        
        // Annonce vocale d'arrivée
        if (!isMuted) {
            speak(t('inAppNavigation.voice.arrived', 'Vous êtes arrivé à destination.'));
        }
        
        // NE PAS fermer automatiquement - laisser l'utilisateur fermer manuellement
        // L'assistant reste visible avec les statistiques finales
        console.log('✅ Navigation terminée - Assistant reste ouvert pour consultation');
    };

    /**
     * Nettoie les ressources
     */
    const cleanup = () => {
        if (locationSubscription.current) {
            locationSubscription.current.remove();
            locationSubscription.current = null;
        }
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
            timerInterval.current = null;
        }
        stopSpeaking();
    };

    /**
     * Toggle mute
     */
    const toggleMute = () => {
        setIsMuted(!isMuted);
        if (!isMuted) {
            stopSpeaking();
        }
    };

    /**
     * Calcule la distance entre deux points (Haversine)
     */
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371e3; // Rayon de la Terre en mètres
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    /**
     * Parse une distance Google Maps
     */
    const parseDistance = (distanceStr: string): number => {
        const match = distanceStr.match(/(\d+\.?\d*)\s*(km|m)/i);
        if (!match) return 0;

        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();

        return unit === 'km' ? value * 1000 : value;
    };

    /**
     * Formate une distance
     */
    const formatDistance = (meters: number): string => {
        if (travelMode === 'walking') {
            if (meters >= 1000) {
                return `${(meters / 1000).toFixed(2)} km`;
            }
            return `${Math.round(meters)} m`;
        }

        if (meters >= 1000) {
            return `${(meters / 1000).toFixed(1)} km`;
        }
        return `${Math.round(meters)} m`;
    };

    /**
     * Formate le temps écoulé
     */
    const formatElapsedTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}${t('inAppNavigation.time.hours', 'h')} ${minutes}${t('inAppNavigation.time.minutes', 'min')}`;
        }
        if (minutes > 0) {
            return `${minutes}${t('inAppNavigation.time.minutes', 'min')} ${secs}${t('inAppNavigation.time.seconds', 's')}`;
        }
        return `${secs}${t('inAppNavigation.time.seconds', 's')}`;
    };

    // ============================================================================
    // Rendu
    // ============================================================================

    if (!visible || !route) return null;

    const currentStep = route.steps[currentStepIndex];
    const nextStep = currentStepIndex < route.steps.length - 1 ? route.steps[currentStepIndex + 1] : null;

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            {/* Zone de fond - PAS cliquable pour fermer (pas d'off-context) */}
            <View style={styles.backdrop} />

            {/* Assistant compact */}
            <View style={[
                styles.assistant,
                { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }
            ]}>
                {/* Ligne principale ultra-compacte */}
                <View style={styles.mainRow}>
                    {/* Icône mode de transport */}
                    <View style={[styles.modeIcon, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                        {travelMode === 'walking' ? (
                            <UserIcon size={16} color="#10B981" />
                        ) : (
                            <TruckIcon size={16} color="#10B981" />
                        )}
                    </View>

                    {/* Informations principales */}
                    <View style={styles.mainInfo}>
                        <View style={styles.distanceRow}>
                            {currentStep && getDirectionIcon(currentStep.instruction)}
                            <Text style={[styles.distanceText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                                {formatDistance(remainingDistance)}
                            </Text>
                            <ArrowRightIcon size={12} color={isDark ? '#9CA3AF' : '#6B7280'} />
                            <Text style={[styles.timeText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                {formatElapsedTime(elapsedTime)}
                            </Text>
                            {isOffRoute && (
                                <Text style={styles.offRouteText}>⚠️</Text>
                            )}
                        </View>
                         {hasArrived ? (
                            <Text 
                                style={[styles.instructionText, { color: '#10B981', fontWeight: 'bold' }]}
                                numberOfLines={1}
                            >
                                🏁 Arrivé à destination !
                            </Text>
                        ) : currentSegmentName ? (
                            <Text 
                                style={[styles.instructionText, { color: '#F59E0B', fontWeight: 'bold' }]}
                                numberOfLines={1}
                            >
                                📍 {currentSegmentName}
                            </Text>
                        ) : currentStep ? (
                            <Text 
                                style={[styles.instructionText, { color: isDark ? '#D1D5DB' : '#4B5563' }]}
                                numberOfLines={1}
                            >
                                {currentStep.instruction}
                            </Text>
                        ) : null}
                        {nextStep && distanceToNextStep < 200 && (
                            <View style={styles.nextStepRow}>
                                <View style={{ transform: [{ scale: 0.6 }] }}>
                                    {getDirectionIcon(nextStep.instruction)}
                                </View>
                                <Text 
                                    style={[styles.nextStepText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}
                                    numberOfLines={1}
                                >
                                    Puis: {nextStep.instruction}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Contrôles compacts */}
                    <View style={styles.controls}>
                        <TouchableOpacity
                            onPress={toggleMute}
                            style={[styles.controlButton, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}
                        >
                            {isMuted ? (
                                <SpeakerXMarkIcon size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                            ) : (
                                <SpeakerWaveIcon size={14} color="#10B981" />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setIsExpanded(!isExpanded)}
                            style={[styles.controlButton, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}
                        >
                            {isExpanded ? (
                                <ChevronDownIcon size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                            ) : (
                                <ChevronUpIcon size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.controlButton, { backgroundColor: '#EF4444' }]}
                        >
                            <XMarkIcon size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Section étendue (optionnelle) */}
                {isExpanded && (
                    <Animated.View style={[
                        styles.expandedSection,
                        {
                            opacity: slideAnim,
                        }
                    ]}>
                        <View style={styles.expandedContent}>
                            {/* Destination uniquement */}
                            <View style={styles.pointsSection}>
                                
                                <View style={styles.pointRow}>
                                    <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                                    <View style={styles.pointInfo}>
                                        <Text style={[styles.pointLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]} numberOfLines={1}>
                                            {t('inAppNavigation.destination', 'Destination')}
                                        </Text>
                                        <Text 
                                            style={[styles.pointValue, { color: isDark ? '#FFFFFF' : '#111827' }]} 
                                            numberOfLines={2}
                                            adjustsFontSizeToFit
                                        >
                                            {amodiataireName
                                                ? `${amodiataireName} - ${route.destinationName || route.summary}`
                                                : (route.destinationName || route.summary)
                                            }
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.statsContainer}>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]} numberOfLines={1}>
                                        {t('inAppNavigation.remainingDistance', 'Distance restante')}
                                    </Text>
                                    <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#111827' }]} numberOfLines={1}>
                                        {formatDistance(remainingDistance)}
                                    </Text>
                                </View>

                                <View style={styles.statItem}>
                                    <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]} numberOfLines={1}>
                                        {t('inAppNavigation.traveledDistance', 'Parcouru')}
                                    </Text>
                                    <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#111827' }]} numberOfLines={1}>
                                        {formatDistance(traveledDistance)}
                                    </Text>
                                </View>

                                <View style={styles.statItem}>
                                    <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]} numberOfLines={1}>
                                        {t('inAppNavigation.duration', 'Durée')}
                                    </Text>
                                    <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#111827' }]} numberOfLines={1}>
                                        {route.duration}
                                    </Text>
                                </View>
                            </View>

                            {travelMode === 'walking' && (
                                <View style={styles.precisionItem}>
                                    <Text style={[styles.precisionLabel, { color: '#10B981' }]}>
                                        ✓ {t('inAppNavigation.meterPrecision', 'Précision au mètre')}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </Animated.View>
                )  }   
            </View>
        </View>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    backdrop: {
        position: 'absolute',
        top: -1000,
        left: 0,
        right: 0,
        height: 1000,
    },
    assistant: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 10,
    },
    modeIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainInfo: {
        flex: 1,
        gap: 2,
    },
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    distanceText: {
        fontSize: 16,
        fontWeight: '700',
    },
    timeText: {
        fontSize: 12,
        fontWeight: '500',
    },
    instructionText: {
        fontSize: 11,
        fontWeight: '400',
    },
    nextStepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    nextStepText: {
        fontSize: 9,
        fontWeight: '400',
        fontStyle: 'italic',
    },
    offRouteText: {
        fontSize: 12,
        marginLeft: 4,
    },
    controls: {
        flexDirection: 'row',
        gap: 6,
    },
    controlButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    expandedSection: {
        paddingHorizontal: 12,
        paddingBottom: 12,
    },
    expandedContent: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 16,
    },
    pointsSection: {
        gap: 4,
    },
    pointRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    pointInfo: {
        flex: 1,
    },
    pointLabel: {
        fontSize: 10,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    pointValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    pointPrefix: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginBottom: 1,
    },
    connector: {
        width: 1,
        height: 10,
        marginLeft: 3.5,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        opacity: 0.5,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 9,
        fontWeight: '500',
        textAlign: 'center',
    },
    statValue: {
        fontSize: 13,
        fontWeight: '700',
        marginTop: 2,
        textAlign: 'center',
    },
    precisionItem: {
        alignItems: 'center',
        marginTop: 4,
    },
    precisionLabel: {
        fontSize: 10,
        fontWeight: '600',
    },
});
