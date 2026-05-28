/**
 * TypeScript AST parser for routes.ts
 * Feature: api-routes-complete-analysis
 * 
 * Parses the ApiRoutes class to extract:
 * - All route constants (PUBLIC_AMODIATAIRES_V2, PROFILE, etc.)
 * - Utility methods that generate URLs dynamically
 * - Deprecated route markers in comments
 * - The actual string values of each route constant
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { RouteConstant } from '../../types/core';

/**
 * Utility method information extracted from ApiRoutes
 */
export interface UtilityMethod {
  name: string;
  parameters: Array<{ name: string; type: string }>;
  returnType: string;
  usesRoute?: string;
  deprecated?: boolean;
  comment?: string;
}

/**
 * Complete parsed routes information
 */
export interface ParsedRoutes {
  routes: RouteConstant[];
  utilityMethods: UtilityMethod[];
  baseUrl?: string;
  apiKey?: string;
}

/**
 * Parse the routes.ts file and extract all route constants and utility methods
 * 
 * @param filePath - Path to the routes.ts file
 * @returns Parsed routes information
 */
export function parseRoutesFile(filePath: string): ParsedRoutes {
  const absolutePath = path.resolve(filePath);
  
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Routes file not found: ${absolutePath}`);
  }

  const sourceCode = fs.readFileSync(absolutePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  const routes: RouteConstant[] = [];
  const utilityMethods: UtilityMethod[] = [];
  let baseUrl: string | undefined;
  let apiKey: string | undefined;

  function visit(node: ts.Node) {
    // Look for the ApiRoutes class
    if (ts.isClassDeclaration(node) && node.name?.text === 'ApiRoutes') {
      // Process all members of the class
      node.members.forEach(member => {
        // Extract static readonly properties (route constants)
        if (ts.isPropertyDeclaration(member)) {
          const routeConstant = extractRouteConstant(member, sourceCode);
          if (routeConstant) {
            routes.push(routeConstant);
            
            // Check for special constants
            if (routeConstant.name === 'BASE_URL') {
              baseUrl = routeConstant.value;
            } else if (routeConstant.name === 'API_KEY') {
              apiKey = routeConstant.value;
            }
          }
        }
        
        // Extract static methods (utility methods)
        if (ts.isMethodDeclaration(member)) {
          const utilityMethod = extractUtilityMethod(member, sourceCode);
          if (utilityMethod) {
            utilityMethods.push(utilityMethod);
          }
        }
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return {
    routes,
    utilityMethods,
    baseUrl,
    apiKey,
  };
}

/**
 * Extract route constant information from a property declaration
 */
function extractRouteConstant(
  member: ts.PropertyDeclaration,
  sourceCode: string
): RouteConstant | null {
  // Check if it's a static readonly property
  const isStatic = member.modifiers?.some(
    mod => mod.kind === ts.SyntaxKind.StaticKeyword
  );
  const isReadonly = member.modifiers?.some(
    mod => mod.kind === ts.SyntaxKind.ReadonlyKeyword
  );

  if (!isStatic || !isReadonly) {
    return null;
  }

  const name = member.name.getText();
  
  // Extract the value
  let value = '';
  if (member.initializer) {
    if (ts.isStringLiteral(member.initializer)) {
      value = member.initializer.text;
    } else if (ts.isBinaryExpression(member.initializer)) {
      // Handle cases like: process.env.EXPO_PUBLIC_API_BASE_URL || 'default'
      value = extractDefaultValue(member.initializer);
    } else if (ts.isTemplateExpression(member.initializer)) {
      // Handle template literals
      value = member.initializer.getText().slice(1, -1); // Remove backticks
    }
  }

  // Extract JSDoc comment
  const comment = extractJSDocComment(member, sourceCode);
  
  // Check if deprecated
  const deprecated = isDeprecated(member, sourceCode);

  return {
    name,
    value,
    deprecated,
    comment,
  };
}

/**
 * Extract utility method information from a method declaration
 */
function extractUtilityMethod(
  member: ts.MethodDeclaration,
  sourceCode: string
): UtilityMethod | null {
  // Check if it's a static method
  const isStatic = member.modifiers?.some(
    mod => mod.kind === ts.SyntaxKind.StaticKeyword
  );

  if (!isStatic) {
    return null;
  }

  const name = member.name.getText();
  
  // Extract parameters
  const parameters = member.parameters.map(param => ({
    name: param.name.getText(),
    type: param.type ? param.type.getText() : 'any',
  }));

  // Extract return type
  const returnType = member.type ? member.type.getText() : 'any';

  // Extract JSDoc comment
  const comment = extractJSDocComment(member, sourceCode);
  
  // Check if deprecated
  const deprecated = isDeprecated(member, sourceCode);

  // Try to identify which route constant this method uses
  const usesRoute = extractUsedRoute(member);

  return {
    name,
    parameters,
    returnType,
    usesRoute,
    deprecated,
    comment,
  };
}

/**
 * Extract the default value from a binary expression (e.g., env || 'default')
 */
function extractDefaultValue(expr: ts.BinaryExpression): string {
  // Look for the right side of the || operator
  if (expr.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
    if (ts.isStringLiteral(expr.right)) {
      return expr.right.text;
    }
  }
  return '';
}

/**
 * Extract JSDoc comment from a node
 */
function extractJSDocComment(node: ts.Node, sourceCode: string): string | undefined {
  const fullText = sourceCode;
  const nodeStart = node.getFullStart();
  const nodeEnd = node.getStart();
  const leadingText = fullText.substring(nodeStart, nodeEnd);

  // Look for JSDoc comment (/** ... */)
  const jsDocMatch = leadingText.match(/\/\*\*\s*([\s\S]*?)\s*\*\//);
  if (jsDocMatch) {
    // Clean up the comment text
    return jsDocMatch[1]
      .split('\n')
      .map(line => line.trim().replace(/^\*\s?/, ''))
      .join('\n')
      .trim();
  }

  return undefined;
}

/**
 * Check if a node is marked as deprecated
 */
function isDeprecated(node: ts.Node, sourceCode: string): boolean {
  const comment = extractJSDocComment(node, sourceCode);
  if (comment) {
    return comment.toLowerCase().includes('@deprecated');
  }
  return false;
}

/**
 * Extract which route constant a utility method uses
 */
function extractUsedRoute(method: ts.MethodDeclaration): string | undefined {
  let usedRoute: string | undefined;

  function visitMethodBody(node: ts.Node) {
    // If we already found a route, don't continue searching
    if (usedRoute) return;

    // Look for property access like this.PUBLIC_AMODIATAIRE_DETAILS_V2
    if (ts.isPropertyAccessExpression(node)) {
      // Check if the expression is 'this' or 'ApiRoutes'
      const expr = node.expression;
      if (
        expr.kind === ts.SyntaxKind.ThisKeyword ||
        (ts.isIdentifier(expr) && expr.text === 'ApiRoutes')
      ) {
        const propertyName = node.name.text;
        // Check if it looks like a route constant (all uppercase with underscores and numbers)
        if (/^[A-Z_0-9]+$/.test(propertyName)) {
          usedRoute = propertyName;
          return; // Found the route, stop searching
        }
      }
    }

    // Continue searching in child nodes
    ts.forEachChild(node, visitMethodBody);
  }

  if (method.body) {
    visitMethodBody(method.body);
  }

  return usedRoute;
}

/**
 * Find a route constant by name
 */
export function findRouteByName(
  routes: RouteConstant[],
  name: string
): RouteConstant | undefined {
  return routes.find(route => route.name === name);
}

/**
 * Find all deprecated routes
 */
export function findDeprecatedRoutes(routes: RouteConstant[]): RouteConstant[] {
  return routes.filter(route => route.deprecated);
}

/**
 * Find utility methods that use a specific route
 */
export function findMethodsUsingRoute(
  methods: UtilityMethod[],
  routeName: string
): UtilityMethod[] {
  return methods.filter(method => method.usesRoute === routeName);
}

/**
 * Group routes by category based on their names
 */
export function groupRoutesByCategory(routes: RouteConstant[]): Record<string, RouteConstant[]> {
  const categories: Record<string, RouteConstant[]> = {
    base: [],
    auth: [],
    public: [],
    authenticated: [],
    media: [],
    map: [],
    google: [],
    deprecated: [],
    other: [],
  };

  routes.forEach(route => {
    if (route.name === 'BASE_URL' || route.name === 'API_KEY' || route.name === 'GOOGLE_MAPS_API_KEY') {
      categories.base.push(route);
    } else if (route.name.includes('LOGIN') || route.name.includes('LOGOUT') || route.name.includes('REFRESH')) {
      categories.auth.push(route);
    } else if (route.name.startsWith('PUBLIC_')) {
      categories.public.push(route);
    } else if (route.name.includes('MEDIA') || route.name.includes('UPLOAD') || route.name.includes('DELETE_MEDIA')) {
      categories.media.push(route);
    } else if (route.name.includes('MAP')) {
      categories.map.push(route);
    } else if (route.name.includes('GOOGLE')) {
      categories.google.push(route);
    } else if (route.deprecated) {
      categories.deprecated.push(route);
    } else if (
      route.name === 'PROFILE' ||
      route.name === 'MEDIA' ||
      route.name === 'MEDIA_DELETE' ||
      route.name === 'MEDIA_SUBMIT_VALIDATION' ||
      route.name === 'ANNOUNCEMENTS'
    ) {
      categories.authenticated.push(route);
    } else {
      categories.other.push(route);
    }
  });

  return categories;
}
