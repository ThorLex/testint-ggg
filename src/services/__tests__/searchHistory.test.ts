/**
 * Tests unitaires pour le service searchHistory
 * 
 * @module services/__tests__/searchHistory
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getSearchHistory,
    addToSearchHistory,
    removeFromSearchHistory,
    clearSearchHistory,
    cleanupExpiredHistory,
    getSearchHistoryStats,
    type SearchHistoryItem
} from '../searchHistory';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

describe('SearchHistory Service', () => {
    // ============================================================================
    // Setup & Teardown
    // ============================================================================

    beforeEach(() => {
        // Réinitialiser les mocks avant chaque test
        jest.clearAllMocks();
    });

    // ============================================================================
    // Tests getSearchHistory
    // ============================================================================

    describe('getSearchHistory', () => {
        it('should return empty array when no history exists', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const history = await getSearchHistory();

            expect(history).toEqual([]);
            expect(AsyncStorage.getItem).toHaveBeenCalledWith('@navipad_search_history');
        });

        it('should return parsed history from storage', async () => {
            const mockHistory: SearchHistoryItem[] = [
                {
                    id: '1',
                    query: 'Test 1',
                    type: 'amodiataires',
                    timestamp: Date.now(),
                },
                {
                    id: '2',
                    query: 'Test 2',
                    type: 'routes',
                    timestamp: Date.now() - 1000,
                },
            ];

            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockHistory));

            const history = await getSearchHistory();

            expect(history).toHaveLength(2);
            expect(history[0].query).toBe('Test 1');
        });

        it('should filter history by type', async () => {
            const mockHistory: SearchHistoryItem[] = [
                {
                    id: '1',
                    query: 'Test 1',
                    type: 'amodiataires',
                    timestamp: Date.now(),
                },
                {
                    id: '2',
                    query: 'Test 2',
                    type: 'routes',
                    timestamp: Date.now(),
                },
            ];

            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockHistory));

            const history = await getSearchHistory('amodiataires');

            expect(history).toHaveLength(1);
            expect(history[0].type).toBe('amodiataires');
        });

        it('should remove expired items', async () => {
            const now = Date.now();
            const thirtyOneDaysAgo = now - (31 * 24 * 60 * 60 * 1000);

            const mockHistory: SearchHistoryItem[] = [
                {
                    id: '1',
                    query: 'Recent',
                    type: 'amodiataires',
                    timestamp: now,
                },
                {
                    id: '2',
                    query: 'Expired',
                    type: 'amodiataires',
                    timestamp: thirtyOneDaysAgo,
                },
            ];

            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockHistory));

            const history = await getSearchHistory();

            expect(history).toHaveLength(1);
            expect(history[0].query).toBe('Recent');
        });

        it('should sort by timestamp descending', async () => {
            const now = Date.now();

            const mockHistory: SearchHistoryItem[] = [
                {
                    id: '1',
                    query: 'Old',
                    type: 'amodiataires',
                    timestamp: now - 2000,
                },
                {
                    id: '2',
                    query: 'New',
                    type: 'amodiataires',
                    timestamp: now,
                },
                {
                    id: '3',
                    query: 'Middle',
                    type: 'amodiataires',
                    timestamp: now - 1000,
                },
            ];

            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockHistory));

            const history = await getSearchHistory();

            expect(history[0].query).toBe('New');
            expect(history[1].query).toBe('Middle');
            expect(history[2].query).toBe('Old');
        });
    });

    // ============================================================================
    // Tests addToSearchHistory
    // ============================================================================

    describe('addToSearchHistory', () => {
        it('should add new item to empty history', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            await addToSearchHistory('Test Query', 'amodiataires');

            expect(AsyncStorage.setItem).toHaveBeenCalled();
            const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
            expect(savedData).toHaveLength(1);
            expect(savedData[0].query).toBe('Test Query');
            expect(savedData[0].type).toBe('amodiataires');
        });

        it('should not add empty or short queries', async () => {
            await addToSearchHistory('', 'amodiataires');
            await addToSearchHistory('a', 'amodiataires');

            expect(AsyncStorage.setItem).not.toHaveBeenCalled();
        });

        it('should update existing item timestamp', async () => {
            const existingHistory: SearchHistoryItem[] = [
                {
                    id: '1',
                    query: 'Test',
                    type: 'amodiataires',
                    timestamp: Date.now() - 10000,
                },
            ];

            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingHistory));
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            await addToSearchHistory('Test', 'amodiataires');

            const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
            expect(savedData).toHaveLength(1);
            expect(savedData[0].timestamp).toBeGreaterThan(existingHistory[0].timestamp);
        });

        it('should add item with metadata', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            await addToSearchHistory('Test', 'amodiataires', {
                amodiataireId: '123',
                amodiataireName: 'Test Name',
            });

            const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
            expect(savedData[0].data).toEqual({
                amodiataireId: '123',
                amodiataireName: 'Test Name',
            });
        });

        it('should limit history to MAX_HISTORY_ITEMS', async () => {
            // Créer 50 éléments existants
            const existingHistory: SearchHistoryItem[] = Array.from({ length: 50 }, (_, i) => ({
                id: `${i}`,
                query: `Test ${i}`,
                type: 'amodiataires' as const,
                timestamp: Date.now() - i * 1000,
            }));

            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingHistory));
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            await addToSearchHistory('New Test', 'amodiataires');

            const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
            expect(savedData).toHaveLength(50); // Limité à 50
            expect(savedData[0].query).toBe('New Test'); // Le nouveau en premier
        });
    });

    // ============================================================================
    // Tests removeFromSearchHistory
    // ============================================================================

    describe('removeFromSearchHistory', () => {
        it('should remove item by id', async () => {
            const mockHistory: SearchHistoryItem[] = [
                {
                    id: '1',
                    query: 'Test 1',
                    type: 'amodiataires',
                    timestamp: Date.now(),
                },
                {
                    id: '2',
                    query: 'Test 2',
                    type: 'amodiataires',
                    timestamp: Date.now(),
                },
            ];

            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockHistory));
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            await removeFromSearchHistory('1');

            const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
            expect(savedData).toHaveLength(1);
            expect(savedData[0].id).toBe('2');
        });

        it('should handle non-existent id gracefully', async () => {
            const mockHistory: SearchHistoryItem[] = [
                {
                    id: '1',
                    query: 'Test 1',
                    type: 'amodiataires',
                    timestamp: Date.now(),
                },
            ];

            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockHistory));
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            await removeFromSearchHistory('non-existent');

            const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
            expect(savedData).toHaveLength(1); // Aucun changement
        });
    });

    // ============================================================================
    // Tests clearSearchHistory
    // ============================================================================

    describe('clearSearchHistory', () => {
        it('should clear all history when no type specified', async () => {
            (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

            await clearSearchHistory();

            expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@navipad_search_history');
        });

        it('should clear only specified type', async () => {
            const mockHistory: SearchHistoryItem[] = [
                {
                    id: '1',
                    query: 'Test 1',
                    type: 'amodiataires',
                    timestamp: Date.now(),
                },
                {
                    id: '2',
                    query: 'Test 2',
                    type: 'routes',
                    timestamp: Date.now(),
                },
            ];

            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockHistory));
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            await clearSearchHistory('amodiataires');

            const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
            expect(savedData).toHaveLength(1);
            expect(savedData[0].type).toBe('routes');
        });
    });

    // ============================================================================
    // Tests getSearchHistoryStats
    // ============================================================================

    describe('getSearchHistoryStats', () => {
        it('should return correct stats', async () => {
            const now = Date.now();
            const mockHistory: SearchHistoryItem[] = [
                {
                    id: '1',
                    query: 'Test 1',
                    type: 'amodiataires',
                    timestamp: now,
                },
                {
                    id: '2',
                    query: 'Test 2',
                    type: 'amodiataires',
                    timestamp: now - 1000,
                },
                {
                    id: '3',
                    query: 'Test 3',
                    type: 'routes',
                    timestamp: now - 2000,
                },
            ];

            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockHistory));

            const stats = await getSearchHistoryStats();

            expect(stats.total).toBe(3);
            expect(stats.byType.amodiataires).toBe(2);
            expect(stats.byType.routes).toBe(1);
            expect(stats.newestTimestamp).toBe(now);
            expect(stats.oldestTimestamp).toBe(now - 2000);
        });

        it('should return empty stats for empty history', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const stats = await getSearchHistoryStats();

            expect(stats.total).toBe(0);
            expect(stats.byType).toEqual({});
            expect(stats.newestTimestamp).toBeNull();
            expect(stats.oldestTimestamp).toBeNull();
        });
    });
});
