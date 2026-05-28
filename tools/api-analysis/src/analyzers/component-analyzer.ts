/**
 * Component Usage Analyzer
 * Feature: api-routes-complete-analysis
 * 
 * Analyzes React components to identify:
 * - Usage of deprecated hooks
 * - Obsolete property accesses
 * - Components that need migration to new API structures
 * 
 * Requirements: 9.1-9.5
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

/**
 * Component usage issue
 */
export interface ComponentIssue {
  type: 'DEPRECATED_HOOK' | 'OBSOLETE_PROPERTY' | 'MISSING_INTERFACE';
  component: string;
  file: string;
  line: number;
  column: number;
  hookName?: string;
  propertyPath?: string;
  suggestion?: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Component analysis result
 */
export interface ComponentAnalysisResult {
  issues: ComponentIssue[];
  statistics: {
    totalComponents: number;
    componentsWithIssues: number;
    deprecatedHooksFound: number;
    obsoletePropertiesFound: number;
  };
}

/**
 * Property access information
 */
interface PropertyAccess {
  path: string;
  line: number;
  column: number;
  context: string;
}

/**
 * Hook usage information
 */
interface HookUsage {
  name: string;
  line: number;
  column: number;
  arguments: string[];
}

// ============================================================================
// Deprecated Hooks Configuration
// ============================================================================

/**
 * List of deprecated hooks and their replacements
 */
const DEPRECATED_HOOKS: Record<string, { replacement: string; reason: string }> = {
  'useAmodiataireDetails': {
    replacement: 'useAmodiataireDetail',
    reason: 'Old hook returns flat structure. New hook returns nested structure with amodiataire.lot, amodiataire.profile, amodiataire.media',
  },
  'useAmodiatairesMinimal': {
    replacement: 'useAmodiataires',
    reason: 'Old hook uses deprecated route. New hook uses PUBLIC_AMODIATAIRES_V2 with pagination support',
  },
};

/**
 * Obsolete property paths that should be migrated
 */
const OBSOLETE_PROPERTIES: Record<string, { newPath: string; reason: string }> = {
  'details.photos': {
    newPath: 'details.media.images',
    reason: 'Photos are now in media.images array with MediaDetail structure',
  },
  'details.videos': {
    newPath: 'details.media.videos',
    reason: 'Videos are now in media.videos array with MediaDetail structure',
  },
  'details.documents': {
    newPath: 'details.media.documents',
    reason: 'Documents are now in media.documents array with MediaDetail structure',
  },
  'details.raisonSociale': {
    newPath: 'details.lot.raisonSociale',
    reason: 'Raison sociale is now in lot object',
  },
  'details.adresse': {
    newPath: 'details.lot.adresse',
    reason: 'Address is now in lot object',
  },
  'details.numeroLot': {
    newPath: 'details.lot.numeroLot',
    reason: 'Lot number is now in lot object',
  },
  'details.description': {
    newPath: 'details.profile.biography',
    reason: 'Description is now biography in profile object',
  },
  'details.telephone': {
    newPath: 'details.profile.phone',
    reason: 'Phone is now in profile object',
  },
  'details.email': {
    newPath: 'details.profile.email',
    reason: 'Email is now in profile object',
  },
};

// ============================================================================
// Component Analyzer
// ============================================================================

/**
 * Analyze a React component file for deprecated hooks and obsolete properties
 * 
 * @param filePath - Path to the component file
 * @returns Component analysis result
 */
export function analyzeComponent(filePath: string): ComponentAnalysisResult {
  const issues: ComponentIssue[] = [];
  
  // Read file content
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  // Create TypeScript source file
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true
  );
  
  // Extract component name from file
  const componentName = path.basename(filePath, path.extname(filePath));
  
  // Find hook usages
  const hookUsages = findHookUsages(sourceFile);
  
  // Check for deprecated hooks
  hookUsages.forEach(hookUsage => {
    if (DEPRECATED_HOOKS[hookUsage.name]) {
      const deprecated = DEPRECATED_HOOKS[hookUsage.name];
      issues.push({
        type: 'DEPRECATED_HOOK',
        component: componentName,
        file: filePath,
        line: hookUsage.line,
        column: hookUsage.column,
        hookName: hookUsage.name,
        suggestion: `Replace ${hookUsage.name} with ${deprecated.replacement}. ${deprecated.reason}`,
        priority: 'HIGH',
      });
    }
  });
  
  // Find property accesses
  const propertyAccesses = findPropertyAccesses(sourceFile);
  
  // Check for obsolete properties
  propertyAccesses.forEach(access => {
    if (OBSOLETE_PROPERTIES[access.path]) {
      const obsolete = OBSOLETE_PROPERTIES[access.path];
      issues.push({
        type: 'OBSOLETE_PROPERTY',
        component: componentName,
        file: filePath,
        line: access.line,
        column: access.column,
        propertyPath: access.path,
        suggestion: `Replace ${access.path} with ${obsolete.newPath}. ${obsolete.reason}`,
        priority: 'MEDIUM',
      });
    }
  });
  
  // Calculate statistics
  const statistics = {
    totalComponents: 1,
    componentsWithIssues: issues.length > 0 ? 1 : 0,
    deprecatedHooksFound: issues.filter(i => i.type === 'DEPRECATED_HOOK').length,
    obsoletePropertiesFound: issues.filter(i => i.type === 'OBSOLETE_PROPERTY').length,
  };
  
  return {
    issues,
    statistics,
  };
}

/**
 * Analyze multiple component files
 * 
 * @param filePaths - Array of component file paths
 * @returns Combined analysis result
 */
export function analyzeComponents(filePaths: string[]): ComponentAnalysisResult {
  const allIssues: ComponentIssue[] = [];
  let totalComponents = 0;
  let componentsWithIssues = 0;
  let deprecatedHooksFound = 0;
  let obsoletePropertiesFound = 0;
  
  filePaths.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      console.warn(`Component file not found: ${filePath}`);
      return;
    }
    
    try {
      const result = analyzeComponent(filePath);
      allIssues.push(...result.issues);
      totalComponents += result.statistics.totalComponents;
      componentsWithIssues += result.statistics.componentsWithIssues;
      deprecatedHooksFound += result.statistics.deprecatedHooksFound;
      obsoletePropertiesFound += result.statistics.obsoletePropertiesFound;
    } catch (error) {
      console.error(`Error analyzing component ${filePath}:`, error);
    }
  });
  
  return {
    issues: allIssues,
    statistics: {
      totalComponents,
      componentsWithIssues,
      deprecatedHooksFound,
      obsoletePropertiesFound,
    },
  };
}

// ============================================================================
// AST Traversal Helpers
// ============================================================================

/**
 * Find all hook usages in a source file
 */
function findHookUsages(sourceFile: ts.SourceFile): HookUsage[] {
  const hookUsages: HookUsage[] = [];
  
  function visit(node: ts.Node) {
    // Look for call expressions (function calls)
    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      
      // Check if it's an identifier (simple function call)
      if (ts.isIdentifier(expression)) {
        const hookName = expression.text;
        
        // Check if it starts with 'use' (React hook convention)
        if (hookName.startsWith('use')) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          
          // Extract arguments
          const args = node.arguments.map(arg => arg.getText(sourceFile));
          
          hookUsages.push({
            name: hookName,
            line: line + 1, // Convert to 1-indexed
            column: character + 1,
            arguments: args,
          });
        }
      }
    }
    
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  return hookUsages;
}

/**
 * Find all property accesses in a source file
 */
function findPropertyAccesses(sourceFile: ts.SourceFile): PropertyAccess[] {
  const propertyAccesses: PropertyAccess[] = [];
  
  function visit(node: ts.Node) {
    // Look for property access expressions (e.g., details.photos)
    if (ts.isPropertyAccessExpression(node)) {
      const path = getPropertyPath(node);
      
      if (path) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const context = getNodeContext(node, sourceFile);
        
        propertyAccesses.push({
          path,
          line: line + 1, // Convert to 1-indexed
          column: character + 1,
          context,
        });
      }
    }
    
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  return propertyAccesses;
}

/**
 * Get the full property path from a property access expression
 * e.g., details.media.photos -> "details.media.photos"
 */
function getPropertyPath(node: ts.PropertyAccessExpression): string | null {
  const parts: string[] = [];
  
  function traverse(n: ts.Node): boolean {
    if (ts.isPropertyAccessExpression(n)) {
      // Recursively get the left side
      if (!traverse(n.expression)) {
        return false;
      }
      // Add the property name
      parts.push(n.name.text);
      return true;
    } else if (ts.isIdentifier(n)) {
      // Base identifier
      parts.push(n.text);
      return true;
    }
    return false;
  }
  
  if (traverse(node)) {
    return parts.join('.');
  }
  
  return null;
}

/**
 * Get context around a node (for better error messages)
 */
function getNodeContext(node: ts.Node, sourceFile: ts.SourceFile): string {
  const start = Math.max(0, node.getStart() - 20);
  const end = Math.min(sourceFile.getEnd(), node.getEnd() + 20);
  return sourceFile.text.substring(start, end).trim();
}

// ============================================================================
// Exports
// ============================================================================

export {
  DEPRECATED_HOOKS,
  OBSOLETE_PROPERTIES,
};
