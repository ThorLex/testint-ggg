/**
 * Composant MediaGrid (Molecule)
 * 
 * Grille d'affichage des médias avec prévisualisation et actions.
 * 
 * @module components/molecules/MediaGrid
 */

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    TrashIcon,
    VideoCameraIcon,
    DocumentIcon,
    EyeIcon,
    PlayIcon,
} from 'react-native-heroicons/outline';
import type { MediaType } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// Props
// ============================================================================

export interface MediaGridProps {
    /** Type de média */
    mediaType: MediaType;
    /** URLs des médias */
    mediaUrls: string[];
    /** Noms des fichiers (optionnel) */
    fileNames?: string[];
    /** Callback de suppression */
    onDelete?: (index: number) => void;
    /** Callback de visualisation */
    onView?: (url: string, index: number, fileName?: string) => void;
    /** Nombre de colonnes */
    columns?: number;
}

// ============================================================================
// Composant
// ============================================================================

export function MediaGrid({ 
    mediaType, 
    mediaUrls,
    fileNames,
    onDelete, 
    onView,
    columns = 2 
}: MediaGridProps) {
    const { t } = useTranslation();
    
    // Calculer la taille des éléments
    const itemMargin = 8;
    const containerPadding = 16;
    const itemWidth = (SCREEN_WIDTH - (containerPadding * 2) - (itemMargin * (columns - 1))) / columns;
    const itemHeight = mediaType === 'document' ? 80 : itemWidth;

    // ============================================================================
    // Rendu des éléments
    // ============================================================================

    const renderPhoto = (url: string, index: number) => (
        <View 
            key={`photo-${index}`} 
            className="relative rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700"
            style={{ width: itemWidth, height: itemHeight, marginRight: index % columns !== columns - 1 ? itemMargin : 0, marginBottom: itemMargin }}
        >
            <Image 
                source={{ uri: url }} 
                className="w-full h-full" 
                resizeMode="cover"
                onError={(error) => {
                    console.warn('Erreur chargement image:', error);
                }}
            />
            
            {/* Overlay avec actions */}
            <View className="absolute inset-0 bg-black/0">
                <View className="absolute top-2 right-2 flex-row">
                    {onView && (
                        <TouchableOpacity
                            onPress={() => onView(url, index, fileNames?.[index])}
                            className="w-8 h-8 bg-white/90 rounded-full items-center justify-center mr-2 shadow-sm"
                        >
                            <EyeIcon size={16} color="#374151" />
                        </TouchableOpacity>
                    )}
                    {onDelete && (
                        <TouchableOpacity
                            onPress={() => onDelete(index)}
                            className="w-8 h-8 bg-red-500 rounded-full items-center justify-center shadow-sm"
                        >
                            <TrashIcon size={16} color="white" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );

    const renderVideo = (url: string, index: number) => (
        <View 
            key={`video-${index}`} 
            className="relative rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700"
            style={{ width: itemWidth, height: itemHeight, marginRight: index % columns !== columns - 1 ? itemMargin : 0, marginBottom: itemMargin }}
        >
            {/* Essayer d'afficher une thumbnail de la vidéo ou un placeholder */}
            <View className="w-full h-full items-center justify-center bg-gray-800">
                {/* Icône de lecture au centre */}
                <View className="absolute inset-0 items-center justify-center">
                    <View className="w-12 h-12 bg-white/90 rounded-full items-center justify-center">
                        <PlayIcon size={20} color="#374151" />
                    </View>
                </View>
                
                {/* Icône vidéo en bas à gauche */}
                <View className="absolute bottom-2 left-2">
                    <View className="bg-black/70 rounded px-2 py-1 flex-row items-center">
                        <VideoCameraIcon size={12} color="white" />
                        <Text className="text-white text-xs ml-1">Vidéo</Text>
                    </View>
                </View>
            </View>
            
            {/* Overlay avec actions */}
            <View className="absolute inset-0">
                <View className="absolute top-2 right-2 flex-row">
                    {onView && (
                        <TouchableOpacity
                            onPress={() => onView(url, index, fileNames?.[index])}
                            className="w-8 h-8 bg-white/90 rounded-full items-center justify-center mr-2 shadow-sm"
                        >
                            <PlayIcon size={16} color="#374151" />
                        </TouchableOpacity>
                    )}
                    {onDelete && (
                        <TouchableOpacity
                            onPress={() => onDelete(index)}
                            className="w-8 h-8 bg-red-500 rounded-full items-center justify-center shadow-sm"
                        >
                            <TrashIcon size={16} color="white" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );

    const renderDocument = (url: string, index: number) => (
        <View 
            key={`document-${index}`} 
            className="relative bg-gray-100 dark:bg-gray-700 rounded-xl p-4 flex-row items-center mb-3"
        >
            <View className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg items-center justify-center">
                <DocumentIcon size={24} color="#10B981" />
            </View>
            
            <View className="flex-1 ml-3">
                <Text className="text-gray-900 dark:text-white font-medium" numberOfLines={1}>
                    {fileNames?.[index] || `Document ${index + 1}`}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                    PDF, DOC, PPT, etc.
                </Text>
            </View>
            
            <View className="flex-row">
                {onView && (
                    <TouchableOpacity
                        onPress={() => onView(url, index, fileNames?.[index])}
                        className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full items-center justify-center mr-2"
                    >
                        <EyeIcon size={16} color="#3B82F6" />
                    </TouchableOpacity>
                )}
                {onDelete && (
                    <TouchableOpacity
                        onPress={() => onDelete(index)}
                        className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full items-center justify-center"
                    >
                        <TrashIcon size={16} color="#EF4444" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    // ============================================================================
    // Rendu principal
    // ============================================================================

    if (!mediaUrls || mediaUrls.length === 0) {
        return (
            <View className="flex-1 items-center justify-center py-12">
                <View className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full items-center justify-center mb-4">
                    {mediaType === 'photo' && <VideoCameraIcon size={24} color="#9CA3AF" />}
                    {mediaType === 'video' && <VideoCameraIcon size={24} color="#9CA3AF" />}
                    {mediaType === 'document' && <DocumentIcon size={24} color="#9CA3AF" />}
                </View>
                <Text className="text-gray-500 dark:text-gray-400 text-center">
                    {mediaType === 'photo' && t('media.noPhotos', 'Aucune photo')}
                    {mediaType === 'video' && t('media.noVideos', 'Aucune vidéo')}
                    {mediaType === 'document' && t('media.noDocuments', 'Aucun document')}
                </Text>
            </View>
        );
    }

    if (mediaType === 'document') {
        // Documents en liste verticale
        return (
            <View>
                {mediaUrls.map((url, index) => renderDocument(url, index))}
            </View>
        );
    }

    // Photos et vidéos en grille
    return (
        <View className="flex-row flex-wrap">
            {mediaUrls.map((url, index) => {
                if (mediaType === 'photo') {
                    return renderPhoto(url, index);
                } else if (mediaType === 'video') {
                    return renderVideo(url, index);
                }
                return null;
            })}
        </View>
    );
}