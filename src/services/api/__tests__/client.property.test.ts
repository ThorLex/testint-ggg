/**
 * Property-based tests for API Client authentication headers
 * 
 * Tests universal properties of authentication header inclusion.
 * 
 * Feature: api-routes-refactoring
 * Task: 3.3 Write property test for authentication header inclusion
 */

import * as fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '../client';
import { ApiRoutes } from '../routes';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

/**
 * Generator for valid authentication tokens
 * Generates JWT-like tokens with alphanumeric characters and dots
 */
const authTokenArbitrary = fc.oneof(
    // JWT-like tokens (header.payload.signature)
    fc.tuple(
        fc.string({ minLength: 20, maxLength: 40 }).map(s => s.replace(/[^a-zA-Z0-9]/g, 'a')),
        fc.string({ minLength: 40, maxLength: 80 }).map(s => s.replace(/[^a-zA-Z0-9]/g, 'b')),
        fc.string({ minLength: 40, maxLength: 80 }).map(s => s.replace(/[^a-zA-Z0-9]/g, 'c'))
    ).map(([header, payload, signature]) => `${header}.${payload}.${signature}`),
    // Simple bearer tokens
    fc.string({ minLength: 32, maxLength: 64 }).map(s => s.replace(/[^a-zA-Z0-9]/g, 'x')),
    // UUID-based tokens
    fc.uuid()
);

/**
 * Generator for HTTP methods
 */
const httpMethodArbitrary = fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH');

/**
 * Generator for API endpoint paths
 * Uses only known valid endpoints to avoid mock adapter issues
 */
const endpointPathArbitrary = fc.constantFrom(
    '/api/mobile/profile',
    '/api/mobile/media',
    '/api/mobile/announcements',
    '/api/mobile/public/amodiataires',
    '/api/public/map/all',
    '/api/geolocation/zone-bounds',
    '/api/public/amodiataires/mobile',
    '/api/amodiataire/profile'
);

/**
 * Generator for request data (for POST/PUT/PATCH)
 */
const requestDataArbitrary = fc.oneof(
    fc.constant(undefined),
    fc.constant(null),
    fc.constant({}),
    fc.record({
        title: fc.string({ minLength: 1, maxLength: 50 }),
        content: fc.string({ minLength: 1, maxLength: 200 }),
    }),
    fc.record({
        name: fc.string({ minLength: 1, maxLength: 30 }),
        value: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
    })
);

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: api-routes-refactoring', () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(apiClient);
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
        // Set up a default handler for all requests
        mock.onAny().reply(200, { success: true });
    });

    afterEach(() => {
        if (mock) {
            mock.reset();
            mock.restore();
        }
    });

    describe('Property 7: Authentication Header Inclusion', () => {
        /**
         * **Validates: Requirements 7.1, 7.3**
         * 
         * For any API request, when a valid authentication token exists in AsyncStorage,
         * the request should include the Authorization header with "Bearer {token}" format,
         * and when no token exists, the Authorization header should be absent.
         */

        test('should include Authorization header with Bearer format when token exists', () => {
            fc.assert(
                fc.asyncProperty(
                    authTokenArbitrary,
                    httpMethodArbitrary,
                    endpointPathArbitrary,
                    requestDataArbitrary,
                    async (token, method, endpoint, data) => {
                        // Clear history and mocks from previous iterations
                        mock.resetHistory();
                        jest.clearAllMocks();
                        
                        // Setup: Mock AsyncStorage to return the token
                        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(token);

                        // Clear history from previous test
                        mock.resetHistory();

                        // Execute: Make the request
                        try {
                            switch (method) {
                                case 'GET':
                                    await apiClient.get(endpoint);
                                    break;
                                case 'POST':
                                    await apiClient.post(endpoint, data);
                                    break;
                                case 'PUT':
                                    await apiClient.put(endpoint, data);
                                    break;
                                case 'DELETE':
                                    await apiClient.delete(endpoint);
                                    break;
                                case 'PATCH':
                                    await apiClient.patch(endpoint, data);
                                    break;
                            }
                        } catch (error) {
                            // Ignore errors, we're testing headers
                        }

                        // Verify: Check that the request was made with Authorization header
                        const requests = mock.history[method.toLowerCase() as keyof typeof mock.history];
                        expect(requests.length).toBeGreaterThan(0);
                        
                        const lastRequest = requests[requests.length - 1];
                        expect(lastRequest.headers).toBeDefined();
                        expect(lastRequest.headers!['Authorization']).toBe(`Bearer ${token}`);
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should not include Authorization header when token does not exist', () => {
            fc.assert(
                fc.asyncProperty(
                    httpMethodArbitrary,
                    endpointPathArbitrary,
                    requestDataArbitrary,
                    async (method, endpoint, data) => {
                        // Clear history and mocks from previous iterations
                        mock.resetHistory();
                        jest.clearAllMocks();
                        
                        // Setup: Mock AsyncStorage to return null (no token)
                        // Use mockResolvedValue to ensure it always returns null for this iteration
                        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

                        // Execute: Make the request
                        try {
                            switch (method) {
                                case 'GET':
                                    await apiClient.get(endpoint);
                                    break;
                                case 'POST':
                                    await apiClient.post(endpoint, data);
                                    break;
                                case 'PUT':
                                    await apiClient.put(endpoint, data);
                                    break;
                                case 'DELETE':
                                    await apiClient.delete(endpoint);
                                    break;
                                case 'PATCH':
                                    await apiClient.patch(endpoint, data);
                                    break;
                            }
                        } catch (error) {
                            // Ignore errors, we're testing headers
                        }

                        // Verify: Check that the request was made without Authorization header
                        const requests = mock.history[method.toLowerCase() as keyof typeof mock.history];
                        expect(requests.length).toBeGreaterThan(0);
                        
                        const lastRequest = requests[requests.length - 1];
                        expect(lastRequest.headers).toBeDefined();
                        expect(lastRequest.headers!['Authorization']).toBeUndefined();
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should handle token retrieval from AsyncStorage at correct key', () => {
            fc.assert(
                fc.asyncProperty(
                    authTokenArbitrary,
                    endpointPathArbitrary,
                    async (token, endpoint) => {
                        // Clear history and mocks from previous iterations
                        mock.resetHistory();
                        jest.clearAllMocks();
                        
                        // Setup: Mock AsyncStorage
                        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(token);

                        // Execute: Make the request
                        try {
                            await apiClient.get(endpoint);
                        } catch (error) {
                            // Ignore errors
                        }

                        // Verify: AsyncStorage.getItem was called with correct key
                        expect(AsyncStorage.getItem).toHaveBeenCalledWith('@navipad:auth_token');
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should format Authorization header correctly with Bearer prefix', () => {
            fc.assert(
                fc.asyncProperty(
                    authTokenArbitrary,
                    endpointPathArbitrary,
                    async (token, endpoint) => {
                        // Setup
                        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(token);
                        mock.reset();
                        mock.onAny().reply(200, { success: true });

                        // Execute
                        try {
                            await apiClient.get(endpoint);
                        } catch (error) {
                            // Ignore errors
                        }

                        // Verify: Authorization header has correct format
                        const requests = mock.history.get;
                        expect(requests.length).toBeGreaterThan(0);
                        
                        const lastRequest = requests[requests.length - 1];
                        const authHeader = lastRequest.headers!['Authorization'];
                        
                        expect(authHeader).toBeDefined();
                        expect(authHeader).toMatch(/^Bearer .+$/);
                        expect(authHeader).toBe(`Bearer ${token}`);
                        
                        // Verify no extra spaces or formatting issues
                        const parts = authHeader.split(' ');
                        expect(parts.length).toBe(2);
                        expect(parts[0]).toBe('Bearer');
                        expect(parts[1]).toBe(token);
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should include Authorization header for both public and authenticated endpoints', () => {
            fc.assert(
                fc.asyncProperty(
                    authTokenArbitrary,
                    fc.constantFrom(
                        '/api/mobile/profile',
                        '/api/mobile/media',
                        '/api/mobile/public/amodiataires',
                        '/api/public/map/all'
                    ),
                    async (token, endpoint) => {
                        // Setup
                        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(token);
                        mock.reset();
                        mock.onAny().reply(200, { success: true });

                        // Execute
                        try {
                            await apiClient.get(endpoint);
                        } catch (error) {
                            // Ignore errors
                        }

                        // Verify: Authorization header is present regardless of endpoint type
                        const requests = mock.history.get;
                        expect(requests.length).toBeGreaterThan(0);
                        
                        const lastRequest = requests[requests.length - 1];
                        expect(lastRequest.headers!['Authorization']).toBe(`Bearer ${token}`);
                    }
                ),
                { numRuns: 20 }
            );
        });
    });

    describe('Property 8: API Key Header Inclusion', () => {
        /**
         * **Validates: Requirements 7.2**
         * 
         * For any API request (authenticated or public), the request should always include
         * the x-api-key header with the configured API key value.
         */

        test('should always include x-api-key header for all requests', () => {
            fc.assert(
                fc.asyncProperty(
                    httpMethodArbitrary,
                    endpointPathArbitrary,
                    requestDataArbitrary,
                    async (method, endpoint, data) => {
                        // Setup: Mock AsyncStorage (token may or may not exist)
                        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

                        // Setup: Mock the API response - use onAny to match all requests
                        mock.reset();
                        const mockResponse = { success: true, data: {} };
                        mock.onAny().reply(200, mockResponse);

                        // Execute: Make the request
                        try {
                            switch (method) {
                                case 'GET':
                                    await apiClient.get(endpoint);
                                    break;
                                case 'POST':
                                    await apiClient.post(endpoint, data);
                                    break;
                                case 'PUT':
                                    await apiClient.put(endpoint, data);
                                    break;
                                case 'DELETE':
                                    await apiClient.delete(endpoint);
                                    break;
                                case 'PATCH':
                                    await apiClient.patch(endpoint, data);
                                    break;
                            }
                        } catch (error) {
                            // Ignore errors, we're testing headers
                        }

                        // Verify: Check that x-api-key header is present
                        const requests = mock.history[method.toLowerCase() as keyof typeof mock.history];
                        expect(requests.length).toBeGreaterThan(0);
                        
                        const lastRequest = requests[requests.length - 1];
                        expect(lastRequest.headers).toBeDefined();
                        expect(lastRequest.headers!['x-api-key']).toBe(ApiRoutes.API_KEY);
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should include x-api-key header even when authentication token exists', () => {
            fc.assert(
                fc.asyncProperty(
                    authTokenArbitrary,
                    httpMethodArbitrary,
                    endpointPathArbitrary,
                    requestDataArbitrary,
                    async (token, method, endpoint, data) => {
                        // Setup: Mock AsyncStorage to return a token
                        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(token);

                        // Setup: Mock the API response - use onAny to match all requests
                        mock.reset();
                        const mockResponse = { success: true, data: {} };
                        mock.onAny().reply(200, mockResponse);

                        // Execute: Make the request
                        try {
                            switch (method) {
                                case 'GET':
                                    await apiClient.get(endpoint);
                                    break;
                                case 'POST':
                                    await apiClient.post(endpoint, data);
                                    break;
                                case 'PUT':
                                    await apiClient.put(endpoint, data);
                                    break;
                                case 'DELETE':
                                    await apiClient.delete(endpoint);
                                    break;
                                case 'PATCH':
                                    await apiClient.patch(endpoint, data);
                                    break;
                            }
                        } catch (error) {
                            // Ignore errors, we're testing headers
                        }

                        // Verify: Both Authorization and x-api-key headers are present
                        const requests = mock.history[method.toLowerCase() as keyof typeof mock.history];
                        expect(requests.length).toBeGreaterThan(0);
                        
                        const lastRequest = requests[requests.length - 1];
                        expect(lastRequest.headers).toBeDefined();
                        expect(lastRequest.headers!['x-api-key']).toBe(ApiRoutes.API_KEY);
                        expect(lastRequest.headers!['Authorization']).toBe(`Bearer ${token}`);
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should include x-api-key header for public endpoints', () => {
            fc.assert(
                fc.asyncProperty(
                    fc.constantFrom(
                        '/api/mobile/public/amodiataires',
                        '/api/public/map/all',
                        '/api/public/amodiataires/mobile',
                        '/api/geolocation/zone-bounds'
                    ),
                    async (endpoint) => {
                        // Setup: No authentication token
                        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
                        mock.reset();
                        // Use onAny to match any request
                        mock.onAny().reply(200, { success: true });

                        // Execute
                        try {
                            await apiClient.get(endpoint);
                        } catch (error) {
                            // Ignore errors
                        }

                        // Verify: x-api-key header is present for public endpoints
                        const requests = mock.history.get;
                        expect(requests.length).toBeGreaterThan(0);
                        
                        const lastRequest = requests[requests.length - 1];
                        expect(lastRequest.headers!['x-api-key']).toBe(ApiRoutes.API_KEY);
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should include x-api-key header for authenticated endpoints', () => {
            fc.assert(
                fc.asyncProperty(
                    authTokenArbitrary,
                    fc.constantFrom(
                        '/api/mobile/profile',
                        '/api/mobile/media',
                        '/api/mobile/announcements',
                        '/api/amodiataire/profile'
                    ),
                    async (token, endpoint) => {
                        // Setup: With authentication token
                        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(token);
                        mock.reset();
                        // Use onAny to match any request
                        mock.onAny().reply(200, { success: true });

                        // Execute
                        try {
                            await apiClient.get(endpoint);
                        } catch (error) {
                            // Ignore errors
                        }

                        // Verify: x-api-key header is present for authenticated endpoints
                        const requests = mock.history.get;
                        expect(requests.length).toBeGreaterThan(0);
                        
                        const lastRequest = requests[requests.length - 1];
                        expect(lastRequest.headers!['x-api-key']).toBe(ApiRoutes.API_KEY);
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should use the configured API key value from ApiRoutes', () => {
            fc.assert(
                fc.asyncProperty(
                    fc.constantFrom(
                        '/api/mobile/profile',
                        '/api/mobile/media',
                        '/api/mobile/announcements',
                        '/api/mobile/public/amodiataires',
                        '/api/public/map/all'
                    ),
                    async (endpoint) => {
                        // Setup
                        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
                        mock.reset();
                        mock.onAny().reply(200, { success: true });

                        // Execute
                        try {
                            await apiClient.get(endpoint);
                        } catch (error) {
                            // Ignore errors
                        }

                        // Verify: x-api-key matches the configured value
                        const requests = mock.history.get;
                        expect(requests.length).toBeGreaterThan(0);
                        
                        const lastRequest = requests[requests.length - 1];
                        const apiKey = lastRequest.headers!['x-api-key'];
                        
                        expect(apiKey).toBeDefined();
                        expect(apiKey).toBe(ApiRoutes.API_KEY);
                        expect(typeof apiKey).toBe('string');
                        expect(apiKey.length).toBeGreaterThan(0);
                    }
                ),
                { numRuns: 20 }
            );
        });
    });
});
