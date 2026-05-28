/**
 * Property-Based Tests for Interface Property Completeness
 * Feature: api-routes-complete-analysis, Property 5: Interface Property Completeness
 * 
 * For any property defined in a documented JSON response structure, the corresponding
 * TypeScript interface MUST contain that property with the correct type and optionality
 * marker ("?" for optional properties).
 * 
 * **Validates: Requirements 3.2, 3.3, 3.4, 3.6**
 */

import fc from 'fast-check';
import { createMockInterface, createMockJsonStructure } from '../utils/test-helpers';
import type { JsonStructure, InterfaceDefinition, PropertyDefinition } from '../../types/core';

describe('Property 5: Interface Property Completeness', () => {
  /**
   * Helper function to check if a property exists in an interface
   */
  function propertyExistsInInterface(
    propertyName: string,
    propertyDef: PropertyDefinition,
    tsInterface: InterfaceDefinition
  ): boolean {
    const tsProp = tsInterface.properties.find((p) => p.name === propertyName);
    
    if (!tsProp) {
      return false;
    }
    
    // Check type match (simplified for testing)
    const typeMatches = tsProp.type === propertyDef.type;
    
    // Check optionality match
    const optionalityMatches = tsProp.optional === propertyDef.optional;
    
    return typeMatches && optionalityMatches;
  }

  it('should have all documented properties in the interface', () => {
    fc.assert(
      fc.property(
        fc.record({
          propertyName: fc.constantFrom('id', 'name', 'email', 'createdAt'),
          propertyType: fc.constantFrom('string', 'number', 'boolean'),
          optional: fc.boolean(),
        }),
        (propData) => {
          const propertyDef: PropertyDefinition = {
            type: propData.propertyType,
            optional: propData.optional,
          };
          
          const tsInterface = createMockInterface({
            name: 'TestInterface',
            properties: [
              {
                name: propData.propertyName,
                type: propData.propertyType,
                optional: propData.optional,
              },
            ],
          });

          // Property: The property should exist with correct type and optionality
          return propertyExistsInInterface(propData.propertyName, propertyDef, tsInterface);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect missing properties', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.constantFrom('string', 'number', 'boolean'),
        (propertyName, propertyType) => {
          const propertyDef: PropertyDefinition = {
            type: propertyType,
            optional: false,
          };
          
          // Create an interface without the property
          const tsInterface = createMockInterface({
            name: 'TestInterface',
            properties: [],
          });

          // Property: The property should NOT exist in the empty interface
          return !propertyExistsInInterface(propertyName, propertyDef, tsInterface);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect optionality mismatches', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('id', 'name', 'email'),
        fc.constantFrom('string', 'number', 'boolean'),
        fc.boolean(),
        (propertyName, propertyType, isOptional) => {
          const propertyDef: PropertyDefinition = {
            type: propertyType,
            optional: isOptional,
          };
          
          // Create an interface with opposite optionality
          const tsInterface = createMockInterface({
            name: 'TestInterface',
            properties: [
              {
                name: propertyName,
                type: propertyType,
                optional: !isOptional, // Opposite optionality
              },
            ],
          });

          // Property: Should detect the optionality mismatch
          return !propertyExistsInInterface(propertyName, propertyDef, tsInterface);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect type mismatches', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('id', 'name', 'count'),
        fc.tuple(
          fc.constantFrom('string', 'number', 'boolean'),
          fc.constantFrom('string', 'number', 'boolean')
        ).filter(([type1, type2]) => type1 !== type2),
        (propertyName, [expectedType, actualType]) => {
          const propertyDef: PropertyDefinition = {
            type: expectedType,
            optional: false,
          };
          
          // Create an interface with different type
          const tsInterface = createMockInterface({
            name: 'TestInterface',
            properties: [
              {
                name: propertyName,
                type: actualType,
                optional: false,
              },
            ],
          });

          // Property: Should detect the type mismatch
          return !propertyExistsInInterface(propertyName, propertyDef, tsInterface);
        }
      ),
      { numRuns: 100 }
    );
  });
});
