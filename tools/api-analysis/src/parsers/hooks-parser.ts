/**
 * TypeScript AST Parser for useApi.ts
 * Feature: api-routes-complete-analysis
 * 
 * Parses React Query hook definitions from src/hooks/useApi.ts
 * Extracts hook names, types (query/mutation), query keys, route constants,
 * cache invalidation calls, and parameters
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import { HookDefinition, ParamInfo } from '../../types/core';

/**
 * Parse React Query hooks from useApi.ts file
 * 
 * @param filePath - Path to the useApi.ts file
 * @returns Array of hook definitions
 */
export function parseApiHooks(filePath: string): HookDefinition[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true
  );
  
  const hooks: HookDefinition[] = [];
  
  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.name) {
      const hookDef = extractHookDefinition(node, sourceFile);
      if (hookDef) {
        hooks.push(hookDef);
      }
    }
    
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  
  return hooks;
}

/**
 * Extract hook definition from a function declaration
 */
function extractHookDefinition(
  node: ts.FunctionDeclaration,
  sourceFile: ts.SourceFile
): HookDefinition | null {
  const name = node.name?.text;
  if (!name || !name.startsWith('use')) {
    return null;
  }
  
  const parameters = extractParameters(node);
  const returnType = extractReturnType(node, sourceFile);
  const bodyAnalysis = analyzeFunctionBody(node, sourceFile);
  
  if (!bodyAnalysis) {
    return null;
  }
  
  return {
    name,
    type: bodyAnalysis.type,
    endpoint: bodyAnalysis.endpoint,
    queryKey: bodyAnalysis.queryKey,
    parameters,
    invalidatesCache: bodyAnalysis.invalidatesCache,
    returnType,
  };
}

/**
 * Extract parameters from function declaration
 */
function extractParameters(node: ts.FunctionDeclaration): ParamInfo[] {
  const params: ParamInfo[] = [];
  
  for (const param of node.parameters) {
    if (ts.isIdentifier(param.name)) {
      const name = param.name.text;
      const type = param.type ? param.type.getText() : 'any';
      const optional = !!param.questionToken;
      
      params.push({ name, type, optional });
    }
  }
  
  return params;
}

/**
 * Extract return type from function declaration
 */
function extractReturnType(
  node: ts.FunctionDeclaration,
  sourceFile: ts.SourceFile
): string | undefined {
  if (node.type) {
    return node.type.getText(sourceFile);
  }
  return undefined;
}

/**
 * Analyze function body to extract React Query hook details
 */
function analyzeFunctionBody(
  node: ts.FunctionDeclaration,
  sourceFile: ts.SourceFile
): {
  type: 'query' | 'mutation';
  endpoint: string;
  queryKey?: any[];
  invalidatesCache?: string[][];
} | null {
  if (!node.body) {
    return null;
  }
  
  let hookType: 'query' | 'mutation' | null = null;
  let endpoint = '';
  let queryKey: any[] | undefined;
  let invalidatesCache: string[][] = [];
  
  function visitBody(bodyNode: ts.Node) {
    // Detect useQuery calls
    if (ts.isCallExpression(bodyNode)) {
      const expr = bodyNode.expression;
      if (ts.isIdentifier(expr)) {
        if (expr.text === 'useQuery') {
          hookType = 'query';
          const config = bodyNode.arguments[0];
          if (config && ts.isObjectLiteralExpression(config)) {
            const analysis = analyzeQueryConfig(config, sourceFile);
            queryKey = analysis.queryKey;
            endpoint = analysis.endpoint;
          }
        } else if (expr.text === 'useMutation') {
          hookType = 'mutation';
          const config = bodyNode.arguments[0];
          if (config && ts.isObjectLiteralExpression(config)) {
            const analysis = analyzeMutationConfig(config, sourceFile);
            endpoint = analysis.endpoint;
            invalidatesCache = analysis.invalidatesCache;
          }
        }
      }
    }
    
    ts.forEachChild(bodyNode, visitBody);
  }
  
  visitBody(node.body);
  
  if (!hookType) {
    return null;
  }
  
  return {
    type: hookType,
    endpoint,
    queryKey,
    invalidatesCache: invalidatesCache.length > 0 ? invalidatesCache : undefined,
  };
}

/**
 * Analyze useQuery configuration object
 */
function analyzeQueryConfig(
  config: ts.ObjectLiteralExpression,
  sourceFile: ts.SourceFile
): { queryKey?: any[]; endpoint: string } {
  let queryKey: any[] | undefined;
  let endpoint = '';
  
  for (const prop of config.properties) {
    if (ts.isPropertyAssignment(prop)) {
      const propName = prop.name.getText(sourceFile);
      
      if (propName === 'queryKey') {
        queryKey = extractQueryKey(prop.initializer, sourceFile);
      } else if (propName === 'queryFn') {
        endpoint = extractEndpointFromQueryFn(prop.initializer, sourceFile);
      }
    }
  }
  
  return { queryKey, endpoint };
}

/**
 * Analyze useMutation configuration object
 */
function analyzeMutationConfig(
  config: ts.ObjectLiteralExpression,
  sourceFile: ts.SourceFile
): { endpoint: string; invalidatesCache: string[][] } {
  let endpoint = '';
  let invalidatesCache: string[][] = [];
  
  for (const prop of config.properties) {
    if (ts.isPropertyAssignment(prop)) {
      const propName = prop.name.getText(sourceFile);
      
      if (propName === 'mutationFn') {
        endpoint = extractEndpointFromMutationFn(prop.initializer, sourceFile);
      } else if (propName === 'onSuccess') {
        invalidatesCache = extractCacheInvalidations(prop.initializer, sourceFile);
      }
    }
  }
  
  return { endpoint, invalidatesCache };
}

/**
 * Extract query key from array expression
 */
function extractQueryKey(node: ts.Expression, sourceFile: ts.SourceFile): any[] {
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map(elem => {
      if (ts.isStringLiteral(elem)) {
        return elem.text;
      } else if (ts.isIdentifier(elem)) {
        return elem.text;
      } else {
        return elem.getText(sourceFile);
      }
    });
  }
  return [];
}

/**
 * Extract endpoint from queryFn arrow function
 */
function extractEndpointFromQueryFn(node: ts.Expression, sourceFile: ts.SourceFile): string {
  let endpoint = '';
  
  function visitQueryFn(qfNode: ts.Node) {
    // Look for get<Type>(ApiRoutes.XXX) or get<Type>(ApiRoutes.getXxxUrl(...))
    if (ts.isCallExpression(qfNode)) {
      const expr = qfNode.expression;
      
      // Check if it's a get/post/put/delete call
      if (ts.isIdentifier(expr) && ['get', 'post', 'put', 'deleteRequest'].includes(expr.text)) {
        const firstArg = qfNode.arguments[0];
        if (firstArg) {
          endpoint = extractRouteConstant(firstArg, sourceFile);
        }
      }
    }
    
    ts.forEachChild(qfNode, visitQueryFn);
  }
  
  visitQueryFn(node);
  
  return endpoint;
}

/**
 * Extract endpoint from mutationFn arrow function
 */
function extractEndpointFromMutationFn(node: ts.Expression, sourceFile: ts.SourceFile): string {
  let endpoint = '';
  
  function visitMutationFn(mfNode: ts.Node) {
    if (ts.isCallExpression(mfNode)) {
      const expr = mfNode.expression;
      
      if (ts.isIdentifier(expr) && ['get', 'post', 'put', 'deleteRequest'].includes(expr.text)) {
        const firstArg = mfNode.arguments[0];
        if (firstArg) {
          endpoint = extractRouteConstant(firstArg, sourceFile);
        }
      }
    }
    
    ts.forEachChild(mfNode, visitMutationFn);
  }
  
  visitMutationFn(node);
  
  return endpoint;
}

/**
 * Extract route constant from expression
 * Handles: ApiRoutes.XXX, ApiRoutes.getXxxUrl(...), ApiRoutes.getFullUrl(ApiRoutes.XXX, ...)
 */
function extractRouteConstant(node: ts.Expression, sourceFile: ts.SourceFile): string {
  if (ts.isPropertyAccessExpression(node)) {
    // ApiRoutes.XXX
    const obj = node.expression;
    const prop = node.name;
    
    if (ts.isIdentifier(obj) && obj.text === 'ApiRoutes') {
      return prop.text;
    }
  } else if (ts.isCallExpression(node)) {
    // ApiRoutes.getXxxUrl(...) or ApiRoutes.getFullUrl(ApiRoutes.XXX, ...)
    const expr = node.expression;
    
    if (ts.isPropertyAccessExpression(expr)) {
      const obj = expr.expression;
      const method = expr.name;
      
      if (ts.isIdentifier(obj) && obj.text === 'ApiRoutes') {
        // Check if it's getFullUrl with ApiRoutes.XXX as first argument
        if (method.text === 'getFullUrl' && node.arguments.length > 0) {
          const firstArg = node.arguments[0];
          if (ts.isPropertyAccessExpression(firstArg)) {
            const argObj = firstArg.expression;
            const argProp = firstArg.name;
            if (ts.isIdentifier(argObj) && argObj.text === 'ApiRoutes') {
              return argProp.text;
            }
          }
        } else {
          // It's a utility method like getAmodiataireDetailsUrl
          return method.text;
        }
      }
    }
  }
  
  return node.getText(sourceFile);
}

/**
 * Extract cache invalidation calls from onSuccess callback
 */
function extractCacheInvalidations(node: ts.Expression, sourceFile: ts.SourceFile): string[][] {
  const invalidations: string[][] = [];
  
  function visitOnSuccess(osNode: ts.Node) {
    // Look for queryClient.invalidateQueries({ queryKey: [...] })
    if (ts.isCallExpression(osNode)) {
      const expr = osNode.expression;
      
      if (ts.isPropertyAccessExpression(expr)) {
        const obj = expr.expression;
        const method = expr.name;
        
        if (ts.isIdentifier(obj) && obj.text === 'queryClient' && method.text === 'invalidateQueries') {
          // Extract the queryKey from the argument
          const arg = osNode.arguments[0];
          if (arg && ts.isObjectLiteralExpression(arg)) {
            for (const prop of arg.properties) {
              if (ts.isPropertyAssignment(prop)) {
                const propName = prop.name.getText(sourceFile);
                if (propName === 'queryKey') {
                  const key = extractQueryKey(prop.initializer, sourceFile);
                  invalidations.push(key);
                }
              }
            }
          }
        }
      }
    }
    
    ts.forEachChild(osNode, visitOnSuccess);
  }
  
  visitOnSuccess(node);
  
  return invalidations;
}
