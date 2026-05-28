/**
 * Property-based tests for API Client error response structure
 * 
 * Tests universal properties of error response formatting.
 * 
 * Feature: api-routes-refactoring
 * Task: 3.4 Write property test for error response structure
 */

import * as fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '../client';

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
 * Generator for HTTP error status codes
 */
const errorStatusCodeArbitrary = fc.constantFrom(400, 401, 404, 500, 502, 503);

/**
 * Generator for error response data from the server
 */
const serverErrorDataArbitrary = fc.record({
    error: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
    message: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
    details: fc.option(
        fc.oneof(
            fc.string(),
            fc.record({
                field: fc.string(),
                issue: fc.string(),
            }),
            fc.array(fc.string())
        ),
        { nil: undefined }
    ),
}, { withDeletedKeys: false, withNullPrototype: false });

/**
 * Generator for API endpoint paths
 */
const endpointPathArbitrary = fc.constantFrom(
    '/api/mobile/profile',
    '/api/mobile/media',
    '/api/mobile/announcements',
    '/api/mobile/public/amodiataires',
    '/api/public/map/all'
);

/**
 * Generator for HTTP methods
 */
const httpMethodArbitrary = fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH');

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: api-routes-refactoring', () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(apiClient);
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    });

    afterEach(() => {
        if (mock) {
            mock.reset();
            mock.restore();
        }
    });

    describe('Property 9: Error Response Structure', () => {
        /**
         * **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6**
         * 
         * For any API error response (400, 401, 404, 500, or network error),
         * the formatted error object should contain code, message, and details
         * fields with appropriate values based on the error type.
         */

        test('should format all HTTP error responses with consistent structure', () => {
            fc.assert(
                fc.asyncProperty(
                    errorStatusCodeArbitrary,
                    serverErrorDataArbitrary,
                    endpointPathArbitrary,
                    httpMethodArbitrary,
                    async (statusCode, errorData, endpoint, method) => {
                        // Setup: Mock the error response - create a fresh mock for each iteration
                        const localMock = new MockAdapter(apiClient);
                        localMock.onAny().reply(statusCode, errorData);

                        // Execute: Make the request and catch the error
                        let caughtError: any;
                        try {
                            switch (method) {
                                case 'GET':
                                    await apiClient.get(endpoint);
                                    break;
                                case 'POST':
                                    await apiClient.post(endpoint, {});
                                    break;
                                case 'PUT':
                                    await apiClient.put(endpoint, {});
                                    break;
                                case 'DELETE':
                                    await apiClient.delete(endpoint);
                                    break;
                                case 'PATCH':
                                    await apiClient.patch(endpoint, {});
                                    break;
                            }
                        } catch (error) {
                            caughtError = error;
                        }

                        // Cleanup
                        localMock.restore();

                        // Verify: Error object has consistent structure
                        expect(caughtError).toBeDefined();
                        expect(caughtError).toHaveProperty('code');
                        expect(caughtError).toHaveProperty('message');
                        expect(caughtError).toHaveProperty('details');
                        expect(caughtError).toHaveProperty('status');

                        // Verify: code is a non-empty string
                        expect(typeof caughtError.code).toBe('string');
                        expect(caughtError.code.length).toBeGreaterThan(0);

                        // Verify: message is a non-empty string
                        expect(typeof caughtError.message).toBe('string');
                        expect(caughtError.message.length).toBeGreaterThan(0);

                        // Verify: status matches the HTTP status code
                        expect(caughtError.status).toBe(statusCode);
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should format 400 errors with BAD_REQUEST code', () => {
            fc.assert(
                fc.asyncProperty(
                    serverErrorDataArbitrary,
                    endpointPathArbitrary,
                    async (errorData, endpoint) => {
                        // Setup - create a fresh mock adapter for each test
                        const localMock = new MockAdapter(apiClient);
                        localMock.onAny().reply(400, errorData);

                        // Execute
                        let caughtError: any;
                        try {
                            await apiClient.get(endpoint);
                        } catch (error) {
                            caughtError = error;
                        }

                        // Cleanup
                        localMock.restore();

                        // Verify: 400 errors have BAD_REQUEST code
                        expect(caughtError).toBeDefined();
                        expect(caughtError.code).toBe('BAD_REQUEST');
                        expect(caughtError.status).toBe(400);
                        expect(caughtError.message).toBeDefined();
                        expect(typeof caughtError.message).toBe('string');
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should format 401 errors with UNAUTHORIZED code', () => {
            fc.assert(
                fc.asyncProperty(
                    serverErrorDataArbitrary,
                    endpointPathArbitrary,
                    async (errorData, endpoint) => {
                        // Create a fresh mock adapter for this iteration
                        const localMock = new MockAdapter(apiClient);
                        
                        try {
                            // Setup: Ensure no refresh token exists to avoid refresh logic
                            jest.clearAllMocks();
                            (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
                                if (key === '@navipad:refresh_token') {
                                    return null;
                                }
                                if (key === '@navipad:auth_token') {
                                    return null;
                                }
                                return null;
                            });
                            
                            // Set up the 401 response
                            localMock.onGet(endpoint).reply(401, errorData);

                            // Execute
                            let caughtError: any;
                            try {
                                await apiClient.get(endpoint);
                            } catch (error) {
                                caughtError = error;
                            }

                            // Verify: 401 errors have UNAUTHORIZED code
                            expect(caughtError).toBeDefined();
                            expect(caughtError.code).toBe('UNAUTHORIZED');
                            expect(caughtError.status).toBe(401);
                            expect(caughtError.message).toBeDefined();
                            expect(typeof caughtError.message).toBe('string');
                        } finally {
                            // Clean up the mock
                            localMock.restore();
                        }
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should format 404 errors with NOT_FOUND code', () => {
            fc.assert(
                fc.asyncProperty(
                    serverErrorDataArbitrary,
                    endpointPathArbitrary,
                    async (errorData, endpoint) => {
                        // Setup - create a fresh mock adapter for each test
                        const localMock = new MockAdapter(apiClient);
                        localMock.onAny().reply(404, errorData);

                        // Execute
                        let caughtError: any;
                        try {
                            await apiClient.get(endpoint);
                        } catch (error) {
                            caughtError = error;
                        }

                        // Cleanup
                        localMock.restore();

                        // Verify: 404 errors have NOT_FOUND code
                        expect(caughtError).toBeDefined();
                        expect(caughtError.code).toBe('NOT_FOUND');
                        expect(caughtError.status).toBe(404);
                        expect(caughtError.message).toBeDefined();
                        expect(typeof caughtError.message).toBe('string');
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should format 500+ errors with SERVER_ERROR code', () => {
            fc.assert(
                fc.asyncProperty(
                    fc.constantFrom(500, 502, 503),
                    serverErrorDataArbitrary,
                    endpointPathArbitrary,
                    async (statusCode, errorData, endpoint) => {
                        // Setup - create a fresh mock adapter for each test
                        const localMock = new MockAdapter(apiClient);
                        localMock.onAny().reply(statusCode, errorData);

                        // Execute
                        let caughtError: any;
                        try {
                            await apiClient.get(endpoint);
                        } catch (error) {
                            caughtError = error;
                        }

                        // Cleanup
                        localMock.restore();

                        // Verify: 500+ errors have SERVER_ERROR code
                        expect(caughtError).toBeDefined();
                        expect(caughtError.code).toBe('SERVER_ERROR');
                        expect(caughtError.status).toBe(statusCode);
                        expect(caughtError.message).toBeDefined();
                        expect(typeof caughtError.message).toBe('string');
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should format network errors with NETWORK_ERROR code', () => {
            fc.assert(
                fc.asyncProperty(
                    endpointPathArbitrary,
                    async (endpoint) => {
                        // Setup: Simulate network error by using networkError()
                        const localMock = new MockAdapter(apiClient);
                        // Use onAny to match all requests and return network error
                        localMock.onAny().networkError();

                        // Execute
                        let caughtError: any;
                        try {
                            await apiClient.get(endpoint);
                        } catch (error) {
                            caughtError = error;
                        }

                        // Cleanup
                        localMock.restore();

                        // Verify: Network errors have NETWORK_ERROR code
                        expect(caughtError).toBeDefined();
                        expect(caughtError.code).toBe('NETWORK_ERROR');
                        expect(caughtError.message).toBeDefined();
                        expect(typeof caughtError.message).toBe('string');
                        expect(caughtError.message).toContain('Connection failed');
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should preserve error details from server response', () => {
            fc.assert(
                fc.asyncProperty(
                    errorStatusCodeArbitrary,
                    serverErrorDataArbitrary,
                    endpointPathArbitrary,
                    async (statusCode, errorData, endpoint) => {
                        // Setup - create a fresh mock adapter for each iteration
                        const localMock = new MockAdapter(apiClient);
                        localMock.onAny().reply(statusCode, errorData);

                        // Execute
                        let caughtError: any;
                        try {
                            await apiClient.get(endpoint);
                        } catch (error) {
                            caughtError = error;
                        }

                        // Cleanup
                        localMock.restore();

                        // Verify: Details field is present
                        expect(caughtError).toBeDefined();
                        expect(caughtError).toHaveProperty('details');

                        // If server provided details, they should be preserved
                        if (errorData.details !== undefined) {
                            expect(caughtError.details).toEqual(errorData.details);
                        }
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should use server error message when available', () => {
            fc.assert(
                fc.asyncProperty(
                    errorStatusCodeArbitrary,
                    fc.string({ minLength: 10, maxLength: 50 }),
                    endpointPathArbitrary,
                    async (statusCode, errorMessage, endpoint) => {
                        // Setup: Server provides an error message - create a fresh mock
                        const localMock = new MockAdapter(apiClient);
                        localMock.onAny().reply(statusCode, {
                            error: errorMessage,
                        });

                        // Execute
                        let caughtError: any;
                        try {
                            await apiClient.get(endpoint);
                        } catch (error) {
                            caughtError = error;
                        }

                        // Cleanup
                        localMock.restore();

                        // Verify: Error message from server is used
                        expect(caughtError).toBeDefined();
                        expect(caughtError.message).toBe(errorMessage);
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should provide fallback message when server does not provide one', () => {
            fc.assert(
                fc.asyncProperty(
                    errorStatusCodeArbitrary,
                    endpointPathArbitrary,
                    async (statusCode, endpoint) => {
                        // Setup: Server provides no error message - create a fresh mock
                        const localMock = new MockAdapter(apiClient);
                        localMock.onAny().reply(statusCode, {});

                        // Execute
                        let caughtError: any;
                        try {
                            await apiClient.get(endpoint);
                        } catch (error) {
                            caughtError = error;
                        }

                        // Cleanup
                        localMock.restore();

                        // Verify: A fallback message is provided
                        expect(caughtError).toBeDefined();
                        expect(caughtError.message).toBeDefined();
                        expect(typeof caughtError.message).toBe('string');
                        expect(caughtError.message.length).toBeGreaterThan(0);
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should handle errors consistently across all HTTP methods', () => {
            fc.assert(
                fc.asyncProperty(
                    errorStatusCodeArbitrary,
                    serverErrorDataArbitrary,
                    endpointPathArbitrary,
                    httpMethodArbitrary,
                    async (statusCode, errorData, endpoint, method) => {
                        // Setup - create a fresh mock for each iteration
                        const localMock = new MockAdapter(apiClient);
                        localMock.onAny().reply(statusCode, errorData);

                        // Execute
                        let caughtError: any;
                        try {
                            switch (method) {
                                case 'GET':
                                    await apiClient.get(endpoint);
                                    break;
                                case 'POST':
                                    await apiClient.post(endpoint, {});
                                    break;
                                case 'PUT':
                                    await apiClient.put(endpoint, {});
                                    break;
                                case 'DELETE':
                                    await apiClient.delete(endpoint);
                                    break;
                                case 'PATCH':
                                    await apiClient.patch(endpoint, {});
                                    break;
                            }
                        } catch (error) {
                            caughtError = error;
                        }

                        // Cleanup
                        localMock.restore();

                        // Verify: Error structure is consistent regardless of HTTP method
                        expect(caughtError).toBeDefined();
                        expect(caughtError).toHaveProperty('code');
                        expect(caughtError).toHaveProperty('message');
                        expect(caughtError).toHaveProperty('details');
                        expect(caughtError).toHaveProperty('status');
                        expect(caughtError.status).toBe(statusCode);
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should clear auth token on 401 errors', () => {
            fc.assert(
                fc.asyncProperty(
                    serverErrorDataArbitrary,
                    endpointPathArbitrary,
                    async (errorData, endpoint) => {
                        // Setup: Mock AsyncStorage with a token but no refresh token
                        (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
                            if (key === '@navipad:auth_token') {
                                return 'test-token';
                            }
                            if (key === '@navipad:refresh_token') {
                                return null;
                            }
                            return null;
                        });
                        (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
                        
                        // Create a fresh mock for each iteration
                        const localMock = new MockAdapter(apiClient);
                        localMock.onAny().reply(401, errorData);

                        // Execute
                        let caughtError: any;
                        try {
                            await apiClient.get(endpoint);
                        } catch (error) {
                            caughtError = error;
                        }

                        // Cleanup
                        localMock.restore();

                        // Verify: Token is removed on 401
                        expect(caughtError).toBeDefined();
                        expect(caughtError.code).toBe('UNAUTHORIZED');
                        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@navipad:auth_token');
                    }
                ),
                { numRuns: 20 }
            );
        });
    });
});
