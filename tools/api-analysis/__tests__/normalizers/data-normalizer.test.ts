/**
 * Unit tests for Data Normalizer
 * Feature: api-routes-complete-analysis
 */

import {
  normalizeRoutePath,
  normalizeRoute,
  extractPathParameters,
  routePathsMatch,
  normalizeParameter,
  normalizeJsonStructure,
  normalizeProperty,
  normalizePropertyName,
  mapJsonTypeToTypeScript,
  mapTypeScriptToJsonType,
  typesAreCompatible,
  getArrayBaseType,
  isArrayType,
  isPrimitiveType,
  isComplexType,
  jsonStructuresEqual,
  propertiesEqual,
  findMissingProperties,
  findTypeMismatches,
} from '../../src/normalizers/data-normalizer';

import type {
  RouteDefinition,
  JsonStructure,
  PropertyDefinition,
  ParamDefinition,
} from '../../types/core';

describe('Data Normalizer', () => {
  describe('Route Path Normalization', () => {
    it('should remove trailing slashes', () => {
      expect(normalizeRoutePath('/api/users/')).toBe('/api/users');
      expect(normalizeRoutePath('/api/users/list/')).toBe('/api/users/list');
    });

    it('should keep root path with slash', () => {
      expect(normalizeRoutePath('/')).toBe('/');
    });

    it('should normalize parameter format from {id} to :id', () => {
      expect(normalizeRoutePath('/api/users/{id}')).toBe('/api/users/:id');
      expect(normalizeRoutePath('/api/users/{userId}/posts/{postId}')).toBe(
        '/api/users/:userId/posts/:postId'
      );
    });

    it('should ensure path starts with /', () => {
      expect(normalizeRoutePath('api/users')).toBe('/api/users');
      expect(normalizeRoutePath('users')).toBe('/users');
    });

    it('should handle already normalized paths', () => {
      expect(normalizeRoutePath('/api/users/:id')).toBe('/api/users/:id');
    });
  });

  describe('Extract Path Parameters', () => {
    it('should extract single parameter', () => {
      expect(extractPathParameters('/api/users/:id')).toEqual(['id']);
    });

    it('should extract multiple parameters', () => {
      expect(extractPathParameters('/api/users/:userId/posts/:postId')).toEqual([
        'userId',
        'postId',
      ]);
    });

    it('should return empty array for no parameters', () => {
      expect(extractPathParameters('/api/users')).toEqual([]);
    });

    it('should handle parameters with underscores', () => {
      expect(extractPathParameters('/api/users/:user_id')).toEqual(['user_id']);
    });
  });

  describe('Route Paths Match', () => {
    it('should match identical paths', () => {
      expect(routePathsMatch('/api/users/:id', '/api/users/:id')).toBe(true);
    });

    it('should match paths with different parameter names', () => {
      expect(routePathsMatch('/api/users/:id', '/api/users/:userId')).toBe(true);
      expect(routePathsMatch('/api/users/:userId/posts/:postId', '/api/users/:id/posts/:pid')).toBe(
        true
      );
    });

    it('should not match paths with different segments', () => {
      expect(routePathsMatch('/api/users/:id', '/api/posts/:id')).toBe(false);
    });

    it('should not match paths with different segment counts', () => {
      expect(routePathsMatch('/api/users/:id', '/api/users/:id/posts')).toBe(false);
    });

    it('should handle trailing slashes', () => {
      expect(routePathsMatch('/api/users/:id/', '/api/users/:id')).toBe(true);
    });
  });

  describe('Normalize Route', () => {
    it('should normalize complete route definition', () => {
      const route: RouteDefinition = {
        endpoint: '/api/users/{id}/',
        method: 'GET',
        description: 'Get user',
        isPublic: true,
        queryParams: [
          {
            name: 'include_posts',
            type: 'boolean',
            required: false,
          },
        ],
        pathParams: [
          {
            name: 'id',
            type: 'string',
            required: true,
          },
        ],
        responseBody: {
          type: 'object',
          properties: {
            user_name: {
              type: 'string',
              optional: false,
            },
          },
        },
        errorResponses: [],
      };

      const normalized = normalizeRoute(route);

      expect(normalized.endpoint).toBe('/api/users/:id');
      expect(normalized.queryParams?.[0].name).toBe('includePosts');
      expect(normalized.responseBody.properties?.userName).toBeDefined();
    });
  });

  describe('Parameter Normalization', () => {
    it('should normalize parameter name to camelCase', () => {
      const param: ParamDefinition = {
        name: 'user_id',
        type: 'string',
        required: true,
      };

      const normalized = normalizeParameter(param);
      expect(normalized.name).toBe('userId');
    });

    it('should normalize parameter type', () => {
      expect(normalizeParameter({ name: 'count', type: 'number', required: true }).type).toBe(
        'number'
      );
      expect(normalizeParameter({ name: 'active', type: 'boolean', required: true }).type).toBe(
        'boolean'
      );
    });
  });

  describe('Property Name Normalization', () => {
    it('should convert snake_case to camelCase', () => {
      expect(normalizePropertyName('user_name')).toBe('userName');
      expect(normalizePropertyName('first_name_last_name')).toBe('firstNameLastName');
    });

    it('should convert kebab-case to camelCase', () => {
      expect(normalizePropertyName('user-name')).toBe('userName');
      expect(normalizePropertyName('first-name')).toBe('firstName');
    });

    it('should keep camelCase as-is', () => {
      expect(normalizePropertyName('userName')).toBe('userName');
      expect(normalizePropertyName('firstName')).toBe('firstName');
    });

    it('should keep PascalCase as-is for interface names', () => {
      expect(normalizePropertyName('UserName')).toBe('UserName');
    });
  });

  describe('JSON Structure Normalization', () => {
    it('should normalize object structure', () => {
      const structure: JsonStructure = {
        type: 'object',
        properties: {
          user_name: {
            type: 'string',
            optional: false,
          },
          user_age: {
            type: 'integer',
            optional: true,
          },
        },
      };

      const normalized = normalizeJsonStructure(structure);

      expect(normalized.properties?.userName).toBeDefined();
      expect(normalized.properties?.userName.type).toBe('string');
      expect(normalized.properties?.userAge).toBeDefined();
      expect(normalized.properties?.userAge.type).toBe('number');
    });

    it('should normalize array structure', () => {
      const structure: JsonStructure = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            item_name: {
              type: 'string',
              optional: false,
            },
          },
        },
      };

      const normalized = normalizeJsonStructure(structure);

      expect(normalized.type).toBe('array');
      expect(normalized.items?.properties?.itemName).toBeDefined();
    });

    it('should handle nested structures', () => {
      const structure: JsonStructure = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            optional: false,
            nested: {
              type: 'object',
              properties: {
                user_name: {
                  type: 'string',
                  optional: false,
                },
              },
            },
          },
        },
      };

      const normalized = normalizeJsonStructure(structure);

      expect(normalized.properties?.user.nested?.properties?.userName).toBeDefined();
    });
  });

  describe('Type Mapping', () => {
    describe('JSON to TypeScript', () => {
      it('should map primitive types', () => {
        expect(mapJsonTypeToTypeScript('string')).toBe('string');
        expect(mapJsonTypeToTypeScript('number')).toBe('number');
        expect(mapJsonTypeToTypeScript('boolean')).toBe('boolean');
      });

      it('should map integer types to number', () => {
        expect(mapJsonTypeToTypeScript('integer')).toBe('number');
        expect(mapJsonTypeToTypeScript('int')).toBe('number');
        expect(mapJsonTypeToTypeScript('float')).toBe('number');
        expect(mapJsonTypeToTypeScript('double')).toBe('number');
      });

      it('should map boolean variations', () => {
        expect(mapJsonTypeToTypeScript('bool')).toBe('boolean');
        expect(mapJsonTypeToTypeScript('boolean')).toBe('boolean');
      });

      it('should handle array types', () => {
        expect(mapJsonTypeToTypeScript('string[]')).toBe('string[]');
        expect(mapJsonTypeToTypeScript('number[]')).toBe('number[]');
        expect(mapJsonTypeToTypeScript('User[]')).toBe('User[]');
      });

      it('should preserve complex type names', () => {
        expect(mapJsonTypeToTypeScript('User')).toBe('User');
        expect(mapJsonTypeToTypeScript('UserProfile')).toBe('UserProfile');
      });
    });

    describe('TypeScript to JSON', () => {
      it('should map TypeScript types to JSON types', () => {
        expect(mapTypeScriptToJsonType('string')).toBe('string');
        expect(mapTypeScriptToJsonType('number')).toBe('number');
        expect(mapTypeScriptToJsonType('boolean')).toBe('boolean');
      });

      it('should map array types', () => {
        expect(mapTypeScriptToJsonType('string[]')).toBe('array');
        expect(mapTypeScriptToJsonType('User[]')).toBe('array');
      });

      it('should map complex types to object', () => {
        expect(mapTypeScriptToJsonType('User')).toBe('object');
        expect(mapTypeScriptToJsonType('UserProfile')).toBe('object');
      });
    });

    describe('Type Compatibility', () => {
      it('should match identical types', () => {
        expect(typesAreCompatible('string', 'string')).toBe(true);
        expect(typesAreCompatible('number', 'number')).toBe(true);
      });

      it('should match number variations', () => {
        expect(typesAreCompatible('number', 'integer')).toBe(true);
        expect(typesAreCompatible('int', 'float')).toBe(true);
        expect(typesAreCompatible('double', 'number')).toBe(true);
      });

      it('should match boolean variations', () => {
        expect(typesAreCompatible('boolean', 'bool')).toBe(true);
        expect(typesAreCompatible('bool', 'boolean')).toBe(true);
      });

      it('should match array types', () => {
        expect(typesAreCompatible('string[]', 'string[]')).toBe(true);
        expect(typesAreCompatible('number[]', 'integer[]')).toBe(true);
      });

      it('should not match incompatible types', () => {
        expect(typesAreCompatible('string', 'number')).toBe(false);
        expect(typesAreCompatible('boolean', 'string')).toBe(false);
        expect(typesAreCompatible('string[]', 'number[]')).toBe(false);
      });
    });
  });

  describe('Type Utilities', () => {
    describe('getArrayBaseType', () => {
      it('should extract base type from array', () => {
        expect(getArrayBaseType('string[]')).toBe('string');
        expect(getArrayBaseType('User[]')).toBe('User');
      });

      it('should return null for non-array types', () => {
        expect(getArrayBaseType('string')).toBeNull();
        expect(getArrayBaseType('User')).toBeNull();
      });
    });

    describe('isArrayType', () => {
      it('should identify array types', () => {
        expect(isArrayType('string[]')).toBe(true);
        expect(isArrayType('User[]')).toBe(true);
      });

      it('should identify non-array types', () => {
        expect(isArrayType('string')).toBe(false);
        expect(isArrayType('User')).toBe(false);
      });
    });

    describe('isPrimitiveType', () => {
      it('should identify primitive types', () => {
        expect(isPrimitiveType('string')).toBe(true);
        expect(isPrimitiveType('number')).toBe(true);
        expect(isPrimitiveType('boolean')).toBe(true);
        expect(isPrimitiveType('null')).toBe(true);
        expect(isPrimitiveType('any')).toBe(true);
      });

      it('should identify non-primitive types', () => {
        expect(isPrimitiveType('User')).toBe(false);
        expect(isPrimitiveType('UserProfile')).toBe(false);
      });
    });

    describe('isComplexType', () => {
      it('should identify complex types', () => {
        expect(isComplexType('User')).toBe(true);
        expect(isComplexType('UserProfile')).toBe(true);
        expect(isComplexType('User[]')).toBe(true);
      });

      it('should identify non-complex types', () => {
        expect(isComplexType('string')).toBe(false);
        expect(isComplexType('number')).toBe(false);
        expect(isComplexType('boolean')).toBe(false);
      });
    });
  });

  describe('Structure Comparison', () => {
    describe('jsonStructuresEqual', () => {
      it('should match identical structures', () => {
        const struct1: JsonStructure = {
          type: 'object',
          properties: {
            name: { type: 'string', optional: false },
            age: { type: 'number', optional: true },
          },
        };

        const struct2: JsonStructure = {
          type: 'object',
          properties: {
            name: { type: 'string', optional: false },
            age: { type: 'number', optional: true },
          },
        };

        expect(jsonStructuresEqual(struct1, struct2)).toBe(true);
      });

      it('should not match structures with different properties', () => {
        const struct1: JsonStructure = {
          type: 'object',
          properties: {
            name: { type: 'string', optional: false },
          },
        };

        const struct2: JsonStructure = {
          type: 'object',
          properties: {
            name: { type: 'string', optional: false },
            age: { type: 'number', optional: true },
          },
        };

        expect(jsonStructuresEqual(struct1, struct2)).toBe(false);
      });

      it('should match array structures', () => {
        const struct1: JsonStructure = {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', optional: false },
            },
          },
        };

        const struct2: JsonStructure = {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', optional: false },
            },
          },
        };

        expect(jsonStructuresEqual(struct1, struct2)).toBe(true);
      });
    });

    describe('propertiesEqual', () => {
      it('should match identical properties', () => {
        const prop1: PropertyDefinition = {
          type: 'string',
          optional: false,
        };

        const prop2: PropertyDefinition = {
          type: 'string',
          optional: false,
        };

        expect(propertiesEqual(prop1, prop2)).toBe(true);
      });

      it('should not match properties with different optionality', () => {
        const prop1: PropertyDefinition = {
          type: 'string',
          optional: false,
        };

        const prop2: PropertyDefinition = {
          type: 'string',
          optional: true,
        };

        expect(propertiesEqual(prop1, prop2)).toBe(false);
      });

      it('should match properties with compatible types', () => {
        const prop1: PropertyDefinition = {
          type: 'number',
          optional: false,
        };

        const prop2: PropertyDefinition = {
          type: 'integer',
          optional: false,
        };

        expect(propertiesEqual(prop1, prop2)).toBe(true);
      });
    });

    describe('findMissingProperties', () => {
      it('should find missing properties', () => {
        const expected: JsonStructure = {
          type: 'object',
          properties: {
            name: { type: 'string', optional: false },
            age: { type: 'number', optional: false },
            email: { type: 'string', optional: true },
          },
        };

        const actual: JsonStructure = {
          type: 'object',
          properties: {
            name: { type: 'string', optional: false },
          },
        };

        const missing = findMissingProperties(expected, actual);
        expect(missing).toContain('age');
        expect(missing).toContain('email');
        expect(missing).not.toContain('name');
      });

      it('should return empty array when no properties missing', () => {
        const expected: JsonStructure = {
          type: 'object',
          properties: {
            name: { type: 'string', optional: false },
          },
        };

        const actual: JsonStructure = {
          type: 'object',
          properties: {
            name: { type: 'string', optional: false },
            age: { type: 'number', optional: false },
          },
        };

        const missing = findMissingProperties(expected, actual);
        expect(missing).toEqual([]);
      });
    });

    describe('findTypeMismatches', () => {
      it('should find type mismatches', () => {
        const expected: JsonStructure = {
          type: 'object',
          properties: {
            name: { type: 'string', optional: false },
            age: { type: 'number', optional: false },
          },
        };

        const actual: JsonStructure = {
          type: 'object',
          properties: {
            name: { type: 'string', optional: false },
            age: { type: 'string', optional: false },
          },
        };

        const mismatches = findTypeMismatches(expected, actual);
        expect(mismatches).toHaveLength(1);
        expect(mismatches[0].property).toBe('age');
        expect(mismatches[0].expectedType).toBe('number');
        expect(mismatches[0].actualType).toBe('string');
      });

      it('should not report compatible types as mismatches', () => {
        const expected: JsonStructure = {
          type: 'object',
          properties: {
            age: { type: 'number', optional: false },
          },
        };

        const actual: JsonStructure = {
          type: 'object',
          properties: {
            age: { type: 'integer', optional: false },
          },
        };

        const mismatches = findTypeMismatches(expected, actual);
        expect(mismatches).toHaveLength(0);
      });
    });
  });
});
