/**
 * Composant BottomSheet (Molecule)
 * 
 * Bottom sheet réutilisable qui s'affiche par-dessus la carte
 * avec un fond semi-transparent cliquable pour fermer.
 * 
 * @module components/molecules/BottomSheet
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    TouchableOpacity,
    Animated,
    StyleSheet,
    useColorScheme,
    ScrollView,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ============================================================================
// Types
// ============================================================================

export interface BottomSheetProps {
    /** Visibilité du bottom sheet */
    visible: boolean;
    /** Callback de fermeture */
    onClose: () => void;
    /** Contenu du bottom sheet */
    children: React.ReactNode;
    /** Hauteur maximale (pourcentage de l'écran) */
    maxHeight?: number;
    /** Afficher la poignée de drag */
    showHandle?: boolean;
    /** Permettre le scroll */
    scrollable?: boolean;
    /** Fermer en cliquant sur le backdrop */
    closeOnBackdropPress?: boolean;
}

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant BottomSheet
 */
export function BottomSheet({
    visible,
    onClose,
    children,
    maxHeight = 85,
    showHandle = true,
    scrollable = true,
    closeOnBackdropPress = true,
}: BottomSheetProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    
    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const screenHeight = Dimensions.get('window').height;
    const sheetHeight = (screenHeight * maxHeight) / 100;

    // ============================================================================
    // Effets
    // ============================================================================

    /**
     * Animation d'entrée/sortie
     */
    useEffect(() => {
        if (visible) {
            // Réinitialiser immédiatement à la position fermée
            slideAnim.setValue(0);
            fadeAnim.setValue(0);
            
            // Animation d'entrée - Plus rapide
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Animation de sortie
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    // ============================================================================
    // Handlers
    // ============================================================================

    /**
     * Gère le clic sur le backdrop
     */
    const handleBackdropPress = () => {
        if (closeOnBackdropPress) {
            onClose();
        }
    };

    // ============================================================================
    // Rendu
    // ============================================================================

    if (!visible) return null;

    return (
        <View style={styles.container} pointerEvents="box-none">
            {/* Backdrop semi-transparent */}
            <Animated.View
                style={[
                    styles.backdrop,
                    {
                        opacity: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 0.5],
                        }),
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.backdropTouchable}
                    activeOpacity={1}
                    onPress={handleBackdropPress}
                />
            </Animated.View>

            {/* Bottom Sheet avec KeyboardAvoidingView pour ne pas être caché */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1, justifyContent: 'flex-end' }}
                pointerEvents="box-none"
            >
                <Animated.View
                    style={[
                        styles.sheet,
                        {
                            height: sheetHeight,
                            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                            transform: [
                                {
                                    translateY: slideAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [screenHeight, 0],
                                    }),
                                },
                            ],
                            paddingBottom: insets.bottom,
                        },
                    ]}
                >
                    {/* Poignée de drag */}
                    {showHandle && (
                        <View style={styles.handleContainer}>
                            <View
                                style={[
                                    styles.handle,
                                    { backgroundColor: isDark ? '#4B5563' : '#D1D5DB' },
                                ]}
                            />
                        </View>
                    )}

                    {/* Contenu */}
                    {scrollable ? (
                        <ScrollView
                            style={styles.scrollView}
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {children}
                        </ScrollView>
                    ) : (
                        <View style={styles.content}>{children}</View>
                    )}
                </Animated.View>
            </KeyboardAvoidingView>
            </View>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000000',
    },
    backdropTouchable: {
        flex: 1,
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 16,
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
});
