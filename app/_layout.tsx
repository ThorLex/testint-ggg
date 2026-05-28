/**
 * Layout racine de l'application Navipad
 * 
 * Ce fichier configure le layout principal de l'application avec :
 * - Providers (QueryClient, i18n)
 * - Initialisation des services
 * - Gestion du splash screen
 * 
 * @module app/_layout
 */

import { LogBox } from 'react-native';

// Ignorer les avertissements de NativeWind qui causent des crashs de contexte
LogBox.ignoreLogs([
    "Couldn't find a navigation context",
    "Have you wrapped your app with 'NavigationContainer'",
    "react-native-css-interop",
]);

import '../global.css';
import { useEffect, useState } from 'react';
import { View, useColorScheme as useRNColorScheme } from 'react-native';
import { useColorScheme as useTailwindColorScheme } from 'nativewind';
import { Slot, SplashScreen } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Utils & Interops
import { registerInterops } from '@/utils/interop';
import { CSSInteropNavigationProvider } from '@/utils/cssInteropFix';

// Enregistrer les interops immédiatement au chargement
registerInterops();

// Services
import '@/translations/i18n';
import { useAppStore } from '@/store';
import { useAuthStore } from '@/store/auth';
import { isFirstLaunch, markAppLaunched, getLanguage } from '@/services/storage';
import { watchNetworkState } from '@/services/network';
import { checkLocationPermission, isLocationEnabled } from '@/services/location';
import { useTranslation } from 'react-i18next';

// Composants
import { useSafeNetworkStatus } from '@/hooks/useSafeNetworkStatus';

// Empêcher le splash screen de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

// ============================================================================
// Configuration React Query
// ============================================================================

/**
 * Client React Query pour la gestion du cache et des requêtes
 */
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Cache de 5 minutes par défaut
            staleTime: 5 * 60 * 1000,
            // Garder les données en cache pendant 10 minutes
            gcTime: 10 * 60 * 1000,
            // Réessayer 3 fois en cas d'erreur
            retry: 3,
            // Ne pas refetch automatiquement au focus
            refetchOnWindowFocus: false,
        },
    },
});

// ============================================================================
// Composant Layout Racine
// ============================================================================

/**
 * Layout racine de l'application
 */
export default function RootLayout() {
    const [appIsReady, setAppIsReady] = useState(false);
    const { initialize, setNetworkState, setLocationState, setIsFirstLaunch, setLanguage } = useAppStore();
    const { initialize: initializeAuth } = useAuthStore();
    const { i18n } = useTranslation();
    
    // Utiliser le sélecteur pour s'abonner aux changements de thème
    const themeMode = useAppStore((state) => state.themeMode);
    const { colorScheme, setColorScheme } = useTailwindColorScheme();

    // Déterminer si on est en mode sombre pour les styles manuels (ex: barre de statut, fonds forcés)
    const isDark = colorScheme === 'dark';

    // Synchroniser le mode de thème avec NativeWind
    useEffect(() => {
        if (themeMode === 'auto') {
            setColorScheme('system');
        } else {
            setColorScheme(themeMode);
        }
    }, [themeMode, setColorScheme]);
    
    // Initialiser le système de surveillance réseau sûr
    const { ToastComponent } = useSafeNetworkStatus();
    
    // Log pour debug
    useEffect(() => {
        console.log('🎨 État du Thème:', { themeMode, currentScheme: colorScheme, isDark });
    }, [themeMode, colorScheme, isDark]);

    useEffect(() => {
        async function prepareApp() {
            try {
                console.log('🚀 Initialisation de l\'application...');

                // Initialiser le store Zustand
                await initialize();

                // Initialiser l'authentification
                await initializeAuth();

                // Charger la langue sauvegardée
                const savedLanguage = await getLanguage();
                setLanguage(savedLanguage);
                i18n.changeLanguage(savedLanguage);
                console.log(`🌍 Langue chargée: ${savedLanguage}`);

                // Vérifier si c'est le premier lancement
                const firstLaunch = await isFirstLaunch();
                setIsFirstLaunch(firstLaunch);

                if (firstLaunch) {
                    console.log('👋 Premier lancement détecté');
                } else {
                    // Marquer l'application comme lancée
                    await markAppLaunched();
                }

                // Vérifier l'état de la connexion réseau
                const { getNetworkState } = await import('@/services/network');
                const networkState = await getNetworkState();
                setNetworkState(networkState);

                // Vérifier les permissions de localisation
                const locationPermission = await checkLocationPermission();
                const locationIsEnabled = await isLocationEnabled();

                setLocationState({
                    permission: locationPermission,
                    isEnabled: locationIsEnabled,
                    currentLocation: null,
                });

                console.log('✅ Application initialisée');
                setAppIsReady(true);
            } catch (error) {
                console.error('❌ Erreur lors de l\'initialisation:', error);
                // Continuer quand même
                setAppIsReady(true);
            }
        }

        prepareApp();
    }, []);

    // Écouter les changements de connexion réseau
    useEffect(() => {
        const unsubscribe = watchNetworkState((state) => {
            setNetworkState(state);
        });

        return unsubscribe;
    }, []);

    // Cacher le splash screen quand l'app est prête
    useEffect(() => {
        if (appIsReady) {
            SplashScreen.hideAsync();
        }
    }, [appIsReady]);

    if (!appIsReady) {
        return null;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <SafeAreaProvider>
                    <CSSInteropNavigationProvider>
                        <View className={`flex-1 ${isDark ? 'dark bg-gray-900' : 'bg-white'}`}>
                            <Slot />
                            
                            {/* Composant Toast sûr pour les notifications réseau */}
                            <ToastComponent />
                        </View>
                    </CSSInteropNavigationProvider>
                </SafeAreaProvider>
            </GestureHandlerRootView>
        </QueryClientProvider>
    );
}
