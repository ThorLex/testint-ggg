/**
 * Composant CustomAlert (Atom)
 * 
 * Alerte moderne et stylée pour remplacer Alert.alert() natif
 * 
 * @module components/atoms/CustomAlert
 */

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Dimensions,
    StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
    ExclamationTriangleIcon,
    CheckCircleIcon,
    InformationCircleIcon,
    XCircleIcon,
} from 'react-native-heroicons/outline';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// Types
// ============================================================================

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

export interface CustomAlertProps {
    /** Visibilité de l'alerte */
    visible: boolean;
    /** Type d'alerte */
    type?: AlertType;
    /** Titre de l'alerte */
    title: string;
    /** Message de l'alerte */
    message?: string;
    /** Boutons de l'alerte */
    buttons?: AlertButton[];
    /** Callback de fermeture */
    onClose?: () => void;
}

// ============================================================================
// Composant
// ============================================================================

export function CustomAlert({
    visible,
    type = 'info',
    title,
    message,
    buttons = [{ text: 'OK' }],
    onClose,
}: CustomAlertProps) {
    
    // Configuration des couleurs selon le type
    const getTypeConfig = () => {
        switch (type) {
            case 'success':
                return {
                    icon: CheckCircleIcon,
                    iconColor: '#10B981',
                    backgroundColor: '#ECFDF5',
                    borderColor: '#10B981',
                };
            case 'error':
                return {
                    icon: XCircleIcon,
                    iconColor: '#EF4444',
                    backgroundColor: '#FEF2F2',
                    borderColor: '#EF4444',
                };
            case 'warning':
                return {
                    icon: ExclamationTriangleIcon,
                    iconColor: '#F59E0B',
                    backgroundColor: '#FFFBEB',
                    borderColor: '#F59E0B',
                };
            default:
                return {
                    icon: InformationCircleIcon,
                    iconColor: '#3B82F6',
                    backgroundColor: '#EFF6FF',
                    borderColor: '#3B82F6',
                };
        }
    };

    const config = getTypeConfig();
    const IconComponent = config.icon;

    const handleButtonPress = (button: AlertButton) => {
        button.onPress?.();
        onClose?.();
    };

    const getButtonStyle = (buttonStyle?: string) => {
        switch (buttonStyle) {
            case 'destructive':
                return styles.destructiveButton;
            case 'cancel':
                return styles.cancelButton;
            default:
                return styles.defaultButton;
        }
    };

    const getButtonTextStyle = (buttonStyle?: string) => {
        switch (buttonStyle) {
            case 'destructive':
                return styles.destructiveButtonText;
            case 'cancel':
                return styles.cancelButtonText;
            default:
                return styles.defaultButtonText;
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <BlurView intensity={20} style={styles.overlay}>
                <View style={styles.container}>
                    <View style={[
                        styles.alertBox,
                        { 
                            backgroundColor: config.backgroundColor,
                            borderColor: config.borderColor,
                        }
                    ]}>
                        {/* Icône */}
                        <View style={styles.iconContainer}>
                            <View style={[
                                styles.iconCircle,
                                { backgroundColor: config.iconColor + '20' }
                            ]}>
                                <IconComponent 
                                    size={32} 
                                    color={config.iconColor} 
                                />
                            </View>
                        </View>

                        {/* Contenu */}
                        <View style={styles.content}>
                            <Text style={styles.title}>{title}</Text>
                            {message && (
                                <Text style={styles.message}>{message}</Text>
                            )}
                        </View>

                        {/* Boutons */}
                        <View style={styles.buttonsContainer}>
                            {buttons.map((button, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.button,
                                        getButtonStyle(button.style),
                                        buttons.length === 1 && styles.singleButton,
                                        index === 0 && buttons.length > 1 && styles.firstButton,
                                        index === buttons.length - 1 && buttons.length > 1 && styles.lastButton,
                                    ]}
                                    onPress={() => handleButtonPress(button)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.buttonText,
                                        getButtonTextStyle(button.style)
                                    ]}>
                                        {button.text}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </BlurView>
        </Modal>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
        width: SCREEN_WIDTH - 64,
        maxWidth: 400,
    },
    alertBox: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 12,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    buttonsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    singleButton: {
        flex: 1,
    },
    firstButton: {
        marginRight: 6,
    },
    lastButton: {
        marginLeft: 6,
    },
    defaultButton: {
        backgroundColor: '#3B82F6',
    },
    cancelButton: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    destructiveButton: {
        backgroundColor: '#EF4444',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    defaultButtonText: {
        color: 'white',
    },
    cancelButtonText: {
        color: '#6B7280',
    },
    destructiveButtonText: {
        color: 'white',
    },
});