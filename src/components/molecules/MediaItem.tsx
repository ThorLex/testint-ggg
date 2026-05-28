/**
 * Composant MediaItem (Molecule)
 * 
 * Affiche un élément média individuel dans la galerie d'upload.
 * Gère les états de chargement et affiche les images avec style arrondi et ombre.
 * 
 * @module components/molecules/MediaItem
 */

import React, { useState } from 'react';
import {
    View,
    Image,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { PlayIcon } from 'react-native-heroicons/solid';
import type { MediaItem as MediaItemType } from '@/types/api';

// ============================================================================
// Props
// ============================================================================

export interface MediaItemProps {
    /** Item média à afficher */
    item: MediaItemType;
    /** Callback lors du tap (optionnel) */
    onPress?: (item: MediaItemType) => void;
    /** Label d'accessibilité (optionnel) */
    accessibilityLabel?: string;
}

// ============================================================================
// Composant
// ============================================================================

export function MediaItem({ item, onPress, accessibilityLabel }: MediaItemProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Utiliser le thumbnail si disponible, sinon l'URL complète
    const imageUrl = item.thumbnailUrl || item.thumbnail || item.url;
    const isVideo = item.type === 'video';

    // Label d'accessibilité par défaut
    const defaultAccessibilityLabel = `${isVideo ? 'Vidéo' : 'Photo'} uploadée le ${new Date(item.uploadedAt).toLocaleDateString()}`;
    const finalAccessibilityLabel = accessibilityLabel || defaultAccessibilityLabel;

    // ============================================================================
    // Gestionnaires d'événements
    // ============================================================================

    const handlePress = () => {
        if (onPress) {
            onPress(item);
        }
    };

    // ============================================================================
    // Gestionnaires d'événements
    // ============================================================================

    const handleLoadStart = () => {
        setIsLoading(true);
        setHasError(false);
    };

    const handleLoadEnd = () => {
        setIsLoading(false);
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    // ============================================================================
    // Rendu principal
    // ============================================================================

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.8}
            disabled={!onPress}
        >
            <View 
                className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-sm"
                accessibilityRole={isVideo ? "button" : "image"}
                accessibilityLabel={finalAccessibilityLabel}
            >
                {/* Image ou Thumbnail de vidéo */}
                {!hasError && !isVideo && (
                    <Image
                        source={{ uri: imageUrl }}
                        className="w-full h-full"
                        resizeMode="cover"
                        onLoadStart={handleLoadStart}
                        onLoadEnd={handleLoadEnd}
                        onError={handleError}
                        accessible={false}
                    />
                )}

                {/* Vidéo */}
                {!hasError && isVideo && (
                    <>
                        {/* Thumbnail de la vidéo ou fond gris */}
                        {imageUrl ? (
                            <Image
                                source={{ uri: imageUrl }}
                                className="w-full h-full"
                                resizeMode="cover"
                                onLoadStart={handleLoadStart}
                                onLoadEnd={handleLoadEnd}
                                onError={handleError}
                                accessible={false}
                            />
                        ) : (
                            <View className="w-full h-full bg-gray-300 dark:bg-gray-600 items-center justify-center">
                                <PlayIcon size={48} color="#9CA3AF" />
                            </View>
                        )}
                        
                        {/* Icône Play */}
                        <View className="absolute inset-0 items-center justify-center">
                            <View className="w-16 h-16 bg-black/50 rounded-full items-center justify-center">
                                <PlayIcon size={32} color="white" />
                            </View>
                        </View>
                    </>
                )}

                {/* Placeholder de chargement */}
                {isLoading && (
                    <View 
                        className="absolute inset-0 items-center justify-center bg-gray-200 dark:bg-gray-700"
                        accessibilityLabel="Chargement du média en cours"
                    >
                        <ActivityIndicator size="small" color="#10B981" />
                    </View>
                )}

                {/* État d'erreur */}
                {hasError && (
                    <View 
                        className="absolute inset-0 items-center justify-center bg-gray-200 dark:bg-gray-700"
                        accessibilityLabel="Erreur de chargement du média"
                    >
                        <View className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full items-center justify-center">
                            <View className="w-6 h-6 bg-gray-400 dark:bg-gray-500 rounded" />
                        </View>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}
