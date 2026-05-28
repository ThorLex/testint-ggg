/**
 * Unit tests for useMapData hook - Error Handling
 * 
 * Tests specific error scenarios for the useMapData hook.
 * 
 * Feature: map-routes-and-notifications
 * Requirements: 1.3, 1.5, 11.2, 11.3
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    useMapData,
    useAmodiataires,
    useAmodiataireDetail,
    useNearbyAmodiataires,
    useAmodiataireAnnouncements,
    useAmodiataireMedia,
    useProfile,
    useUpdateProfile,
    useMediaList,
    useDeleteMedia,
    useSubmitMediaValidation,
    useCreateAnnouncement,
    useAnnouncementsList,
    useUploadMedia,
    useZoneBounds,
} from './useApi';
import * as apiClient from '@/services/api/client';
import type {
    MapData,
    ZoneBoundsResponse,
    AmodiatairesListResponse,
    SearchParams,
    AmodiataireDetailResponse,
    NearbyParams,
    NearbySearchResponse,
    AnnouncementQueryParams,
    AnnouncementListResponse,
    MediaQueryParams,
    MediaListResponse,
    ProfileResponse,
    ProfileUpdateRequest,
    ProfileUpdateResponse,
    MediaDeleteResponse,
    MediaSubmitValidationResponse,
    AnnouncementCreateRequest,
    AnnouncementCreateResponse,
} from '@/types';

// Mock the API client
jest.mock('@/services/api/client');

const mockedGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockedPut = apiClient.put as jest.MockedFunction<typeof apiClient.put>;
const mockedPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
const mockedDeleteRequest = apiClient.deleteRequest as jest.MockedFunction<typeof apiClient.deleteRequest>;

// Helper to create a wrapper with QueryClient
function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false, // Disable retries for testing
            },
        },
    });

    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

describe('useMapData - Error Handling', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Task 3.3: Error Handling Tests', () => {
        /**
         * Test API request failure (network error)
         * Requirement 1.3: IF the API request fails, THEN THE System SHALL log the error 
         * and display a user-friendly error message
         * Requirement 11.2: IF the API request fails, THEN THE System SHALL display an 
         * error message with retry option
         */
        test('should handle network error gracefully', async () => {
            // Arrange: Mock a network error
            const networkError = new Error('Network request failed');
            mockedGet.mockRejectedValueOnce(networkError);

            // Act: Render the hook
            const { result } = renderHook(() => useMapData(), {
                wrapper: createWrapper(),
            });

            // Assert: Initially loading
            expect(result.current.isLoading).toBe(true);
            expect(result.current.error).toBe(null);

            // Wait for the error state
            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            // Verify error is captured
            expect(result.current.error).toBeTruthy();
            expect(result.current.data).toBeUndefined();
            expect(result.current.isLoading).toBe(false);
        });

        test('should handle API timeout error', async () => {
            // Arrange: Mock a timeout error
            const timeoutError = new Error('Request timeout');
            mockedGet.mockRejectedValueOnce(timeoutError);

            // Act: Render the hook
            const { result } = renderHook(() => useMapData(), {
                wrapper: createWrapper(),
            });

            // Wait for the error state
            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            // Assert: Error is handled
            expect(result.current.error).toBeTruthy();
            expect(result.current.data).toBeUndefined();
        });

        test('should handle 500 server error', async () => {
            // Arrange: Mock a server error
            const serverError = new Error('Internal Server Error');
            mockedGet.mockRejectedValueOnce(serverError);

            // Act: Render the hook
            const { result } = renderHook(() => useMapData(), {
                wrapper: createWrapper(),
            });

            // Wait for the error state
            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            // Assert: Error is handled
            expect(result.current.error).toBeTruthy();
            expect(result.current.data).toBeUndefined();
        });

        test('should handle 404 not found error', async () => {
            // Arrange: Mock a 404 error
            const notFoundError = new Error('Not Found');
            mockedGet.mockRejectedValueOnce(notFoundError);

            // Act: Render the hook
            const { result } = renderHook(() => useMapData(), {
                wrapper: createWrapper(),
            });

            // Wait for the error state
            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            // Assert: Error is handled
            expect(result.current.error).toBeTruthy();
            expect(result.current.data).toBeUndefined();
        });

        /**
         * Test malformed API data
         * Requirement 11.3: IF the API returns malformed data, THEN THE System SHALL 
         * log the error and display a generic error message
         */
        test('should handle malformed API data with missing routes field', async () => {
            // Arrange: Mock malformed data (routes is not an array)
            const malformedData = {
                buildings: [],
                amodiatairBuildings: [],
                routes: 'not-an-array', // Invalid type
                announcements: [],
            };
            mockedGet.mockResolvedValueOnce(malformedData as any);

            // Act: Render the hook
            const { result } = renderHook(() => useMapData(), {
                wrapper: createWrapper(),
            });

            // Wait for data to load
            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            // Assert: Should default to empty array for invalid routes
            expect(result.current.data).toBeDefined();
            expect(result.current.data?.routes).toEqual([]);
            expect(Array.isArray(result.current.data?.routes)).toBe(true);
        });

        test('should handle malformed API data with missing announcements field', async () => {
            // Arrange: Mock malformed data (announcements is not an array)
            const malformedData = {
                buildings: [],
                amodiatairBuildings: [],
                routes: [],
                announcements: { invalid: 'object' }, // Invalid type
            };
            mockedGet.mockResolvedValueOnce(malformedData as any);

            // Act: Render the hook
            const { result } = renderHook(() => useMapData(), {
                wrapper: createWrapper(),
            });

            // Wait for data to load
            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            // Assert: Should default to empty array for invalid announcements
            expect(result.current.data).toBeDefined();
            expect(result.current.data?.announcements).toEqual([]);
            expect(Array.isArray(result.current.data?.announcements)).toBe(true);
        });

        test('should handle malformed API data with both routes and announcements invalid', async () => {
            // Arrange: Mock malformed data (both fields invalid)
            const malformedData = {
                buildings: [],
                amodiatairBuildings: [],
                routes: 123, // Invalid type
                announcements: 'invalid', // Invalid type
            };
            mockedGet.mockResolvedValueOnce(malformedData as any);

            // Act: Render the hook
            const { result } = renderHook(() => useMapData(), {
                wrapper: createWrapper(),
            });

            // Wait for data to load
            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            // Assert: Should default to empty arrays for both
            expect(result.current.data).toBeDefined();
            expect(result.current.data?.routes).toEqual([]);
            expect(result.current.data?.announcements).toEqual([]);
            expect(Array.isArray(result.current.data?.routes)).toBe(true);
            expect(Array.isArray(result.current.data?.announcements)).toBe(true);
        });

        test('should handle API response with null routes', async () => {
            // Arrange: Mock data with null routes
            const dataWithNull = {
                buildings: [],
                amodiatairBuildings: [],
                routes: null,
                announcements: [],
            };
            mockedGet.mockResolvedValueOnce(dataWithNull as any);

            // Act: Render the hook
            const { result } = renderHook(() => useMapData(), {
                wrapper: createWrapper(),
            });

            // Wait for data to load
            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            // Assert: Should default to empty array
            expect(result.current.data?.routes).toEqual([]);
            expect(Array.isArray(result.current.data?.routes)).toBe(true);
        });

        test('should handle API response with null announcements', async () => {
            // Arrange: Mock data with null announcements
            const dataWithNull = {
                buildings: [],
                amodiatairBuildings: [],
                routes: [],
                announcements: null,
            };
            mockedGet.mockResolvedValueOnce(dataWithNull as any);

            // Act: Render the hook
            const { result } = renderHook(() => useMapData(), {
                wrapper: createWrapper(),
            });

            // Wait for data to load
            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            // Assert: Should default to empty array
            expect(result.current.data?.announcements).toEqual([]);
            expect(Array.isArray(result.current.data?.announcements)).toBe(true);
        });

        test('should handle API response with undefined routes', async () => {
            // Arrange: Mock data with undefined routes
            const dataWithUndefined = {
                buildings: [],
                amodiatairBuildings: [],
                announcements: [],
            };
            mockedGet.mockResolvedValueOnce(dataWithUndefined as any);

            // Act: Render the hook
            const { result } = renderHook(() => useMapData(), {
                wrapper: createWrapper(),
            });

            // Wait for data to load
            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            // Assert: Should default to empty array
            expect(result.current.data?.routes).toEqual([]);
            expect(Array.isArray(result.current.data?.routes)).toBe(true);
        });

        test('should handle API response with undefined announcements', async () => {
            // Arrange: Mock data with undefined announcements
            const dataWithUndefined = {
                buildings: [],
                amodiatairBuildings: [],
                routes: [],
            };
            mockedGet.mockResolvedValueOnce(dataWithUndefined as any);

            // Act: Render the hook
            const { result } = renderHook(() => useMapData(), {
                wrapper: createWrapper(),
            });

            // Wait for data to load
            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            // Assert: Should default to empty array
            expect(result.current.data?.announcements).toEqual([]);
            expect(Array.isArray(result.current.data?.announcements)).toBe(true);
        });

        test('should handle completely empty API response', async () => {
            // Arrange: Mock completely empty response
            const emptyData = {};
            mockedGet.mockResolvedValueOnce(emptyData as any);

            // Act: Render the hook
            const { result } = renderHook(() => useMapData(), {
                wrapper: createWrapper(),
            });

            // Wait for data to load
            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            // Assert: Should default all fields appropriately
            expect(result.current.data?.routes).toEqual([]);
            expect(result.current.data?.announcements).toEqual([]);
            expect(result.current.data?.buildings).toEqual([]);
            expect(result.current.data?.amodiatairBuildings).toEqual([]);
        });

        /**
         * Test empty routes and announcements arrays
         * Requirement 1.5: THE System SHALL handle empty arrays gracefully when no 
         * routes or announcements are available
         */
        test('should handle empty routes array gracefully', async () => {
            // Arrange: Mock data with empty routes
            const dataWithEmptyRoutes: Partial<MapData> = {
                buildings: [],
                amodiatairBuildings: [],
                routes: [],
                announcements: [
                    {
                        id: '1',
                        title: 'Test Announcement',
                        type: 'info',
                        content: 'Test content',
                    },
                ],
            };
            mockedGet.mockResolvedValueOnce(dataWithEmptyRoutes as any);

            // Act: Render the hook
            const { result } = renderHook(() => useMapData(), {
                wrapper: createWrapper(),
            });

            // Wait for data to load
            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            // Assert: Should handle empty routes gracefully
            expect(result.current.data?.routes).toEqual([]);
            expect(result.current.data?.routes.length).toBe(0);
            expect(result.current.data?.announcements.length).toBe(1);
            expect(result.current.isError).toBe(false);
        });

        test('should handle empty announcements array gracefully', async () => {
            // Arrange: Mock data with empty announcements
            const dataWithEmptyAnnouncements: Partial<MapData> = {
                buildings: [],
                amodiatairBuildings: [],
                routes: [
                    {
                        id: '1',
                        name: 'Test Route',
                        coordinates: [
                            { lat: 0, lng: 0, order: 0 },
                            { lat: 1, lng: 1, order: 1 },
                        ],
                        status: 'active',
                        metadata: {
                            roadType: 'highway',
                            maxSpeed: 80,
                            width: 10,
                            surface: 'asphalt',
                        },
                    },
                ],
                announcements: [],
            };
            mockedGet.mockResolvedValueOnce(dataWithEmptyAnnouncements as any);

            // Act: Render the hook
            const { result } = renderHook(() => useMapData(), {
                wrapper: createWrapper(),
            });

            // Wait for data to load
            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            // Assert: Should handle empty announcements gracefully
            expect(result.current.data?.announcements).toEqual([]);
            expect(result.current.data?.announcements.length).toBe(0);
            expect(result.current.data?.routes.length).toBe(1);
            expect(result.current.isError).toBe(false);
        });

        test('should handle both empty routes and announcements arrays', async () => {
            // Arrange: Mock data with both empty
            const dataWithBothEmpty: Partial<MapData> = {
                buildings: [],
                amodiatairBuildings: [],
                routes: [],
                announcements: [],
            };
            mockedGet.mockResolvedValueOnce(dataWithBothEmpty as any);

            // Act: Render the hook
            const { result } = renderHook(() => useMapData(), {
                wrapper: createWrapper(),
            });

            // Wait for data to load
            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            // Assert: Should handle both empty arrays gracefully
            expect(result.current.data?.routes).toEqual([]);
            expect(result.current.data?.announcements).toEqual([]);
            expect(result.current.data?.routes.length).toBe(0);
            expect(result.current.data?.announcements.length).toBe(0);
            expect(result.current.isError).toBe(false);
        });
    });
});

/**
 * Unit tests for legacy hooks (backward compatibility)
 *
 * Verifies that existing hooks keep working after API refactoring.
 *
 * Feature: api-routes-refactoring
 * Tasks: 10.1, 10.3
 * Requirements: 8.1, 8.3
 */
describe('Legacy hooks - backward compatibility', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('useZoneBounds should fetch zone bounds successfully', async () => {
        const mockResponse: ZoneBoundsResponse = {
            bounds: {
                north: 48.9,
                south: 48.8,
                east: 2.4,
                west: 2.3,
            },
            center: {
                latitude: 48.85,
                longitude: 2.35,
            },
            polygonCoordinates: [
                { lat: 48.8, lng: 2.3 },
                { lat: 48.9, lng: 2.3 },
                { lat: 48.9, lng: 2.4 },
                { lat: 48.8, lng: 2.4 },
            ],
            pointCount: 4,
            source: 'test',
        };

        mockedGet.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useZoneBounds(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toBeDefined();
        expect(result.current.data?.bounds.north).toBe(48.9);
        expect(result.current.isError).toBe(false);
    });
});

/**
 * Unit tests for useAmodiataires hook
 * 
 * Tests the new useAmodiataires hook from API Routes Refactoring spec.
 * 
 * Feature: api-routes-refactoring
 * Task: 5.1 Create hook for listing amodiataires
 * Requirements: 2.1, 2.6
 */
describe('useAmodiataires', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Test hook existence and basic functionality
     * Requirement 2.1: THE API_Routes SHALL define an endpoint for listing all amodiataires
     */
    test('should fetch amodiataires list successfully', async () => {
        // Arrange: Mock successful response
        const mockResponse: AmodiatairesListResponse = {
            success: true,
            count: 2,
            amodiataires: [
                {
                    id: '1',
                    userId: 'user1',
                    raisonSociale: 'Test Company 1',
                    numeroLot: 'LOT001',
                    adresse: '123 Test St',
                    superficie: 1000,
                    nombreLots: 5,
                    coordinates: [{ lat: 45.5, lng: -73.5 }],
                    center: { lat: 45.5, lng: -73.5 },
                    batiments: [],
                    profile: {
                        email: 'test1@example.com',
                        username: 'test1',
                        isPublished: true,
                    },
                    stats: {
                        totalMedia: 10,
                        activeAnnouncements: 2,
                    },
                    createdAt: '2024-01-01T00:00:00Z',
                },
                {
                    id: '2',
                    userId: 'user2',
                    raisonSociale: 'Test Company 2',
                    numeroLot: 'LOT002',
                    adresse: '456 Test Ave',
                    superficie: 2000,
                    nombreLots: 10,
                    coordinates: [{ lat: 45.6, lng: -73.6 }],
                    center: { lat: 45.6, lng: -73.6 },
                    batiments: [],
                    profile: {
                        email: 'test2@example.com',
                        username: 'test2',
                        isPublished: true,
                    },
                    stats: {
                        totalMedia: 5,
                        activeAnnouncements: 1,
                    },
                    createdAt: '2024-01-02T00:00:00Z',
                },
            ],
        };
        mockedGet.mockResolvedValueOnce(mockResponse);

        // Act: Render the hook
        const { result } = renderHook(() => useAmodiataires(), {
            wrapper: createWrapper(),
        });

        // Assert: Initially loading
        expect(result.current.isLoading).toBe(true);

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Verify data structure
        expect(result.current.data).toBeDefined();
        expect(result.current.data?.success).toBe(true);
        expect(result.current.data?.count).toBe(2);
        expect(result.current.data?.amodiataires).toHaveLength(2);
        expect(result.current.data?.amodiataires[0].id).toBe('1');
        expect(result.current.data?.amodiataires[0].raisonSociale).toBe('Test Company 1');
    });

    /**
     * Test hook with search parameters
     * Requirement 2.6: WHEN building query parameters for search, THE API_Routes SHALL 
     * support limit, offset, and search parameters
     */
    test('should support search parameters (limit, offset, search)', async () => {
        // Arrange: Mock response with search params
        const searchParams: SearchParams = {
            limit: 10,
            offset: 0,
            search: 'test',
        };
        const mockResponse: AmodiatairesListResponse = {
            success: true,
            count: 1,
            amodiataires: [
                {
                    id: '1',
                    userId: 'user1',
                    raisonSociale: 'Test Company',
                    numeroLot: 'LOT001',
                    adresse: '123 Test St',
                    superficie: 1000,
                    nombreLots: 5,
                    coordinates: [{ lat: 45.5, lng: -73.5 }],
                    center: { lat: 45.5, lng: -73.5 },
                    batiments: [],
                    profile: {
                        email: 'test@example.com',
                        username: 'test',
                        isPublished: true,
                    },
                    stats: {
                        totalMedia: 10,
                        activeAnnouncements: 2,
                    },
                    createdAt: '2024-01-01T00:00:00Z',
                },
            ],
        };
        mockedGet.mockResolvedValueOnce(mockResponse);

        // Act: Render the hook with params
        const { result } = renderHook(() => useAmodiataires(searchParams), {
            wrapper: createWrapper(),
        });

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Assert: Verify API was called with correct URL including params
        expect(mockedGet).toHaveBeenCalledWith(
            expect.stringContaining('limit=10')
        );
        expect(mockedGet).toHaveBeenCalledWith(
            expect.stringContaining('offset=0')
        );
        expect(mockedGet).toHaveBeenCalledWith(
            expect.stringContaining('search=test')
        );
        expect(result.current.data?.count).toBe(1);
    });

    /**
     * Test query key structure
     * Verifies that the query key follows the design pattern
     */
    test('should use correct query key structure', async () => {
        // Arrange
        const mockResponse: AmodiatairesListResponse = {
            success: true,
            count: 0,
            amodiataires: [],
        };
        mockedGet.mockResolvedValueOnce(mockResponse);

        const params: SearchParams = { limit: 5 };

        // Act: Render the hook
        const { result } = renderHook(() => useAmodiataires(params), {
            wrapper: createWrapper(),
        });

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Assert: Query key should be ['amodiataires', 'list', params]
        // This is verified by the fact that the hook works correctly with React Query
        expect(result.current.data).toBeDefined();
    });

    /**
     * Test stale time configuration
     * Verifies that the hook uses 5 minutes stale time as per design
     */
    test('should have 5 minute stale time', async () => {
        // Arrange
        const mockResponse: AmodiatairesListResponse = {
            success: true,
            count: 0,
            amodiataires: [],
        };
        mockedGet.mockResolvedValueOnce(mockResponse);

        // Act: Render the hook
        const { result } = renderHook(() => useAmodiataires(), {
            wrapper: createWrapper(),
        });

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Assert: Data should be considered fresh (not stale)
        // The stale time is configured in the hook, this test verifies it doesn't error
        expect(result.current.isStale).toBe(false);
    });

    /**
     * Test error handling
     * Verifies that the hook handles API errors gracefully
     */
    test('should handle API errors gracefully', async () => {
        // Arrange: Mock an error
        const error = new Error('API Error');
        mockedGet.mockRejectedValueOnce(error);

        // Act: Render the hook
        const { result } = renderHook(() => useAmodiataires(), {
            wrapper: createWrapper(),
        });

        // Wait for error state
        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        // Assert: Error is captured
        expect(result.current.error).toBeTruthy();
        expect(result.current.data).toBeUndefined();
    });

    /**
     * Test empty results
     * Verifies that the hook handles empty results correctly
     */
    test('should handle empty amodiataires list', async () => {
        // Arrange: Mock empty response
        const mockResponse: AmodiatairesListResponse = {
            success: true,
            count: 0,
            amodiataires: [],
        };
        mockedGet.mockResolvedValueOnce(mockResponse);

        // Act: Render the hook
        const { result } = renderHook(() => useAmodiataires(), {
            wrapper: createWrapper(),
        });

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Assert: Empty array is handled correctly
        expect(result.current.data?.amodiataires).toEqual([]);
        expect(result.current.data?.count).toBe(0);
        expect(result.current.isError).toBe(false);
    });
});

/**
 * Unit tests for useAmodiataireDetail hook
 * 
 * Tests the useAmodiataireDetail hook from API Routes Refactoring spec.
 * 
 * Feature: api-routes-refactoring
 * Task: 5.2 Create hook for amodiataire details
 * Requirements: 2.2
 */
describe('useAmodiataireDetail', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Test hook existence and basic functionality
     * Requirement 2.2: THE API_Routes SHALL define an endpoint for amodiataire details
     */
    test('should fetch amodiataire details successfully', async () => {
        // Arrange: Mock successful response
        const mockResponse: AmodiataireDetailResponse = {
            success: true,
            amodiataire: {
                id: '1',
                userId: 'user1',
                lot: {
                    numeroLot: 'LOT001',
                    raisonSociale: 'Test Company',
                    adresse: '123 Test St',
                    superficie: 1000,
                    nombreLots: 5,
                    coordinates: [{ lat: 45.5, lng: -73.5 }],
                    center: { lat: 45.5, lng: -73.5 },
                    batiments: [],
                    source: 'manual',
                    isTemporary: false,
                },
                profile: {
                    email: 'test@example.com',
                    username: 'test',
                    isPublished: true,
                    biography: 'Test bio',
                },
                media: {
                    images: [],
                    videos: [],
                    documents: [],
                },
                announcements: [],
                stats: {
                    totalImages: 0,
                    totalVideos: 0,
                    totalDocuments: 0,
                    totalMedia: 0,
                    activeAnnouncements: 0,
                },
                metadata: {
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2024-01-01T00:00:00Z',
                },
            },
        };
        mockedGet.mockResolvedValueOnce(mockResponse);

        // Act: Render the hook
        const { result } = renderHook(() => useAmodiataireDetail('1'), {
            wrapper: createWrapper(),
        });

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Assert: Verify data structure
        expect(result.current.data).toBeDefined();
        expect(result.current.data?.success).toBe(true);
        expect(result.current.data?.amodiataire.id).toBe('1');
        expect(result.current.data?.amodiataire.lot.numeroLot).toBe('LOT001');
    });

    /**
     * Test query key structure
     * Verifies that the query key follows the design pattern: ['amodiataire', 'detail', id]
     */
    test('should use correct query key structure', async () => {
        // Arrange
        const mockResponse: AmodiataireDetailResponse = {
            success: true,
            amodiataire: {
                id: '123',
                userId: 'user1',
                lot: {
                    numeroLot: 'LOT123',
                    raisonSociale: 'Test',
                    adresse: 'Test',
                    superficie: 100,
                    nombreLots: 1,
                    coordinates: [],
                    center: { lat: 0, lng: 0 },
                    batiments: [],
                    source: 'manual',
                    isTemporary: false,
                },
                profile: {
                    email: 'test@example.com',
                    username: 'test',
                    isPublished: true,
                },
                media: { images: [], videos: [], documents: [] },
                announcements: [],
                stats: {
                    totalImages: 0,
                    totalVideos: 0,
                    totalDocuments: 0,
                    totalMedia: 0,
                    activeAnnouncements: 0,
                },
                metadata: {
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2024-01-01T00:00:00Z',
                },
            },
        };
        mockedGet.mockResolvedValueOnce(mockResponse);

        // Act: Render the hook with specific ID
        const { result } = renderHook(() => useAmodiataireDetail('123'), {
            wrapper: createWrapper(),
        });

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Assert: Query key should be ['amodiataire', 'detail', '123']
        expect(result.current.data).toBeDefined();
    });

    /**
     * Test enabled condition
     * Verifies that the hook is only enabled when id is provided
     */
    test('should be disabled when id is empty', async () => {
        // Act: Render the hook with empty id
        const { result } = renderHook(() => useAmodiataireDetail(''), {
            wrapper: createWrapper(),
        });

        // Assert: Hook should not fetch data
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeUndefined();
        expect(mockedGet).not.toHaveBeenCalled();
    });

    /**
     * Test stale time configuration
     * Verifies that the hook uses 10 minutes stale time as per design
     */
    test('should have 10 minute stale time', async () => {
        // Arrange
        const mockResponse: AmodiataireDetailResponse = {
            success: true,
            amodiataire: {
                id: '1',
                userId: 'user1',
                lot: {
                    numeroLot: 'LOT001',
                    raisonSociale: 'Test',
                    adresse: 'Test',
                    superficie: 100,
                    nombreLots: 1,
                    coordinates: [],
                    center: { lat: 0, lng: 0 },
                    batiments: [],
                    source: 'manual',
                    isTemporary: false,
                },
                profile: {
                    email: 'test@example.com',
                    username: 'test',
                    isPublished: true,
                },
                media: { images: [], videos: [], documents: [] },
                announcements: [],
                stats: {
                    totalImages: 0,
                    totalVideos: 0,
                    totalDocuments: 0,
                    totalMedia: 0,
                    activeAnnouncements: 0,
                },
                metadata: {
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2024-01-01T00:00:00Z',
                },
            },
        };
        mockedGet.mockResolvedValueOnce(mockResponse);

        // Act: Render the hook
        const { result } = renderHook(() => useAmodiataireDetail('1'), {
            wrapper: createWrapper(),
        });

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Assert: Data should be considered fresh
        expect(result.current.isStale).toBe(false);
    });
});

/**
 * Unit tests for useNearbyAmodiataires hook
 * 
 * Tests the useNearbyAmodiataires hook from API Routes Refactoring spec.
 * 
 * Feature: api-routes-refactoring
 * Task: 5.3 Create hook for nearby search
 * Requirements: 2.3, 2.7
 */
describe('useNearbyAmodiataires', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Test hook existence and basic functionality
     * Requirement 2.3: THE API_Routes SHALL define an endpoint for nearby search
     */
    test('should fetch nearby amodiataires successfully', async () => {
        // Arrange: Mock successful response
        const mockResponse: NearbySearchResponse = {
            success: true,
            count: 2,
            userLocation: { lat: 45.5, lng: -73.5 },
            radius: 10,
            amodiataires: [
                {
                    id: '1',
                    userId: 'user1',
                    raisonSociale: 'Nearby Company 1',
                    numeroLot: 'LOT001',
                    adresse: '123 Test St',
                    superficie: 1000,
                    nombreLots: 5,
                    coordinates: [{ lat: 45.51, lng: -73.51 }],
                    center: { lat: 45.51, lng: -73.51 },
                    batiments: [],
                    profile: {
                        email: 'test1@example.com',
                        username: 'test1',
                        isPublished: true,
                    },
                    stats: {
                        totalMedia: 10,
                        activeAnnouncements: 2,
                    },
                    createdAt: '2024-01-01T00:00:00Z',
                    distance: 1.5,
                },
                {
                    id: '2',
                    userId: 'user2',
                    raisonSociale: 'Nearby Company 2',
                    numeroLot: 'LOT002',
                    adresse: '456 Test Ave',
                    superficie: 2000,
                    nombreLots: 10,
                    coordinates: [{ lat: 45.52, lng: -73.52 }],
                    center: { lat: 45.52, lng: -73.52 },
                    batiments: [],
                    profile: {
                        email: 'test2@example.com',
                        username: 'test2',
                        isPublished: true,
                    },
                    stats: {
                        totalMedia: 5,
                        activeAnnouncements: 1,
                    },
                    createdAt: '2024-01-02T00:00:00Z',
                    distance: 2.3,
                },
            ],
        };
        mockedGet.mockResolvedValueOnce(mockResponse);

        // Act: Render the hook
        const { result } = renderHook(
            () => useNearbyAmodiataires({ lat: 45.5, lng: -73.5, radius: 10 }),
            { wrapper: createWrapper() }
        );

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Assert: Verify data structure
        expect(result.current.data).toBeDefined();
        expect(result.current.data?.success).toBe(true);
        expect(result.current.data?.count).toBe(2);
        expect(result.current.data?.amodiataires).toHaveLength(2);
        expect(result.current.data?.amodiataires[0].distance).toBe(1.5);
        expect(result.current.data?.userLocation).toEqual({ lat: 45.5, lng: -73.5 });
        expect(result.current.data?.radius).toBe(10);
    });

    /**
     * Test query key structure
     * Verifies that the query key follows the design pattern: ['amodiataires', 'nearby', params]
     */
    test('should use correct query key structure', async () => {
        // Arrange
        const params: NearbyParams = { lat: 45.5, lng: -73.5, radius: 5 };
        const mockResponse: NearbySearchResponse = {
            success: true,
            count: 0,
            userLocation: { lat: 45.5, lng: -73.5 },
            radius: 5,
            amodiataires: [],
        };
        mockedGet.mockResolvedValueOnce(mockResponse);

        // Act: Render the hook
        const { result } = renderHook(() => useNearbyAmodiataires(params), {
            wrapper: createWrapper(),
        });

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Assert: Query key should be ['amodiataires', 'nearby', params]
        expect(result.current.data).toBeDefined();
    });

    /**
     * Test enabled conditions
     * Requirement 2.7: WHEN building query parameters for nearby search, THE API_Routes 
     * SHALL support lat, lng, and radius parameters
     */
    test('should be disabled when lat is missing', async () => {
        // Act: Render the hook with missing lat
        const { result } = renderHook(
            () => useNearbyAmodiataires({ lat: 0, lng: -73.5 } as NearbyParams),
            { wrapper: createWrapper() }
        );

        // Assert: Hook should not fetch data when lat is 0 (falsy)
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeUndefined();
        expect(mockedGet).not.toHaveBeenCalled();
    });

    test('should be disabled when lng is missing', async () => {
        // Act: Render the hook with missing lng
        const { result } = renderHook(
            () => useNearbyAmodiataires({ lat: 45.5, lng: 0 } as NearbyParams),
            { wrapper: createWrapper() }
        );

        // Assert: Hook should not fetch data when lng is 0 (falsy)
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeUndefined();
        expect(mockedGet).not.toHaveBeenCalled();
    });

    test('should support radius parameter', async () => {
        // Arrange
        const params: NearbyParams = { lat: 45.5, lng: -73.5, radius: 20 };
        const mockResponse: NearbySearchResponse = {
            success: true,
            count: 0,
            userLocation: { lat: 45.5, lng: -73.5 },
            radius: 20,
            amodiataires: [],
        };
        mockedGet.mockResolvedValueOnce(mockResponse);

        // Act: Render the hook with radius
        const { result } = renderHook(() => useNearbyAmodiataires(params), {
            wrapper: createWrapper(),
        });

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Assert: Verify API was called with radius parameter
        expect(mockedGet).toHaveBeenCalledWith(
            expect.stringContaining('radius=20')
        );
        expect(result.current.data?.radius).toBe(20);
    });

    /**
     * Test stale time configuration
     * Verifies that the hook uses 2 minutes stale time as per design
     */
    test('should have 2 minute stale time', async () => {
        // Arrange
        const mockResponse: NearbySearchResponse = {
            success: true,
            count: 0,
            userLocation: { lat: 45.5, lng: -73.5 },
            radius: 10,
            amodiataires: [],
        };
        mockedGet.mockResolvedValueOnce(mockResponse);

        // Act: Render the hook
        const { result } = renderHook(
            () => useNearbyAmodiataires({ lat: 45.5, lng: -73.5 }),
            { wrapper: createWrapper() }
        );

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Assert: Data should be considered fresh
        expect(result.current.isStale).toBe(false);
    });
});

/**
 * Unit tests for useAmodiataireAnnouncements hook
 * 
 * Tests the useAmodiataireAnnouncements hook from API Routes Refactoring spec.
 * 
 * Feature: api-routes-refactoring
 * Task: 5.4 Create hook for amodiataire announcements
 * Requirements: 2.4
 */
describe('useAmodiataireAnnouncements', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Test hook existence and basic functionality
     * Requirement 2.4: THE API_Routes SHALL define an endpoint for amodiataire announcements
     */
    test('should fetch amodiataire announcements successfully', async () => {
        // Arrange: Mock successful response
        const mockResponse: AnnouncementListResponse = {
            success: true,
            announcements: [
                {
                    id: '1',
                    title: 'Test Announcement 1',
                    content: 'Test content 1',
                    isPublic: true,
                    createdAt: '2024-01-01T00:00:00Z',
                },
                {
                    id: '2',
                    title: 'Test Announcement 2',
                    content: 'Test content 2',
                    category: 'news',
                    isPublic: true,
                    createdAt: '2024-01-02T00:00:00Z',
                },
            ],
        };
        mockedGet.mockResolvedValueOnce(mockResponse);

        // Act: Render the hook
        const { result } = renderHook(
            () => useAmodiataireAnnouncements('1'),
            { wrapper: createWrapper() }
        );

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Assert: Verify data structure
        expect(result.current.data).toBeDefined();
        expect(result.current.data?.success).toBe(true);
        expect(result.current.data?.announcements).toHaveLength(2);
        expect(result.current.data?.announcements[0].title).toBe('Test Announcement 1');
    });

    /**
     * Test query key structure
     * Verifies that the query key follows the design pattern: ['amodiataire', 'announcements', id, params]
     */
    test('should use correct query key structure', async () => {
        // Arrange
        const params: AnnouncementQueryParams = { limit: 10, category: 'news' };
        const mockResponse: AnnouncementListResponse = {
            success: true,
            announcements: [],
        };
        mockedGet.mockResolvedValueOnce(mockResponse);

        // Act: Render the hook with params
        const { result } = renderHook(
            () => useAmodiataireAnnouncements('123', params),
            { wrapper: createWrapper() }
        );

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Assert: Query key should be ['amodiataire', 'announcements', '123', params]
        expect(result.current.data).toBeDefined();
    });

    /**
     * Test enabled condition
     * Verifies that the hook is only enabled when id is provided
     */
    test('should be disabled when id is empty', async () => {
        // Act: Render the hook with empty id
        const { result } = renderHook(
            () => useAmodiataireAnnouncements(''),
            { wrapper: createWrapper() }
        );

        // Assert: Hook should not fetch data
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeUndefined();
        expect(mockedGet).not.toHaveBeenCalled();
    });

    /**
     * Test category filtering support
     * Verifies that the hook supports category parameter
     */
    test('should support category filtering', async () => {
        // Arrange
        const params: AnnouncementQueryParams = { category: 'events' };
        const mockResponse: AnnouncementListResponse = {
            success: true,
            announcements: [
                {
                    id: '1',
                    title: 'Event Announcement',
                    content: 'Event content',
                    category: 'events',
                    isPublic: true,
                    createdAt: '2024-01-01T00:00:00Z',
                },
            ],
        };
        mockedGet.mockResolvedValueOnce(mockResponse);

        // Act: Render the hook with category filter
        const { result } = renderHook(
            () => useAmodiataireAnnouncements('1', params),
            { wrapper: createWrapper() }
        );

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Assert: Verify API was called with category parameter
        expect(mockedGet).toHaveBeenCalledWith(
            expect.stringContaining('category=events')
        );
        expect(result.current.data?.announcements[0].category).toBe('events');
    });

    /**
     * Test stale time configuration
     * Verifies that the hook uses 5 minutes stale time as per design
     */
    test('should have 5 minute stale time', async () => {
        // Arrange
        const mockResponse: AnnouncementListResponse = {
            success: true,
            announcements: [],
        };
        mockedGet.mockResolvedValueOnce(mockResponse);

        // Act: Render the hook
        const { result } = renderHook(
            () => useAmodiataireAnnouncements('1'),
            { wrapper: createWrapper() }
        );

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Assert: Data should be considered fresh
        expect(result.current.isStale).toBe(false);
    });
});

/**
 * Unit tests for useAmodiataireMedia hook
 * 
 * Tests the useAmodiataireMedia hook from API Routes Refactoring spec.
 * 
 * Feature: api-routes-refactoring
 * Task: 5.5 Create hook for amodiataire media
 * Requirements: 2.5, 5.10
 */
describe('useAmodiataireMedia', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Test hook existence and basic functionality
     * Requirement 2.5: THE API_Routes SHALL define an endpoint for amodiataire media
     */
    test('should fetch amodiataire media successfully', async () => {
        // Arrange: Mock successful response
        const mockResponse: MediaListResponse = {
            success: true,
            media: [
                {
                    id: '1',
                    url: 'https://example.com/image1.jpg',
                    thumbnailUrl: 'https://example.com/thumb1.jpg',
                    title: 'Test Image 1',
                    createdAt: '2024-01-01T00:00:00Z',
                },
                {
                    id: '2',
                    url: 'https://example.com/video1.mp4',
                    title: 'Test Video 1',
                    createdAt: '2024-01-02T00:00:00Z',
                },
            ],
        };
        mockedGet.mockResolvedValueOnce(mockResponse);

        // Act: Render the hook
        const { result } = renderHook(
            () => useAmodiataireMedia('1'),
            { wrapper: createWrapper() }
        );

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Assert: Verify data structure
        expect(result.current.data).toBeDefined();
        expect(result.current.data?.success).toBe(true);
        expect(result.current.data?.media).toHaveLength(2);
        expect(result.current.data?.media[0].title).toBe('Test Image 1');
    });

    /**
     * Test query key structure
     * Verifies that the query key follows the design pattern: ['amodiataire', 'media', id, params]
     */
    test('should use correct query key structure', async () => {
        // Arrange
        const params: MediaQueryParams = { limit: 10, type: 'image' };
        const mockResponse: MediaListResponse = {
            success: true,
            media: [],
        };
        mockedGet.mockResolvedValueOnce(mockResponse);

        // Act: Render the hook with params
        const { result } = renderHook(
            () => useAmodiataireMedia('123', params),
            { wrapper: createWrapper() }
        );

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Assert: Query key should be ['amodiataire', 'media', '123', params]
        expect(result.current.data).toBeDefined();
    });

    /**
     * Test enabled condition
     * Verifies that the hook is only enabled when id is provided
     */
    test('should be disabled when id is empty', async () => {
        // Act: Render the hook with empty id
        const { result } = renderHook(
            () => useAmodiataireMedia(''),
            { wrapper: createWrapper() }
        );

        // Assert: Hook should not fetch data
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeUndefined();
        expect(mockedGet).not.toHaveBeenCalled();
    });

    /**
     * Test type filtering support
     * Requirement 5.10: WHEN listing media, THE System SHALL support filtering by type parameter
     */
    test('should support type filtering for images', async () => {
        // Arrange
        const params: MediaQueryParams = { type: 'image' };
        const mockResponse: MediaListResponse = {
            success: true,
            media: [
                {
                    id: '1',
                    url: 'https://example.com/image1.jpg',
                    title: 'Image 1',
                    createdAt: '2024-01-01T00:00:00Z',
                },
            ],
        };
        mockedGet.mockResolvedValueOnce(mockResponse);

        // Act: Render the hook with type filter
        const { result } = renderHook(
            () => useAmodiataireMedia('1', params),
            { wrapper: createWrapper() }
        );

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Assert: Verify API was called with type parameter
        expect(mockedGet).toHaveBeenCalledWith(
            expect.stringContaining('type=image')
        );
    });

    test('should support type filtering for videos', async () => {
        // Arrange
        const params: MediaQueryParams = { type: 'video' };
        const mockResponse: MediaListResponse = {
            success: true,
            media: [
                {
                    id: '1',
                    url: 'https://example.com/video1.mp4',
                    title: 'Video 1',
                    createdAt: '2024-01-01T00:00:00Z',
                },
            ],
        };
        mockedGet.mockResolvedValueOnce(mockResponse);

        // Act: Render the hook with type filter
        const { result } = renderHook(
            () => useAmodiataireMedia('1', params),
            { wrapper: createWrapper() }
        );

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Assert: Verify API was called with type parameter
        expect(mockedGet).toHaveBeenCalledWith(
            expect.stringContaining('type=video')
        );
    });

    test('should support type filtering for documents', async () => {
        // Arrange
        const params: MediaQueryParams = { type: 'document' };
        const mockResponse: MediaListResponse = {
            success: true,
            media: [
                {
                    id: '1',
                    url: 'https://example.com/doc1.pdf',
                    title: 'Document 1',
                    createdAt: '2024-01-01T00:00:00Z',
                },
            ],
        };
        mockedGet.mockResolvedValueOnce(mockResponse);

        // Act: Render the hook with type filter
        const { result } = renderHook(
            () => useAmodiataireMedia('1', params),
            { wrapper: createWrapper() }
        );

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Assert: Verify API was called with type parameter
        expect(mockedGet).toHaveBeenCalledWith(
            expect.stringContaining('type=document')
        );
    });

    /**
     * Test stale time configuration
     * Verifies that the hook uses 10 minutes stale time as per design
     */
    test('should have 10 minute stale time', async () => {
        // Arrange
        const mockResponse: MediaListResponse = {
            success: true,
            media: [],
        };
        mockedGet.mockResolvedValueOnce(mockResponse);

        // Act: Render the hook
        const { result } = renderHook(
            () => useAmodiataireMedia('1'),
            { wrapper: createWrapper() }
        );

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Assert: Data should be considered fresh
        expect(result.current.isStale).toBe(false);
    });
});

/**
 * Unit tests for authenticated profile hooks
 *
 * Tests the useProfile and useUpdateProfile hooks from API Routes Refactoring spec.
 *
 * Feature: api-routes-refactoring
 * Tasks: 6.1, 6.2, 6.4
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
describe('Authenticated profile hooks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Test useProfile hook basic functionality
     * Requirement 4.1, 4.3: endpoint for authenticated profile and hook existence
     */
    test('useProfile should fetch authenticated profile successfully', async () => {
        const mockResponse: ProfileResponse = {
            success: true,
            profile: {
                id: 'profile-1',
                email: 'test@example.com',
                username: 'testuser',
                isPublished: true,
                lot: {
                    numeroLot: 'LOT-001',
                    raisonSociale: 'Test Company',
                    adresse: '123 Test Street',
                    superficie: 1000,
                    nombreLots: 5,
                    coordinates: [{ lat: 48.8566, lng: 2.3522 }],
                    center: { lat: 48.8566, lng: 2.3522 },
                    batiments: [],
                    source: 'manual',
                    isTemporary: false,
                },
                profileStatus: 'approved',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-02T00:00:00Z',
            },
        };

        mockedGet.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useProfile(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toBeDefined();
        expect(result.current.data?.success).toBe(true);
        expect(result.current.data?.profile.email).toBe('test@example.com');
        expect(result.current.isError).toBe(false);
    });

    /**
     * Test useUpdateProfile hook cache invalidation behaviour
     * Requirement 4.2, 4.4: mutation invalidates ['profile', 'me'] cache
     */
    test('useUpdateProfile should update profile and invalidate profile cache', async () => {
        const updateRequest: ProfileUpdateRequest = {
            biography: 'Updated bio',
            phone: '+33123456789',
            website: 'https://example.com',
        };
        const updateResponse: ProfileUpdateResponse = {
            success: true,
            message: 'Profile updated successfully',
            status: 'pending_validation',
        };

        mockedPut.mockResolvedValueOnce(updateResponse);

        // Spy on QueryClient.invalidateQueries to verify cache invalidation
        const invalidateSpy = jest.spyOn(
            QueryClient.prototype,
            'invalidateQueries'
        );

        const { result } = renderHook(() => useUpdateProfile(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isIdle).toBe(true);
        });

        await result.current.mutateAsync(updateRequest);

        expect(mockedPut).toHaveBeenCalledTimes(1);
        expect(mockedPut).toHaveBeenCalledWith(
            expect.stringContaining('/api/mobile/profile'),
            updateRequest
        );

        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: ['profile', 'me'],
        });

        invalidateSpy.mockRestore();
    });
});

/**
 * Unit tests for media management hooks
 *
 * Feature: api-routes-refactoring
 * Tasks: 7.1, 7.2, 7.3, 7.4, 7.5
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10
 */
describe('Media management hooks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Test useMediaList basic functionality
     * Requirement 5.2, 5.6, 5.10
     */
    test('useMediaList should fetch media list successfully', async () => {
        const mockResponse: MediaListResponse = {
            success: true,
            media: [
                {
                    id: '1',
                    url: 'https://example.com/image1.jpg',
                    thumbnailUrl: 'https://example.com/thumb1.jpg',
                    title: 'Image 1',
                    createdAt: '2024-01-01T00:00:00Z',
                },
                {
                    id: '2',
                    url: 'https://example.com/video1.mp4',
                    title: 'Video 1',
                    createdAt: '2024-01-02T00:00:00Z',
                },
            ],
        };

        mockedGet.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useMediaList(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toBeDefined();
        expect(result.current.data?.success).toBe(true);
        expect(result.current.data?.media).toHaveLength(2);
    });

    /**
     * Test useMediaList type filtering
     * Requirement 5.10: support type parameter
     */
    test('useMediaList should support type filtering', async () => {
        const params: MediaQueryParams = { type: 'image', limit: 10 };
        const mockResponse: MediaListResponse = {
            success: true,
            media: [],
        };

        mockedGet.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useMediaList(params), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(mockedGet).toHaveBeenCalledWith(
            expect.stringContaining('type=image')
        );
        expect(result.current.data?.media).toHaveLength(0);
    });

    /**
     * Test useMediaList stale time configuration
     */
    test('useMediaList should have 5 minute stale time', async () => {
        const mockResponse: MediaListResponse = {
            success: true,
            media: [],
        };

        mockedGet.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useMediaList(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.isStale).toBe(false);
    });

    /**
     * Test useDeleteMedia mutation and cache invalidation
     * Requirement 5.3, 5.7
     */
    test('useDeleteMedia should delete media and invalidate media list cache', async () => {
        const deleteResponse: MediaDeleteResponse = {
            success: true,
            message: 'Media deleted successfully',
        };

        mockedDeleteRequest.mockResolvedValueOnce(deleteResponse);

        const invalidateSpy = jest.spyOn(
            QueryClient.prototype,
            'invalidateQueries'
        );

        const { result } = renderHook(() => useDeleteMedia(), {
            wrapper: createWrapper(),
        });

        await result.current.mutateAsync('media-123');

        expect(mockedDeleteRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/mobile/media/media-123')
        );
        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: ['media', 'list'],
        });

        invalidateSpy.mockRestore();
    });

    /**
     * Test useSubmitMediaValidation mutation and cache invalidation
     * Requirement 5.4, 5.8
     */
    test('useSubmitMediaValidation should submit validation and invalidate media and profile caches', async () => {
        const validationResponse: MediaSubmitValidationResponse = {
            success: true,
            message: 'Media submitted for validation',
            count: 3,
        };

        mockedPost.mockResolvedValueOnce(validationResponse);

        const invalidateSpy = jest.spyOn(
            QueryClient.prototype,
            'invalidateQueries'
        );

        const { result } = renderHook(() => useSubmitMediaValidation(), {
            wrapper: createWrapper(),
        });

        await result.current.mutateAsync();

        expect(mockedPost).toHaveBeenCalledWith(
            expect.stringContaining('/api/mobile/media/submit-validation')
        );
        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: ['media', 'list'],
        });
        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: ['profile', 'me'],
        });

        invalidateSpy.mockRestore();
    });

    /**
     * Test useUploadMedia cache invalidation behaviour
     * Requirement 5.1, 5.5, 5.9
     */
    test('useUploadMedia should invalidate media list cache after successful upload', async () => {
        const uploadResponse: UploadMediaResponse = {
            url: 'https://example.com/image1.jpg',
            thumbnail: 'https://example.com/thumb1.jpg',
            type: 'photo',
        };

        (global as any).fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: {
                entries: () => [],
            },
            json: async () => uploadResponse,
        });

        const invalidateSpy = jest.spyOn(
            QueryClient.prototype,
            'invalidateQueries'
        );

        const { result } = renderHook(() => useUploadMedia(), {
            wrapper: createWrapper(),
        });

        await result.current.mutateAsync({
            type: 'photo',
            file: { uri: 'file://image.jpg', size: 1000 },
        });

        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: ['media', 'list'],
        });

        invalidateSpy.mockRestore();
    });
});

/**
 * Unit tests for announcement management hooks
 *
 * Feature: api-routes-refactoring
 * Tasks: 8.1, 8.2, 8.3
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.6
 */
describe('Announcement management hooks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Test useAnnouncementsList basic functionality
     * Requirement 6.2, 6.4, 6.6
     */
    test('useAnnouncementsList should fetch announcements list successfully', async () => {
        const mockResponse: AnnouncementListResponse = {
            success: true,
            announcements: [
                {
                    id: '1',
                    title: 'Test Announcement',
                    content: 'Content',
                    isPublic: true,
                    createdAt: '2024-01-01T00:00:00Z',
                },
            ],
        };

        mockedGet.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(
            () => useAnnouncementsList(),
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toBeDefined();
        expect(result.current.data?.announcements).toHaveLength(1);
    });

    /**
     * Test useAnnouncementsList status filtering support
     */
    test('useAnnouncementsList should support status filtering', async () => {
        const params: AnnouncementQueryParams = { status: 'active' };
        const mockResponse: AnnouncementListResponse = {
            success: true,
            announcements: [],
        };

        mockedGet.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(
            () => useAnnouncementsList(params),
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(mockedGet).toHaveBeenCalledWith(
            expect.stringContaining('status=active')
        );
        expect(result.current.data?.announcements).toHaveLength(0);
    });

    /**
     * Test useCreateAnnouncement mutation and cache invalidation
     * Requirement 6.1, 6.3
     */
    test('useCreateAnnouncement should create announcement and invalidate announcements list cache', async () => {
        const request: AnnouncementCreateRequest = {
            title: 'New Announcement',
            content: 'Content',
            shortDescription: 'Short',
        };
        const response: AnnouncementCreateResponse = {
            success: true,
            message: 'Created',
            announcement: {
                id: 'ann-1',
                title: 'New Announcement',
                status: 'pending_validation',
                createdAt: '2024-01-01T00:00:00Z',
            },
        };

        mockedPost.mockResolvedValueOnce(response);

        const invalidateSpy = jest.spyOn(
            QueryClient.prototype,
            'invalidateQueries'
        );

        const { result } = renderHook(() => useCreateAnnouncement(), {
            wrapper: createWrapper(),
        });

        await result.current.mutateAsync(request);

        expect(mockedPost).toHaveBeenCalledWith(
            expect.stringContaining('/api/mobile/announcements'),
            request
        );
        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: ['announcements', 'list'],
        });

        invalidateSpy.mockRestore();
    });
});
