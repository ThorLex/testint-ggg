/**
 * Composant VideoPlayerModal (Organism)
 * 
 * Lecteur vidéo avec contrôles et options.
 * 
 * @module components/organisms/VideoPlayerModal
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Dimensions,
    StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import {
    XMarkIcon,
    PlayIcon,
    PauseIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
    ArrowsPointingOutIcon,
    ArrowsPointingInIcon,
    BackwardIcon,
    ForwardIcon,
} from 'react-native-heroicons/outline';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// Props
// ============================================================================

export interface VideoPlayerModalProps {
    /** Visibilité de la modal */
    visible: boolean;
    /** URL de la vidéo */
    videoUrl: string;
    /** Index de la vidéo */
    videoIndex: number;
    /** Callback de fermeture */
    onClose: () => void;
}

// ============================================================================
// Composant
// ============================================================================

export function VideoPlayerModal({ 
    visible, 
    videoUrl, 
    videoIndex, 
    onClose 
}: VideoPlayerModalProps) {
    const { t } = useTranslation();
    const videoRef = useRef<Video>(null);
    
    const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);

    // ============================================================================
    // Effects
    // ============================================================================

    useEffect(() => {
        if (visible) {
            // Réinitialiser l'état quand la modal s'ouvre
            setIsPlaying(false);
            setPosition(0);
            setShowControls(true);
        }
    }, [visible]);

    useEffect(() => {
        // Masquer les contrôles après 3 secondes d'inactivité
        if (showControls && isPlaying) {
            const timer = setTimeout(() => {
                setShowControls(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showControls, isPlaying]);

    // ============================================================================
    // Handlers
    // ============================================================================

    const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        setStatus(status);
        if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
            setIsMuted(status.isMuted);
            setPosition(status.positionMillis || 0);
            setDuration(status.durationMillis || 0);
        }
    };

    const handlePlayPause = async () => {
        if (videoRef.current) {
            if (isPlaying) {
                await videoRef.current.pauseAsync();
            } else {
                await videoRef.current.playAsync();
            }
        }
    };

    const handleMuteToggle = async () => {
        if (videoRef.current) {
            await videoRef.current.setIsMutedAsync(!isMuted);
        }
    };

    const handleSeek = async (seekPosition: number) => {
        if (videoRef.current && duration > 0) {
            const newPosition = Math.max(0, Math.min(duration, seekPosition));
            await videoRef.current.setPositionAsync(newPosition);
        }
    };

    const handleSkip = async (seconds: number) => {
        const newPosition = position + (seconds * 1000);
        await handleSeek(newPosition);
    };

    const handleFullscreenToggle = () => {
        setIsFullscreen(!isFullscreen);
    };

    const handleVideoPress = () => {
        setShowControls(!showControls);
    };

    const handleClose = async () => {
        if (videoRef.current) {
            await videoRef.current.pauseAsync();
        }
        onClose();
    };

    // ============================================================================
    // Utilitaires
    // ============================================================================

    const formatTime = (milliseconds: number): string => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getProgressPercentage = (): number => {
        if (duration === 0) return 0;
        return (position / duration) * 100;
    };

    // ============================================================================
    // Rendu
    // ============================================================================

    return (
        <Modal
            visible={visible}
            animationType="fade"
            presentationStyle="fullScreen"
            onRequestClose={handleClose}
        >
            <StatusBar hidden={isFullscreen} />
            <View className="flex-1 bg-black">
                {/* Lecteur vidéo */}
                <TouchableOpacity 
                    activeOpacity={1}
                    onPress={handleVideoPress}
                    className="flex-1"
                >
                    <Video
                        ref={videoRef}
                        source={{ uri: videoUrl }}
                        style={{
                            width: SCREEN_WIDTH,
                            height: isFullscreen ? SCREEN_HEIGHT : SCREEN_HEIGHT * 0.6,
                        }}
                        resizeMode={ResizeMode.CONTAIN}
                        shouldPlay={false}
                        isLooping={false}
                        isMuted={isMuted}
                        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                    />
                </TouchableOpacity>

                {/* Contrôles vidéo */}
                {showControls && (
                    <>
                        {/* Header */}
                        <View className="absolute top-0 left-0 right-0 bg-black/70 pt-12 pb-4">
                            <View className="flex-row items-center justify-between px-4">
                                <Text className="text-white text-lg font-semibold">
                                    Vidéo {videoIndex + 1}
                                </Text>
                                <View className="flex-row items-center">
                                    <TouchableOpacity
                                        onPress={handleFullscreenToggle}
                                        className="w-10 h-10 items-center justify-center rounded-full bg-white/20 mr-3"
                                    >
                                        {isFullscreen ? (
                                            <ArrowsPointingInIcon size={20} color="white" />
                                        ) : (
                                            <ArrowsPointingOutIcon size={20} color="white" />
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleClose}
                                        className="w-10 h-10 items-center justify-center rounded-full bg-white/20"
                                    >
                                        <XMarkIcon size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Contrôles centraux */}
                        <View className="absolute inset-0 items-center justify-center">
                            <View className="flex-row items-center space-x-8">
                                <TouchableOpacity
                                    onPress={() => handleSkip(-10)}
                                    className="w-12 h-12 items-center justify-center rounded-full bg-black/50"
                                >
                                    <BackwardIcon size={24} color="white" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handlePlayPause}
                                    className="w-16 h-16 items-center justify-center rounded-full bg-white/90"
                                >
                                    {isPlaying ? (
                                        <PauseIcon size={32} color="#000" />
                                    ) : (
                                        <PlayIcon size={32} color="#000" />
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => handleSkip(10)}
                                    className="w-12 h-12 items-center justify-center rounded-full bg-black/50"
                                >
                                    <ForwardIcon size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Footer avec barre de progression */}
                        <View className="absolute bottom-0 left-0 right-0 bg-black/70 p-4">
                            {/* Barre de progression */}
                            <View className="mb-4">
                                <View className="h-1 bg-white/30 rounded-full">
                                    <View 
                                        className="h-1 bg-white rounded-full"
                                        style={{ width: `${getProgressPercentage()}%` }}
                                    />
                                </View>
                                <View className="flex-row justify-between mt-2">
                                    <Text className="text-white text-sm">
                                        {formatTime(position)}
                                    </Text>
                                    <Text className="text-white text-sm">
                                        {formatTime(duration)}
                                    </Text>
                                </View>
                            </View>

                            {/* Contrôles du bas */}
                            <View className="flex-row items-center justify-between">
                                <TouchableOpacity
                                    onPress={handlePlayPause}
                                    className="flex-row items-center"
                                >
                                    {isPlaying ? (
                                        <PauseIcon size={24} color="white" />
                                    ) : (
                                        <PlayIcon size={24} color="white" />
                                    )}
                                    <Text className="text-white ml-2">
                                        {isPlaying ? 'Pause' : 'Lecture'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleMuteToggle}
                                    className="flex-row items-center"
                                >
                                    {isMuted ? (
                                        <SpeakerXMarkIcon size={24} color="white" />
                                    ) : (
                                        <SpeakerWaveIcon size={24} color="white" />
                                    )}
                                    <Text className="text-white ml-2">
                                        {isMuted ? 'Activer le son' : 'Couper le son'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}

                {/* Informations de chargement */}
                {status && !status.isLoaded && (
                    <View className="absolute inset-0 items-center justify-center bg-black/50">
                        <Text className="text-white text-lg">Chargement de la vidéo...</Text>
                    </View>
                )}
            </View>
        </Modal>
    );
}