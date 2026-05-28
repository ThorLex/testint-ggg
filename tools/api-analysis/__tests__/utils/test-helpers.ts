/**
 * Test helper utilities for API analysis tool
 * Feature: api-routes-complete-analysis
 */

import type {
  RouteDefinition,
  JsonStructure,
  InterfaceDefinition,
  HookDefinition,
  ParsedDocumentation,
  ParsedCodebase,
} from '../../types/core';

/**
 * Create a mock route definition for testing
 */
export function createMockRoute(overrides?: Partial<RouteDefinition>): RouteDefinition {
  return {
    endpoint: '/api/mobile/public/test',
    method: 'GET',
    description: 'Test route',
    isPublic: true,
    queryParams: [],
    pathParams: [],
    responseBody: {
      type: 'object',
      properties: {},
    },
    errorResponses: [],
    ...overrides,
  };
}

/**
 * Create a mock JSON structure for testing
 */
export function createMockJsonStructure(overrides?: Partial<JsonStructure>): JsonStructure {
  return {
    type: 'object',
    properties: {},
    ...overrides,
  };
}

/**
 * Create a mock interface definition for testing
 */
export function createMockInterface(overrides?: Partial<InterfaceDefinition>): InterfaceDefinition {
  return {
    name: 'TestInterface',
    properties: [],
    ...overrides,
  };
}

/**
 * Create a mock hook definition for testing
 */
export function createMockHook(overrides?: Partial<HookDefinition>): HookDefinition {
  return {
    name: 'useTestHook',
    type: 'query',
    endpoint: '/api/mobile/public/test',
    queryKey: ['test'],
    ...overrides,
  };
}

/**
 * Create a mock parsed documentation for testing
 */
export function createMockDocumentation(
  overrides?: Partial<ParsedDocumentation>
): ParsedDocumentation {
  return {
    publicRoutes: [],
    authenticatedRoutes: [],
    responseStructures: {},
    errorCodes: [],
    ...overrides,
  };
}

/**
 * Create a mock parsed codebase for testing
 */
export function createMockCodebase(overrides?: Partial<ParsedCodebase>): ParsedCodebase {
  return {
    routes: [],
    interfaces: [],
    hooks: [],
    client: {
      interceptors: {
        request: [],
        response: [],
      },
      errorHandlers: [],
    },
    ...overrides,
  };
}
