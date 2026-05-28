/**
 * Integration test for Parser + Normalizer
 * Feature: api-routes-complete-analysis
 * 
 * Tests that the parser output can be successfully normalized
 */

import { parseApiDocumentation } from '../../src/parsers/documentation-parser';
import { normalizeRoute, normalizeJsonStructure } from '../../src/normalizers/data-normalizer';

describe('Parser + Normalizer Integration', () => {
  it('should parse and normalize a simple route', () => {
    const markdown = `
### 1. Get Users

**Endpoint:** \`GET /users\`

**Description:** Retrieve all users

**Réponse:**

\`\`\`json
{
  "success": true,
  "users": [
    {
      "user_id": "123",
      "user_name": "John Doe",
      "email_address": "john@example.com"
    }
  ]
}
\`\`\`
`;

    const parsed = parseApiDocumentation(markdown);
    
    expect(parsed.publicRoutes).toHaveLength(1);
    
    const route = parsed.publicRoutes[0];
    const normalized = normalizeRoute(route);
    
    // Check normalized endpoint (parser adds /api/mobile/public prefix)
    expect(normalized.endpoint).toBe('/api/mobile/public/users');
    
    // Check normalized response structure
    expect(normalized.responseBody.type).toBe('object');
    expect(normalized.responseBody.properties).toBeDefined();
    
    // Check that property names are normalized to camelCase
    const props = normalized.responseBody.properties!;
    expect(props.success).toBeDefined();
    expect(props.users).toBeDefined();
    
    // Check nested array structure
    const usersArray = props.users.nested;
    expect(usersArray?.type).toBe('array');
    expect(usersArray?.items?.type).toBe('object');
    
    // Check nested object properties are normalized
    const userProps = usersArray?.items?.properties;
    expect(userProps?.userId).toBeDefined();
    expect(userProps?.userName).toBeDefined();
    expect(userProps?.emailAddress).toBeDefined();
  });

  it('should normalize route with path parameters', () => {
    const markdown = `
### 1. Get User Details

**Endpoint:** \`GET /users/{userId}\`

**Description:** Get details for a specific user

**Réponse:**

\`\`\`json
{
  "success": true,
  "user": {
    "id": "123",
    "name": "John"
  }
}
\`\`\`
`;

    const parsed = parseApiDocumentation(markdown);
    const route = parsed.publicRoutes[0];
    const normalized = normalizeRoute(route);
    
    // Check that {userId} is normalized to :userId
    expect(normalized.endpoint).toBe('/api/mobile/public/users/:userId');
  });

  it('should normalize route with query parameters', () => {
    const markdown = `
### 1. Search Users

**Endpoint:** \`GET /users\`

**Description:** Search for users

**Query Parameters:**
- \`search_term\` (optionnel): Search query
- \`page_size\` (optionnel): Number of results per page

**Réponse:**

\`\`\`json
{
  "success": true,
  "results": []
}
\`\`\`
`;

    const parsed = parseApiDocumentation(markdown);
    const route = parsed.publicRoutes[0];
    const normalized = normalizeRoute(route);
    
    // Check that query parameter names are normalized
    expect(normalized.queryParams).toHaveLength(2);
    expect(normalized.queryParams?.[0].name).toBe('searchTerm');
    expect(normalized.queryParams?.[1].name).toBe('pageSize');
  });

  it('should handle complex nested structures', () => {
    const markdown = `
### 1. Get Complex Data

**Endpoint:** \`GET /data\`

**Description:** Get complex nested data

**Réponse:**

\`\`\`json
{
  "success": true,
  "data": {
    "user_profile": {
      "first_name": "John",
      "last_name": "Doe",
      "contact_info": {
        "email_address": "john@example.com",
        "phone_number": "123-456-7890"
      }
    }
  }
}
\`\`\`
`;

    const parsed = parseApiDocumentation(markdown);
    const route = parsed.publicRoutes[0];
    const normalized = normalizeRoute(route);
    
    // Navigate through nested structure
    const props = normalized.responseBody.properties!;
    expect(props.success).toBeDefined();
    expect(props.data).toBeDefined();
    
    const dataProps = props.data.nested?.properties;
    expect(dataProps?.userProfile).toBeDefined();
    
    const profileProps = dataProps?.userProfile.nested?.properties;
    expect(profileProps?.firstName).toBeDefined();
    expect(profileProps?.lastName).toBeDefined();
    expect(profileProps?.contactInfo).toBeDefined();
    
    const contactProps = profileProps?.contactInfo.nested?.properties;
    expect(contactProps?.emailAddress).toBeDefined();
    expect(contactProps?.phoneNumber).toBeDefined();
  });

  it('should normalize array responses', () => {
    const markdown = `
### 1. Get Items

**Endpoint:** \`GET /items\`

**Description:** Get list of items

**Réponse:**

\`\`\`json
[
  {
    "item_id": "1",
    "item_name": "Item 1",
    "item_price": 10.99
  }
]
\`\`\`
`;

    const parsed = parseApiDocumentation(markdown);
    const route = parsed.publicRoutes[0];
    const normalized = normalizeRoute(route);
    
    // Check array structure
    expect(normalized.responseBody.type).toBe('array');
    expect(normalized.responseBody.items).toBeDefined();
    
    // Check array item properties are normalized
    const itemProps = normalized.responseBody.items?.properties;
    expect(itemProps?.itemId).toBeDefined();
    expect(itemProps?.itemName).toBeDefined();
    expect(itemProps?.itemPrice).toBeDefined();
  });
});
