/**
 * Service de stockage local avec AsyncStorage
 * 
 * Ce fichier fournit une interface simple pour stocker et récupérer
 * des données localement sur l'appareil avec AsyncStorage.
 * 
 * Note: Pour de meilleures performances en production, utilisez MMKV avec un build natif.
 * 
 * @module services/storage
 */

import { Platform } from 'react-native';
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Wrapper pour AsyncStorage qui imite l'API de MMKV
 */
export const storage = {
    set: async (key: string, value: string | number | boolean) => {
        try {
            await AsyncStorage.setItem(key, String(value));
        } catch (error) {
            console.error(`❌ Erreur lors de la sauvegarde de ${key}:`, error);
        }
    },
    getString: async (key: string): Promise<string | undefined> => {
        try {
            const value = await AsyncStorage.getItem(key);
            return value ?? undefined;
        } catch (error) {
            console.error(`❌ Erreur lors de la récupération de ${key}:`, error);
            return undefined;
        }
    },
    getBoolean: async (key: string): Promise<boolean | undefined> => {
        try {
            const value = await AsyncStorage.getItem(key);
            if (value === null) return undefined;
            return value === 'true';
        } catch (error) {
            console.error(`❌ Erreur lors de la récupération de ${key}:`, error);
            return undefined;
        }
    },
    getNumber: async (key: string): Promise<number | undefined> => {
        try {
            const value = await AsyncStorage.getItem(key);
            if (value === null) return undefined;
            return Number(value);
        } catch (error) {
            console.error(`❌ Erreur lors de la récupération de ${key}:`, error);
            return undefined;
        }
    },
    delete: async (key: string) => {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error(`❌ Erreur lors de la suppression de ${key}:`, error);
        }
    },
    contains: async (key: string): Promise<boolean> => {
        try {
            const value = await AsyncStorage.getItem(key);
            return value !== null;
        } catch (error) {
            console.error(`❌ Erreur lors de la vérification de ${key}:`, error);
            return false;
        }
    },
    clearAll: async () => {
        try {
            await AsyncStorage.clear();
        } catch (error) {
            console.error('❌ Erreur lors de l\'effacement du stockage:', error);
        }
    },
};

// ============================================================================
// Fonctions de Stockage Génériques
// ============================================================================

/**
 * Sauvegarde une valeur dans le stockage
 * 
 * @param key - Clé de stockage
 * @param value - Valeur à stocker
 */
export async function setItem(key: string, value: any): Promise<void> {
    try {
        if (typeof value === 'string') {
            await storage.set(key, value);
        } else {
            await storage.set(key, JSON.stringify(value));
        }
    } catch (error) {
        console.error(`❌ Erreur lors de la sauvegarde de ${key}:`, error);
    }
}

/**
 * Récupère une valeur du stockage
 * 
 * @param key - Clé de stockage
 * @returns Valeur stockée ou null si non trouvée
 */
export async function getItem<T = any>(key: string): Promise<T | null> {
    try {
        const value = await storage.getString(key);
        if (!value) return null;

        // Tenter de parser en JSON
        try {
            return JSON.parse(value) as T;
        } catch {
            // Si ce n'est pas du JSON, retourner la valeur brute
            return value as unknown as T;
        }
    } catch (error) {
        console.error(`❌ Erreur lors de la récupération de ${key}:`, error);
        return null;
    }
}

/**
 * Supprime une valeur du stockage
 * 
 * @param key - Clé de stockage
 */
export async function removeItem(key: string): Promise<void> {
    try {
        await storage.delete(key);
    } catch (error) {
        console.error(`❌ Erreur lors de la suppression de ${key}:`, error);
    }
}

/**
 * Vérifie si une clé existe dans le stockage
 * 
 * @param key - Clé de stockage
 * @returns true si la clé existe, false sinon
 */
export async function hasItem(key: string): Promise<boolean> {
    return await storage.contains(key);
}

/**
 * Efface tout le stockage
 */
export async function clearAll(): Promise<void> {
    try {
        await storage.clearAll();
        console.log('✅ Stockage effacé');
    } catch (error) {
        console.error('❌ Erreur lors de l\'effacement du stockage:', error);
    }
}

// ============================================================================
// Fonctions de Stockage Spécifiques
// ============================================================================

/**
 * Clés de stockage utilisées dans l'application
 */
export const StorageKeys = {
    // Authentification
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_PROFILE: 'user_profile',

    // Premier lancement
    IS_FIRST_LAUNCH: 'is_first_launch',
    HAS_SEEN_TUTORIAL: 'has_seen_tutorial',

    // Préférences
    THEME_MODE: 'theme_mode',
    LANGUAGE: 'language',
    MAP_TYPE: 'map_type',
    USER_PREFERENCES: 'user_preferences',

    // Cache
    AMODIATAIRES_CACHE: 'amodiataires_cache',
    AMODIATAIRES_CACHE_TIMESTAMP: 'amodiataires_cache_timestamp',
    MAP_DATA_CACHE: 'map_data_cache',
    MAP_DATA_CACHE_TIMESTAMP: 'map_data_cache_timestamp',
    ZONE_BOUNDS_CACHE: 'zone_bounds_cache',
    ZONE_BOUNDS_CACHE_TIMESTAMP: 'zone_bounds_cache_timestamp',

    // Localisation
    LAST_KNOWN_LOCATION: 'last_known_location',

    // Appareil
    DEVICE_ID: 'device_id',
} as const;

/**
 * Sauvegarde le token d'authentification
 * 
 * @param token - Token JWT
 */
export async function saveAuthToken(token: string): Promise<void> {
    await setItem(StorageKeys.AUTH_TOKEN, token);
}

/**
 * Récupère le token d'authentification
 * 
 * @returns Token JWT ou null
 */
export async function getAuthToken(): Promise<string | null> {
    const value = await storage.getString(StorageKeys.AUTH_TOKEN);
    return value || null;
}

/**
 * Supprime le token d'authentification
 */
export async function removeAuthToken(): Promise<void> {
    await removeItem(StorageKeys.AUTH_TOKEN);
}

/**
 * Sauvegarde le refresh token
 * 
 * @param token - Refresh token
 */
export async function saveRefreshToken(token: string): Promise<void> {
    await setItem(StorageKeys.REFRESH_TOKEN, token);
}

/**
 * Récupère le refresh token
 * 
 * @returns Refresh token ou null
 */
export async function getRefreshToken(): Promise<string | null> {
    const value = await storage.getString(StorageKeys.REFRESH_TOKEN);
    return value || null;
}

/**
 * Vérifie si c'est le premier lancement de l'application
 * 
 * @returns true si c'est le premier lancement
 */
export async function isFirstLaunch(): Promise<boolean> {
    const value = await storage.getBoolean(StorageKeys.IS_FIRST_LAUNCH);
    // Si la clé n'existe pas, c'est le premier lancement
    return value === undefined ? true : value;
}

/**
 * Marque que l'application a été lancée
 */
export async function markAppLaunched(): Promise<void> {
    await storage.set(StorageKeys.IS_FIRST_LAUNCH, false);
}

/**
 * Vérifie si l'utilisateur a vu le tutoriel
 * 
 * @returns true si le tutoriel a été vu
 */
export async function hasSeenTutorial(): Promise<boolean> {
    const value = await storage.getBoolean(StorageKeys.HAS_SEEN_TUTORIAL);
    return value || false;
}

/**
 * Marque que le tutoriel a été vu
 */
export async function markTutorialSeen(): Promise<void> {
    await storage.set(StorageKeys.HAS_SEEN_TUTORIAL, true);
}

/**
 * Sauvegarde le mode de thème
 * 
 * @param mode - Mode de thème ('light', 'dark', 'auto')
 */
export async function saveThemeMode(mode: 'light' | 'dark' | 'auto'): Promise<void> {
    await setItem(StorageKeys.THEME_MODE, mode);
}

/**
 * Récupère le mode de thème
 * 
 * @returns Mode de thème ou 'auto' par défaut
 */
export async function getThemeMode(): Promise<'light' | 'dark' | 'auto'> {
    const value = await getItem<'light' | 'dark' | 'auto'>(StorageKeys.THEME_MODE);
    return value || 'auto';
}

/**
 * Sauvegarde la langue de l'application
 * 
 * @param language - Code de langue ('fr', 'en')
 */
export async function saveLanguage(language: 'fr' | 'en'): Promise<void> {
    await setItem(StorageKeys.LANGUAGE, language);
}

/**
 * Récupère la langue de l'application
 * 
 * @returns Code de langue ou 'fr' par défaut
 */
export async function getLanguage(): Promise<'fr' | 'en'> {
    const value = await getItem<'fr' | 'en'>(StorageKeys.LANGUAGE);
    return value || 'fr';
}

/**
 * Sauvegarde le type de carte
 * 
 * @param type - Type de carte
 */
export async function saveMapType(type: string): Promise<void> {
    await setItem(StorageKeys.MAP_TYPE, type);
}

/**
 * Récupère le type de carte
 * 
 * @returns Type de carte ou 'standard' par défaut
 */
export async function getMapType(): Promise<string> {
    const value = await storage.getString(StorageKeys.MAP_TYPE);
    return value || 'satellite';
}

// ============================================================================
// Fonctions de Cache
// ============================================================================

/**
 * Durée de validité du cache (en millisecondes)
 */
const CACHE_DURATION = {
    AMODIATAIRES: 5 * 60 * 1000, // 5 minutes
    MAP_DATA: 10 * 60 * 1000,    // 10 minutes
    ZONE_BOUNDS: 24 * 60 * 60 * 1000, // 24 heures
};

/**
 * Sauvegarde des données en cache avec timestamp
 * 
 * @param key - Clé de cache
 * @param timestampKey - Clé du timestamp
 * @param data - Données à mettre en cache
 */
export async function saveCache<T>(key: string, timestampKey: string, data: T): Promise<void> {
    await setItem(key, data);
    await setItem(timestampKey, Date.now());
}

/**
 * Récupère des données du cache si elles sont encore valides
 * 
 * @param key - Clé de cache
 * @param timestampKey - Clé du timestamp
 * @param maxAge - Durée maximale de validité en millisecondes
 * @returns Données en cache ou null si expirées
 */
export async function getCache<T>(
    key: string,
    timestampKey: string,
    maxAge: number
): Promise<T | null> {
    const timestamp = await getItem<number>(timestampKey);

    if (!timestamp) return null;

    const age = Date.now() - timestamp;

    if (age > maxAge) {
        // Cache expiré, le supprimer
        await removeItem(key);
        await removeItem(timestampKey);
        return null;
    }

    return await getItem<T>(key);
}

/**
 * Sauvegarde les amodiataires en cache
 * 
 * @param data - Données des amodiataires
 */
export async function saveAmodiatairesCache(data: any): Promise<void> {
    await saveCache(
        StorageKeys.AMODIATAIRES_CACHE,
        StorageKeys.AMODIATAIRES_CACHE_TIMESTAMP,
        data
    );
}

/**
 * Récupère les amodiataires du cache
 * 
 * @returns Données en cache ou null
 */
export async function getAmodiatairesCache<T>(): Promise<T | null> {
    return await getCache<T>(
        StorageKeys.AMODIATAIRES_CACHE,
        StorageKeys.AMODIATAIRES_CACHE_TIMESTAMP,
        CACHE_DURATION.AMODIATAIRES
    );
}

/**
 * Sauvegarde les données de la carte en cache
 * 
 * @param data - Données de la carte
 */
export async function saveMapDataCache(data: any): Promise<void> {
    await saveCache(
        StorageKeys.MAP_DATA_CACHE,
        StorageKeys.MAP_DATA_CACHE_TIMESTAMP,
        data
    );
}

/**
 * Récupère les données de la carte du cache
 * 
 * @returns Données en cache ou null
 */
export async function getMapDataCache<T>(): Promise<T | null> {
    return await getCache<T>(
        StorageKeys.MAP_DATA_CACHE,
        StorageKeys.MAP_DATA_CACHE_TIMESTAMP,
        CACHE_DURATION.MAP_DATA
    );
}

/**
 * Récupère ou crée un ID unique pour l'appareil
 * 
 * @returns ID unique de l'appareil (Natif si possible)
 */
export async function getOrCreateDeviceId(): Promise<string> {
    try {
        // 1. Tenter de récupérer l'ID natif en priorité
        let nativeId: string | null = null;
        try {
            if (Platform.OS === 'android') {
                nativeId = Application.getAndroidId();
            } else if (Platform.OS === 'ios') {
                nativeId = await Application.getIosIdForVendorAsync();
            }
        } catch (e) {
            console.warn('⚠️ Impossible de récupérer l\'ID natif:', e);
        }

        // 2. Si on a un ID natif, on l'utilise et on met à jour le stockage
        if (nativeId) {
            const storedId = await storage.getString(StorageKeys.DEVICE_ID);
            if (nativeId !== storedId) {
                await storage.set(StorageKeys.DEVICE_ID, nativeId);
                console.log('📱 ID d\'appareil natif synchronisé:', nativeId);
            }
            return nativeId;
        }

        // 3. Fallback sur l'ID stocké
        const storedId = await storage.getString(StorageKeys.DEVICE_ID);
        if (storedId) return storedId;

        // 4. Ultime fallback : génération aléatoire
        const fallbackId = Math.random().toString(36).substring(2, 15) + 
                          Math.random().toString(36).substring(2, 15);
        await storage.set(StorageKeys.DEVICE_ID, fallbackId);
        console.log('📱 Utilisation d\'un ID de secours généré:', fallbackId);
        return fallbackId;
    } catch (error) {
        console.error('❌ Erreur getOrCreateDeviceId:', error);
        return 'unknown-device-' + Date.now();
    }
}
