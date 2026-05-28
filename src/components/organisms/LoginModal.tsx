/**
 * Composant LoginModal (Organism)
 * 
 * Modal de connexion pour les amodiataires.
 * 
 * @module components/organisms/LoginModal
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import {
    XMarkIcon,
    LockClosedIcon,
    EyeIcon,
    EyeSlashIcon,
    EnvelopeIcon,
    ArrowRightIcon,
} from 'react-native-heroicons/outline';
import {
    UserIcon as UserIconSolid,
} from 'react-native-heroicons/solid';

// Components & Hooks
import { Input, Button } from '@/components/atoms';
import { useLogin } from '@/hooks/useApi';
import { useAuthStore } from '@/store/auth';
import { useCustomAlert, showSuccessAlert, showErrorAlert } from '@/hooks/useCustomAlert';
import type { AmodiatairProfile } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// Props
// ============================================================================

export interface LoginModalProps {
    /** Visibilité de la modal */
    visible: boolean;
    /** Callback de fermeture */
    onClose: () => void;
    /** Callback de connexion réussie */
    onLoginSuccess?: () => void;
}

// ============================================================================
// Composant
// ============================================================================

/**
 * Composant LoginModal
 */
export function LoginModal({ visible, onClose, onLoginSuccess }: LoginModalProps) {
    const { t } = useTranslation();
    const loginMutation = useLogin();
    const { login } = useAuthStore();
    const { AlertComponent, showAlert } = useCustomAlert();

    // ============================================================================
    // État Local
    // ============================================================================

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // ============================================================================
    // Validation
    // ============================================================================

    /**
     * Valider l'email
     */
    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            setEmailError(t('login.emailRequired', 'Email requis'));
            return false;
        }
        if (!emailRegex.test(email)) {
            setEmailError(t('login.emailInvalid', 'Email invalide'));
            return false;
        }
        setEmailError('');
        return true;
    };

    /**
     * Valider le mot de passe
     */
    const validatePassword = (password: string) => {
        if (!password.trim()) {
            setPasswordError(t('login.passwordRequired', 'Mot de passe requis'));
            return false;
        }
        if (password.length < 6) {
            setPasswordError(t('login.passwordTooShort', 'Minimum 6 caractères'));
            return false;
        }
        setPasswordError('');
        return true;
    };

    // ============================================================================
    // Handlers
    // ============================================================================

    /**
     * Gère la soumission du formulaire
     */
    const handleSubmit = async () => {
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        try {
            const response = await loginMutation.mutateAsync({ email, password });
            
            // L'API retourne accessToken, pas token
            const token = response.accessToken;
            const apiUser = response.user;
            
            // Vérifier que les données sont présentes
            if (!token || !apiUser) {
                throw new Error('Données de connexion manquantes');
            }
            
            // Créer un objet utilisateur compatible avec AmodiatairProfile
            const user: AmodiatairProfile = {
                id: apiUser.id,
                email: apiUser.email,
                nom: '', // Ces champs seront remplis lors du chargement du profil complet
                prenom: '',
                telephone: '',
                adresseAlphanumérique: '',
                photos: [],
                videos: [],
                documents: [],
                preferences: {
                    notifications: true,
                    langue: 'fr',
                    theme: 'auto',
                },
            };
            
            // Sauvegarder le token et l'utilisateur
            await login(token, user);
            
            // Sauvegarder aussi le refresh token
            if (response.refreshToken) {
                await AsyncStorage.setItem('@navipad:refresh_token', response.refreshToken);
            }
            
            // Fermer la modal de connexion et ouvrir le dashboard
            handleClose();
            onLoginSuccess?.();
            
        } catch (error: any) {
            console.error('❌ Erreur connexion:', error);
            showAlert(showErrorAlert(
                t('login.error', 'Erreur'),
                error?.response?.data?.message || error?.message || t('login.genericError', 'Email ou mot de passe incorrect')
            ));
        }
    };

    /**
     * Réinitialise le formulaire à la fermeture
     */
    const handleClose = () => {
        setEmail('');
        setPassword('');
        setEmailError('');
        setPasswordError('');
        setShowPassword(false);
        onClose();
    };

    // ============================================================================
    // Responsive Design
    // ============================================================================

    const isTablet = SCREEN_WIDTH >= 768;
    const containerPadding = isTablet ? 'px-8' : 'px-6';
    const maxWidth = isTablet ? 'max-w-md mx-auto' : '';

    // ============================================================================
    // Rendu Principal
    // ============================================================================

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <View className="flex-1 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
                    {/* Logo en haut à gauche - sans fond */}
                    <View className="absolute top-12 left-4 z-20">
                        <Image
                            source={require('../../../assets/icon.png')}
                            className="w-12 h-12"
                            resizeMode="contain"
                        />
                    </View>

                    {/* Header avec fermeture */}
                    <View className="pt-12 pb-4 px-4">
                        <TouchableOpacity
                            onPress={handleClose}
                            className="absolute top-12 right-4 w-10 h-10 items-center justify-center rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-10"
                        >
                            <XMarkIcon size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView 
                        className="flex-1" 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 1 }}
                    >
                        <View className={`flex-1 justify-center ${containerPadding} ${maxWidth}`}>
                            {/* Logo et titre */}
                            <View className="items-center mb-8">
                                <View className="w-20 h-20 bg-primary-500 rounded-3xl items-center justify-center mb-6 shadow-lg">
                                    <UserIconSolid size={40} color="white" />
                                </View>
                                
                                <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    {t('login.welcomeBack', 'Bon retour !')}
                                </Text>
                                
                                <Text className="text-gray-600 dark:text-gray-400 text-center leading-6">
                                    {t('login.signInSubtitle', 'Connectez-vous pour accéder à votre espace amodiataire')}
                                </Text>
                            </View>

                            {/* Formulaire */}
                            <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
                                <View className="space-y-4">
                                    {/* Email */}
                                    <View>
                                        <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                                            {t('login.email', 'Adresse email')}
                                        </Text>
                                        <Input
                                            value={email}
                                            onChangeText={(text) => {
                                                setEmail(text);
                                                if (emailError) validateEmail(text);
                                            }}
                                            placeholder="exemple@email.com"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoComplete="email"
                                            leftIcon={<EnvelopeIcon size={20} color="#9CA3AF" />}
                                            className={`${emailError ? 'border-red-300 dark:border-red-600' : ''}`}
                                        />
                                        {emailError ? (
                                            <Text className="text-red-500 text-sm mt-1">{emailError}</Text>
                                        ) : null}
                                    </View>

                                    {/* Mot de passe */}
                                    <View>
                                        <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                                            {t('login.password', 'Mot de passe')}
                                        </Text>
                                        <Input
                                            value={password}
                                            onChangeText={(text) => {
                                                setPassword(text);
                                                if (passwordError) validatePassword(text);
                                            }}
                                            placeholder={t('login.passwordPlaceholder', 'Votre mot de passe')}
                                            secureTextEntry={!showPassword}
                                            autoComplete="password"
                                            leftIcon={<LockClosedIcon size={20} color="#9CA3AF" />}
                                            rightIcon={
                                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                                    {showPassword ? (
                                                        <EyeSlashIcon size={20} color="#9CA3AF" />
                                                    ) : (
                                                        <EyeIcon size={20} color="#9CA3AF" />
                                                    )}
                                                </TouchableOpacity>
                                            }
                                            className={`${passwordError ? 'border-red-300 dark:border-red-600' : ''}`}
                                        />
                                        {passwordError ? (
                                            <Text className="text-red-500 text-sm mt-1">{passwordError}</Text>
                                        ) : null}
                                    </View>
                                </View>

                                {/* Bouton principal */}
                                <Button
                                    onPress={handleSubmit}
                                    loading={loginMutation.isPending}
                                    className="mt-6 bg-primary-500 py-4"
                                    rightIcon={<ArrowRightIcon size={20} color="white" />}
                                >
                                    {t('login.signIn', 'Se connecter')}
                                </Button>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
            
            {/* Alerte personnalisée */}
            {AlertComponent}
        </Modal>
    );
}
