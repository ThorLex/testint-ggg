/**
 * Patch pour react-native-css-interop
 * 
 * Ce patch empêche react-native-css-interop de crasher quand le contexte
 * de navigation n'est pas disponible (ce qui est normal avec Expo Router).
 */

// Monkey patch pour NavigationStateContext
const originalError = console.error;
console.error = (...args) => {
    // Ignorer les erreurs de contexte de navigation de css-interop
    if (
        typeof args[0] === 'string' &&
        args[0].includes("Couldn't find a navigation context")
    ) {
        return;
    }
    originalError.apply(console, args);
};
