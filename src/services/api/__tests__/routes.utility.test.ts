/**
 * Unit tests for API Routes utility methods
 * Tests task 1.2: Add utility methods for new endpoints
 */

import { ApiRoutes } from '../routes';

describe('ApiRoutes - Utility Methods (Task 1.2)', () => {
    describe('getAmodiataireDetailsUrl', () => {
        it('should construct URL for amodiataire details using v2 endpoint', () => {
            const id = 'test-id-123';
            const url = ApiRoutes.getAmodiataireDetailsUrl(id);
            
            expect(url).toBe(`${ApiRoutes.BASE_URL}/api/mobile/public/amodiataires/${id}`);
        });

        it('should handle special characters in ID', () => {
            const id = 'test-id-with-special-chars-@#$';
            const url = ApiRoutes.getAmodiataireDetailsUrl(id);
            
            expect(url).toContain(id);
            expect(url).toContain('/api/mobile/public/amodiataires/');
        });
    });

    describe('getAmodiataireAnnouncementsUrl', () => {
        it('should construct URL without query parameters', () => {
            const id = 'test-id-123';
            const url = ApiRoutes.getAmodiataireAnnouncementsUrl(id);
            
            expect(url).toBe(`${ApiRoutes.BASE_URL}/api/mobile/public/amodiataires/${id}/announcements`);
        });

        it('should construct URL with query parameters', () => {
            const id = 'test-id-123';
            const params = { limit: 10, offset: 0, category: 'news' };
            const url = ApiRoutes.getAmodiataireAnnouncementsUrl(id, params);
            
            expect(url).toContain(`/api/mobile/public/amodiataires/${id}/announcements?`);
            expect(url).toContain('limit=10');
            expect(url).toContain('offset=0');
            expect(url).toContain('category=news');
        });

        it('should filter out null and undefined parameters', () => {
            const id = 'test-id-123';
            const params = { limit: 10, offset: null, category: undefined };
            const url = ApiRoutes.getAmodiataireAnnouncementsUrl(id, params);
            
            expect(url).toContain('limit=10');
            expect(url).not.toContain('offset');
            expect(url).not.toContain('category');
        });
    });

    describe('getAmodiataireMediaUrl', () => {
        it('should construct URL without query parameters', () => {
            const id = 'test-id-123';
            const url = ApiRoutes.getAmodiataireMediaUrl(id);
            
            expect(url).toBe(`${ApiRoutes.BASE_URL}/api/mobile/public/amodiataires/${id}/media`);
        });

        it('should construct URL with type filter', () => {
            const id = 'test-id-123';
            const params = { type: 'image', limit: 20 };
            const url = ApiRoutes.getAmodiataireMediaUrl(id, params);
            
            expect(url).toContain(`/api/mobile/public/amodiataires/${id}/media?`);
            expect(url).toContain('type=image');
            expect(url).toContain('limit=20');
        });

        it('should handle pagination parameters', () => {
            const id = 'test-id-123';
            const params = { limit: 50, offset: 100 };
            const url = ApiRoutes.getAmodiataireMediaUrl(id, params);
            
            expect(url).toContain('limit=50');
            expect(url).toContain('offset=100');
        });
    });

    describe('getDeleteMediaUrl', () => {
        it('should construct URL for new API v2 with mediaId only', () => {
            const mediaId = 'media-123';
            const url = ApiRoutes.getDeleteMediaUrl(mediaId);
            
            expect(url).toBe(`${ApiRoutes.BASE_URL}/api/mobile/media/${mediaId}`);
        });

        it('should construct URL for old API with type and index', () => {
            const type = 'photo';
            const index = 5;
            const url = ApiRoutes.getDeleteMediaUrl(type, index);
            
            expect(url).toBe(`/api/amodiataire/media/${type}/${index}`);
        });

        it('should handle index 0 correctly', () => {
            const type = 'video';
            const index = 0;
            const url = ApiRoutes.getDeleteMediaUrl(type, index);
            
            expect(url).toBe(`/api/amodiataire/media/${type}/0`);
        });
    });

    describe('buildQueryParams', () => {
        it('should build query string from object', () => {
            const params = { limit: 10, offset: 20, search: 'test' };
            const queryString = ApiRoutes.buildQueryParams(params);
            
            expect(queryString).toBe('?limit=10&offset=20&search=test');
        });

        it('should encode special characters', () => {
            const params = { search: 'test with spaces', category: 'news&events' };
            const queryString = ApiRoutes.buildQueryParams(params);
            
            expect(queryString).toContain('search=test%20with%20spaces');
            expect(queryString).toContain('category=news%26events');
        });

        it('should filter out null values', () => {
            const params = { limit: 10, offset: null, search: 'test' };
            const queryString = ApiRoutes.buildQueryParams(params);
            
            expect(queryString).toContain('limit=10');
            expect(queryString).toContain('search=test');
            expect(queryString).not.toContain('offset');
        });

        it('should filter out undefined values', () => {
            const params = { limit: 10, offset: undefined, search: 'test' };
            const queryString = ApiRoutes.buildQueryParams(params);
            
            expect(queryString).toContain('limit=10');
            expect(queryString).toContain('search=test');
            expect(queryString).not.toContain('offset');
        });

        it('should return empty string for empty object', () => {
            const queryString = ApiRoutes.buildQueryParams({});
            
            expect(queryString).toBe('');
        });

        it('should return empty string for null', () => {
            const queryString = ApiRoutes.buildQueryParams(null as any);
            
            expect(queryString).toBe('');
        });

        it('should handle boolean values', () => {
            const params = { active: true, featured: false };
            const queryString = ApiRoutes.buildQueryParams(params);
            
            expect(queryString).toContain('active=true');
            expect(queryString).toContain('featured=false');
        });

        it('should handle numeric values', () => {
            const params = { lat: 48.8566, lng: 2.3522, radius: 5000 };
            const queryString = ApiRoutes.buildQueryParams(params);
            
            expect(queryString).toContain('lat=48.8566');
            expect(queryString).toContain('lng=2.3522');
            expect(queryString).toContain('radius=5000');
        });

        it('should handle zero values correctly', () => {
            const params = { offset: 0, count: 0 };
            const queryString = ApiRoutes.buildQueryParams(params);
            
            expect(queryString).toContain('offset=0');
            expect(queryString).toContain('count=0');
        });
    });
});
