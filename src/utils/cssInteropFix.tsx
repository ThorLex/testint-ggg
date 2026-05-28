/**
 * Fix pour le bug de react-native-css-interop avec le contexte de navigation
 * 
 * NativeWind utilise react-native-css-interop qui essaie d'accéder au contexte
 * de navigation React Navigation, même quand on utilise Expo Router.
 * Ce wrapper fournit un contexte factice pour éviter les erreurs.
 */

import React from 'react';

// Créer un contexte de navigation factice
const NavigationContext = React.createContext<any>(null);

/**
 * Provider qui fournit un contexte de navigation factice pour NativeWind
 */
export function CSSInteropNavigationProvider({ children }: { children: React.ReactNode }) {
    // Fournir un objet factice qui satisfait les besoins de css-interop
    const navigationValue = React.useMemo(() => ({
        getKey: () => 'root',
        getState: () => ({ routes: [], index: 0 }),
        addListener: () => () => {},
    }), []);

    return (
        <NavigationContext.Provider value={navigationValue}>
            {children}
        </NavigationContext.Provider>
    );
}
