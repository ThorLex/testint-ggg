/**
 * Documentation Parser for API_ROUTES_DOCUMENTATION.md
 * Feature: api-routes-complete-analysis
 * 
 * Parses the markdown documentation and extracts:
 * - Public routes with endpoints, methods, parameters
 * - Authenticated routes
 * - JSON response structures
 * - Query parameters and path parameters
 * - Error codes
 */

import {
  ParsedDocumentation,
  RouteDefinition,
  JsonStructure,
  PropertyDefinition,
  ParamDefinition,
  ErrorDefinition,
  ErrorResponse,
} from '../../types/core';

/**
 * Parse the API documentation markdown file
 */
export function parseApiDocumentation(markdown: string): ParsedDocumentation {
  const lines = markdown.split('\n');
  const routes: RouteDefinition[] = [];
  const errorCodes: ErrorDefinition[] = [];
  const responseStructures: Record<string, JsonStructure> = {};

  let currentRoute: Partial<RouteDefinition> | null = null;
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLanguage = '';
  let currentSection = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim(); // Trim to handle Windows line endings

    // Detect code blocks
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLanguage = line.substring(3).trim();
        codeBlockContent = [];
      } else {
        inCodeBlock = false;
        // Process the code block
        if (currentRoute && codeBlockLanguage === 'json') {
          const jsonContent = codeBlockContent.join('\n');
          try {
            const parsed = JSON.parse(jsonContent);
            
            // Determine if this is a request or response
            if (currentSection === 'response' || parsed.success !== undefined) {
              currentRoute.responseBody = parseJsonStructure(parsed);
            } else if (currentSection === 'request') {
              currentRoute.requestBody = parseJsonStructure(parsed);
            }
          } catch (e) {
            // Invalid JSON, skip
          }
        }
        codeBlockContent = [];
        codeBlockLanguage = '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Detect route sections (### 1. Route Name)
    const routeHeaderMatch = line.match(/^###\s*\d+\.\s+(.+)$/);
    if (routeHeaderMatch) {
      // Save previous route
      if (currentRoute && currentRoute.endpoint && currentRoute.method) {
        routes.push(currentRoute as RouteDefinition);
      }

      // Start new route
      currentRoute = {
        description: routeHeaderMatch[1].trim(),
        isPublic: true, // Default to public, will be updated if authenticated
        queryParams: [],
        pathParams: [],
        errorResponses: [],
      };
      currentSection = '';
      continue;
    }

    // Detect endpoint definition
    const endpointMatch = line.match(/\*\*Endpoint:\*\*\s+`(\w+)\s+(.+)`/);
    if (endpointMatch && currentRoute) {
      currentRoute.method = endpointMatch[1] as 'GET' | 'POST' | 'PUT' | 'DELETE';
      let endpoint = endpointMatch[2].trim();
      
      // Normalize endpoint - if it doesn't start with /api, prepend the appropriate prefix
      if (!endpoint.startsWith('/api')) {
        // Determine if this should be public or authenticated based on the endpoint
        const isAuthenticatedRoute = endpoint.includes('/profile') || 
                                    endpoint.includes('/media') || 
                                    endpoint.includes('/announcements');
        
        if (endpoint.startsWith('/')) {
          endpoint = isAuthenticatedRoute ? '/api/mobile' + endpoint : '/api/mobile/public' + endpoint;
        } else {
          endpoint = isAuthenticatedRoute ? '/api/mobile/' + endpoint : '/api/mobile/public/' + endpoint;
        }
      }
      
      currentRoute.endpoint = endpoint;
      
      // Determine if route is public or authenticated
      currentRoute.isPublic = currentRoute.endpoint.includes('/public/');
      continue;
    }

    // Also try to match endpoint without backticks (edge case)
    const endpointMatch2 = line.match(/\*\*Endpoint:\*\*\s+(\w+)\s+(.+)/);
    if (endpointMatch2 && currentRoute && !currentRoute.endpoint) {
      currentRoute.method = endpointMatch2[1] as 'GET' | 'POST' | 'PUT' | 'DELETE';
      let endpoint = endpointMatch2[2].trim();
      
      // Normalize endpoint - if it doesn't start with /api, prepend /api/mobile/public
      if (!endpoint.startsWith('/api')) {
        endpoint = '/api/mobile/public' + endpoint;
      }
      
      currentRoute.endpoint = endpoint;
      
      // Determine if route is public or authenticated
      currentRoute.isPublic = currentRoute.endpoint.includes('/public/');
      continue;
    }

    // Detect description
    const descriptionMatch = line.match(/\*\*Description:\*\*\s+(.+)/);
    if (descriptionMatch && currentRoute) {
      currentRoute.description = descriptionMatch[1].trim();
      continue;
    }

    // Detect query parameters section
    if (line.includes('**Query Parameters:**')) {
      currentSection = 'query-params';
      continue;
    }

    // Detect path parameters section
    if (line.includes('**Paramètres:**')) {
      currentSection = 'path-params';
      continue;
    }

    // Detect response section
    if (line.includes('**Réponse:**')) {
      currentSection = 'response';
      continue;
    }

    // Parse query parameters
    if (currentSection === 'query-params' && line.startsWith('- `')) {
      const param = parseParameter(line);
      if (param && currentRoute) {
        currentRoute.queryParams = currentRoute.queryParams || [];
        currentRoute.queryParams.push(param);
      }
      continue;
    }

    // Parse path parameters
    if (currentSection === 'path-params' && line.startsWith('- `')) {
      const param = parseParameter(line);
      if (param && currentRoute) {
        currentRoute.pathParams = currentRoute.pathParams || [];
        currentRoute.pathParams.push(param);
      }
      continue;
    }

    // Detect error codes section
    if (line.startsWith('## Codes d\'erreur') || line.startsWith('## Error Codes')) {
      currentSection = 'error-codes';
      // Save last route
      if (currentRoute && currentRoute.endpoint && currentRoute.method) {
        routes.push(currentRoute as RouteDefinition);
        currentRoute = null;
      }
      continue;
    }

    // Parse error codes
    if (currentSection === 'error-codes' && line.startsWith('### ')) {
      const errorMatch = line.match(/###\s+(\d+)\s+(.+)/);
      if (errorMatch) {
        errorCodes.push({
          code: parseInt(errorMatch[1]),
          message: errorMatch[2].trim(),
          description: errorMatch[2].trim(),
        });
      }
    }
  }

  // Save last route if exists
  if (currentRoute && currentRoute.endpoint && currentRoute.method) {
    routes.push(currentRoute as RouteDefinition);
  }

  // Separate public and authenticated routes
  const publicRoutes = routes.filter(r => r.isPublic);
  const authenticatedRoutes = routes.filter(r => !r.isPublic);

  // Extract response structures
  routes.forEach(route => {
    if (route.responseBody) {
      const structureName = getResponseStructureName(route);
      responseStructures[structureName] = route.responseBody;
    }
  });

  return {
    publicRoutes,
    authenticatedRoutes,
    responseStructures,
    errorCodes,
  };
}

/**
 * Parse a parameter line from markdown
 * Example: - `lat` (requis): Latitude de la position
 */
function parseParameter(line: string): ParamDefinition | null {
  const match = line.match(/^-\s+`([^`]+)`\s+\(([^)]+)\):\s*(.+)$/);
  if (!match) return null;

  const name = match[1].trim();
  const requiredText = match[2].toLowerCase();
  const description = match[3].trim();

  // Determine if required
  const required = requiredText.includes('requis') || requiredText.includes('required');

  // Extract default value if present (do this first to help infer type)
  let defaultValue: any = undefined;
  const defaultMatch = description.match(/défaut:\s*([^,)]+)/i);
  if (defaultMatch) {
    const defaultStr = defaultMatch[1].trim();
    // Try to parse as number
    const numValue = Number(defaultStr);
    if (!isNaN(numValue)) {
      defaultValue = numValue;
    } else if (defaultStr === 'true' || defaultStr === 'false') {
      defaultValue = defaultStr === 'true';
    } else {
      defaultValue = defaultStr;
    }
  }

  // Infer type from description, default value, or default to string
  let type: 'string' | 'number' | 'boolean' = 'string';
  
  // Check default value type first
  if (typeof defaultValue === 'number') {
    type = 'number';
  } else if (typeof defaultValue === 'boolean') {
    type = 'boolean';
  }
  // Then check description
  else if (description.toLowerCase().includes('nombre') || 
           description.toLowerCase().includes('number') ||
           description.toLowerCase().includes('rayon') ||
           description.toLowerCase().includes('radius') ||
           description.toLowerCase().includes('mètres') ||
           description.toLowerCase().includes('meters')) {
    type = 'number';
  } else if (description.toLowerCase().includes('boolean')) {
    type = 'boolean';
  }

  return {
    name,
    type,
    required,
    description,
    defaultValue,
  };
}

/**
 * Parse a JSON structure into our internal format
 */
function parseJsonStructure(json: any): JsonStructure {
  if (Array.isArray(json)) {
    return {
      type: 'array',
      items: json.length > 0 ? parseJsonStructure(json[0]) : { type: 'object' },
    };
  }

  if (typeof json === 'object' && json !== null) {
    const properties: Record<string, PropertyDefinition> = {};

    for (const [key, value] of Object.entries(json)) {
      properties[key] = {
        type: inferType(value),
        optional: false, // We'll mark as optional based on documentation context
        nested: typeof value === 'object' && value !== null ? parseJsonStructure(value) : undefined,
      };
    }

    return {
      type: 'object',
      properties,
    };
  }

  return {
    type: inferType(json) as any,
  };
}

/**
 * Infer the TypeScript type from a JSON value
 */
function inferType(value: any): string {
  if (Array.isArray(value)) {
    if (value.length > 0) {
      const itemType = inferType(value[0]);
      return `${itemType}[]`;
    }
    return 'any[]';
  }

  if (value === null) {
    return 'any';
  }

  const type = typeof value;
  
  if (type === 'object') {
    // Check if it looks like a specific type
    if ('lat' in value && 'lng' in value) {
      return 'Coordinates';
    }
    if ('id' in value && 'url' in value) {
      return 'MediaDetail';
    }
    return 'object';
  }

  return type;
}

/**
 * Generate a response structure name from a route
 */
function getResponseStructureName(route: RouteDefinition): string {
  const parts = route.endpoint.split('/').filter(p => p && !p.startsWith(':'));
  const lastPart = parts[parts.length - 1];
  
  // Convert to PascalCase
  const name = lastPart
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  if (route.method === 'GET') {
    if (route.endpoint.includes('/:id') && !route.endpoint.endsWith('/:id')) {
      return `${name}ListResponse`;
    }
    return `${name}Response`;
  }

  return `${name}${route.method.charAt(0) + route.method.slice(1).toLowerCase()}Response`;
}
