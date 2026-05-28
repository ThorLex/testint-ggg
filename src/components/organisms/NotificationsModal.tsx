/**
 * Composant NotificationsModal (Organism)
 * 
 * Modal affichant les notifications/annonces de l'application.
 * Affiche les annonces avec fake data en attendant l'API.
 * 
 * @module components/organisms/NotificationsModal
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    FlatList,
    Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    XMarkIcon,
    BellIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    CheckCircleIcon,
} from 'react-native-heroicons/outline';

// ============================================================================
// Types
// ============================================================================

import type { Announcement } from '@/types/api';
import { BottomSheet } from '@/components/molecules/BottomSheet';

// ============================================================================
// Props
// ============================================================================

export interface NotificationsModalProps {
    /** Visibilité de la modal */
    visible: boolean;
    /** Callback de fermeture */
    onClose: () => void;
    /** Annonces depuis l'API */
    announcements: Announcement[];
}

// ============================================================================
// Composant
// ============================================================================

export function NotificationsModal({
    visible,
    onClose,
    announcements = [],
}: NotificationsModalProps) {
    const { t } = useTranslation();
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    // ============================================================================
    // Helpers
    // ============================================================================

    /**
     * Obtient la couleur selon le type d'annonce
     */
    const getTypeColor = (type: Announcement['type']) => {
        switch (type) {
            case 'urgence':
                return { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-700 dark:text-red-300', icon: 'bg-red-500' };
            case 'maintenance':
                return { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-700 dark:text-orange-300', icon: 'bg-orange-500' };
            case 'nouvelle_route':
                return { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300', icon: 'bg-blue-500' };
            case 'info':
            default:
                return { bg: 'bg-emerald-100 dark:bg-emerald-900', text: 'text-emerald-700 dark:text-emerald-300', icon: 'bg-emerald-500' };
        }
    };

    /**
     * Obtient l'icône selon le type
     */
    const getTypeIcon = (type: Announcement['type']) => {
        switch (type) {
            case 'urgence':
                return <ExclamationTriangleIcon size={20} color="white" />;
            case 'maintenance':
                return <InformationCircleIcon size={20} color="white" />;
            case 'nouvelle_route':
                return <CheckCircleIcon size={20} color="white" />;
            case 'info':
            default:
                return <InformationCircleIcon size={20} color="white" />;
        }
    };

    /**
     * Formate la date
     */
    const formatDate = (dateString: string) => {
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
    const getPriorityLabel = (priority: Announcement['priority'] | 'urgente') => {
        switch (priority) {
            case 'urgente':
                return '🔴 Urgent';
            case 'haute':
                return '🟠 Haute';
            case 'normale':
            default:
                return '🟢 Normale';
        }
    };

    // ============================================================================
    // Rendu d'une annonce
    // ============================================================================

    const renderAnnouncement = ({ item }: { item: Announcement }) => {
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
                                {formatDate(item.publishedAt || item.createdAt || '')}
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

    return (
        <>
        <BottomSheet
            visible={visible}
            onClose={onClose}
            maxHeight={75}
            showHandle={true}
            scrollable={false}
        >
            {/* Header */}
            <View className="px-4 pt-2 pb-4 border-b border-gray-200 dark:border-gray-700">
                <View className="flex-row items-center justify-between">
                    {/* Logo subtil */}
                    <View className="mr-3">
                        <Image
                            source={require('../../../assets/icon.png')}
                            className="w-8 h-8 opacity-60"
                            resizeMode="contain"
                        />
                    </View>
                    
                    <View className="flex-row items-center flex-1">
                        <BellIcon size={24} color="#10B981" />
                        <Text className="text-xl font-bold text-gray-900 dark:text-white ml-2">
                            {t('notifications.title', 'Notifications')}
                        </Text>
                        {announcements.length > 0 && (
                            <View className="ml-2 bg-emerald-500 rounded-full px-2 py-0.5">
                                <Text className="text-white text-xs font-bold">
                                    {announcements.length}
                                </Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity
                        onPress={onClose}
                        className="w-8 h-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
                    >
                        <XMarkIcon size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Liste des annonces */}
            <View className="flex-1 px-4 pt-4">
                {announcements.length === 0 ? (
                    <View className="flex-1 items-center justify-center py-20">
                        <BellIcon size={64} color="#D1D5DB" />
                        <Text className="text-gray-500 dark:text-gray-400 text-center mt-4 text-lg">
                            {t('notifications.empty', 'Aucune notification')}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={announcements}
                        keyExtractor={(item) => item.id}
                        renderItem={renderAnnouncement}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </BottomSheet>

        {/* Modal de détails (garde le Modal fullscreen pour les détails) */}
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
                                Détails de l'annonce
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
                        {/* Image de l'annonce */}
                        {selectedAnnouncement.metadata.imageUrl && (
                            <View className="mb-4 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
                                <Image
                                    source={{ uri: selectedAnnouncement.metadata.imageUrl }}
                                    className="w-full h-48"
                                    resizeMode="cover"
                                />
                            </View>
                        )}

                        {/* Titre */}
                        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            {selectedAnnouncement.title}
                        </Text>

                        {/* Métadonnées */}
                        <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
                            <View className="flex-row items-center mb-2">
                                <Text className="text-gray-500 dark:text-gray-400 text-sm font-bold mr-2">
                                    Type:
                                </Text>
                                <View className={`${getTypeColor(selectedAnnouncement.type).bg} rounded-full px-3 py-1`}>
                                    <Text className={`${getTypeColor(selectedAnnouncement.type).text} text-sm font-semibold`}>
                                        {selectedAnnouncement.type.replace('_', ' ')}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row items-center mb-2">
                                <Text className="text-gray-500 dark:text-gray-400 text-sm font-bold mr-2">
                                    Priorité:
                                </Text>
                                <Text className="text-gray-900 dark:text-white text-sm">
                                    {getPriorityLabel(selectedAnnouncement.priority)}
                                </Text>
                            </View>

                            <View className="flex-row items-center">
                                <Text className="text-gray-500 dark:text-gray-400 text-sm font-bold mr-2">
                                    Publié le:
                                </Text>
                                <Text className="text-gray-900 dark:text-white text-sm">
                                    {formatDate(selectedAnnouncement.publishedAt || selectedAnnouncement.createdAt || '')}
                                </Text>
                            </View>
                        </View>

                        {/* Message */}
                        <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
                            <Text className="text-gray-900 dark:text-white text-base leading-6">
                                {selectedAnnouncement.message}
                            </Text>
                        </View>

                        {/* Contact Info */}
                        {selectedAnnouncement.metadata.contactInfo && (
                            <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                                    Contact
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
        </>
    );
}
