/**
 * Property-Based Tests for Type Analyzer
 * Feature: api-routes-complete-analysis
 * 
 * Tests Properties 4, 5, and 11 for the type analyzer:
 * - Property 4: Interface Existence
 * - Property 5: Interface Property Completeness
 * - Property 11: Nested Structure Completeness
 */

import fc from 'fast-check';
import { analyzeTypes } from '../../src/analyzers/type-analyzer';
import { createMockDocumentation, createMockInterface } from '../utils/test-helpers';
import type {
  ParsedDocumentation,
  InterfaceDefinition,
  JsonStructure,
  PropertyDefinition,
} from '../../types/core';

describe('Type Analyzer Property Tests', () => {
  /**
   * Property 4: Interface Existence
   * **Validates: Requirements 3.1**
   * 
   * For any response structure defined in the API documentation,
   * a corresponding TypeScript interface MUST exist in api.ts.
   */
  describe('Property 4: Interface Existence', () => {
    it('should detect missing interfaces for documented response structures', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'AmodiatairesListResponse',
            'AmodiataireDetailResponse',
            'NearbySearchResponse',
            'ProfileResponse',
            'MediaListResponse'
          ),
          (interfaceName) => {
            // Create documentation with a response structure
            const documentation = createMockDocumentation({
              responseStructures: {
                [interfaceName]: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', optional: false },
                    data: { type: 'object', optional: false },
                  },
                },
              },
            });

            // Create empty interfaces array (interface is missing)
            const interfaces: InterfaceDefinition[] = [];

            // Run analysis
            const result = analyzeTypes(documentation, interfaces);

            // Property: Should detect the missing interface
            const missingInterfaceIssue = result.issues.find(
              (issue) => issue.type === 'MISSING_INTERFACE' && issue.interface === interfaceName
            );

            return missingInterfaceIssue !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not report issues when interface exists for documented structure', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'AmodiatairesListResponse',
            'AmodiataireDetailResponse',
            'NearbySearchResponse'
          ),
          (interfaceName) => {
            // Create documentation with a response structure
            const documentation = createMockDocumentation({
              responseStructures: {
                [interfaceName]: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', optional: false },
                  },
                },
              },
            });

            // Create matching interface
            const interfaces: InterfaceDefinition[] = [
              createMockInterface({
                name: interfaceName,
                properties: [
                  { name: 'success', type: 'boolean', optional: false },
                ],
              }),
            ];

            // Run analysis
            const result = analyzeTypes(documentation, interfaces);

            // Property: Should NOT detect missing interface
            const missingInterfaceIssue = result.issues.find(
              (issue) => issue.type === 'MISSING_INTERFACE' && issue.interface === interfaceName
            );

            return missingInterfaceIssue === undefined;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Interface Property Completeness
   * **Validates: Requirements 3.2, 3.3, 3.4, 3.6**
   * 
   * For any property defined in a documented JSON response structure,
   * the corresponding TypeScript interface MUST contain that property
   * with the correct type and optionality marker ("?" for optional properties).
   */
  describe('Property 5: Interface Property Completeness', () => {
    it('should detect missing properties in interfaces', () => {
      fc.assert(
        fc.property(
          fc.record({
            interfaceName: fc.constantFrom('ProfileResponse', 'MediaDetail', 'LotDetail'),
            propertyName: fc.constantFrom('id', 'email', 'phone', 'biography'),
            propertyType: fc.constantFrom('string', 'number', 'boolean'),
          }),
          ({ interfaceName, propertyName, propertyType }) => {
            // Create documentation with a property
            const documentation = createMockDocumentation({
              responseStructures: {
                [interfaceName]: {
                  type: 'object',
                  properties: {
                    [propertyName]: { type: propertyType, optional: false },
                  },
                },
              },
            });

            // Create interface WITHOUT the property
            const interfaces: InterfaceDefinition[] = [
              createMockInterface({
                name: interfaceName,
                properties: [], // Empty - property is missing
              }),
            ];

            // Run analysis
            const result = analyzeTypes(documentation, interfaces);

            // Property: Should detect the missing property
            const missingPropertyIssue = result.issues.find(
              (issue) =>
                issue.type === 'MISSING_PROPERTY' &&
                issue.interface === interfaceName &&
                issue.property === propertyName
            );

            return missingPropertyIssue !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect type mismatches between documentation and interface', () => {
      fc.assert(
        fc.property(
          fc.record({
            interfaceName: fc.constantFrom('AmodiataireDetail', 'MediaDetail'),
            propertyName: fc.constantFrom('id', 'count', 'isActive'),
            types: fc
              .tuple(
                fc.constantFrom('string', 'number', 'boolean'),
                fc.constantFrom('string', 'number', 'boolean')
              )
              .filter(([type1, type2]) => type1 !== type2),
          }),
          ({ interfaceName, propertyName, types }) => {
            const [documentedType, implementedType] = types;

            // Create documentation with one type
            const documentation = createMockDocumentation({
              responseStructures: {
                [interfaceName]: {
                  type: 'object',
                  properties: {
                    [propertyName]: { type: documentedType, optional: false },
                  },
                },
              },
            });

            // Create interface with different type
            const interfaces: InterfaceDefinition[] = [
              createMockInterface({
                name: interfaceName,
                properties: [
                  { name: propertyName, type: implementedType, optional: false },
                ],
              }),
            ];

            // Run analysis
            const result = analyzeTypes(documentation, interfaces);

            // Property: Should detect the type mismatch
            const typeMismatchIssue = result.issues.find(
              (issue) =>
                issue.type === 'TYPE_MISMATCH' &&
                issue.interface === interfaceName &&
                issue.property === propertyName
            );

            return typeMismatchIssue !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect optionality mismatches between documentation and interface', () => {
      fc.assert(
        fc.property(
          fc.record({
            interfaceName: fc.constantFrom('ProfileDetail', 'LotDetail', 'MediaDetail'),
            propertyName: fc.constantFrom('biography', 'phone', 'description'),
            propertyType: fc.constantFrom('string', 'number'),
            isOptional: fc.boolean(),
          }),
          ({ interfaceName, propertyName, propertyType, isOptional }) => {
            // Create documentation with one optionality
            const documentation = createMockDocumentation({
              responseStructures: {
                [interfaceName]: {
                  type: 'object',
                  properties: {
                    [propertyName]: { type: propertyType, optional: isOptional },
                  },
                },
              },
            });

            // Create interface with opposite optionality
            const interfaces: InterfaceDefinition[] = [
              createMockInterface({
                name: interfaceName,
                properties: [
                  { name: propertyName, type: propertyType, optional: !isOptional },
                ],
              }),
            ];

            // Run analysis
            const result = analyzeTypes(documentation, interfaces);

            // Property: Should detect the optionality mismatch
            const optionalityMismatchIssue = result.issues.find(
              (issue) =>
                issue.type === 'OPTIONALITY_MISMATCH' &&
                issue.interface === interfaceName &&
                issue.property === propertyName
            );

            return optionalityMismatchIssue !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate that correct properties pass all checks', () => {
      fc.assert(
        fc.property(
          fc.record({
            interfaceName: fc.constantFrom('AmodiataireDetail', 'ProfileResponse'),
            propertyName: fc.constantFrom('id', 'email', 'username'),
            propertyType: fc.constantFrom('string', 'number', 'boolean'),
            isOptional: fc.boolean(),
          }),
          ({ interfaceName, propertyName, propertyType, isOptional }) => {
            // Create documentation
            const documentation = createMockDocumentation({
              responseStructures: {
                [interfaceName]: {
                  type: 'object',
                  properties: {
                    [propertyName]: { type: propertyType, optional: isOptional },
                  },
                },
              },
            });

            // Create matching interface with same type and optionality
            const interfaces: InterfaceDefinition[] = [
              createMockInterface({
                name: interfaceName,
                properties: [
                  { name: propertyName, type: propertyType, optional: isOptional },
                ],
              }),
            ];

            // Run analysis
            const result = analyzeTypes(documentation, interfaces);

            // Property: Should NOT detect any issues for this property
            const propertyIssues = result.issues.filter(
              (issue) =>
                issue.interface === interfaceName &&
                issue.property === propertyName
            );

            return propertyIssues.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 11: Nested Structure Completeness
   * **Validates: Requirements 11.1-11.6**
   * 
   * For any nested object structure in the documented JSON response
   * (e.g., AmodiataireDetail.lot, AmodiataireDetail.profile),
   * the interface MUST define the nested structure with all documented properties.
   */
  describe('Property 11: Nested Structure Completeness', () => {
    it('should validate nested structures have all documented properties', () => {
      fc.assert(
        fc.property(
          fc.record({
            parentInterface: fc.constantFrom('AmodiataireDetail', 'ProfileResponse'),
            nestedProperty: fc.constantFrom('lot', 'profile', 'media'),
            nestedInterface: fc.constantFrom('LotDetail', 'ProfileDetail', 'MediaCollection'),
            nestedPropertyName: fc.constantFrom('id', 'name', 'description'),
            nestedPropertyType: fc.constantFrom('string', 'number'),
          }),
          ({
            parentInterface,
            nestedProperty,
            nestedInterface,
            nestedPropertyName,
            nestedPropertyType,
          }) => {
            // Create documentation with nested structure
            const documentation = createMockDocumentation({
              responseStructures: {
                [parentInterface]: {
                  type: 'object',
                  properties: {
                    [nestedProperty]: {
                      type: nestedInterface,
                      optional: false,
                      nested: {
                        type: 'object',
                        properties: {
                          [nestedPropertyName]: {
                            type: nestedPropertyType,
                            optional: false,
                          },
                        },
                      },
                    },
                  },
                },
              },
            });

            // Create parent interface with nested type reference
            const parentInterfaceDef = createMockInterface({
              name: parentInterface,
              properties: [
                { name: nestedProperty, type: nestedInterface, optional: false },
              ],
            });

            // Create nested interface WITHOUT the required property
            const nestedInterfaceDef = createMockInterface({
              name: nestedInterface,
              properties: [], // Missing the nested property
            });

            const interfaces: InterfaceDefinition[] = [
              parentInterfaceDef,
              nestedInterfaceDef,
            ];

            // Run analysis
            const result = analyzeTypes(documentation, interfaces);

            // Property: Should detect missing property in nested structure
            const missingNestedPropertyIssue = result.issues.find(
              (issue) =>
                issue.type === 'MISSING_PROPERTY' &&
                issue.interface === nestedInterface &&
                issue.property === nestedPropertyName
            );

            return missingNestedPropertyIssue !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate complete nested structures pass validation', () => {
      fc.assert(
        fc.property(
          fc.record({
            parentInterface: fc.constantFrom('AmodiataireDetail'),
            nestedProperty: fc.constantFrom('lot', 'profile'),
            nestedInterface: fc.constantFrom('LotDetail', 'ProfileDetail'),
            nestedPropertyName: fc.constantFrom('numeroLot', 'raisonSociale', 'biography'),
            nestedPropertyType: fc.constantFrom('string'),
          }),
          ({
            parentInterface,
            nestedProperty,
            nestedInterface,
            nestedPropertyName,
            nestedPropertyType,
          }) => {
            // Create documentation with nested structure
            const documentation = createMockDocumentation({
              responseStructures: {
                [parentInterface]: {
                  type: 'object',
                  properties: {
                    [nestedProperty]: {
                      type: nestedInterface,
                      optional: false,
                      nested: {
                        type: 'object',
                        properties: {
                          [nestedPropertyName]: {
                            type: nestedPropertyType,
                            optional: false,
                          },
                        },
                      },
                    },
                  },
                },
              },
            });

            // Create parent interface with nested type reference
            const parentInterfaceDef = createMockInterface({
              name: parentInterface,
              properties: [
                { name: nestedProperty, type: nestedInterface, optional: false },
              ],
            });

            // Create nested interface WITH the required property
            const nestedInterfaceDef = createMockInterface({
              name: nestedInterface,
              properties: [
                { name: nestedPropertyName, type: nestedPropertyType, optional: false },
              ],
            });

            const interfaces: InterfaceDefinition[] = [
              parentInterfaceDef,
              nestedInterfaceDef,
            ];

            // Run analysis
            const result = analyzeTypes(documentation, interfaces);

            // Property: Should NOT detect any issues for complete nested structure
            const nestedPropertyIssues = result.issues.filter(
              (issue) =>
                issue.interface === nestedInterface &&
                issue.property === nestedPropertyName
            );

            return nestedPropertyIssues.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect type mismatches in nested structures', () => {
      fc.assert(
        fc.property(
          fc.record({
            nestedInterface: fc.constantFrom('LotDetail', 'MediaDetail'),
            nestedPropertyName: fc.constantFrom('superficie', 'fileSize'),
            types: fc
              .tuple(
                fc.constantFrom('string', 'number'),
                fc.constantFrom('string', 'number')
              )
              .filter(([type1, type2]) => type1 !== type2),
          }),
          ({ nestedInterface, nestedPropertyName, types }) => {
            const [documentedType, implementedType] = types;

            // Create documentation with nested structure
            const documentation = createMockDocumentation({
              responseStructures: {
                AmodiataireDetail: {
                  type: 'object',
                  properties: {
                    lot: {
                      type: nestedInterface,
                      optional: false,
                      nested: {
                        type: 'object',
                        properties: {
                          [nestedPropertyName]: {
                            type: documentedType,
                            optional: false,
                          },
                        },
                      },
                    },
                  },
                },
              },
            });

            // Create interfaces with type mismatch in nested structure
            const parentInterfaceDef = createMockInterface({
              name: 'AmodiataireDetail',
              properties: [
                { name: 'lot', type: nestedInterface, optional: false },
              ],
            });

            const nestedInterfaceDef = createMockInterface({
              name: nestedInterface,
              properties: [
                { name: nestedPropertyName, type: implementedType, optional: false },
              ],
            });

            const interfaces: InterfaceDefinition[] = [
              parentInterfaceDef,
              nestedInterfaceDef,
            ];

            // Run analysis
            const result = analyzeTypes(documentation, interfaces);

            // Property: Should detect type mismatch in nested structure
            const typeMismatchIssue = result.issues.find(
              (issue) =>
                issue.type === 'TYPE_MISMATCH' &&
                issue.interface === nestedInterface &&
                issue.property === nestedPropertyName
            );

            return typeMismatchIssue !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate deeply nested structures (e.g., AmodiataireDetail.media.images)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('url', 'thumbnailUrl', 'title'),
          fc.constantFrom('string'),
          (propertyName, propertyType) => {
            // Create documentation with deeply nested structure
            // AmodiataireDetail -> media (MediaCollection) -> images (MediaDetail[])
            const documentation = createMockDocumentation({
              responseStructures: {
                AmodiataireDetail: {
                  type: 'object',
                  properties: {
                    media: {
                      type: 'MediaCollection',
                      optional: false,
                      nested: {
                        type: 'object',
                        properties: {
                          images: {
                            type: 'MediaDetail[]',
                            optional: false,
                            nested: {
                              type: 'object',
                              properties: {
                                [propertyName]: {
                                  type: propertyType,
                                  optional: false,
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            });

            // Create all interfaces in the chain
            const amodiataireDetailInterface = createMockInterface({
              name: 'AmodiataireDetail',
              properties: [
                { name: 'media', type: 'MediaCollection', optional: false },
              ],
            });

            const mediaCollectionInterface = createMockInterface({
              name: 'MediaCollection',
              properties: [
                { name: 'images', type: 'MediaDetail[]', optional: false },
              ],
            });

            // MediaDetail interface WITH the property
            const mediaDetailInterface = createMockInterface({
              name: 'MediaDetail',
              properties: [
                { name: propertyName, type: propertyType, optional: false },
              ],
            });

            const interfaces: InterfaceDefinition[] = [
              amodiataireDetailInterface,
              mediaCollectionInterface,
              mediaDetailInterface,
            ];

            // Run analysis
            const result = analyzeTypes(documentation, interfaces);

            // Property: Should NOT detect issues for complete deeply nested structure
            const deepNestedIssues = result.issues.filter(
              (issue) =>
                issue.interface === 'MediaDetail' &&
                issue.property === propertyName
            );

            return deepNestedIssues.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
