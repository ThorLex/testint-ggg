/**
 * Unit tests for API Routes endpoint constants
 * Tests task 1.5: Write unit tests for endpoint constants
 * 
 * Requirements: 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { ApiRoutes } from '../routes';

describe('ApiRoutes - Endpoint Constants (Task 1.5)', () => {
    describe('Public Endpoints Prefix', () => {
        /**
         * Test that all public endpoints start with correct prefix
         * Validates: Requirements 1.2
         */
        it('should have AMODIATAIRES start with /api/mobile/public/amodiataires', () => {
            expect(ApiRoutes.AMODIATAIRES).toBe('/api/mobile/public/amodiataires');
        });

        it('should have AMODIATAIRE_DETAILS start with /api/mobile/public/amodiataires', () => {
            expect(ApiRoutes.AMODIATAIRE_DETAILS).toMatch(/^\/api\/mobile\/public\/amodiataires/);
        });

        it('should have AMODIATAIRES_NEARBY start with /api/mobile/public/amodiataires', () => {
            expect(ApiRoutes.AMODIATAIRES_NEARBY).toMatch(/^\/api\/mobile\/public\/amodiataires/);
        });

        it('should have AMODIATAIRE_ANNOUNCEMENTS start with /api/mobile/public/amodiataires', () => {
            expect(ApiRoutes.AMODIATAIRE_ANNOUNCEMENTS).toMatch(/^\/api\/mobile\/public\/amodiataires/);
        });

        it('should have AMODIATAIRE_MEDIA start with /api/mobile/public/amodiataires', () => {
            expect(ApiRoutes.AMODIATAIRE_MEDIA).toMatch(/^\/api\/mobile\/public\/amodiataires/);
        });
    });

    describe('Authenticated Endpoints Prefix', () => {
        /**
         * Test that all authenticated endpoints start with correct prefix
         * Validates: Requirements 1.3
         */
        it('should have PROFILE start with /api/mobile', () => {
            expect(ApiRoutes.PROFILE).toMatch(/^\/api\/mobile/);
        });

        it('should have MEDIA start with /api/mobile', () => {
            expect(ApiRoutes.MEDIA).toMatch(/^\/api\/mobile/);
        });

        it('should have MEDIA_DELETE start with /api/mobile', () => {
            expect(ApiRoutes.MEDIA_DELETE).toMatch(/^\/api\/mobile/);
        });

        it('should have MEDIA_SUBMIT_VALIDATION start with /api/mobile', () => {
            expect(ApiRoutes.MEDIA_SUBMIT_VALIDATION).toMatch(/^\/api\/mobile/);
        });

        it('should have ANNOUNCEMENTS start with /api/mobile', () => {
            expect(ApiRoutes.ANNOUNCEMENTS).toMatch(/^\/api\/mobile/);
        });
    });

    describe('Specific Endpoint Constant Values', () => {
        /**
         * Test specific endpoint constant values
         * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
         */
        
        // Public endpoints (Requirement 2.1, 2.2, 2.3, 2.4, 2.5)
        it('should have correct value for AMODIATAIRES', () => {
            expect(ApiRoutes.AMODIATAIRES).toBe('/api/mobile/public/amodiataires');
        });

        it('should have correct value for AMODIATAIRE_DETAILS', () => {
            expect(ApiRoutes.AMODIATAIRE_DETAILS).toBe('/api/mobile/public/amodiataires/:id');
        });

        it('should have correct value for AMODIATAIRES_NEARBY', () => {
            expect(ApiRoutes.AMODIATAIRES_NEARBY).toBe('/api/mobile/public/amodiataires/nearby');
        });

        it('should have correct value for AMODIATAIRE_ANNOUNCEMENTS', () => {
            expect(ApiRoutes.AMODIATAIRE_ANNOUNCEMENTS).toBe('/api/mobile/public/amodiataires/:id/announcements');
        });

        it('should have correct value for AMODIATAIRE_MEDIA', () => {
            expect(ApiRoutes.AMODIATAIRE_MEDIA).toBe('/api/mobile/public/amodiataires/:id/media');
        });

        // Authenticated endpoints
        it('should have correct value for PROFILE', () => {
            expect(ApiRoutes.PROFILE).toBe('/api/mobile/profile');
        });

        it('should have correct value for MEDIA', () => {
            expect(ApiRoutes.MEDIA).toBe('/api/mobile/media');
        });

        it('should have correct value for MEDIA_DELETE', () => {
            expect(ApiRoutes.MEDIA_DELETE).toBe('/api/mobile/media/:mediaId');
        });

        it('should have correct value for MEDIA_SUBMIT_VALIDATION', () => {
            expect(ApiRoutes.MEDIA_SUBMIT_VALIDATION).toBe('/api/mobile/media/submit-validation');
        });

        it('should have correct value for ANNOUNCEMENTS', () => {
            expect(ApiRoutes.ANNOUNCEMENTS).toBe('/api/mobile/announcements');
        });
    });

    describe('Base URL Configuration', () => {
        /**
         * Test base URL configuration
         * Validates: Requirements 1.1
         */
        it('should have correct BASE_URL', () => {
            expect(ApiRoutes.BASE_URL).toBe('https://navipad-superbase.vercel.app');
        });

        it('should have BASE_URL without trailing slash', () => {
            expect(ApiRoutes.BASE_URL).not.toMatch(/\/$/);
        });
    });

    describe('Endpoint Path Parameters', () => {
        /**
         * Test that endpoints with path parameters use correct notation
         */
        it('should use :id notation for path parameters in endpoints', () => {
            expect(ApiRoutes.AMODIATAIRE_DETAILS).toContain(':id');
            expect(ApiRoutes.AMODIATAIRE_ANNOUNCEMENTS).toContain(':id');
            expect(ApiRoutes.AMODIATAIRE_MEDIA).toContain(':id');
        });

        it('should use :mediaId notation for media deletion endpoint', () => {
            expect(ApiRoutes.MEDIA_DELETE).toContain(':mediaId');
        });

        it('should not use {id} notation in endpoints', () => {
            expect(ApiRoutes.AMODIATAIRE_DETAILS).not.toContain('{id}');
            expect(ApiRoutes.AMODIATAIRE_ANNOUNCEMENTS).not.toContain('{id}');
            expect(ApiRoutes.AMODIATAIRE_MEDIA).not.toContain('{id}');
        });
    });

    describe('Endpoint Consistency', () => {
        /**
         * Test consistency across related endpoints
         */
        it('should have consistent path structure for public amodiataire endpoints', () => {
            const basePublicPath = '/api/mobile/public/amodiataires';
            
            expect(ApiRoutes.AMODIATAIRES).toBe(basePublicPath);
            expect(ApiRoutes.AMODIATAIRE_DETAILS).toMatch(new RegExp(`^${basePublicPath}`));
            expect(ApiRoutes.AMODIATAIRES_NEARBY).toMatch(new RegExp(`^${basePublicPath}`));
            expect(ApiRoutes.AMODIATAIRE_ANNOUNCEMENTS).toMatch(new RegExp(`^${basePublicPath}`));
            expect(ApiRoutes.AMODIATAIRE_MEDIA).toMatch(new RegExp(`^${basePublicPath}`));
        });

        it('should have consistent path structure for authenticated endpoints', () => {
            const baseAuthPath = '/api/mobile';
            
            expect(ApiRoutes.PROFILE).toMatch(new RegExp(`^${baseAuthPath}`));
            expect(ApiRoutes.MEDIA).toMatch(new RegExp(`^${baseAuthPath}`));
            expect(ApiRoutes.MEDIA_DELETE).toMatch(new RegExp(`^${baseAuthPath}`));
            expect(ApiRoutes.MEDIA_SUBMIT_VALIDATION).toMatch(new RegExp(`^${baseAuthPath}`));
            expect(ApiRoutes.ANNOUNCEMENTS).toMatch(new RegExp(`^${baseAuthPath}`));
        });

        it('should not have trailing slashes in endpoint paths', () => {
            expect(ApiRoutes.AMODIATAIRES).not.toMatch(/\/$/);
            expect(ApiRoutes.AMODIATAIRES_NEARBY).not.toMatch(/\/$/);
            expect(ApiRoutes.PROFILE).not.toMatch(/\/$/);
            expect(ApiRoutes.MEDIA).not.toMatch(/\/$/);
            expect(ApiRoutes.ANNOUNCEMENTS).not.toMatch(/\/$/);
        });
    });

    describe('Utility Methods', () => {
        /**
         * Test utility methods for building URLs
         */
        it('should build full URL correctly', () => {
            const url = ApiRoutes.getFullUrl(ApiRoutes.AMODIATAIRES);
            expect(url).toBe('https://navipad-superbase.vercel.app/api/mobile/public/amodiataires');
        });

        it('should build full URL with query params', () => {
            const url = ApiRoutes.getFullUrl(ApiRoutes.AMODIATAIRES, { limit: 10, offset: 0 });
            expect(url).toContain('limit=10');
            expect(url).toContain('offset=0');
        });

        it('should build amodiataire details URL correctly', () => {
            const url = ApiRoutes.getAmodiataireDetailsUrl('test-id');
            expect(url).toBe('https://navipad-superbase.vercel.app/api/mobile/public/amodiataires/test-id');
        });

        it('should build amodiataire announcements URL correctly', () => {
            const url = ApiRoutes.getAmodiataireAnnouncementsUrl('test-id');
            expect(url).toBe('https://navipad-superbase.vercel.app/api/mobile/public/amodiataires/test-id/announcements');
        });

        it('should build amodiataire media URL correctly', () => {
            const url = ApiRoutes.getAmodiataireMediaUrl('test-id');
            expect(url).toBe('https://navipad-superbase.vercel.app/api/mobile/public/amodiataires/test-id/media');
        });

        it('should build delete media URL correctly', () => {
            const url = ApiRoutes.getDeleteMediaUrl('media-id');
            expect(url).toBe('https://navipad-superbase.vercel.app/api/mobile/media/media-id');
        });
    });
});
