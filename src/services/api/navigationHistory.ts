/**
 * Service pour l'enregistrement de l'historique de navigation
 * 
 * @module services/api/navigationHistory
 */

import { Platform } from 'react-native';
import { post, put } from './client';
import { ApiRoutes } from './routes';
import { getOrCreateDeviceId } from '../storage';

/**
 * Utilitaire pour afficher des logs stylisés dans la console
 */
function logStyled(title: string, data: Record<string, any>, icon: string = '📡') {
    const width = 50;
    const border = '═'.repeat(width);
    const line = '─'.repeat(width);
    
    console.log(`\n${icon} ╔${border}╗`);
    console.log(`${icon} ║ ${title.padEnd(width - 1)}║`);
    console.log(`${icon} ╟${line}╢`);
    
    Object.entries(data).forEach(([key, value]) => {
        const content = `${key}: ${value}`;
        // Découper si trop long
        if (content.length > width - 2) {
            console.log(`${icon} ║ ${content.substring(0, width - 4)}... ║`);
        } else {
            console.log(`${icon} ║ ${content.padEnd(width - 1)}║`);
        }
    });
    
    console.log(`${icon} ╚${border}╝\n`);
}

/**
 * Interface pour les données de navigation lors du démarrage
 */
export interface NavigationStartData {
    origin: {
        lat: number;
        lng: number;
        address?: string;
    };
    destination: {
        lat: number;
        lng: number;
        address?: string;
    };
    waypoints?: Array<{
        lat: number;
        lng: number;
        address?: string;
    }>;
    routeData: string; // Polyline encodée
    distanceMeters?: number;
    durationSeconds?: number;
    travelMode: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
    metadata?: Record<string, any>;
}

/**
 * Enregistre le début d'une navigation
 * 
 * @param data - Données du trajet
 * @returns ID de l'historique enregistré
 */
export async function recordNavigationStart(data: NavigationStartData): Promise<string | null> {
    try {
        const deviceId = await getOrCreateDeviceId();
        
        const payload = {
            ...data,
            deviceId,
            deviceInfo: {
                platform: Platform.OS,
                version: Platform.Version,
                model: Platform.OS === 'ios' ? 'iPhone' : 'Android Device', // On pourrait raffiner avec expo-device
            }
        };

        logStyled('DÉBUT DE NAVIGATION', {
            'Origine': data.origin.address || `${data.origin.lat}, ${data.origin.lng}`,
            'Destination': data.destination.address || `${data.destination.lat}, ${data.destination.lng}`,
            'Mode': data.travelMode,
            'Appareil': deviceId.substring(0, 15) + '...'
        });

        const response = await post<any>(
            ApiRoutes.getFullUrl(ApiRoutes.NAVIGATION_HISTORY),
            payload
        );

        if (response?.success && response?.data?.id) {
            logStyled('NAVIGATION ENREGISTRÉE', {
                'ID': response.data.id,
                'Statut': 'Succès'
            }, '✅');
            return response.data.id;
        }

        console.warn('⚠️ [NavigationHistory] Réponse inattendue lors de l\'enregistrement:', response);
        return null;
    } catch (error) {
        console.error('❌ [NavigationHistory] Erreur lors de l\'enregistrement du début:', error);
        return null;
    }
}

/**
 * Marque un itinéraire comme terminé
 * 
 * @param historyId - ID de l'historique retourné par recordNavigationStart
 * @param metadata - Données supplémentaires optionnelles
 */
export async function recordNavigationComplete(historyId: string, metadata?: Record<string, any>): Promise<boolean> {
    if (!historyId) return false;

    try {
        const deviceId = await getOrCreateDeviceId();
        
        logStyled('COMPLÉTION NAVIGATION', {
            'ID Historique': historyId,
            'Appareil': deviceId.substring(0, 15) + '...'
        }, '📡');

        const response = await put<any>(
            ApiRoutes.getNavigationHistoryCompleteUrl(historyId),
            {
                deviceId,
                metadata
            }
        );

        if (response?.success) {
            logStyled('NAVIGATION TERMINÉE', {
                'ID': historyId,
                'Statut': 'Terminé'
            }, '✅');
            return true;
        }

        console.warn(`⚠️ [NavigationHistory] Réponse inattendue lors de la complétion:`, response);
        return false;
    } catch (error) {
        console.error(`❌ [NavigationHistory] Erreur lors de la complétion de l'itinéraire ${historyId}:`, error);
        return false;
    }
}

/**
 * Récupère l'historique de navigation de l'appareil
 * 
 * @param limit - Nombre maximum de résultats
 * @param offset - Offset pour la pagination
 */
export async function getNavigationHistory(limit = 20, offset = 0): Promise<any[]> {
    try {
        const deviceId = await getOrCreateDeviceId();
        
        const response = await fetch(
            ApiRoutes.getNavigationHistoryDeviceUrl(deviceId, { limit, offset }),
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-API-Key': ApiRoutes.API_KEY
                }
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data?.success) {
            // L'API peut renvoyer dans 'history' ou 'data'
            const historyList = data.history || data.data || [];
            return historyList;
        }

        return [];
    } catch (error) {
        console.error('❌ [NavigationHistory] Erreur lors de la récupération de l\'historique:', error);
        return [];
    }
}
