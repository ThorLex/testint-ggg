/**
 * Unit tests for client-parser.ts
 * Feature: api-routes-complete-analysis
 */

import { describe, it, expect } from '@jest/globals';
import * as path from 'path';
import {
  parseClientFile,
  toClientConfiguration,
  findErrorHandler,
  hasRequestHeader,
  getHandledErrorCodes,
} from '../src/parsers/client-parser';

describe('Client Parser', () => {
  const clientFilePath = path.resolve(__dirname, '../../../src/services/api/client.ts');

  describe('parseClientFile', () => {
    it('should parse the client.ts file without errors', () => {
      expect(() => parseClientFile(clientFilePath)).not.toThrow();
    });

    it('should extract Axios configuration', () => {
      const parsed = parseClientFile(clientFilePath);
      
      expect(parsed.config).toBeDefined();
      expect(parsed.config.baseURL).toBeDefined();
      expect(parsed.config.timeout).toBe(30000);
      expect(parsed.config.headers).toBeDefined();
      expect(parsed.config.headers?.['Content-Type']).toBe('application/json');
      expect(parsed.config.headers?.['Accept']).toBe('application/json');
    });

    it('should extract request interceptors', () => {
      const parsed = parseClientFile(clientFilePath);
      
      expect(parsed.requestInterceptors).toBeDefined();
      expect(parsed.requestInterceptors.length).toBeGreaterThan(0);
      
      const interceptor = parsed.requestInterceptors[0];
      expect(interceptor.description).toBeDefined();
      expect(interceptor.addsHeaders).toContain('x-api-key');
      expect(interceptor.addsHeaders).toContain('Authorization');
      expect(interceptor.usesAsyncStorage).toBe(true);
    });

    it('should extract response interceptors', () => {
      const parsed = parseClientFile(clientFilePath);
      
      expect(parsed.responseInterceptors).toBeDefined();
      expect(parsed.responseInterceptors.length).toBeGreaterThan(0);
      
      const interceptor = parsed.responseInterceptors[0];
      expect(interceptor.description).toBeDefined();
      expect(interceptor.handlesErrors).toBe(true);
    });

    it('should extract error handlers', () => {
      const parsed = parseClientFile(clientFilePath);
      
      expect(parsed.errorHandlers).toBeDefined();
      expect(parsed.errorHandlers.length).toBeGreaterThan(0);
      
      // Check for specific error handlers
      const errorCodes = parsed.errorHandlers.map(h => h.statusCode);
      expect(errorCodes).toContain(401);
      expect(errorCodes).toContain(400);
      expect(errorCodes).toContain(404);
      expect(errorCodes).toContain(500);
    });

    it('should extract utility functions', () => {
      const parsed = parseClientFile(clientFilePath);
      
      expect(parsed.utilityFunctions).toBeDefined();
      expect(parsed.utilityFunctions).toContain('get');
      expect(parsed.utilityFunctions).toContain('post');
      expect(parsed.utilityFunctions).toContain('put');
      expect(parsed.utilityFunctions).toContain('del');
      expect(parsed.utilityFunctions).toContain('deleteRequest');
      expect(parsed.utilityFunctions).toContain('patch');
    });
  });

  describe('Error Handler Details', () => {
    it('should identify 401 error handler with token refresh', () => {
      const parsed = parseClientFile(clientFilePath);
      const handler401 = findErrorHandler(parsed.errorHandlers, 401);
      
      expect(handler401).toBeDefined();
      expect(handler401?.errorCode).toBe('UNAUTHORIZED');
      expect(handler401?.description).toContain('Authentication');
      expect(handler401?.attemptsTokenRefresh).toBe(true);
      expect(handler401?.clearsStorage).toBe(true);
    });

    it('should identify 400 error handler', () => {
      const parsed = parseClientFile(clientFilePath);
      const handler400 = findErrorHandler(parsed.errorHandlers, 400);
      
      expect(handler400).toBeDefined();
      expect(handler400?.errorCode).toBe('BAD_REQUEST');
      expect(handler400?.description).toContain('Invalid request');
    });

    it('should identify 404 error handler', () => {
      const parsed = parseClientFile(clientFilePath);
      const handler404 = findErrorHandler(parsed.errorHandlers, 404);
      
      expect(handler404).toBeDefined();
      expect(handler404?.errorCode).toBe('NOT_FOUND');
      expect(handler404?.description).toContain('not found');
    });

    it('should identify 500+ error handler', () => {
      const parsed = parseClientFile(clientFilePath);
      const handler500 = findErrorHandler(parsed.errorHandlers, 500);
      
      expect(handler500).toBeDefined();
      expect(handler500?.errorCode).toBe('SERVER_ERROR');
      expect(handler500?.description).toContain('Server error');
    });
  });

  describe('Request Interceptor Details', () => {
    it('should verify X-API-Key header is added', () => {
      const parsed = parseClientFile(clientFilePath);
      
      expect(hasRequestHeader(parsed.requestInterceptors, 'x-api-key')).toBe(true);
    });

    it('should verify Authorization header is added', () => {
      const parsed = parseClientFile(clientFilePath);
      
      expect(hasRequestHeader(parsed.requestInterceptors, 'Authorization')).toBe(true);
    });

    it('should verify AsyncStorage is used for token retrieval', () => {
      const parsed = parseClientFile(clientFilePath);
      
      const interceptor = parsed.requestInterceptors[0];
      expect(interceptor.usesAsyncStorage).toBe(true);
    });
  });

  describe('toClientConfiguration', () => {
    it('should convert parsed client to ClientConfiguration format', () => {
      const parsed = parseClientFile(clientFilePath);
      const config = toClientConfiguration(parsed);
      
      expect(config).toBeDefined();
      expect(config.baseURL).toBeDefined();
      expect(config.interceptors).toBeDefined();
      expect(config.interceptors.request).toBeDefined();
      expect(config.interceptors.response).toBeDefined();
      expect(config.errorHandlers).toBeDefined();
    });

    it('should include all request interceptors', () => {
      const parsed = parseClientFile(clientFilePath);
      const config = toClientConfiguration(parsed);
      
      expect(config.interceptors.request.length).toBe(parsed.requestInterceptors.length);
    });

    it('should include all response interceptors', () => {
      const parsed = parseClientFile(clientFilePath);
      const config = toClientConfiguration(parsed);
      
      expect(config.interceptors.response.length).toBe(parsed.responseInterceptors.length);
    });

    it('should include all error handlers', () => {
      const parsed = parseClientFile(clientFilePath);
      const config = toClientConfiguration(parsed);
      
      expect(config.errorHandlers.length).toBe(parsed.errorHandlers.length);
    });
  });

  describe('getHandledErrorCodes', () => {
    it('should return sorted list of handled error codes', () => {
      const parsed = parseClientFile(clientFilePath);
      const errorCodes = getHandledErrorCodes(parsed.errorHandlers);
      
      expect(errorCodes).toBeDefined();
      expect(errorCodes.length).toBeGreaterThan(0);
      
      // Verify sorted
      for (let i = 1; i < errorCodes.length; i++) {
        expect(errorCodes[i]).toBeGreaterThanOrEqual(errorCodes[i - 1]);
      }
    });

    it('should include all documented error codes', () => {
      const parsed = parseClientFile(clientFilePath);
      const errorCodes = getHandledErrorCodes(parsed.errorHandlers);
      
      // Verify critical error codes are handled
      expect(errorCodes).toContain(400);
      expect(errorCodes).toContain(401);
      expect(errorCodes).toContain(404);
      expect(errorCodes).toContain(500);
    });
  });

  describe('Validation against Requirements', () => {
    it('should verify client has X-API-Key interceptor (Requirement 8.1)', () => {
      const parsed = parseClientFile(clientFilePath);
      
      expect(hasRequestHeader(parsed.requestInterceptors, 'x-api-key')).toBe(true);
    });

    it('should verify client has Authorization interceptor (Requirement 8.2)', () => {
      const parsed = parseClientFile(clientFilePath);
      
      expect(hasRequestHeader(parsed.requestInterceptors, 'Authorization')).toBe(true);
    });

    it('should verify 401 handler attempts token refresh (Requirement 8.3)', () => {
      const parsed = parseClientFile(clientFilePath);
      const handler401 = findErrorHandler(parsed.errorHandlers, 401);
      
      expect(handler401).toBeDefined();
      expect(handler401?.attemptsTokenRefresh).toBe(true);
    });

    it('should verify utility methods exist (Requirement 8.4)', () => {
      const parsed = parseClientFile(clientFilePath);
      
      expect(parsed.utilityFunctions).toContain('get');
      expect(parsed.utilityFunctions).toContain('post');
      expect(parsed.utilityFunctions).toContain('put');
      expect(parsed.utilityFunctions).toContain('deleteRequest');
    });

    it('should verify baseURL is configured (Requirement 8.5)', () => {
      const parsed = parseClientFile(clientFilePath);
      
      expect(parsed.config.baseURL).toBeDefined();
    });
  });

  describe('Error Handling Validation (Requirements 12.1-12.6)', () => {
    it('should handle 400 Bad Request (Requirement 12.1)', () => {
      const parsed = parseClientFile(clientFilePath);
      const handler = findErrorHandler(parsed.errorHandlers, 400);
      
      expect(handler).toBeDefined();
      expect(handler?.errorCode).toBe('BAD_REQUEST');
    });

    it('should handle 401 Unauthorized with refresh (Requirement 12.2)', () => {
      const parsed = parseClientFile(clientFilePath);
      const handler = findErrorHandler(parsed.errorHandlers, 401);
      
      expect(handler).toBeDefined();
      expect(handler?.errorCode).toBe('UNAUTHORIZED');
      expect(handler?.attemptsTokenRefresh).toBe(true);
    });

    it('should handle 404 Not Found (Requirement 12.4)', () => {
      const parsed = parseClientFile(clientFilePath);
      const handler = findErrorHandler(parsed.errorHandlers, 404);
      
      expect(handler).toBeDefined();
      expect(handler?.errorCode).toBe('NOT_FOUND');
    });

    it('should handle 500 Internal Server Error (Requirement 12.5)', () => {
      const parsed = parseClientFile(clientFilePath);
      const handler = findErrorHandler(parsed.errorHandlers, 500);
      
      expect(handler).toBeDefined();
      expect(handler?.errorCode).toBe('SERVER_ERROR');
    });

    it('should return formatted error responses (Requirement 12.6)', () => {
      const parsed = parseClientFile(clientFilePath);
      
      // All error handlers should return formatted errors
      parsed.errorHandlers.forEach(handler => {
        expect(handler.returnsFormattedError).toBe(true);
      });
    });
  });
});
