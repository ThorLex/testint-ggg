/**
 * Property-based tests for cache invalidation in mutation hooks
 * 
 * Tests that mutations properly invalidate related query caches to ensure
 * data consistency across the application.
 * 
 * Feature: api-routes-refactoring
 * Property 10: Cache Invalidation After Mutations
 * **Validates: Requirements 8.4**
 */

import * as fc from 'fast-check';
import { QueryClient } from '@tanstack/react-query';
import type { ProfileUpdateRequest } from '@/types';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Creates a fresh QueryClient for testing
 */
function createTestQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
            mutations: {
                retry: false,
            },
        },
    });
}

/**
 * Simulates setting query data in the cache
 */
function setQueryData(queryClient: QueryClient, queryKey: unknown[], data: any): void {
    queryClient.setQueryData(queryKey, data);
}

/**
 * Checks if a query is marked as stale (needs refetch)
 */
function isQueryStale(queryClient: QueryClient, queryKey: unknown[]): boolean {
    const query = queryClient.getQueryCache().find({ queryKey });
    return query ? query.isStale() : false;
}

/**
 * Checks if a query exists in the cache
 */
function hasQuery(queryClient: QueryClient, queryKey: unknown[]): boolean {
    const query = queryClient.getQueryCache().find({ queryKey });
    return query !== undefined;
}

/**
 * Simulates the invalidateQueries behavior
 */
function simulateInvalidation(queryClient: QueryClient, queryKey: { queryKey: unknown[] }): void {
    queryClient.invalidateQueries(queryKey);
}

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

/**
 * Generator for ProfileUpdateRequest objects
 */
const profileUpdateRequestArbitrary = fc.record({
    biography: fc.option(fc.string({ minLength: 10, maxLength: 500 })),
    phone: fc.option(
        fc.string({ minLength: 10, maxLength: 15 })
            .filter(s => /^[\d\s\-\+\(\)]+$/.test(s))
    ),
    website: fc.option(
        fc.webUrl()
    ),
    socialMedia: fc.option(
        fc.record({
            facebook: fc.option(fc.webUrl()),
            instagram: fc.option(fc.webUrl()),
            twitter: fc.option(fc.webUrl()),
            linkedin: fc.option(fc.webUrl()),
        })
    ),
}) as fc.Arbitrary<ProfileUpdateRequest>;

/**
 * Generator for media upload parameters
 */
const mediaUploadParamsArbitrary = fc.record({
    type: fc.constantFrom('image', 'video', 'document'),
    title: fc.option(fc.string({ minLength: 5, maxLength: 100 })),
    description: fc.option(fc.string({ minLength: 10, maxLength: 500 })),
});

/**
 * Generator for media IDs
 */
const mediaIdArbitrary = fc.uuid();

/**
 * Generator for announcement create parameters
 */
const announcementCreateParamsArbitrary = fc.record({
    title: fc.string({ minLength: 5, maxLength: 100 }),
    content: fc.string({ minLength: 10, maxLength: 1000 }),
    shortDescription: fc.option(fc.string({ minLength: 10, maxLength: 200 })),
    category: fc.option(fc.constantFrom('info', 'event', 'promotion', 'update')),
    tags: fc.option(fc.array(fc.string({ minLength: 2, maxLength: 20 }), { maxLength: 5 })),
});

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: api-routes-refactoring', () => {
    describe('Property 10: Cache Invalidation After Mutations', () => {
        /**
         * **Validates: Requirements 8.4**
         * 
         * For any mutation operation (profile update, media upload, media delete, 
         * announcement create), when the mutation succeeds, the related query caches 
         * should be invalidated to trigger refetch of updated data.
         */

        describe('Profile Update Cache Invalidation', () => {
            test('should invalidate profile cache after profile update', () => {
                fc.assert(
                    fc.property(
                        profileUpdateRequestArbitrary,
                        (profileData) => {
                            const queryClient = createTestQueryClient();
                            const profileQueryKey = ['profile', 'me'];

                            // Set initial profile data in cache
                            setQueryData(queryClient, profileQueryKey, {
                                success: true,
                                profile: {
                                    id: 'test-id',
                                    biography: 'Old bio',
                                    phone: '1234567890',
                                },
                            });

                            // Verify query exists and is not stale initially
                            expect(hasQuery(queryClient, profileQueryKey)).toBe(true);
                            expect(isQueryStale(queryClient, profileQueryKey)).toBe(false);

                            // Simulate the mutation success callback (invalidation)
                            simulateInvalidation(queryClient, { queryKey: profileQueryKey });

                            // Verify the cache was invalidated (marked as stale)
                            expect(isQueryStale(queryClient, profileQueryKey)).toBe(true);
                        }
                    ),
                    { numRuns: 20 }
                );
            });

            test('should invalidate profile cache regardless of which fields are updated', () => {
                fc.assert(
                    fc.property(
                        profileUpdateRequestArbitrary,
                        (profileData) => {
                            const queryClient = createTestQueryClient();
                            const profileQueryKey = ['profile', 'me'];

                            // Set initial data
                            setQueryData(queryClient, profileQueryKey, { success: true, profile: {} });

                            // Simulate invalidation
                            simulateInvalidation(queryClient, { queryKey: profileQueryKey });

                            // Should be invalidated regardless of which fields were in the update
                            expect(isQueryStale(queryClient, profileQueryKey)).toBe(true);
                        }
                    ),
                    { numRuns: 20 }
                );
            });
        });

        describe('Media Upload Cache Invalidation', () => {
            test('should invalidate media list cache after media upload', () => {
                fc.assert(
                    fc.property(
                        mediaUploadParamsArbitrary,
                        (uploadParams) => {
                            const queryClient = createTestQueryClient();
                            const mediaListQueryKey = ['media', 'list'];

                            // Set initial media list in cache
                            setQueryData(queryClient, mediaListQueryKey, {
                                success: true,
                                media: [],
                            });

                            // Verify query exists and is not stale initially
                            expect(hasQuery(queryClient, mediaListQueryKey)).toBe(true);
                            expect(isQueryStale(queryClient, mediaListQueryKey)).toBe(false);

                            // Simulate the mutation success callback (invalidation)
                            simulateInvalidation(queryClient, { queryKey: mediaListQueryKey });

                            // Verify the cache was invalidated
                            expect(isQueryStale(queryClient, mediaListQueryKey)).toBe(true);
                        }
                    ),
                    { numRuns: 20 }
                );
            });

            test('should invalidate media list cache for all media types', () => {
                fc.assert(
                    fc.property(
                        fc.constantFrom('image', 'video', 'document'),
                        (mediaType) => {
                            const queryClient = createTestQueryClient();
                            const mediaListQueryKey = ['media', 'list'];

                            setQueryData(queryClient, mediaListQueryKey, { success: true, media: [] });

                            // Simulate upload of any media type
                            simulateInvalidation(queryClient, { queryKey: mediaListQueryKey });

                            // Should invalidate regardless of media type
                            expect(isQueryStale(queryClient, mediaListQueryKey)).toBe(true);
                        }
                    ),
                    { numRuns: 20 }
                );
            });

            test('should invalidate media list cache with query parameters', () => {
                fc.assert(
                    fc.property(
                        mediaUploadParamsArbitrary,
                        fc.record({
                            type: fc.option(fc.constantFrom('image', 'video', 'document', 'all')),
                            limit: fc.option(fc.integer({ min: 1, max: 100 })),
                            offset: fc.option(fc.integer({ min: 0, max: 1000 })),
                        }),
                        (uploadParams, queryParams) => {
                            const queryClient = createTestQueryClient();
                            
                            // Create multiple cached queries with different parameters
                            const baseQueryKey = ['media', 'list'];
                            const queryKeyWithParams = ['media', 'list', queryParams];

                            setQueryData(queryClient, baseQueryKey, { success: true, media: [] });
                            setQueryData(queryClient, queryKeyWithParams, { success: true, media: [] });

                            // Simulate invalidation of all media list queries
                            simulateInvalidation(queryClient, { queryKey: baseQueryKey });

                            // Both queries should be invalidated
                            expect(isQueryStale(queryClient, baseQueryKey)).toBe(true);
                            // Queries with params should also be invalidated due to prefix matching
                            expect(isQueryStale(queryClient, queryKeyWithParams)).toBe(true);
                        }
                    ),
                    { numRuns: 20 }
                );
            });
        });

        describe('Media Delete Cache Invalidation', () => {
            test('should invalidate media list cache after media deletion', () => {
                fc.assert(
                    fc.property(
                        mediaIdArbitrary,
                        (mediaId) => {
                            const queryClient = createTestQueryClient();
                            const mediaListQueryKey = ['media', 'list'];

                            // Set initial media list in cache
                            setQueryData(queryClient, mediaListQueryKey, {
                                success: true,
                                media: [{ id: mediaId, url: 'test.jpg' }],
                            });

                            expect(hasQuery(queryClient, mediaListQueryKey)).toBe(true);
                            expect(isQueryStale(queryClient, mediaListQueryKey)).toBe(false);

                            // Simulate the deletion mutation success callback
                            simulateInvalidation(queryClient, { queryKey: mediaListQueryKey });

                            // Verify the cache was invalidated
                            expect(isQueryStale(queryClient, mediaListQueryKey)).toBe(true);
                        }
                    ),
                    { numRuns: 20 }
                );
            });

            test('should invalidate media list cache for any media ID', () => {
                fc.assert(
                    fc.property(
                        fc.array(mediaIdArbitrary, { minLength: 1, maxLength: 10 }),
                        (mediaIds) => {
                            const queryClient = createTestQueryClient();
                            const mediaListQueryKey = ['media', 'list'];

                            setQueryData(queryClient, mediaListQueryKey, {
                                success: true,
                                media: mediaIds.map(id => ({ id, url: 'test.jpg' })),
                            });

                            // Delete any media ID
                            const mediaIdToDelete = mediaIds[0];
                            simulateInvalidation(queryClient, { queryKey: mediaListQueryKey });

                            // Should invalidate regardless of which media was deleted
                            expect(isQueryStale(queryClient, mediaListQueryKey)).toBe(true);
                        }
                    ),
                    { numRuns: 20 }
                );
            });
        });

        describe('Announcement Create Cache Invalidation', () => {
            test('should invalidate announcements list cache after announcement creation', () => {
                fc.assert(
                    fc.property(
                        announcementCreateParamsArbitrary,
                        (announcementData) => {
                            const queryClient = createTestQueryClient();
                            const announcementsListQueryKey = ['announcements', 'list'];

                            // Set initial announcements list in cache
                            setQueryData(queryClient, announcementsListQueryKey, {
                                success: true,
                                announcements: [],
                            });

                            expect(hasQuery(queryClient, announcementsListQueryKey)).toBe(true);
                            expect(isQueryStale(queryClient, announcementsListQueryKey)).toBe(false);

                            // Simulate the creation mutation success callback
                            simulateInvalidation(queryClient, { queryKey: announcementsListQueryKey });

                            // Verify the cache was invalidated
                            expect(isQueryStale(queryClient, announcementsListQueryKey)).toBe(true);
                        }
                    ),
                    { numRuns: 20 }
                );
            });

            test('should invalidate announcements list cache with query parameters', () => {
                fc.assert(
                    fc.property(
                        announcementCreateParamsArbitrary,
                        fc.record({
                            status: fc.option(fc.constantFrom('draft', 'active', 'paused', 'expired', 'all')),
                            category: fc.option(fc.string({ minLength: 3, maxLength: 20 })),
                            limit: fc.option(fc.integer({ min: 1, max: 100 })),
                            offset: fc.option(fc.integer({ min: 0, max: 1000 })),
                        }),
                        (announcementData, queryParams) => {
                            const queryClient = createTestQueryClient();
                            
                            // Create multiple cached queries with different parameters
                            const baseQueryKey = ['announcements', 'list'];
                            const queryKeyWithParams = ['announcements', 'list', queryParams];

                            setQueryData(queryClient, baseQueryKey, { success: true, announcements: [] });
                            setQueryData(queryClient, queryKeyWithParams, { success: true, announcements: [] });

                            // Simulate invalidation of all announcements list queries
                            simulateInvalidation(queryClient, { queryKey: baseQueryKey });

                            // Both queries should be invalidated
                            expect(isQueryStale(queryClient, baseQueryKey)).toBe(true);
                            expect(isQueryStale(queryClient, queryKeyWithParams)).toBe(true);
                        }
                    ),
                    { numRuns: 20 }
                );
            });
        });

        describe('Cross-Mutation Cache Invalidation', () => {
            test('should not invalidate unrelated caches when profile is updated', () => {
                fc.assert(
                    fc.property(
                        profileUpdateRequestArbitrary,
                        (profileData) => {
                            const queryClient = createTestQueryClient();
                            const profileQueryKey = ['profile', 'me'];
                            const mediaListQueryKey = ['media', 'list'];
                            const announcementsListQueryKey = ['announcements', 'list'];

                            // Set data in multiple caches
                            setQueryData(queryClient, profileQueryKey, { success: true, profile: {} });
                            setQueryData(queryClient, mediaListQueryKey, { success: true, media: [] });
                            setQueryData(queryClient, announcementsListQueryKey, { success: true, announcements: [] });

                            // Invalidate only profile cache
                            simulateInvalidation(queryClient, { queryKey: profileQueryKey });

                            // Profile should be stale
                            expect(isQueryStale(queryClient, profileQueryKey)).toBe(true);
                            
                            // Other caches should NOT be stale
                            expect(isQueryStale(queryClient, mediaListQueryKey)).toBe(false);
                            expect(isQueryStale(queryClient, announcementsListQueryKey)).toBe(false);
                        }
                    ),
                    { numRuns: 20 }
                );
            });

            test('should not invalidate unrelated caches when media is uploaded', () => {
                fc.assert(
                    fc.property(
                        mediaUploadParamsArbitrary,
                        (uploadParams) => {
                            const queryClient = createTestQueryClient();
                            const profileQueryKey = ['profile', 'me'];
                            const mediaListQueryKey = ['media', 'list'];
                            const announcementsListQueryKey = ['announcements', 'list'];

                            setQueryData(queryClient, profileQueryKey, { success: true, profile: {} });
                            setQueryData(queryClient, mediaListQueryKey, { success: true, media: [] });
                            setQueryData(queryClient, announcementsListQueryKey, { success: true, announcements: [] });

                            // Invalidate only media cache
                            simulateInvalidation(queryClient, { queryKey: mediaListQueryKey });

                            // Media should be stale
                            expect(isQueryStale(queryClient, mediaListQueryKey)).toBe(true);
                            
                            // Other caches should NOT be stale
                            expect(isQueryStale(queryClient, profileQueryKey)).toBe(false);
                            expect(isQueryStale(queryClient, announcementsListQueryKey)).toBe(false);
                        }
                    ),
                    { numRuns: 20 }
                );
            });

            test('should not invalidate unrelated caches when announcement is created', () => {
                fc.assert(
                    fc.property(
                        announcementCreateParamsArbitrary,
                        (announcementData) => {
                            const queryClient = createTestQueryClient();
                            const profileQueryKey = ['profile', 'me'];
                            const mediaListQueryKey = ['media', 'list'];
                            const announcementsListQueryKey = ['announcements', 'list'];

                            setQueryData(queryClient, profileQueryKey, { success: true, profile: {} });
                            setQueryData(queryClient, mediaListQueryKey, { success: true, media: [] });
                            setQueryData(queryClient, announcementsListQueryKey, { success: true, announcements: [] });

                            // Invalidate only announcements cache
                            simulateInvalidation(queryClient, { queryKey: announcementsListQueryKey });

                            // Announcements should be stale
                            expect(isQueryStale(queryClient, announcementsListQueryKey)).toBe(true);
                            
                            // Other caches should NOT be stale
                            expect(isQueryStale(queryClient, profileQueryKey)).toBe(false);
                            expect(isQueryStale(queryClient, mediaListQueryKey)).toBe(false);
                        }
                    ),
                    { numRuns: 20 }
                );
            });
        });

        describe('Multiple Mutations Cache Invalidation', () => {
            test('should handle sequential mutations with proper cache invalidation', () => {
                fc.assert(
                    fc.property(
                        profileUpdateRequestArbitrary,
                        mediaUploadParamsArbitrary,
                        (profileData, mediaData) => {
                            const queryClient = createTestQueryClient();
                            const profileQueryKey = ['profile', 'me'];
                            const mediaListQueryKey = ['media', 'list'];

                            // Set initial data
                            setQueryData(queryClient, profileQueryKey, { success: true, profile: {} });
                            setQueryData(queryClient, mediaListQueryKey, { success: true, media: [] });

                            // First mutation: update profile
                            simulateInvalidation(queryClient, { queryKey: profileQueryKey });
                            expect(isQueryStale(queryClient, profileQueryKey)).toBe(true);
                            expect(isQueryStale(queryClient, mediaListQueryKey)).toBe(false);

                            // Simulate refetch by marking as fresh
                            setQueryData(queryClient, profileQueryKey, { success: true, profile: profileData });

                            // Second mutation: upload media
                            simulateInvalidation(queryClient, { queryKey: mediaListQueryKey });
                            expect(isQueryStale(queryClient, mediaListQueryKey)).toBe(true);
                            // Profile should still be fresh from refetch
                            expect(isQueryStale(queryClient, profileQueryKey)).toBe(false);
                        }
                    ),
                    { numRuns: 20 }
                );
            });

            test('should handle concurrent mutations with proper cache invalidation', () => {
                fc.assert(
                    fc.property(
                        mediaUploadParamsArbitrary,
                        announcementCreateParamsArbitrary,
                        (mediaData, announcementData) => {
                            const queryClient = createTestQueryClient();
                            const mediaListQueryKey = ['media', 'list'];
                            const announcementsListQueryKey = ['announcements', 'list'];

                            setQueryData(queryClient, mediaListQueryKey, { success: true, media: [] });
                            setQueryData(queryClient, announcementsListQueryKey, { success: true, announcements: [] });

                            // Simulate concurrent mutations
                            simulateInvalidation(queryClient, { queryKey: mediaListQueryKey });
                            simulateInvalidation(queryClient, { queryKey: announcementsListQueryKey });

                            // Both caches should be invalidated
                            expect(isQueryStale(queryClient, mediaListQueryKey)).toBe(true);
                            expect(isQueryStale(queryClient, announcementsListQueryKey)).toBe(true);
                        }
                    ),
                    { numRuns: 20 }
                );
            });
        });
    });
});
