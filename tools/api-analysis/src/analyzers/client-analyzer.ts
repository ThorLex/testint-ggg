/**
 * Client Analyzer for Axios Configuration
 * Feature: api-routes-complete-analysis
 * 
 * Validates the Axios client configuration against requirements:
 * - Requirement 8.1: X-API-Key interceptor
 * - Requirement 8.2: Authorization header interceptor
 * - Requirement 8.3: 401 error handling with token refresh
 * - Requirement 8.5: baseURL configuration
 * - Requirements 12.1-12.5: Error code handling (400, 403, 404, 500)
 * - Requirement 12.6: ApiErrorResponse structure usage
 */

import { ParsedClient, parseClientFile, hasRequestHeader, findErrorHandler } from '../parsers/client-parser';
import { ClientIssue, IssuePriority } from '../../types/core';

/**
 * Issue types for client validation
 */
export type ClientIssueType =
  | 'MISSING_X_API_KEY_INTERCEPTOR'
  | 'MISSING_AUTHORIZATION_INTERCEPTOR'
  | 'MISSING_401_ERROR_HANDLER'
  | 'MISSING_TOKEN_REFRESH'
  | 'MISSING_ERROR_HANDLER'
  | 'MISSING_BASE_URL'
  | 'INCORRECT_BASE_URL'
  | 'MISSING_ERROR_RESPONSE_STRUCTURE';

/**
 * Client analysis result
 */
export interface ClientAnalysisResult {
  issues: ClientIssue[];
  summary: {
    hasXApiKeyInterceptor: boolean;
    hasAuthorizationInterceptor: boolean;
    has401ErrorHandler: boolean;
    hasTokenRefresh: boolean;
    hasBaseURL: boolean;
    handledErrorCodes: number[];
    missingErrorCodes: number[];
  };
}

/**
 * Analyze the Axios client configuration
 * 
 * @param clientFilePath - Path to the client.ts file
 * @returns Analysis result with issues and summary
 */
export function analyzeClient(clientFilePath: string): ClientAnalysisResult {
  const parsedClient = parseClientFile(clientFilePath);
  const issues: ClientIssue[] = [];

  // Validate X-API-Key interceptor (Requirement 8.1)
  const hasXApiKey = validateXApiKeyInterceptor(parsedClient, issues);

  // Validate Authorization header interceptor (Requirement 8.2)
  const hasAuthorization = validateAuthorizationInterceptor(parsedClient, issues);

  // Validate 401 error handling with token refresh (Requirement 8.3)
  const { has401Handler, hasTokenRefresh } = validate401ErrorHandling(parsedClient, issues);

  // Validate baseURL configuration (Requirement 8.5)
  const hasBaseURL = validateBaseURL(parsedClient, issues);

  // Validate error code handling (Requirements 12.1-12.5)
  const { handledErrorCodes, missingErrorCodes } = validateErrorCodeHandling(parsedClient, issues);

  // Validate ApiErrorResponse structure (Requirement 12.6)
  validateErrorResponseStructure(parsedClient, issues);

  return {
    issues,
    summary: {
      hasXApiKeyInterceptor: hasXApiKey,
      hasAuthorizationInterceptor: hasAuthorization,
      has401ErrorHandler: has401Handler,
      hasTokenRefresh,
      hasBaseURL,
      handledErrorCodes,
      missingErrorCodes,
    },
  };
}

/**
 * Validate X-API-Key interceptor (Requirement 8.1)
 */
function validateXApiKeyInterceptor(parsedClient: ParsedClient, issues: ClientIssue[]): boolean {
  const hasXApiKey = hasRequestHeader(parsedClient.requestInterceptors, 'x-api-key');

  if (!hasXApiKey) {
    issues.push({
      type: 'MISSING_X_API_KEY_INTERCEPTOR',
      priority: 'CRITICAL',
      component: 'Request Interceptor',
      description: 'Request interceptor does not add X-API-Key header',
      expected: 'Request interceptor should add x-api-key header to all requests',
      actual: 'No x-api-key header found in request interceptors',
      requirement: '8.1',
    });
  }

  return hasXApiKey;
}

/**
 * Validate Authorization header interceptor (Requirement 8.2)
 */
function validateAuthorizationInterceptor(parsedClient: ParsedClient, issues: ClientIssue[]): boolean {
  const hasAuthorization = hasRequestHeader(parsedClient.requestInterceptors, 'Authorization');

  if (!hasAuthorization) {
    issues.push({
      type: 'MISSING_AUTHORIZATION_INTERCEPTOR',
      priority: 'CRITICAL',
      component: 'Request Interceptor',
      description: 'Request interceptor does not add Authorization header',
      expected: 'Request interceptor should add Authorization header with Bearer token',
      actual: 'No Authorization header found in request interceptors',
      requirement: '8.2',
    });
  }

  return hasAuthorization;
}

/**
 * Validate 401 error handling with token refresh (Requirement 8.3)
 */
function validate401ErrorHandling(
  parsedClient: ParsedClient,
  issues: ClientIssue[]
): { has401Handler: boolean; hasTokenRefresh: boolean } {
  const handler401 = findErrorHandler(parsedClient.errorHandlers, 401);

  if (!handler401) {
    issues.push({
      type: 'MISSING_401_ERROR_HANDLER',
      priority: 'CRITICAL',
      component: 'Response Interceptor',
      description: '401 error handler is missing',
      expected: 'Response interceptor should handle 401 errors',
      actual: 'No 401 error handler found',
      requirement: '8.3',
    });
    return { has401Handler: false, hasTokenRefresh: false };
  }

  const hasTokenRefresh = handler401.attemptsTokenRefresh === true;

  if (!hasTokenRefresh) {
    issues.push({
      type: 'MISSING_TOKEN_REFRESH',
      priority: 'HIGH',
      component: 'Response Interceptor',
      description: '401 error handler does not attempt token refresh',
      expected: 'Response interceptor should attempt to refresh token on 401 error',
      actual: '401 handler found but no token refresh logic detected',
      requirement: '8.3',
    });
  }

  return { has401Handler: true, hasTokenRefresh };
}

/**
 * Validate baseURL configuration (Requirement 8.5)
 */
function validateBaseURL(parsedClient: ParsedClient, issues: ClientIssue[]): boolean {
  if (!parsedClient.config.baseURL) {
    issues.push({
      type: 'MISSING_BASE_URL',
      priority: 'CRITICAL',
      component: 'Axios Configuration',
      description: 'baseURL is not configured',
      expected: 'Axios client should have baseURL configured with ApiRoutes.BASE_URL',
      actual: 'No baseURL found in configuration',
      requirement: '8.5',
    });
    return false;
  }

  // Check if baseURL references ApiRoutes.BASE_URL
  const usesApiRoutes = parsedClient.config.baseURL.includes('ApiRoutes.BASE_URL');

  if (!usesApiRoutes) {
    issues.push({
      type: 'INCORRECT_BASE_URL',
      priority: 'MEDIUM',
      component: 'Axios Configuration',
      description: 'baseURL does not reference ApiRoutes.BASE_URL',
      expected: 'baseURL should be set to ApiRoutes.BASE_URL',
      actual: `baseURL is set to: ${parsedClient.config.baseURL}`,
      requirement: '8.5',
    });
  }

  return true;
}

/**
 * Validate error code handling (Requirements 12.1-12.5)
 */
function validateErrorCodeHandling(
  parsedClient: ParsedClient,
  issues: ClientIssue[]
): { handledErrorCodes: number[]; missingErrorCodes: number[] } {
  const requiredErrorCodes = [400, 401, 403, 404, 500];
  const handledErrorCodes = parsedClient.errorHandlers.map(h => h.statusCode);
  const missingErrorCodes = requiredErrorCodes.filter(code => !handledErrorCodes.includes(code));

  // Map error codes to requirements
  const errorCodeRequirements: Record<number, string> = {
    400: '12.1',
    401: '12.2',
    403: '12.3',
    404: '12.4',
    500: '12.5',
  };

  for (const errorCode of missingErrorCodes) {
    issues.push({
      type: 'MISSING_ERROR_HANDLER',
      priority: errorCode === 401 ? 'CRITICAL' : 'HIGH',
      component: 'Response Interceptor',
      description: `Error handler for ${errorCode} is missing`,
      expected: `Response interceptor should handle ${errorCode} errors`,
      actual: `No ${errorCode} error handler found`,
      requirement: errorCodeRequirements[errorCode],
    });
  }

  return { handledErrorCodes, missingErrorCodes };
}

/**
 * Validate ApiErrorResponse structure (Requirement 12.6)
 */
function validateErrorResponseStructure(parsedClient: ParsedClient, issues: ClientIssue[]): void {
  // Check if error handlers return formatted errors
  const allHandlersReturnFormatted = parsedClient.errorHandlers.every(
    handler => handler.returnsFormattedError
  );

  if (!allHandlersReturnFormatted) {
    issues.push({
      type: 'MISSING_ERROR_RESPONSE_STRUCTURE',
      priority: 'HIGH',
      component: 'Response Interceptor',
      description: 'Error handlers do not return ApiErrorResponse structure',
      expected: 'All error handlers should return errors with code, message, details, and status',
      actual: 'Some error handlers do not return formatted ApiErrorResponse',
      requirement: '12.6',
    });
  }
}

/**
 * Generate a summary report of client validation
 */
export function generateClientReport(result: ClientAnalysisResult): string {
  const { issues, summary } = result;

  let report = '# Client Configuration Analysis Report\n\n';

  // Summary section
  report += '## Summary\n\n';
  report += `- X-API-Key Interceptor: ${summary.hasXApiKeyInterceptor ? '✅' : '❌'}\n`;
  report += `- Authorization Interceptor: ${summary.hasAuthorizationInterceptor ? '✅' : '❌'}\n`;
  report += `- 401 Error Handler: ${summary.has401ErrorHandler ? '✅' : '❌'}\n`;
  report += `- Token Refresh: ${summary.hasTokenRefresh ? '✅' : '❌'}\n`;
  report += `- Base URL Configuration: ${summary.hasBaseURL ? '✅' : '❌'}\n`;
  report += `- Handled Error Codes: ${summary.handledErrorCodes.join(', ')}\n`;
  
  if (summary.missingErrorCodes.length > 0) {
    report += `- Missing Error Codes: ${summary.missingErrorCodes.join(', ')}\n`;
  }

  report += '\n';

  // Issues section
  if (issues.length > 0) {
    report += '## Issues Found\n\n';

    const criticalIssues = issues.filter(i => i.priority === 'CRITICAL');
    const highIssues = issues.filter(i => i.priority === 'HIGH');
    const mediumIssues = issues.filter(i => i.priority === 'MEDIUM');
    const lowIssues = issues.filter(i => i.priority === 'LOW');

    if (criticalIssues.length > 0) {
      report += '### Critical Issues\n\n';
      criticalIssues.forEach(issue => {
        report += formatIssue(issue);
      });
    }

    if (highIssues.length > 0) {
      report += '### High Priority Issues\n\n';
      highIssues.forEach(issue => {
        report += formatIssue(issue);
      });
    }

    if (mediumIssues.length > 0) {
      report += '### Medium Priority Issues\n\n';
      mediumIssues.forEach(issue => {
        report += formatIssue(issue);
      });
    }

    if (lowIssues.length > 0) {
      report += '### Low Priority Issues\n\n';
      lowIssues.forEach(issue => {
        report += formatIssue(issue);
      });
    }
  } else {
    report += '## ✅ No Issues Found\n\n';
    report += 'The client configuration meets all requirements.\n';
  }

  return report;
}

/**
 * Format a single issue for the report
 */
function formatIssue(issue: ClientIssue): string {
  let formatted = `#### ${issue.description}\n\n`;
  formatted += `- **Component**: ${issue.component}\n`;
  formatted += `- **Requirement**: ${issue.requirement}\n`;
  formatted += `- **Expected**: ${issue.expected}\n`;
  formatted += `- **Actual**: ${issue.actual}\n`;
  formatted += '\n';
  return formatted;
}

