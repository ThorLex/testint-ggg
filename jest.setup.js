// Jest setup file

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    default: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        getAllKeys: jest.fn(),
        multiGet: jest.fn(),
        multiSet: jest.fn(),
        multiRemove: jest.fn(),
    },
}));

// Mock expo-blur
jest.mock('expo-blur', () => ({
    BlurView: 'BlurView',
}));

// Mock expo-application
jest.mock('expo-application', () => ({
    applicationId: 'com.test.app',
    applicationName: 'TestApp',
    nativeApplicationVersion: '1.0.0',
    nativeBuildVersion: '1',
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, fallback?: string) => fallback || key,
        i18n: {
            changeLanguage: jest.fn(),
            language: 'en',
        },
    }),
}));

// Suppress console logs during tests (optional)
if (process.env.NODE_ENV === 'test') {
    global.console = {
        ...console,
        log: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
    };
}