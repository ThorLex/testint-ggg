/**
 * Composant Button (Atom)
 * 
 * Bouton réutilisable avec différentes variantes et tailles.
 * Utilise NativeWind pour le styling.
 * 
 * @module components/atoms/Button
 */

import { TouchableOpacity, Text, ActivityIndicator, type TouchableOpacityProps } from 'react-native';
import { type ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Variantes du bouton
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

/**
 * Tailles du bouton
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Props du composant Button
 */
export interface ButtonProps extends Omit<TouchableOpacityProps, 'children'> {
    /** Texte ou contenu du bouton */
    children: ReactNode;
    /** Variante du bouton */
    variant?: ButtonVariant;
    /** Taille du bouton */
    size?: ButtonSize;
    /** État de chargement */
    loading?: boolean;
    /** Bouton désactivé */
    disabled?: boolean;
    /** Largeur complète */
    fullWidth?: boolean;
    /** Classe CSS personnalisée */
    className?: string;
}

// ============================================================================
// Styles par Variante
// ============================================================================

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary-500 active:bg-primary-600',
    secondary: 'bg-neutral-200 dark:bg-neutral-700 active:bg-neutral-300 dark:active:bg-neutral-600',
    outline: 'border-2 border-primary-500 bg-transparent active:bg-primary-50 dark:active:bg-primary-900',
    ghost: 'bg-transparent active:bg-neutral-100 dark:active:bg-neutral-800',
    danger: 'bg-error active:bg-red-600',
};

const variantTextStyles: Record<ButtonVariant, string> = {
    primary: 'text-white',
    secondary: 'text-neutral-900 dark:text-neutral-50',
    outline: 'text-primary-500',
    ghost: 'text-neutral-900 dark:text-neutral-50',
    danger: 'text-white',
};

// ============================================================================
// Styles par Taille
// ============================================================================

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-2 rounded-lg',
    md: 'px-4 py-3 rounded-xl',
    lg: 'px-6 py-4 rounded-2xl',
};

const sizeTextStyles: Record<ButtonSize, string> = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
};

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant Button
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onPress={() => console.log('Pressed')}>
 *   Cliquez-moi
 * </Button>
 * ```
 */
export function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    className = '',
    ...props
}: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50' : ''}
        flex-row items-center justify-center
        ${className}
      `}
            disabled={isDisabled}
            activeOpacity={0.7}
            {...props}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : '#10B981'}
                />
            ) : (
                <Text
                    className={`
            ${variantTextStyles[variant]}
            ${sizeTextStyles[size]}
            font-semibold
          `}
                >
                    {children}
                </Text>
            )}
        </TouchableOpacity>
    );
}
