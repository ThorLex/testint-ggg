/**
 * Page de test simple pour Google Maps
 * 
 * Cette page permet de tester l'affichage de Google Maps
 * sans dépendances sur l'API backend ou d'autres composants.
 * 
 * Pour tester: Naviguez vers /test-map dans l'application
 */

import React from 'react';
import { View, StyleSheet, Text, Platform, ScrollView } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';

export default function TestMap() {
    console.log('🗺️ TestMap - Rendu de la page de test');
    console.log('📱 Platform:', Platform.OS);
    console.log('🔧 Provider:', Platform.OS === 'android' ? 'PROVIDER_GOOGLE' : 'PROVIDER_DEFAULT');
    
    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🗺️ Test Google Maps</Text>
                <Text style={styles.subtitle}>
                    Si vous voyez une carte ci-dessous, Google Maps fonctionne correctement
                </Text>
            </View>

            <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Configuration:</Text>
                <Text style={styles.infoText}>Platform: {Platform.OS}</Text>
                <Text style={styles.infoText}>
                    Provider: {Platform.OS === 'android' ? 'Google Maps' : 'Apple Maps'}
                </Text>
            </View>

            <View style={styles.mapContainer}>
                <MapView
                    provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                    style={styles.map}
                    initialRegion={{
                        latitude: 48.8566,
                        longitude: 2.3522,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                    onMapReady={() => {
                        console.log('✅ Carte prête - Google Maps fonctionne !');
                    }}
                    onError={(error) => {
                        console.error('❌ Erreur carte:', error);
                    }}
                    onLayout={() => {
                        console.log('📐 Layout de la carte effectué');
                    }}
                    loadingEnabled={true}
                    loadingIndicatorColor="#007bff"
                    loadingBackgroundColor="#ffffff"
                    showsUserLocation={false}
                    showsMyLocationButton={false}
                >
                    <Marker
                        coordinate={{
                            latitude: 48.8566,
                            longitude: 2.3522,
                        }}
                        title="Paris"
                        description="Marqueur de test"
                        pinColor="#007bff"
                    />
                </MapView>
            </View>

            <View style={styles.statusBox}>
                <Text style={styles.statusTitle}>✅ Que faire si la carte s'affiche:</Text>
                <Text style={styles.statusText}>
                    • Google Maps fonctionne correctement{'\n'}
                    • Le problème vient du chargement des données API{'\n'}
                    • Vérifiez les logs pour les erreurs API{'\n'}
                    • Consultez SOLUTION_ERREUR_CARTE.md
                </Text>
            </View>

            <View style={[styles.statusBox, styles.errorBox]}>
                <Text style={styles.statusTitle}>❌ Que faire si la carte ne s'affiche pas:</Text>
                <Text style={styles.statusText}>
                    • Rebuild l'application: npx expo run:android{'\n'}
                    • Vérifiez Google Play Services{'\n'}
                    • Utilisez un émulateur avec Play Store{'\n'}
                    • Consultez FIX_MAP_NOT_SHOWING.md
                </Text>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Consultez les logs de la console pour plus de détails
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#007bff',
        padding: 20,
        paddingTop: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
        opacity: 0.9,
    },
    infoBox: {
        backgroundColor: '#fff',
        margin: 20,
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    mapContainer: {
        height: 400,
        margin: 20,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#007bff',
        backgroundColor: '#e0e0e0',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    statusBox: {
        backgroundColor: '#d4edda',
        margin: 20,
        marginTop: 10,
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#c3e6cb',
    },
    errorBox: {
        backgroundColor: '#f8d7da',
        borderColor: '#f5c6cb',
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    statusText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
    },
    footer: {
        padding: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },
});
