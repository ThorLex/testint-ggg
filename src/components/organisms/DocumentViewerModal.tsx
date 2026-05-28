/**
 * Composant DocumentViewerModal (Organism)
 * 
 * Lecteur de documents intégré pour PDF, PowerPoint, Word, Excel, etc.
 * 
 * @module components/organisms/DocumentViewerModal
 */

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Dimensions,
    StatusBar,
    ActivityIndicator,
    Alert,
    Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    XMarkIcon,
    ArrowTopRightOnSquareIcon,
    ArrowsPointingOutIcon,
    ArrowsPointingInIcon,
    DocumentIcon,
    ExclamationTriangleIcon,
} from 'react-native-heroicons/outline';
import { WebView } from 'react-native-webview';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// Types
// ============================================================================

type DocumentType = 'pdf' | 'office' | 'other';

// ============================================================================
// Props
// ============================================================================

export interface DocumentViewerModalProps {
    /** Visibilité de la modal */
    visible: boolean;
    /** URL du document */
    documentUrl: string;
    /** Nom du fichier */
    fileName?: string;
    /** Index du document */
    documentIndex: number;
    /** Callback de fermeture */
    onClose: () => void;
}

// ============================================================================
// Composant
// ============================================================================

export function DocumentViewerModal({ 
    visible, 
    documentUrl, 
    fileName,
    documentIndex, 
    onClose 
}: DocumentViewerModalProps) {
    const { t } = useTranslation();
    
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // ============================================================================
    // Utilitaires
    // ============================================================================

    const getDocumentType = (url: string, filename?: string): DocumentType => {
        const fileExtension = filename?.split('.').pop()?.toLowerCase() || 
                             url.split('.').pop()?.toLowerCase() || '';
        
        if (fileExtension === 'pdf') {
            return 'pdf';
        }
        
        if (['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'].includes(fileExtension)) {
            return 'office';
        }
        
        return 'other';
    };

    const documentType = getDocumentType(documentUrl, fileName);

    // ============================================================================
    // Handlers
    // ============================================================================

    const handleOpenExternal = async () => {
        try {
            const supported = await Linking.canOpenURL(documentUrl);
            if (supported) {
                await Linking.openURL(documentUrl);
            } else {
                Alert.alert(
                    'Erreur',
                    'Impossible d\'ouvrir le document dans une application externe'
                );
            }
        } catch (error) {
            console.error('Error opening document externally:', error);
            Alert.alert(
                'Erreur',
                'Une erreur est survenue lors de l\'ouverture du document'
            );
        }
    };

    const handleFullscreenToggle = () => {
        setIsFullscreen(!isFullscreen);
    };

    const handleClose = () => {
        setIsLoading(true);
        setHasError(false);
        onClose();
    };

    // ============================================================================
    // Handlers WebView
    // ============================================================================

    const handleWebViewLoadEnd = () => {
        setIsLoading(false);
        setHasError(false);
    };

    const handleWebViewError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    // ============================================================================
    // Rendu du contenu
    // ============================================================================

    const renderPdfViewer = () => {
        // Utiliser Google Docs Viewer pour les PDF
        const pdfViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(documentUrl)}`;
        
        return (
            <WebView
                source={{ uri: pdfViewerUrl }}
                style={{
                    flex: 1,
                    width: SCREEN_WIDTH,
                    height: isFullscreen ? SCREEN_HEIGHT : SCREEN_HEIGHT * 0.8,
                }}
                onLoadEnd={handleWebViewLoadEnd}
                onError={handleWebViewError}
                startInLoadingState={true}
                scalesPageToFit={true}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
            />
        );
    };

    const renderOfficeViewer = () => {
        // Utiliser Microsoft Office Online pour visualiser les documents Office
        const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(documentUrl)}`;
        
        return (
            <WebView
                source={{ uri: officeViewerUrl }}
                style={{
                    flex: 1,
                    width: SCREEN_WIDTH,
                    height: isFullscreen ? SCREEN_HEIGHT : SCREEN_HEIGHT * 0.8,
                }}
                onLoadEnd={handleWebViewLoadEnd}
                onError={handleWebViewError}
                startInLoadingState={true}
                scalesPageToFit={true}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
            />
        );
    };

    const renderErrorState = () => (
        <View className="flex-1 items-center justify-center p-8">
            <View className="bg-gray-800 rounded-2xl p-8 items-center max-w-sm">
                <ExclamationTriangleIcon size={48} color="#EF4444" />
                <Text className="text-white text-lg font-semibold mb-4 text-center">
                    Erreur de chargement
                </Text>
                <Text className="text-gray-300 text-center mb-6">
                    Impossible de charger le document. Vous pouvez essayer de l'ouvrir dans une application externe.
                </Text>
                <TouchableOpacity
                    onPress={handleOpenExternal}
                    className="bg-emerald-500 px-6 py-3 rounded-xl flex-row items-center"
                >
                    <ArrowTopRightOnSquareIcon size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Ouvrir</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderUnsupportedType = () => (
        <View className="flex-1 items-center justify-center p-8">
            <View className="bg-gray-800 rounded-2xl p-8 items-center max-w-sm">
                <DocumentIcon size={48} color="#9CA3AF" />
                <Text className="text-white text-lg font-semibold mb-4 text-center">
                    Type non supporté
                </Text>
                <Text className="text-gray-300 text-center mb-6">
                    Ce type de document ne peut pas être affiché dans l'application. Ouvrez-le dans une application externe.
                </Text>
                <TouchableOpacity
                    onPress={handleOpenExternal}
                    className="bg-emerald-500 px-6 py-3 rounded-xl flex-row items-center"
                >
                    <ArrowTopRightOnSquareIcon size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Ouvrir</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderContent = () => {
        if (hasError) {
            return renderErrorState();
        }

        switch (documentType) {
            case 'pdf':
                return renderPdfViewer();
            case 'office':
                return renderOfficeViewer();
            default:
                return renderUnsupportedType();
        }
    };

    // ============================================================================
    // Rendu principal
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
                {/* Header */}
                {!isFullscreen && (
                    <View className="bg-black/70 pt-12 pb-4">
                        <View className="flex-row items-center justify-between px-4">
                            <View className="flex-1">
                                <Text className="text-white text-lg font-semibold" numberOfLines={1}>
                                    {fileName || `Document ${documentIndex + 1}`}
                                </Text>
                            </View>
                            
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
                                    onPress={handleOpenExternal}
                                    className="w-10 h-10 items-center justify-center rounded-full bg-white/20 mr-3"
                                >
                                    <ArrowTopRightOnSquareIcon size={20} color="white" />
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
                )}

                {/* Contenu du document */}
                <View className="flex-1">
                    {renderContent()}
                </View>

                {/* Indicateur de chargement */}
                {isLoading && (
                    <View className="absolute inset-0 items-center justify-center bg-black/50">
                        <View className="bg-gray-800 rounded-2xl p-6 items-center">
                            <ActivityIndicator size="large" color="#10B981" />
                            <Text className="text-white text-lg mt-4">
                                Chargement du document...
                            </Text>
                        </View>
                    </View>
                )}

                {/* Footer avec informations (mode plein écran) */}
                {isFullscreen && (
                    <View className="absolute bottom-4 left-4 right-4">
                        <View className="bg-black/70 rounded-xl p-3 flex-row items-center justify-between">
                            <Text className="text-white text-sm">
                                {fileName || `Document ${documentIndex + 1}`}
                            </Text>
                            <View className="flex-row items-center">
                                <TouchableOpacity
                                    onPress={handleFullscreenToggle}
                                    className="w-8 h-8 items-center justify-center rounded-full bg-white/20 mr-2"
                                >
                                    <ArrowsPointingInIcon size={16} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleClose}
                                    className="w-8 h-8 items-center justify-center rounded-full bg-white/20"
                                >
                                    <XMarkIcon size={16} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </Modal>
    );
}