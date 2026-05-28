/**
 * Composant MediaUploadButton (Atom)
 * 
 * Bouton pour déclencher l'upload de médias avec état de chargement.
 * 
 * @module components/atoms/MediaUploadButton
 */

import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { PhotoIcon } from 'react-native-heroicons/outline';

// ============================================================================
// Types
// ============================================================================

/**
 * Props du composant MediaUploadButton
 */
export interface MediaUploadButtonProps {
    /** Callback appelé lors du clic */
    onPress: () => void;
    /** État de chargement */
    loading: boolean;
    /** Bouton désactivé */
    disabled: boolean;
    /** Label du bouton (optionnel) */
    label?: string;
}

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant MediaUploadButton
 * 
 * Affiche un bouton d'upload avec icône et label.
 * Affiche un spinner de chargement pendant l'upload.
 * Désactive le bouton pendant l'upload.
 * 
 * @example
 * ```tsx
 * <MediaUploadButton
 *   onPress={handleUpload}
 *   loading={isUploading}
 *   disabled={isUploading}
 *   label="Upload photo"
 * />
 * ```
 */
export function MediaUploadButton({
    onPress,
    loading,
    disabled,
    label = 'Upload photo',
}: MediaUploadButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            className={`
                bg-emerald-500 rounded-full px-6 py-3 
                flex-row items-center justify-center
                ${isDisabled ? 'opacity-50' : ''}
            `}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint="Opens image picker to select a photo"
            accessibilityState={{ disabled: isDisabled, busy: loading }}
        >
            {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
                <View className="flex-row items-center">
                    <PhotoIcon size={20} color="#FFFFFF" />
                    <Text className="text-white font-semibold text-base ml-2">
                        {label}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}
