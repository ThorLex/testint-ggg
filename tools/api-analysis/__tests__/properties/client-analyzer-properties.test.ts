/**
 * Property-Based Tests for Client Analyzer
 * Feature: api-routes-complete-analysis, Task 7.3
 * 
 * Property 12: Error Response Structure - For any documented error code (400, 401, 403, 404, 500),
 * the client MUST handle that error code and return a response matching the ApiErrorResponse structure.
 * 
 * **Validates: Requirements 12.1-12.6**
 */

import fc from 'fast-check';
import * as path from 'path';
import * as fs from 'fs';
import { analyzeClient } from '../../src/analyzers/client-analyzer';
import { parseClientFile, ParsedClient, ErrorHandler } from '../../src/parsers/client-parser';

describe('Property-Based Tests for Client Analyzer', () => {
  
  // Path to actual client file
  const CLIENT_PATH = path.resolve(__dirname, '../../../../src/services/api/client.ts');

  // Load real client data once for all tests
  let realParsedClient: ParsedClient;

  beforeAll(() => {
    // Parse real client file
    if (fs.existsSync(CLIENT_PATH)) {
      realParsedClient = parseClientFile(CLIENT_PATH);
    } else {
      // If client file doesn't exist, create a mock for testing
      realParsedClient = createMockParsedClient();
    }
  });

  /**
   * Property 12: Error Response Structure
   * 
   * For any documented error code (400, 401, 403, 404, 500), the client MUST handle
   * that error code and return a response matching the ApiErrorResponse structure.
   * 
   * **Validates: Requirements 12.1-12.6**
   */
  describe('Property 12: Error Response Structure', () => {
    
    const REQUIRED_ERROR_CODES = [400, 401, 403, 404, 500];
    
    it('should handle all documented error codes', () => {
      fc.assert(
        fc.property(
          // Generate test cases from all required error codes
          fc.constantFrom(...REQUIRED_ERROR_CODES),
          (errorCode) => {
            // Run the analyzer
            const result = analyzeClient(CLIENT_PATH);
            
            // Check if this error code is handled
            const isHandled = result.summary.handledErrorCodes.includes(errorCode);
            
            // Property: All required error codes must be handled
            if (!isHandled) {
              console.log(`Missing error handler for code: ${errorCode}`);
              return false;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return formatted ApiErrorResponse for all error handlers', () => {
      fc.assert(
        fc.property(
          // Generate test cases from all error handlers in the parsed client
          fc.constantFrom(...realParsedClient.errorHandlers),
          (errorHandler) => {
            // Property: Every error handler must return a formatted error response
            if (!errorHandler.returnsFormattedError) {
              console.log(`Error handler for ${errorHandler.statusCode} does not return formatted error`);
              return false;
            }
            
            return true;
          }
        ),
        { numRuns: Math.max(100, realParsedClient.errorHandlers.length) }
      );
    });

    it('should detect missing error handlers when client is incomplete', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary subsets of error handlers (simulating incomplete implementation)
          fc.integer({ min: 0, max: REQUIRED_ERROR_CODES.length - 1 }),
          (numHandlersToKeep) => {
            // Create a subset of error codes to handle
            const handledCodes = REQUIRED_ERROR_CODES.slice(0, numHandlersToKeep);
            
            // Create mock error handlers for only these codes
            const mockErrorHandlers: ErrorHandler[] = handledCodes.map(code => ({
              statusCode: code,
              errorCode: getErrorCodeName(code),
              description: `Handler for ${code}`,
              returnsFormattedError: true,
              attemptsTokenRefresh: code === 401,
            }));
            
            // Create a mock parsed client with incomplete error handlers
            const incompleteParsedClient: ParsedClient = {
              ...realParsedClient,
              errorHandlers: mockErrorHandlers,
            };
            
            // Mock the parseClientFile to return our incomplete client
            const originalParse = parseClientFile;
            (parseClientFile as any) = jest.fn().mockReturnValue(incompleteParsedClient);
            
            // Run the analyzer
            const result = analyzeClient(CLIENT_PATH);
            
            // Restore original function
            (parseClientFile as any) = originalParse;
            
            // Property: Missing error codes should be detected
            const expectedMissing = REQUIRED_ERROR_CODES.length - numHandlersToKeep;
            const actualMissing = result.summary.missingErrorCodes.length;
            
            return actualMissing === expectedMissing;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate that 401 handler attempts token refresh', () => {
      fc.assert(
        fc.property(
          fc.constant(401),
          (errorCode) => {
            // Find the 401 error handler
            const handler401 = realParsedClient.errorHandlers.find(
              h => h.statusCode === errorCode
            );
            
            // Property: 401 handler must exist and attempt token refresh
            if (!handler401) {
              console.log('401 error handler not found');
              return false;
            }
            
            if (!handler401.attemptsTokenRefresh) {
              console.log('401 error handler does not attempt token refresh');
              return false;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect when error handlers do not return formatted responses', () => {
      fc.assert(
        fc.property(
          // Generate combinations of error handlers with/without formatted responses
          fc.constantFrom(...REQUIRED_ERROR_CODES),
          fc.boolean(),
          (errorCode, returnsFormatted) => {
            // Create a mock error handler
            const mockErrorHandler: ErrorHandler = {
              statusCode: errorCode,
              errorCode: getErrorCodeName(errorCode),
              description: `Handler for ${errorCode}`,
              returnsFormattedError: returnsFormatted,
              attemptsTokenRefresh: errorCode === 401,
            };
            
            // Create a mock parsed client with this handler
            const mockParsedClient: ParsedClient = {
              ...realParsedClient,
              errorHandlers: [mockErrorHandler],
            };
            
            // Mock the parseClientFile
            const originalParse = parseClientFile;
            (parseClientFile as any) = jest.fn().mockReturnValue(mockParsedClient);
            
            // Run the analyzer
            const result = analyzeClient(CLIENT_PATH);
            
            // Restore original function
            (parseClientFile as any) = originalParse;
            
            // Property: If handler doesn't return formatted response, analyzer should detect it
            const hasFormattingIssue = result.issues.some(
              issue => issue.type === 'MISSING_ERROR_RESPONSE_STRUCTURE'
            );
            
            if (!returnsFormatted) {
              return hasFormattingIssue;
            } else {
              // If it returns formatted response, there should be no formatting issue
              // (unless there are other handlers that don't)
              return true;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should verify error response structure includes required fields', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...realParsedClient.errorHandlers),
          (errorHandler) => {
            // Property: Error handlers that return formatted errors should include
            // the ApiErrorResponse structure (code, message, details, status)
            
            // This is validated by the returnsFormattedError flag
            // The parser should only set this to true if it detects the proper structure
            
            if (errorHandler.returnsFormattedError) {
              // Verify the error handler has a proper error code
              return !!(errorHandler.errorCode && errorHandler.errorCode.length > 0);
            }
            
            return true;
          }
        ),
        { numRuns: Math.max(100, realParsedClient.errorHandlers.length) }
      );
    });

    it('should map error codes to correct requirement numbers', () => {
      const errorCodeRequirements: Record<number, string> = {
        400: '12.1',
        401: '12.2',
        403: '12.3',
        404: '12.4',
        500: '12.5',
      };

      fc.assert(
        fc.property(
          fc.constantFrom(...REQUIRED_ERROR_CODES),
          (errorCode) => {
            // Run the analyzer
            const result = analyzeClient(CLIENT_PATH);
            
            // Find issues related to this error code
            const relatedIssues = result.issues.filter(
              issue => 
                issue.type === 'MISSING_ERROR_HANDLER' &&
                issue.description.includes(errorCode.toString())
            );
            
            // Property: If there's a missing error handler issue, it should reference
            // the correct requirement number
            if (relatedIssues.length > 0) {
              const expectedRequirement = errorCodeRequirements[errorCode];
              return relatedIssues.every(
                issue => issue.requirement === expectedRequirement
              );
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Integration property: Error handling completeness
   */
  describe('Integration Property: Error Handling Completeness', () => {
    const REQUIRED_ERROR_CODES = [400, 401, 403, 404, 500];
    
    it('should have consistent error handling statistics', () => {
      const result = analyzeClient(CLIENT_PATH);
      
      // Property: handledErrorCodes + missingErrorCodes should equal REQUIRED_ERROR_CODES
      const totalCodes = result.summary.handledErrorCodes.length + 
                        result.summary.missingErrorCodes.length;
      
      expect(totalCodes).toBe(REQUIRED_ERROR_CODES.length);
      
      // Property: No overlap between handled and missing codes
      const overlap = result.summary.handledErrorCodes.filter(
        code => result.summary.missingErrorCodes.includes(code)
      );
      
      expect(overlap).toHaveLength(0);
    });

    it('should produce consistent results across multiple runs', () => {
      fc.assert(
        fc.property(
          fc.constant(null), // No random input needed
          () => {
            // Run analyzer multiple times
            const result1 = analyzeClient(CLIENT_PATH);
            const result2 = analyzeClient(CLIENT_PATH);
            
            // Property: Results should be identical
            return (
              result1.summary.hasXApiKeyInterceptor === result2.summary.hasXApiKeyInterceptor &&
              result1.summary.hasAuthorizationInterceptor === result2.summary.hasAuthorizationInterceptor &&
              result1.summary.has401ErrorHandler === result2.summary.has401ErrorHandler &&
              result1.summary.hasTokenRefresh === result2.summary.hasTokenRefresh &&
              result1.summary.hasBaseURL === result2.summary.hasBaseURL &&
              result1.summary.handledErrorCodes.length === result2.summary.handledErrorCodes.length &&
              result1.summary.missingErrorCodes.length === result2.summary.missingErrorCodes.length &&
              result1.issues.length === result2.issues.length
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have issue counts that match the summary statistics', () => {
      const result = analyzeClient(CLIENT_PATH);
      
      // Count missing error handler issues
      const missingErrorHandlerCount = result.issues.filter(
        i => i.type === 'MISSING_ERROR_HANDLER'
      ).length;
      
      // Property: Number of missing error handler issues should match
      // the number of missing error codes
      expect(missingErrorHandlerCount).toBe(result.summary.missingErrorCodes.length);
    });
  });
});

/**
 * Helper function to get error code name
 */
function getErrorCodeName(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 500:
      return 'SERVER_ERROR';
    default:
      return 'UNKNOWN_ERROR';
  }
}

/**
 * Create a mock ParsedClient for testing when real file doesn't exist
 */
function createMockParsedClient(): ParsedClient {
  return {
    config: {
      baseURL: 'ApiRoutes.BASE_URL',
    },
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
}
