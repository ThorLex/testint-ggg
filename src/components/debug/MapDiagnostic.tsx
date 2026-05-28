/**
 * Composant de diagnostic Google Maps
 * Permet de tester l'affichage de la carte et identifier les problèmes
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { ApiRoutes } from '@/services/api/routes';

export function MapDiagnostic() {
    const [logs, setLogs] = useState<string[]>([]);
    const [mapReady, setMapReady] = useState(false);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
        console.log(message);
    };

    const testMapRender = () => {
        addLog('🗺️ Test de rendu de la carte...');
        addLog(`Platform: ${Platform.OS}`);
        addLog(`Provider: ${Platform.OS === 'android' ? 'GOOGLE' : 'DEFAULT'}`);
    };

    return (
        <View className="flex-1 bg-white dark:bg-neutral-900">
            <ScrollView className="flex-1 p-4">
                <Text className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                    🗺️ Diagnostic Google Maps
                </Text>

                {/* Configuration */}
                <View className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg mb-4">
                    <Text className="font-bold text-lg mb-2 text-neutral-900 dark:text-white">
                        Configuration
                    </Text>
                    <Text className="text-sm text-neutral-700 dark:text-neutral-300 mb-1">
                        Platform: {Platform.OS}
                    </Text>
                    <Text className="text-sm text-neutral-700 dark:text-neutral-300 mb-1">
                        Provider: {Platform.OS === 'android' ? 'PROVIDER_GOOGLE' : 'PROVIDER_DEFAULT'}
                    </Text>
                    <Text className="text-sm text-neutral-700 dark:text-neutral-300 mb-1">
                        API Key: {ApiRoutes.GOOGLE_MAPS_API_KEY.substring(0, 20)}...
                    </Text>
                    <Text className="text-sm text-neutral-700 dark:text-neutral-300">
                        Map Ready: {mapReady ? '✅ Oui' : '❌ Non'}
                    </Text>
                </View>

                {/* Boutons de test */}
                <TouchableOpacity
                    onPress={testMapRender}
                    className="bg-blue-500 p-4 rounded-lg mb-4"
                >
                    <Text className="text-white text-center font-semibold">
                        Tester le rendu
                    </Text>
                </TouchableOpacity>

                {/* Carte de test */}
                <View className="mb-4">
                    <Text className="font-bold text-lg mb-2 text-neutral-900 dark:text-white">
                        Carte de Test
                    </Text>
                    <View className="h-64 bg-neutral-200 dark:bg-neutral-700 rounded-lg overflow-hidden">
                        <MapView
                            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                            style={{ flex: 1 }}
                            initialRegion={{
                                latitude: 48.8566,
                                longitude: 2.3522,
                                latitudeDelta: 0.0922,
                                longitudeDelta: 0.0421,
                            }}
                            onMapReady={() => {
                                setMapReady(true);
                                addLog('✅ Carte prête');
                            }}
                            onError={(error) => {
                                addLog(`❌ Erreur carte: ${JSON.stringify(error)}`);
                            }}
                            onLayout={() => {
                                addLog('📐 Layout de la carte effectué');
                            }}
                            loadingEnabled={true}
                            loadingIndicatorColor="#007bff"
                            loadingBackgroundColor="#ffffff"
                        >
                            <Marker
                                coordinate={{
                                    latitude: 48.8566,
                                    longitude: 2.3522,
                                }}
                                title="Paris"
                                description="Marqueur de test"
                            />
                        </MapView>
                    </View>
                </View>

                {/* Logs */}
                <View className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg">
                    <Text className="font-bold text-lg mb-2 text-neutral-900 dark:text-white">
                        Logs
                    </Text>
                    {logs.length === 0 ? (
                        <Text className="text-sm text-neutral-500">
                            Aucun log pour le moment
                        </Text>
                    ) : (
                        logs.map((log, index) => (
                            <Text
                                key={index}
                                className="text-xs text-neutral-700 dark:text-neutral-300 mb-1 font-mono"
                            >
                                {log}
                            </Text>
                        ))
                    )}
                </View>

                {/* Instructions */}
                <View className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg mt-4">
                    <Text className="font-bold text-lg mb-2 text-yellow-900 dark:text-yellow-100">
                        ⚠️ Problèmes Courants
                    </Text>
                    <Text className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                        1. Carte grise/vide: Clé API invalide ou non configurée
                    </Text>
                    <Text className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                        2. Carte ne s'affiche pas: Problème de build ou de permissions
                    </Text>
                    <Text className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                        3. Erreur "Google Play Services": Mettre à jour Google Play Services
                    </Text>
                    <Text className="text-sm text-yellow-800 dark:text-yellow-200">
                        4. Carte noire: Problème de style ou de thème
                    </Text>
                </View>

                {/* Solutions */}
                <View className="bg-green-100 dark:bg-green-900 p-4 rounded-lg mt-4 mb-8">
                    <Text className="font-bold text-lg mb-2 text-green-900 dark:text-green-100">
                        ✅ Solutions
                    </Text>
                    <Text className="text-sm text-green-800 dark:text-green-200 mb-2">
                        1. Vérifier la clé API dans app.json et AndroidManifest.xml
                    </Text>
                    <Text className="text-sm text-green-800 dark:text-green-200 mb-2">
                        2. Rebuild l'application: npx expo run:android
                    </Text>
                    <Text className="text-sm text-green-800 dark:text-green-200 mb-2">
                        3. Vérifier que Google Play Services est installé
                    </Text>
                    <Text className="text-sm text-green-800 dark:text-green-200">
                        4. Activer l'API Maps dans Google Cloud Console
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
