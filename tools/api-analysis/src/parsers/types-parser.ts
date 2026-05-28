/**
 * TypeScript AST Parser for api.ts
 * Feature: api-routes-complete-analysis
 * 
 * Parses TypeScript interface definitions from src/types/api.ts
 * Extracts interface names, properties, types, and optionality
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { InterfaceDefinition, PropertyInfo } from '../../types/core';

/**
 * Parse TypeScript interfaces from api.ts file
 * 
 * @param filePath - Path to the api.ts file
 * @returns Array of interface definitions
 */
export function parseApiTypes(filePath: string): InterfaceDefinition[] {
  // Read the file content
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  // Create a source file using TypeScript compiler API
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true // setParentNodes
  );
  
  const interfaces: InterfaceDefinition[] = [];
  
  // Visit all nodes in the AST
  function visit(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node)) {
      const interfaceDef = extractInterfaceDefinition(node, sourceFile);
      interfaces.push(interfaceDef);
    }
    
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  
  return interfaces;
}

/**
 * Extract interface definition from an interface declaration node
 * 
 * @param node - Interface declaration node
 * @param sourceFile - Source file for getting text
 * @returns Interface definition
 */
function extractInterfaceDefinition(
  node: ts.InterfaceDeclaration,
  sourceFile: ts.SourceFile
): InterfaceDefinition {
  const name = node.name.text;
  const properties: PropertyInfo[] = [];
  const extendsTypes: string[] = [];
  
  // Extract JSDoc comment if present
  const comment = extractJSDocComment(node, sourceFile);
  
  // Extract extends clause
  if (node.heritageClauses) {
    for (const clause of node.heritageClauses) {
      if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
        for (const type of clause.types) {
          extendsTypes.push(type.expression.getText(sourceFile));
        }
      }
    }
  }
  
  // Extract properties
  for (const member of node.members) {
    if (ts.isPropertySignature(member)) {
      const property = extractPropertyInfo(member, sourceFile);
      if (property) {
        properties.push(property);
      }
    }
  }
  
  return {
    name,
    properties,
    extends: extendsTypes.length > 0 ? extendsTypes : undefined,
    comment,
  };
}

/**
 * Extract property information from a property signature
 * 
 * @param member - Property signature node
 * @param sourceFile - Source file for getting text
 * @returns Property information or null if invalid
 */
function extractPropertyInfo(
  member: ts.PropertySignature,
  sourceFile: ts.SourceFile
): PropertyInfo | null {
  // Get property name
  const name = member.name?.getText(sourceFile);
  if (!name) {
    return null;
  }
  
  // Check if property is optional (has ? token)
  const optional = !!member.questionToken;
  
  // Get property type
  let type = 'any';
  if (member.type) {
    type = getTypeString(member.type, sourceFile);
  }
  
  // Extract JSDoc comment if present
  const comment = extractJSDocComment(member, sourceFile);
  
  return {
    name,
    type,
    optional,
    comment,
  };
}

/**
 * Get a string representation of a TypeScript type
 * Handles various type nodes including nested types
 * 
 * @param typeNode - Type node
 * @param sourceFile - Source file for getting text
 * @returns String representation of the type
 */
function getTypeString(typeNode: ts.TypeNode, sourceFile: ts.SourceFile): string {
  // Handle different type kinds
  switch (typeNode.kind) {
    case ts.SyntaxKind.StringKeyword:
      return 'string';
    case ts.SyntaxKind.NumberKeyword:
      return 'number';
    case ts.SyntaxKind.BooleanKeyword:
      return 'boolean';
    case ts.SyntaxKind.AnyKeyword:
      return 'any';
    case ts.SyntaxKind.VoidKeyword:
      return 'void';
    case ts.SyntaxKind.UndefinedKeyword:
      return 'undefined';
    case ts.SyntaxKind.NullKeyword:
      return 'null';
    
    case ts.SyntaxKind.ArrayType:
      const arrayType = typeNode as ts.ArrayTypeNode;
      return `${getTypeString(arrayType.elementType, sourceFile)}[]`;
    
    case ts.SyntaxKind.UnionType:
      const unionType = typeNode as ts.UnionTypeNode;
      return unionType.types
        .map(t => getTypeString(t, sourceFile))
        .join(' | ');
    
    case ts.SyntaxKind.IntersectionType:
      const intersectionType = typeNode as ts.IntersectionTypeNode;
      return intersectionType.types
        .map(t => getTypeString(t, sourceFile))
        .join(' & ');
    
    case ts.SyntaxKind.TypeLiteral:
      // For inline object types, return the full text
      return typeNode.getText(sourceFile);
    
    case ts.SyntaxKind.TypeReference:
      const typeRef = typeNode as ts.TypeReferenceNode;
      const typeName = typeRef.typeName.getText(sourceFile);
      
      // Handle generic types
      if (typeRef.typeArguments && typeRef.typeArguments.length > 0) {
        const typeArgs = typeRef.typeArguments
          .map(arg => getTypeString(arg, sourceFile))
          .join(', ');
        return `${typeName}<${typeArgs}>`;
      }
      
      return typeName;
    
    case ts.SyntaxKind.LiteralType:
      const literalType = typeNode as ts.LiteralTypeNode;
      return literalType.literal.getText(sourceFile);
    
    case ts.SyntaxKind.ParenthesizedType:
      const parenType = typeNode as ts.ParenthesizedTypeNode;
      return `(${getTypeString(parenType.type, sourceFile)})`;
    
    default:
      // For any other type, return the full text
      return typeNode.getText(sourceFile);
  }
}

/**
 * Extract JSDoc comment from a node
 * 
 * @param node - Node to extract comment from
 * @param sourceFile - Source file
 * @returns Comment text or undefined
 */
function extractJSDocComment(
  node: ts.Node,
  sourceFile: ts.SourceFile
): string | undefined {
  const jsDocTags = ts.getJSDocTags(node);
  const jsDocComments = ts.getJSDocCommentsAndTags(node);
  
  if (jsDocComments.length > 0) {
    const firstComment = jsDocComments[0];
    if (ts.isJSDoc(firstComment) && firstComment.comment) {
      if (typeof firstComment.comment === 'string') {
        return firstComment.comment.trim();
      }
    }
  }
  
  // Fallback: try to get leading comments
  const fullText = sourceFile.getFullText();
  const nodePos = node.getFullStart();
  const commentRanges = ts.getLeadingCommentRanges(fullText, nodePos);
  
  if (commentRanges && commentRanges.length > 0) {
    const lastComment = commentRanges[commentRanges.length - 1];
    const commentText = fullText.substring(lastComment.pos, lastComment.end);
    
    // Clean up comment text
    return commentText
      .replace(/^\/\*\*?\s*/, '') // Remove /** or /*
      .replace(/\s*\*\/$/, '')     // Remove */
      .split('\n')
      .map(line => line.replace(/^\s*\*\s?/, '')) // Remove leading * from each line
      .join('\n')
      .trim();
  }
  
  return undefined;
}

/**
 * Parse interfaces from the default api.ts location
 * 
 * @param projectRoot - Root directory of the project
 * @returns Array of interface definitions
 */
export function parseApiTypesFromProject(projectRoot: string): InterfaceDefinition[] {
  const apiTypesPath = path.join(projectRoot, 'src', 'types', 'api.ts');
  
  if (!fs.existsSync(apiTypesPath)) {
    throw new Error(`api.ts file not found at: ${apiTypesPath}`);
  }
  
  return parseApiTypes(apiTypesPath);
}

/**
 * Find an interface by name
 * 
 * @param interfaces - Array of interface definitions
 * @param name - Interface name to find
 * @returns Interface definition or undefined
 */
export function findInterface(
  interfaces: InterfaceDefinition[],
  name: string
): InterfaceDefinition | undefined {
  return interfaces.find(iface => iface.name === name);
}

/**
 * Find a property in an interface
 * 
 * @param interfaceDef - Interface definition
 * @param propertyName - Property name to find
 * @returns Property info or undefined
 */
export function findProperty(
  interfaceDef: InterfaceDefinition,
  propertyName: string
): PropertyInfo | undefined {
  return interfaceDef.properties.find(prop => prop.name === propertyName);
}

/**
 * Get all interfaces that extend a specific interface
 * 
 * @param interfaces - Array of interface definitions
 * @param baseInterfaceName - Name of the base interface
 * @returns Array of interfaces that extend the base interface
 */
export function getInterfacesThatExtend(
  interfaces: InterfaceDefinition[],
  baseInterfaceName: string
): InterfaceDefinition[] {
  return interfaces.filter(iface => 
    iface.extends?.includes(baseInterfaceName)
  );
}

/**
 * Get all properties of an interface including inherited properties
 * 
 * @param interfaces - Array of all interface definitions
 * @param interfaceName - Name of the interface
 * @returns Array of all properties (own + inherited)
 */
export function getAllProperties(
  interfaces: InterfaceDefinition[],
  interfaceName: string
): PropertyInfo[] {
  const interfaceDef = findInterface(interfaces, interfaceName);
  if (!interfaceDef) {
    return [];
  }
  
  const properties: PropertyInfo[] = [...interfaceDef.properties];
  
  // Add inherited properties
  if (interfaceDef.extends) {
    for (const baseInterfaceName of interfaceDef.extends) {
      const baseProperties = getAllProperties(interfaces, baseInterfaceName);
      properties.push(...baseProperties);
    }
  }
  
  return properties;
}
