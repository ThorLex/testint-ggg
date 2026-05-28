/**
 * Unit tests for Type Analyzer
 * Feature: api-routes-complete-analysis
 */

import { analyzeTypes, generateTypeIssueReport } from '../../src/analyzers/type-analyzer';
import {
  ParsedDocumentation,
  InterfaceDefinition,
  JsonStructure,
  PropertyDefinition,
} from '../../types/core';

describe('Type Analyzer', () => {
  describe('analyzeTypes', () => {
    it('should detect missing interfaces', () => {
      const documentation: ParsedDocumentation = {
        publicRoutes: [],
        authenticatedRoutes: [],
        responseStructures: {
          'UserProfile': {
            type: 'object',
            properties: {
              'id': { type: 'string', optional: false },
              'name': { type: 'string', optional: false },
            },
          },
        },
        errorCodes: [],
      };

      const interfaces: InterfaceDefinition[] = [];

      const result = analyzeTypes(documentation, interfaces);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('MISSING_INTERFACE');
      expect(result.issues[0].interface).toBe('UserProfile');
      expect(result.statistics.missingInterfaces).toBe(1);
    });

    it('should detect missing properties', () => {
      const documentation: ParsedDocumentation = {
        publicRoutes: [],
        authenticatedRoutes: [],
        responseStructures: {
          'UserProfile': {
            type: 'object',
            properties: {
              'id': { type: 'string', optional: false },
              'name': { type: 'string', optional: false },
              'email': { type: 'string', optional: false },
            },
          },
        },
        errorCodes: [],
      };

      const interfaces: InterfaceDefinition[] = [
        {
          name: 'UserProfile',
          properties: [
            { name: 'id', type: 'string', optional: false },
            { name: 'name', type: 'string', optional: false },
            // Missing 'email' property
          ],
        },
      ];

      const result = analyzeTypes(documentation, interfaces);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('MISSING_PROPERTY');
      expect(result.issues[0].interface).toBe('UserProfile');
      expect(result.issues[0].property).toBe('email');
      expect(result.statistics.missingProperties).toBe(1);
    });

    it('should detect type mismatches', () => {
      const documentation: ParsedDocumentation = {
        publicRoutes: [],
        authenticatedRoutes: [],
        responseStructures: {
          'UserProfile': {
            type: 'object',
            properties: {
              'id': { type: 'string', optional: false },
              'age': { type: 'number', optional: false },
            },
          },
        },
        errorCodes: [],
      };

      const interfaces: InterfaceDefinition[] = [
        {
          name: 'UserProfile',
          properties: [
            { name: 'id', type: 'string', optional: false },
            { name: 'age', type: 'string', optional: false }, // Wrong type
          ],
        },
      ];

      const result = analyzeTypes(documentation, interfaces);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('TYPE_MISMATCH');
      expect(result.issues[0].interface).toBe('UserProfile');
      expect(result.issues[0].property).toBe('age');
      expect(result.issues[0].expected).toBe('number');
      expect(result.issues[0].actual).toBe('string');
      expect(result.statistics.typeMismatches).toBe(1);
    });

    it('should detect optionality mismatches', () => {
      const documentation: ParsedDocumentation = {
        publicRoutes: [],
        authenticatedRoutes: [],
        responseStructures: {
          'UserProfile': {
            type: 'object',
            properties: {
              'id': { type: 'string', optional: false },
              'nickname': { type: 'string', optional: true },
            },
          },
        },
        errorCodes: [],
      };

      const interfaces: InterfaceDefinition[] = [
        {
          name: 'UserProfile',
          properties: [
            { name: 'id', type: 'string', optional: false },
            { name: 'nickname', type: 'string', optional: false }, // Should be optional
          ],
        },
      ];

      const result = analyzeTypes(documentation, interfaces);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('OPTIONALITY_MISMATCH');
      expect(result.issues[0].interface).toBe('UserProfile');
      expect(result.issues[0].property).toBe('nickname');
      expect(result.issues[0].expected).toBe(true);
      expect(result.issues[0].actual).toBe(false);
      expect(result.statistics.optionalityMismatches).toBe(1);
    });

    it('should handle nested structures', () => {
      const documentation: ParsedDocumentation = {
        publicRoutes: [],
        authenticatedRoutes: [],
        responseStructures: {
          'UserProfile': {
            type: 'object',
            properties: {
              'id': { type: 'string', optional: false },
              'address': {
                type: 'Address',
                optional: false,
                nested: {
                  type: 'object',
                  properties: {
                    'street': { type: 'string', optional: false },
                    'city': { type: 'string', optional: false },
                    'zipCode': { type: 'string', optional: false },
                  },
                },
              },
            },
          },
        },
        errorCodes: [],
      };

      const interfaces: InterfaceDefinition[] = [
        {
          name: 'UserProfile',
          properties: [
            { name: 'id', type: 'string', optional: false },
            { name: 'address', type: 'Address', optional: false },
          ],
        },
        {
          name: 'Address',
          properties: [
            { name: 'street', type: 'string', optional: false },
            { name: 'city', type: 'string', optional: false },
            // Missing 'zipCode' property
          ],
        },
      ];

      const result = analyzeTypes(documentation, interfaces);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('MISSING_PROPERTY');
      expect(result.issues[0].interface).toBe('Address');
      expect(result.issues[0].property).toBe('zipCode');
    });

    it('should handle array types correctly', () => {
      const documentation: ParsedDocumentation = {
        publicRoutes: [],
        authenticatedRoutes: [],
        responseStructures: {
          'UserList': {
            type: 'object',
            properties: {
              'users': { type: 'User[]', optional: false },
            },
          },
        },
        errorCodes: [],
      };

      const interfaces: InterfaceDefinition[] = [
        {
          name: 'UserList',
          properties: [
            { name: 'users', type: 'User[]', optional: false },
          ],
        },
      ];

      const result = analyzeTypes(documentation, interfaces);

      expect(result.issues).toHaveLength(0);
    });

    it('should handle Array<T> vs T[] equivalence', () => {
      const documentation: ParsedDocumentation = {
        publicRoutes: [],
        authenticatedRoutes: [],
        responseStructures: {
          'UserList': {
            type: 'object',
            properties: {
              'users': { type: 'User[]', optional: false },
            },
          },
        },
        errorCodes: [],
      };

      const interfaces: InterfaceDefinition[] = [
        {
          name: 'UserList',
          properties: [
            { name: 'users', type: 'Array<User>', optional: false },
          ],
        },
      ];

      const result = analyzeTypes(documentation, interfaces);

      expect(result.issues).toHaveLength(0);
    });

    it('should handle union types', () => {
      const documentation: ParsedDocumentation = {
        publicRoutes: [],
        authenticatedRoutes: [],
        responseStructures: {
          'UserProfile': {
            type: 'object',
            properties: {
              'id': { type: 'string', optional: false },
            },
          },
        },
        errorCodes: [],
      };

      const interfaces: InterfaceDefinition[] = [
        {
          name: 'UserProfile',
          properties: [
            { name: 'id', type: 'string | null', optional: false },
          ],
        },
      ];

      const result = analyzeTypes(documentation, interfaces);

      // Should not report type mismatch because string is part of the union
      expect(result.issues).toHaveLength(0);
    });

    it('should handle number vs integer equivalence', () => {
      const documentation: ParsedDocumentation = {
        publicRoutes: [],
        authenticatedRoutes: [],
        responseStructures: {
          'UserProfile': {
            type: 'object',
            properties: {
              'age': { type: 'integer', optional: false },
            },
          },
        },
        errorCodes: [],
      };

      const interfaces: InterfaceDefinition[] = [
        {
          name: 'UserProfile',
          properties: [
            { name: 'age', type: 'number', optional: false },
          ],
        },
      ];

      const result = analyzeTypes(documentation, interfaces);

      // Should not report type mismatch
      expect(result.issues).toHaveLength(0);
    });

    it('should prioritize issues correctly', () => {
      const documentation: ParsedDocumentation = {
        publicRoutes: [],
        authenticatedRoutes: [],
        responseStructures: {
          'ProfileResponse': { type: 'object', properties: {} },
          'MediaDetail': { type: 'object', properties: {} },
          'ListResponse': { type: 'object', properties: {} },
          'OtherStruct': { type: 'object', properties: {} },
        },
        errorCodes: [],
      };

      const interfaces: InterfaceDefinition[] = [];

      const result = analyzeTypes(documentation, interfaces);

      expect(result.issues).toHaveLength(4);
      
      const profileIssue = result.issues.find(i => i.interface === 'ProfileResponse');
      expect(profileIssue?.priority).toBe('CRITICAL');

      const mediaIssue = result.issues.find(i => i.interface === 'MediaDetail');
      expect(mediaIssue?.priority).toBe('HIGH');

      const listIssue = result.issues.find(i => i.interface === 'ListResponse');
      expect(listIssue?.priority).toBe('MEDIUM');

      const otherIssue = result.issues.find(i => i.interface === 'OtherStruct');
      expect(otherIssue?.priority).toBe('LOW');
    });

    it('should handle empty documentation', () => {
      const documentation: ParsedDocumentation = {
        publicRoutes: [],
        authenticatedRoutes: [],
        responseStructures: {},
        errorCodes: [],
      };

      const interfaces: InterfaceDefinition[] = [
        {
          name: 'UserProfile',
          properties: [
            { name: 'id', type: 'string', optional: false },
          ],
        },
      ];

      const result = analyzeTypes(documentation, interfaces);

      expect(result.issues).toHaveLength(0);
      expect(result.statistics.totalDocumentedStructures).toBe(0);
      expect(result.statistics.totalImplementedInterfaces).toBe(1);
    });

    it('should handle empty interfaces', () => {
      const documentation: ParsedDocumentation = {
        publicRoutes: [],
        authenticatedRoutes: [],
        responseStructures: {
          'UserProfile': {
            type: 'object',
            properties: {
              'id': { type: 'string', optional: false },
            },
          },
        },
        errorCodes: [],
      };

      const interfaces: InterfaceDefinition[] = [];

      const result = analyzeTypes(documentation, interfaces);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('MISSING_INTERFACE');
    });
  });

  describe('generateTypeIssueReport', () => {
    it('should generate a readable report', () => {
      const documentation: ParsedDocumentation = {
        publicRoutes: [],
        authenticatedRoutes: [],
        responseStructures: {
          'UserProfile': {
            type: 'object',
            properties: {
              'id': { type: 'string', optional: false },
              'name': { type: 'string', optional: false },
            },
          },
        },
        errorCodes: [],
      };

      const interfaces: InterfaceDefinition[] = [
        {
          name: 'UserProfile',
          properties: [
            { name: 'id', type: 'number', optional: false }, // Wrong type
          ],
        },
      ];

      const result = analyzeTypes(documentation, interfaces);
      const report = generateTypeIssueReport(result);

      expect(report).toContain('# Type Analysis Report');
      expect(report).toContain('## Statistics');
      expect(report).toContain('MISSING PROPERTY');
      expect(report).toContain('TYPE MISMATCH');
      expect(report).toContain('UserProfile');
    });
  });
});
