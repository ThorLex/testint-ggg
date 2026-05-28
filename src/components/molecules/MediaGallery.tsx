/**
 * Composant MediaGallery (Molecule)
 * 
 * Affiche une galerie de médias dans une grille responsive (2-3 colonnes).
 * Utilise FlatList pour un rendu efficace et affiche un état vide quand aucun média n'existe.
 * 
 * Requirements: 3.1, 3.2, 3.4, 3.5
 * 
 * @module components/molecules/MediaGallery
 */

import React from 'react';
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MediaItem } from './MediaItem';
import type { MediaItem as MediaItemType } from '@/types/api';

// ============================================================================
// Props
// ============================================================================

export interface MediaGalleryProps {
    /** Liste des médias à afficher */
    media: MediaItemType[];
    /** État de chargement */
    loading?: boolean;
    /** Mode carousel (défilement horizontal) */
    carousel?: boolean;
    /** Callback quand un média est sélectionné */
    onMediaPress?: (item: MediaItemType) => void;
}

// ============================================================================
// Composant
// ============================================================================

export function MediaGallery({ media, loading = false, carousel = false, onMediaPress }: MediaGalleryProps) {
    const { t } = useTranslation();
    const { width } = useWindowDimensions();
    
    // Calculer le nombre de colonnes en fonction de la largeur de l'écran
    // 2 colonnes pour petits écrans, 3 pour tablettes/grands écrans
    const numColumns = width >= 768 ? 3 : 2;
    
    // Calculer la largeur des items avec espacement
    const spacing = 12; // Espacement entre les items
    const itemWidth = (width - (numColumns + 1) * spacing) / numColumns;

    // ============================================================================
    // Tri des médias par date (plus récent en premier)
    // Requirement 3.4: Display images in reverse chronological order
    // ============================================================================
    
    const sortedMedia = React.useMemo(() => {
        return [...media].sort((a, b) => {
            const dateA = new Date(a.uploadedAt).getTime();
            const dateB = new Date(b.uploadedAt).getTime();
            return dateB - dateA; // Ordre décroissant (plus récent en premier)
        });
    }, [media]);

    // ============================================================================
    // Rendu d'un item
    // ============================================================================

    const renderItem = ({ item }: { item: MediaItemType }) => {
        if (carousel) {
            // Mode carousel: items plus grands avec largeur fixe
            return (
                <View 
                    style={{ width: width * 0.75, marginRight: spacing }}
                    className="px-1"
                >
                    <MediaItem 
                        item={item}
                        onPress={onMediaPress}
                        accessibilityLabel={`${item.type === 'video' ? 'Vidéo' : 'Photo'} uploadée le ${new Date(item.uploadedAt).toLocaleDateString()}`}
                    />
                </View>
            );
        }
        
        // Mode grille: items en colonnes
        return (
            <View 
                style={{ width: itemWidth, marginBottom: spacing }}
                className="px-1"
            >
                <MediaItem 
                    item={item}
                    onPress={onMediaPress}
                    accessibilityLabel={`${item.type === 'video' ? 'Vidéo' : 'Photo'} uploadée le ${new Date(item.uploadedAt).toLocaleDateString()}`}
                />
            </View>
        );
    };

    // ============================================================================
    // État vide
    // Requirement 3.5: Show empty state when no media exists
    // ============================================================================

    const renderEmptyState = () => {
        if (loading) {
            return (
                <View 
                    className="py-8 items-center justify-center"
                    accessibilityRole="progressbar"
                    accessibilityLabel={t('common.loading', 'Chargement...')}
                >
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text className="text-gray-500 dark:text-gray-400 mt-4">
                        {t('common.loading', 'Chargement...')}
                    </Text>
                </View>
            );
        }

        return (
            <View 
                className="py-8 items-center justify-center"
                accessibilityLabel={t('media.noMedia', 'Aucun média')}
            >
                <View className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full items-center justify-center mb-4">
                    <View className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded" />
                </View>
                <Text className="text-gray-500 dark:text-gray-400 text-center">
                    {t('media.noMedia', 'Aucun média')}
                </Text>
            </View>
        );
    };

    // ============================================================================
    // Rendu principal
    // ============================================================================

    return (
        <View 
            className="mt-4"
            accessibilityLabel={carousel ? "Carousel de médias" : "Galerie de photos"}
        >
            {sortedMedia.length === 0 ? (
                renderEmptyState()
            ) : carousel ? (
                // Mode carousel: défilement horizontal
                <FlatList
                    data={sortedMedia}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={width * 0.75 + spacing}
                    decelerationRate="fast"
                    contentContainerStyle={{
                        paddingHorizontal: spacing,
                    }}
                    accessibilityLabel={`${sortedMedia.length} média${sortedMedia.length > 1 ? 's' : ''} dans le carousel`}
                />
            ) : (
                // Mode grille: colonnes verticales
                <FlatList
                    data={sortedMedia}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    numColumns={numColumns}
                    scrollEnabled={false}
                    contentContainerStyle={{
                        paddingHorizontal: spacing / 2,
                    }}
                    columnWrapperStyle={{
                        justifyContent: 'flex-start',
                    }}
                    accessibilityLabel={`${sortedMedia.length} photo${sortedMedia.length > 1 ? 's' : ''} dans la galerie`}
                />
            )}
        </View>
    );
}
