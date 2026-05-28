/**
 * Composant NetworkIndicator (Atom)
 * 
 * Indicateur visuel de l'état de la connexion internet.
 * Affiche une petite icône dans la barre de statut.
 * 
 * @module components/atoms/NetworkIndicator
 */

import React from 'react';
import { View, Text } from 'react-native';
import { 
    WifiIcon, 
    SignalIcon, 
    ExclamationTriangleIcon 
} from 'react-native-heroicons/outline';
import { useSafeNetworkStatus } from '@/hooks/useSafeNetworkStatus';
import { useTranslation } from 'react-i18next';

// ============================================================================
// Types
// ============================================================================

export interface NetworkIndicatorProps {
    /** Affichage compact (icône seulement) ou étendu (icône + texte) */
    variant?: 'compact' | 'extended';
    /** Couleur personnalisée */
    color?: string;
}

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant NetworkIndicator
 */
export function NetworkIndicator({ 
    variant = 'compact', 
    color 
}: NetworkIndicatorProps) {
    const { t } = useTranslation();
    const { isConnected, type } = useSafeNetworkStatus();

    /**
     * Obtient l'icône selon l'état de connexion
     */
    const getIcon = () => {
        const iconSize = variant === 'compact' ? 16 : 20;
        const iconColor = color || getStatusColor();

        if (isConnected === null) {
            return <SignalIcon size={iconSize} color="#9CA3AF" />;
        }

        if (!isConnected) {
            return <ExclamationTriangleIcon size={iconSize} color="#EF4444" />;
        }

        if (type === 'wifi') {
            return <WifiIcon size={iconSize} color={iconColor} />;
        }

        return <SignalIcon size={iconSize} color={iconColor} />;
    };

    /**
     * Obtient la couleur selon l'état
     */
    const getStatusColor = (): string => {
        if (isConnected === null) return '#9CA3AF'; // Gray-400
        if (!isConnected) return '#EF4444'; // Red-500
        return '#10B981'; // Emerald-500
    };

    /**
     * Obtient le texte de statut
     */
    const getStatusText = (): string => {
        if (isConnected === null) {
            return t('network.status.checking', 'Vérification...');
        }
        
        if (!isConnected) {
            return t('network.status.offline', 'Hors ligne');
        }

        switch (type) {
            case 'wifi':
                return t('network.connection_types.wifi', 'Wi-Fi');
            case 'cellular':
                return t('network.connection_types.cellular', 'Données mobiles');
            default:
                return t('network.status.online', 'En ligne');
        }
    };

    if (variant === 'compact') {
        return (
            <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
            }}>
                {getIcon()}
            </View>
        );
    }

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            backgroundColor: isConnected ? '#F0FDF4' : '#FEF2F2',
        }}>
            {getIcon()}
            <Text style={{
                marginLeft: 6,
                fontSize: 12,
                fontWeight: '500',
                color: getStatusColor(),
            }}>
                {getStatusText()}
            </Text>
        </View>
    );
}