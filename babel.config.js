/**
 * Configuration Babel pour Navipad
 * 
 * Ce fichier configure Babel pour supporter NativeWind et Reanimated.
 * 
 * @module babel.config.js
 */

module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
        ],
        plugins: [
            // Plugin Reanimated (doit être en dernier)
            'react-native-reanimated/plugin',
        ],
    };
};
