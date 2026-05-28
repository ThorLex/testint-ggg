/**
 * Composant MediaPreview (Molecule)
 * 
 * Prévisualisation d'un média avec informations.
 * 
 * @module components/molecules/MediaPreview
 */

import React from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
} from 'react-native';
import {
    PhotoIcon,
    VideoCameraIcon,
    DocumentIcon,
    EyeIcon,
    PlayIcon,
} from 'react-native-heroicons/outline';
import type { MediaType } from '@/types';

// ============================================================================
// Props
// ============================================================================

export interface MediaPreviewProps {
    /** Type de média */
    mediaType: MediaType;
    /** URL du média */
    mediaUrl: string;
    /** Nom du fichier (optionnel) */
    fileName?: string;
    /** Taille du fichier (optionnel) */
    fileSize?: string;
    /** Callback de visualisation */
    onView?: () => void;
    /** Style compact */
    compact?: boolean;
}

// ============================================================================
// Composant
// ============================================================================

export function MediaPreview({ 
    mediaType, 
    mediaUrl, 
    fileName, 
    fileSize, 
    onView,
    compact = false 
}: MediaPreviewProps) {

    // ============================================================================
    // Rendu du contenu
    // ============================================================================

    const renderContent = () => {
        switch (mediaType) {
            case 'photo':
                return (
                    <View className={`relative ${compact ? 'w-16 h-16' : 'w-20 h-20'} rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700`}>
                        <Image 
                            source={{ uri: mediaUrl }} 
                            className="w-full h-full" 
                            resizeMode="cover"
                        />
                        {onView && (
                            <TouchableOpacity
                                onPress={onView}
                                className="absolute inset-0 bg-black/20 items-center justify-center"
                            >
                                <View className="w-8 h-8 bg-white/90 rounded-full items-center justify-center">
                                    <EyeIcon size={16} color="#374151" />
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                );

            case 'video':
                return (
                    <View className={`relative ${compact ? 'w-16 h-16' : 'w-20 h-20'} rounded-lg overflow-hidden bg-gray-800`}>
                        <View className="w-full h-full items-center justify-center">
                            <VideoCameraIcon size={compact ? 20 : 24} color="#9CA3AF" />
                        </View>
                        {onView && (
                            <TouchableOpacity
                                onPress={onView}
                                className="absolute inset-0 bg-black/20 items-center justify-center"
                            >
                                <View className="w-8 h-8 bg-white/90 rounded-full items-center justify-center">
                                    <PlayIcon size={16} color="#374151" />
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                );

            case 'document':
                return (
                    <View className={`${compact ? 'w-16 h-16' : 'w-20 h-20'} rounded-lg bg-emerald-100 dark:bg-emerald-900 items-center justify-center`}>
                        <DocumentIcon size={compact ? 20 : 24} color="#10B981" />
                        {onView && (
                            <TouchableOpacity
                                onPress={onView}
                                className="absolute inset-0 bg-black/10 items-center justify-center rounded-lg"
                            >
                                <View className="w-8 h-8 bg-white/90 rounded-full items-center justify-center">
                                    <EyeIcon size={16} color="#374151" />
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                );

            default:
                return (
                    <View className={`${compact ? 'w-16 h-16' : 'w-20 h-20'} rounded-lg bg-gray-200 dark:bg-gray-700 items-center justify-center`}>
                        <PhotoIcon size={compact ? 20 : 24} color="#9CA3AF" />
                    </View>
                );
        }
    };

    const getMediaTypeLabel = () => {
        switch (mediaType) {
            case 'photo': return 'Photo';
            case 'video': return 'Vidéo';
            case 'document': return 'Document';
            default: return 'Média';
        }
    };

    // ============================================================================
    // Rendu principal
    // ============================================================================

    if (compact) {
        return (
            <View className="flex-row items-center p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                {renderContent()}
                <View className="flex-1 ml-3">
                    <Text className="text-gray-900 dark:text-white font-medium" numberOfLines={1}>
                        {fileName || `${getMediaTypeLabel()} ajouté`}
                    </Text>
                    {fileSize && (
                        <Text className="text-gray-500 dark:text-gray-400 text-sm">
                            {fileSize}
                        </Text>
                    )}
                </View>
            </View>
        );
    }

    return (
        <View className="items-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            {renderContent()}
            <Text className="text-gray-900 dark:text-white font-medium mt-3 text-center" numberOfLines={2}>
                {fileName || `${getMediaTypeLabel()} ajouté`}
            </Text>
            {fileSize && (
                <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    {fileSize}
                </Text>
            )}
        </View>
    );
}