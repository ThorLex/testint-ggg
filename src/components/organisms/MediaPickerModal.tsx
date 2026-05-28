/**
 * Composant MediaPickerModal (Organism)
 * 
 * Modal pour sélectionner et uploader des médias (photos, vidéos, documents).
 * 
 * @module components/organisms/MediaPickerModal
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    XMarkIcon,
    PhotoIcon,
    VideoCameraIcon,
    DocumentIcon,
    CameraIcon,
    FolderIcon,
} from 'react-native-heroicons/outline';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

// Hooks & Services
import { useUploadMedia } from '@/hooks/useApi';
import { useCustomAlert, showSuccessAlert, showErrorAlert } from '@/hooks/useCustomAlert';
import type { MediaType } from '@/types';

// ============================================================================
// Props
// ============================================================================

export interface MediaPickerModalProps {
    /** Visibilité de la modal */
    visible: boolean;
    /** Type de média à uploader */
    mediaType: MediaType;
    /** Callback de fermeture */
    onClose: () => void;
    /** Callback de succès d'upload */
    onUploadSuccess?: (url: string) => void;
}

// ============================================================================
// Composant
// ============================================================================

export function MediaPickerModal({ 
    visible, 
    mediaType, 
    onClose, 
    onUploadSuccess 
}: MediaPickerModalProps) {
    const { t } = useTranslation();
    const uploadMutation = useUploadMedia();
    const { AlertComponent, showAlert } = useCustomAlert();
    
    const [isUploading, setIsUploading] = useState(false);

    // ============================================================================
    // Handlers de sélection
    // ============================================================================

    /**
     * Sélectionner une photo depuis la galerie
     */
    const handlePickImageFromGallery = async () => {
        try {
            console.log('🔍 Demande permission galerie...');
            
            // Demander les permissions avec plus de détails
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync(false);
            
            console.log('📱 Permission galerie:', {
                status: permissionResult.status,
                granted: permissionResult.granted,
                canAskAgain: permissionResult.canAskAgain,
                expires: permissionResult.expires
            });
            
            if (!permissionResult.granted) {
                console.warn('❌ Permission galerie refusée');
                
                if (permissionResult.canAskAgain) {
                    showAlert(showErrorAlert(
                        'Permission requise',
                        'L\'accès à la galerie est nécessaire pour sélectionner des médias. Veuillez autoriser l\'accès.'
                    ));
                } else {
                    showAlert(showErrorAlert(
                        'Permission refusée définitivement',
                        'Veuillez aller dans Paramètres → Applications → Navipad → Autorisations et activer l\'accès aux médias.'
                    ));
                }
                return;
            }

            console.log('✅ Permission galerie accordée, ouverture galerie...');

            // Sélectionner l'image/vidéo avec options améliorées
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: mediaType === 'photo' 
                    ? ImagePicker.MediaTypeOptions.Images 
                    : ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: false, // Désactiver l'édition pour éviter les erreurs
                quality: 0.8,
                allowsMultipleSelection: false,
                exif: false, // Désactiver les données EXIF pour réduire la taille
            });

            console.log('📸 Résultat sélection galerie:', {
                canceled: result.canceled,
                assetsCount: result.assets?.length || 0,
                firstAsset: result.assets?.[0] ? {
                    uri: result.assets[0].uri,
                    type: result.assets[0].type,
                    fileName: result.assets[0].fileName,
                    fileSize: result.assets[0].fileSize
                } : null
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                console.log('✅ Fichier sélectionné:', result.assets[0]);
                await handleUpload(result.assets[0]);
            } else {
                console.log('ℹ️ Sélection annulée par l\'utilisateur');
            }
        } catch (error) {
            console.error('❌ Erreur sélection galerie:', error);
            
            // Messages d'erreur plus spécifiques
            let errorMessage = 'Erreur inconnue';
            if (error instanceof Error) {
                if (error.message.includes('ExponentImagePicker')) {
                    errorMessage = 'Erreur du sélecteur d\'images. Redémarrez l\'application et réessayez.';
                } else if (error.message.includes('permission')) {
                    errorMessage = 'Permissions insuffisantes. Vérifiez les autorisations dans les paramètres.';
                } else {
                    errorMessage = error.message;
                }
            }
            
            showAlert(showErrorAlert(
                'Erreur d\'accès à la galerie',
                errorMessage
            ));
        }
    };

    /**
     * Prendre une photo avec la caméra
     */
    const handleTakePhoto = async () => {
        try {
            console.log('🔍 Demande permission caméra...');
            
            // Demander les permissions
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            
            console.log('📱 Permission caméra:', permissionResult);
            
            if (!permissionResult.granted) {
                console.warn('❌ Permission caméra refusée');
                showAlert(showErrorAlert(
                    'Permission requise',
                    'L\'accès à la caméra est nécessaire pour prendre des photos. Veuillez autoriser l\'accès dans les paramètres de l\'application.'
                ));
                return;
            }

            console.log('✅ Permission caméra accordée, ouverture caméra...');

            // Prendre la photo
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            console.log('📸 Résultat prise photo:', result);

            if (!result.canceled && result.assets[0]) {
                console.log('✅ Photo prise:', result.assets[0]);
                await handleUpload(result.assets[0]);
            } else {
                console.log('ℹ️ Prise de photo annulée par l\'utilisateur');
            }
        } catch (error) {
            console.error('❌ Erreur prise photo:', error);
            showAlert(showErrorAlert(
                'Erreur caméra',
                `Impossible d'accéder à la caméra: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
            ));
        }
    };

    /**
     * Sélectionner un document
     */
    const handlePickDocument = async () => {
        try {
            console.log('🔍 Ouverture sélecteur de documents...');
            
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-powerpoint',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'text/plain',
                    'image/*', // Permettre aussi les images
                ],
                copyToCacheDirectory: true,
                multiple: false,
            });

            console.log('📄 Résultat sélection document:', {
                canceled: result.canceled,
                assetsCount: result.assets?.length || 0,
                firstAsset: result.assets?.[0] ? {
                    name: result.assets[0].name,
                    size: result.assets[0].size,
                    mimeType: result.assets[0].mimeType,
                    uri: result.assets[0].uri
                } : null
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const selectedFile = result.assets[0];
                console.log('✅ Document sélectionné:', {
                    name: selectedFile.name,
                    size: selectedFile.size,
                    mimeType: selectedFile.mimeType,
                    uri: selectedFile.uri
                });

                // Vérifier la taille du fichier (max 10MB)
                if (selectedFile.size && selectedFile.size > 10 * 1024 * 1024) {
                    showAlert(showErrorAlert(
                        'Fichier trop volumineux',
                        'La taille du fichier ne doit pas dépasser 10 MB.'
                    ));
                    return;
                }

                // Validation améliorée du type de fichier
                const supportedMimeTypes = [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-powerpoint',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'text/plain',
                    'image/jpeg',
                    'image/png',
                    'image/gif',
                ];

                const fileName = selectedFile.name || 'document';
                const fileExtension = fileName.split('.').pop()?.toLowerCase();
                const supportedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'gif'];

                // Vérifier le type MIME ET l'extension
                const mimeTypeValid = selectedFile.mimeType && supportedMimeTypes.includes(selectedFile.mimeType);
                const extensionValid = fileExtension && supportedExtensions.includes(fileExtension);

                if (!mimeTypeValid && !extensionValid) {
                    console.warn('❌ Type de fichier non supporté:', {
                        mimeType: selectedFile.mimeType,
                        extension: fileExtension,
                        fileName: fileName
                    });
                    
                    showAlert(showErrorAlert(
                        'Type de fichier non supporté',
                        `Types supportés: PDF, Word, Excel, PowerPoint, Texte, Images.\n\nFichier détecté:\n• Nom: ${fileName}\n• Type: ${selectedFile.mimeType || 'inconnu'}\n• Extension: ${fileExtension || 'aucune'}`
                    ));
                    return;
                }

                console.log('✅ Type de fichier validé:', {
                    mimeType: selectedFile.mimeType,
                    extension: fileExtension,
                    mimeTypeValid,
                    extensionValid
                });

                await handleUpload(selectedFile);
            } else {
                console.log('ℹ️ Sélection de document annulée par l\'utilisateur');
            }
        } catch (error) {
            console.error('❌ Erreur sélection document:', error);
            
            let errorMessage = 'Erreur inconnue';
            if (error instanceof Error) {
                if (error.message.includes('User cancelled')) {
                    console.log('ℹ️ Utilisateur a annulé la sélection');
                    return; // Ne pas afficher d'erreur si l'utilisateur annule
                } else {
                    errorMessage = error.message;
                }
            }
            
            showAlert(showErrorAlert(
                'Erreur de sélection',
                `Impossible de sélectionner le document: ${errorMessage}`
            ));
        }
    };

    /**
     * Uploader le fichier sélectionné
     */
    const handleUpload = async (asset: any) => {
        try {
            console.log('🚀 Début upload:', {
                type: mediaType,
                fileName: asset.name,
                fileSize: asset.size,
                mimeType: asset.mimeType,
                uri: asset.uri
            });

            setIsUploading(true);

            // Uploader directement l'asset (ImagePicker/DocumentPicker)
            const uploadResult = await uploadMutation.mutateAsync({
                type: mediaType,
                file: asset,
            });

            console.log('✅ Upload réussi:', uploadResult);

            // Succès - afficher un message de succès avec prévisualisation
            showAlert(showSuccessAlert(
                'Upload réussi',
                `${getMediaTypeLabel(mediaType)} "${asset.name || 'Sans nom'}" ajouté avec succès. Il apparaîtra dans votre espace après fermeture de cette fenêtre.`
            ));

            onUploadSuccess?.(uploadResult.url);

        } catch (error: any) {
            console.error('❌ Erreur upload:', error);
            
            let errorMessage = 'Erreur inconnue';
            
            if (error?.message) {
                if (error.message.includes('Upload failed')) {
                    errorMessage = 'Échec de l\'upload - Vérifiez votre connexion internet';
                } else if (error.message.includes('type de fichier')) {
                    errorMessage = error.message;
                } else if (error.message.includes('taille')) {
                    errorMessage = 'Fichier trop volumineux (max 10MB)';
                } else {
                    errorMessage = error.message;
                }
            }
            
            showAlert(showErrorAlert(
                'Erreur d\'upload',
                `Impossible d'uploader ${getMediaTypeLabel(mediaType).toLowerCase()}: ${errorMessage}`
            ));
        } finally {
            setIsUploading(false);
        }
    };

    // ============================================================================
    // Utilitaires
    // ============================================================================

    const getMediaTypeLabel = (type: MediaType): string => {
        switch (type) {
            case 'photo': return 'Photo';
            case 'video': return 'Vidéo';
            case 'document': return 'Document';
            default: return 'Média';
        }
    };

    const getMediaIcon = (type: MediaType) => {
        switch (type) {
            case 'photo': return <PhotoIcon size={24} color="#10B981" />;
            case 'video': return <VideoCameraIcon size={24} color="#10B981" />;
            case 'document': return <DocumentIcon size={24} color="#10B981" />;
            default: return <PhotoIcon size={24} color="#10B981" />;
        }
    };

    // ============================================================================
    // Rendu
    // ============================================================================

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-gray-50 dark:bg-gray-900">
                {/* Header */}
                <View className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 pt-12 pb-4">
                    <View className="flex-row items-center justify-between px-4">
                        <View className="flex-row items-center">
                            {getMediaIcon(mediaType)}
                            <Text className="text-xl font-bold text-gray-900 dark:text-white ml-3">
                                Ajouter {getMediaTypeLabel(mediaType).toLowerCase()}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
                        >
                            <XMarkIcon size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Contenu */}
                <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
                    {isUploading ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <ActivityIndicator size="large" color="#10B981" />
                            <Text className="text-gray-500 dark:text-gray-400 mt-4 text-center">
                                Upload en cours...
                            </Text>
                        </View>
                    ) : (
                        <View className="space-y-4">
                            {/* Options pour photos et vidéos */}
                            {(mediaType === 'photo' || mediaType === 'video') && (
                                <>
                                    {/* Galerie */}
                                    <TouchableOpacity
                                        onPress={handlePickImageFromGallery}
                                        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                                    >
                                        <View className="flex-row items-center">
                                            <View className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-xl items-center justify-center">
                                                <FolderIcon size={24} color="#10B981" />
                                            </View>
                                            <View className="flex-1 ml-4">
                                                <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    Choisir depuis la galerie
                                                </Text>
                                                <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                                    Sélectionner {mediaType === 'photo' ? 'une photo' : 'une vidéo'} existante
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>

                                    {/* Caméra (seulement pour photos) */}
                                    {mediaType === 'photo' && (
                                        <TouchableOpacity
                                            onPress={handleTakePhoto}
                                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                                        >
                                            <View className="flex-row items-center">
                                                <View className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl items-center justify-center">
                                                    <CameraIcon size={24} color="#3B82F6" />
                                                </View>
                                                <View className="flex-1 ml-4">
                                                    <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        Prendre une photo
                                                    </Text>
                                                    <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                                        Utiliser l'appareil photo
                                                    </Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}

                            {/* Option pour documents */}
                            {mediaType === 'document' && (
                                <TouchableOpacity
                                    onPress={handlePickDocument}
                                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                                >
                                    <View className="flex-row items-center">
                                        <View className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl items-center justify-center">
                                            <DocumentIcon size={24} color="#F97316" />
                                        </View>
                                        <View className="flex-1 ml-4">
                                            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                                                Choisir un document
                                            </Text>
                                            <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                                PDF, Word, Excel, etc.
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}

                            {/* Informations détaillées */}
                            <View className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 mt-6">
                                <Text className="text-blue-800 dark:text-blue-200 text-sm font-semibold mb-2">
                                    Informations importantes :
                                </Text>
                                <Text className="text-blue-800 dark:text-blue-200 text-sm mb-2">
                                    • Taille maximale : 10 MB par fichier
                                </Text>
                                {mediaType === 'document' && (
                                    <Text className="text-blue-800 dark:text-blue-200 text-sm mb-2">
                                        • Types supportés : PDF, Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx), Texte (.txt)
                                    </Text>
                                )}
                                {(mediaType === 'photo' || mediaType === 'video') && (
                                    <Text className="text-blue-800 dark:text-blue-200 text-sm mb-2">
                                        • Formats supportés : JPEG, PNG, MP4, MOV
                                    </Text>
                                )}
                                <Text className="text-blue-800 dark:text-blue-200 text-sm">
                                    • Les fichiers sont automatiquement optimisés pour le web
                                </Text>
                            </View>

                            {/* Aide pour les permissions */}
                            <View className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 mt-4">
                                <Text className="text-amber-800 dark:text-amber-200 text-sm font-semibold mb-2">
                                    Problème d'accès ?
                                </Text>
                                <Text className="text-amber-800 dark:text-amber-200 text-sm">
                                    Si vous ne pouvez pas accéder à la galerie ou à la caméra, vérifiez les permissions dans les paramètres de votre téléphone :
                                    Paramètres → Applications → Navipad → Autorisations
                                </Text>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </View>

            {/* Alerte personnalisée */}
            {AlertComponent}
        </Modal>
    );
}