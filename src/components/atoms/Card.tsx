/**
 * Composant Card (Atom)
 * 
 * Carte réutilisable pour afficher du contenu.
 * 
 * @module components/atoms/Card
 */

import { View, type ViewProps } from 'react-native';
import { type ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Props du composant Card
 */
export interface CardProps extends ViewProps {
    /** Contenu de la carte */
    children: ReactNode;
    /** Padding personnalisé */
    padding?: 'none' | 'sm' | 'md' | 'lg';
    /** Classe CSS personnalisée */
    className?: string;
}

// ============================================================================
// Styles par Padding
// ============================================================================

const paddingStyles = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
};

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant Card
 * 
 * @example
 * ```tsx
 * <Card padding="md">
 *   <Text>Contenu de la carte</Text>
 * </Card>
 * ```
 */
export function Card({
    children,
    padding = 'md',
    className = '',
    ...props
}: CardProps) {
    return (
        <View
            className={`
        ${paddingStyles[padding]}
        rounded-2xl
        bg-white dark:bg-neutral-800
        border border-neutral-200 dark:border-neutral-700
        shadow-soft
        ${className}
      `}
            {...props}
        >
            {children}
        </View>
    );
}
