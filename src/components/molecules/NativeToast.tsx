/**
 * Composant NativeToast (Molecule)
 * 
 * Système de toast natif sans dépendances externes.
 * Fallback pour react-native-toast-message.
 * 
 * @module components/molecules/NativeToast
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    Animated, 
    Dimensions, 
    TouchableOpacity,
    useColorScheme 
} from 'react-native';
import { 
    WifiIcon, 
    SignalIcon, 
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XMarkIcon
} from 'react-native-heroicons/outline';

// ============================================================================
// Types
// ============================================================================

export interface ToastData {
    id: string;
    type: 'success' | 'error' | 'info';
    text1: string;
    text2?: string;
    visibilityTime?: number;
    autoHide?: boolean;
}

export interface NativeToastProps {
    toasts: ToastData[];
    onDismiss: (id: string) => void;
}

// ============================================================================
// Composant Toast Individuel
// ============================================================================

function ToastItem({ 
    toast, 
    onDismiss, 
    isDark 
}: { 
    toast: ToastData; 
    onDismiss: (id: string) => void;
    isDark: boolean;
}) {
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animation d'entrée
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();

        // Auto-hide
        if (toast.autoHide !== false) {
            const timer = setTimeout(() => {
                handleDismiss();
            }, toast.visibilityTime || 3000);

            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onDismiss(toast.id);
        });
    };

    const getIcon = () => {
        const iconColor = getIconColor();
        const iconSize = 24;

        switch (toast.type) {
            case 'success':
                return <CheckCircleIcon size={iconSize} color={iconColor} />;
            case 'error':
                return <ExclamationTriangleIcon size={iconSize} color={iconColor} />;
            case 'info':
                return <SignalIcon size={iconSize} color={iconColor} />;
            default:
                return <WifiIcon size={iconSize} color={iconColor} />;
        }
    };

    const getIconColor = (): string => {
        switch (toast.type) {
            case 'success':
                return '#10B981';
            case 'error':
                return '#EF4444';
            case 'info':
                return '#3B82F6';
            default:
                return '#6B7280';
        }
    };

    const getContainerStyle = () => {
        const baseStyle = {
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginHorizontal: 16,
            marginBottom: 8,
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            borderLeftWidth: 4,
            borderLeftColor: getIconColor(),
        };

        return {
            ...baseStyle,
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        };
    };

    const textStyles = {
        title: {
            fontSize: 16,
            fontWeight: '600' as const,
            color: isDark ? '#F9FAFB' : '#111827',
            marginBottom: 2,
        },
        subtitle: {
            fontSize: 14,
            color: isDark ? '#D1D5DB' : '#6B7280',
            lineHeight: 18,
        },
    };

    return (
        <Animated.View
            style={{
                transform: [{ translateY: slideAnim }],
                opacity: opacityAnim,
            }}
        >
            <View style={getContainerStyle()}>
                {/* Icône */}
                <View style={{ marginRight: 12 }}>
                    {getIcon()}
                </View>

                {/* Contenu textuel */}
                <View style={{ flex: 1 }}>
                    <Text style={textStyles.title} numberOfLines={1}>
                        {toast.text1}
                    </Text>
                    {toast.text2 && (
                        <Text style={textStyles.subtitle} numberOfLines={2}>
                            {toast.text2}
                        </Text>
                    )}
                </View>

                {/* Bouton fermer */}
                <TouchableOpacity
                    onPress={handleDismiss}
                    style={{
                        padding: 4,
                        marginLeft: 8,
                    }}
                >
                    <XMarkIcon 
                        size={16} 
                        color={isDark ? '#9CA3AF' : '#6B7280'} 
                    />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

// ============================================================================
// Composant Principal
// ============================================================================

/**
 * Composant NativeToast
 */
export function NativeToast({ toasts, onDismiss }: NativeToastProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    if (toasts.length === 0) {
        return null;
    }

    return (
        <View
            style={{
                position: 'absolute',
                top: 60,
                left: 0,
                right: 0,
                zIndex: 9999,
                pointerEvents: 'box-none',
            }}
        >
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onDismiss={onDismiss}
                    isDark={isDark}
                />
            ))}
        </View>
    );
}

// ============================================================================
// Hook pour gérer les toasts
// ============================================================================

export function useNativeToast() {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const show = (toastData: Omit<ToastData, 'id'>) => {
        const id = Date.now().toString();
        const newToast: ToastData = {
            id,
            ...toastData,
        };

        setToasts(prev => [...prev, newToast]);
    };

    const dismiss = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const dismissAll = () => {
        setToasts([]);
    };

    return {
        toasts,
        show,
        dismiss,
        dismissAll,
        ToastComponent: () => (
            <NativeToast toasts={toasts} onDismiss={dismiss} />
        ),
    };
}