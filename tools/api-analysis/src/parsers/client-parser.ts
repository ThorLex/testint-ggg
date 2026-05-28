/**
 * TypeScript AST parser for client.ts
 * Feature: api-routes-complete-analysis
 * 
 * Parses the Axios client configuration to extract:
 * - Client configuration (baseURL, timeout, headers)
 * - Request interceptors and their logic
 * - Response interceptors and their logic
 * - Error handling patterns (401, 403, 404, 500, etc.)
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { ClientConfiguration, InterceptorInfo, ErrorHandlerInfo } from '../../types/core';

/**
 * Axios client configuration details
 */
export interface AxiosClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Request interceptor details
 */
export interface RequestInterceptor {
  description: string;
  addsHeaders: string[];
  usesAsyncStorage: boolean;
  logsRequests: boolean;
}

/**
 * Response interceptor details
 */
export interface ResponseInterceptor {
  description: string;
  logsResponses: boolean;
  handlesErrors: boolean;
}

/**
 * Error handling logic details
 */
export interface ErrorHandler {
  statusCode: number;
  errorCode: string;
  description: string;
  attemptsTokenRefresh?: boolean;
  clearsStorage?: boolean;
  returnsFormattedError: boolean;
}

/**
 * Complete parsed client information
 */
export interface ParsedClient {
  config: AxiosClientConfig;
  requestInterceptors: RequestInterceptor[];
  responseInterceptors: ResponseInterceptor[];
  errorHandlers: ErrorHandler[];
  utilityFunctions: string[];
}

/**
 * Parse the client.ts file and extract Axios configuration and interceptors
 * 
 * @param filePath - Path to the client.ts file
 * @returns Parsed client information
 */
export function parseClientFile(filePath: string): ParsedClient {
  const absolutePath = path.resolve(filePath);
  
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Client file not found: ${absolutePath}`);
  }

  const sourceCode = fs.readFileSync(absolutePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  const config: AxiosClientConfig = {};
  const requestInterceptors: RequestInterceptor[] = [];
  const responseInterceptors: ResponseInterceptor[] = [];
  const errorHandlers: ErrorHandler[] = [];
  const utilityFunctions: string[] = [];

  function visit(node: ts.Node) {
    // Extract axios.create() configuration
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      if (ts.isPropertyAccessExpression(expr) && 
          expr.name.text === 'create' &&
          ts.isIdentifier(expr.expression) &&
          expr.expression.text === 'axios') {
        extractAxiosConfig(node, config);
      }
    }

    // Extract request interceptor
    if (isRequestInterceptor(node) && ts.isCallExpression(node)) {
      const interceptor = extractRequestInterceptor(node, sourceCode);
      if (interceptor) {
        requestInterceptors.push(interceptor);
      }
    }

    // Extract response interceptor
    if (isResponseInterceptor(node) && ts.isCallExpression(node)) {
      const interceptor = extractResponseInterceptor(node, sourceCode);
      if (interceptor) {
        responseInterceptors.push(interceptor);
      }
    }

    // Extract utility functions (get, post, put, del, etc.)
    if (ts.isFunctionDeclaration(node) && node.name) {
      const functionName = node.name.text;
      if (['get', 'post', 'put', 'del', 'deleteRequest', 'patch'].includes(functionName)) {
        utilityFunctions.push(functionName);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  // Extract error handlers from response interceptor
  const errorHandlersFromCode = extractErrorHandlers(sourceCode);
  errorHandlers.push(...errorHandlersFromCode);

  return {
    config,
    requestInterceptors,
    responseInterceptors,
    errorHandlers,
    utilityFunctions,
  };
}

/**
 * Extract Axios configuration from axios.create() call
 */
function extractAxiosConfig(node: ts.CallExpression, config: AxiosClientConfig): void {
  if (node.arguments.length > 0) {
    const configArg = node.arguments[0];
    if (ts.isObjectLiteralExpression(configArg)) {
      configArg.properties.forEach(prop => {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
          const propName = prop.name.text;
          
          if (propName === 'baseURL') {
            config.baseURL = extractPropertyValue(prop.initializer);
          } else if (propName === 'timeout') {
            const timeoutValue = extractPropertyValue(prop.initializer);
            config.timeout = timeoutValue ? parseInt(timeoutValue, 10) : undefined;
          } else if (propName === 'headers' && ts.isObjectLiteralExpression(prop.initializer)) {
            config.headers = {};
            prop.initializer.properties.forEach(headerProp => {
              if (ts.isPropertyAssignment(headerProp) && ts.isStringLiteral(headerProp.name)) {
                const headerName = headerProp.name.text;
                const headerValue = extractPropertyValue(headerProp.initializer);
                if (headerValue) {
                  config.headers![headerName] = headerValue;
                }
              }
            });
          }
        }
      });
    }
  }
}

/**
 * Extract property value as string
 */
function extractPropertyValue(node: ts.Expression): string | undefined {
  if (ts.isStringLiteral(node)) {
    return node.text;
  } else if (ts.isNumericLiteral(node)) {
    return node.text;
  } else if (ts.isPropertyAccessExpression(node)) {
    return node.getText();
  }
  return undefined;
}

/**
 * Check if node is a request interceptor
 */
function isRequestInterceptor(node: ts.Node): boolean {
  if (!ts.isCallExpression(node)) return false;
  
  const expr = node.expression;
  if (!ts.isPropertyAccessExpression(expr)) return false;
  
  // Check for apiClient.interceptors.request.use
  if (expr.name.text === 'use') {
    const parent = expr.expression;
    if (ts.isPropertyAccessExpression(parent) && parent.name.text === 'request') {
      const grandParent = parent.expression;
      if (ts.isPropertyAccessExpression(grandParent) && grandParent.name.text === 'interceptors') {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if node is a response interceptor
 */
function isResponseInterceptor(node: ts.Node): boolean {
  if (!ts.isCallExpression(node)) return false;
  
  const expr = node.expression;
  if (!ts.isPropertyAccessExpression(expr)) return false;
  
  // Check for apiClient.interceptors.response.use
  if (expr.name.text === 'use') {
    const parent = expr.expression;
    if (ts.isPropertyAccessExpression(parent) && parent.name.text === 'response') {
      const grandParent = parent.expression;
      if (ts.isPropertyAccessExpression(grandParent) && grandParent.name.text === 'interceptors') {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Extract request interceptor details
 */
function extractRequestInterceptor(node: ts.CallExpression, sourceCode: string): RequestInterceptor | null {
  const addsHeaders: string[] = [];
  let usesAsyncStorage = false;
  let logsRequests = false;

  // Get the first argument (success handler)
  if (node.arguments.length > 0) {
    const successHandler = node.arguments[0];
    
    // Check if it's an arrow function or function expression
    if (ts.isArrowFunction(successHandler) || ts.isFunctionExpression(successHandler)) {
      const body = successHandler.body;
      
      // Analyze the function body
      function visitInterceptorBody(bodyNode: ts.Node) {
        // Look for header assignments (config.headers['x-api-key'] = ...)
        if (ts.isBinaryExpression(bodyNode) && 
            bodyNode.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
          const left = bodyNode.left;
          if (ts.isElementAccessExpression(left)) {
            const headerName = extractHeaderName(left);
            if (headerName) {
              addsHeaders.push(headerName);
            }
          }
        }
        
        // Look for AsyncStorage usage
        if (ts.isCallExpression(bodyNode)) {
          const callExpr = bodyNode.expression;
          if (ts.isPropertyAccessExpression(callExpr)) {
            const objName = callExpr.expression.getText();
            if (objName === 'AsyncStorage') {
              usesAsyncStorage = true;
            }
          }
        }
        
        // Look for console.log
        if (ts.isCallExpression(bodyNode)) {
          const callExpr = bodyNode.expression;
          if (ts.isPropertyAccessExpression(callExpr) &&
              callExpr.expression.getText() === 'console' &&
              callExpr.name.text === 'log') {
            logsRequests = true;
          }
        }
        
        ts.forEachChild(bodyNode, visitInterceptorBody);
      }
      
      visitInterceptorBody(body);
    }
  }

  // Extract JSDoc comment
  const comment = extractCommentAbove(node, sourceCode);

  return {
    description: comment || 'Request interceptor',
    addsHeaders,
    usesAsyncStorage,
    logsRequests,
  };
}

/**
 * Extract response interceptor details
 */
function extractResponseInterceptor(node: ts.CallExpression, sourceCode: string): ResponseInterceptor | null {
  let logsResponses = false;
  let handlesErrors = false;

  // Get the first argument (success handler)
  if (node.arguments.length > 0) {
    const successHandler = node.arguments[0];
    
    if (ts.isArrowFunction(successHandler) || ts.isFunctionExpression(successHandler)) {
      const body = successHandler.body;
      
      function visitSuccessBody(bodyNode: ts.Node) {
        if (ts.isCallExpression(bodyNode)) {
          const callExpr = bodyNode.expression;
          if (ts.isPropertyAccessExpression(callExpr) &&
              callExpr.expression.getText() === 'console' &&
              callExpr.name.text === 'log') {
            logsResponses = true;
          }
        }
        
        ts.forEachChild(bodyNode, visitSuccessBody);
      }
      
      visitSuccessBody(body);
    }
  }

  // Get the second argument (error handler)
  if (node.arguments.length > 1) {
    handlesErrors = true;
  }

  // Extract JSDoc comment
  const comment = extractCommentAbove(node, sourceCode);

  return {
    description: comment || 'Response interceptor',
    logsResponses,
    handlesErrors,
  };
}

/**
 * Extract header name from element access expression
 */
function extractHeaderName(expr: ts.ElementAccessExpression): string | null {
  // Check if accessing config.headers['header-name']
  if (ts.isPropertyAccessExpression(expr.expression) &&
      expr.expression.name.text === 'headers') {
    if (ts.isStringLiteral(expr.argumentExpression)) {
      return expr.argumentExpression.text;
    }
  }
  return null;
}

/**
 * Extract error handlers from source code
 */
function extractErrorHandlers(sourceCode: string): ErrorHandler[] {
  const handlers: ErrorHandler[] = [];
  
  // Pattern to match error status code checks
  const statusPatterns = [
    { pattern: /status\s*===\s*(\d+)/g, type: 'exact' },
    { pattern: /status\s*>=\s*(\d+)/g, type: 'range' },
  ];

  for (const { pattern, type } of statusPatterns) {
    let match;
    while ((match = pattern.exec(sourceCode)) !== null) {
      const statusCode = parseInt(match[1], 10);
      
      // Extract the error handling block for this status code
      const handler = extractErrorHandlerForStatus(sourceCode, statusCode, match.index);
      if (handler) {
        handlers.push(handler);
      }
    }
  }

  return handlers;
}

/**
 * Extract error handler details for a specific status code
 */
function extractErrorHandlerForStatus(
  sourceCode: string,
  statusCode: number,
  matchIndex: number
): ErrorHandler | null {
  // Find the if block containing this status check
  const beforeMatch = sourceCode.substring(0, matchIndex);
  const afterMatch = sourceCode.substring(matchIndex);
  
  // Look for the error code and description in the block
  let errorCode = `HTTP_${statusCode}`;
  let description = '';
  let attemptsTokenRefresh = false;
  let clearsStorage = false;
  
  // Extract a reasonable chunk of code after the match (next 500 chars)
  const codeBlock = afterMatch.substring(0, 500);
  
  // Determine error code based on status
  if (statusCode === 401) {
    errorCode = 'UNAUTHORIZED';
    description = 'Authentication required';
    attemptsTokenRefresh = codeBlock.includes('refreshToken') || codeBlock.includes('REFRESH_TOKEN');
    clearsStorage = codeBlock.includes('removeItem');
  } else if (statusCode === 400) {
    errorCode = 'BAD_REQUEST';
    description = 'Invalid request';
  } else if (statusCode === 403) {
    errorCode = 'FORBIDDEN';
    description = 'Access forbidden';
  } else if (statusCode === 404) {
    errorCode = 'NOT_FOUND';
    description = 'Resource not found';
  } else if (statusCode >= 500) {
    errorCode = 'SERVER_ERROR';
    description = 'Server error';
  }
  
  return {
    statusCode,
    errorCode,
    description,
    attemptsTokenRefresh,
    clearsStorage,
    returnsFormattedError: true,
  };
}

/**
 * Extract comment above a node
 */
function extractCommentAbove(node: ts.Node, sourceCode: string): string | undefined {
  const fullText = sourceCode;
  const nodeStart = node.getFullStart();
  const nodeEnd = node.getStart();
  const leadingText = fullText.substring(nodeStart, nodeEnd);

  // Look for JSDoc comment (/** ... */)
  const jsDocMatch = leadingText.match(/\/\*\*\s*([\s\S]*?)\s*\*\//);
  if (jsDocMatch) {
    return jsDocMatch[1]
      .split('\n')
      .map(line => line.trim().replace(/^\*\s?/, ''))
      .join(' ')
      .trim();
  }

  // Look for single-line comment
  const singleLineMatch = leadingText.match(/\/\/\s*(.+)$/m);
  if (singleLineMatch) {
    return singleLineMatch[1].trim();
  }

  return undefined;
}

/**
 * Convert parsed client to ClientConfiguration format
 */
export function toClientConfiguration(parsed: ParsedClient): ClientConfiguration {
  const requestInterceptorInfos: InterceptorInfo[] = parsed.requestInterceptors.map(interceptor => ({
    type: 'request' as const,
    description: interceptor.description,
    handles: interceptor.addsHeaders,
  }));

  const responseInterceptorInfos: InterceptorInfo[] = parsed.responseInterceptors.map(interceptor => ({
    type: 'response' as const,
    description: interceptor.description,
    handles: interceptor.handlesErrors ? ['errors'] : [],
  }));

  const errorHandlerInfos: ErrorHandlerInfo[] = parsed.errorHandlers.map(handler => ({
    errorCode: handler.statusCode,
    handler: handler.errorCode,
    description: handler.description,
  }));

  return {
    baseURL: parsed.config.baseURL,
    interceptors: {
      request: requestInterceptorInfos,
      response: responseInterceptorInfos,
    },
    errorHandlers: errorHandlerInfos,
  };
}

/**
 * Find error handler for a specific status code
 */
export function findErrorHandler(
  handlers: ErrorHandler[],
  statusCode: number
): ErrorHandler | undefined {
  return handlers.find(handler => handler.statusCode === statusCode);
}

/**
 * Check if client has a specific header in request interceptor
 */
export function hasRequestHeader(
  interceptors: RequestInterceptor[],
  headerName: string
): boolean {
  return interceptors.some(interceptor =>
    interceptor.addsHeaders.some(h => h.toLowerCase() === headerName.toLowerCase())
  );
}

/**
 * Get all handled error status codes
 */
export function getHandledErrorCodes(handlers: ErrorHandler[]): number[] {
  return handlers.map(h => h.statusCode).sort((a, b) => a - b);
}
