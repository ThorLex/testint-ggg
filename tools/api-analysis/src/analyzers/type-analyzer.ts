/**
 * Type Analyzer for TypeScript Interface Comparison
 * Feature: api-routes-complete-analysis
 * 
 * Compares documented JSON structures with TypeScript interfaces to identify:
 * - Missing interfaces (documented but not in code)
 * - Missing properties in interfaces
 * - Type mismatches (string vs number, etc.)
 * - Optionality mismatches (required vs optional)
 * - Nested structure validation
 */

import {
  ParsedDocumentation,
  JsonStructure,
  PropertyDefinition,
  TypeIssue,
  IssuePriority,
  InterfaceDefinition,
  PropertyInfo,
} from '../../types/core';

/**
 * Type analysis result
 */
export interface TypeAnalysisResult {
  issues: TypeIssue[];
  statistics: {
    totalDocumentedStructures: number;
    totalImplementedInterfaces: number;
    missingInterfaces: number;
    missingProperties: number;
    typeMismatches: number;
    optionalityMismatches: number;
  };
}

/**
 * Analyze types by comparing documentation with implementation
 */
export function analyzeTypes(
  documentation: ParsedDocumentation,
  interfaces: InterfaceDefinition[]
): TypeAnalysisResult {
  const issues: TypeIssue[] = [];

  // 1. Check for missing interfaces (documented but not in code)
  const missingInterfaceIssues = findMissingInterfaces(
    documentation.responseStructures,
    interfaces
  );
  issues.push(...missingInterfaceIssues);

  // 2. Check for missing properties and type/optionality mismatches
  const propertyIssues = validateInterfaceProperties(
    documentation.responseStructures,
    interfaces
  );
  issues.push(...propertyIssues);

  // Calculate statistics
  const statistics = {
    totalDocumentedStructures: Object.keys(documentation.responseStructures).length,
    totalImplementedInterfaces: interfaces.length,
    missingInterfaces: issues.filter(i => i.type === 'MISSING_INTERFACE').length,
    missingProperties: issues.filter(i => i.type === 'MISSING_PROPERTY').length,
    typeMismatches: issues.filter(i => i.type === 'TYPE_MISMATCH').length,
    optionalityMismatches: issues.filter(i => i.type === 'OPTIONALITY_MISMATCH').length,
  };

  return {
    issues,
    statistics,
  };
}

/**
 * Find interfaces that are documented but missing from code
 */
function findMissingInterfaces(
  responseStructures: Record<string, JsonStructure>,
  interfaces: InterfaceDefinition[]
): TypeIssue[] {
  const issues: TypeIssue[] = [];

  for (const [structureName, jsonStructure] of Object.entries(responseStructures)) {
    const matchingInterface = findMatchingInterface(structureName, interfaces);

    if (!matchingInterface) {
      issues.push({
        type: 'MISSING_INTERFACE',
        interface: structureName,
        jsonStructure,
        priority: determinePriority(structureName),
      });
    }
  }

  return issues;
}

/**
 * Validate properties of interfaces against documented structures
 */
function validateInterfaceProperties(
  responseStructures: Record<string, JsonStructure>,
  interfaces: InterfaceDefinition[]
): TypeIssue[] {
  const issues: TypeIssue[] = [];

  for (const [structureName, jsonStructure] of Object.entries(responseStructures)) {
    const matchingInterface = findMatchingInterface(structureName, interfaces);

    if (!matchingInterface) {
      // Already reported as missing interface
      continue;
    }

    // Validate properties if the structure is an object
    if (jsonStructure.type === 'object' && jsonStructure.properties) {
      const propertyIssues = validateProperties(
        structureName,
        jsonStructure.properties,
        matchingInterface,
        interfaces
      );
      issues.push(...propertyIssues);
    }
  }

  return issues;
}

/**
 * Validate individual properties of an interface
 */
function validateProperties(
  interfaceName: string,
  documentedProperties: Record<string, PropertyDefinition>,
  interfaceDef: InterfaceDefinition,
  allInterfaces: InterfaceDefinition[]
): TypeIssue[] {
  const issues: TypeIssue[] = [];

  for (const [propName, propDef] of Object.entries(documentedProperties)) {
    const interfaceProperty = findProperty(interfaceDef, propName);

    if (!interfaceProperty) {
      // Property is missing from interface
      issues.push({
        type: 'MISSING_PROPERTY',
        interface: interfaceName,
        property: propName,
        expected: propDef.type,
        priority: propDef.optional ? 'MEDIUM' : 'HIGH',
      });
      continue;
    }

    // Check type mismatch
    if (!typesMatch(propDef.type, interfaceProperty.type, allInterfaces)) {
      issues.push({
        type: 'TYPE_MISMATCH',
        interface: interfaceName,
        property: propName,
        expected: propDef.type,
        actual: interfaceProperty.type,
        priority: 'HIGH',
      });
    }

    // Check optionality mismatch
    if (propDef.optional !== interfaceProperty.optional) {
      issues.push({
        type: 'OPTIONALITY_MISMATCH',
        interface: interfaceName,
        property: propName,
        expected: propDef.optional,
        actual: interfaceProperty.optional,
        priority: 'MEDIUM',
      });
    }

    // Recursively validate nested structures
    if (propDef.nested && propDef.nested.type === 'object' && propDef.nested.properties) {
      // Find the nested interface
      const nestedInterfaceName = extractInterfaceName(interfaceProperty.type);
      if (nestedInterfaceName) {
        const nestedInterface = findMatchingInterface(nestedInterfaceName, allInterfaces);
        if (nestedInterface) {
          const nestedIssues = validateProperties(
            nestedInterfaceName,
            propDef.nested.properties,
            nestedInterface,
            allInterfaces
          );
          issues.push(...nestedIssues);
        }
      }
    }
  }

  return issues;
}

/**
 * Find a matching interface by name (case-insensitive, flexible matching)
 */
function findMatchingInterface(
  structureName: string,
  interfaces: InterfaceDefinition[]
): InterfaceDefinition | null {
  // Try exact match first
  const exactMatch = interfaces.find(
    iface => iface.name.toLowerCase() === structureName.toLowerCase()
  );
  if (exactMatch) {
    return exactMatch;
  }

  // Try partial match (e.g., "AmodiatairesListResponse" matches "AmodiatairesListResponse")
  const partialMatch = interfaces.find(iface =>
    iface.name.toLowerCase().includes(structureName.toLowerCase()) ||
    structureName.toLowerCase().includes(iface.name.toLowerCase())
  );
  if (partialMatch) {
    return partialMatch;
  }

  // Try matching without "Response" suffix
  const withoutResponse = structureName.replace(/Response$/i, '');
  const withoutResponseMatch = interfaces.find(
    iface => iface.name.toLowerCase() === withoutResponse.toLowerCase()
  );
  if (withoutResponseMatch) {
    return withoutResponseMatch;
  }

  return null;
}

/**
 * Find a property in an interface (including inherited properties)
 */
function findProperty(
  interfaceDef: InterfaceDefinition,
  propertyName: string
): PropertyInfo | null {
  // Direct property match
  const directMatch = interfaceDef.properties.find(
    prop => prop.name === propertyName
  );
  if (directMatch) {
    return directMatch;
  }

  // TODO: Handle inherited properties from extends clause
  // For now, just check direct properties

  return null;
}

/**
 * Check if two types match (with normalization and flexibility)
 */
function typesMatch(
  documentedType: string,
  interfaceType: string,
  allInterfaces: InterfaceDefinition[]
): boolean {
  // Normalize types for comparison
  const normalizedDocType = normalizeType(documentedType);
  const normalizedInterfaceType = normalizeType(interfaceType);

  // Exact match
  if (normalizedDocType === normalizedInterfaceType) {
    return true;
  }

  // Handle array types
  if (normalizedDocType.endsWith('[]') && normalizedInterfaceType.endsWith('[]')) {
    const docElementType = normalizedDocType.slice(0, -2);
    const interfaceElementType = normalizedInterfaceType.slice(0, -2);
    return typesMatch(docElementType, interfaceElementType, allInterfaces);
  }

  // Handle Array<T> vs T[]
  if (normalizedDocType.endsWith('[]')) {
    const arrayMatch = normalizedInterfaceType.match(/^Array<(.+)>$/);
    if (arrayMatch) {
      const docElementType = normalizedDocType.slice(0, -2);
      return typesMatch(docElementType, arrayMatch[1], allInterfaces);
    }
  }

  if (normalizedInterfaceType.endsWith('[]')) {
    const arrayMatch = normalizedDocType.match(/^Array<(.+)>$/);
    if (arrayMatch) {
      const interfaceElementType = normalizedInterfaceType.slice(0, -2);
      return typesMatch(arrayMatch[1], interfaceElementType, allInterfaces);
    }
  }

  // Handle union types (e.g., "string | null" vs "string")
  if (normalizedInterfaceType.includes('|')) {
    const unionTypes = normalizedInterfaceType.split('|').map(t => t.trim());
    return unionTypes.some(t => typesMatch(documentedType, t, allInterfaces));
  }

  // Handle object types (check if it's a known interface)
  if (normalizedDocType === 'object') {
    // Check if interfaceType is a known interface name
    const isKnownInterface = allInterfaces.some(
      iface => iface.name === normalizedInterfaceType
    );
    if (isKnownInterface) {
      return true;
    }
  }

  // Handle generic types (e.g., "Record<string, any>")
  if (normalizedInterfaceType.includes('<') && normalizedInterfaceType.includes('>')) {
    // For now, accept generic types as matching if base type matches
    const baseType = normalizedInterfaceType.split('<')[0];
    if (normalizedDocType === baseType || normalizedDocType === 'object') {
      return true;
    }
  }

  // Handle number vs integer
  if ((normalizedDocType === 'number' || normalizedDocType === 'integer') &&
      (normalizedInterfaceType === 'number' || normalizedInterfaceType === 'integer')) {
    return true;
  }

  return false;
}

/**
 * Normalize a type string for comparison
 */
function normalizeType(type: string): string {
  return type
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\s*\|\s*/g, '|') // Remove spaces around union operators
    .replace(/\s*&\s*/g, '&'); // Remove spaces around intersection operators
}

/**
 * Extract interface name from a type string
 * Example: "LotDetail" -> "LotDetail"
 * Example: "LotDetail | null" -> "LotDetail"
 * Example: "Array<MediaDetail>" -> "MediaDetail"
 */
function extractInterfaceName(type: string): string | null {
  // Remove null/undefined from union types
  const cleanType = type
    .split('|')
    .map(t => t.trim())
    .find(t => t !== 'null' && t !== 'undefined');

  if (!cleanType) {
    return null;
  }

  // Handle array types
  if (cleanType.endsWith('[]')) {
    return cleanType.slice(0, -2);
  }

  // Handle Array<T>
  const arrayMatch = cleanType.match(/^Array<(.+)>$/);
  if (arrayMatch) {
    return arrayMatch[1];
  }

  // Handle generic types - extract the first type parameter
  const genericMatch = cleanType.match(/^([A-Z][a-zA-Z0-9]*)<(.+)>$/);
  if (genericMatch) {
    return genericMatch[1];
  }

  // Return as-is if it looks like an interface name (starts with uppercase)
  if (/^[A-Z]/.test(cleanType)) {
    return cleanType;
  }

  return null;
}

/**
 * Determine the priority of a type issue
 */
function determinePriority(interfaceName: string): IssuePriority {
  // Medium: Supporting structures (check before Response to avoid false positives)
  if (interfaceName.includes('List') || interfaceName.includes('Collection')) {
    return 'MEDIUM';
  }

  // Critical: Core response interfaces
  if (interfaceName.includes('Response')) {
    return 'CRITICAL';
  }

  // High: Important data structures with Detail suffix or core entities
  if (interfaceName.includes('Detail') ||
      interfaceName.includes('Profile') ||
      interfaceName.includes('Media') ||
      interfaceName.includes('Announcement') ||
      interfaceName.includes('Lot')) {
    return 'HIGH';
  }

  // Low: Other structures
  return 'LOW';
}

/**
 * Generate a detailed report for type issues
 */
export function generateTypeIssueReport(result: TypeAnalysisResult): string {
  const { issues, statistics } = result;

  let report = '# Type Analysis Report\n\n';

  // Statistics
  report += '## Statistics\n\n';
  report += `- Total documented structures: ${statistics.totalDocumentedStructures}\n`;
  report += `- Total implemented interfaces: ${statistics.totalImplementedInterfaces}\n`;
  report += `- Missing interfaces: ${statistics.missingInterfaces}\n`;
  report += `- Missing properties: ${statistics.missingProperties}\n`;
  report += `- Type mismatches: ${statistics.typeMismatches}\n`;
  report += `- Optionality mismatches: ${statistics.optionalityMismatches}\n\n`;

  // Issues by type
  const issuesByType = groupIssuesByType(issues);

  for (const [type, typeIssues] of Object.entries(issuesByType)) {
    if (typeIssues.length > 0) {
      report += `## ${type.replace(/_/g, ' ')} (${typeIssues.length})\n\n`;

      for (const issue of typeIssues) {
        report += `### ${issue.interface}`;
        if (issue.property) {
          report += `.${issue.property}`;
        }
        report += `\n`;
        report += `**Priority:** ${issue.priority}\n`;

        if (issue.expected !== undefined) {
          report += `**Expected:** ${JSON.stringify(issue.expected)}\n`;
        }

        if (issue.actual !== undefined) {
          report += `**Actual:** ${JSON.stringify(issue.actual)}\n`;
        }

        if (issue.jsonStructure) {
          report += `**JSON Structure:** ${JSON.stringify(issue.jsonStructure, null, 2)}\n`;
        }

        report += '\n';
      }
    }
  }

  return report;
}

/**
 * Group issues by type for reporting
 */
function groupIssuesByType(issues: TypeIssue[]): Record<string, TypeIssue[]> {
  const grouped: Record<string, TypeIssue[]> = {
    MISSING_INTERFACE: [],
    MISSING_PROPERTY: [],
    TYPE_MISMATCH: [],
    OPTIONALITY_MISMATCH: [],
  };

  for (const issue of issues) {
    if (!grouped[issue.type]) {
      grouped[issue.type] = [];
    }
    grouped[issue.type].push(issue);
  }

  return grouped;
}
