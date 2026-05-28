/**
 * Composant MapView (Organism)
 * 
 * Carte Google Maps avec marqueurs, zone de délimitation,
 * et suivi de la position utilisateur.
 * 
 * @module components/organisms/MapView
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import MapView, { Marker, Polygon, Polyline, PROVIDER_GOOGLE, PROVIDER_DEFAULT, MapType } from 'react-native-maps';
import type { MapMarker as MapMarkerType } from 'react-native-maps';
import { BitmapLabelFactory } from '@/components/organisms/BitmapLabelFactory';
import type { BuildingLabelTemplate } from '@/components/organisms/BitmapLabelFactory';
import { RouteNameLabelFactory } from '@/components/organisms/RouteNameLabelFactory';
import type { RouteLabelTemplate } from '@/components/organisms/RouteNameLabelFactory';
import { getCachedBitmap, buildLabelKeyById, buildRouteKey } from '@/components/organisms/labelBitmaps';
import { getCanonicalName } from '@/services/api/amodiataireNamesCache';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

// Services & Store
import { get } from '@/services/api/client';
import { ApiRoutes } from '@/services/api/routes';
import { useMapData } from '@/hooks/useApi';
import { useMapStore, useMapType } from '@/store';
import { getCurrentLocation } from '@/services/location';
import { useThemeColors, useIsDarkMode } from '@/theme';
import { useBuildingsData } from '@/hooks/useBuildingsData';
import type { AmodiatairCoordinates, ZoneBoundsResponse, AppMapType, AmodiataireListItem, Route } from '@/types';

// ============================================================================
// Props
// ============================================================================

export interface GeoMapProps {
    /** Mode d'affichage de la carte */
    mapType?: AppMapType;
    /** ID de la route sélectionnée */
    selectedRouteId?: string | null;
    /** Callback quand une route est sélectionnée */
    onRouteSelect?: (routeId: string | null) => void;
    /** Route de navigation active */
    navigationRoute?: {
        id: string;
        polyline: Array<{ latitude: number; longitude: number }>;
        buildingCoordinates?: Array<{ latitude: number; longitude: number }>;
        destinationCoordinates?: { latitude: number; longitude: number };
        segments?: Array<{
            points: Array<{ latitude: number; longitude: number }>;
            type: 'google' | 'backend' | 'internal';
            name?: string;
        }>;
    } | null;
    /** Mode 3D activé */
    is3DEnabled?: boolean;
    /** Navigation active (pour activer le mode 3D uniquement pendant la navigation) */
    isNavigating?: boolean;
    /** Route calculée par le calculateur de distance */
    distanceRoute?: {
        polyline: Array<{ latitude: number; longitude: number }>;
        summary: string;
        distance: string;
        duration: string;
        originMarker?: { latitude: number; longitude: number; name: string; polygonCoordinates?: { latitude: number; longitude: number }[] };
        destinationMarker?: { latitude: number; longitude: number; name: string; polygonCoordinates?: { latitude: number; longitude: number }[] };
        segments?: Array<{
            points: Array<{ latitude: number; longitude: number }>;
            type: 'google' | 'backend' | 'internal';
            name?: string;
        }>;
    } | null;
}

// ============================================================================
// Styles de Carte
// ============================================================================

/**
 * Style de carte pour le mode sombre (Standard Dark)
 */
const darkMapStyle = [
    {
        elementType: 'geometry',
        stylers: [{ color: '#242f3e' }],
    },
    {
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#242f3e' }],
    },
    {
        elementType: 'labels.text.fill',
        stylers: [{ color: '#746855' }],
    },
    {
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [{ color: '#283d6a' }],
    },
    {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#6f9ba5' }],
    },
    {
        featureType: 'poi',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#1d2c4d' }],
    },
];

/**
 * Style de carte pour Android Auto (Mode Conduite Sombre Blue-Grey)
 */
const androidAutoMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
    { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#64779e' }] },
    { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
    { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ color: '#334e87' }] },
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#023e58' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f9ba5' }] },
    { featureType: 'poi', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
    { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#255761' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#b0d5ce' }] },
    { featureType: 'road.highway', elementType: 'labels.text.stroke', stylers: [{ color: '#023e58' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] }
];

/**
 * Style de carte pour CarPlay (Mode Conduite Clair Haute Visibilité)
 */
const carplayMapStyle = [
    { featureType: 'all', elementType: 'labels.text.fill', stylers: [{ color: '#333333' }] },
    { featureType: 'landscape', stylers: [{ color: '#f5f5f5' }] },
    { featureType: 'poi', stylers: [{ visibility: 'on' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#ffecb3' }] },
    { featureType: 'water', stylers: [{ color: '#b3e5fc' }] }
];

// ============================================================================
// Helpers
// ============================================================================

/** Normalise un point de coordonnée — gère lat/lng, latitude/longitude et order optionnel. */
function normalizeCoord(c: any, idx: number): { latitude: number; longitude: number; order: number } {
    return {
        latitude: Number(c.lat ?? c.latitude ?? 0),
        longitude: Number(c.lng ?? c.longitude ?? 0),
        order: Number(c.order ?? idx),
    };
}

/** Retourne le point médian d'une série de coordonnées de route. */
function routeMidpoint(
    coords: any[]
): { latitude: number; longitude: number } {
    const sorted = coords
        .map(normalizeCoord)
        .filter((c) => c.latitude !== 0 || c.longitude !== 0)
        .sort((a, b) => a.order - b.order);
    if (sorted.length === 0) return { latitude: 0, longitude: 0 };
    const mid = sorted[Math.floor(sorted.length / 2)];
    return { latitude: mid.latitude, longitude: mid.longitude };
}

/** Convertit les coordonnées d'une route en polyligne { latitude, longitude }[]. */
function routeToPolyline(
    coords: any[]
): Array<{ latitude: number; longitude: number }> {
    return coords
        .map(normalizeCoord)
        .filter((c) => c.latitude !== 0 || c.longitude !== 0)
        .sort((a, b) => a.order - b.order)
        .map(({ latitude, longitude }) => ({ latitude, longitude }));
}

/**
 * Calcule l'angle de rotation d'un label de route pour qu'il s'aligne sur
 * la direction de la voie au point médian — comportement identique à Google Maps.
 * Résultat normalisé à [-90°, 90°] : 2 sens lisibles, jamais tête en bas.
 */
function routeLabelAngle(
    coords: Array<{ latitude: number; longitude: number }>
): number {
    if (coords.length < 2) return 0;
    const mid = Math.floor(coords.length / 2);
    const p1 = coords[Math.max(0, mid - 1)];
    const p2 = coords[Math.min(coords.length - 1, mid + 1)];

    const dx = p2.longitude - p1.longitude;
    const dy = p2.latitude - p1.latitude;

    // atan2(dy, dx) → angle anti-horaire depuis l'Est (axe horizontal carte)
    // On inverse le signe car react-native-maps rotation est horaire
    let angle = -Math.atan2(dy, dx) * 180 / Math.PI;

    // Normalise à [-90°, 90°] : 2 sens lisibles, jamais tête en bas
    if (angle > 90) angle -= 180;
    else if (angle < -90) angle += 180;

    return angle;
}

/** Aire approximative d'un polygone en coordonnées lat/lng (formule de Shoelace) */
function calcPolygonArea(coords: Array<{ latitude: number; longitude: number }>): number {
    const n = coords.length;
    if (n < 3) return 0;
    let area = 0;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += coords[i].latitude * coords[j].longitude;
        area -= coords[j].latitude * coords[i].longitude;
    }
    return Math.abs(area / 2);
}

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant MapView
 */
export function GeoMap({ 
    mapType: propMapType, 
    selectedRouteId = null, 
    onRouteSelect, 
    navigationRoute = null,
    is3DEnabled = false,
    isNavigating = false,
    distanceRoute = null
}: GeoMapProps) {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const isDark = useIsDarkMode();
    const mapRef = useRef<MapView>(null);
    const storedMapType = useMapType();

    // Priorité au prop, sinon au store
    const mapType = propMapType || storedMapType;

    const {
        region,
        setRegion,
        markers,
        setMarkers,
        selectedMarkerId,
        setSelectedMarkerId,
        isFollowingUser,
        setIsFollowingUser,
        showsUserLocation,
        showsZoneBounds,
    } = useMapStore();

    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    // latitudeDelta courant pour contrôler la visibilité des labels/polygones
    const [visibilityDelta, setVisibilityDelta] = useState(region.latitudeDelta);

    // Refs des Markers bâtiments pour appeler showCallout()/hideCallout()
    const markerRefs = useRef<Map<string, MapMarkerType>>(new Map());
    // ID du bâtiment dont le callout est actuellement ouvert
    const openCalloutId = useRef<string | null>(null);
    // Incrément déclenche un re-render quand BitmapLabelFactory génère un nouveau bitmap
    const [bitmapVersion, setBitmapVersion] = useState(0);
    // true quand BitmapLabelFactory a terminé → composant démonté pour libérer le GPU
    const [buildingBitmapsDone, setBuildingBitmapsDone] = useState(false);
    // true quand RouteNameLabelFactory peut démarrer (150 ms après buildingBitmapsDone)
    // Le délai laisse le GPU vider sa queue de compositing avant de commencer les routes
    const [routeFactoryActive, setRouteFactoryActive] = useState(false);
    // Incrément déclenche un re-render quand RouteNameLabelFactory génère un nouveau bitmap
    const [routeBitmapVersion, setRouteBitmapVersion] = useState(0);

    // Déterminer le style de carte et le type effectif
    let effectiveMapType: MapType = 'standard';
    let customStyle: any[] | undefined = undefined;

    if (mapType === 'android_auto') {
        effectiveMapType = 'standard';
        customStyle = androidAutoMapStyle;
    } else if (mapType === 'carplay') {
        effectiveMapType = 'standard';
        customStyle = carplayMapStyle;
    } else if (mapType === 'standard' && isDark) {
        effectiveMapType = 'standard';
        customStyle = darkMapStyle;
    } else {
        effectiveMapType = mapType as MapType;
    }

    // ============================================================================
    // Chargement des Coordonnées Amodiataires — cache RAM → React Query → disque
    // ============================================================================

    const {
        amodiataires,
        isLoading: isLoadingAmodiataires,
    } = useBuildingsData();

    // Extraire tous les bâtiments avec polygones depuis tous les amodiataires — mémoïsé
    const buildingPolygons = React.useMemo(() => {
        const result: Array<{
            id: string;
            amodiatairId: string;
            nom: string;
            amodiataireName: string;
            coordinates: Array<{ latitude: number; longitude: number }>;
            center: { latitude: number; longitude: number };
            // latitudeDelta en dessous duquel le polygone s'affiche
            polygonVisibleDelta: number;
            // latitudeDelta en dessous duquel le label s'affiche (plus restrictif)
            labelVisibleDelta: number;
        }> = [];

        amodiataires.forEach((amod: AmodiataireListItem) => {
            if (!amod.batiments || !Array.isArray(amod.batiments)) return;
            amod.batiments.forEach((bat) => {
                const rawCoords = bat.coordinates;
                if (!rawCoords) return;

                const coordsArray: any[] = Array.isArray(rawCoords) ? rawCoords : [rawCoords];
                if (coordsArray.length < 3) return;

                const coords = coordsArray
                    .map((c: any) => ({
                        latitude: Number(c?.latitude ?? c?.lat ?? 0),
                        longitude: Number(c?.longitude ?? c?.lng ?? 0),
                    }))
                    .filter((c) => c.latitude !== 0 && c.longitude !== 0 && !isNaN(c.latitude) && !isNaN(c.longitude));

                if (coords.length < 3) return;

                const centerLat = coords.reduce((s, c) => s + c.latitude, 0) / coords.length;
                const centerLng = coords.reduce((s, c) => s + c.longitude, 0) / coords.length;

                // Importance du bâtiment basée sur sa surface réelle.
                // À ~4°N (Douala) : 1° lat ≈ 111km, 1° lng ≈ 110.7km
                // Conversions : 100m×100m → area ≈ 8e-7 | 50m×50m → 2e-7 | 20m×20m → 3.2e-8
                const area = calcPolygonArea(coords);
                let polygonVisibleDelta: number;
                let labelVisibleDelta: number;

                // Seuils calibrés pour apparaître au niveau quartier (delta ≈ 0.010-0.015)
                // et non au niveau ville/district (delta > 0.02) — évite la superposition
                if (area > 5e-7) {
                    // Très grand (≥~80m×80m) : premiers à apparaître au niveau quartier
                    polygonVisibleDelta = 0.05;
                    labelVisibleDelta = 0.015;
                } else if (area > 5e-8) {
                    // Grand (~25-80m)
                    polygonVisibleDelta = 0.025;
                    labelVisibleDelta = 0.010;
                } else if (area > 5e-9) {
                    // Moyen (~8-25m) : niveau rue
                    polygonVisibleDelta = 0.012;
                    labelVisibleDelta = 0.006;
                } else {
                    // Petit (<~8m) : seulement très proche
                    polygonVisibleDelta = 0.006;
                    labelVisibleDelta = 0.003;
                }

                // Utilise le nom canonique (cache noms) si disponible, sinon fallback sur la liste
                const canonicalName = getCanonicalName(amod.id) || amod.raisonSociale || 'Amodiataire';

                result.push({
                    id: bat.id,
                    amodiatairId: amod.id,
                    nom: canonicalName,
                    amodiataireName: canonicalName,
                    coordinates: coords,
                    center: { latitude: centerLat, longitude: centerLng },
                    polygonVisibleDelta,
                    labelVisibleDelta,
                });
            });
        });

        if (result.length > 0) {
            console.log(`🏗️ ${result.length} bâtiments chargés`);
        } else {
            console.warn('⚠️ buildingPolygons vide — vérifier batiments[].coordinates');
        }

        return result;
    }, [amodiataires]);

    // Templates pour BitmapLabelFactory — un par bâtiment, dédupliqués en interne par la factory
    // La clé du bitmap est basée sur l'ID (pas le nom) pour éviter les collisions
    const buildingTemplates = React.useMemo<BuildingLabelTemplate[]>(() =>
        buildingPolygons.map((b) => ({
            kind: 'building' as const,
            id: b.amodiatairId,
            name: b.nom,
            isPriority: false,
        })),
        [buildingPolygons]
    );

    // ============================================================================
    // Chargement de la Zone de Délimitation
    // ============================================================================

    const { data: zoneBounds, isLoading: isLoadingZone } = useQuery({
        queryKey: ['zone-bounds'],
        queryFn: () => get<ZoneBoundsResponse>(ApiRoutes.getFullUrl(ApiRoutes.DELIMITATION)),
        staleTime: 24 * 60 * 60 * 1000, // 24 heures
    });

    // ============================================================================
    // Chargement des Routes — /api/public/map/all -> routes
    // Réutilise le même cache que DistanceCalculator (queryKey: ['map', 'data'])
    // ============================================================================

    const { data: mapData } = useMapData();

    /** Toutes les routes avec polyligne et point médian précalculés.
     *  Aucun filtre sur le statut — on affiche toutes les routes (active, inactive, maintenance). */
    const routeDisplayData = React.useMemo(() => {
        const list: Route[] = mapData?.routes ?? [];
        const valid = list.filter((r) => Array.isArray(r.coordinates) && r.coordinates.length >= 2);

        console.log(`🛣️ Routes : ${list.length} total — ${valid.length} avec coordonnées`);
        if (valid.length > 0) {
            const sample = valid[0];
            console.log(`🛣️ Exemple route[0] — id: ${sample.id} | name: "${sample.name}" | status: ${sample.status} | coords[0]:`, JSON.stringify(sample.coordinates[0]));
        }

        return valid.map((r) => {
            const roadType = r.metadata?.roadType;
            const isPrimary = roadType === 'primary' || roadType === 'main';
            const isSecondary = roadType === 'secondary';

            // Seuils calés sur ceux des bâtiments :
            // primaire → visible dès le niveau quartier
            // secondaire → niveau rue
            // autres (footway, path…) → seulement très proche
            const polylineVisibleDelta = isPrimary ? 0.05 : isSecondary ? 0.030 : 0.020;
            const labelVisibleDelta    = isPrimary ? 0.015 : isSecondary ? 0.012 : 0.008;

            const polyline = routeToPolyline(r.coordinates);
            return {
                id: r.id,
                name: r.name ?? '',
                roadType,
                status: r.status,
                polyline,
                midpoint: routeMidpoint(r.coordinates),
                polylineVisibleDelta,
                labelVisibleDelta,
                labelAngle: routeLabelAngle(polyline),
            };
        });
    }, [mapData]);

    /** Templates transmis à RouteNameLabelFactory — uniquement les routes nommées */
    const routeTemplates = React.useMemo<RouteLabelTemplate[]>(() =>
        routeDisplayData
            .filter((r) => r.name.trim().length > 0)
            .map((r) => ({
                kind: 'route' as const,
                id: r.id,
                name: r.name,
                roadType: r.roadType,
            })),
        [routeDisplayData]
    );

    /** Routes avec leur bitmap — filtrées par zoom ET par disponibilité du bitmap */
    const visibleRouteMarkers = React.useMemo(() =>
        routeDisplayData
            .filter((r) => r.name.trim().length > 0 && visibilityDelta <= r.labelVisibleDelta)
            .map((r) => ({ ...r, bitmapUri: getCachedBitmap(buildRouteKey(r.id)) }))
            .filter((r): r is typeof r & { bitmapUri: string } => r.bitmapUri !== null),
        [routeDisplayData, visibilityDelta, routeBitmapVersion]
    );

    // ============================================================================
    // Effets
    // ============================================================================

    /**
     * Charger la position utilisateur au montage
     */
    useEffect(() => {
        async function loadUserLocation() {
            const location = await getCurrentLocation();
            if (location) {
                const coords = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };
                setUserLocation(coords);

                // Centrer la carte sur l'utilisateur si c'est le premier chargement
                setRegion({
                    ...coords,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                });
                console.log('📍 Carte centrée sur la position utilisateur');
            } else if (zoneBounds) {
                // Si pas de localisation utilisateur, centrer sur la zone de service
                const centerLat = zoneBounds.center.lat ?? zoneBounds.center.latitude;
                const centerLng = zoneBounds.center.lng ?? zoneBounds.center.longitude;
                
                if (centerLat && centerLng) {
                    setRegion({
                        latitude: centerLat,
                        longitude: centerLng,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.1,
                    });
                    console.log('📍 Carte centrée sur la zone de service:', { centerLat, centerLng });
                }
            }
        }

        loadUserLocation();
    }, [zoneBounds]);

    /**
     * Mettre à jour les marqueurs quand les amodiataires sont chargés
     */
    useEffect(() => {
        if (amodiataires && amodiataires.length > 0) {
            type MarkerItem = { id: string; coordinate: { latitude: number; longitude: number }; title: string; type: 'amodiataire' };
            const newMarkers: MarkerItem[] = [];

            amodiataires.forEach((amod: AmodiataireListItem) => {
                const centerCoord = (amod as any).center || (amod as any).coordinates;
                const latitude = centerCoord?.latitude ?? centerCoord?.lat;
                const longitude = centerCoord?.longitude ?? centerCoord?.lng;

                if (
                    typeof latitude !== 'number' ||
                    typeof longitude !== 'number' ||
                    isNaN(latitude) || isNaN(longitude) ||
                    latitude < -90 || latitude > 90 ||
                    longitude < -180 || longitude > 180
                ) return;

                newMarkers.push({
                    id: amod.id,
                    coordinate: { latitude, longitude },
                    title: getCanonicalName(amod.id) || amod.raisonSociale || `${(amod as any).prenom || ''} ${(amod as any).nom || ''}`.trim(),
                    type: 'amodiataire',
                });
            });

            setMarkers(newMarkers);
            console.log('📍', newMarkers.length, 'marqueurs chargés');

            // ── Structure amodiataires (log unique au premier chargement) ──
            const sample = amodiataires[0] as any;
            console.log('\n══════════════════════════════════════════');
            console.log('📦  STRUCTURE AMODIATAIRES');
            console.log('══════════════════════════════════════════');
            console.log(`  Total             : ${amodiataires.length} amodiataires`);
            console.log(`  Clés disponibles  : ${Object.keys(sample).join(' | ')}`);
            console.log('──────────────────────────────────────────');
            console.log('  Exemple [0] — champs principaux :');
            console.log(`    id              : ${sample.id}`);
            console.log(`    raisonSociale   : ${sample.raisonSociale}`);
            console.log(`    prenom / nom    : ${sample.prenom ?? '–'} ${sample.nom ?? '–'}`);
            console.log(`    center          : ${JSON.stringify(sample.center ?? sample.coordinates ?? null)}`);
            console.log(`    profile         : ${JSON.stringify(sample.profile ?? null)}`);
            if (sample.batiments?.length) {
                console.log(`    batiments       : ${sample.batiments.length} bâtiment(s)`);
                console.log('    batiments[0]   :', JSON.stringify(sample.batiments[0], null, 4)
                    .split('\n').map((l: string) => '      ' + l).join('\n'));
            } else {
                console.log('    batiments       : (aucun)');
            }
            console.log('══════════════════════════════════════════\n');
        }
    }, [amodiataires]);

    /**
     * Centrer sur l'utilisateur si le suivi est activé
     */
    useEffect(() => {
        if (isFollowingUser && userLocation && mapRef.current) {
            mapRef.current.animateToRegion({
                ...userLocation,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            });
        }
    }, [isFollowingUser, userLocation]);

    /**
     * Animer la carte UNIQUEMENT pour les changements externes (bouton localisation,
     * navigation, etc.). isUserRegionUpdate empêche la boucle :
     *   user zoom → handleRegionChange → setRegion → effet → SKIP animation
     * Sans ce guard, setRegion déclenche animateToRegion → onRegionChangeComplete
     * → boucle infinie qui bloque le zoom sur Android.
     */
    const isProgrammaticRegionChange = useRef(false);
    const isUserRegionUpdate = useRef(false);
    useEffect(() => {
        if (isUserRegionUpdate.current) {
            isUserRegionUpdate.current = false;
            return;
        }
        if (mapRef.current && region) {
            isProgrammaticRegionChange.current = true;
            mapRef.current.animateToRegion(region, 500);
            setVisibilityDelta(region.latitudeDelta);
        }
    }, [region]);

    /**
     * Animer la caméra quand le mode 3D change
     */
    useEffect(() => {
        if (mapRef.current) {
            if (is3DEnabled && isNavigating) {
                // Centrer sur la position utilisateur (priorité) sinon la région actuelle
                const center = userLocation || region;

                // Activer automatiquement le mode "Suivre l'utilisateur"
                if (!isFollowingUser) {
                    setIsFollowingUser(true);
                }

                const camera = {
                    center,
                    pitch: 45,
                    heading: 0,
                    altitude: 800,
                    zoom: 17,
                };
                
                console.log('🚀 [MapView] Centrage caméra sur position utilisateur pour navigation');
                mapRef.current.animateCamera(camera, { duration: 1000 });
            } else if (!isNavigating) {
                // Mode normal: réinitialiser la caméra si on quitte la navigation
                const camera = {
                    center: region,
                    pitch: 0,
                    heading: 0,
                    altitude: 2000,
                    zoom: region.latitudeDelta < 0.01 ? 15 : 13,
                };
                mapRef.current.animateCamera(camera, { duration: 1000 });
            }
        }
    }, [is3DEnabled, isNavigating]);

    /**
     * Suivre la position utilisateur en 3D pendant la navigation
     */
    const lastCameraAnimationTime = React.useRef(0);
    
    useEffect(() => {
        if (is3DEnabled && isNavigating && userLocation && mapRef.current) {
            const now = Date.now();
            // Throttle camera updates to once every 1000ms to avoid iOS crash
            if (now - lastCameraAnimationTime.current > 1000) {
                lastCameraAnimationTime.current = now;
                const camera = {
                    center: userLocation,
                    pitch: 45, // Inclinaison modérée
                    heading: 0,
                    altitude: 1200, // Altitude moins profonde
                    zoom: 15.5 // Zoom moins profond
                };

                mapRef.current.animateCamera(camera, { duration: 1000 });
            }
        }
    }, [userLocation, is3DEnabled, isNavigating]);

    useEffect(() => {
        if (navigationRoute) {
            console.log('🗺️ [MapView] Route de navigation reçue:', JSON.stringify({
                id: navigationRoute.id,
                polylinePoints: navigationRoute.polyline?.length,
                buildingPoints: navigationRoute.buildingCoordinates?.length,
                hasDestination: !!(navigationRoute as any).destinationCoordinates
            }));
        }
    }, [navigationRoute]);

    // ============================================================================
    // Callout automatique — bâtiment le plus proche sur l'axe caméra
    // ============================================================================

    /**
     * Calcule la distance en mètres entre deux coordonnées (formule de Haversine).
     */
    const haversineDistance = useCallback((
        lat1: number, lng1: number,
        lat2: number, lng2: number
    ): number => {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }, []);

    /**
     * Trouve le bâtiment visible le plus proche du centre de la carte
     * (= centre de la caméra = ce que l'utilisateur regarde).
     * Ouvre son callout, ferme le précédent.
     */
    const updateNearestCallout = useCallback((currentRegion: typeof region) => {
        const visibleBuildings = buildingPolygons.filter(
            (b) => currentRegion.latitudeDelta <= b.labelVisibleDelta
        );
        if (visibleBuildings.length === 0) {
            // Plus de bâtiments visibles → fermer le callout ouvert
            if (openCalloutId.current) {
                const ref = markerRefs.current.get(openCalloutId.current);
                ref?.hideCallout();
                openCalloutId.current = null;
            }
            return;
        }

        // Centre de la caméra = centre de la région affichée
        const camLat = currentRegion.latitude;
        const camLng = currentRegion.longitude;

        // Trouver le bâtiment le plus proche du centre caméra
        let nearestId = visibleBuildings[0].id;
        let nearestDist = haversineDistance(
            camLat, camLng,
            visibleBuildings[0].center.latitude,
            visibleBuildings[0].center.longitude
        );
        for (const b of visibleBuildings) {
            const d = haversineDistance(camLat, camLng, b.center.latitude, b.center.longitude);
            if (d < nearestDist) {
                nearestDist = d;
                nearestId = b.id;
            }
        }

        // Si c'est déjà le callout ouvert, rien à faire
        if (nearestId === openCalloutId.current) return;

        // Fermer l'ancien callout
        if (openCalloutId.current && openCalloutId.current !== nearestId) {
            const oldRef = markerRefs.current.get(openCalloutId.current);
            oldRef?.hideCallout();
        }

        // Ouvrir le nouveau callout
        const newRef = markerRefs.current.get(nearestId);
        if (newRef) {
            newRef.showCallout();
            openCalloutId.current = nearestId;
        }
    }, [buildingPolygons, haversineDistance]);

    // ============================================================================
    // Handlers
    // ============================================================================

    /**
     * Gère le changement de région — NE PAS rappeler setRegion si c'est
     * un changement programmatique (animateToRegion) pour éviter la boucle.
     * En mode 3D, on ignore les changements de latitudeDelta (rotation/pitch
     * fausse la valeur) pour éviter la disparition des bâtiments.
     */
    const handleRegionChange = (newRegion: typeof region) => {
        if (is3DEnabled && isNavigating) return;
        if (isProgrammaticRegionChange.current) {
            isProgrammaticRegionChange.current = false;
            return;
        }
        setVisibilityDelta(newRegion.latitudeDelta);
        isUserRegionUpdate.current = true;
        setRegion(newRegion);
    };

    const handleRegionChangeContinuous = (newRegion: typeof region) => {
        setVisibilityDelta(newRegion.latitudeDelta);
        if (openCalloutId.current) {
            markerRefs.current.get(openCalloutId.current)?.hideCallout();
            openCalloutId.current = null;
        }
    };

    /**
     * Gère la sélection d'un marqueur
     */
    const handleMarkerPress = (markerId: string) => {
        setSelectedMarkerId(markerId);

        // ── Log marker data ──────────────────────────────────────────────────
        const building = buildingPolygons.find((b) => b.amodiatairId === markerId);
        const amod = (amodiataires as any[]).find((a: any) => a.id === markerId);

        console.log('\n╔══════════════════════════════════════════════════════════╗');
        console.log('║                  MARKER SÉLECTIONNÉ                     ║');
        console.log('╚══════════════════════════════════════════════════════════╝');
        console.log(`  markerId          : ${markerId}`);

        if (building) {
            console.log('──────────────────────────────────────────────────────────');
            console.log('  BÂTIMENT');
            console.log(`    id              : ${building.id}`);
            console.log(`    nom             : ${building.nom}`);
            console.log(`    amodiatairId    : ${building.amodiatairId}`);
            console.log(`    amodiataireName : ${building.amodiataireName}`);
            console.log(`    center          : lat=${building.center.latitude.toFixed(6)}  lng=${building.center.longitude.toFixed(6)}`);
            console.log(`    coordonnées     : ${building.coordinates.length} point(s)`);
            console.log(`    labelDelta      : ${building.labelVisibleDelta}`);
        } else {
            console.log('  ⚠ Aucun bâtiment trouvé pour ce markerId');
        }

        if (amod) {
            console.log('──────────────────────────────────────────────────────────');
            console.log('  AMODIATAIRE (objet complet)');
            console.log(JSON.stringify(amod, null, 2)
                .split('\n')
                .map((l: string) => '  ' + l)
                .join('\n'));
        } else {
            console.log('  ⚠ Aucun amodiataire trouvé pour ce markerId');
        }

        console.log('══════════════════════════════════════════════════════════\n');
    };

    const handleRouteMarkerPress = (label: string, data: Record<string, any>) => {
        console.log('\n╔══════════════════════════════════════════════════════════╗');
        console.log(`║  MARKER ROUTE — ${label.padEnd(42)}║`);
        console.log('╚══════════════════════════════════════════════════════════╝');
        Object.entries(data).forEach(([k, v]) => {
            const val = typeof v === 'object' ? JSON.stringify(v) : String(v ?? '–');
            console.log(`  ${k.padEnd(20)}: ${val}`);
        });
        console.log('══════════════════════════════════════════════════════════\n');
    };

    // Bâtiments visibles avec leur bitmap — recalculé quand bitmapVersion change
    // Utilise la clé par ID pour correspondre à ce que génère BitmapLabelFactory
    const visibleBuildingMarkers = React.useMemo(() =>
        buildingPolygons
            .filter((b) => visibilityDelta <= b.labelVisibleDelta)
            .map((b) => ({ ...b, bitmapUri: getCachedBitmap(buildLabelKeyById(b.amodiatairId, false)) }))
            .filter((b): b is typeof b & { bitmapUri: string } => b.bitmapUri !== null),
        [buildingPolygons, visibilityDelta, bitmapVersion]
    );

    // ============================================================================
    // Rendu
    // ============================================================================

    if (isLoadingAmodiataires || isLoadingZone) {
        return (
            <View className="flex-1 items-center justify-center bg-neutral-100 dark:bg-neutral-900">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                    {t('map.loading_markers')}
                </Text>
            </View>
        );
    }

    return (
        <View className="flex-1">
            <MapView
                ref={mapRef}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                style={StyleSheet.absoluteFillObject}
                initialRegion={region}
                onRegionChangeComplete={handleRegionChange}
                onRegionChange={handleRegionChangeContinuous}
                showsUserLocation={showsUserLocation}
                showsMyLocationButton={false}
                customMapStyle={customStyle}
                mapType={effectiveMapType}
                className="flex-1"
                onMapReady={() => console.log('🗺️ Carte prête')}
                loadingEnabled={true}
                loadingIndicatorColor={colors.primary}
                loadingBackgroundColor="#FFFFFF"
                // Propriétés 3D et POI
                pitchEnabled={true}
                rotateEnabled={true}
                showsPointsOfInterest={true}
                showsBuildings={true}
                showsIndoors={true}
            >
                {/* Zone de Délimitation */}
                {showsZoneBounds && zoneBounds?.polygonCoordinates && (
                    <Polygon
                        coordinates={zoneBounds.polygonCoordinates.map(coord => ({
                            latitude: coord.lat,
                            longitude: coord.lng,
                        }))}
                        strokeColor={colors.primary}
                        strokeWidth={2}
                        fillColor={`${colors.primary}20`}
                    />
                )}

                {/* Routes internes de la foire — polyligne + label centré au milieu.
                    Filtre zoom : polylignes et labels n'apparaissent qu'à partir de leur seuil. */}
                {routeDisplayData
                    .filter((route) => visibilityDelta <= route.polylineVisibleDelta)
                    .map((route) => {
                        const isPrimary = route.roadType === 'primary' || route.roadType === 'main';
                        const isMaintenance = route.status === 'maintenance';
                        const strokeColor = isMaintenance ? '#F59E0B' : isPrimary ? '#3D85C8' : '#7B9DB7';
                        return (
                            <Polyline
                                key={`route-line-${route.id}`}
                                coordinates={route.polyline}
                                strokeColor={strokeColor}
                                strokeWidth={isPrimary ? 3 : 2}
                                lineJoin="round"
                                lineCap="round"
                            />
                        );
                    })}
                {visibleRouteMarkers.map((route) => (
                    <Marker
                        key={`route-label-${route.id}`}
                        coordinate={route.midpoint}
                        image={{ uri: route.bitmapUri }}
                        anchor={{ x: 0.5, y: 0.5 }}
                        tracksViewChanges={false}
                        rotation={route.labelAngle}
                    />
                ))}

                {/* Bâtiments — markers natifs avec bitmap pré-généré par BitmapLabelFactory.
                    Suivent la carte nativement, zéro pointForCoordinate, zéro tracksViewChanges.
                    N'apparaissent qu'une fois leur bitmap disponible dans le cache. */}
                {visibleBuildingMarkers.map((building) => (
                    <Marker
                        key={`building-${building.id}`}
                        ref={(ref) => {
                            if (ref) markerRefs.current.set(building.id, ref as unknown as MapMarkerType);
                            else markerRefs.current.delete(building.id);
                        }}
                        coordinate={building.center}
                        image={{ uri: building.bitmapUri }}
                        anchor={{ x: 0.5, y: 1 }}
                        tracksViewChanges={false}
                        onPress={() => handleMarkerPress(building.amodiatairId)}
                    />
                ))}

                {/* Polyline de Navigation */}
                {(() => {
                    if (!navigationRoute) return null;

                    // Support pour les segments hybrides (Google + Backend + Internal)
                    const segments = navigationRoute.segments || [
                        { points: navigationRoute.polyline, type: 'google' }
                    ];

                    return (
                        <>
                            {segments.map((segment, index) => {
                                if (!segment.points || segment.points.length === 0) return null;
                                
                                const type = segment.type;
                                let strokeColor = '#7C3AED'; // Violet
                                let strokeWidth = 4;

                                if (type === 'backend') {
                                    strokeColor = '#7C3AED'; // Violet
                                    strokeWidth = 6;
                                } else if (type === 'internal') {
                                    strokeColor = '#7C3AED'; // Violet
                                    strokeWidth = 6;
                                }

                                return (
                                    <React.Fragment key={`nav-segment-${index}`}>
                                        <Polyline
                                            coordinates={segment.points}
                                            strokeColor={strokeColor}
                                            strokeWidth={strokeWidth}
                                            lineJoin="round"
                                            lineCap="round"
                                        />
                                        {/* Label pour le nom de la route (backend ou internal) */}
                                        {(type === 'backend' || type === 'internal') && segment.name && segment.points.length > 0 && (
                                            <Marker
                                                coordinate={segment.points[Math.floor(segment.points.length / 2)]}
                                                tracksViewChanges={false}
                                                anchor={{ x: 0.5, y: 0.5 }}
                                            >
                                                <View style={{
                                                    width: moderateScale(100),
                                                    height: moderateScale(100),
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}>
                                                    <View style={{
                                                        backgroundColor: strokeColor,
                                                        paddingHorizontal: moderateScale(8),
                                                        paddingVertical: moderateScale(4),
                                                        borderRadius: moderateScale(20),
                                                        borderWidth: 1,
                                                        borderColor: '#ffffff',
                                                    }}>
                                                        <Text style={{
                                                            fontSize: moderateScale(10),
                                                            fontWeight: 'bold',
                                                            color: '#ffffff',
                                                        }}>
                                                            {segment.name}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </Marker>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            
                            {/* Marqueur de destination (Point exact de l'amodiataire) */}
                            {(navigationRoute.destinationCoordinates || (navigationRoute.polyline && navigationRoute.polyline.length > 0)) && (
                                <Marker
                                    coordinate={navigationRoute.destinationCoordinates || navigationRoute.polyline[navigationRoute.polyline.length - 1]}
                                    title="Destination"
                                    pinColor="#EF4444"
                                    onPress={() => handleRouteMarkerPress('DESTINATION NAVIGATION', {
                                        type: 'navigation_destination',
                                        coordinate: navigationRoute.destinationCoordinates || navigationRoute.polyline[navigationRoute.polyline.length - 1],
                                        segments: navigationRoute.segments?.length ?? 0,
                                        polylinePoints: navigationRoute.polyline?.length ?? 0,
                                        hasBuildingCoords: !!(navigationRoute.buildingCoordinates?.length),
                                    })}
                                />
                            )}

                            {/* Tracé du bâtiment de destination */}
                            {navigationRoute.buildingCoordinates && navigationRoute.buildingCoordinates.length > 0 && (
                                <Polygon
                                    coordinates={navigationRoute.buildingCoordinates}
                                    strokeColor="#F59E0B" // Orange pour correspondre au style Navipad
                                    fillColor="rgba(245, 158, 11, 0.3)" // Orange semi-transparent
                                    strokeWidth={2}
                                />
                            )}
                        </>
                    );
                })()}

                {/* Polyline du Calculateur de Distance */}
                {distanceRoute && distanceRoute.polyline && distanceRoute.polyline.length > 0 && (
                    <>
                        {/* Tracé du bâtiment d'origine */}
                        {distanceRoute.originMarker?.polygonCoordinates && distanceRoute.originMarker.polygonCoordinates.length > 0 && (
                            <Polygon
                                coordinates={distanceRoute.originMarker.polygonCoordinates.filter(c => c && typeof c.latitude === 'number' && typeof c.longitude === 'number')}
                                strokeColor="#F59E0B"
                                fillColor="rgba(245, 158, 11, 0.3)"
                                strokeWidth={2}
                            />
                        )}

                        {/* Tracé du bâtiment de destination */}
                        {distanceRoute.destinationMarker?.polygonCoordinates && distanceRoute.destinationMarker.polygonCoordinates.length > 0 && (
                            <Polygon
                                coordinates={distanceRoute.destinationMarker.polygonCoordinates.filter(c => c && typeof c.latitude === 'number' && typeof c.longitude === 'number')}
                                strokeColor="#F59E0B"
                                fillColor="rgba(245, 158, 11, 0.3)"
                                strokeWidth={2}
                            />
                        )}

                        {/* Rendu des segments du calculateur si disponibles, sinon polyline unique */}
                        {distanceRoute.segments ? (
                            distanceRoute.segments.map((segment, index) => {
                                if (!segment.points || segment.points.length === 0) return null;
                                
                                let strokeColor = '#7C3AED'; // Violet par défaut
                                if (segment.type === 'backend') strokeColor = '#F59E0B';
                                else if (segment.type === 'internal') strokeColor = '#3B82F6';

                                return (
                                    <Polyline
                                        key={`dist-segment-${index}`}
                                        coordinates={segment.points}
                                        strokeColor={strokeColor}
                                        strokeWidth={5}
                                        lineDashPattern={segment.type === 'google' ? [1] : undefined}
                                    />
                                );
                            })
                        ) : (
                            <Polyline
                                coordinates={distanceRoute.polyline}
                                strokeColor="#7C3AED"
                                strokeWidth={5}
                                lineDashPattern={[1]}
                            />
                        )}
                        {/* Marqueur d'origine */}
                        <Marker
                                coordinate={distanceRoute.originMarker || distanceRoute.polyline[0]}
                                title={distanceRoute.originMarker?.name || 'Départ'}
                                tracksViewChanges={false}
                                onPress={() => handleRouteMarkerPress('ORIGINE (calculateur distance)', {
                                    type: 'distance_origin',
                                    name: distanceRoute.originMarker?.name ?? '–',
                                    coordinate: distanceRoute.originMarker || distanceRoute.polyline[0],
                                    hasPolygon: !!(distanceRoute.originMarker?.polygonCoordinates?.length),
                                    polygonPoints: distanceRoute.originMarker?.polygonCoordinates?.length ?? 0,
                                })}
                        >
                            <View style={{
                                width: moderateScale(100),
                                height: moderateScale(100),
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingTop: moderateScale(8),
                            }}>
                                <View style={{
                                    backgroundColor: '#10B981',
                                    paddingHorizontal: moderateScale(8),
                                    paddingVertical: moderateScale(4),
                                    borderRadius: moderateScale(6),
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: moderateScale(2) },
                                    shadowOpacity: 0.2,
                                    shadowRadius: moderateScale(3),
                                    elevation: 4,
                                }}>
                                    <Text style={{
                                        color: '#ffffff',
                                        fontWeight: 'bold',
                                        fontSize: moderateScale(10),
                                    }} numberOfLines={1}>
                                        {distanceRoute.originMarker?.name || 'A'}
                                    </Text>
                                </View>
                                <View style={{
                                    width: moderateScale(12),
                                    height: moderateScale(12),
                                    borderRadius: moderateScale(6),
                                    backgroundColor: '#10B981',
                                    borderWidth: moderateScale(2),
                                    borderColor: '#ffffff',
                                    marginTop: moderateScale(4),
                                }} />
                            </View>
                        </Marker>
                        {/* Marqueur de destination */}
                        <Marker
                                coordinate={distanceRoute.destinationMarker || distanceRoute.polyline[distanceRoute.polyline.length - 1]}
                                title={distanceRoute.destinationMarker?.name || 'Arrivée'}
                                tracksViewChanges={false}
                                onPress={() => handleRouteMarkerPress('DESTINATION (calculateur distance)', {
                                    type: 'distance_destination',
                                    name: distanceRoute.destinationMarker?.name ?? '–',
                                    coordinate: distanceRoute.destinationMarker || distanceRoute.polyline[distanceRoute.polyline.length - 1],
                                    hasPolygon: !!(distanceRoute.destinationMarker?.polygonCoordinates?.length),
                                    polygonPoints: distanceRoute.destinationMarker?.polygonCoordinates?.length ?? 0,
                                    distance: distanceRoute.distance,
                                })}
                        >
                            <View style={{
                                width: moderateScale(100),
                                height: moderateScale(100),
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingTop: moderateScale(8),
                            }}>
                                <View style={{
                                    backgroundColor: '#EF4444',
                                    paddingHorizontal: moderateScale(8),
                                    paddingVertical: moderateScale(4),
                                    borderRadius: moderateScale(6),
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: moderateScale(2) },
                                    shadowOpacity: 0.2,
                                    shadowRadius: moderateScale(3),
                                    elevation: 4,
                                }}>
                                    <Text style={{
                                        color: '#ffffff',
                                        fontWeight: 'bold',
                                        fontSize: moderateScale(10),
                                    }} numberOfLines={1}>
                                        {distanceRoute.destinationMarker?.name || 'B'}
                                    </Text>
                                </View>
                                <View style={{
                                    width: moderateScale(12),
                                    height: moderateScale(12),
                                    borderRadius: moderateScale(6),
                                    backgroundColor: '#EF4444',
                                    borderWidth: moderateScale(2),
                                    borderColor: '#ffffff',
                                    marginTop: moderateScale(4),
                                }} />
                            </View>
                        </Marker>
                        {/* Label distance au milieu */}
                        <Marker
                                coordinate={distanceRoute.polyline[Math.floor(distanceRoute.polyline.length / 2)]}
                                tracksViewChanges={false}
                                anchor={{ x: 0.5, y: 0.5 }}
                        >
                            <View style={{
                                width: moderateScale(100),
                                height: moderateScale(100),
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <View style={{
                                    backgroundColor: '#ffffff',
                                    paddingHorizontal: moderateScale(12),
                                    paddingVertical: moderateScale(6),
                                    borderRadius: moderateScale(20),
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: moderateScale(2) },
                                    shadowOpacity: 0.15,
                                    shadowRadius: moderateScale(4),
                                    elevation: 5,
                                    borderWidth: 1,
                                    borderColor: '#10B981',
                                }}>
                                    <Text style={{
                                        color: '#059669',
                                        fontWeight: 'bold',
                                        fontSize: moderateScale(12),
                                    }}>
                                        {distanceRoute.distance}
                                    </Text>
                                </View>
                            </View>
                        </Marker>
                    </>
                )}
            </MapView>

            {/* Phase 1 — Labels bâtiments : affichés à l'écran (coin bas-gauche), capturés,
                puis retirés individuellement. Le composant est DÉMONTÉ quand tous sont faits
                pour libérer le GPU avant que la phase routes commence. */}
            {!buildingBitmapsDone && (
                <BitmapLabelFactory
                    templates={buildingTemplates}
                    onBitmapReady={() => setBitmapVersion(v => v + 1)}
                    onAllDone={() => {
                        setBuildingBitmapsDone(true);
                        // 150 ms de délai : laisse le GPU vider sa queue de compositing
                        // avant de monter RouteNameLabelFactory (séparation GPU)
                        setTimeout(() => setRouteFactoryActive(true), 150);
                    }}
                />
            )}
            {/* Phase 2 — Labels routes : démarrent 150 ms après démontage de BitmapLabelFactory,
                affichés à l'écran (coin bas-droit), capturés, puis retirés individuellement. */}
            {routeFactoryActive && (
                <RouteNameLabelFactory
                    templates={routeTemplates}
                    onBitmapReady={() => setRouteBitmapVersion(v => v + 1)}
                />
            )}

        </View>
    );
}
