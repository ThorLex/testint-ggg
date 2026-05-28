/**
 * ErrorBoundary pour capturer les erreurs React
 * 
 * Utilisé pour capturer et ignorer les erreurs de contexte de navigation
 * causées par react-native-css-interop (bug NativeWind)
 */

import React from 'react';
import { View, Text } from 'react-native';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    ignoreNavigationErrors?: boolean;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // Vérifier si c'est l'erreur de navigation context
        if (
            error?.message?.includes("Couldn't find a navigation context") ||
            error?.message?.includes("NavigationContainer")
        ) {
            console.log('🔇 Erreur de navigation context capturée et ignorée');
            // Ne pas marquer comme erreur
            return { hasError: false, error: null };
        }
        
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Ignorer les erreurs de navigation context
        if (
            error?.message?.includes("Couldn't find a navigation context") ||
            error?.message?.includes("NavigationContainer")
        ) {
            return;
        }
        
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <View className="flex-1 items-center justify-center p-4">
                    <Text className="text-red-500 text-center">
                        Une erreur est survenue
                    </Text>
                </View>
            );
        }

        return this.props.children;
    }
}
