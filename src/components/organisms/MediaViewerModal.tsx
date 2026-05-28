/**
 * Composant MediaViewerModal (Organism)
 * 
 * Modal pour afficher les médias (images et vidéos) en plein écran.
 * Permet de naviguer entre les médias avec des gestes de swipe.
 * 
 * @module components/organisms/MediaViewerModal
 */

import React, { useState, useRef } from 'react';
import {
    View,
    Modal,
    Image,
    TouchableOpacity,
    Dimensions,
    FlatList,
    ActivityIndicator,
    Text,
} from 'react-native';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from 'react-native-heroicons/outline';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import type { MediaItem } from '@/types/api';

// ============================================================================
// Props
// ============================================================================

export interface MediaViewerModalProps {
    /** Visibilité du modal */
    visible: boolean;
    /** Callback de fermeture */
    onClose: () => void;
    /** Liste des médias à afficher */
    media: MediaItem[];
    /** Index du média initial à afficher */
    initialIndex?: number;
}

// ============================================================================
// Composant
// ============================================================================

export function MediaViewerModal({
    visible,
    onClose,
    media,
    initialIndex = 0,
}: MediaViewerModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isLoading, setIsLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);
    const videoRef = useRef<Video>(null);
    const { width, height } = Dimensions.get('window');

    const currentMedia = media[currentIndex];
    const isVideo = currentMedia?.type === 'video';

    // ============================================================================
    // Handlers
    // ============================================================================

    const handlePrevious = () => {
        if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            setCurrentIndex(newIndex);
            flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
        }
    };

    const handleNext = () => {
        if (currentIndex < media.length - 1) {
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
        }
    };

    const handleScroll = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / width);
        if (index !== currentIndex && index >= 0 && index < media.length) {
            setCurrentIndex(index);
        }
    };

    // ============================================================================
    // Rendu d'un item
    // ============================================================================

    const renderItem = ({ item }: { item: MediaItem }) => {
        const isVideoItem = item.type === 'video';

        return (
            <View style={{ width, height }} className="items-center justify-center bg-black">
                {isVideoItem ? (
                    <Video
                        ref={videoRef}
                        source={{ uri: item.url }}
                        style={{ width: width, height: height * 0.7 }}
                        resizeMode={ResizeMode.CONTAIN}
                        useNativeControls
                        shouldPlay={false}
                        onLoadStart={() => setIsLoading(true)}
                        onLoad={() => setIsLoading(false)}
                    />
                ) : (
                    <Image
                        source={{ uri: item.url }}
                        style={{ width: width, height: height }}
                        resizeMode="contain"
                        onLoadStart={() => setIsLoading(true)}
                        onLoadEnd={() => setIsLoading(false)}
                    />
                )}
                
                {isLoading && (
                    <View className="absolute inset-0 items-center justify-center">
                        <ActivityIndicator size="large" color="#10B981" />
                    </View>
                )}
            </View>
        );
    };

    // ============================================================================
    // Rendu principal
    // ============================================================================

    return (
        <Modal
            visible={visible}
            animationType="fade"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black">
                {/* Header */}
                <View className="absolute top-0 left-0 right-0 z-10 pt-12 pb-4 px-4 bg-black/50">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-white text-lg font-semibold">
                            {currentIndex + 1} / {media.length}
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-10 h-10 items-center justify-center rounded-full bg-white/20"
                            activeOpacity={0.7}
                        >
                            <XMarkIcon size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Carousel de médias */}
                <FlatList
                    ref={flatListRef}
                    data={media}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    initialScrollIndex={initialIndex}
                    getItemLayout={(data, index) => ({
                        length: width,
                        offset: width * index,
                        index,
                    })}
                />

                {/* Boutons de navigation */}
                {media.length > 1 && (
                    <>
                        {currentIndex > 0 && (
                            <TouchableOpacity
                                onPress={handlePrevious}
                                className="absolute left-4 top-1/2 -mt-6 w-12 h-12 items-center justify-center rounded-full bg-white/20"
                                activeOpacity={0.7}
                            >
                                <ChevronLeftIcon size={28} color="white" />
                            </TouchableOpacity>
                        )}

                        {currentIndex < media.length - 1 && (
                            <TouchableOpacity
                                onPress={handleNext}
                                className="absolute right-4 top-1/2 -mt-6 w-12 h-12 items-center justify-center rounded-full bg-white/20"
                                activeOpacity={0.7}
                            >
                                <ChevronRightIcon size={28} color="white" />
                            </TouchableOpacity>
                        )}
                    </>
                )}

                {/* Info du média */}
                {currentMedia?.title && (
                    <View className="absolute bottom-0 left-0 right-0 p-4 bg-black/50">
                        <Text className="text-white text-base font-semibold">
                            {currentMedia.title}
                        </Text>
                        {currentMedia.description && (
                            <Text className="text-white/80 text-sm mt-1">
                                {currentMedia.description}
                            </Text>
                        )}
                    </View>
                )}
            </View>
        </Modal>
    );
}
