/**
 * Composant de diagnostic API
 * Permet de tester la connexion à l'API et identifier les problèmes
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ApiRoutes } from '@/services/api/routes';
import { get } from '@/services/api/client';

export function ApiDiagnostic() {
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const testEndpoint = async (name: string, url: string) => {
        const startTime = Date.now();
        try {
            console.log(`🔍 Test ${name}:`, url);
            const response = await get(url);
            const duration = Date.now() - startTime;
            
            return {
                name,
                url,
                status: 'success',
                duration: `${duration}ms`,
                data: response,
            };
        } catch (error: any) {
            const duration = Date.now() - startTime;
            console.error(`❌ Erreur ${name}:`, error);
            
            return {
                name,
                url,
                status: 'error',
                duration: `${duration}ms`,
                error: error.message || String(error),
                code: error.code,
                details: error.details,
            };
        }
    };

    const runDiagnostics = async () => {
        setIsLoading(true);
        setResults([]);

        const tests = [
            { name: 'Map Data', url: ApiRoutes.getFullUrl(ApiRoutes.MAP_DATA) },
            { name: 'Amodiataires Coordinates', url: ApiRoutes.getFullUrl(ApiRoutes.AMODIATAIRES) + '?limit=1' },
            { name: 'Zone Bounds', url: ApiRoutes.getFullUrl(ApiRoutes.DELIMITATION) },
        ];

        const testResults = [];
        for (const test of tests) {
            const result = await testEndpoint(test.name, test.url);
            testResults.push(result);
            setResults([...testResults]);
        }

        setIsLoading(false);
    };

    return (
        <View className="flex-1 bg-white dark:bg-neutral-900 p-4">
            <Text className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                Diagnostic API
            </Text>

            <TouchableOpacity
                onPress={runDiagnostics}
                disabled={isLoading}
                className="bg-blue-500 p-4 rounded-lg mb-4"
            >
                {isLoading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white text-center font-semibold">
                        Lancer les tests
                    </Text>
                )}
            </TouchableOpacity>

            <ScrollView className="flex-1">
                {results.map((result, index) => (
                    <View
                        key={index}
                        className={`mb-4 p-4 rounded-lg ${
                            result.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                        }`}
                    >
                        <Text className="font-bold text-lg mb-2">
                            {result.name} - {result.status === 'success' ? '✅' : '❌'}
                        </Text>
                        <Text className="text-sm mb-1">URL: {result.url}</Text>
                        <Text className="text-sm mb-1">Durée: {result.duration}</Text>
                        
                        {result.status === 'error' && (
                            <>
                                <Text className="text-sm text-red-700 font-semibold mt-2">
                                    Erreur: {result.error}
                                </Text>
                                {result.code && (
                                    <Text className="text-sm text-red-600">
                                        Code: {result.code}
                                    </Text>
                                )}
                                {result.details && (
                                    <Text className="text-xs text-red-500 mt-1">
                                        Détails: {JSON.stringify(result.details, null, 2)}
                                    </Text>
                                )}
                            </>
                        )}
                        
                        {result.status === 'success' && result.data && (
                            <Text className="text-xs text-green-700 mt-2">
                                Données: {JSON.stringify(result.data, null, 2).substring(0, 200)}...
                            </Text>
                        )}
                    </View>
                ))}
            </ScrollView>

            <View className="mt-4 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                <Text className="font-semibold mb-2">Configuration:</Text>
                <Text className="text-sm">API URL: {ApiRoutes.BASE_URL}</Text>
                <Text className="text-sm">API Key: {ApiRoutes.API_KEY.substring(0, 20)}...</Text>
            </View>
        </View>
    );
}
