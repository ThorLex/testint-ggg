/**
 * Store Zustand pour l'authentification
 * 
 * Gère l'état d'authentification de l'utilisateur
 * 
 * @module store/auth
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AmodiatairProfile } from '@/types';

// ============================================================================
// Interface du Store
// ============================================================================

interface AuthState {
    // État
    isAuthenticated: boolean;
    user: AmodiatairProfile | null;
    token: string | null;
    
    // Actions
    login: (token: string, user: AmodiatairProfile) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (user: AmodiatairProfile) => void;
    initialize: () => Promise<void>;
}

// ============================================================================
// Clés de stockage
// ============================================================================

const AUTH_TOKEN_KEY = '@navipad:auth_token';
const AUTH_USER_KEY = '@navipad:auth_user';

// ============================================================================
// Store Zustand
// ============================================================================

export const useAuthStore = create<AuthState>((set) => ({
    // État initial
    isAuthenticated: false,
    user: null,
    token: null,

    // Connexion
    login: async (token: string, user: AmodiatairProfile) => {
        try {
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
            await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
            
            set({
                isAuthenticated: true,
                token,
                user,
            });
            
            console.log('✅ Utilisateur connecté:', user.email);
        } catch (error) {
            console.error('❌ Erreur sauvegarde authentification:', error);
            throw error;
        }
    },

    // Déconnexion
    logout: async () => {
        try {
            await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
            await AsyncStorage.removeItem(AUTH_USER_KEY);
            
            set({
                isAuthenticated: false,
                token: null,
                user: null,
            });
            
            console.log('✅ Utilisateur déconnecté');
        } catch (error) {
            console.error('❌ Erreur déconnexion:', error);
            throw error;
        }
    },

    // Mise à jour du profil
    updateUser: (user: AmodiatairProfile) => {
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        set({ user });
    },

    // Initialisation
    initialize: async () => {
        try {
            const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
            const userJson = await AsyncStorage.getItem(AUTH_USER_KEY);
            
            if (token && userJson) {
                const user = JSON.parse(userJson);
                set({
                    isAuthenticated: true,
                    token,
                    user,
                });
                console.log('✅ Session restaurée:', user.email);
            }
        } catch (error) {
            console.error('❌ Erreur initialisation auth:', error);
        }
    },
}));
