/**
 * Composant AmodiataireDetailsPage (Organism)
 * 
 * Page complète des détails d'un amodiataire avec la liste de tous ses bâtiments.
 * Affiche les coordonnées et permet de démarrer la navigation vers chaque bâtiment.
 * 
 * @module components/organisms/AmodiataireDetailsPage
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    XMarkIcon,
    MapPinIcon,
    BuildingOffice2Icon,
    ArrowTopRightOnSquareIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ArrowLeftIcon,
} from 'react-native-heroicons/outline';

// Hooks & Types
import { useAmodiataireDetail } from '@/hooks';
import { NavigationModal } from './NavigationModal';
import { MediaGallery } from '../molecules/MediaGallery';
import { MediaViewerModal } from './MediaViewerModal';
import { closeAllBottomSheets } from '@/utils/navigationHelpers';
import { AmodiataireAnnouncements } from '../molecules/AmodiataireAnnouncements';
import { BottomSheet } from '@/components/molecules/BottomSheet';
import { HtmlRenderer } from '../atoms/HtmlRenderer';
import { DataErrorState } from '@/components/molecules/DataErrorState';
import type { MediaItem } from '@/types/api';

// ============================================================================
// Props
// ============================================================================

export interface AmodiataireDetailsPageProps {
    /** Visibilité de la modal */
    visible: boolean;
    /** Callback de fermeture */
    onClose: () => void;
    /** ID de l'amodiataire */
    amodiataireId: string | null;
    /** Callback appelé quand la navigation démarre */
    onNavigationStart?: () => void;
    /** Callback appelé quand une route est sélectionnée pour la navigation */
    onRouteSelected?: (route: any) => void;
}

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant AmodiataireDetailsPage
 */
export function AmodiataireDetailsPage({
    visible,
    onClose,
    amodiataireId,
    onNavigationStart,
    onRouteSelected,
}: AmodiataireDetailsPageProps) {
    const { t } = useTranslation();
    const [showNavigation, setShowNavigation] = useState(false);
    const [selectedCoordinates, setSelectedCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<string>('');
    
    // État pour la section sites rétractable (rétractée par défaut)
    const [isSitesExpanded, setIsSitesExpanded] = useState(false);
    
    // État pour le viewer de médias
    const [showMediaViewer, setShowMediaViewer] = useState(false);
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
    const [buildingCoordinates, setBuildingCoordinates] = useState<{ latitude: number; longitude: number }[] | undefined>(undefined);

    // Hook API pour charger les détails
    const { data: detailsResponse, isLoading, isError, refetch } = useAmodiataireDetail(amodiataireId || '');
    
    // Extraire les données de l'amodiataire (l'API retourne { success: boolean, amodiataire: AmodiatairDetails })
    const details = detailsResponse?.amodiataire;

    // Initial log for diagnostic
    React.useEffect(() => {
        if (details) {
            console.log('--------------------------------------------------');
            console.log('📄 [AmodiataireDetailsPage] Détails chargés');
            console.log('🆔 ID:', details.id);
            console.log('📦 Structure:', JSON.stringify({
                hasLot: !!details.lot,
                lotCoords: details.lot?.coordinates?.length,
                directCoords: (details as any).coordinates?.length,
                batiments: (details.lot?.batiments || (details as any).batiments)?.length
            }));
            console.log('--------------------------------------------------');
        }
    }, [details]);

    // ============================================================================
    // Conversion des médias pour affichage en lecture seule
    // Convertir la structure media de l'API en MediaItems
    // ============================================================================
    const mediaItems = React.useMemo(() => {
        const images: MediaItem[] = [];
        const videos: MediaItem[] = [];
        const documents: MediaItem[] = [];
        const raisonS = details?.lot.raisonSociale;
        if (details?.media) {
            // Traiter les images
            if (details.media.images && Array.isArray(details.media.images)) {
                images.push(...details.media.images.map((img: any) => ({
                    id: img.id || `image-${Math.random()}`,
                    url: img.url,
                    thumbnailUrl: img.thumbnailUrl,
                    uploadedAt: img.createdAt || new Date().toISOString(),
                    type: 'photo' as const,
                    title: img.title,
                    description: img.description,
                })));
            }
            
            // Traiter les vidéos
            if (details.media.videos && Array.isArray(details.media.videos)) {
                videos.push(...details.media.videos.map((vid: any) => ({
                    id: vid.id || `video-${Math.random()}`,
                    url: vid.url,
                    thumbnailUrl: vid.thumbnailUrl,
                    uploadedAt: vid.createdAt || new Date().toISOString(),
                    type: 'video' as const,
                    title: vid.title,
                    description: vid.description,
                })));
            }
            
            // Traiter les documents
            if (details.media.documents && Array.isArray(details.media.documents)) {
                documents.push(...details.media.documents.map((doc: any) => ({
                    id: doc.id || `document-${Math.random()}`,
                    url: doc.url,
                    uploadedAt: doc.createdAt || new Date().toISOString(),
                    type: 'document' as const,
                    title: doc.title,
                    description: doc.description,
                })));
            }
        }
        
        return { images, videos, documents, raisonS };
    }, [details]);

    // Mémoïser la liste des bâtiments pour éviter les recalculs
    const batiments = React.useMemo(
        () => details?.lot?.batiments ?? [],
        [details?.lot?.batiments]
    );
    


    // ============================================================================
    // Handlers
    // ============================================================================

    /**
     * Gère l'ouverture d'un média en plein écran
     */
    const handleMediaPress = (item: MediaItem) => {
        // Utiliser uniquement les images (pas les vidéos)
        const allMedia = mediaItems.images;
        const index = allMedia.findIndex(m => m.id === item.id);
        if (index !== -1) {
            setSelectedMediaIndex(index);
            setShowMediaViewer(true);
        }
    };

    /**
     * Gère la navigation vers un bâtiment
     */
    const handleNavigateToBuilding = React.useCallback((
        coordinates: { lat: number; lng: number } | { latitude: number; longitude: number },
        address?: string,
        item?: any
    ) => {
        // Normaliser les coordonnées
        const lat = 'lat' in coordinates ? coordinates.lat : coordinates.latitude;
        const lng = 'lng' in coordinates ? coordinates.lng : coordinates.longitude;
        
        // Extraire le footprint si disponible dans l'item ou le lot global
        let footprint: { latitude: number; longitude: number }[] | undefined = undefined;
        
        // 1. Chercher dans l'item cliqué
        if (item?.coordinates && Array.isArray(item.coordinates) && item.coordinates.length > 2) {
            footprint = item.coordinates.map((c: any) => ({
                latitude: Number(c.latitude || c.lat),
                longitude: Number(c.longitude || c.lng)
            })).filter((p: any) => !isNaN(p.latitude) && !isNaN(p.longitude));
        }
        
        // 2. Fallback: Chercher dans le lot global si l'item n'a pas de coordinates
        if (!footprint && details) {
            const lot = details.lot || details;
            if (lot?.coordinates && Array.isArray(lot.coordinates) && lot.coordinates.length > 2) {
                console.log('📍 [AmodiataireDetailsPage] Utilisation du footprint global (fallback)');
                footprint = lot.coordinates.map((c: any) => ({
                    latitude: Number(c.latitude || c.lat),
                    longitude: Number(c.longitude || c.lng)
                })).filter((p: any) => !isNaN(p.latitude) && !isNaN(p.longitude));
            }
        }
        
        console.log('🚀 [AmodiataireDetailsPage] handleNavigateToBuilding:', JSON.stringify({
            lat, lng, hasFootprint: !!footprint, footprintPoints: footprint?.length
        }));

        setSelectedCoordinates({ latitude: lat, longitude: lng });
        setSelectedAddress(address || '');
        setBuildingCoordinates(footprint);
        setShowNavigation(true);
    }, [details]);

    /**
     * Rendu d'un bâtiment/lot — mémoïsé pour éviter les re-renders inutiles
     */
    const renderBuilding = React.useCallback(({ item, index }: { item: any; index: number }) => {
        // Extraire les coordonnées du center du bâtiment
        const lat = item?.center?.lat ?? item?.lat ?? item?.latitude;
        const lng = item?.center?.lng ?? item?.lng ?? item?.longitude;
        
        // Vérifier que les coordonnées sont valides
        if (lat === undefined || lng === undefined) {
            return null;
        }
        
        // Nom du bâtiment — essayer plusieurs champs possibles
        const buildingName = item?.nom || item?.raisonSociale || item?.name || item?.label || `Bâtiment ${index + 1}`;
        
        // Adresse
        const displayAddress = item?.adresse || item?.adresseAlphanumerique || item?.adresseAlphanumérique || '';
        
        // Numéro de lot
        const lotNumber = item?.numeroLot || item?.numero_lot || '';
        
        // Superficie
        const superficie = item?.superficie ? `${item.superficie} m²` : null;
        
        // Catégorie
        const category = item?.categorie || item?.category || item?.type || null;
        
        return (
            <TouchableOpacity
                onPress={() => handleNavigateToBuilding({ lat, lng }, item?.adresse || buildingName, item)}
                className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 mb-3 border border-gray-200 dark:border-gray-600"
                activeOpacity={0.7}
            >
                <View className="flex-row items-center">
                    {/* Icône */}
                    <View className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-xl items-center justify-center mr-3 flex-shrink-0">
                        <BuildingOffice2Icon size={24} color="#10B981" />
                    </View>

                    {/* Informations */}
                    <View className="flex-1">
                        {/* Nom principal */}
                        <Text className="text-gray-900 dark:text-white font-bold text-base" numberOfLines={1}>
                            {buildingName}
                        </Text>
                        
                        {/* Numéro de lot */}
                        {lotNumber ? (
                            <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold mt-0.5">
                                Lot {lotNumber}
                            </Text>
                        ) : null}

                        {/* Adresse */}
                        {displayAddress ? (
                            <View className="flex-row items-center mt-1">
                                <MapPinIcon size={12} color="#9CA3AF" />
                                <Text className="text-gray-500 dark:text-gray-400 text-xs ml-1 flex-1" numberOfLines={1}>
                                    {displayAddress}
                                </Text>
                            </View>
                        ) : null}

                        {/* Ligne inférieure : catégorie + superficie */}
                        {(category || superficie) ? (
                            <View className="flex-row items-center gap-2 mt-1">
                                {category ? (
                                    <View className="bg-blue-100 dark:bg-blue-900 rounded-full px-2 py-0.5">
                                        <Text className="text-blue-700 dark:text-blue-300 text-xs font-medium">
                                            {category}
                                        </Text>
                                    </View>
                                ) : null}
                                {superficie ? (
                                    <Text className="text-gray-400 dark:text-gray-500 text-xs">
                                        {superficie}
                                    </Text>
                                ) : null}
                            </View>
                        ) : null}
                    </View>

                    {/* Bouton navigation */}
                    <View className="w-9 h-9 bg-emerald-500 rounded-full items-center justify-center ml-2 flex-shrink-0">
                        <ArrowTopRightOnSquareIcon size={18} color="white" />
                    </View>
                </View>
            </TouchableOpacity>
        );
    }, [handleNavigateToBuilding]);

    // ============================================================================
    // Rendu Principal
    // ============================================================================

    return (
        <>
            <BottomSheet
                visible={visible}
                onClose={onClose}
                maxHeight={98}
                showHandle={true}
                scrollable={true}
            >
                {/* Header */}
                <View className="px-4 pt-2 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                            {/* Bouton Retour */}
                            <TouchableOpacity
                                onPress={onClose}
                                className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 mr-3"
                            >
                                <ArrowLeftIcon size={24} color="#10B981" />
                            </TouchableOpacity>

                            {/* Logo subtil */}
                            <View className="mr-3">
                                <Image
                                    source={require('../../../assets/icon.png')}
                                    className="w-8 h-8 opacity-60"
                                    resizeMode="contain"
                                />
                            </View>
                            
                            <View className="flex-1 pr-2">
                                {/* Username */}
                                <Text className="text-2xl font-black text-black dark:text-white">
                                    {/*details?.profile?.username || t('amodiataireDetails.defaultTitle', 'Amodiataire')*/}
                                    {mediaItems.raisonS}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-8 h-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
                        >
                            <XMarkIcon size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Contenu */}
                <View className="px-4 pt-4">
                    {isLoading ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <ActivityIndicator size="large" color="#10B981" />
                            <Text className="text-gray-500 dark:text-gray-400 mt-4">
                                {t('common.loading', 'Chargement...')}
                            </Text>
                        </View>
                    ) : isError || !details ? (
                        <DataErrorState 
                            onRetry={() => refetch()}
                        />
                    ) : (
                        <>
                            {details.profile?.biography && (
                                <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                    <Text className="text-lg font-black text-black dark:text-white mb-3 uppercase tracking-wider">
                                        {t('amodiataireDetails.sections.bibliography', 'Bibliographie')}
                                    </Text>
                                    <ScrollView 
                                        className="max-h-32 bg-gray-50 dark:bg-gray-900 rounded-xl"
                                        contentContainerStyle={{ padding: 12 }}
                                        showsVerticalScrollIndicator={true}
                                        nestedScrollEnabled={true}
                                    >
                                        <HtmlRenderer 
                                            html={details.profile.biography} 
                                            style={{ fontSize: 14, lineHeight: 20 }}
                                        />
                                    </ScrollView>

                                    {/* Section Photo(s) juste en dessous du textarea - Carousel d'images uniquement */}
                                    <View className="mt-4">
                                        <MediaGallery
                                            media={mediaItems.images}
                                            loading={false}
                                            carousel={true}
                                            onMediaPress={handleMediaPress}
                                        />
                                    </View>
                                </View>
                            )}

                            {/* Section Contact */}
                            <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                <Text className="text-lg font-black text-black dark:text-white mb-3 uppercase tracking-wider">
                                    {t('amodiataireDetails.sections.contact', 'Contact')}
                                </Text>

                                {/* Grille 2 colonnes */}
                                <View className="flex-row flex-wrap -mx-2">
                                    {/* Email */}
                                    {details.profile?.email && (
                                        <View className="w-1/2 px-2 mb-3">
                                            <Text className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">
                                                {t('amodiataireDetails.fields.email', 'Email')}
                                            </Text>
                                            <Text className="text-emerald-600 dark:text-emerald-400 text-sm" numberOfLines={1}>
                                                {details.profile.email}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Téléphone */}
                                    {details.profile?.phone && (
                                        <View className="w-1/2 px-2 mb-3">
                                            <Text className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">
                                                {t('amodiataireDetails.fields.phone', 'Téléphone')}
                                            </Text>
                                            <Text className="text-gray-900 dark:text-white text-sm" numberOfLines={1}>
                                                {details.profile.phone}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Site web */}
                                    {details.profile?.website && (
                                        <View className="w-1/2 px-2 mb-3">
                                            <Text className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">
                                                {t('amodiataireDetails.fields.website', 'Site web')}
                                            </Text>
                                            <Text className="text-emerald-600 dark:text-emerald-400 text-sm" numberOfLines={1}>
                                                {details.profile.website}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Adresse - Pleine largeur */}
                                {details.lot?.adresse && (
                                    <View className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                        {/*<Text className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold mb-1">
                                            {t('amodiataireDetails.fields.address', 'Adresse')}
                                        </Text>
                                        <Text className="text-gray-900 dark:text-white text-sm">
                                            {details.lot.adresse}
                                        </Text>*/}
                                    </View>
                                )}
                            </View>

                            {/* Section Annonces - Données de l'API */}
                            {details.announcements && details.announcements.length > 0 && (
                                <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                    <Text className="text-lg font-black text-black dark:text-white mb-3 uppercase tracking-wider">
                                        {t('amodiataireDetails.sections.announcements', 'Annonces')}
                                    </Text>
                                    <AmodiataireAnnouncements announcements={details.announcements as any} />
                                </View>
                            )}

                            {/* Section Sites rétractable */}
                            <View className="bg-white dark:bg-gray-800 rounded-2xl mb-4 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                {/* Header cliquable */}
                                <TouchableOpacity
                                    onPress={() => setIsSitesExpanded(!isSitesExpanded)}
                                    className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700"
                                    activeOpacity={0.7}
                                >
                                    <View className="flex-row items-center flex-1">
                                        <BuildingOffice2Icon size={20} color="#10B981" />
                                        <Text className="text-lg font-black text-black dark:text-white ml-2 uppercase tracking-wider">
                                            {t('amodiataireDetails.sections.sites', 'Site(s)')}
                                        </Text>
                                        {(details.lot?.batiments?.length || 0) > 0 && (
                                            <View className="ml-2 bg-emerald-100 dark:bg-emerald-900 rounded-full px-2 py-0.5">
                                                <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                                    {batiments.length}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    {isSitesExpanded ? (
                                        <ChevronUpIcon size={20} color="#9CA3AF" />
                                    ) : (
                                        <ChevronDownIcon size={20} color="#9CA3AF" />
                                    )}
                                </TouchableOpacity>
                                
                                {/* Contenu rétractable */}
                                {isSitesExpanded && (
                                    <View className="p-4">
                                        {batiments.length > 0 ? (
                                            batiments.map((item: any, index: number) => (
                                                <React.Fragment key={item.id || `building-${index}`}>
                                                    {renderBuilding({ item, index })}
                                                </React.Fragment>
                                            ))
                                        ) : (
                                            <View className="py-8 items-center justify-center">
                                                <BuildingOffice2Icon size={48} color="#D1D5DB" />
                                                <Text className="text-gray-500 dark:text-gray-400 text-center mt-3">
                                                    {t('amodiataireDetails.messages.noSites', 'Aucun site enregistré')}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>

                            {/* Espacement en bas */}
                            <View className="h-20" />
                        </>
                    )}
                </View>
            </BottomSheet>

            {/* Modal de navigation */}
            <NavigationModal
                visible={showNavigation}
                onClose={() => setShowNavigation(false)}
                destination={selectedCoordinates}
                destinationAddress={selectedAddress}
                buildingCoordinates={buildingCoordinates}
                amodiataireName={details?.lot?.raisonSociale || details?.profile?.username || undefined}
                onRouteSelected={(route) => {
                    console.log('📍 AmodiataireDetailsPage: Route reçue pour navigation:', route);
                    // NE PAS fermer le modal ici - attendre que l'utilisateur clique sur "Démarrer"
                    // Passer la route au parent (app/index.tsx) pour afficher le polyline sur la carte
                    if (onRouteSelected) {
                        onRouteSelected(route);
                    }
                }}
                onNavigationStart={() => {
                    console.log('🔒 AmodiataireDetailsPage: Navigation démarrée');
                    
                    // Fermer le modal de navigation
                    setShowNavigation(false);
                    
                    // Appeler directement le callback parent (closeAllBottomSheets)
                    if (onNavigationStart) {
                        onNavigationStart();
                    } else {
                        console.log('❌ Pas de callback parent, fermeture manuelle');
                        onClose();
                        closeAllBottomSheets();
                    }
                }}
            />

            {/* Modal de visualisation des médias (images uniquement) */}
            <MediaViewerModal
                visible={showMediaViewer}
                onClose={() => setShowMediaViewer(false)}
                media={mediaItems.images}
                initialIndex={selectedMediaIndex}
            />
        </>
    );
}
