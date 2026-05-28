/**
 * Composant Input (Atom)
 * 
 * Champ de saisie réutilisable avec support des icônes et états.
 * 
 * @module components/atoms/Input
 */

import { View, TextInput, Text, type TextInputProps } from 'react-native';
import { type ReactNode } from 'react';
import { useThemeColors } from '@/theme';

// ============================================================================
// Types
// ============================================================================

/**
 * Props du composant Input
 */
export interface InputProps extends TextInputProps {
    /** Label du champ */
    label?: string;
    /** Message d'erreur */
    error?: string;
    /** Icône à gauche */
    leftIcon?: ReactNode;
    /** Icône à droite */
    rightIcon?: ReactNode;
    /** Classe CSS personnalisée pour le conteneur */
    containerClassName?: string;
}

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant Input
 * 
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   placeholder="votre@email.com"
 *   keyboardType="email-address"
 *   error="Email invalide"
 * />
 * ```
 */
export function Input({
    label,
    error,
    leftIcon,
    rightIcon,
    containerClassName = '',
    className = '',
    ...props
}: InputProps) {
    const colors = useThemeColors();

    return (
        <View className={`${containerClassName}`}>
            {/* Label */}
            {label && (
                <Text className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {label}
                </Text>
            )}

            {/* Input Container */}
            <View
                className={`
          flex-row items-center
          px-3 py-2
          rounded-xl
          border
          ${error ? 'border-error' : 'border-neutral-300 dark:border-neutral-600'}
          bg-white dark:bg-neutral-800
        `}
            >
                {/* Left Icon */}
                {leftIcon && <View className="mr-2">{leftIcon}</View>}

                {/* Text Input */}
                <TextInput
                    className={`
            flex-1
            text-base
            text-neutral-900 dark:text-neutral-50
            ${className}
          `}
                    placeholderTextColor={colors.textSecondary}
                    {...props}
                />

                {/* Right Icon */}
                {rightIcon && <View className="ml-2">{rightIcon}</View>}
            </View>

            {/* Error Message */}
            {error && (
                <Text className="mt-1 text-sm text-error">
                    {error}
                </Text>
            )}
        </View>
    );
}
