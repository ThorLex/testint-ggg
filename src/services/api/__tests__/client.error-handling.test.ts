/**
 * Unit tests for API Client error handling
 * Tests task 3.2: Update response interceptor for error handling
 * Tests task 3.5: Write unit tests for specific error scenarios
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import MockAdapter from 'axios-mock-adapter';
import { apiClient, get } from '../client';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

describe('API Client - Error Handling (Task 3.2, 3.5)', () => {
    let mock: MockAdapter;

    beforeEach(() => {
        // Create a new mock adapter for each test
        mock = new MockAdapter(apiClient);
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    });

    afterEach(() => {
        mock.restore();
    });

    describe('Network Errors (Requirement 9.5)', () => {
        /**
         * Test network error formatting
         * Validates: Requirement 9.5
         */
        it('should format network errors with "connection failure" message', async () => {
            // Simulate network error
            mock.onGet('/test').networkError();

            try {
                await get('/test');
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.code).toBe('NETWORK_ERROR');
                expect(error.message).toContain('Connection failed');
                expect(error.details).toBeDefined();
            }
        });

        it('should include error details in network error response', async () => {
            mock.onGet('/test').networkError();

            try {
                await get('/test');
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.code).toBe('NETWORK_ERROR');
                expect(error.message).toBe('Connection failed. Check your internet connection.');
                expect(error).toHaveProperty('details');
            }
        });
    });

    describe('400 Bad Request Errors (Requirement 9.1)', () => {
        /**
         * Test 400 error formatting with descriptive messages
         * Validates: Requirement 9.1
         */
        it('should format 400 errors with descriptive messages', async () => {
            mock.onPost('/test').reply(400, {
                error: 'Invalid parameters',
                details: { field: 'email', issue: 'invalid format' },
            });

            try {
                await apiClient.post('/test', {});
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.code).toBe('BAD_REQUEST');
                expect(error.message).toBe('Invalid parameters');
                expect(error.details).toEqual({ field: 'email', issue: 'invalid format' });
                expect(error.status).toBe(400);
            }
        });

        it('should use default message when error message is not provided', async () => {
            mock.onPost('/test').reply(400, {});

            try {
                await apiClient.post('/test', {});
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.code).toBe('BAD_REQUEST');
                expect(error.message).toContain('Invalid request');
                expect(error.status).toBe(400);
            }
        });

        it('should handle 400 errors with message field', async () => {
            mock.onPost('/test').reply(400, {
                message: 'Validation failed for field',
            });

            try {
                await apiClient.post('/test', {});
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.code).toBe('BAD_REQUEST');
                expect(error.message).toBe('Validation failed for field');
                expect(error.status).toBe(400);
            }
        });
    });

    describe('401 Unauthorized Errors (Requirement 9.2)', () => {
        /**
         * Test 401 error handling and token clearing
         * Validates: Requirement 9.2
         */
        it('should format 401 errors and clear authentication token', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
            (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

            mock.onGet('/test').reply(401, {
                error: 'Token expired',
            });

            try {
                await get('/test');
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.code).toBe('UNAUTHORIZED');
                expect(error.message).toContain('Authentication required');
                expect(error.status).toBe(401);
                expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@navipad:auth_token');
            }
        });

        it('should use default message when not provided', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
            mock.onGet('/test').reply(401, {});

            try {
                await get('/test');
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.code).toBe('UNAUTHORIZED');
                expect(error.message).toBe('Authentication required. Please log in again.');
                expect(error.status).toBe(401);
            }
        });
    });

    describe('404 Not Found Errors (Requirement 9.3)', () => {
        /**
         * Test 404 error formatting with "not found" message
         * Validates: Requirement 9.3
         */
        it('should format 404 errors with "not found" message', async () => {
            mock.onGet('/test').reply(404, {
                error: 'Amodiataire not found',
            });

            try {
                await get('/test');
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.code).toBe('NOT_FOUND');
                expect(error.message).toBe('Amodiataire not found');
                expect(error.status).toBe(404);
            }
        });

        it('should use default "not found" message when not provided', async () => {
            mock.onGet('/test').reply(404, {});

            try {
                await get('/test');
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.code).toBe('NOT_FOUND');
                expect(error.message).toBe('Resource not found.');
                expect(error.status).toBe(404);
            }
        });

        it('should handle 404 errors with message field', async () => {
            mock.onGet('/test/123').reply(404, {
                message: 'User with ID 123 not found',
            });

            try {
                await get('/test/123');
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.code).toBe('NOT_FOUND');
                expect(error.message).toBe('User with ID 123 not found');
                expect(error.status).toBe(404);
            }
        });
    });

    describe('500 Server Errors (Requirement 9.4)', () => {
        /**
         * Test 500 error formatting with "server error" message
         * Validates: Requirement 9.4
         */
        it('should format 500 errors with "server error" message', async () => {
            mock.onGet('/test').reply(500, {
                error: 'Internal server error',
                details: { trace: 'stack trace' },
            });

            try {
                await get('/test');
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.code).toBe('SERVER_ERROR');
                expect(error.message).toBe('Internal server error');
                expect(error.status).toBe(500);
            }
        });

        it('should use default "server error" message when not provided', async () => {
            mock.onGet('/test').reply(503, {});

            try {
                await get('/test');
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.code).toBe('SERVER_ERROR');
                expect(error.message).toContain('Server error');
                expect(error.status).toBe(503);
            }
        });

        it('should handle 502 Bad Gateway errors', async () => {
            mock.onGet('/test').reply(502, {
                message: 'Bad Gateway',
            });

            try {
                await get('/test');
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.code).toBe('SERVER_ERROR');
                expect(error.message).toBe('Bad Gateway');
                expect(error.status).toBe(502);
            }
        });
    });

    describe('Error Response Structure (Requirement 9.6)', () => {
        /**
         * Test that all errors have consistent structure
         * Validates: Requirement 9.6
         */
        it('should ensure all errors have consistent structure with code, message, and details', async () => {
            const testCases = [
                { status: 400, data: { error: 'Bad request' } },
                { status: 404, data: { error: 'Not found' } },
                { status: 500, data: { error: 'Server error' } },
            ];

            for (const testCase of testCases) {
                mock.reset();
                mock.onGet('/test').reply(testCase.status, testCase.data);

                try {
                    await get('/test');
                    fail(`Status ${testCase.status} should have thrown an error`);
                } catch (error: any) {
                    // All errors should have these fields
                    expect(error).toHaveProperty('code');
                    expect(error).toHaveProperty('message');
                    expect(error).toHaveProperty('details');
                    expect(error).toHaveProperty('status');

                    // Code should be a string
                    expect(typeof error.code).toBe('string');
                    // Message should be a string
                    expect(typeof error.message).toBe('string');
                    // Status should be a number
                    expect(typeof error.status).toBe('number');
                }
            }
        });

        it('should include status code in all HTTP error responses', async () => {
            const statusCodes = [400, 401, 404, 500, 503];

            for (const statusCode of statusCodes) {
                mock.reset();
                mock.onGet('/test').reply(statusCode, {});

                try {
                    await get('/test');
                    fail(`Status ${statusCode} should have thrown an error`);
                } catch (error: any) {
                    expect(error.status).toBe(statusCode);
                }
            }
        });

        it('should preserve details field from API response', async () => {
            const detailsData = {
                field: 'email',
                issue: 'invalid format',
                suggestions: ['user@example.com'],
            };

            mock.onPost('/test').reply(400, {
                error: 'Validation error',
                details: detailsData,
            });

            try {
                await apiClient.post('/test', {});
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.details).toEqual(detailsData);
            }
        });
    });

    describe('Other HTTP Errors', () => {
        /**
         * Test handling of other HTTP error codes
         */
        it('should format 403 errors correctly', async () => {
            mock.onGet('/test').reply(403, {
                error: 'Forbidden',
                message: 'Access denied',
            });

            try {
                await get('/test');
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.code).toBe('Forbidden');
                expect(error.message).toBe('Forbidden');
                expect(error.status).toBe(403);
            }
        });

        it('should format 422 errors correctly', async () => {
            mock.onGet('/test').reply(422, {
                error: 'Validation failed',
                details: { field: 'email' },
            });

            try {
                await get('/test');
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.code).toBe('Validation failed');
                expect(error.status).toBe(422);
                expect(error.details).toEqual({ field: 'email' });
            }
        });
    });
});
