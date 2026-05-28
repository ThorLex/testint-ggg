/**
 * Unit tests for documentation parser
 * Feature: api-routes-complete-analysis
 */

import { parseApiDocumentation } from '../../src/parsers/documentation-parser';
import { ParsedDocumentation, RouteDefinition } from '../../types/core';

describe('Documentation Parser', () => {
  const sampleMarkdown = `
# API Mobile Publique - NAVIPAD

## Base URL
\`\`\`
https://navipad-superbase.vercel.app
\`\`\`

### 1. Liste de tous les amodiataires

**Endpoint:** \`GET /api/mobile/public/amodiataires\`

**Description:** Récupère la liste complète des amodiataires avec leurs informations de base.

**Query Parameters:**
- \`limit\` (optionnel): Nombre maximum de résultats
- \`offset\` (optionnel): Décalage pour la pagination (défaut: 0)
- \`search\` (optionnel): Recherche par raison sociale

**Réponse:**
\`\`\`json
{
  "success": true,
  "count": 15,
  "amodiataires": [
    {
      "id": "uuid",
      "raisonSociale": "Entreprise XYZ",
      "numeroLot": "LOT-001"
    }
  ]
}
\`\`\`

### 2. Détail d'un amodiataire

**Endpoint:** \`GET /api/mobile/public/amodiataires/:id\`

**Description:** Récupère les détails d'un amodiataire.

**Paramètres:**
- \`id\` (requis): ID de l'amodiataire

**Réponse:**
\`\`\`json
{
  "success": true,
  "amodiataire": {
    "id": "uuid",
    "userId": "uuid",
    "lot": {
      "numeroLot": "LOT-001",
      "raisonSociale": "Entreprise XYZ"
    }
  }
}
\`\`\`

### 3. Recherche par localisation

**Endpoint:** \`GET /api/mobile/public/amodiataires/nearby\`

**Description:** Trouve les amodiataires à proximité.

**Query Parameters:**
- \`lat\` (requis): Latitude de la position
- \`lng\` (requis): Longitude de la position
- \`radius\` (optionnel): Rayon de recherche en mètres (défaut: 5000)

**Réponse:**
\`\`\`json
{
  "success": true,
  "count": 8,
  "userLocation": {
    "lat": 3.8480,
    "lng": 11.5021
  },
  "amodiataires": []
}
\`\`\`

## Codes d'erreur

### 400 Bad Request
\`\`\`json
{
  "success": false,
  "error": "Bad request"
}
\`\`\`

### 404 Not Found
\`\`\`json
{
  "success": false,
  "error": "Not found"
}
\`\`\`
`;

  let parsed: ParsedDocumentation;

  beforeAll(() => {
    parsed = parseApiDocumentation(sampleMarkdown);
  });

  describe('Route Extraction', () => {
    it('should extract all public routes', () => {
      expect(parsed.publicRoutes).toBeDefined();
      expect(parsed.publicRoutes.length).toBeGreaterThan(0);
    });

    it('should parse route endpoints correctly', () => {
      const listRoute = parsed.publicRoutes.find(
        r => r.endpoint === '/api/mobile/public/amodiataires'
      );
      expect(listRoute).toBeDefined();
      expect(listRoute?.method).toBe('GET');
    });

    it('should parse route with path parameter', () => {
      const detailRoute = parsed.publicRoutes.find(
        r => r.endpoint === '/api/mobile/public/amodiataires/:id'
      );
      expect(detailRoute).toBeDefined();
      expect(detailRoute?.method).toBe('GET');
      expect(detailRoute?.pathParams).toBeDefined();
      expect(detailRoute?.pathParams?.length).toBeGreaterThan(0);
    });

    it('should parse route descriptions', () => {
      const listRoute = parsed.publicRoutes.find(
        r => r.endpoint === '/api/mobile/public/amodiataires'
      );
      expect(listRoute?.description).toBeTruthy();
    });

    it('should identify public routes correctly', () => {
      parsed.publicRoutes.forEach(route => {
        expect(route.isPublic).toBe(true);
      });
    });
  });

  describe('Query Parameters Extraction', () => {
    it('should extract query parameters', () => {
      const listRoute = parsed.publicRoutes.find(
        r => r.endpoint === '/api/mobile/public/amodiataires'
      );
      expect(listRoute?.queryParams).toBeDefined();
      expect(listRoute?.queryParams?.length).toBeGreaterThan(0);
    });

    it('should parse optional query parameters', () => {
      const listRoute = parsed.publicRoutes.find(
        r => r.endpoint === '/api/mobile/public/amodiataires'
      );
      const limitParam = listRoute?.queryParams?.find(p => p.name === 'limit');
      expect(limitParam).toBeDefined();
      expect(limitParam?.required).toBe(false);
    });

    it('should parse required query parameters', () => {
      const nearbyRoute = parsed.publicRoutes.find(
        r => r.endpoint === '/api/mobile/public/amodiataires/nearby'
      );
      const latParam = nearbyRoute?.queryParams?.find(p => p.name === 'lat');
      expect(latParam).toBeDefined();
      expect(latParam?.required).toBe(true);
    });

    it('should extract default values from parameters', () => {
      const listRoute = parsed.publicRoutes.find(
        r => r.endpoint === '/api/mobile/public/amodiataires'
      );
      const offsetParam = listRoute?.queryParams?.find(p => p.name === 'offset');
      expect(offsetParam?.defaultValue).toBe(0);
    });

    it('should infer parameter types correctly', () => {
      const nearbyRoute = parsed.publicRoutes.find(
        r => r.endpoint === '/api/mobile/public/amodiataires/nearby'
      );
      const radiusParam = nearbyRoute?.queryParams?.find(p => p.name === 'radius');
      expect(radiusParam?.type).toBe('number');
    });
  });

  describe('Path Parameters Extraction', () => {
    it('should extract path parameters', () => {
      const detailRoute = parsed.publicRoutes.find(
        r => r.endpoint === '/api/mobile/public/amodiataires/:id'
      );
      expect(detailRoute?.pathParams).toBeDefined();
      expect(detailRoute?.pathParams?.length).toBeGreaterThan(0);
    });

    it('should parse required path parameters', () => {
      const detailRoute = parsed.publicRoutes.find(
        r => r.endpoint === '/api/mobile/public/amodiataires/:id'
      );
      const idParam = detailRoute?.pathParams?.find(p => p.name === 'id');
      expect(idParam).toBeDefined();
      expect(idParam?.required).toBe(true);
    });
  });

  describe('JSON Response Structure Extraction', () => {
    it('should extract response structures', () => {
      const listRoute = parsed.publicRoutes.find(
        r => r.endpoint === '/api/mobile/public/amodiataires'
      );
      expect(listRoute?.responseBody).toBeDefined();
      expect(listRoute?.responseBody.type).toBe('object');
    });

    it('should parse response properties', () => {
      const listRoute = parsed.publicRoutes.find(
        r => r.endpoint === '/api/mobile/public/amodiataires'
      );
      expect(listRoute?.responseBody.properties).toBeDefined();
      expect(listRoute?.responseBody.properties?.success).toBeDefined();
      expect(listRoute?.responseBody.properties?.count).toBeDefined();
      expect(listRoute?.responseBody.properties?.amodiataires).toBeDefined();
    });

    it('should parse nested structures', () => {
      const detailRoute = parsed.publicRoutes.find(
        r => r.endpoint === '/api/mobile/public/amodiataires/:id'
      );
      expect(detailRoute?.responseBody.properties?.amodiataire).toBeDefined();
      expect(detailRoute?.responseBody.properties?.amodiataire.nested).toBeDefined();
    });

    it('should parse array types', () => {
      const listRoute = parsed.publicRoutes.find(
        r => r.endpoint === '/api/mobile/public/amodiataires'
      );
      const amodiatairesType = listRoute?.responseBody.properties?.amodiataires.type;
      expect(amodiatairesType).toContain('[]');
    });

    it('should store response structures in the map', () => {
      expect(parsed.responseStructures).toBeDefined();
      expect(Object.keys(parsed.responseStructures).length).toBeGreaterThan(0);
    });
  });

  describe('Error Codes Extraction', () => {
    it('should extract error codes', () => {
      expect(parsed.errorCodes).toBeDefined();
      expect(parsed.errorCodes.length).toBeGreaterThan(0);
    });

    it('should parse 400 error code', () => {
      const error400 = parsed.errorCodes.find(e => e.code === 400);
      expect(error400).toBeDefined();
      expect(error400?.message).toContain('Bad Request');
    });

    it('should parse 404 error code', () => {
      const error404 = parsed.errorCodes.find(e => e.code === 404);
      expect(error404).toBeDefined();
      expect(error404?.message).toContain('Not Found');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty markdown', () => {
      const result = parseApiDocumentation('');
      expect(result.publicRoutes).toEqual([]);
      expect(result.authenticatedRoutes).toEqual([]);
      expect(result.errorCodes).toEqual([]);
    });

    it('should handle markdown without routes', () => {
      const markdown = '# Title\n\nSome content';
      const result = parseApiDocumentation(markdown);
      expect(result.publicRoutes).toEqual([]);
    });

    it('should handle invalid JSON in code blocks', () => {
      const markdown = `
### 1. Test Route

**Endpoint:** \`GET /api/mobile/public/test\`

**Réponse:**
\`\`\`json
{ invalid json }
\`\`\`
`;
      const result = parseApiDocumentation(markdown);
      expect(result.publicRoutes.length).toBe(1);
      expect(result.publicRoutes[0].responseBody).toBeUndefined();
    });
  });
});
