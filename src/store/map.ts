/**
 * Store Zustand pour la carte et les marqueurs
 * 
 * Ce fichier gère l'état de la carte incluant :
 * - Région visible
 * - Marqueurs (amodiataires)
 * - Sélection de marqueur
 * - Suivi de l'utilisateur
 * 
 * @module store/map
 */

import { create } from 'zustand';
import type { MapRegion, MapMarker } from '@/types';

// ============================================================================
// Interface du Store
// ============================================================================

/**
 * État du store de la carte
 */
interface MapState {
    // Région de la carte
    region: MapRegion;
    setRegion: (region: MapRegion) => void;

    // Marqueurs
    markers: MapMarker[];
    setMarkers: (markers: MapMarker[]) => void;
    addMarker: (marker: MapMarker) => void;
    removeMarker: (id: string) => void;
    clearMarkers: () => void;

    // Sélection
    selectedMarkerId: string | null;
    setSelectedMarkerId: (id: string | null) => void;

    // Suivi utilisateur
    isFollowingUser: boolean;
    setIsFollowingUser: (value: boolean) => void;

    // Affichage de la position utilisateur
    showsUserLocation: boolean;
    setShowsUserLocation: (value: boolean) => void;

    // Zone de délimitation
    showsZoneBounds: boolean;
    setShowsZoneBounds: (value: boolean) => void;
}

// ============================================================================
// Région par Défaut (Centré sur Douala, Cameroun - Zone de service Navipad)
// ============================================================================

const DEFAULT_REGION: MapRegion = {
    latitude: 4.0371141216993625, // Douala, Cameroun
    longitude: 9.684555417740562,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
};

// ============================================================================
// Store Zustand
// ============================================================================

/**
 * Store de la carte
 */
export const useMapStore = create<MapState>((set) => ({
    // ============================================================================
    // État Initial
    // ============================================================================

    region: DEFAULT_REGION,
    markers: [],
    selectedMarkerId: null,
    isFollowingUser: false,
    showsUserLocation: true,
    showsZoneBounds: true,

    // ============================================================================
    // Actions Région
    // ============================================================================

    /**
     * Définit la région visible de la carte
     */
    setRegion: (region: MapRegion) => {
        set({ region });
    },

    // ============================================================================
    // Actions Marqueurs
    // ============================================================================

    /**
     * Définit tous les marqueurs
     */
    setMarkers: (markers: MapMarker[]) => {
        set({ markers });
        console.log(`📍 ${markers.length} marqueurs chargés`);
    },

    /**
     * Ajoute un marqueur
     */
    addMarker: (marker: MapMarker) => {
        set((state) => ({
            markers: [...state.markers, marker],
        }));
    },

    /**
     * Supprime un marqueur par ID
     */
    removeMarker: (id: string) => {
        set((state) => ({
            markers: state.markers.filter((m) => m.id !== id),
        }));
    },

    /**
     * Efface tous les marqueurs
     */
    clearMarkers: () => {
        set({ markers: [] });
        console.log('🗑️ Marqueurs effacés');
    },

    // ============================================================================
    // Actions Sélection
    // ============================================================================

    /**
     * Sélectionne un marqueur
     */
    setSelectedMarkerId: (id: string | null) => {
        set({ selectedMarkerId: id });

        if (id) {
            console.log('📌 Marqueur sélectionné:', id);
        }
    },

    // ============================================================================
    // Actions Suivi Utilisateur
    // ============================================================================

    /**
     * Active/désactive le suivi de l'utilisateur
     */
    setIsFollowingUser: (value: boolean) => {
        set({ isFollowingUser: value });

        if (value) {
            console.log('👤 Suivi utilisateur activé');
        } else {
            console.log('👤 Suivi utilisateur désactivé');
        }
    },

    /**
     * Affiche/masque la position de l'utilisateur
     */
    setShowsUserLocation: (value: boolean) => {
        set({ showsUserLocation: value });
    },

    /**
     * Affiche/masque la zone de délimitation
     */
    setShowsZoneBounds: (value: boolean) => {
        set({ showsZoneBounds: value });
    },
}));

// ============================================================================
// Sélecteurs
// ============================================================================

/**
 * Sélectionne uniquement la région
 */
export const useMapRegion = () => useMapStore((state) => state.region);

/**
 * Sélectionne uniquement les marqueurs
 */
export const useMapMarkers = () => useMapStore((state) => state.markers);

/**
 * Sélectionne le marqueur sélectionné
 */
export const useSelectedMarker = () => {
    const markers = useMapStore((state) => state.markers);
    const selectedId = useMapStore((state) => state.selectedMarkerId);

    return markers.find((m) => m.id === selectedId) || null;
};

/**
 * Sélectionne si on suit l'utilisateur
 */
export const useIsFollowingUser = () => useMapStore((state) => state.isFollowingUser);
