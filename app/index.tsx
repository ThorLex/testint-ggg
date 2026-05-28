/**
 * Écran principal de l'application Navipad
 * 
 * Cet écran affiche :
 * - Le tutoriel au premier lancement
 * - La carte Google Maps avec les marqueurs
 * - La barre de recherche
 * - Le bouton de localisation
 * - La barre de navigation en bas
 * 
 * @module app/index
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { MapType } from 'react-native-maps';
import { History, Waypoints } from 'lucide-react-native';
import { MapPinIcon } from 'react-native-heroicons/solid';
import { useAppStore } from '@/store';
import { useAuthStore } from '@/store/auth';
import { useMapStore } from '@/store';
import { hasSeenTutorial, getLanguage } from '@/services/storage';
import { registerBottomSheetSetters, closeAllBottomSheets as closeAllBottomSheetsGlobal } from '@/utils/navigationHelpers';
import { recordNavigationStart, recordNavigationComplete } from '@/services/api/navigationHistory';
import { useMapData } from '@/hooks/useApi';
import { ApiRoutes } from '@/services/api/routes';
import { 
    TutorialModal, 
    AmodiataireDetailsSheet,
    AmodiatairesList,
    SettingsModal,
    LoginModal,
    LocationSetup,
    LanguageSetup,
    AmodiataireDetailsPage,
    AmodiataireDashboard,
    NotificationsModal,
    RouteDetailsSheet,
    NavigationModal,
    CompactNavigationAssistant,
    ServicesList,
    NavigationHistoryMenu,
    GeoMap
} from '@/components/organisms';
// Components
import { SearchBar } from '@/components/molecules/SearchBar';
import { BottomNavigation } from '@/components/organisms/BottomNavigation';
import { DistanceCalculator, type DistanceCalculatorRef } from '@/components/organisms/DistanceCalculator';
import { LocationButton, type LocationButtonRef } from '@/components/molecules/LocationButton';
import { NetworkIndicator } from '@/components/atoms/NetworkIndicator';
import { ErrorBoundary } from '@/components/atoms/ErrorBoundary';
import type { Route } from '@/types';

/**
 * Écran principal (Home)
 */
export default function HomeScreen() {
    const { isFirstLaunch } = useAppStore();
    const { isAuthenticated } = useAuthStore();
    const { t } = useTranslation();
    
    // ============================================================================
    // État Local
    // ============================================================================
    
    const [showTutorial, setShowTutorial] = useState(false);
    const [showAmodiatairesList, setShowAmodiatairesList] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);
    const [showServicesList, setShowServicesList] = useState(false);
    const [showHistoryMenu, setShowHistoryMenu] = useState(false);
    const [locationSetupComplete, setLocationSetupComplete] = useState(false);
    const [languageSetupComplete, setLanguageSetupComplete] = useState(false);
    const [showDetailsPage, setShowDetailsPage] = useState(false);
    const [selectedAmodiataireId, setSelectedAmodiataireId] = useState<string | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showRouteDetails, setShowRouteDetails] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const [searchType, setSearchType] = useState<'amodiataires' | 'routes' | 'announcements'>('amodiataires');
    const [showNavigation, setShowNavigation] = useState(false);
    const [navigationDestination, setNavigationDestination] = useState<{ latitude: number; longitude: number } | null>(null);
    const [navigationRoute, setNavigationRoute] = useState<any>(null);
    const [previewRoute, setPreviewRoute] = useState<any>(null);
    const previewRouteRef = useRef<any>(null);
    const [is3DEnabled, setIs3DEnabled] = useState(false);
    const [calculatedDistanceRoute, setCalculatedDistanceRoute] = useState<any>(null);
    const [activeNavigationId, setActiveNavigationId] = useState<string | null>(null);
    const [navigationTravelMode, setNavigationTravelMode] = useState<'WALKING' | 'DRIVING'>('DRIVING');
    const [navigationAmodiataireName, setNavigationAmodiataireName] = useState<string | null>(null);

    // Refs
    const distanceCalculatorRef = useRef<DistanceCalculatorRef>(null);
    const locationButtonRef = useRef<LocationButtonRef>(null);

    // Load map data for routes and announcements
    const { data: mapData } = useMapData();

    // ============================================================================
    // Effets
    // ============================================================================

    // Vérifier si la langue est déjà configurée
    useEffect(() => {
        const checkLanguage = async () => {
            const savedLang = await getLanguage();
            if (savedLang) {
                // La langue est déjà sauvegardée, pas besoin de demander
                setLanguageSetupComplete(true);
            }
        };
        checkLanguage();
    }, []);

    useEffect(() => {
        async function checkTutorial() {
            // Afficher le tutoriel si c'est le premier lancement et que tout est configuré
            if (isFirstLaunch && locationSetupComplete && languageSetupComplete) {
                const seen = await hasSeenTutorial();
                if (!seen) {
                    setShowTutorial(true);
                }
            }
        }
        
        checkTutorial();
    }, [isFirstLaunch, locationSetupComplete, languageSetupComplete]);

    // Enregistrer les setters pour la fermeture globale des bottom sheets
    useEffect(() => {
        registerBottomSheetSetters({
            setShowAmodiatairesList,
            setShowSettings,
            setShowLogin,
            setShowDashboard,
            setShowDetailsPage,
            setShowServicesList,
            setShowHistoryMenu,
            setShowNotifications,
            setShowRouteDetails,
            setShowTutorial,
        });
    }, []);

    // ============================================================================
    // Handlers
    // ============================================================================

    /**
     * Ferme tous les bottom sheets (appelé quand la navigation démarre)
     */
    const closeAllBottomSheets = useCallback(() => {
        console.log('🔥 FERMETURE DE TOUS LES BOTTOM SHEETS (LOCAL)');
        
        // Fermer tous les modals/sheets contrôlés par state
        setShowAmodiatairesList(false);
        setShowSettings(false);
        setShowLogin(false);
        setShowDashboard(false);
        setShowDetailsPage(false);
        setShowServicesList(false);
        setShowHistoryMenu(false);
        setShowNotifications(false);
        setShowRouteDetails(false);
        setShowTutorial(false);
        previewRouteRef.current = null;
        setPreviewRoute(null);
        
        // Fermer AmodiataireDetailsSheet via le store
        const { setSelectedMarkerId } = useMapStore.getState();
        setSelectedMarkerId(null);
        
        console.log('✅ Tous les bottom sheets fermés (local)');
    }, []);

    /**
     * Gère le clic sur le bouton de connexion/profil
     */
    const handleLoginPress = () => {
        if (isAuthenticated) {
            setShowDashboard(true);
        } else {
            setShowLogin(true);
        }
    };

    /**
     * Gère la sélection d'un amodiataire depuis la recherche
     */
    const handleSearchResultSelect = (amodiataire: any) => {
        setSelectedAmodiataireId(amodiataire.id);
        setShowDetailsPage(true);
    };

    /**
     * Gère la sélection d'une route depuis la recherche
     */
    const handleRouteSelect = (route: Route) => {
        setSelectedRoute(route);
        setShowRouteDetails(true);
        // TODO: Center map on selected route
    };

    /**
     * Gère la sélection d'une route depuis la carte
     */
    const handleMapRouteSelect = (routeId: string | null) => {
        if (routeId && mapData?.routes) {
            const route = mapData.routes.find((r: Route) => r.id === routeId);
            if (route) {
                setSelectedRoute(route);
                setShowRouteDetails(true);
            }
        } else {
            // Deselection
            setSelectedRoute(null);
            setShowRouteDetails(false);
        }
    };



    /**
     * Centralise le démarrage de la navigation et l'enregistrement de l'historique
     */
    const handleStartNavigation = useCallback(async (routeOverride?: any) => {
        const routeToUse = routeOverride || previewRouteRef.current;
        
        console.log('🚀 [HomeScreen] handleStartNavigation:', {
            hasOverride: !!routeOverride,
            hasPreview: !!previewRoute,
            routeToUse: routeToUse ? {
                id: routeToUse.id,
                summary: routeToUse.summary,
                polylineLength: routeToUse.polyline?.length
            } : 'NULL'
        });

        if (!routeToUse) {
            console.log('⚠️ [HomeScreen] Abandon du démarrage: aucune route à utiliser');
            return;
        }

        // 1. Définir les données de navigation
        setNavigationRoute(routeToUse);
        if (routeToUse.polyline && routeToUse.polyline.length > 0) {
            const dest = routeToUse.polyline[routeToUse.polyline.length - 1];
            console.log('📍 [HomeScreen] Destination définie:', dest);
            setNavigationDestination(dest);
        }

        // Stocker le nom de l'amodiataire si disponible
        setNavigationAmodiataireName(routeToUse.amodiataireName || null);

        // 1.5 Définir le mode de transport (normalisation pour l'état interne et l'API)
        const rawMode = routeToUse.travelMode || 'driving';
        const travelMode = (rawMode.toLowerCase() === 'walking' ? 'WALKING' : 'DRIVING');
        setNavigationTravelMode(travelMode);

        // 2. Activer les modes visuels
        setShowNavigation(true);
        setIs3DEnabled(true);
        closeAllBottomSheets();
        previewRouteRef.current = null;
        setPreviewRoute(null);

        // 3. Enregistrer l'historique
        try {
            console.log('📡 [HomeScreen] Appel API recordNavigationStart...');
            
            const startData = {
                origin: {
                    lat: routeToUse.polyline?.[0]?.latitude || 0,
                    lng: routeToUse.polyline?.[0]?.longitude || 0,
                    address: routeToUse.originName || 'Ma position'
                },
                destination: {
                    lat: routeToUse.polyline?.[routeToUse.polyline?.length - 1]?.latitude || 0,
                    lng: routeToUse.polyline?.[routeToUse.polyline?.length - 1]?.longitude || 0,
                    address: routeToUse.destinationName || routeToUse.summary || 'Destination'
                },
                routeData: routeToUse.summary || String(routeToUse.id || 'google-maps-route'),
                distanceMeters: routeToUse.distance 
                    ? (typeof routeToUse.distance === 'string' ? parseFloat(routeToUse.distance) * 1000 : routeToUse.distance)
                    : 0,
                durationSeconds: routeToUse.duration
                    ? (typeof routeToUse.duration === 'string' ? parseFloat(routeToUse.duration) * 60 : routeToUse.duration)
                    : 0,
                travelMode: travelMode as "WALKING" | "DRIVING"
            };

            const historyId = await recordNavigationStart(startData);

            if (historyId) {
                console.log('✅ [HomeScreen] Navigation enregistrée avec ID:', historyId);
                setActiveNavigationId(historyId);
            }
        } catch (error) {
            console.error('❌ [HomeScreen] Erreur recording navigation:', error);
        }
    }, [closeAllBottomSheets]);

    /**
     * Gère la navigation vers une route
     */
    const handleNavigateToRoute = (route: Route) => {
        // Calculer le centre de la route (première coordonnée)
        if (route.coordinates && route.coordinates.length > 0) {
            const firstCoord = route.coordinates[0];
            setNavigationDestination({
                latitude: firstCoord.lat,
                longitude: firstCoord.lng,
            });
            // Créer un objet route compatible avec CompactNavigationAssistant
            setNavigationRoute({
                id: route.id,
                summary: route.name,
                duration: route.estimatedTime || '0 min',
                distance: `${route.length} km`,
                polyline: route.coordinates.map(coord => ({
                    latitude: coord.lat,
                    longitude: coord.lng,
                })),
                steps: [], // Les étapes seront générées par Google Directions dans le composant
            });
            
            
            // Activer les modes visuels
            setIs3DEnabled(true);
            setShowNavigation(true);
            closeAllBottomSheets();

            // Enregistrer le début de la navigation
            const startHistory = async () => {
                const historyId = await recordNavigationStart({
                    origin: {
                        lat: route.coordinates[0].lat,
                        lng: route.coordinates[0].lng,
                        address: 'Départ'
                    },
                    destination: {
                        lat: firstCoord.lat,
                        lng: firstCoord.lng,
                        address: route.name
                    },
                    routeData: route.id,
                    distanceMeters: Math.round((route.length || 0) * 1000),
                    travelMode: 'DRIVING' // Les routes backend sont par défaut pour véhicules
                });
                if (historyId) {
                    setActiveNavigationId(historyId);
                }
            };
            startHistory();
        }
    };



    // ============================================================================
    // Rendu
    // ============================================================================

    return (
        <View className="flex-1 bg-background-light dark:bg-background-dark">
            {/* Choix de langue (premier lancement) */}
            <LanguageSetup
                visible={isFirstLaunch && !languageSetupComplete}
                onComplete={() => {
                    setLanguageSetupComplete(true);
                    console.log('🌍 Langue configurée');
                }}
            />

            {/* Setup de localisation (premier lancement) */}
            <LocationSetup
                autoSetup={isFirstLaunch && languageSetupComplete}
                onSetupComplete={(hasPermission) => {
                    setLocationSetupComplete(true);
                    console.log('📍 Setup localisation terminé:', hasPermission);
                }}
            />

            {/* Tutoriel Modal */}
            <TutorialModal
                visible={showTutorial}
                onClose={() => setShowTutorial(false)}
            />

            {/* Carte */}
            <GeoMap 
                selectedRouteId={selectedRoute?.id || null}
                onRouteSelect={handleMapRouteSelect}
                navigationRoute={previewRoute || navigationRoute}
                is3DEnabled={is3DEnabled}
                isNavigating={showNavigation}
                distanceRoute={calculatedDistanceRoute}
            />

            {/* Header minimaliste et élégant */}
            <View className="absolute top-20 left-4 right-4 bottom-0 z-50" pointerEvents="box-none">
                <View className="flex-row items-start gap-3 w-full h-full" pointerEvents="box-none">
                    {/* Logo */}
                    <View className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl h-[48px] w-[48px] items-center justify-center shadow-md">
                        <View className="flex-row items-center justify-center">
                            <Image
                                source={require('../assets/icon.png')}
                                className="w-9 h-9"
                                resizeMode="contain"
                            />
                        </View>
                    </View>

                    {/* Barre de recherche épurée */}
                    <View className="flex-1 h-full" pointerEvents="box-none">
                        <SearchBar 
                            onResultSelect={handleSearchResultSelect}
                            searchType={searchType}
                            routes={mapData?.routes || []}
                            onRouteSelect={handleRouteSelect}
                            onSearchTypeChange={setSearchType}
                        />
                    </View>
                </View>
            </View>

            {/* Boutons d'action latéraux (Calcul, Position, Historique) */}
            {!showNavigation && (
                <View className="absolute right-4 bottom-32 z-40 items-center">
                    <View className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl p-2 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
                        {/* Bouton Calcul */}
                        <TouchableOpacity
                            onPress={() => distanceCalculatorRef.current?.open()}
                            className="items-center justify-center p-3 mb-2 rounded-2xl active:bg-emerald-500/10"
                        >
                            <Waypoints size={24} color="#10B981" />
                            <Text className="text-[10px] font-bold text-gray-900 dark:text-white mt-1">
                                {t('calculator.short_title', 'Itinéraire')}
                            </Text>
                        </TouchableOpacity>

                        {/* Bouton Position */}
                        <TouchableOpacity
                            onPress={() => locationButtonRef.current?.center()}
                            className="items-center justify-center p-3 mb-2 rounded-2xl active:bg-blue-500/10"
                        >
                            <MapPinIcon size={24} color="#3B82F6" />
                            <Text className="text-[10px] font-bold text-gray-900 dark:text-white mt-1">
                                {t('navigation.position', 'Position')}
                            </Text>
                        </TouchableOpacity>

                        {/* Bouton Historique */}
                        <TouchableOpacity
                            onPress={() => setShowHistoryMenu(true)}
                            className="items-center justify-center p-3 rounded-2xl active:bg-purple-500/10"
                        >
                            <History size={24} color="#8B5CF6" />
                            <Text className="text-[10px] font-bold text-gray-900 dark:text-white mt-1">
                                {t('history.short_title', 'Historique')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Bouton de localisation (caché, utilisé via ref) */}
            <LocationButton ref={locationButtonRef} hideFloating={true} />

            {/* Barre de navigation en bas */}
            <BottomNavigation
                isAuthenticated={isAuthenticated}
                onLoginPress={() => setShowLogin(true)}
                onListPress={() => setShowAmodiatairesList(true)}
                onServicesPress={() => setShowServicesList(true)}
                onSettingsPress={() => setShowSettings(true)}
                onHistoryPress={() => setShowHistoryMenu(true)}
                onNotificationsPress={() => {
                    console.log('📢 [Menu Annonce] Cliqué');
                    console.log('📡 Route utilisée:', ApiRoutes.MAP_DATA);
                    console.log('📦 Structure de données récupérée:', JSON.stringify(mapData?.announcements, null, 2));
                    setShowNotifications(true);
                }}
                notificationCount={mapData?.announcements?.length || 0}
                layout={showNavigation ? 'side' : 'bottom'}
            />

            {/* Calculateur de distance */}
            <DistanceCalculator 
                ref={distanceCalculatorRef}
                showFab={false}
                onRouteCalculated={async (route: any) => {
                    setCalculatedDistanceRoute(route);
                    if (route && route.polyline && route.polyline.length > 0) {
                        try {
                            const startData = {
                                origin: {
                                    lat: route.polyline[0]?.latitude || 0,
                                    lng: route.polyline[0]?.longitude || 0,
                                    address: route.originMarker?.name || 'Origine vue plan'
                                },
                                destination: {
                                    lat: route.polyline[route.polyline.length - 1]?.latitude || 0,
                                    lng: route.polyline[route.polyline.length - 1]?.longitude || 0,
                                    address: route.destinationMarker?.name || route.summary || 'Destination vue plan'
                                },
                                routeData: route.summary || 'distance-calculator-route',
                                distanceMeters: parseFloat(route.distance) * 1000 || 0,
                                durationSeconds: parseFloat(route.duration) * 60 || 0,
                                travelMode: (route.travelMode === 'walking' ? 'WALKING' : 'DRIVING') as 'WALKING' | 'DRIVING'
                            };
                            
                            const historyId = await recordNavigationStart(startData);
                            // On peut immédiatement marquer comme terminé car c'est un calcul de distance
                            if (historyId) {
                                await recordNavigationComplete(historyId, { type: 'distance_calculation' });
                            }
                        } catch (error) {
                            console.error('❌ Erreur history distance calc:', error);
                        }
                    }
                }}
                onExpand={() => {
                    closeAllBottomSheets();
                }}
            />

            {/* Dashboard de l'amodiataire */}
            <AmodiataireDashboard
                visible={showDashboard}
                onClose={() => setShowDashboard(false)}
            />

            {/* Menu Historique */}
            <NavigationHistoryMenu
                visible={showHistoryMenu}
                onClose={() => setShowHistoryMenu(false)}
            />

            {/* Détails de l'amodiataire (overlay via marqueur) */}
            <AmodiataireDetailsSheet 
                onNavigationStart={handleStartNavigation}
                onRouteSelected={(route) => {
                    previewRouteRef.current = route;
                    setPreviewRoute(route);
                }}
            />

            {/* Modals */}
            <AmodiatairesList
                visible={showAmodiatairesList}
                onClose={() => setShowAmodiatairesList(false)}
                onSelectAmodiataire={(amodiataire) => {
                    setSelectedAmodiataireId(amodiataire.id || '');
                    setShowDetailsPage(true);
                }}
                onNavigationStart={handleStartNavigation}
                onRouteSelected={(route) => {
                    console.log('📍 HomeScreen: Route reçue depuis AmodiatairesList (Preview)');
                    previewRouteRef.current = route;
                    setPreviewRoute(route);
                }}
            />

            <ServicesList
                visible={showServicesList}
                onClose={() => setShowServicesList(false)}
                onSelectService={(service) => {
                    setSelectedAmodiataireId(service.id || '');
                    setShowDetailsPage(true);
                }}
                onNavigationStart={handleStartNavigation}
                onRouteSelected={(route) => {
                    previewRouteRef.current = route;
                    setPreviewRoute(route);
                }}
            />

            <SettingsModal
                visible={showSettings}
                onClose={() => setShowSettings(false)}
            />

            <LoginModal
                visible={showLogin}
                onClose={() => setShowLogin(false)}
                onLoginSuccess={() => {
                    // Ouvrir automatiquement le dashboard après connexion réussie
                    setShowDashboard(true);
                }}
            />

            {/* Dashboard de l'amodiataire */}
            <AmodiataireDashboard
                visible={showDashboard}
                onClose={() => setShowDashboard(false)}
            />

            {/* Page de détails de l'amodiataire */}
            <ErrorBoundary>
                <AmodiataireDetailsPage
                    visible={showDetailsPage}
                    onClose={() => {
                        setShowDetailsPage(false);
                        setSelectedAmodiataireId(null);
                    }}
                    amodiataireId={selectedAmodiataireId}
                    onNavigationStart={handleStartNavigation}
                    onRouteSelected={(route) => {
                        console.log('📍 HomeScreen: Route reçue depuis AmodiataireDetailsPage (Preview)');
                        previewRouteRef.current = route;
                        setPreviewRoute(route);
                    }}
                />
            </ErrorBoundary>

            {/* Notifications Modal - Utilise les annonces de l'API */}
            <NotificationsModal
                visible={showNotifications}
                onClose={() => setShowNotifications(false)}
                announcements={mapData?.announcements || []}
            />

            {/* Route Details Sheet */}
            <RouteDetailsSheet
                route={selectedRoute}
                visible={showRouteDetails}
                onClose={() => {
                    setShowRouteDetails(false);
                    setSelectedRoute(null);
                    // This will trigger deselection on the map through the selectedRouteId prop
                }}
                onNavigate={handleNavigateToRoute}
            />

            {/* Compact Navigation Assistant - Ultra-compact overlay */}
            {showNavigation && navigationDestination && (
                <CompactNavigationAssistant
                    visible={showNavigation}
                    onClose={() => {
                        if (activeNavigationId) {
                            recordNavigationComplete(activeNavigationId);
                            setActiveNavigationId(null);
                        }
                        setShowNavigation(false);
                        setNavigationDestination(null);
                        setNavigationRoute(null);
                        setNavigationAmodiataireName(null);
                        // Désactiver automatiquement la vue 3D quand la navigation se termine
                        setIs3DEnabled(false);
                    }}
                    route={navigationRoute}
                    destination={navigationDestination}
                    travelMode={navigationTravelMode.toLowerCase() as any}
                    onNavigationStart={closeAllBottomSheets}
                    amodiataireName={navigationAmodiataireName}
                />
            )}
        </View>
    );
}
