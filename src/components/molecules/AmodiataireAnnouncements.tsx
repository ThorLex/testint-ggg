/**
 * Composant AmodiataireAnnouncements (Molecule)
 * 
 * Affiche les annonces d'un amodiataire avec fake data.
 * Utilisé dans la page de détails de l'amodiataire.
 * 
 * @module components/molecules/AmodiataireAnnouncements
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Modal,
    ScrollView,
    Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    XMarkIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    CheckCircleIcon,
    BellIcon,
    MagnifyingGlassPlusIcon,
} from 'react-native-heroicons/outline';

// ============================================================================
// Atoms & Organisms
// ============================================================================
import { HtmlRenderer } from '../atoms/HtmlRenderer';
import { MediaViewerModal } from '../organisms/MediaViewerModal';
import type { MediaItem } from '@/types/api';

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// Types - Structure exacte de l'API
// ============================================================================

interface APIAnnouncement {
    id: string;
    title: string;
    message: string;
    shortMessage: string;
    type: string;
    priority: 'basse' | 'normale' | 'haute';
    status: 'brouillon' | 'publiee' | 'archivee';
    targetAudience: string;
    startDate: string;
    endDate: string | null;
    createdAt: string;
    publishedAt: string | null;
    metadata: {
        imageUrl: string | null;
        attachments: string[];
        contactInfo: string | null;
        actionRequired: boolean;
        actionUrl: string | null;
    };
}

interface AnnouncementItem {
    id: string;
    title: string;
    message: string;
    shortMessage: string;
    type: string;
    priority: 'basse' | 'normale' | 'haute';
    publishedAt: string | null;
    startDate?: string;
    endDate?: string | null;
    metadata?: {
        contactInfo?: string | null;
        actionUrl?: string | null;
        imageUrl?: string | null;
        attachments?: string[];
        actionRequired?: boolean;
    };
}

// ============================================================================
// Props
// ============================================================================

export interface AmodiataireAnnouncementsProps {
    /** Annonces depuis l'API ou fake data par défaut */
    announcements?: any[];
}

// ============================================================================
// Composant
// ============================================================================

export function AmodiataireAnnouncements({
    announcements,
}: AmodiataireAnnouncementsProps) {
    const { t } = useTranslation();
    
    // Convertir les annonces de l'API au format local
    const convertedAnnouncements: AnnouncementItem[] = React.useMemo(() => {
        if (!announcements || announcements.length === 0) {
            return [];
        }
        
        return announcements.map((ann: APIAnnouncement) => ({
            id: ann.id,
            title: ann.title,
            message: ann.message,
            shortMessage: ann.shortMessage,
            type: ann.type as any,
            priority: ann.priority,
            publishedAt: ann.publishedAt,
            startDate: ann.startDate,
            endDate: ann.endDate,
            metadata: {
                contactInfo: ann.metadata?.contactInfo,
                actionUrl: ann.metadata?.actionUrl,
                imageUrl: ann.metadata?.imageUrl,
            },
        }));
    }, [announcements]);
    
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);
    const [showZoom, setShowZoom] = useState(false);
    const [zoomImage, setZoomImage] = useState<MediaItem | null>(null);

    // ============================================================================
    // Helpers
    // ============================================================================

    /**
     * Obtient la couleur selon le type d'annonce
     */
    const getTypeColor = (type: AnnouncementItem['type']) => {
        switch (type) {
            case 'urgence':
                return { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-700 dark:text-red-300', icon: 'bg-red-500' };
            case 'maintenance':
                return { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-700 dark:text-orange-300', icon: 'bg-orange-500' };
            case 'nouvelle_route':
                return { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300', icon: 'bg-blue-500' };
            case 'amodiataire':
                return { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-700 dark:text-purple-300', icon: 'bg-purple-500' };
            case 'info':
            default:
                return { bg: 'bg-emerald-100 dark:bg-emerald-900', text: 'text-emerald-700 dark:text-emerald-300', icon: 'bg-emerald-500' };
        }
    };

    /**
     * Obtient l'icône selon le type
     */
    const getTypeIcon = (type: AnnouncementItem['type']) => {
        switch (type) {
            case 'urgence':
                return <ExclamationTriangleIcon size={20} color="white" />;
            case 'maintenance':
                return <InformationCircleIcon size={20} color="white" />;
            case 'nouvelle_route':
                return <CheckCircleIcon size={20} color="white" />;
            case 'amodiataire':
                return <BellIcon size={20} color="white" />;
            case 'info':
            default:
                return <InformationCircleIcon size={20} color="white" />;
        }
    };

    /**
     * Formate la date
     */
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    /**
     * Obtient le label de priorité
     */
    const getPriorityLabel = (priority: AnnouncementItem['priority'] | 'urgente') => {
        switch (priority) {
            case 'urgente':
            case 'haute':
                return t('announcements.priorities.haute', '🟠 Haute');
            case 'basse':
                return t('announcements.priorities.basse', '🔵 Basse');
            case 'normale':
            default:
                return t('announcements.priorities.normale', '🟢 Normale');
        }
    };

    // ============================================================================
    // Rendu d'une annonce
    // ============================================================================

    const renderAnnouncement = ({ item }: { item: AnnouncementItem }) => {
        const colors = getTypeColor(item.type);
        const icon = getTypeIcon(item.type);

        return (
            <TouchableOpacity
                onPress={() => setSelectedAnnouncement(item)}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 dark:border-gray-700"
                activeOpacity={0.7}
            >
                <View className="flex-row items-start">
                    {/* Icône */}
                    <View className={`w-10 h-10 ${colors.icon} rounded-full items-center justify-center mr-3`}>
                        {icon}
                    </View>

                    {/* Contenu */}
                    <View className="flex-1">
                        {/* Titre */}
                        <Text className="text-gray-900 dark:text-white font-bold text-base mb-1">
                            {item.title}
                        </Text>

                        {/* Message court */}
                        <Text className="text-gray-600 dark:text-gray-300 text-sm mb-2" numberOfLines={2}>
                            {item.shortMessage}
                        </Text>

                        {/* Métadonnées */}
                        <View className="flex-row items-center flex-wrap">
                            {/* Type */}
                            <View className={`${colors.bg} rounded-full px-2 py-1 mr-2 mb-1`}>
                                <Text className={`${colors.text} text-xs font-semibold`}>
                                    {item.type.replace('_', ' ')}
                                </Text>
                            </View>

                            {/* Priorité */}
                            <Text className="text-gray-500 dark:text-gray-400 text-xs mr-2 mb-1">
                                {getPriorityLabel(item.priority)}
                            </Text>

                            {/* Date */}
                            <Text className="text-gray-400 dark:text-gray-500 text-xs mb-1">
                                {formatDate(item.publishedAt)}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // ============================================================================
    // Rendu Principal
    // ============================================================================

    if (convertedAnnouncements.length === 0) {
        return (
            <View className="py-8 items-center justify-center">
                <BellIcon size={48} color="#D1D5DB" />
                <Text className="text-gray-500 dark:text-gray-400 text-center mt-3">
                    {t('announcements.noAnnouncements', 'Aucune annonce')}
                </Text>
            </View>
        );
    }

    return (
        <>
            <FlatList
                data={convertedAnnouncements}
                keyExtractor={(item) => item.id}
                renderItem={renderAnnouncement}
                scrollEnabled={false}
            />

            {/* Modal de détails */}
            {selectedAnnouncement && (
                <Modal
                    visible={!!selectedAnnouncement}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={() => setSelectedAnnouncement(null)}
                >
                    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
                        {/* Header */}
                        <View className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 pt-12 pb-4">
                            <View className="flex-row items-center justify-between px-4">
                                <Text className="text-xl font-bold text-gray-900 dark:text-white flex-1 pr-2">
                                    {t('announcements.detailsTitle', 'Détails de l\'annonce')}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setSelectedAnnouncement(null)}
                                    className="w-8 h-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
                                >
                                    <XMarkIcon size={20} color="#6B7280" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Contenu */}
                        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
                        {/* Image de l'annonce avec zoom */}
                        {selectedAnnouncement.metadata?.imageUrl && (
                            <TouchableOpacity 
                                activeOpacity={0.9}
                                onPress={() => {
                                    if (selectedAnnouncement.metadata?.imageUrl) {
                                        setZoomImage({
                                            id: selectedAnnouncement.id,
                                            url: selectedAnnouncement.metadata.imageUrl,
                                            type: 'photo',
                                            uploadedAt: selectedAnnouncement.publishedAt || new Date().toISOString()
                                        });
                                        setShowZoom(true);
                                    }
                                }}
                                className="mb-4 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 relative"
                            >
                                <Image
                                    source={{ uri: selectedAnnouncement.metadata.imageUrl }}
                                    className="w-full h-48"
                                    resizeMode="cover"
                                />
                                {/* Overlay / Icône de zoom */}
                                <View className="absolute bottom-3 right-3 bg-black/50 rounded-full p-2">
                                    <MagnifyingGlassPlusIcon size={20} color="white" />
                                </View>
                            </TouchableOpacity>
                        )}
                        
                        {/* Titre */}
                        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            {selectedAnnouncement.title}
                        </Text>

                            {/* Métadonnées */}
                            <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                <View className="flex-row items-center mb-2">
                                    <Text className="text-gray-500 dark:text-gray-400 text-sm font-bold mr-2">
                                        {t('announcements.fields.type', 'Type')}:
                                    </Text>
                                    <View className={`${getTypeColor(selectedAnnouncement.type).bg} rounded-full px-3 py-1`}>
                                        <Text className={`${getTypeColor(selectedAnnouncement.type).text} text-sm font-semibold`}>
                                            {selectedAnnouncement.type.replace('_', ' ')}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row items-center mb-2">
                                    <Text className="text-gray-500 dark:text-gray-400 text-sm font-bold mr-2">
                                        {t('announcements.fields.priority', 'Priorité')}:
                                    </Text>
                                    <Text className="text-gray-900 dark:text-white text-sm">
                                        {getPriorityLabel(selectedAnnouncement.priority)}
                                    </Text>
                                </View>

                                <View className="flex-row items-center mb-2">
                                    <Text className="text-gray-500 dark:text-gray-400 text-sm font-bold mr-2">
                                        {t('announcements.fields.publishedOn', 'Publié le')}:
                                    </Text>
                                    <Text className="text-gray-900 dark:text-white text-sm">
                                        {formatDate(selectedAnnouncement.publishedAt)}
                                    </Text>
                                </View>

                                {/* Période de validité */}
                                {selectedAnnouncement.startDate && (
                                    <View className="flex-row items-center">
                                        <Text className="text-gray-500 dark:text-gray-400 text-sm font-bold mr-2">
                                            {t('announcements.fields.validPeriod', 'Valable')}:
                                        </Text>
                                        <Text className="text-gray-900 dark:text-white text-sm">
                                            {t('announcements.fields.from', 'du')} {formatDate(selectedAnnouncement.startDate)}
                                            {selectedAnnouncement.endDate && ` ${t('announcements.fields.to', 'au')} ${formatDate(selectedAnnouncement.endDate)}`}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Message avec support HTML */}
                            <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                <HtmlRenderer 
                                    html={selectedAnnouncement.message} 
                                    style={{ fontSize: 16, lineHeight: 24 }}
                                    containerStyle={{ minHeight: 40 }}
                                />
                            </View>

                            {/* Lien d'action */}
                            {selectedAnnouncement.metadata?.actionUrl && (
                                <View className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 mb-4 border border-emerald-200 dark:border-emerald-800">
                                    <Text className="text-emerald-700 dark:text-emerald-300 text-sm font-bold mb-1">
                                        {t('announcements.fields.usefulLink', '🔗 Lien utile')}
                                    </Text>
                                    <Text className="text-emerald-600 dark:text-emerald-400 text-sm">
                                        {selectedAnnouncement.metadata.actionUrl}
                                    </Text>
                                </View>
                            )}

                            {/* Contact Info */}
                            {selectedAnnouncement.metadata?.contactInfo && (
                                <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                    <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                                        {t('announcements.fields.contact', 'Contact')}
                                    </Text>
                                    <Text className="text-gray-900 dark:text-white text-sm">
                                        {selectedAnnouncement.metadata.contactInfo}
                                    </Text>
                                </View>
                            )}

                            <View className="h-20" />
                        </ScrollView>
                    </View>
                </Modal>
            )}

            {/* Modal de Zoom pour l'image de l'annonce */}
            {zoomImage && (
                <MediaViewerModal
                    visible={showZoom}
                    onClose={() => setShowZoom(false)}
                    media={[zoomImage]}
                    initialIndex={0}
                />
            )}
        </>
    );
}
