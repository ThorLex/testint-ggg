/**
 * Composant NetworkToast (Molecule)
 * 
 * Configuration personnalisée des toasts pour les notifications réseau.
 * Utilise react-native-toast-message avec des styles adaptés au thème.
 * 
 * @module components/molecules/NetworkToast
 */

import React from 'react';
import { View, Text } from 'react-native';
import { 
    WifiIcon, 
    SignalIcon, 
    ExclamationTriangleIcon,
    CheckCircleIcon 
} from 'react-native-heroicons/outline';

// ============================================================================
// Types
// ============================================================================

export interface NetworkToastProps {
    /** Type de toast */
    type: 'success' | 'error' | 'info';
    /** Titre principal */
    text1?: string;
    /** Message secondaire */
    text2?: string;
    /** Indique si le thème sombre est actif */
    isDark?: boolean;
}

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant NetworkToast personnalisé
 */
export function NetworkToast({ type, text1, text2, isDark = false }: NetworkToastProps) {
    
    /**
     * Obtient l'icône selon le type de toast
     */
    const getIcon = () => {
        const iconColor = getIconColor();
        const iconSize = 24;

        switch (type) {
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

    /**
     * Obtient la couleur de l'icône selon le type
     */
    const getIconColor = (): string => {
        switch (type) {
            case 'success':
                return '#10B981'; // Emerald-500
            case 'error':
                return '#EF4444'; // Red-500
            case 'info':
                return '#3B82F6'; // Blue-500
            default:
                return '#6B7280'; // Gray-500
        }
    };

    /**
     * Obtient les styles du conteneur selon le type et le thème
     */
    const getContainerStyle = () => {
        const baseStyle = {
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginHorizontal: 16,
            marginTop: 8,
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        };

        if (isDark) {
            return {
                ...baseStyle,
                backgroundColor: '#1F2937', // Gray-800
                borderLeftWidth: 4,
                borderLeftColor: getIconColor(),
            };
        }

        return {
            ...baseStyle,
            backgroundColor: '#FFFFFF',
            borderLeftWidth: 4,
            borderLeftColor: getIconColor(),
        };
    };

    /**
     * Obtient les styles du texte selon le thème
     */
    const getTextStyles = () => {
        if (isDark) {
            return {
                title: {
                    fontSize: 16,
                    fontWeight: '600' as const,
                    color: '#F9FAFB', // Gray-50
                    marginBottom: 2,
                },
                subtitle: {
                    fontSize: 14,
                    color: '#D1D5DB', // Gray-300
                    lineHeight: 18,
                },
            };
        }

        return {
            title: {
                fontSize: 16,
                fontWeight: '600' as const,
                color: '#111827', // Gray-900
                marginBottom: 2,
            },
            subtitle: {
                fontSize: 14,
                color: '#6B7280', // Gray-500
                lineHeight: 18,
            },
        };
    };

    const textStyles = getTextStyles();

    return (
        <View style={getContainerStyle()}>
            {/* Icône */}
            <View style={{ marginRight: 12 }}>
                {getIcon()}
            </View>

            {/* Contenu textuel */}
            <View style={{ flex: 1 }}>
                {text1 && (
                    <Text style={textStyles.title} numberOfLines={1}>
                        {text1}
                    </Text>
                )}
                {text2 && (
                    <Text style={textStyles.subtitle} numberOfLines={2}>
                        {text2}
                    </Text>
                )}
            </View>
        </View>
    );
}

// ============================================================================
// Configuration des toasts personnalisés
// ============================================================================

/**
 * Configuration des toasts pour react-native-toast-message
 */
export const toastConfig = {
    success: (props: any) => <NetworkToast {...props} type="success" />,
    error: (props: any) => <NetworkToast {...props} type="error" />,
    info: (props: any) => <NetworkToast {...props} type="info" />,
};