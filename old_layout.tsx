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

// Enregistrer les interops imm├®diatement au chargement
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

// Emp├¬cher le splash screen de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

// ============================================================================
// Configuration React Query
// ============================================================================

/**
 * Client React Query pour la gestion du cache et des requ├¬tes
 */
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Cache de 5 minutes par d├®faut
            staleTime: 5 * 60 * 1000,
            // Garder les donn├®es en cache pendant 10 minutes
            gcTime: 10 * 60 * 1000,
            // R├®essayer 3 fois en cas d'erreur
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
    
    // Utiliser le s├®lecteur pour s'abonner aux changements de th├¿me
    const themeMode = useAppStore((state) => state.themeMode);
    const { colorScheme, setColorScheme } = useTailwindColorScheme();

    // D├®terminer si on est en mode sombre pour les styles manuels (ex: barre de statut, fonds forc├®s)
    const isDark = colorScheme === 'dark';

    // Synchroniser le mode de th├¿me avec NativeWind
    useEffect(() => {
        if (themeMode === 'auto') {
            setColorScheme('system');
        } else {
            setColorScheme(themeMode);
        }
    }, [themeMode, setColorScheme]);
    
    // Initialiser le syst├¿me de surveillance r├®seau s├╗r
    const { ToastComponent } = useSafeNetworkStatus();
    
    // Log pour debug
    useEffect(() => {
        console.log('­ƒÄ¿ ├ëtat du Th├¿me:', { themeMode, currentScheme: colorScheme, isDark });
    }, [themeMode, colorScheme, isDark]);

    useEffect(() => {
        async function prepareApp() {
            try {
                console.log('­ƒÜÇ Initialisation de l\'application...');

                // Initialiser le store Zustand
                await initialize();

                // Initialiser l'authentification
                await initializeAuth();

                // Charger la langue sauvegard├®e
                const savedLanguage = await getLanguage();
                setLanguage(savedLanguage);
                i18n.changeLanguage(savedLanguage);
                console.log(`­ƒîì Langue charg├®e: ${savedLanguage}`);

                // V├®rifier si c'est le premier lancement
                const firstLaunch = await isFirstLaunch();
                setIsFirstLaunch(firstLaunch);

                if (firstLaunch) {
                    console.log('­ƒæï Premier lancement d├®tect├®');
                } else {
                    // Marquer l'application comme lanc├®e
                    await markAppLaunched();
                }

                // V├®rifier l'├®tat de la connexion r├®seau
                const { getNetworkState } = await import('@/services/network');
                const networkState = await getNetworkState();
                setNetworkState(networkState);

                // V├®rifier les permissions de localisation
                const locationPermission = await checkLocationPermission();
                const locationIsEnabled = await isLocationEnabled();

                setLocationState({
                    permission: locationPermission,
                    isEnabled: locationIsEnabled,
                    currentLocation: null,
                });

                console.log('Ô£à Application initialis├®e');
                setAppIsReady(true);
            } catch (error) {
                console.error('ÔØî Erreur lors de l\'initialisation:', error);
                // Continuer quand m├¬me
                setAppIsReady(true);
            }
        }

        prepareApp();
    }, []);

    // ├ëcouter les changements de connexion r├®seau
    useEffect(() => {
        const unsubscribe = watchNetworkState((state) => {
            setNetworkState(state);
        });

        return unsubscribe;
    }, []);

    // Cacher le splash screen quand l'app est pr├¬te
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
                    <View className={`flex-1 ${isDark ? 'dark bg-gray-900' : 'bg-white'}`}>
                        <Slot />
                        
                        {/* Composant Toast s├╗r pour les notifications r├®seau */}
                        <ToastComponent />
                    </View>
                </SafeAreaProvider>
            </GestureHandlerRootView>
        </QueryClientProvider>
    );
}
