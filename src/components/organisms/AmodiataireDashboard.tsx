/**
 * Composant AmodiataireDashboard (Organism)
 * 
 * Tableau de bord de l'amodiataire avec gestion du profil et des médias.
 * 
 * @module components/organisms/AmodiataireDashboard
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    Image,
    ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    XMarkIcon,
    UserCircleIcon,
    PhotoIcon,
    VideoCameraIcon,
    DocumentIcon,
    PlusIcon,
    TrashIcon,
    ArrowRightOnRectangleIcon,
    PhoneIcon,
    MapPinIcon,
} from 'react-native-heroicons/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Services & Hooks
import { get, deleteRequest } from '@/services/api/client';
import { ApiRoutes } from '@/services/api/routes';
import { useAuthStore } from '@/store/auth';
import { useCustomAlert, showSuccessAlert, showErrorAlert, showConfirmAlert, showInfoAlert } from '@/hooks/useCustomAlert';
import { MediaPickerModal } from './MediaPickerModal';
import { MediaViewerModal } from './MediaViewerModal';
import { MediaGrid, DataErrorState } from '@/components/molecules';
import type { AmodiatairProfile, MediaType } from '@/types';

// ============================================================================
// Props
// ============================================================================

export interface AmodiataireDashboardProps {
    /** Visibilité de la modal */
    visible: boolean;
    /** Callback de fermeture */
    onClose: () => void;
}

// ============================================================================
// Composant
// ============================================================================

export function AmodiataireDashboard({ visible, onClose }: AmodiataireDashboardProps) {
    const { t } = useTranslation();
    const { user, logout, token } = useAuthStore();
    const queryClient = useQueryClient();
    const { AlertComponent, showAlert } = useCustomAlert();
    
    const [activeTab, setActiveTab] = useState<'profile' | 'photos' | 'videos' | 'documents'>('profile');
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [selectedMediaType, setSelectedMediaType] = useState<MediaType>('photo');
    const [showMediaViewer, setShowMediaViewer] = useState(false);
    const [viewerMediaUrl, setViewerMediaUrl] = useState('');
    const [viewerMediaIndex, setViewerMediaIndex] = useState(0);
    const [viewerMediaType, setViewerMediaType] = useState<MediaType>('photo');
    const [viewerFileName, setViewerFileName] = useState<string | undefined>();

    // Debug: Log auth state when dashboard opens
    React.useEffect(() => {
        if (visible) {
            console.log('🔍 Dashboard opened with auth state:', {
                isAuthenticated: !!token,
                hasUser: !!user,
                userEmail: user?.email,
                tokenLength: token?.length || 0,
            });
            
            // Avertir si pas de token
            if (!token) {
                console.warn('⚠️ No authentication token found. User needs to login.');
            }
        }
    }, [visible, token, user]);

    // Chargement du profil
    const { data: profile, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['amodiataire-profile'],
        queryFn: async () => {
            try {
                console.log('🔄 Fetching profile data...');
                console.log('🔑 Token available:', !!token);
                
                // Utiliser l'endpoint authentifié /api/mobile/profile
                // Le backend identifie l'amodiataire à partir du token JWT
                const response = await get<any>(
                    ApiRoutes.getFullUrl(ApiRoutes.PROFILE)
                );
                
                console.log('🔍 Raw API Response:', JSON.stringify(response, null, 2));
                
                // L'API retourne { success: true, profile: {...} }
                const apiData = response.profile || response;
                
                if (!apiData) {
                    throw new Error('Aucune donnée reçue de l\'API');
                }
                
                // Mapper la structure API vers notre interface AmodiatairProfile
                const mappedProfile: AmodiatairProfile = {
                    id: apiData.id || user?.id || '',
                    email: apiData.email || user?.email || '',
                    raisonSociale: apiData.lot?.raisonSociale || apiData.raisonSociale || '',
                    nom: apiData.nom || '',
                    prenom: apiData.prenom || '',
                    telephone: apiData.phone || apiData.telephone || '',
                    adresseAlphanumérique: apiData.lot?.adresse || apiData.adresse || '',
                    photos: apiData.photos || [],
                    videos: apiData.videos || [],
                    documents: apiData.documents || [],
                    numeroLot: apiData.lot?.numeroLot || apiData.numeroLot || '',
                    superficieAmodiee: apiData.lot?.superficie || apiData.superficie || 0,
                    nombreLots: apiData.lot?.nombreLots || apiData.nombreLots || 0,
                    coordinates: apiData.lot?.coordinates || apiData.coordinates || undefined,
                    center: apiData.lot?.center || apiData.center || undefined,
                    ville: apiData.ville || '',
                    codePostal: apiData.codePostal || '',
                    pays: apiData.pays || '',
                    description: apiData.biography || apiData.description || '',
                    statut: apiData.profileStatus || apiData.statut || 'actif',
                    dateInscription: apiData.createdAt || apiData.dateInscription || '',
                    derniereMiseAJour: apiData.updatedAt || apiData.derniereMiseAJour || '',
                };
                
                console.log('✅ Mapped profile:', mappedProfile);
                
                return mappedProfile;
            } catch (err: any) {
                console.error('❌ Profile fetch error:', err);
                
                // Si erreur 500 avec message sur 'uid', c'est le bug backend connu
                if (err.status === 500 && err.details?.includes?.('uid')) {
                    console.error('⚠️ Backend bug détecté: le middleware essaie d\'accéder à req.user.uid au lieu de req.user.id');
                    console.error('💡 Solution: Le backend doit être corrigé pour utiliser req.user.id');
                }
                
                throw err;
            }
        },
        enabled: visible && !!token,
        staleTime: 5 * 60 * 1000,
        retry: (failureCount, error: any) => {
            console.log(`🔄 Retry attempt ${failureCount} for profile fetch:`, error);
            
            // Ne pas retry si c'est une erreur 500 (bug backend)
            if (error?.status === 500) {
                console.log('⚠️ Erreur 500 détectée, pas de retry');
                return false;
            }
            
            // Ne pas retry si c'est une erreur 404 (amodiataire non trouvé)
            if (error?.status === 404) {
                console.log('⚠️ Erreur 404 détectée, pas de retry');
                return false;
            }
            
            return failureCount < 2; // Retry up to 2 times pour les autres erreurs
        },
    });

    // Mutation pour supprimer un média
    const deleteMediaMutation = useMutation({
        mutationFn: async ({ type, index }: { type: MediaType; index: number }) => {
            // L'API client gère automatiquement l'authentification via les intercepteurs
            // L'API attend l'ID du média pour la suppression
            return await deleteRequest(
                ApiRoutes.getFullUrl(ApiRoutes.getDeleteMediaUrl(String(index)))
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['amodiataire-profile'] });
            showAlert(showSuccessAlert(
                t('dashboard.success', 'Succès'), 
                t('dashboard.mediaDeleted', 'Média supprimé')
            ));
        },
        onError: (error) => {
            console.error('❌ Erreur suppression média:', error);
            showAlert(showErrorAlert(
                t('dashboard.error', 'Erreur'), 
                t('dashboard.deleteError', 'Impossible de supprimer le média')
            ));
        },
    });

    // Handlers
    const handleLogout = () => {
        showAlert(showConfirmAlert(
            t('dashboard.logout', 'Déconnexion'),
            t('dashboard.logoutConfirm', 'Voulez-vous vraiment vous déconnecter ?'),
            async () => {
                await logout();
                onClose();
            }
        ));
    };

    const handleDeleteMedia = (type: MediaType, index: number) => {
        showAlert(showConfirmAlert(
            t('dashboard.deleteMedia', 'Supprimer'),
            t('dashboard.deleteMediaConfirm', 'Voulez-vous vraiment supprimer ce média ?'),
            () => deleteMediaMutation.mutate({ type, index })
        ));
    };

    const handleViewMedia = (url: string, index: number, type: MediaType, fileName?: string) => {
        setViewerMediaUrl(url);
        setViewerMediaIndex(index);
        setViewerMediaType(type);
        setViewerFileName(fileName);
        setShowMediaViewer(true);
    };

    const handleAddMedia = (type: MediaType) => {
        setSelectedMediaType(type);
        setShowMediaPicker(true);
    };

    const handleMediaUploadSuccess = (url: string) => {
        // Invalider le cache pour recharger le profil avec le nouveau média
        queryClient.invalidateQueries({ queryKey: ['amodiataire-profile'] });
        
        // Fermer la modal après un délai pour laisser le temps de voir le message de succès
        setTimeout(() => {
            setShowMediaPicker(false);
        }, 2000);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-gray-50 dark:bg-gray-900">
                {/* Header */}
                <View className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 pt-12 pb-4">
                    <View className="flex-row items-center justify-between px-4">
                        <View className="flex-1">
                            <Text className="text-2xl font-black text-black dark:text-white">
                                {t('dashboard.title', 'Mon Espace')}
                            </Text>
                            {profile && (
                                <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                    {profile.raisonSociale || `${profile.nom || ''} ${profile.prenom || ''}`.trim()}
                                </Text>
                            )}
                        </View>
                        <View className="flex-row items-center">
                            <TouchableOpacity
                                onPress={handleLogout}
                                className="w-10 h-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 mr-2"
                            >
                                <ArrowRightOnRectangleIcon size={20} color="#EF4444" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={onClose}
                                className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
                            >
                                <XMarkIcon size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Tabs */}
                <View className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
                        <TouchableOpacity
                            onPress={() => setActiveTab('profile')}
                            className={`py-3 px-4 mr-2 border-b-2 ${
                                activeTab === 'profile' ? 'border-emerald-500' : 'border-transparent'
                            }`}
                        >
                            <View className="flex-row items-center">
                                <UserCircleIcon size={20} color={activeTab === 'profile' ? '#10B981' : '#9CA3AF'} />
                                <Text className={`ml-2 font-medium ${
                                    activeTab === 'profile' ? 'text-emerald-500' : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                    {t('dashboard.profile', 'Profil')}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setActiveTab('photos')}
                            className={`py-3 px-4 mr-2 border-b-2 ${
                                activeTab === 'photos' ? 'border-emerald-500' : 'border-transparent'
                            }`}
                        >
                            <View className="flex-row items-center">
                                <PhotoIcon size={20} color={activeTab === 'photos' ? '#10B981' : '#9CA3AF'} />
                                <Text className={`ml-2 font-medium ${
                                    activeTab === 'photos' ? 'text-emerald-500' : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                    {t('dashboard.photos', 'Photos')} ({profile?.photos?.length || 0})
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setActiveTab('videos')}
                            className={`py-3 px-4 mr-2 border-b-2 ${
                                activeTab === 'videos' ? 'border-emerald-500' : 'border-transparent'
                            }`}
                        >
                            <View className="flex-row items-center">
                                <VideoCameraIcon size={20} color={activeTab === 'videos' ? '#10B981' : '#9CA3AF'} />
                                <Text className={`ml-2 font-medium ${
                                    activeTab === 'videos' ? 'text-emerald-500' : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                    {t('dashboard.videos', 'Vidéos')} ({profile?.videos?.length || 0})
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setActiveTab('documents')}
                            className={`py-3 px-4 border-b-2 ${
                                activeTab === 'documents' ? 'border-emerald-500' : 'border-transparent'
                            }`}
                        >
                            <View className="flex-row items-center">
                                <DocumentIcon size={20} color={activeTab === 'documents' ? '#10B981' : '#9CA3AF'} />
                                <Text className={`ml-2 font-medium ${
                                    activeTab === 'documents' ? 'text-emerald-500' : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                    {t('dashboard.documents', 'Documents')} ({profile?.documents?.length || 0})
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Contenu */}
                <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
                    {isLoading ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <ActivityIndicator size="large" color="#10B981" />
                            <Text className="text-gray-500 dark:text-gray-400 mt-4">
                                {t('common.loading', 'Chargement...')}
                            </Text>
                        </View>
                    ) : isError || !profile ? (
                        <DataErrorState
                            title={t('dashboard.error', 'Erreur')}
                            message={
                                (error as any)?.status === 500 
                                    ? t('dashboard.serverError', 'Problème de serveur détecté')
                                    : (error as any)?.status === 404
                                    ? t('dashboard.profileNotFound', 'Profil non trouvé')
                                    : t('common.errorLoading', 'Erreur lors du chargement')
                            }
                            description={
                                (error as any)?.status === 500
                                    ? t('dashboard.serverErrorDetail', "Le serveur backend a un problème technique. L'équipe technique travaille sur une correction.")
                                    : (error as any)?.status === 404
                                    ? t('dashboard.profileNotFoundDetail', "Votre compte n'est pas encore lié à un profil amodiataire.")
                                    : undefined
                            }
                            onRetry={() => refetch()}
                        />
                    ) : (
                        <>
                            {/* Onglet Profil */}
                            {activeTab === 'profile' && (
                                <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                    <Text className="text-lg font-black text-black dark:text-white mb-4 uppercase tracking-wider">
                                        {t('dashboard.profileInfo', 'Informations du profil')}
                                    </Text>

                                    {profile.raisonSociale && (
                                        <View className="mb-3">
                                            <Text className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">
                                                {t('dashboard.companyName', 'Raison sociale')}
                                            </Text>
                                            <Text className="text-gray-900 dark:text-white text-base">{profile.raisonSociale}</Text>
                                        </View>
                                    )}
                                    
                                    {!profile.raisonSociale && (profile.nom || profile.prenom) && (
                                        <View className="mb-3">
                                            <Text className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">
                                                {t('dashboard.name', 'Nom')}
                                            </Text>
                                            <Text className="text-gray-900 dark:text-white text-base">
                                                {`${profile.nom || ''} ${profile.prenom || ''}`.trim()}
                                            </Text>
                                        </View>
                                    )}
                                    
                                    {profile.email && (
                                        <View className="mb-3">
                                            <Text className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">
                                                {t('dashboard.email', 'Email')}
                                            </Text>
                                            <Text className="text-gray-900 dark:text-white text-base">{profile.email}</Text>
                                        </View>
                                    )}
                                    
                                    {profile.telephone && (
                                        <View className="mb-3">
                                            <Text className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">
                                                {t('dashboard.phone', 'Téléphone')}
                                            </Text>
                                            <View className="flex-row items-center">
                                                <PhoneIcon size={16} color="#10B981" />
                                                <Text className="text-gray-900 dark:text-white text-base ml-2">{profile.telephone}</Text>
                                            </View>
                                        </View>
                                    )}
                                    
                                    {profile.adresseAlphanumérique && (
                                        <View className="mb-3">
                                            <Text className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">
                                                {t('dashboard.address', 'Adresse')}
                                            </Text>
                                            <View className="flex-row items-center">
                                                <MapPinIcon size={16} color="#10B981" />
                                                <Text className="text-gray-900 dark:text-white text-base ml-2">{profile.adresseAlphanumérique}</Text>
                                            </View>
                                        </View>
                                    )}
                                    
                                    {/* Affichage de debug temporaire */}
                                    {__DEV__ && (
                                        <View className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                            <Text className="text-xs text-gray-600 dark:text-gray-300 font-mono">
                                                Debug: {JSON.stringify(profile, null, 2)}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {activeTab === 'photos' && (
                                <View>
                                    <TouchableOpacity
                                        onPress={() => handleAddMedia('photo')}
                                        className="bg-emerald-500 rounded-xl p-4 mb-4 flex-row items-center justify-center"
                                    >
                                        <PlusIcon size={20} color="white" />
                                        <Text className="text-white font-semibold ml-2">
                                            {t('dashboard.actions.addPhoto', 'Ajouter une photo')}
                                        </Text>
                                    </TouchableOpacity>
                                    
                                    <MediaGrid
                                        mediaType="photo"
                                        mediaUrls={profile.photos || []}
                                        onDelete={(index) => handleDeleteMedia('photo', index)}
                                        onView={(url, index, fileName) => handleViewMedia(url, index, 'photo', fileName)}
                                        columns={2}
                                    />
                                </View>
                            )}

                            {activeTab === 'videos' && (
                                <View>
                                    <TouchableOpacity
                                        onPress={() => handleAddMedia('video')}
                                        className="bg-emerald-500 rounded-xl p-4 mb-4 flex-row items-center justify-center"
                                    >
                                        <PlusIcon size={20} color="white" />
                                        <Text className="text-white font-semibold ml-2">
                                            {t('dashboard.actions.addVideo', 'Ajouter une vidéo')}
                                        </Text>
                                    </TouchableOpacity>
                                    
                                    <MediaGrid
                                        mediaType="video"
                                        mediaUrls={profile.videos || []}
                                        onDelete={(index) => handleDeleteMedia('video', index)}
                                        onView={(url, index, fileName) => handleViewMedia(url, index, 'video', fileName)}
                                        columns={2}
                                    />
                                </View>
                            )}

                            {activeTab === 'documents' && (
                                <View>
                                    <TouchableOpacity
                                        onPress={() => handleAddMedia('document')}
                                        className="bg-emerald-500 rounded-xl p-4 mb-4 flex-row items-center justify-center"
                                    >
                                        <PlusIcon size={20} color="white" />
                                        <Text className="text-white font-semibold ml-2">
                                            {t('dashboard.actions.addDocument', 'Ajouter un document')}
                                        </Text>
                                    </TouchableOpacity>
                                    
                                    <MediaGrid
                                        mediaType="document"
                                        mediaUrls={profile.documents || []}
                                        onDelete={(index) => handleDeleteMedia('document', index)}
                                        onView={(url, index, fileName) => handleViewMedia(url, index, 'document', fileName)}
                                        columns={1}
                                    />
                                </View>
                            )}
                            <View className="h-20" />
                        </>
                    )}
                </ScrollView>
            </View>
            
            {/* Alerte personnalisée */}
            {AlertComponent}

            {/* Modal de sélection de médias */}
            <MediaPickerModal
                visible={showMediaPicker}
                mediaType={selectedMediaType}
                onClose={() => setShowMediaPicker(false)}
                onUploadSuccess={handleMediaUploadSuccess}
            />

            {/* Modal de visualisation de médias */}
            <MediaViewerModal
                visible={showMediaViewer}
                media={
                    viewerMediaType === 'photo' 
                        ? (profile?.photos || []).map((url, idx) => ({
                            id: `photo-${idx}`,
                            url,
                            type: 'photo' as const,
                            uploadedAt: new Date().toISOString(),
                        }))
                        : viewerMediaType === 'video'
                        ? (profile?.videos || []).map((url, idx) => ({
                            id: `video-${idx}`,
                            url,
                            type: 'video' as const,
                            uploadedAt: new Date().toISOString(),
                        }))
                        : (profile?.documents || []).map((url, idx) => ({
                            id: `document-${idx}`,
                            url,
                            type: 'document' as const,
                            uploadedAt: new Date().toISOString(),
                        }))
                }
                initialIndex={viewerMediaIndex}
                onClose={() => setShowMediaViewer(false)}
            />
        </Modal>
    );
}
