/**
 * Service de synthèse vocale pour l'assistance à la navigation
 *
 * Détecte automatiquement la langue de l'application et utilise
 * la voix correspondante (français canadien ou anglais britannique).
 *
 * @module services/speech
 */

import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';
import { getLanguage } from './storage';

// Configuration Google Cloud TTS
const GOOGLE_TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_TTS_API_KEY;

console.log('🔑 [TTS] Clé TTS présente:', !!API_KEY);

/**
 * Options de configuration pour la voix
 */
export interface SpeechOptions {
    /** Langue de la voix */
    language?: string;
    /** Vitesse de lecture (0.5 à 2.0) */
    rate?: number;
    /** Hauteur de la voix (0.5 à 2.0) */
    pitch?: number;
    /** Volume (0.0 à 1.0) */
    volume?: number;
}

/**
 * Configuration par défaut pour une voix naturelle et fluide
 */
const DEFAULT_SPEECH_OPTIONS: SpeechOptions = {
    language: 'fr-CA',
    rate: 0.50,
    pitch: 0.90,
    volume: 1.0,
};

/**
 * Voix Google Cloud TTS par langue
 * Français : fr-CA-Chirp3-HD-Schedar (Premium, masculin)
 * Anglais  : en-GB-Wavenet-D (masculin)
 */
const TTS_VOICES = {
    fr: { languageCode: 'fr-CA', name: 'fr-CA-Chirp3-HD-Schedar' },
    en: { languageCode: 'en-GB', name: 'en-GB-Wavenet-D' },
};

/**
 * Retourne la langue TTS selon la langue de l'application.
 */
const getSpeechLanguage = async (): Promise<string> => {
    try {
        const appLanguage = await getLanguage();
        const lang = appLanguage === 'en' ? 'en-GB' : 'fr-CA';
        console.log('🗣️ Langue TTS:', lang, '(app:', appLanguage + ')');
        return lang;
    } catch (error) {
        console.error('❌ Erreur récupération langue:', error);
        return 'fr-CA';
    }
};

/**
 * Flag pour savoir si TTS est initialisé
 */
let ttsInitialized = false;

const initializeTts = async () => {
    if (ttsInitialized) return;
    ttsInitialized = true;
    console.log('✅ TTS initialisé');
};

/**
 * Instance globale pour le son Google TTS
 */
let googleSound: Audio.Sound | null = null;

/**
 * Parler en utilisant l'API Google Cloud TTS (Chirp3-HD / WaveNet)
 */
async function speakWithGoogleCloud(text: string, language: string): Promise<boolean> {
    if (!API_KEY) {
        console.warn('⚠️ [TTS] Pas de clé API (EXPO_PUBLIC_GOOGLE_TTS_API_KEY) dans .env');
        return false;
    }

    const isFrench = language.startsWith('fr');
    const voice = isFrench ? TTS_VOICES.fr : TTS_VOICES.en;

    console.log(`🎤 [TTS] Synthèse: "${text.substring(0, 30)}..." [${voice.name}]`);

    try {
        const body = {
            input: { text },
            voice: {
                languageCode: voice.languageCode,
                name: voice.name,
                ssmlGender: 'MALE',
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: 0.9,
                // Chirp3-HD ne supporte pas pitch — WaveNet (en-GB) l'accepte
                ...(isFrench ? {} : { pitch: -13 }),
            },
        };

        const response = await fetch(`${GOOGLE_TTS_ENDPOINT}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (data.error) {
            console.error('❌ [TTS] Erreur API Google:', data.error.message);
            if (data.error.status === 'PERMISSION_DENIED') {
                console.error('👉 Vérifiez que "Cloud Text-to-Speech API" est activée sur votre console Google Cloud.');
            }
            return false;
        }

        if (data.audioContent) {
            console.log('✅ [TTS] Audio reçu (base64)');
            const path = `${FileSystem.cacheDirectory}narration.mp3`;
            await FileSystem.writeAsStringAsync(path, data.audioContent, {
                encoding: 'base64' as any,
            });

            // Arrêter et libérer le son précédent proprement
            if (googleSound) {
                try { await googleSound.stopAsync(); } catch {}
                try { await googleSound.unloadAsync(); } catch {}
                googleSound = null;
            }

            const { sound } = await Audio.Sound.createAsync({ uri: path });
            googleSound = sound;

            sound.setOnPlaybackStatusUpdate(async (status) => {
                if (!status.isLoaded) return;
                if (status.didJustFinish) {
                    try { await sound.unloadAsync(); } catch {}
                    try { await FileSystem.deleteAsync(path, { idempotent: true }); } catch {}
                    if (googleSound === sound) googleSound = null;
                }
            });

            await sound.playAsync();
            console.log('✨ [TTS] Lecture démarrée:', text);
            return true;
        } else {
            console.warn('⚠️ [TTS] Pas d\'audioContent dans la réponse:', data);
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur Google Cloud TTS:', error);
        return false;
    }
}

/**
 * Parler un texte avec synthèse vocale.
 * Tente d'abord Google Cloud TTS puis bascule sur expo-speech.
 */
export async function speak(text: string, options?: SpeechOptions): Promise<void> {
    try {
        await initializeTts();

        const appLanguage = await getSpeechLanguage();
        const success = await speakWithGoogleCloud(text, appLanguage);

        if (!success) {
            console.log('🔄 Basculement sur la voix système (expo-speech)');
            const speechOptions = {
                ...DEFAULT_SPEECH_OPTIONS,
                language: appLanguage,
                ...options,
            };
            await Speech.speak(text, {
                language: speechOptions.language,
                rate: speechOptions.rate,
                pitch: speechOptions.pitch,
                volume: speechOptions.volume,
            });
        }
    } catch (error) {
        console.error('❌ Erreur générale synthèse vocale:', error);
    }
}

/**
 * Arrêter la synthèse vocale en cours (les deux moteurs)
 */
export async function stopSpeaking(): Promise<void> {
    try { await Speech.stop(); } catch {}

    if (googleSound) {
        const soundToStop = googleSound;
        googleSound = null;
        try { await soundToStop.stopAsync(); } catch {}
        try { await soundToStop.unloadAsync(); } catch {}
    }

    console.log('🔇 Synthèse vocale arrêtée');
}

/**
 * Vérifier si la synthèse vocale est en cours
 */
export async function isSpeaking(): Promise<boolean> {
    try {
        const isSpeechSpeaking = await Speech.isSpeakingAsync();
        let isGoogleSpeaking = false;

        if (googleSound) {
            const status = await googleSound.getStatusAsync();
            isGoogleSpeaking = status.isLoaded && status.isPlaying;
        }

        return isSpeechSpeaking || isGoogleSpeaking;
    } catch (error) {
        console.error('❌ Erreur vérification synthèse vocale:', error);
        return false;
    }
}

/**
 * Obtenir les voix disponibles pour une langue donnée
 */
export async function getAvailableVoices(languageCode?: string): Promise<any[]> {
    try {
        const voices = await Speech.getAvailableVoicesAsync();
        if (!languageCode) return voices;
        return voices.filter((voice: any) =>
            voice.language && voice.language.startsWith(languageCode)
        );
    } catch (error) {
        console.error('❌ Erreur récupération voix:', error);
        return [];
    }
}
