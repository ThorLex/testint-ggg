/**
 * Data Normalizer for Parsed Documentation
 * Feature: api-routes-complete-analysis
 * 
 * Normalizes parsed documentation data into consistent structures:
 * - Normalizes route paths (trailing slashes, parameter formats)
 * - Maps JSON types to TypeScript types
 * - Normalizes property names and types
 * - Creates utility functions for type comparison
 */

import {
  RouteDefinition,
  JsonStructure,
  PropertyDefinition,
  ParamDefinition,
} from '../../types/core';

// ============================================================================
// Route Normalization
// ============================================================================

/**
 * Normalize a route endpoint path
 * - Removes trailing slashes
 * - Normalizes parameter format (:id vs {id})
 * - Ensures consistent casing
 */
export function normalizeRoutePath(path: string): string {
  let normalized = path.trim();
  
  // Remove trailing slash (except for root)
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  // Normalize parameter format to :paramName
  normalized = normalized.replace(/\{([^}]+)\}/g, ':$1');
  
  // Ensure path starts with /
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }
  
  return normalized;
}

/**
 * Normalize a complete route definition
 */
export function normalizeRoute(route: RouteDefinition): RouteDefinition {
  return {
    ...route,
    endpoint: normalizeRoutePath(route.endpoint),
    queryParams: route.queryParams?.map(normalizeParameter),
    pathParams: route.pathParams?.map(normalizeParameter),
    responseBody: normalizeJsonStructure(route.responseBody),
    requestBody: route.requestBody ? normalizeJsonStructure(route.requestBody) : undefined,
  };
}

/**
 * Extract path parameters from a route endpoint
 * Example: /api/users/:id/posts/:postId => ['id', 'postId']
 */
export function extractPathParameters(endpoint: string): string[] {
  const matches = endpoint.match(/:([a-zA-Z0-9_]+)/g);
  if (!matches) return [];
  
  return matches.map(match => match.substring(1));
}

/**
 * Check if two route paths match (ignoring parameter names)
 * Example: /api/users/:id matches /api/users/:userId
 */
export function routePathsMatch(path1: string, path2: string): boolean {
  const normalized1 = normalizeRoutePath(path1);
  const normalized2 = normalizeRoutePath(path2);
  
  // Split into segments
  const segments1 = normalized1.split('/');
  const segments2 = normalized2.split('/');
  
  // Must have same number of segments
  if (segments1.length !== segments2.length) {
    return false;
  }
  
  // Compare each segment
  for (let i = 0; i < segments1.length; i++) {
    const seg1 = segments1[i];
    const seg2 = segments2[i];
    
    // If both are parameters, they match
    if (seg1.startsWith(':') && seg2.startsWith(':')) {
      continue;
    }
    
    // Otherwise, must be exact match
    if (seg1 !== seg2) {
      return false;
    }
  }
  
  return true;
}

// ============================================================================
// Parameter Normalization
// ============================================================================

/**
 * Normalize a parameter definition
 */
export function normalizeParameter(param: ParamDefinition): ParamDefinition {
  return {
    ...param,
    name: normalizePropertyName(param.name),
    type: normalizeParameterType(param.type),
  };
}

/**
 * Normalize parameter type
 */
function normalizeParameterType(type: string): 'string' | 'number' | 'boolean' {
  const normalized = type.toLowerCase().trim();
  
  if (normalized === 'number' || normalized === 'int' || normalized === 'integer' || normalized === 'float') {
    return 'number';
  }
  
  if (normalized === 'boolean' || normalized === 'bool') {
    return 'boolean';
  }
  
  return 'string';
}

// ============================================================================
// JSON Structure Normalization
// ============================================================================

/**
 * Normalize a JSON structure
 * - Normalizes property names
 * - Maps JSON types to TypeScript types
 * - Handles nested structures
 */
export function normalizeJsonStructure(structure: JsonStructure): JsonStructure {
  if (structure.type === 'array') {
    return {
      type: 'array',
      items: structure.items ? normalizeJsonStructure(structure.items) : undefined,
    };
  }
  
  if (structure.type === 'object' && structure.properties) {
    const normalizedProperties: Record<string, PropertyDefinition> = {};
    
    for (const [key, prop] of Object.entries(structure.properties)) {
      const normalizedKey = normalizePropertyName(key);
      normalizedProperties[normalizedKey] = normalizeProperty(prop);
    }
    
    return {
      type: 'object',
      properties: normalizedProperties,
    };
  }
  
  return {
    type: structure.type,
  };
}

/**
 * Normalize a property definition
 */
export function normalizeProperty(property: PropertyDefinition): PropertyDefinition {
  return {
    ...property,
    type: mapJsonTypeToTypeScript(property.type),
    nested: property.nested ? normalizeJsonStructure(property.nested) : undefined,
  };
}

/**
 * Normalize a property name
 * - Converts to camelCase
 * - Removes special characters
 */
export function normalizePropertyName(name: string): string {
  // Already in camelCase or PascalCase, return as-is
  if (/^[a-z][a-zA-Z0-9]*$/.test(name) || /^[A-Z][a-zA-Z0-9]*$/.test(name)) {
    return name;
  }
  
  // Convert snake_case or kebab-case to camelCase
  return name
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^[A-Z]/, char => char.toLowerCase());
}

// ============================================================================
// Type Mapping
// ============================================================================

/**
 * Map JSON type to TypeScript type
 * Handles both primitive types and complex types
 */
export function mapJsonTypeToTypeScript(jsonType: string): string {
  const normalized = jsonType.trim();
  
  // Handle array types
  if (normalized.endsWith('[]')) {
    const baseType = normalized.slice(0, -2);
    return `${mapJsonTypeToTypeScript(baseType)}[]`;
  }
  
  // Handle primitive types
  const primitiveMap: Record<string, string> = {
    'string': 'string',
    'number': 'number',
    'integer': 'number',
    'int': 'number',
    'float': 'number',
    'double': 'number',
    'boolean': 'boolean',
    'bool': 'boolean',
    'null': 'null',
    'any': 'any',
    'object': 'object',
    'array': 'any[]',
  };
  
  const lowerType = normalized.toLowerCase();
  if (primitiveMap[lowerType]) {
    return primitiveMap[lowerType];
  }
  
  // Handle known complex types (keep as-is, assuming they're interface names)
  if (/^[A-Z][a-zA-Z0-9]*$/.test(normalized)) {
    return normalized;
  }
  
  // Default to the original type
  return normalized;
}

/**
 * Map TypeScript type back to JSON type (for reverse mapping)
 */
export function mapTypeScriptToJsonType(tsType: string): string {
  const normalized = tsType.trim();
  
  // Handle array types
  if (normalized.endsWith('[]')) {
    return 'array';
  }
  
  // Handle primitive types
  const primitiveMap: Record<string, string> = {
    'string': 'string',
    'number': 'number',
    'boolean': 'boolean',
    'null': 'null',
    'any': 'any',
    'object': 'object',
  };
  
  const lowerType = normalized.toLowerCase();
  if (primitiveMap[lowerType]) {
    return primitiveMap[lowerType];
  }
  
  // Complex types are objects
  return 'object';
}

/**
 * Check if two types are compatible
 * Handles type aliases and common variations
 */
export function typesAreCompatible(type1: string, type2: string): boolean {
  const normalized1 = mapJsonTypeToTypeScript(type1);
  const normalized2 = mapJsonTypeToTypeScript(type2);
  
  // Exact match
  if (normalized1 === normalized2) {
    return true;
  }
  
  // Handle number variations
  const numberTypes = ['number', 'integer', 'int', 'float', 'double'];
  if (numberTypes.includes(normalized1.toLowerCase()) && 
      numberTypes.includes(normalized2.toLowerCase())) {
    return true;
  }
  
  // Handle boolean variations
  const booleanTypes = ['boolean', 'bool'];
  if (booleanTypes.includes(normalized1.toLowerCase()) && 
      booleanTypes.includes(normalized2.toLowerCase())) {
    return true;
  }
  
  // Handle array types
  if (normalized1.endsWith('[]') && normalized2.endsWith('[]')) {
    const base1 = normalized1.slice(0, -2);
    const base2 = normalized2.slice(0, -2);
    return typesAreCompatible(base1, base2);
  }
  
  return false;
}

/**
 * Get the base type from an array type
 * Example: "string[]" => "string"
 */
export function getArrayBaseType(arrayType: string): string | null {
  if (!arrayType.endsWith('[]')) {
    return null;
  }
  
  return arrayType.slice(0, -2);
}

/**
 * Check if a type is an array type
 */
export function isArrayType(type: string): boolean {
  return type.endsWith('[]');
}

/**
 * Check if a type is a primitive type
 */
export function isPrimitiveType(type: string): boolean {
  const primitives = ['string', 'number', 'boolean', 'null', 'any'];
  return primitives.includes(type.toLowerCase());
}

/**
 * Check if a type is a complex/interface type
 */
export function isComplexType(type: string): boolean {
  // Remove array suffix if present
  const baseType = type.endsWith('[]') ? type.slice(0, -2) : type;
  
  // Complex types start with uppercase and are not primitives
  return /^[A-Z][a-zA-Z0-9]*$/.test(baseType) && !isPrimitiveType(baseType);
}

// ============================================================================
// Comparison Utilities
// ============================================================================

/**
 * Compare two JSON structures for equality
 */
export function jsonStructuresEqual(struct1: JsonStructure, struct2: JsonStructure): boolean {
  // Check types
  if (struct1.type !== struct2.type) {
    return false;
  }
  
  // For arrays, compare items
  if (struct1.type === 'array') {
    if (!struct1.items && !struct2.items) return true;
    if (!struct1.items || !struct2.items) return false;
    return jsonStructuresEqual(struct1.items, struct2.items);
  }
  
  // For objects, compare properties
  if (struct1.type === 'object') {
    const props1 = struct1.properties || {};
    const props2 = struct2.properties || {};
    
    const keys1 = Object.keys(props1).sort();
    const keys2 = Object.keys(props2).sort();
    
    // Check same number of properties
    if (keys1.length !== keys2.length) {
      return false;
    }
    
    // Check all keys match
    if (keys1.join(',') !== keys2.join(',')) {
      return false;
    }
    
    // Check each property
    for (const key of keys1) {
      if (!propertiesEqual(props1[key], props2[key])) {
        return false;
      }
    }
    
    return true;
  }
  
  // For primitives, types already match
  return true;
}

/**
 * Compare two properties for equality
 */
export function propertiesEqual(prop1: PropertyDefinition, prop2: PropertyDefinition): boolean {
  // Check types are compatible
  if (!typesAreCompatible(prop1.type, prop2.type)) {
    return false;
  }
  
  // Check optionality
  if (prop1.optional !== prop2.optional) {
    return false;
  }
  
  // Check nested structures if present
  if (prop1.nested && prop2.nested) {
    return jsonStructuresEqual(prop1.nested, prop2.nested);
  }
  
  if (prop1.nested || prop2.nested) {
    return false; // One has nested, other doesn't
  }
  
  return true;
}

/**
 * Find missing properties between two structures
 */
export function findMissingProperties(
  expected: JsonStructure,
  actual: JsonStructure
): string[] {
  if (expected.type !== 'object' || actual.type !== 'object') {
    return [];
  }
  
  const expectedProps = expected.properties || {};
  const actualProps = actual.properties || {};
  
  const missing: string[] = [];
  
  for (const key of Object.keys(expectedProps)) {
    if (!actualProps[key]) {
      missing.push(key);
    }
  }
  
  return missing;
}

/**
 * Find properties with type mismatches
 */
export function findTypeMismatches(
  expected: JsonStructure,
  actual: JsonStructure
): Array<{ property: string; expectedType: string; actualType: string }> {
  if (expected.type !== 'object' || actual.type !== 'object') {
    return [];
  }
  
  const expectedProps = expected.properties || {};
  const actualProps = actual.properties || {};
  
  const mismatches: Array<{ property: string; expectedType: string; actualType: string }> = [];
  
  for (const key of Object.keys(expectedProps)) {
    const expectedProp = expectedProps[key];
    const actualProp = actualProps[key];
    
    if (actualProp && !typesAreCompatible(expectedProp.type, actualProp.type)) {
      mismatches.push({
        property: key,
        expectedType: expectedProp.type,
        actualType: actualProp.type,
      });
    }
  }
  
  return mismatches;
}
