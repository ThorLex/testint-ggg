/**
 * Composant MediaUploadSection (Organism)
 * 
 * Section complète pour l'upload et l'affichage de médias.
 * Intègre MediaUploadButton et MediaGallery avec gestion d'état complète.
 * 
 * Requirements: 1.1, 2.1, 2.2, 2.4, 2.5, 2.6, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 6.1, 6.2, 6.3
 * 
 * @module components/organisms/MediaUploadSection
 */

import React, { useState } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Components
import { MediaUploadButton } from '../atoms/MediaUploadButton';
import { MediaGallery } from '../molecules/MediaGallery';

// Hooks & Utils
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { getValidationError } from '@/utils/mediaValidation';
import { compressImage } from '@/utils/imageCompression';

// Types
import type { MediaItem } from '@/types/api';

// ============================================================================
// Props
// ============================================================================

export interface MediaUploadSectionProps {
    /** ID de l'amodiataire */
    amodiataireId: string;
    /** Médias existants */
    existingMedia?: MediaItem[];
    /** Callback après upload réussi */
    onUploadSuccess?: (media: MediaItem) => void;
}

// ============================================================================
// Types d'état
// ============================================================================

type UploadState = 'idle' | 'loading' | 'success' | 'error';

// ============================================================================
// Composant
// ============================================================================

export function MediaUploadSection({
    amodiataireId,
    existingMedia = [],
    onUploadSuccess,
}: MediaUploadSectionProps) {
    // ============================================================================
    // État
    // ============================================================================

    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Hook d'upload
    const { uploadMedia, isLoading } = useMediaUpload(amodiataireId);

    // ============================================================================
    // Gestion des permissions
    // Requirement 1.1: Request media library permissions
    // Requirement 1.2: Handle permission status changes
    // ============================================================================

    const requestPermissions = async (): Promise<boolean> => {
        // Demander les permissions
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (!permissionResult.granted) {
            // Vérifier si on peut redemander la permission
            if (permissionResult.canAskAgain) {
                // Permission refusée mais peut être redemandée
                Alert.alert(
                    'Permission requise',
                    'L\'accès à la bibliothèque de photos est nécessaire pour uploader des images. Veuillez autoriser l\'accès.',
                    [{ text: 'OK' }]
                );
            } else {
                // Permission refusée définitivement - guider vers les paramètres
                Alert.alert(
                    'Permission refusée',
                    'Veuillez aller dans Paramètres → Applications → Navipad → Autorisations et activer l\'accès aux médias.',
                    [{ text: 'OK' }]
                );
            }
            return false;
        }
        
        return true;
    };

    // ============================================================================
    // Sélection d'image
    // Requirement 1.1, 1.2: Open image picker and allow selection
    // ============================================================================

    const pickImage = async () => {
        try {
            // Demander les permissions
            const hasPermission = await requestPermissions();
            if (!hasPermission) return;

            // Ouvrir le sélecteur d'images
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.8,
                allowsMultipleSelection: false,
            });

            // Vérifier si l'utilisateur a annulé
            if (result.canceled || !result.assets[0]) {
                return;
            }

            const asset = result.assets[0];
            
            // Valider le fichier
            await validateAndUpload(asset);
        } catch (error) {
            console.error('Error picking image:', error);
            showError('Une erreur est survenue lors de la sélection de l\'image');
        }
    };

    // ============================================================================
    // Validation et upload
    // Requirements 1.3, 1.4, 1.5, 1.6: Validate file type and size
    // Requirements 2.1, 2.2: Initiate upload and show loading state
    // ============================================================================

    const validateAndUpload = async (asset: ImagePicker.ImagePickerAsset) => {
        try {
            // Préparer les données du fichier pour validation
            const fileData = {
                uri: asset.uri,
                mimeType: asset.mimeType || 'image/jpeg',
                size: asset.fileSize || 0,
            };

            // Valider le fichier
            const validationError = getValidationError(fileData);
            if (validationError) {
                showError(validationError);
                return;
            }

            // Démarrer l'upload
            setUploadState('loading');
            setErrorMessage(null);

            // Compresser l'image si nécessaire (> 2MB)
            // Requirement 8.2: Compress large images
            let uploadUri = asset.uri;
            if (asset.fileSize && asset.fileSize > 2 * 1024 * 1024) {
                uploadUri = await compressImage(asset.uri, asset.fileSize);
            }

            // Uploader le fichier
            const result = await uploadMedia({
                type: 'photo',
                file: {
                    uri: uploadUri,
                    name: asset.fileName || `photo_${Date.now()}.jpg`,
                    mimeType: asset.mimeType || 'image/jpeg',
                    size: asset.fileSize,
                },
            });

            // Upload réussi
            setUploadState('success');
            
            // Créer un MediaItem à partir de la réponse
            const newMediaItem: MediaItem = {
                id: `${Date.now()}`, // Générer un ID temporaire
                url: result.url,
                thumbnail: result.thumbnail,
                uploadedAt: new Date().toISOString(),
                type: 'photo',
            };

            // Callback de succès
            if (onUploadSuccess) {
                onUploadSuccess(newMediaItem);
            }

            // Réinitialiser l'état après un court délai
            setTimeout(() => {
                setUploadState('idle');
            }, 1000);
        } catch (error: any) {
            console.error('Upload error:', error);
            
            // Gérer les différents types d'erreurs
            // Requirements 2.4, 2.5, 5.1-5.5: Handle and display specific error types
            let errorMsg = 'Upload failed - Please try again';
            
            // Requirement 5.1: Network error message
            if (error.message?.includes('Network') || error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
                errorMsg = 'Network error - Please check your connection';
            } 
            // Requirement 5.5: Authentication error message
            else if (error.message?.includes('401') || error.message?.includes('Unauthorized') || error.message?.includes('Not authorized')) {
                errorMsg = 'Not authorized - Please log in again';
            }
            // Requirement 5.2: Server error message with details
            else if (error.message) {
                errorMsg = `Upload failed: ${error.message}`;
            }
            
            showError(errorMsg);
        }
    };

    // ============================================================================
    // Affichage des erreurs
    // Requirements 5.1-5.7: Display error messages
    // ============================================================================

    const showError = (message: string) => {
        setUploadState('error');
        setErrorMessage(message);
        
        // Auto-dismiss après 5 secondes (Requirement 5.6)
        setTimeout(() => {
            if (errorMessage === message) {
                setErrorMessage(null);
                setUploadState('idle');
            }
        }, 5000);
    };

    // ============================================================================
    // Dismissal manuel des erreurs
    // Requirement 5.7: Allow users to dismiss error messages by tapping
    // ============================================================================

    const dismissError = () => {
        setErrorMessage(null);
        setUploadState('idle');
    };

    // ============================================================================
    // Rendu
    // ============================================================================

    return (
        <View 
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-700"
            accessibilityLabel="Section d'upload de médias"
        >
            {/* Titre */}
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                Photos
            </Text>

            {/* Bouton d'upload */}
            <MediaUploadButton
                onPress={pickImage}
                loading={isLoading || uploadState === 'loading'}
                disabled={isLoading || uploadState === 'loading'}
                label="Ajouter une photo"
            />

            {/* Message d'erreur */}
            {/* Requirements 5.1-5.7: Display error messages with dismissal */}
            {errorMessage && (
                <TouchableOpacity
                    onPress={dismissError}
                    activeOpacity={0.8}
                    accessibilityRole="alert"
                    accessibilityLabel={`Erreur: ${errorMessage}`}
                    accessibilityHint="Appuyez pour fermer ce message d'erreur"
                    className="mt-3"
                >
                    <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex-row items-start justify-between">
                        <View className="flex-1 flex-row items-start">
                            {/* Icône d'erreur */}
                            <Text className="text-red-600 dark:text-red-400 text-lg mr-2">⚠️</Text>
                            
                            {/* Message d'erreur */}
                            <Text className="text-red-600 dark:text-red-400 text-sm flex-1">
                                {errorMessage}
                            </Text>
                        </View>
                        
                        {/* Bouton de fermeture */}
                        <TouchableOpacity
                            onPress={dismissError}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            accessibilityRole="button"
                            accessibilityLabel="Fermer le message d'erreur"
                        >
                            <Text className="text-red-600 dark:text-red-400 text-lg font-bold ml-2">×</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            )}

            {/* Galerie de médias */}
            <MediaGallery
                media={existingMedia}
                loading={false}
            />
        </View>
    );
}
