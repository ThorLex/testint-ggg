/**
 * Unit tests for Client Analyzer
 * Feature: api-routes-complete-analysis
 * 
 * Tests validation logic for:
 * - X-API-Key interceptor (Requirement 8.1)
 * - Authorization header interceptor (Requirement 8.2)
 * - 401 error handling with token refresh (Requirement 8.3)
 * - baseURL configuration (Requirement 8.5)
 * - Error code handling (Requirements 12.1-12.5)
 * - ApiErrorResponse structure (Requirement 12.6)
 */

import { analyzeClient, generateClientReport, ClientAnalysisResult } from '../../src/analyzers/client-analyzer';
import { ParsedClient } from '../../src/parsers/client-parser';
import * as clientParser from '../../src/parsers/client-parser';

// Mock the client parser
jest.mock('../../src/parsers/client-parser', () => {
  const actual = jest.requireActual('../../src/parsers/client-parser');
  return {
    ...actual,
    parseClientFile: jest.fn(),
  };
});

describe('Client Analyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeClient', () => {
    it('should detect missing X-API-Key interceptor (Requirement 8.1)', () => {
      const mockParsedClient: ParsedClient = {
        config: { baseURL: 'ApiRoutes.BASE_URL' },
        requestInterceptors: [
          {
            description: 'Request interceptor',
            addsHeaders: ['Authorization'], // Missing x-api-key
            usesAsyncStorage: true,
            logsRequests: false,
          },
        ],
        responseInterceptors: [],
        errorHandlers: [],
        utilityFunctions: [],
      };

      (clientParser.parseClientFile as jest.Mock).mockReturnValue(mockParsedClient);

      const result = analyzeClient('src/services/api/client.ts');

      expect(result.summary.hasXApiKeyInterceptor).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'MISSING_X_API_KEY_INTERCEPTOR',
          priority: 'CRITICAL',
          requirement: '8.1',
        })
      );
    });

    it('should detect missing Authorization interceptor (Requirement 8.2)', () => {
      const mockParsedClient: ParsedClient = {
        config: { baseURL: 'ApiRoutes.BASE_URL' },
        requestInterceptors: [
          {
            description: 'Request interceptor',
            addsHeaders: ['x-api-key'], // Missing Authorization
            usesAsyncStorage: false,
            logsRequests: false,
          },
        ],
        responseInterceptors: [],
        errorHandlers: [],
        utilityFunctions: [],
      };

      (clientParser.parseClientFile as jest.Mock).mockReturnValue(mockParsedClient);

      const result = analyzeClient('src/services/api/client.ts');

      expect(result.summary.hasAuthorizationInterceptor).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'MISSING_AUTHORIZATION_INTERCEPTOR',
          priority: 'CRITICAL',
          requirement: '8.2',
        })
      );
    });

    it('should detect missing 401 error handler (Requirement 8.3)', () => {
      const mockParsedClient: ParsedClient = {
        config: { baseURL: 'ApiRoutes.BASE_URL' },
        requestInterceptors: [
          {
            description: 'Request interceptor',
            addsHeaders: ['x-api-key', 'Authorization'],
            usesAsyncStorage: true,
            logsRequests: false,
          },
        ],
        responseInterceptors: [],
        errorHandlers: [], // Missing 401 handler
        utilityFunctions: [],
      };

      (clientParser.parseClientFile as jest.Mock).mockReturnValue(mockParsedClient);

      const result = analyzeClient('src/services/api/client.ts');

      expect(result.summary.has401ErrorHandler).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'MISSING_401_ERROR_HANDLER',
          priority: 'CRITICAL',
          requirement: '8.3',
        })
      );
    });

    it('should detect missing token refresh in 401 handler (Requirement 8.3)', () => {
      const mockParsedClient: ParsedClient = {
        config: { baseURL: 'ApiRoutes.BASE_URL' },
        requestInterceptors: [
          {
            description: 'Request interceptor',
            addsHeaders: ['x-api-key', 'Authorization'],
            usesAsyncStorage: true,
            logsRequests: false,
          },
        ],
        responseInterceptors: [],
        errorHandlers: [
          {
            statusCode: 401,
            errorCode: 'UNAUTHORIZED',
            description: 'Authentication required',
            attemptsTokenRefresh: false, // Missing token refresh
            returnsFormattedError: true,
          },
        ],
        utilityFunctions: [],
      };

      (clientParser.parseClientFile as jest.Mock).mockReturnValue(mockParsedClient);

      const result = analyzeClient('src/services/api/client.ts');

      expect(result.summary.has401ErrorHandler).toBe(true);
      expect(result.summary.hasTokenRefresh).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'MISSING_TOKEN_REFRESH',
          severity: 'HIGH',
          requirement: '8.3',
        })
      );
    });

    it('should detect missing baseURL (Requirement 8.5)', () => {
      const mockParsedClient: ParsedClient = {
        config: {}, // Missing baseURL
        requestInterceptors: [
          {
            description: 'Request interceptor',
            addsHeaders: ['x-api-key', 'Authorization'],
            usesAsyncStorage: true,
            logsRequests: false,
          },
        ],
        responseInterceptors: [],
        errorHandlers: [],
        utilityFunctions: [],
      };

      (clientParser.parseClientFile as jest.Mock).mockReturnValue(mockParsedClient);

      const result = analyzeClient('src/services/api/client.ts');

      expect(result.summary.hasBaseURL).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'MISSING_BASE_URL',
          priority: 'CRITICAL',
          requirement: '8.5',
        })
      );
    });

    it('should detect missing error handlers (Requirements 12.1-12.5)', () => {
      const mockParsedClient: ParsedClient = {
        config: { baseURL: 'ApiRoutes.BASE_URL' },
        requestInterceptors: [
          {
            description: 'Request interceptor',
            addsHeaders: ['x-api-key', 'Authorization'],
            usesAsyncStorage: true,
            logsRequests: false,
          },
        ],
        responseInterceptors: [],
        errorHandlers: [
          {
            statusCode: 401,
            errorCode: 'UNAUTHORIZED',
            description: 'Authentication required',
            attemptsTokenRefresh: true,
            returnsFormattedError: true,
          },
        ], // Missing 400, 403, 404, 500
        utilityFunctions: [],
      };

      (clientParser.parseClientFile as jest.Mock).mockReturnValue(mockParsedClient);

      const result = analyzeClient('src/services/api/client.ts');

      expect(result.summary.missingErrorCodes).toEqual([400, 403, 404, 500]);
      expect(result.issues.filter(i => i.type === 'MISSING_ERROR_HANDLER')).toHaveLength(4);
    });

    it('should pass validation when all requirements are met', () => {
      const mockParsedClient: ParsedClient = {
        config: { baseURL: 'ApiRoutes.BASE_URL' },
        requestInterceptors: [
          {
            description: 'Request interceptor',
            addsHeaders: ['x-api-key', 'Authorization'],
            usesAsyncStorage: true,
            logsRequests: false,
          },
        ],
        responseInterceptors: [
          {
            description: 'Response interceptor',
            logsResponses: true,
            handlesErrors: true,
          },
        ],
        errorHandlers: [
          {
            statusCode: 400,
            errorCode: 'BAD_REQUEST',
            description: 'Invalid request',
            returnsFormattedError: true,
          },
          {
            statusCode: 401,
            errorCode: 'UNAUTHORIZED',
            description: 'Authentication required',
            attemptsTokenRefresh: true,
            returnsFormattedError: true,
          },
          {
            statusCode: 403,
            errorCode: 'FORBIDDEN',
            description: 'Access forbidden',
            returnsFormattedError: true,
          },
          {
            statusCode: 404,
            errorCode: 'NOT_FOUND',
            description: 'Resource not found',
            returnsFormattedError: true,
          },
          {
            statusCode: 500,
            errorCode: 'SERVER_ERROR',
            description: 'Server error',
            returnsFormattedError: true,
          },
        ],
        utilityFunctions: ['get', 'post', 'put', 'del', 'deleteRequest', 'patch'],
      };

      (clientParser.parseClientFile as jest.Mock).mockReturnValue(mockParsedClient);

      const result = analyzeClient('src/services/api/client.ts');

      expect(result.issues).toHaveLength(0);
      expect(result.summary.hasXApiKeyInterceptor).toBe(true);
      expect(result.summary.hasAuthorizationInterceptor).toBe(true);
      expect(result.summary.has401ErrorHandler).toBe(true);
      expect(result.summary.hasTokenRefresh).toBe(true);
      expect(result.summary.hasBaseURL).toBe(true);
      expect(result.summary.handledErrorCodes).toEqual([400, 401, 403, 404, 500]);
      expect(result.summary.missingErrorCodes).toEqual([]);
    });
  });

  describe('generateClientReport', () => {
    it('should generate a report with no issues', () => {
      const result: ClientAnalysisResult = {
        issues: [],
        summary: {
          hasXApiKeyInterceptor: true,
          hasAuthorizationInterceptor: true,
          has401ErrorHandler: true,
          hasTokenRefresh: true,
          hasBaseURL: true,
          handledErrorCodes: [400, 401, 403, 404, 500],
          missingErrorCodes: [],
        },
      };

      const report = generateClientReport(result);

      expect(report).toContain('# Client Configuration Analysis Report');
      expect(report).toContain('✅');
      expect(report).toContain('No Issues Found');
    });

    it('should generate a report with issues', () => {
      const result: ClientAnalysisResult = {
        issues: [
          {
            type: 'MISSING_X_API_KEY_INTERCEPTOR',
            priority: 'CRITICAL',
            component: 'Request Interceptor',
            description: 'Request interceptor does not add X-API-Key header',
            expected: 'Request interceptor should add x-api-key header to all requests',
            actual: 'No x-api-key header found in request interceptors',
            requirement: '8.1',
          },
        ],
        summary: {
          hasXApiKeyInterceptor: false,
          hasAuthorizationInterceptor: true,
          has401ErrorHandler: true,
          hasTokenRefresh: true,
          hasBaseURL: true,
          handledErrorCodes: [401, 400, 403, 404, 500],
          missingErrorCodes: [],
        },
      };

      const report = generateClientReport(result);

      expect(report).toContain('# Client Configuration Analysis Report');
      expect(report).toContain('Critical Issues');
      expect(report).toContain('Request interceptor does not add X-API-Key header');
      expect(report).toContain('**Requirement**: 8.1');
    });
  });
});
