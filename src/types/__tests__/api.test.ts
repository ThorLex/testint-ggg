/**
 * Unit tests for API interface compatibility
 * Tests task 2.4: Write unit tests for interface compatibility
 * 
 * Requirements: 3.7
 */

import type {
    AmodiatairesListResponse,
    AmodiataireListItem,
    AmodiataireDetailResponse,
    AmodiataireDetail,
    NearbySearchResponse,
    NearbyAmodiataire,
    ProfileResponse,
    AuthenticatedProfile,
    MediaUploadResponse,
    MediaListResponse,
    MediaDeleteResponse,
    MediaSubmitValidationResponse,
    AnnouncementCreateResponse,
    AnnouncementListResponse,
    ProfileUpdateResponse,
    MediaCollection,
    MediaDetail,
    AnnouncementItem,
    LotDetail,
    ProfileDetail,
    Building,
    Coordinates,
    SocialMediaLinks,
    MediaStats,
    ProfileSummary,
} from '../api';

describe('API Interface Compatibility (Task 2.4)', () => {
    describe('AmodiatairesListResponse', () => {
        /**
         * Test that sample API responses conform to AmodiatairesListResponse interface
         * Validates: Requirements 3.7
         */
        it('should accept valid amodiataires list response', () => {
            const response: AmodiatairesListResponse = {
                success: true,
                count: 2,
                amodiataires: [
                    {
                        id: 'amod-1',
                        userId: 'user-1',
                        raisonSociale: 'Test Company',
                        numeroLot: 'LOT-001',
                        adresse: '123 Test Street',
                        superficie: 1000,
                        nombreLots: 5,
                        coordinates: [
                            { lat: 48.8566, lng: 2.3522 },
                            { lat: 48.8567, lng: 2.3523 },
                        ],
                        center: { lat: 48.8566, lng: 2.3522 },
                        batiments: [
                            {
                                id: 'bat-1',
                                type: 'residential',
                                coordinates: [{ lat: 48.8566, lng: 2.3522 }],
                            },
                        ],
                        profile: {
                            email: 'test@example.com',
                            username: 'testuser',
                            isPublished: true,
                        },
                        stats: {
                            totalMedia: 10,
                            activeAnnouncements: 3,
                        },
                        createdAt: '2024-01-01T00:00:00Z',
                    },
                ],
            };

            expect(response.success).toBe(true);
            expect(response.count).toBe(2);
            expect(response.amodiataires).toHaveLength(1);
        });

        it('should accept response with optional fields', () => {
            const response: AmodiatairesListResponse = {
                success: true,
                count: 1,
                amodiataires: [
                    {
                        id: 'amod-1',
                        userId: 'user-1',
                        raisonSociale: 'Test Company',
                        numeroLot: 'LOT-001',
                        adresse: '123 Test Street',
                        superficie: 1000,
                        nombreLots: 5,
                        coordinates: [],
                        center: { lat: 48.8566, lng: 2.3522 },
                        batiments: [],
                        profile: {
                            biography: 'Test bio',
                            phone: '+33123456789',
                            website: 'https://example.com',
                            socialMedia: {
                                facebook: 'https://facebook.com/test',
                                instagram: 'https://instagram.com/test',
                            },
                            email: 'test@example.com',
                            username: 'testuser',
                            isPublished: true,
                        },
                        featuredImage: 'https://example.com/image.jpg',
                        stats: {
                            totalMedia: 10,
                            activeAnnouncements: 3,
                        },
                        createdAt: '2024-01-01T00:00:00Z',
                    },
                ],
            };

            expect(response.amodiataires[0].profile.biography).toBe('Test bio');
            expect(response.amodiataires[0].featuredImage).toBe('https://example.com/image.jpg');
        });
    });

    describe('AmodiataireDetailResponse - Nested Structures', () => {
        /**
         * Test that nested structures are correctly typed
         * Validates: Requirements 3.7
         */
        it('should accept valid amodiataire detail response with nested structures', () => {
            const response: AmodiataireDetailResponse = {
                success: true,
                amodiataire: {
                    id: 'amod-1',
                    userId: 'user-1',
                    lot: {
                        numeroLot: 'LOT-001',
                        raisonSociale: 'Test Company',
                        adresse: '123 Test Street',
                        superficie: 1000,
                        nombreLots: 5,
                        coordinates: [{ lat: 48.8566, lng: 2.3522 }],
                        center: { lat: 48.8566, lng: 2.3522 },
                        batiments: [
                            {
                                id: 'bat-1',
                                type: 'residential',
                                coordinates: [{ lat: 48.8566, lng: 2.3522 }],
                            },
                        ],
                        source: 'manual',
                        isTemporary: false,
                    },
                    profile: {
                        email: 'test@example.com',
                        username: 'testuser',
                        isPublished: true,
                    },
                    media: {
                        images: [],
                        videos: [],
                        documents: [],
                    },
                    announcements: [],
                    stats: {
                        totalImages: 5,
                        totalVideos: 2,
                        totalDocuments: 3,
                        totalMedia: 10,
                        activeAnnouncements: 3,
                    },
                    metadata: {
                        createdAt: '2024-01-01T00:00:00Z',
                        updatedAt: '2024-01-02T00:00:00Z',
                    },
                },
            };

            expect(response.success).toBe(true);
            expect(response.amodiataire.lot.numeroLot).toBe('LOT-001');
            expect(response.amodiataire.profile.email).toBe('test@example.com');
            expect(response.amodiataire.media.images).toHaveLength(0);
        });

        it('should accept nested media collection with all types', () => {
            const mediaCollection: MediaCollection = {
                featured: {
                    id: 'media-1',
                    url: 'https://example.com/featured.jpg',
                    thumbnailUrl: 'https://example.com/featured-thumb.jpg',
                    title: 'Featured Image',
                    description: 'Main image',
                    isFeatured: true,
                    createdAt: '2024-01-01T00:00:00Z',
                },
                images: [
                    {
                        id: 'img-1',
                        url: 'https://example.com/image1.jpg',
                        createdAt: '2024-01-01T00:00:00Z',
                    },
                ],
                videos: [
                    {
                        id: 'vid-1',
                        url: 'https://example.com/video1.mp4',
                        thumbnailUrl: 'https://example.com/video1-thumb.jpg',
                        mimeType: 'video/mp4',
                        fileSize: 1024000,
                        createdAt: '2024-01-01T00:00:00Z',
                    },
                ],
                documents: [
                    {
                        id: 'doc-1',
                        url: 'https://example.com/document1.pdf',
                        title: 'Contract',
                        mimeType: 'application/pdf',
                        createdAt: '2024-01-01T00:00:00Z',
                    },
                ],
            };

            expect(mediaCollection.featured?.isFeatured).toBe(true);
            expect(mediaCollection.images).toHaveLength(1);
            expect(mediaCollection.videos[0].mimeType).toBe('video/mp4');
            expect(mediaCollection.documents[0].title).toBe('Contract');
        });

        it('should accept nested profile detail with social media', () => {
            const profile: ProfileDetail = {
                biography: 'Test biography',
                phone: '+33123456789',
                website: 'https://example.com',
                socialMedia: {
                    facebook: 'https://facebook.com/test',
                    instagram: 'https://instagram.com/test',
                    twitter: 'https://twitter.com/test',
                    linkedin: 'https://linkedin.com/in/test',
                },
                email: 'test@example.com',
                username: 'testuser',
                isPublished: true,
                publishedAt: '2024-01-01T00:00:00Z',
                validatedAt: '2024-01-02T00:00:00Z',
            };

            expect(profile.socialMedia?.facebook).toBe('https://facebook.com/test');
            expect(profile.socialMedia?.instagram).toBe('https://instagram.com/test');
            expect(profile.publishedAt).toBe('2024-01-01T00:00:00Z');
        });

        it('should accept nested announcement items', () => {
            const announcements: AnnouncementItem[] = [
                {
                    id: 'ann-1',
                    title: 'Test Announcement',
                    content: 'This is a test announcement',
                    isPublic: true,
                    createdAt: '2024-01-01T00:00:00Z',
                },
                {
                    id: 'ann-2',
                    title: 'Detailed Announcement',
                    shortDescription: 'Short desc',
                    content: 'Full content',
                    category: 'news',
                    tags: ['important', 'update'],
                    featuredImage: 'https://example.com/image.jpg',
                    mediaUrls: ['https://example.com/media1.jpg'],
                    isPublic: true,
                    targetAudience: 'all',
                    startsAt: '2024-01-01T00:00:00Z',
                    expiresAt: '2024-12-31T23:59:59Z',
                    viewCount: 100,
                    clickCount: 25,
                    publishedAt: '2024-01-01T00:00:00Z',
                    createdAt: '2024-01-01T00:00:00Z',
                },
            ];

            expect(announcements).toHaveLength(2);
            expect(announcements[1].tags).toContain('important');
            expect(announcements[1].viewCount).toBe(100);
        });
    });

    describe('NearbySearchResponse', () => {
        it('should accept valid nearby search response', () => {
            const response: NearbySearchResponse = {
                success: true,
                count: 1,
                userLocation: { lat: 48.8566, lng: 2.3522 },
                radius: 5,
                amodiataires: [
                    {
                        id: 'amod-1',
                        userId: 'user-1',
                        raisonSociale: 'Test Company',
                        numeroLot: 'LOT-001',
                        adresse: '123 Test Street',
                        superficie: 1000,
                        nombreLots: 5,
                        coordinates: [{ lat: 48.8566, lng: 2.3522 }],
                        center: { lat: 48.8566, lng: 2.3522 },
                        batiments: [],
                        profile: {
                            email: 'test@example.com',
                            username: 'testuser',
                            isPublished: true,
                        },
                        stats: {
                            totalMedia: 10,
                            activeAnnouncements: 3,
                        },
                        createdAt: '2024-01-01T00:00:00Z',
                        distance: 2.5,
                    },
                ],
            };

            expect(response.userLocation.lat).toBe(48.8566);
            expect(response.radius).toBe(5);
            expect(response.amodiataires[0].distance).toBe(2.5);
        });
    });

    describe('ProfileResponse - Authenticated Profile', () => {
        it('should accept valid authenticated profile response', () => {
            const response: ProfileResponse = {
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

            expect(response.profile.profileStatus).toBe('approved');
            expect(response.profile.lot.numeroLot).toBe('LOT-001');
        });

        it('should accept profile with all status types', () => {
            const statuses: Array<'draft' | 'pending' | 'approved' | 'rejected'> = [
                'draft',
                'pending',
                'approved',
                'rejected',
            ];

            statuses.forEach((status) => {
                const profile: AuthenticatedProfile = {
                    id: 'profile-1',
                    email: 'test@example.com',
                    username: 'testuser',
                    isPublished: status === 'approved',
                    lot: {
                        numeroLot: 'LOT-001',
                        raisonSociale: 'Test Company',
                        adresse: '123 Test Street',
                        superficie: 1000,
                        nombreLots: 5,
                        coordinates: [],
                        center: { lat: 48.8566, lng: 2.3522 },
                        batiments: [],
                        source: 'manual',
                        isTemporary: false,
                    },
                    profileStatus: status,
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2024-01-02T00:00:00Z',
                };

                expect(profile.profileStatus).toBe(status);
            });
        });
    });

    describe('Media Management Responses', () => {
        it('should accept valid media upload response', () => {
            const response: MediaUploadResponse = {
                success: true,
                message: 'Media uploaded successfully',
                media: {
                    id: 'media-1',
                    url: 'https://example.com/image.jpg',
                    thumbnailUrl: 'https://example.com/image-thumb.jpg',
                    title: 'Test Image',
                    description: 'A test image',
                    isFeatured: false,
                    createdAt: '2024-01-01T00:00:00Z',
                },
            };

            expect(response.message).toBe('Media uploaded successfully');
            expect(response.media.url).toBe('https://example.com/image.jpg');
        });

        it('should accept valid media list response', () => {
            const response: MediaListResponse = {
                success: true,
                media: [
                    {
                        id: 'media-1',
                        url: 'https://example.com/image1.jpg',
                        createdAt: '2024-01-01T00:00:00Z',
                    },
                    {
                        id: 'media-2',
                        url: 'https://example.com/video1.mp4',
                        thumbnailUrl: 'https://example.com/video1-thumb.jpg',
                        mimeType: 'video/mp4',
                        fileSize: 1024000,
                        displayOrder: 1,
                        createdAt: '2024-01-02T00:00:00Z',
                    },
                ],
            };

            expect(response.media).toHaveLength(2);
            expect(response.media[1].displayOrder).toBe(1);
        });

        it('should accept valid media delete response', () => {
            const response: MediaDeleteResponse = {
                success: true,
                message: 'Media deleted successfully',
            };

            expect(response.success).toBe(true);
            expect(response.message).toBe('Media deleted successfully');
        });

        it('should accept valid media submit validation response', () => {
            const response: MediaSubmitValidationResponse = {
                success: true,
                message: 'Media submitted for validation',
                count: 5,
            };

            expect(response.count).toBe(5);
        });
    });

    describe('Announcement Management Responses', () => {
        it('should accept valid announcement create response', () => {
            const response: AnnouncementCreateResponse = {
                success: true,
                message: 'Announcement created successfully',
                announcement: {
                    id: 'ann-1',
                    title: 'Test Announcement',
                    status: 'pending_validation',
                    createdAt: '2024-01-01T00:00:00Z',
                },
            };

            expect(response.announcement.status).toBe('pending_validation');
            expect(response.announcement.title).toBe('Test Announcement');
        });

        it('should accept valid announcement list response', () => {
            const response: AnnouncementListResponse = {
                success: true,
                announcements: [
                    {
                        id: 'ann-1',
                        title: 'Test Announcement',
                        content: 'Content',
                        isPublic: true,
                        createdAt: '2024-01-01T00:00:00Z',
                    },
                ],
            };

            expect(response.announcements).toHaveLength(1);
        });
    });

    describe('Profile Update Response', () => {
        it('should accept valid profile update response', () => {
            const response: ProfileUpdateResponse = {
                success: true,
                message: 'Profile updated successfully',
                status: 'pending_validation',
            };

            expect(response.status).toBe('pending_validation');
        });

        it('should accept approved status', () => {
            const response: ProfileUpdateResponse = {
                success: true,
                message: 'Profile updated',
                status: 'approved',
            };

            expect(response.status).toBe('approved');
        });
    });

    describe('Complex Nested Structures', () => {
        /**
         * Test deeply nested structures to ensure type safety
         */
        it('should handle deeply nested amodiataire detail with all optional fields', () => {
            const detail: AmodiataireDetail = {
                id: 'amod-1',
                userId: 'user-1',
                lot: {
                    numeroLot: 'LOT-001',
                    raisonSociale: 'Test Company',
                    adresse: '123 Test Street',
                    superficie: 1000,
                    nombreLots: 5,
                    coordinates: [
                        { lat: 48.8566, lng: 2.3522 },
                        { lat: 48.8567, lng: 2.3523 },
                    ],
                    center: { lat: 48.8566, lng: 2.3522 },
                    batiments: [
                        {
                            id: 'bat-1',
                            type: 'residential',
                            coordinates: [
                                { lat: 48.8566, lng: 2.3522 },
                                { lat: 48.8567, lng: 2.3523 },
                            ],
                        },
                    ],
                    source: 'import',
                    isTemporary: false,
                },
                profile: {
                    biography: 'Company biography',
                    phone: '+33123456789',
                    website: 'https://example.com',
                    socialMedia: {
                        facebook: 'https://facebook.com/test',
                        instagram: 'https://instagram.com/test',
                        twitter: 'https://twitter.com/test',
                        linkedin: 'https://linkedin.com/in/test',
                    },
                    email: 'test@example.com',
                    username: 'testuser',
                    isPublished: true,
                    publishedAt: '2024-01-01T00:00:00Z',
                    validatedAt: '2024-01-02T00:00:00Z',
                },
                media: {
                    featured: {
                        id: 'media-featured',
                        url: 'https://example.com/featured.jpg',
                        thumbnailUrl: 'https://example.com/featured-thumb.jpg',
                        title: 'Featured',
                        description: 'Main image',
                        altText: 'Featured image',
                        fileSize: 512000,
                        mimeType: 'image/jpeg',
                        isFeatured: true,
                        displayOrder: 0,
                        createdAt: '2024-01-01T00:00:00Z',
                    },
                    images: [
                        {
                            id: 'img-1',
                            url: 'https://example.com/image1.jpg',
                            thumbnailUrl: 'https://example.com/image1-thumb.jpg',
                            title: 'Image 1',
                            createdAt: '2024-01-01T00:00:00Z',
                        },
                    ],
                    videos: [
                        {
                            id: 'vid-1',
                            url: 'https://example.com/video1.mp4',
                            thumbnailUrl: 'https://example.com/video1-thumb.jpg',
                            title: 'Video 1',
                            mimeType: 'video/mp4',
                            fileSize: 2048000,
                            createdAt: '2024-01-01T00:00:00Z',
                        },
                    ],
                    documents: [
                        {
                            id: 'doc-1',
                            url: 'https://example.com/doc1.pdf',
                            title: 'Document 1',
                            mimeType: 'application/pdf',
                            fileSize: 256000,
                            createdAt: '2024-01-01T00:00:00Z',
                        },
                    ],
                },
                announcements: [
                    {
                        id: 'ann-1',
                        title: 'Announcement 1',
                        shortDescription: 'Short description',
                        content: 'Full content',
                        category: 'news',
                        tags: ['important', 'update'],
                        featuredImage: 'https://example.com/ann-image.jpg',
                        mediaUrls: ['https://example.com/media1.jpg'],
                        isPublic: true,
                        targetAudience: 'all',
                        startsAt: '2024-01-01T00:00:00Z',
                        expiresAt: '2024-12-31T23:59:59Z',
                        viewCount: 100,
                        clickCount: 25,
                        publishedAt: '2024-01-01T00:00:00Z',
                        createdAt: '2024-01-01T00:00:00Z',
                    },
                ],
                stats: {
                    totalImages: 5,
                    totalVideos: 2,
                    totalDocuments: 3,
                    totalMedia: 10,
                    activeAnnouncements: 3,
                },
                metadata: {
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2024-01-02T00:00:00Z',
                },
            };

            // Verify nested access works correctly
            expect(detail.lot.batiments[0].coordinates).toHaveLength(2);
            expect(detail.profile.socialMedia?.facebook).toBe('https://facebook.com/test');
            expect(detail.media.featured?.isFeatured).toBe(true);
            expect(detail.media.images[0].thumbnailUrl).toBe('https://example.com/image1-thumb.jpg');
            expect(detail.announcements[0].tags).toContain('important');
            expect(detail.stats.totalMedia).toBe(10);
        });
    });

    describe('Type Safety - Coordinates', () => {
        it('should accept coordinates with lat/lng properties', () => {
            const coords: Coordinates = {
                lat: 48.8566,
                lng: 2.3522,
            };

            expect(coords.lat).toBe(48.8566);
            expect(coords.lng).toBe(2.3522);
        });

        it('should accept coordinates with latitude/longitude aliases', () => {
            const coords: Coordinates = {
                latitude: 48.8566,
                longitude: 2.3522,
                lat: 48.8566,
                lng: 2.3522,
            };

            expect(coords.latitude).toBe(48.8566);
            expect(coords.longitude).toBe(2.3522);
        });
    });

    describe('Type Safety - Optional Fields', () => {
        it('should allow omitting optional fields in ProfileSummary', () => {
            const profile: ProfileSummary = {
                email: 'test@example.com',
                username: 'testuser',
                isPublished: true,
            };

            expect(profile.biography).toBeUndefined();
            expect(profile.phone).toBeUndefined();
            expect(profile.website).toBeUndefined();
            expect(profile.socialMedia).toBeUndefined();
        });

        it('should allow omitting optional fields in MediaDetail', () => {
            const media: MediaDetail = {
                id: 'media-1',
                url: 'https://example.com/image.jpg',
                createdAt: '2024-01-01T00:00:00Z',
            };

            expect(media.thumbnailUrl).toBeUndefined();
            expect(media.title).toBeUndefined();
            expect(media.description).toBeUndefined();
        });

        it('should allow omitting optional fields in AnnouncementItem', () => {
            const announcement: AnnouncementItem = {
                id: 'ann-1',
                title: 'Test',
                content: 'Content',
                isPublic: true,
                createdAt: '2024-01-01T00:00:00Z',
            };

            expect(announcement.shortDescription).toBeUndefined();
            expect(announcement.category).toBeUndefined();
            expect(announcement.tags).toBeUndefined();
        });
    });
});
